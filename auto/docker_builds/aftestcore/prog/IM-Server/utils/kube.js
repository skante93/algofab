
var fs = require('fs'), util = require('util');
var child_process = require('child_process'), 
	spawn = child_process.spawn, 
		spawnSync = child_process.spawnSync, 
			exec = child_process.exec;
var mkdirp = require('mkdirp');
var async = require('./async');



class Watcher {

	constructor (type, name, ns){
		if(arguments.length == 1){

			var spec = JSON.parse(fs.readFileSync(type, "utf8"));

			type = spec.kind;
			name = spec.metadata.name;
			ns = spec.metadata.namespace;

			
		}

		console.log("GOT params from file : ");
		console.log("\t type : "+type);
		console.log("\t name : "+name);
		console.log("\t ns : "+ns);

		if(typeof ns === 'undefined')
			ns = "default";
		
		this.type = type;
		this.name = name;
		this.ns = ns;
		
		var events = require('events');
		this.eventEmitter = new events.EventEmitter();

		// Stops this watcher after 10 seconds
		this.expirationTimer = setTimeout(function(){ ref.stop(); }, 10*1000);
		
		var ref = this;
		this.interv = setInterval(function(){
			var cmd = spawnSync('kubectl', ['get', type, name, '-o', 'json', '-n', ns]);
			var out = cmd.stdout.toString(), err = cmd.stderr.toString();
			if(err){
				ref.eventEmitter.emit('stop', err.toString());
				ref.eventEmitter.emit('err', err.toString());
				if(err.toString().startsWith('Error from server (NotFound):')){
					ref.eventEmitter.emit('not found', type, name);
				}
				clearInterval(ref.interv);
				return;
			}
			var old = ref.status, out_json = JSON.parse(out);
			
			if(type == "Pod"){
				var containerStatuses = out_json.status.containerStatuses;
				for (var i=0; i<containerStatuses.length; i++){
					//console.log('containerStatuses['+i+'] : '+require('util').inspect(containerStatuses[i])+'  waiting : '+
					//	Boolean(containerStatuses[i].state.waiting)+", terminated : "+Boolean(containerStatuses[i].state.terminated));

					if(containerStatuses[i].state.waiting ){
						ref.status = containerStatuses[i].state.waiting.reason;
						ref.status = "WAITING => " +((containerStatuses[i].name)? containerStatuses[i].name+' : '+ref.status : ref.status);
						ref.message = containerStatuses[i].state.waiting.message;
						//console.log('""""""""" ref.status : '+ref.status);
						if (old != ref.status)
							ref.eventEmitter.emit('change', ref.status, ref.message);
						return;
					}
					else if(containerStatuses[i].state.terminated){
						ref.status = containerStatuses[i].state.terminated.reason;
						ref.status = "TERMINATED => " +((containerStatuses[i].name)? containerStatuses[i].name+' : '+ref.status : ref.status);
						ref.message = containerStatuses[i].state.terminated.message;
						if (old != ref.status)
							ref.eventEmitter.emit('change', ref.status, ref.message);
						return;
					}
				}
				ref.status = "running";
				if (old != ref.status)
					ref.eventEmitter.emit('change', ref.status);
			}
			else if (type == "ReplicationController"){
				ref.status = (out_json.status.readyReplicas || "0" )+"/"+out_json.status.replicas;
				if (old != ref.status)
					ref.eventEmitter.emit('change', ref.status);
			}
			else if (type == "Service"){
				ref.status = "Configured"
				if (old != ref.status)
					ref.eventEmitter.emit('change', ref.status);
			}

					
		}, 4000);
	}

	noEpirationTimer(){
		clearTimeout(this.expirationTimer);
	}
	
	setExpirationTimer(millis){
		var ref = this;
		clearTimeout(this.expirationTimer);
		this.expirationTimer = setTimeout(function(){ ref.stop(); }, millis);
	}
	on(str, action){
		this.eventEmitter.on(str, action);
	};

	getType(){ return this.type;};
	get Type(){ return this.type;};
	
	getName(){ return this.name;};
	get Name(){ return this.name;};
	
	getNs(){ return this.ns;};
	get Ns(){ return this.ns;};
	
	getStatus(){ return this.status};
	get Status(){ return this.status};
	
	stop(){
		clearInterval(this.interv);
		this.eventEmitter.emit('stop', this.status);
	};
}


var rm = function(path){
	if(fs.existsSync(path)){
		var rmr = spawn('rm', ['-r', path]);
		var err ='';
		rmr.stderr.on('data', function(data){err += data;});
		rmr.on('close', function(exitCode){
			if(err)
				console.log('Cleaning error : '+err);
			else
				console.log('cleaned : '+path);
		});
	}
	else
		console.log('Directory or file '+path+" doesn't exist.");
}

function Timeout(fn, interval) {
    var id = setTimeout(fn, interval);
    this.cleared = false;
    this.clear = function () {
        this.cleared = true;
        clearTimeout(id);
    };
}

var specDirectory = function(authorname, algoname, algoversion){
	return __dirname+'/../yaml/'+authorname+'/'+
		algoname.toLowerCase().replace(/\.|\ |\-/g, '_')+(algoversion.replace(/\./g, '-'));

}

var specPath = function(authorname, algoname, algoversion, kind, name){
	//
	var directory = specDirectory(authorname, algoname, algoversion);
	try{
		mkdirp.sync(directory);
		return directory+'/'+kind+'_'+name+'.json';
	}catch (e){
		return new Error(e);
	}
}

var createKubeObjectsValidation = function(error, args, io, cb){
	if(error){
		return cb(error);
	}

	var watcher = new Watcher(args[0]);
	watcher.noEpirationTimer();
	
	var t = watcher.getType(), n = watcher.getName();
	console.log("########## Yo : "+t+' <=> '+n);
	var rcTimeout = null;
	watcher.on('change', function(state){
		
		if(t=="Pod"){

			var blockedAtWaiting = state.startsWith("WAITING => ") && !state.endsWith("ContainerCreating");
			var terminated = state.startsWith("TERMINATED => ");

			if(blockedAtWaiting || terminated){
				watcher.stop();
				if(io)
					io.socket.emit('create version progress', io.socket_id, t+" "+n+" ----- Error : "+state);
				cb(state);
			}

			if(state == "running") {
				if(io)
					io.socket.emit('create version progress', io.socket_id, t+" "+n+" ----- OK");
				cb(null);
				watcher.stop();
			
			}
		}
		else if(t=="ReplicationController"){
			if(rcTimeout != null && rcTimeout instanceof Timeout && !rcTimeout.cleared){
				rcTimeout.clear();
			}

			if(state.split('/')[0] == state.split('/')[1]){
				if(io)
					io.socket.emit('create version progress', io.socket_id, t+" "+n+" ----- OK");
				cb(null);
				watcher.stop();
				return;
			}

			rcTimeout = new Timeout(function(){
				rcTimeout.clear();
				watcher.stop();
				if(io)
					io.socket.emit('create version progress', io.socket_id, t+" "+n+" ----- Error : "+state);
				cb(state);
			}, 60*1000);
		}
		else {
			if(io)
				io.socket.emit('create version progress', io.socket_id, t+" "+n+" ----- OK");
			cb(null);
			watcher.stop();
		}
	});
}

var removeKubeObjectsValidation = function(error, args, io, cb){
	if (error){
		var no_path = /error: the path .* does not exist/.test(error.toString());
		var not_found = error.toString().startsWith("Error: Error from server (NotFound): ");
		console.log("### "+error+", no_path : "+no_path+", not_found : "+not_found+" ###");
		//console.log("args : "+util.inspect(args));
		

		//console.log("kandn : "+util.inspect(kandn));
		if(no_path){
			console.log("No path, Admins might have to take care of this one.");
			//var kandn = getKindAndNameFromFilePath(args[0].filePath);
			//var cmd = spawnSync('kubectl', []);
			return cb("Path to manifest not found, please notify admins");
		}
		else if( !not_found ) {
			return cb(error);
		}
		else {
			console.log("Object didn't exist in the first place");
		}	
	}
	cb();
}

module.exports = function(SG){
	//
	var AlgosMeta = SG.mongo.model('AlgosMeta');
	var Algos = SG.mongo.model('Algos');

	var _create = function(filePath, cb){
		//
		var cmd = spawnSync('kubectl', ['create', '-f', filePath]), out = cmd.stdout.toString(), err = cmd.stderr.toString();
		if(err != "" ){
			//
			if(typeof cb != 'undefined')
				cb(new Error(err));
			return new Error(err);
		}
		if(typeof cb != 'undefined')
			cb();
	}

	var _delete = function(parameters, cb){
		var cmdArgs = ('filePath' in parameters)?['delete', '-f', parameters.filePath] :
						('kind' in parameters && 'name' in parameters && 'ns' in parameters)? 
							['delete', parameters.kind, parameters.name, '-n',  parameters.ns] : null;
		console.log("########### HERE COME THE DELETE");
		if(cmdArgs == null){
			if(typeof cb != 'undefined')
				cb( new Error("Bad paremeters for function \"delete\"") );
			return new Error("Bad paremeters for function \"delete\"");
		}
		
		console.log("Kube delete cmdArgs : "+cmdArgs.join(' '));
		var cmd = spawnSync('kubectl', cmdArgs), out = cmd.stdout.toString(), err = cmd.stderr.toString();
		
		if(err != "" ){
			//
			if('filePath' in parameters && 'kind' in parameters && 'name' in parameters && 'ns' in parameters){
				cmd = spawnSync('kubectl', ['delete', parameters.kind, parameters.name, '-n',  parameters.ns]), out = cmd.stdout.toString(), err = cmd.stderr.toString();
				if( err != "" || err.startsWith("Error from server (NotFound): ") ){
					console.log("The object didn't exist in the first place");
					if(typeof cb != 'undefined')
						return cb();
					return;
				}

			}

			if(typeof cb != 'undefined')
				cb(new Error(err));
			return new Error(err);
		}
		if(typeof cb != 'undefined')
			cb();
	}

	var _objectExists = function(parameters, cb) {
		//
		var cmdArgs = ('kind' in parameters && 'name' in parameters && 'ns' in parameters)? 
						['get', parameters.kind, parameters.name, '-n',  parameters.ns] :
							('filePath' in parameters)?['get', '-f', parameters.filePath] : null;
		
		if(cmdArgs == null){
			if(typeof cb != 'undefined')
				cb( new Error("Bad paremeters for function \"objectExists\"") );
			return new Error("Bad paremeters for function \"objectExists\"");
		}
		
		console.log("Kube delete cmdArgs : "+cmdArgs.join(' '));
		var cmd = spawnSync('kubectl', cmdArgs), out = cmd.stdout.toString(), err = cmd.stderr.toString();
		
		if(err != "" ){
			//
			if(typeof cb != 'undefined')
				cb(new Error(err));
			return new Error(err);
		}
		if(typeof cb != 'undefined')
			cb(null, JSON.parse(out));
	}
	
	var _moveObjectFromNsToNewNs = function(old_params, new_ns, cb){
		//
		var selectCmd = ('kind' in old_params && 'name' in old_params && 'ns' in old_params)? 
					old_params.kind+" "+old_params.name+' -n '+old_params.ns :
						('filePath' in old_params)? '-f'+old_params.filePath : null;
		
		if(selectCmd == null){
			//if(typeof cb != 'undefined')
			cb( new Error("Bad paremeters for function \"moveObjectFromNsToNewNs\"") );
			//return new Error("Bad paremeters for function \"moveObjectFromNsToNewNs\"");
		}
		
		selectCmd = "kubectl get "+selectCmd+" -o json";
		/*
		var exists = objectExists({name : name, kind : kind, ns : new_ns});
		if( !(exists instanceof Error) ){
			return cb("Object is already likely present in "+new_ns);
		}
		*/

		exec(selectCmd+" | jq '.metadata.namespace = \""+new_ns+"\"' | kubectl create -f -", (error, stdout, stderr)=>{
			
			//console.log("----error.toString() : "+stderr.toString());
			if(error && !stderr.toString().startsWith('Error from server (AlreadyExists):')){
				if(error.toString().endsWith('Error from server (NotFound): error when creating "STDIN": namespaces "'+new_ns+'" not found\n')){
					var cmd = spawnSync('kubectl', ['create', 'ns', new_ns]), ns_out = cmd.stdout.toString(), ns_err = cmd.stderr.toString();
					if(ns_err){
						console.log("could not create ns err : "+ns_err);
						return cb("Server error while manipulating kubernetes namespace");
					}
					// NS created
					exec(selectCmd+" | jq '.metadata.namespace = \""+new_ns+"\"' | kubectl create -f -",(error2, stdout2, stderr2)=>{
						if(error2){
							console.log("Could not stille cpoy object after ns creation");
							cb(error2);
						}
						else{
							console.log("Object successfully copied from to new ns");
							cb()	
						}
					});
					console.log("### COOL NS created");
					return;
				}
				else{
					console.log("Don't what error happened err : "+error);
					return cb("Server error while manipulating kubernetes namespace");
				}
			}
			cb();
		});
	}

	var _svc = function(name, ns){
		//
		if(typeof ns === 'undefined')
			ns = 'default';
		
		this.name = name;

		var cmd = spawnSync('kubectl', ['get', 'svc', name, '-o json', '-n', ns], {shell : true});
		
		if((cmd.stderr.toString() !='')){
			console.log(cmd.stderr.toString());
			return null;
		}
		
		this.details = cmd.stdout.toString();

		this.url = function(){
			//
			//var cmd = spawnSync('minikube', ['service', this.name, '--url'], {shell : true});
			//if(cmd.stderr.toString() !='')
			//	return null;
			//return cmd.stdout.toString();

			
			
			var cmd = spawnSync('kubectl', ['get', 'service', name, '-o', 'json', '-n', ns]);
			if(cmd.stderr.toString() != ''){
				console.log("Error 1 : "+cmd.stderr.toString());
				return null;
			}

			var serv_json = JSON.parse(cmd.stdout.toString().replace('\n$', '')), 
				lo = serv_json.spec.selector, port = serv_json.spec.ports[0].nodePort;

			
			var labels = "";
			for (var l in lo)
				labels+=l+'='+lo[l]+',';
			labels = labels.substring(0, labels.length-1);

			var matching_pods = spawnSync('kubectl', ['get', 'pod', '-l='+labels, '-o', 'json', '-n', ns]);
			
			if(matching_pods.stderr.toString() != ''){
				console.log("Error 2 : "+matching_pods.stderr.toString());
				return null;
			}
			
			var pods = JSON.parse(matching_pods.stdout.toString()).items;
			var hostIPs = {};

			for (var i = pods.length - 1; i >= 0; i--) {
				var pod = pods[i], healthy = true;
				for (var j = pod.status.containerStatuses.length - 1; j >= 0; j--) {
					if(!pod.status.containerStatuses[j].state.running){
						healthy = false;
						break;
					}
				}
				if(healthy){
					var hostIP = pod.status.hostIP;
					if(!hostIPs[hostIP]){
						hostIPs[hostIP] = 1;
					}
					else
						hostIPs[hostIP]++;
				}
			}
			var ip = Object.keys(hostIPs).reduce(function(a, b){ return hostIPs[a] > hostIPs[b] ? a : b });
			console.log("IP : "+ip+", PORT : "+port);
			console.log("hostIPs : "+util.inspect(hostIPs));
			if(!ip){
				return null;
			}
			return ip+':'+port;
		}
		return this;
	}

	var removeInfra = function(id, cb){

		console.log("KUBE REMOVE");
		
		Algos.findById(id).populate({
			path : 'meta',
			populate : {
				path : "author"
			}
		}).exec(function(err, algo){
			console.log("Kuberemove2 : Algo : "+util.inspect(algo));
			if(err){ 
				console.log("kubeRemove : DB err : "+err);
				cb(new Error("DB error"));
				return;
			}
		
			if(!algo) { 
				cb(new Error("There is no Algo with id : "+id));
				return;
			}

			//if( algo.infra_ready == true){
			//	cb(new Error('The infra is already "ready".'));
			//	return;
			//}
			
			var kube = [];
			for (var i=0; i < algo.deployment.kubernetes.length; i++){
				var path = specPath(algo.meta.author.username, 
										algo.meta.title, 
											algo.version, 
												algo.deployment.kubernetes[i].kind, 
													algo.deployment.kubernetes[i].metadata.name);
				kube.push([{filePath : path, kind :algo.deployment.kubernetes[i].kind, name : algo.deployment.kubernetes[i].metadata.name, ns : algo.meta.author.username}]);
			}

			var tab = [];
			for (var i=0; i < kube.length; i++)	tab.push(_delete);
			
			new async(tab, kube).start(removeKubeObjectsValidation, function(err2){
				if (err2){
					var no_path = /error: the path .* does not exist/.test(err2.toString());
					var not_found = err2.toString().startsWith("Error: Error from server (NotFound): ");
					//console.log(error+", no_path : "+no_path+", not_found : "+not_found);
					if(no_path){
						console.log("Admin has to take care of that");
						return cb("Path to manifest not found, please notify admins");
					}
					else if( !not_found ) {
						return cb(err2);
					}
						
				}
				
				console.log("ASYNC CHAINING DONE");
				Algos.update({ _id : id }, { $set : { infra_ready : false } }).exec(function(err){
					if(err){
						return console.log("could not update infra_ready");
					}
					console.log('infra_ready successfully updated');
				});
				cb(null);
				rm(specDirectory(algo.meta.author.username, algo.meta.title, algo.version));
			});
		});
	}

	var createInfra = function(id, io, cb){
		//
		if(typeof io === 'function' && typeof cb === 'undefined'){ cb = io; io = undefined };

		console.log("KUBE BUILD")
		var exec = Algos.findById(id).populate({
			path : 'meta',
			populate : {
				path : 'author'
			}
		}).exec();
		exec.catch(err => { //function(err, result){
			cb(new Error("DB error"));
			return;
		})
		.then(algo => {
			
			if(!algo) { 
				cb(new Error("There is no Algo with id : "+id));
				return;
			}

			if( algo.infra_ready == true){
				cb(new Error('The infra is already "ready".'));
				return;
			}

			_moveObjectFromNsToNewNs({ name : 'skante-registry-secret', kind : 'secret', ns : 'default'}, algo.meta.author.username, function(err){
				if(err){
					//console.log("------------------------ Watch ---------------------------------");
					return cb(err);
				}
				_moveObjectFromNsToNewNs({ name : 'admin-private-secret', kind : 'secret', ns : 'default'}, algo.meta.author.username, function(err){
				
					if(err){
						return cb(err);
					}
				
					var kube = [], pod_names = [];
					for (var i=0; i < algo.deployment.kubernetes.length; i++){
						
						var kubeObject = algo.deployment.kubernetes[i];
						
						var path = specPath(algo.meta.author.username, 
											algo.meta.title, 
												algo.version, 
													kubeObject.kind, 
														kubeObject.metadata.name);
						
						console.log("Path : "+path);

						fs.writeFileSync(path, JSON.stringify(kubeObject));
						kube.push([path]);
						console.log("Path : "+path+", file created");
						
						
					}
					
					console.log("Now building the "+kube.length+" objects");
					
					var tab = [];
					for (var i=0; i < kube.length; i++){
						tab.push(_create)
					}
					 
					console.log("Now building");
					new async(tab, kube, io).start(createKubeObjectsValidation, function(err2, uptoIndex){
						if(err2){
							
							console.log("--------- uptoIndex : "+uptoIndex+" ----------");
							if(err2.toString().startsWith("Error from server (AlreadyExists): error when creating")){
								if(uptoIndex == 0){
									console.log("Ressource already existed, not deleting it.");
									return cb(err2);
								}

								uptoIndex--;
								/*if(io)
									io.socket.emit('create algo progress', io.socket_id, uptoIndex+" th Kubernetes object already exist, deleting the previous ones");
								*/console.log("Ressource already existed, not deleting it, deleting all the previous ones though.");
							}

							var rmTab = [], kubeRM = [];
							for (var i=0; i <= uptoIndex; i++){
								rmTab.push(_delete);
								kubeRM.push([ { filePath : kube[i][0] }]);
							}

							console.log("rmTab.length : "+rmTab.length+", kubeRM.length : "+kubeRM.length);
							console.log("kubeRM[0] : "+util.inspect(kubeRM[0]));
							//console.log("kubeRM[1] : "+util.inspect(kubeRM[1]));
							new async(rmTab, kubeRM).start(removeKubeObjectsValidation, function(err3){
								if(err3){

									return console.log("Admin has to get involved, could not delete Kubernetes objects");
								}
								//rm(specDirectory(algo.meta.author.username, algo.meta.title, algo.version));
								console.log("Kube Build failed, so previously created objects are removed");
							});
							

							return cb(err2);
						}
						console.log("ASYNC CHAINING DONE");
						
						cb(null);
					});
				});
			});
		});	
	}

	var replaceKubeObject = function(id, username, spec, cb){
		
		Algos.findById(id).populate({
			path : 'meta',
			populate : {
				path : 'author'
			}
		}).exec(function(err, algo){
			
			if(err){
				cb(new Error("DB error"));
				return;
			}

			if(!algo) { 
				cb(new Error("There is no Algo with id : "+id));
				return;
			}
			
			if(algo.meta.author.username != username) { 
				cb(new Error("Only the author can do this operation : "+id));
				return;
			}
			/*
			if( algo.infra_ready == true){
				cb(new Error('The infra is already "ready".'));
				return;
			}
			*/

			if(!(spec.apiVersion && spec.kind && spec.metadata && spec.metadata.name && spec.spec)){
				return cb(new Error(`New spec is missing required field(s). Are "apiVersion", "kind", "metadata.name" and "spec" specified?`));
			}
			var found = -1;
			for (var i=0; i < algo.deployment.kubernetes.length; i++){
				var kubeObject = algo.deployment.kubernetes[i];

				if(spec.kind == kubeObject.kind && spec.metadata.name == kubeObject.metadata.name){
					found = i;
					break;
				}
			}
			
			if(found == -1){
				return cb(new Error("No Kubernetes object previously recorded matches the new spec"));
			}
			
			var rmKube = spawnSync("kubectl", ['delete', spec.kind, spec.metadata.name, '-n', username]);
			var failed = rmKube.stderr.toString();
			if(failed != '' && !failed.startsWith('Error from server (NotFound): ')){
				//If there is an unexpected error other than "Not Found" (because if not found, we just create it!). 
				return cb(new Error(failed));
			}

			var path = specPath(algo.meta.author.username, 
										algo.meta.title, 
											algo.version, 
												algo.deployment.kubernetes[found].kind, 
													algo.deployment.kubernetes[found].metadata.name);
			
			spec.metadata.namespace = username;

			fs.writeFileSync(path, JSON.stringify(spec));

			var createKube = spawnSync("kubectl", ['create', '-f', path]);
			failed = createKube.stderr.toString();
			if(failed != ''){
				return cb(new Error(failed));
			}
			cb();
		});
	}

	
	return {
		create : _create,
		//createPodSpec : _createPodSpec,
		//rc : _rc,
		svc : _svc,
		delete : _delete,
		//pod : _pod,
		mvFromNsToNs : _moveObjectFromNsToNewNs,
		createInfra : createInfra,
		removeInfra : removeInfra,
		replaceKubeObject : replaceKubeObject,
		watcher : Watcher,
		createKubeObjectsValidation : createKubeObjectsValidation,
		removeKubeObjectsValidation : removeKubeObjectsValidation
	};
}

/*
var _create = function(file, ns, cb){
	if(typeof ns === 'undefined')
		ns = 'default';
	
	console.log("KUBE CREATE path : "+file+", ns : "+ns);
	
	var cmdArgs = ['create', '-f', file, "-n", ns];
	var cmd = spawn('kubectl', cmdArgs), out = '', err = '';

	cmd.stdout.on('data', function(data){
		out += data.toString();
		//console.log(data.toString());
	});

	cmd.stderr.on('data', function(data){
		err += data.toString();
		//console.log('Err : '+data.toString());
	});
	cmd.on('close', function(code){
		//
		if(err){
			cb(err);
		}
		else {
			cb(null, out)
		}
	});
}

var _delete = function(file, ns, cb){
	if (typeof cb === 'undefined' && typeof ns === 'function'){
		cb = ns;
		ns = undefined;
	}
	if(typeof ns === 'undefined')
		ns = 'default';
	
	
	var cmdArgs = (file instanceof Array)? ['delete', file[0], file[1], "-n", file[2]] : ['delete', '-f', file, "-n", ns];
	console.log("Kube delete cmdArgs : "+cmdArgs.join(' '));
	var cmd = spawn('kubectl', cmdArgs), out = '', err = '';

	cmd.stdout.on('data', function(data){
		out += data.toString();
		//console.log(data.toString());
	});

	cmd.stderr.on('data', function(data){
		err += data.toString();
		//console.log('Err : '+data.toString());
	});
	cmd.on('close', function(code){
		//
		if(err){
			cb(err);
		}
		else {
			cb(null, out)
		}
	});
}

var objectExists = function(name, kind, ns) {
	//
	if(typeof cb === 'undefined' && typeof ns === 'function'){
		cb = ns;
		ns = 'default';
	}
	var cmd = spawnSync("kubectl", ['get', kind, name, '-o', 'json', '-n', ns]), out = cmd.stdout.toString(), err=cmd.stderr.toString();
	if(err != ""){
		return new Error(err);
	}
	if(out == ""){
		return new Error("null");
	}
	try{
		var json = JSON.parse(out);
		return json;
	}
	catch(e){
		return new Error("error while getting "+kind+" "+name+".");
	}
}

var moveObjectFromNsToNewNs = function(name, kind, old_ns, new_ns, cb){
	//
	var exists = objectExists(name, kind, new_ns);
	if( !(exists instanceof Error) ){
		return cb("Object already likely present in "+new_ns);
	}

	exec("kubectl get "+kind+" "+name+" -o json -n "+old_ns+" | jq '.metadata.namespace = \""+new_ns+"\"' | kubectl create -f -", (error, stdout, stderr)=>{
		if(error){
			return cb(error);
		}
		cb();
	});
}
*/

var _createPodSpec = function(infos, pullName, cb){
	
	var specifications = {
		apiVersion : "v1",
		kind : "Pod",
		metadata : {
			name : infos.username+'-'+infos.name.toLowerCase().replace(/\.|\ |\-/g, '_')+(infos.version.replace(/\./g, '')),
			labels : {
				app : infos.name.toLowerCase(),
				version : infos.version,
				by : infos.username
			}
		},

		spec : {
			containers : [{
				name : infos.name.toLowerCase(),
				image : pullName,
				ports : [{
					name : "http",
					protocol : "TCP",
					containerPort : infos.port
				}]
			}]
		}
	};

	var location = __dirname+'/yaml/'+infos.username+'/'+infos.name+(infos.version.replace(/\./g, ''));
	mkdirp(location, function(err){
		if(!err) {
			//
			var filename = path.posix.basename(location)+'.json';

			try{
				//console.log('location : '+location);
				//console.log('filename : '+filename);
				fs.writeFileSync( location+'/'+filename, JSON.stringify(specifications) );
				cb(null, specifications);
			}catch(e){
				//
				console.log(e);
				cb(new Error('System error 1 '));
			}
		}
		else {
			//
			cb(new Error('System error 2 '));
		}
	});
}

var _rc = function(name, ns){
	//
	if(typeof ns === 'undefined')
		ns = 'default';
	
	
	this.name = name;

	var cmd = spawnSync('kubectl', ['get', 'svc', name, '-o json', '-n', ns], {shell : true});
	
	if((cmd.stderr.toString() !='')){
		console.log(cmd.stderr.toString());
		return null;
	}

	this.details = cmd.stdout.toString();

	this.scale = function(nb) {
		//
		var cmd = spawnSync('kubectl', ['scale', 'rc', this.name, '--replicas='+nb, "-n", ns], {shell : true});
		
		if(cmd.stderr.toString() !='')
			return null;
		return cmd.stdout.toString();
	}
	
	return this;
}
/*
var _svc = function(name, ns){
	//
	if(typeof ns === 'undefined')
		ns = 'default';
	
	this.name = name;

	var cmd = spawnSync('kubectl', ['get', 'svc', name, '-o json', '-n', ns], {shell : true});
	
	if((cmd.stderr.toString() !='')){
		console.log(cmd.stderr.toString());
		return null;
	}
	
	this.details = cmd.stdout.toString();

	this.url = function(){
		//
		//var cmd = spawnSync('minikube', ['service', this.name, '--url'], {shell : true});
		//if(cmd.stderr.toString() !='')
		//	return null;
		//return cmd.stdout.toString();

		
		
		var cmd = spawnSync('kubectl', ['get', 'service', name, '-o', 'json', '-n', ns]);
		if(cmd.stderr.toString() != ''){
			console.log("Error 1 : "+cmd.stderr.toString());
			return null;
		}

		var serv_json = JSON.parse(cmd.stdout.toString().replace('\n$', '')), 
			lo = serv_json.spec.selector, port = serv_json.spec.ports[0].nodePort;

		
			var labels = "";
			for (var l in lo)
				labels+=l+'='+lo[l]+',';
			labels = labels.substring(0, labels.length-1);

			var matching_pods = spawnSync('kubectl', ['get', 'pod', '-l='+labels, '-o', 'json', '-n', ns]);
			
			if(matching_pods.stderr.toString() != ''){
				console.log("Error 2 : "+matching_pods.stderr.toString());
				return null;
			}
			
			var pods = JSON.parse(matching_pods.stdout.toString()).items;
			var hostIPs = {};

			for (var i = pods.length - 1; i >= 0; i--) {
				var pod = pods[i], healthy = true;
				for (var j = pod.status.containerStatuses.length - 1; j >= 0; j--) {
					if(!pod.status.containerStatuses[j].state.running){
						healthy = false;
						break;
					}
				}
				if(healthy){
					var hostIP = pod.status.hostIP;
					if(!hostIPs[hostIP]){
						hostIPs[hostIP] = 1;
					}
					else
						hostIPs[hostIP]++;
				}
			}
			var ip = Object.keys(hostIPs).reduce(function(a, b){ return hostIPs[a] > hostIPs[b] ? a : b });
			console.log("IP : "+ip+", PORT : "+port);
			console.log("hostIPs : "+util.inspect(hostIPs));
			if(!ip){
				return null;
			}
			return ip+':'+port;
		//*
			if(pods.stderr.toString() != ''){
				console.log("Error 2 : "+pods.stderr.toString());
				return null;
			}

			pods = JSON.parse(pods.stdout.toString()).items;
			var a_pod_name = pods[0].metadata.name;

			var out = spawnSync('kubectl', ['describe', 'pod', a_pod_name, '-n', ns]);
			if(out.stderr.toString() != ''){
				console.log("Error 3 : "+out.stderr.toString());
				return null;
			}
			out = spawnSync('grep', ['Node'], { input : out.stdout });
			if(out.stderr.toString() != ''){
				console.log("Error 4 : "+out.stderr.toString());
				return null;
			}
			out = spawnSync('grep', ['Node'], { input : out.stdout });
			if(out.stderr.toString() != ''){
				console.log("Error 5 : "+out.stderr.toString());
				return null;
			}
			out = spawnSync('cut', ['-f', '2-', '-d', ':'], { input : out.stdout });
			if(out.stderr.toString() != ''){
				console.log("Error 6 : "+out.stderr.toString());
				return null;
			}
			out = spawnSync('tr', ['-d', '"\t"'], { input : out.stdout });
			if(out.stderr.toString() != ''){
				console.log("Error 7 : "+out.stderr.toString());
				return null;
			}
			out = out.stdout.toString().split('\n')[0].split('/')[1];

			if ( /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(out)){
				console.log(out+' is an ip address')
				return out+':'+port
			}
			else{
				console.log(out+' is not an ip address')
				return new Error ("could not get ip");
			}
		* //
		//*
			var nodes = JSON.parse(spawnSync('kubectl', ['get', 'nodes', '-o', 'json', '-n', ns]).stdout.toString());
			var nodeIP = undefined;
			//console.log('nodes : '+util.inspect(nodes)+' we have '+nodes.items.length+' items');
			for(var i=0; i < nodes.items.length; i++){
				if(nodes.items[i].metadata.selfLink == "/api/v1/nodes/im1"){
					continue;
				}
				var conditions = nodes.items[i].status.conditions, lastCondition = conditions[conditions.length-1];
				//console.log("i : "+i+", conditions : "+util.inspect(conditions)+", lastCondition : "+util.inspect(lastCondition));
				console.log("i : "+i+", lastCondition.status : "+lastCondition.status);
				if (lastCondition.status == 'True'){
					nodeIP = nodes.items[i].status.addresses[0].address;
					break;
				}
				console.log('\n');
			}

			console.log("nodeIP : "+nodeIP);
			if(nodeIP){
				return nodeIP+':'+port
			}
		* //
	}
	return this;
}

var _pod = function(name, ns) {
	//
	if(typeof ns === 'undefined')
		ns = 'default';
	
	this.name = name;

	var cmd = spawnSync('kubectl', ['get', 'pod', name, '-o json', '-n', ns], {shell : true});
	if((cmd.stderr.toString() !='')){
		console.log(cmd.stderr.toString());
		return null;
	}

	this.details = cmd.stdout.toString();

	this.expose = function(){
		//
		var cmdArgs = ['expose', 'pod', name];
		
		console.log('kubectl '+cmdArgs.join(' '));
		var cmd = spawnSync('kubectl', cmdArgs), out = '', err = '';

		if(cmd.stderr.toString() !='')
			return null;
		return _svc(cmd.stdout.toString(), ns);
	}
	return this;
}

var kubeRemove = function(id, cb){

	console.log("KUBE REMOVE");
	
	Algos.findById(id).populate({
		path : 'meta',
		populate : {
			path : "author"
		}
	}).exec(function(err, algo){
		console.log("Kuberemove2 : Algo : "+util.inspect(algo));
		if(err){ 
			console.log("kubeRemove : DB err : "+err);
			cb(new Error("DB error"));
			return;
		}
	
		if(!algo) { 
			cb(new Error("There is no Algo with id : "+id));
			return;
		}

		//if( algo.infra_ready == true){
		//	cb(new Error('The infra is already "ready".'));
		//	return;
		//}
		
		var kube = [], n = algo.meta.title.toLowerCase().replace(/\.|\ |\-/g, '_')+(algo.version.replace(/\./g, '-')), 
		dir = __dirname+'/yaml/'+algo.meta.author.username+'/'+n;
		for (var i=0; i < algo.deployment.kubernetes.length; i++){
			
			var kubeObject = algo.deployment.kubernetes[i];
			var path = dir+'/'+kubeObject.kind+'_'+kubeObject.metadata.name+'.json';
			kube.push([path, algo.meta.author.username]);
		}

		var tab = [];
		for (var i=0; i < kube.length; i++)	tab.push(SG.kube.delete);
		
		new async(tab, kube).start(removeKubeObjectsValidation, function(err2){
			if (err2){
				var no_path = /error: the path .* does not exist/.test(err2.toString());
				if( !(err2.toString().startsWith("Error from server (NotFound): ") || no_path) ){
					return cb(err2);
				}
				
				console.log("Object didn't exist in the first place");	
			}

			console.log("ASYNC CHAINING DONE");
			Algos.update({ _id : id }, { $set : { infra_ready : false } }).exec(function(err){
				if(err){
					return console.log("could not update infra_ready");
				}
				console.log('infra_ready successfully updated');
			});
			cb(null);
			rm(dir);
		});
	});
};

var kubeBuild = function(id, cb){
	//
	console.log("KUBE BUILD")
	var exec = Algos.findById(id).populate({
		path : 'meta',
		populate : {
			path : 'author'
		}
	}).exec();
	exec.catch(err => { //function(err, result){
		cb(new Error("DB error"));
		return;
	})
	.then(algo => {
		
		if(!algo) { 
			cb(new Error("There is no Algo with id : "+id));
			return;
		}

		if( algo.infra_ready == true){
			cb(new Error('The infra is already "ready".'));
			return;
		}

		SG.kube.mvFromNsToNs('skante-registry-secret', 'secret', 'default', algo.meta.author.username, function(err){
			if(err && err != 'Object already likely present in '+algo.meta.author.username){
				if(err.toString().endsWith('Error from server (NotFound): error when creating "STDIN": namespaces "'+algo.meta.author.username+'" not found\n')){
					var cmd = spawnSync('kubectl', ['create', 'ns', algo.meta.author.username]), ns_out = cmd.stdout.toString(), ns_err = cmd.stderr.toString();
					if(ns_err){
						console.log("err : "+ns_err);
						return cb("Server error while manipulating kubernetes namespace");
					}
					// NS created
					console.log("### COOL NS created");
				}
				else{
					console.log("err : "+err);
					return cb("Server error while manipulating kubernetes namespace");
				}
			}
			
			var kube = [], pod_names = [], directory = algo.meta.title.toLowerCase().replace(/\.|\ |\-/g, '_')+(algo.version.replace(/\./g, '-'));;
			for (var i=0; i < algo.deployment.kubernetes.length; i++){
				
				var kubeObject = algo.deployment.kubernetes[i];
				
				var path = __dirname+'/yaml/'+algo.meta.author.username+'/'+directory;
				try {
					mkdirp.sync(path);
					path += '/'+kubeObject.kind+'_'+kubeObject.metadata.name+'.json';
					fs.writeFileSync(path, JSON.stringify(kubeObject));
					kube.push([path, algo.meta.author.username]);
					console.log("Path : "+path+", file created");
				}
				catch(e){
					//
					console.log("Exception caught : "+e);
					return cb(new Error("System Error"));
				}
				
			}
			
			console.log("Now building the "+kube.length+" objects");
			
			var tab = [];
			for (var i=0; i < kube.length; i++){
				tab.push(SG.kube.create)
			}
			 
			console.log("Now building");
			new async(tab, kube).start(createKubeObjectsValidation, function(err2, uptoIndex){
				if(err2){
					
					console.log("--------- uptoIndex : "+uptoIndex+" ----------");
					if(err2.toString().startsWith("Error from server (AlreadyExists): error when creating")){
						if(uptoIndex == 0){
							console.log("Ressource already existed, not deleting it.");
							return cb(err2);
						}

						uptoIndex--;
						console.log("Ressource already existed, not deleting it, deleting all the previous ones though.");
					}

					var rmTab = [], kubeRM = [];
					for (var i=0; i <= uptoIndex; i++){
						rmTab.push(SG.kube.delete);
						kubeRM.push([ kube[i][0], kube[i][1]]);
					}

					console.log("rmTab.length : "+rmTab.length+", kubeRM.length : "+kubeRM.length);
					console.log("kubeRM[0] : "+util.inspect(kubeRM[0]));
					//console.log("kubeRM[1] : "+util.inspect(kubeRM[1]));
					new async(rmTab, kubeRM).start(removeKubeObjectsValidation, function(err3){
						if(err3){

							return console.log("Admin has to get involved, could not delete Kubernetes objects");
						}
						rm(directory);
						console.log("Kube Build failed, so previously created objects are removed");
					});
					

					return cb(err2);
				}
				console.log("ASYNC CHAINING DONE");
				
				cb(null);
			});
		});
	});	
};

module.exports = {
	create : _create,
	createPodSpec : _createPodSpec,
	rc : _rc,
	svc : _svc,
	delete : _delete,
	pod : _pod,
	mvFromNsToNs : moveObjectFromNsToNewNs
};



moveObjectFromNsToNewNs('skante-registry-secret', 'secret', 'default', "eeerdfd", function(err){
	console.log(err || "Done!");
})
*/
//console.log(_svc('helloworld', 'jdoe').url());
