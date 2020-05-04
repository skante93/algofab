
//var socket_io = require('socket-io')

//var cookieParser = require('cookie-parser')();
//var session = require('express-session')({secret: 'algofab secret', cookie:{maxAge: 15*1000}});
//var MemoryStore = new (require('express-session').MemoryStore)();
var cookie = require('cookie');
var util = require('util');
var kubeObjectWatcher = require('../utils/kubeObjectWatcher');
var buildKubeObjects = require('../utils/buildKubeObjects');
var spawnSync = require('child_process').spawnSync;
//console.log('MemoryStore : '+util.inspect( MemoryStore.get ));
//console.log('session : '+util.inspect(session));


var LOG_TIMERS = {};
var unscript_mask = /<(( )*|(\t)*)*script(.)*<(( )*|(\t)*)*\/(( )*|(\t)*)*script(( )*|(\t)*)*>/;

var Algos = mongo.model('Algos');

var kubectl = utils.kubectl;//require('./kubectl');

module.exports = function(server) {
	//console.log("Session Store : "+util.inspect(sessionStore.load));

	var io = require('socket.io')(server);
	console.log("NEW IO CREATED!!");

	io.on('connection', function(socket){
		
		console.log('------- Connection ------');
		socket.on('states', function(socket_id, id){
			console.log('------- STATES ------');
			Algos.findById(id).populate({
				path : "meta",
				populate : {
					path : "author"
				}
			}).exec(function(err, algo){
				if( err ) {
					return socket.emit("DB error", socket_id);
				}
				if( !algo ) { 
					socket.emit("Error", socket_id, "There is no Algo with id : "+algoID);
					return;
				}

				
				console.log('Lets continue then ..');
				var watchers = [];
				algo.deployment.kubernetes.forEach(function(kubeObject, index){
					const t = kubeObject.kind, n = kubeObject.metadata.name;
					if(t == "Pod" || t == "ReplicationController" || t == "Service"){
						var watcher = new kubeObjectWatcher(t, n, algo.meta.author.username);
						watcher.on('change', function(newState){
							console.log('Emitting some change for "'+t+'  '+n+'" : '+newState);
							if(t == "Pod" && newState == "Running"){
								//watcher.stop();
							}
							else if(t == "ReplicationController" && newState != undefined){
								var sides = newState.split('/');
								if (sides[0] == sides[1]){
									//watcher.stop();
								}
							}
							else if(t == "Service" && newState == "Configured"){
								//watcher.stop();
							}
							socket.emit('states', socket_id, algo.version, t, n, newState);
						});
						watcher.on('stop', function(finalState){
							console.log("Stopping "+t+" "+n);
						});
						watcher.on("not found", function(kind, name){
							console.log(t+'  '+n+'" : Not found');
							socket.emit('states', socket_id, algo.version, t, n, "Not Found on the cluster");
						});
						console.log('I : '+index+', kind = '+watcher.getType()+', name = '+watcher.getName());
					}
				});
				
				/*
				for(var i=0; i < algo.deployment.kubernetes.length; i++){
					const ind = i, t = algo.deployment.kubernetes[ind].kind, n = algo.deployment.kubernetes[ind].metadata.name;
					if(t == "Pod" || t == "ReplicationController" || t == "Service"){
						watchers.push ( new kubeObjectWatcher(t, n, algo.meta.author.username) );
						const l = watchers.length-1;

						watchers[l].on('change', function(newState){
							console.log('Emitting some change for "'+watchers[l].getType()+'  '+watchers[l].getName()+'" : '+newState);
							if(watchers[l].getType() == "Pod" && newState == "Running"){
								watchers[l].stop();
							}
							else if(watchers[l].getType() == "ReplicationController" && newState != undefined){
								var sides = newState.split('/');
								if (sides[0] == sides[1]){
									watchers[l].stop();
								}
							}
							else if(watchers[l].getType() == "Service" && newState == "Configured"){
								watchers[l].stop();
							}
							new_io_kubeObjects.to(room).emit('states', algo.version, watchers[l].getType(), watchers[l].getName(), newState);
						});
						watchers[l].on('stop', function(finalState){
							console.log("Stopping "+watchers[l].getType()+" "+watchers[l].getName());
						});
						watchers[l].on("not found", function(kind, name){
							console.log(watchers[l].getType()+'  '+watchers[l].getName()+'" : Not found');
							new_io_kubeObjects.to(room).emit('states', algo.version, watchers[l].getType(), watchers[l].getName(), "Not Found on the cluster");
						});
						console.log('I : '+ind+', kind = '+watchers[l].getType()+', name = '+watchers[l].getName());
					}
				}

				watchedKubeObjects[room] = watchers;
				socket.on('clean', function(){
					console.log('CLEANING : ' +( (watchedKubeObjects[room])?watchedKubeObjects[room].length : "No entry for "+room) );

					for(var i=0; watchedKubeObjects[room] && i < watchedKubeObjects[room].length; i++){
						
						const ind = i;
						watchedKubeObjects[room][ind].stop();
						console.log('\t- '+watchedKubeObjects[room][ind].getType()+' '+watchedKubeObjects[room][ind].getName());
					}

					delete watchedKubeObjects[room];
				});
				*/
			});
		});

		socket.on('events', function(socket_id, kind, name, ns){
			/*
			console.log(' <<< EVENTS >>> | KIND = '+kind+', NAME = '+name);
			
			var cmd = spawnSync('kubectl', ['events', kind, name, '-n', ns]);
			var out = cmd.stdout.toString(), err = cmd.stderr.toString();
			if(err){
				return socket.emit('events', socket_id, kind, name, 'Error : '+err);
			}
			
			socket.emit('events', socket_id, kind, name, out);
			*/
			console.log(`kind : ${kind}, name : ${name}, ns : ${ns}`);
			var nsctl = kubectl(ns);
			nsctl.get({
				apiVersion: "v1",
				kind: "Event",
				metadata: {
					//name : "helloworld",
					//namespace: "skante"
				}
			}, {
				"involvedObject.name" : name,
				"involvedObject.namespace" : ns,
				"involvedObject.kind" : kind
			}).catch(function(reason){ console.log("Failure : "+reason); })
			.then(function(results){ 
				console.log("SUCCESS ("+JSON.stringify(results, null, 2)+" results found)"); 
				var items = results.items;
				
				var messages = items.map( (i) => ({"action": i.reason, "date": i.firstTimestamp, message: i.message}) );

				//for (var i=0; i < items.length; i++)
				//	messages.push(items[i].message);

				socket.emit('events', socket_id, kind, name, messages);
			});

		});

		socket.on('spec', function(socket_id, kind, name, ns){
			console.log(' <<< SPEC >>> | KIND = '+kind+', NAME = '+name);
			var nsctl = kubectl(ns);
			nsctl.get({
				kind: kind,
				metadata: {
					name: name
				}
			}).then((out)=>{
				socket.emit('spec', socket_id, kind, name, JSON.stringify(out, null, 2));
			}).catch((err)=>{
				return socket.emit('spec', socket_id, kind, name, 'Error : '+err);
			});
			
		});

		socket.on('new spec', function(socket_id, id, kind, name, spec, ns){
			console.log(' <<< NEW SPEC >>> | KIND = '+kind+', NAME = '+name);
			var nsctl = kubectl(ns);

			nsctl.patch(spec).then((out)=>{
				socket.emit('new spec', socket_id, kind, name, JSON.stringify(out, null, 2));
			}).catch((err)=>{
				return socket.emit('new spec', socket_id, kind, name, 'Error : '+err);
			});
		});

		socket.on('edit version', function(socket_id, algoID, contents, username){
			
			if( !(contents.version || contents.comments || contents.API) ){
				//
				return socket.emit('edit version', socket_id, "failure", algoID, "None of the following fields present : version, comment and API. Nothing to edit.");
			}
			Algos.findById(algoID).populate(
				{
					path : "meta",
					populate : {
						path : "author"
					}
				}
			).exec(function(err, algo){
				if (err){
					console.log("DB err : "+err)
					return socket.emit('edit version', socket_id, "failure", algoID, "DB error");
				}

				if(!algo){
					console.log("This version does not exist")
					return socket.emit('edit version', socket_id, "failure", algoID, "This algorithm does not exist");
				}

				if (algo.meta.author.username != username){
					console.log('The algorithm does not belong to you, you can\'t take such a decision')
					return socket.emit('edit version', socket_id, "failure", algoID, 'The algorithm does not belong to you, you can\'t take such a decision');
				}
				
				console.log("contents : "+util.inspect(contents))
				var set = {};

				if(contents.comment){
					if(contents.comment instanceof Array){
						try{
							contents.comment = contents.comment.join();
						}
						catch(e){
							return socket.emit('edit version', socket_id, "failure", algoID, 'error while performing "join" on <b>comment</b> field : '+e);
						}
					}

					if(unscript_mask.test(contents.comment)){
						console.log('script Tags are forbidden.')
						return socket.emit('edit version', socket_id, "failure", algoID, 'In field <b>comment</b> : script Tags are forbidden.');
					}
					set.comment = contents.comment;
					socket.emit('edit version progress', socket_id, algoID, "<b>comment</b> checked and is OK");
				}

				if(contents.API){
					//
					console.log("utils : "+Object.keys(utils.dao.version));
					var apiErr = utils.dao.version.validator.API(contents.API);
					if(apiErr instanceof Error){
						return socket.emit('edit version', socket_id, "failure", algoID, 'error while analysing API field : '+apiErr.toString());
					}
					set.API = contents.API;
					socket.emit('edit version progress', socket_id, algoID, "<b>API</b> checked and is OK");
				}

				if(contents.version){
					if(contents.version != algo.version){
						if(!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(contents.version)){
							console.log('Field version is in the wrong format')
							return socket.emit('edit version', socket_id, "failure", algoID, 'Field version is in the wrong format');
						}
						Algos.findOne({ meta : algo.meta._id.toString(), version : contents.version }).exec(function(err, v){
							if (err){
								console.log('DB error : '+err)
								return socket.emit('edit version', socket_id, "failure", algoID, "DB error");
							}
							if (v){
								console.log("The requested version already exist.")
								return socket.emit('edit version', socket_id, "failure", algoID, "The requested version already exist.");
							}
							socket.emit('edit version progress', socket_id, algoID, "<b>version</b> checked and is OK");
							
							set.version = contents.version;
							Algos.update({ _id : algo._id.toString() }, { $set : set }).exec(function(err){
								if(err){
									console.log('DB error : '+err)
									return socket.emit('edit version', socket_id, "failure", algoID, "DB error");
								}
								//console.log('DB error : '+err);
								
								var prefix = __dirname+'/../yaml/'+algo.meta.author.username+'/'+algo.meta.title.toLowerCase().replace(/\.|\ |\-/g, '_'),
								old_dir = prefix+(algo.version.replace(/\./g, '-')), 
								new_dir = prefix+(contents.version.replace(/\./g, '-'));
								
								var mv = spawnSync('mv', [old_dir, new_dir]), out = mv.stdout.toString(), err = mv.stderr.toString();
								console.log(JSON.stringify({ out : out, err : err}));
								socket.emit('edit version', socket_id, "success", algoID);
							});
						});
					}
					else {
						Algos.update({ _id : algo._id.toString() }, { $set : set }).exec(function(err){
							if(err){
								console.log('DB error : '+err)
								return socket.emit('edit version', socket_id, "failure", algoID, "DB error");
							}

							socket.emit('edit version', socket_id, "success", algoID);
						});
					}
				}
				else if( set.comment || set.API ){
					Algos.update({ _id : algo._id.toString() }, { $set : set }).exec(function(err){
						if(err){
							console.log('DB error : '+err)
							return socket.emit('edit version', socket_id, "failure", algoID, "DB error");
						}

						socket.emit('edit version', socket_id, "success", algoID);
					});
				}
			});
		
		});

		socket.on('create version', function(socket_id, vID){

			console.log('vID : '+vID);
			var cb = function(err){
					
				if(err) {
					console.log('KubeDeployment Failed : '+err);
					return socket.emit('create version', socket_id, 'failure', vID, 'Error while building infra : '+err);
				}
				
				socket.emit('create version', socket_id, 'success', 'DB error');
				
				
				Algos.update({_id : vID}, { $set : { infra_ready : true } }).exec(function(err2){
					if(err2) console.log('\nError during update : '+err2+'\n');
					else console.log('\nAlgo Updated\n');
				});
			}

			utils.kube.createInfra(vID, {socket : socket, socket_id: socket_id}, cb);
			/*
			var exec = Algos.findById(vID).populate({
				path : 'meta',
				populate : {
					path : 'author'
				}
			}).exec(function(err, result){
				console.log("err : "+err);
				if(err) return socket.emit('create version', socket_id, 'failure', 'DB error');

				if(!result){
					console.log("Result : "+result);
					return socket.emit('create version', socket_id, 'failure', "There's no algo in the DB with id : "+vID);
				}

				console.log("result.meta.author.username : "+result.meta.author.username);

				//---
				var cb = function(err){
					
					if(err) {
						console.log('KubeDeployment Failed : '+err);
						return socket.emit('create version', socket_id, 'failure', vID, 'Error while building infra : '+err);
					}
					
					socket.emit('create version', socket_id, 'success', 'DB error');
					
					
					Algos.update({_id : vID}, { $set : { infra_ready : true } }).exec(function(err2){
						if(err2) console.log('\nError during update : '+err2+'\n');
						else console.log('\nAlgo Updated\n');
					});
				}

				var kube_objects_to_create = result.deployment.kubernetes;
				var kube_objects_to_delete = [];
				var nsctl = kubectl(result.meta.author.username);

				console.log("NSCTL.create : "+nsctl.create.toString());
				var delete_kube_objects = (callback)=>{
					console.log("##### delete_kube_objects #####");
					
					if (kube_objects_to_delete.length == 0)
						return callback();
					var current = kube_objects_to_delete.shift();

					console.log("##### delete_kube_objects "+current.kind+" "+current.metadata.name+"#####");

					nsctl.delete(current)
						.then( (result)=> {
							var t = current.kind, n = current.metadata.name;
							console.log(t+" "+n+" Cleaned");
							delete_kube_objects(callback) 
						}).catch( callback );
				}

				(function create_kube_objects(callback){
					console.log("##### create_kube_objects #####");
					if (kube_objects_to_create.length == 0)
						return callback();
					var current = kube_objects_to_create.shift();
					
					console.log("##### current "+current.kind+" "+current.metadata.name+" #####");
					
					nsctl.create(current)
						.then( (result)=> {
							console.log("##### current "+current.kind+" "+current.metadata.name+" create success "+result+"#####");
							
							var t = current.kind, n = current.metadata.name;
							socket.emit('create version progress', socket_id, t+" "+n+" ----- OK");
							kube_objects_to_delete.push(current);
							create_kube_objects(callback);
						})
						.catch( (error)=>{
							console.log("##### current "+current.kind+" "+current.metadata.name+" create error "+error.toString()+"#####");
							
							socket.emit('create version progress', socket_id, "Error: "+error);
							// if (kube_objects_to_delete.length == 0)
							// 	return callback(error);
							
							// socket.emit('create version progress', socket_id, "Remove previously created k8s objects");
							kube_objects_to_delete.push(current);
							
							delete_kube_objects((delete_err)=>{
								//
								console.log("### delete_err : "+delete_err);
								callback(error);
							});
						});
				})(cb);
				
			});
			*/
		});
	});
	return io;
};

/*
var analyseAPIField = function(API, verb, io){
    var content = [];
    if(API[verb]){
        for(var i=0; i < API[verb].length; i++){
            var content_object = {};
            if( API[verb][i].uri && typeof API[verb][i].uri !== 'string' ) {
                var msg = "Field API."+verb+"["+i+"].uri doesn't exist or is not string";
                console.log(msg);
                if(typeof io !== 'undefined')
                    io.emit("Error", msg);
                return new Error(msg);
            }
            if(API[verb][i].uri)
            	content_object.uri = API[verb][i].uri;
            else
            	content_object.uri = "/";


            if( !(API[verb][i].description) && API[verb][i].description instanceof Array) {
                var msg = "Field API."+verb+"["+i+"].description doesn't exist.";
                console.log(msg);
                if(typeof io !== 'undefined')
                    io.emit("Error", msg);
                return new Error(msg);
            }
            else if(API[verb][i].description instanceof Array){
            	try {
	                API[verb][i].description = API[verb][i].description.join('').replace(unscript_mask, '');
	            }catch(e){
	                var msg = "Field API."+verb+"["+i+"].description is in the wrong format, it should be an array of string.";
	                console.log(msg);
	                if(typeof io !== 'undefined')
	                    io.emit("Error", msg);
	                return new Error(msg);
	            }
            }
            else if(typeof API[verb][i].description === "string"){
            	//
            	API[verb][i].description = API[verb][i].description.replace(unscript_mask, '');
            }

            content_object.description = API[verb][i].description;
            
            if( !(API[verb][i].inputs && API[verb][i].inputs instanceof Array) ){
                var msg = "Field API."+verb+"["+i+"].inputs doesn't exist or is not array";
                console.log(msg);
                if(typeof io !== 'undefined')
                    io.emit("Error", msg);
                return new Error(msg);
            }
            content_object.inputs = [];
            for(var j=0; j < API[verb][i].inputs.length; j++){
                if( !(API[verb][i].inputs[j].name && API[verb][i].inputs[j].mime_types) ){
                    var msg = "Field API."+verb+"["+i+"].inputs["+j+"] has either not field name or field mime_types (both are required).";
                    console.log(msg);
                    if(typeof io !== 'undefined')
                        io.emit("Error", msg);
                    return new Error(msg);
                }

                if( !API[verb][i].inputs[j].required || (typeof API[verb][i].inputs[j].required !== 'boolean') )
                    API[verb][i].inputs[j].required = false;

                var someObject = {
                	name : API[verb][i].inputs[j].name,
	                mime_types : API[verb][i].inputs[j].mime_types,
	                required : API[verb][i].inputs[j].required
                };
                content_object.inputs.push(someObject);
            }

            if( !(API[verb][i].outputs && API[verb][i].outputs instanceof Array) ){
                var msg = "Field API."+verb+"["+i+"].outputs doesn't exist or is not array";
                console.log(msg);
                if(typeof io !== 'undefined')
                    io.emit("Error", msg);
                return new Error(msg);
            }
            content_object.outputs = API[verb][i].outputs;
            content.push(content_object);
        }

        if(content.length > 0)
        	return content;
    }
}

var analyseAPI = function(API, io) {
	if(!API){

		console.log(new Error("Error : The field API is required."));
        return new Error("Error : The field API is required.");
    }

    var at_least_one_method = (API.GET && API.GET instanceof Array) || 
                              (API.POST && API.POST instanceof Array) || 
                              (API.PUT && API.PUT instanceof Array) || 
                              (API.DELETE && API.DELETE instanceof Array);    

    if(!at_least_one_method){
        return new Error("No VERB Given, if you did specify at least one, then checkout the format (Array of object expected).");
    }

    var api_content = analyseAPIField(API, 'GET', io);
    if(api_content instanceof Error) {
        return api_content;
    }
    
    //------ FOR POST --------
    api_content = analyseAPIField(API, 'POST', io);
    if(api_content instanceof Error) {
        return api_content;
    }
    
    //------ FOR PUT --------
    api_content = analyseAPIField(API, 'PUT', io);
    if(api_content instanceof Error) {
        return api_content;
    }
    
    //------ FOR DELETE --------
    api_content = analyseAPIField(API, 'DELETE', io);
    if(api_content instanceof Error) {
        return api_content;
    }
    
}
*/