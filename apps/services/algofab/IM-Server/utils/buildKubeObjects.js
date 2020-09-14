
var fs = require('fs'), util = require('util'), mkdirp = require('mkdirp');
var asynchronousChain = require('./async');
var spawnSync = require('child_process').spawnSync;

var build = function(SG){
	Algos = SG.mongo.model("Algos");

	var one = function(id, username, spec, cb){
		
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
			
			if( algo.infra_ready == true){
				cb(new Error('The infra is already "ready".'));
				return;
			}

			if(!(spec.apiVersion && spec.kind && spec.metadata && spec.metadata.name)){
				return cb(new Error("New spec is missing a required field"));
			}
			var path = undefined;
			for (var i=0; i < algo.deployment.kubernetes.length; i++){
				
				var kubeObject = algo.deployment.kubernetes[i];
				console.log("BUILD ONE : i : "+i+', '+kubeObject.kind+' == '+spec.kind+' : '+ (kubeObject.kind==spec.kind)+", "+
					kubeObject.metadata.name+" == "+spec.metadata.name+" : "+(kubeObject.metadata.name==spec.metadata.name));

				if(kubeObject.kind == spec.kind && kubeObject.metadata.name == spec.metadata.name){
					console.log("BUILD ONE FOUND THE OBJECT")
					var n = algo.meta.title.toLowerCase().replace(/\.|\ |\-/g, '_')+(algo.version.replace(/\./g, ''));
					path = __dirname+'/yaml/'+algo.meta.author.username+'/'+n;

					try {
						mkdirp.sync(path);
						path += '/'+n+'_'+kubeObject.kind+'_'+kubeObject.metadata.name+'.json';
						fs.writeFileSync(path, JSON.stringify(kubeObject));
						//kube.push([path, algo.meta.author.username]);
					}
					catch(e){
						//
						console.log("Exception caught : "+e);
						return cb(new Error("System Error"));
					}
					break;
				}
				
			}

			if(path == undefined){
				return cb(new Error("No Kubernetes object previously recorded matches the new spec"));
			}
			

			SG.kube.create(path, username, function(err2){
				if(err2){
					return cb(err2);
				}
				console.log("ASYNC CHAINING DONE");
				
				cb(null);
			});
		});
	}

	var replace = function(id, username, spec, cb){
		
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
				return cb(new Error(`New spec is missing required field(s). Are "kind", "metadata.name" and "spec" specified?`));
			}
			var found = false;
			for (var i=0; i < algo.deployment.kubernetes.length; i++){
				var kubeObject = algo.deployment.kubernetes[i];

				if(spec.kind == kubeObject.kind && spec.metadata.name == kubeObject.metadata.name){
					found = true;
					break;
				}
			}

			if(! found){
				return cb(new Error("No Kubernetes object previously recorded matches the new spec"));
			}
			
			var rmKube = spawnSync("kubectl", ['delete', spec.kind, spec.metadata.name, '-n', username]);
			var failed = rmKube.stderr.toString();
			if(failed != ''){
				//
				return cb(new Error(failed));
			}

			var directory = algo.meta.title.toLowerCase().replace(/\.|\ |\-/g, '_')+(algo.version.replace(/\./g, '-'));
			var path = __dirname+'/../yaml/'+algo.meta.author.username+'/'+directory;
			path += '/'+kubeObject.kind+'_'+kubeObject.metadata.name+'.json';
			fs.writeFileSync(path, JSON.stringify(kubeObject));

			var createKube = spawnSync("kubectl", ['create', '-f', path, '-n', username]);
			failed = createKube.stderr.toString();
			if(failed != ''){
				return cb(new Error(err2));
			}
			cb();
		});
	}

	var all = function(id, username, cb){
		//
		
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
			
			if( algo.infra_ready == true){
				cb(new Error('The infra is already "ready".'));
				return;
			}

			var kube = [], pod_names = [];
			for (var i=0; i < algo.deployment.kubernetes.length; i++){
				
				var kubeObject = algo.deployment.kubernetes[i];
				var n = algo.meta.title.toLowerCase().replace(/\.|\ |\-/g, '_')+(algo.version.replace(/\./g, ''));
				var path = __dirname+'/yaml/'+algo.meta.author.username+'/'+n;
				try {
					mkdirp.sync(path);
					path += '/'+n+'_'+kubeObject.kind+'_'+kubeObject.metadata.name+'.json';
					fs.writeFileSync(path, JSON.stringify(kubeObject));
					kube.push([path, algo.meta.author.username]);
				}
				catch(e){
					//
					console.log("Exception caught : "+e);
					return cb(new Error("System Error"));
				}
				
			}
			
			var tab = [];
			for (var i=0; i < kube.length; i++)	tab.push(SG.kube.create)
			
			asynchronousChain(tab, kube, function(err2){
				if(err2){
					for (var i=0; i < kube.length; i++){
						var ind = i;
						SG.kube.delete(kube[ind], function(err3){
							console.log(err3 || (kube[ind]+" deleted"));
							rm(kube[i]);
						})
					}
					return cb(err2);
				}
				console.log("ASYNC CHAINING DONE");
				
				cb(null);
			});
		});
	}

	return { one : one, replace : replace, all : all};
}

module.exports = build;