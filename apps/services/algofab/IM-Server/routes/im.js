
var fs = require('fs'), util = require('util');
var express = require('express');
var router = express.Router();

//var multiparty = require('multiparty');
var mkdirp = require('mkdirp');
var spawnSync = require('child_process').spawnSync;


/* GET home page. */
var Proxy = require('../utils/proxy')();

module.exports = function(SG){
	
//	var IM = require('../MI-cmd.js')(SG);
	var AlgosMeta = SG.mongo.model('AlgosMeta');
	var Algos = SG.mongo.model('Algos');
	var Users = SG.mongo.model("User");
	
	var kubeObjectWatcher = SG.utils.kube.watcher;
	var async = SG.utils.async;

	router.get('/', function(req, res) {
		res.writeHead(200, {'content-type': 'text/html'});
		res.end(JSON.stringify({message : "Infrastructure Manager up and running"}));
	});
	
	router.post('/build-infra', function(req, res){
			
		console.log('req.body : '+util.inspect(req.body));
		if( !req.body._id ){
			console.log(new Error('Field "_id" have to be specified'));
			res.status(400).end(JSON.stringify({status : "failure", message : 'Field "_id" have to be specified.'}) );
			return;
		}
		var keepAlive = setInterval(function(){ res.write("Keep Alive"); }, 10 * 1000);


		console.log("DEBUG");
		var exec = Algos.findById(req.body._id).populate({
			path : 'meta',
			populate : {
				path : 'author'
			}
		}).exec(function(err, result){
			if(err) return res.status(500).end('{"status" : "failure", "message" : "DB error"}');

			if(!result){
				console.log("Result : "+result);
				return res.status(500).end('{"status" : "failure", "message" : "There\'s no algo in the DB with id : '+req.body._id+'"}');
			}

			console.log("result.meta.author.username : "+result.meta.author.username);
			SG.utils.kube.createInfra(req.body._id, function(err){
				
				clearInterval(keepAlive);

				if(err) {
					console.log('KubeDeployment Failed : '+err);
					return res.status(500).end(JSON.stringify({status : "failure", message : err}));
				}
				res.end('{"status" : "success", "message" : "Infra created"}');
				
				
				Algos.update({_id : req.body._id}, { $set : { infra_ready : true } }).exec(function(err2){
					if(err2) console.log('\nError during update : '+err2+'\n');
					else console.log('\nAlgo Updated\n');
				});

				/*
				var max_attempts = 10, loop = 0;
				var interv = setInterval(function() {
					newAvailablePortInRange ({
						min : SG.params.RANGE_PORT_MIN ,
						max : SG.params.RANGE_PORT_MAX 
					}, function(port){
						if(loop < max_attempts){
							loop ++;
							console.log('Loop : '+loop);
							var url = '';
							try {
								var url = SG.kube.svc(result.deployment.main_service, result.meta.author.username).url();
							}catch (e){
								console.log("Exception Caught : "+e);
								loop ++;
								return ;
							}

							if (! url){
								console.log("!URL : "+url);
								return res.status(500).end('{"status" : "failure", "message" : "Server error"}');
							}

							var proxy = new Proxy(url, port);
							SG.state._proxies.push({
								service_name : result.deployment.main_service,
								username : result.meta.author.username,
								service_url : url,
								port : port,
								proxy : proxy
							});
							clearInterval(keepAlive);
							clearInterval(interv);
							res.end('{"status" : "success", "message" : "Infra created"}');
							
							
							Algos.update({_id : req.body._id}, { $set : { infra_ready : true } }).exec(function(err2){
								if(err2) console.log('\nError during update : '+err2+'\n');
								else console.log('\nAlgo Updated\n');
							});
							
							
						}
						else{
							clearInterval(keepAlive);
							clearInterval(interv);
							res.status(500).end('{"status" : "failure", "message" : "Could not get url for the service."}');
						}
					});
				}, 2000);
				*/
			});
			
		});
	});
	
	router.post('/build-kubernetes-object', function(req, res){
			
		console.log('req.body : '+util.inspect(req.body));
		if( !req.body._id ){
			console.log(new Error('Field "_id" have to be specified'));
			res.status(400).end(JSON.stringify({status : "failure", message : 'Field "_id" have to be specified.'}) );
			return;
		}

		if( !req.body.index ){
			console.log(new Error('Field "index" have to be specified'));
			res.status(400).end(JSON.stringify({status : "failure", message : 'Field "index" have to be specified.'}) );
			return;
		}

		var keepAlive = setInterval(function(){ res.send("Keep Alive"); }, 45 * 1000);

		
		console.log("DEBUG");
		var exec = Algos.findById(req.body._id).populate({
			path : 'meta',
			populate : {
				path : 'author'
			}
		}).exec(function(err, result){
			if(err) return res.status(500).end('{"status" : "failure", "message" : "DB error"}');

			if(!result) return res.status(500).end('{"status" : "failure", "message" : "There\'s no algo in the DB with id : '+req.body._id+'"}');

			console.log("result.meta.author.username : "+result.meta.author.username);
			var n = result.meta.title.toLowerCase().replace(/\.|\ |\-/g, '_')+(result.version.replace(/\./g, ''));
			var path = __dirname+'/../yaml/'+result.meta.author.username+'/'+n;
			var kubeObject = result.deployment.kubernetes[req.body.index];
			try {
				mkdirp.sync(path);
				
			}
			catch (e){
				return res.status(500).end('{"status" : "failure", "message" : "Server fault"}');
			}

			path += '/'+kubeObject.kind+'_'+kubeObject.metadata.name+'.json';
			fs.writeFileSync(path, JSON.stringify(kubeObject));
			
			new async([ SG.utils.kube.create ], [ [path] ]).start(SG.utils.kube.createKubeObjectsValidation, function(err2, uptoIndex){
				if(err2){
						
					if(err2.toString().startsWith("Error from server (AlreadyExists): error when creating")){
						if(uptoIndex == 0){
							console.log("Ressource already existed, not deleting it.");
							return res.status(500).end(JSON.stringify({status : "failure", message : err2}));
						}
					}

					console.log("Deleting because of "+err2);
					new async([ SG.utils.kube.delete ], [ [{ filePath : path }] ]).start(removeKubeObjectsValidation, function(err3){
						if(err3){

							console.log("Admin has to get involved, could not delete Kubernetes objects : "+err3);
							return res.status(500).end(JSON.stringify({status : "failure", message : "Unknown Error!! Admin has to get involved, could not delete Kubernetes objects"}));
						}
						//rm(specDirectory(algo.meta.author.username, algo.meta.title, algo.version));
						console.log("Kube Build failed, so previously created objects are removed");
					});

					return res.status(500).end(JSON.stringify({status : "failure", message : err2}));
				}
				console.log("ASYNC CHAINING DONE");
				
				res.end(JSON.stringify({status : "success", message : "Done"}));
			});
			/*
			SG.kube.create(path, result.meta.author.username, function(error, done){
				if(error){
					return res.end(JSON.stringify({"status" : "failure", "message" : error}));
				}

				//var object_state_watcher = new kubeObjectWatcher(kubeObject.kind, kubeObject.metadata.name, result.meta.author.username);
				
				
			});
			
			IM.kubeBuild(req.body._id, function(err){
				if(err) {
					console.log('KubeDeployment Failed : '+err);
					clearInterval(keepAlive);
					return res.status(500).end(JSON.stringify({status : "failure", message : err}));
				}



				var max_attempts = 10, loop = 0;
				var interv = setInterval(function() {
					newAvailablePortInRange ({
						min : SG.params.RANGE_PORT_MIN ,
						max : SG.params.RANGE_PORT_MAX 
					}, function(port){
						if(loop < max_attempts){
							loop ++;
							console.log('Loop : '+loop);
							var url = '';
							try {
								var url = SG.kube.svc(result.deployment.main_service, result.meta.author.username).url();
							}catch (e){
								console.log("Exception Caught : "+e);
								loop ++;
								return ;
							}

							if (! url){
								console.log("!URL : "+url);
								return res.status(500).end('{"status" : "failure", "message" : "Server error"}');
							}

							var proxy = new Proxy(url, port);
							SG.state._proxies.push({
								service_name : result.deployment.main_service,
								username : result.meta.author.username,
								service_url : url,
								port : port,
								proxy : proxy
							});
							clearInterval(keepAlive);
							clearInterval(interv);
							res.end('{"status" : "success", "message" : "Infra created"}');
							
							
							Algos.update({_id : req.body._id}, { $set : { infra_ready : true } }).exec(function(err2){
								if(err2) console.log('\nError during update : '+err2+'\n');
								else console.log('\nAlgo Updated\n');
							});
							
							
						}
						else{
							clearInterval(keepAlive);
							clearInterval(interv);
							res.status(500).end('{"status" : "failure", "message" : "Could not get url for the service."}');
						}
					});
				}, 2000);
				
			});
			*/
		});
	});
	
	router.post('/service-port', function(req, res){
		//
		if(!req.body._id){
			return res.status(400).end(JSON.stringify({status : "failure", message : 'Field "_id" have to be specified.'}));
		}

		var exec = Algos.findById(req.body._id).populate('author').exec();
		exec.catch(err => { //function(err, result){
			if(err) return res.status(500).end('{"status" : "failure", "message" : "DB error"}');
		})
		.then(result => {		
			if(!result) return res.status(500).end('{"status" : "failure", "message" : "There\'s no algo in the DB with id : '+req.body._id+'"}');
			console.log("DEBUG 1");
			
			if(!result.infra_ready) return res.status(500).end('{"status" : "failure", "message" : "There is no infrastructure established for this algo"}');
			console.log("DEBUG 2");
			
			var url = '';
			try {
				url = SG.utils.kube.svc(result.deployment.main_service, result.author.username).url();
				console.log("DEBUG 3");
			}
			catch(e){
				console.log("Exception Caught : "+e);
				return res.status(500).end(JSON.stringify({status : "failure", message : 'Could not get the url for sevice "'+result.deployment.main_service+'" '}));
			}
			if (! url){
				console.log("!URL : "+url);
				return res.status(500).end('{"status" : "failure", "message" : "Server error"}');
			}
			console.log("DEBUG 4, url : "+url);
			

			var found = undefined, found_index = -1;
			for(var i=0; i < SG.state._proxies.length; i++){
				if (SG.state._proxies[i].service_name == result.deployment.main_service) {
					found = SG.state._proxies[i];
					found_index = i;
					break;
				}
			}

			if (found){
				console.log("DEBUG 5");
			
				if(found.service_url != url){
					console.log("DEBUG 6");
					console.log('found.service_url : '+found.service_url+', url : '+url);
					found.service_url = url;
					if(found.proxy)
						found.proxy.close();
					/*
					found.proxy = require('redbird')({port : found.port});
		            found.proxy.register(SG.params.PORTAL_EXT_ADDR, found.service_url);
		            found.proxy.register(SG.params.MI_ADDR, found.service_url);
		            found.proxy.register('localhost', found.service_url);
		            */
		            SG.state._proxies.splice(found_index, 1);
	            	newAvailablePortInRange (
						{
							min : SG.params.RANGE_PORT_MIN,
							max : SG.params.RANGE_PORT_MAX
						}, function(port){
							var proxy = new Proxy(url, port);
			                new_proxy = {
								service_name : result.deployment.main_service,
								username : result.author.username,
								service_url : url,
								port : port,
								proxy : proxy
							}
							SG.state._proxies.push(new_proxy);
							res.end('{"status" : "success", "message" : "'+found.port+'"}');
	            		}
	            	);
	                return;
				}
				else{
					console.log("DEBUG 7");
					return res.end('{"status" : "success", "message" : "'+found.port+'"}');
				}
			}
			
			newAvailablePortInRange (
				{
					min : SG.params.RANGE_PORT_MIN,
					max : SG.params.RANGE_PORT_MAX
				}, function(port){
					console.log("URL : "+url);
					//var proxy = require('redbird')({port : port});
					console.log("DEBUG 8");
			
	                console.log("SG.params.PORTAL_EXT_ADDR = "+SG.params.PORTAL_EXT_ADDR+", url = "+url);
	                //proxy.register(SG.params.PORTAL_EXT_ADDR, url);
	                //proxy.register(SG.params.MI_ADDR, url);
	                //proxy.register('localhost', url);
	                
	                var proxy = new Proxy(url, port);
	                found = {
						service_name : result.deployment.main_service,
						username : result.author.username,
						service_url : url,
						port : port,
						proxy : proxy
					}
					SG.state._proxies.push(found);
					
					res.end('{"status" : "success", "message" : "'+found.port+'"}');
				}
			);
			
			
		});
	});

	router.post('/new-service-port', function(req, res){
		//
		if(!req.body._id){
			return res.status(400).end(JSON.stringify({status : "failure", message : 'Field "_id" have to be specified.'}));
		}

		Algos.findById(req.body._id).populate(
			{ 
				path : 'meta',
				populate : {
					path : "author"
				}
			}).exec(function(err, result){
				console.log("err : "+err);
				if(err) return res.status(500).end('{"status" : "failure", "message" : "DB error"}');
				if(!result) return res.status(500).end('{"status" : "failure", "message" : "There\'s no algo in the DB with id : '+req.body._id+'"}');
				console.log("DEBUG 1");
				
				if(!result.infra_ready) return res.status(500).end('{"status" : "failure", "message" : "There is no infrastructure established for this algo"}');
				console.log("DEBUG 2");
				
				var url = '';
				try {
					url = SG.utils.kube.svc(result.deployment.main_service, result.meta.author.username).url();
					console.log("DEBUG 3");
				}
				catch(e){
					console.log("Exception Caught : "+e);
					return res.status(500).end(JSON.stringify({status : "failure", message : 'Could not get the url for sevice "'+result.deployment.main_service+'" '}));
				}
				if (! url){
					console.log("!URL : "+url);
					return res.status(500).end('{"status" : "failure", "message" : "Server error"}');
				}
				console.log("DEBUG 4, url : "+url);
				

				var found = undefined, found_index = -1;
				for(var i=0; i < SG.state._proxies.length; i++){
					if (SG.state._proxies[i].service_name == result.deployment.main_service) {
						found = SG.state._proxies[i];
						found_index = i;
						break;
					}
				}

				if (found){
					console.log("DEBUG 5");
				
					if(found.service_url != url){
						console.log("DEBUG 6");
						console.log('found.service_url : '+found.service_url+', url : '+url);
						found.service_url = url;
						if(found.proxy)
							found.proxy.close();
						/*
						found.proxy = require('redbird')({port : found.port});
			            found.proxy.register(SG.params.PORTAL_EXT_ADDR, found.service_url);
			            found.proxy.register(SG.params.MI_ADDR, found.service_url);
			            found.proxy.register('localhost', found.service_url);
			            */
			            SG.state._proxies.splice(found_index, 1);
		            	newAvailablePortInRange (
							{
								min : SG.params.RANGE_PORT_MIN,
								max : SG.params.RANGE_PORT_MAX
							}, function(port){
								var proxy = new Proxy(url, port);
				                new_proxy = {
									service_name : result.deployment.main_service,
									username : result.meta.author.username,
									service_url : url,
									port : port,
									proxy : proxy
								}
								SG.state._proxies.push(new_proxy);
								res.end('{"status" : "success", "message" : "'+found.port+'"}');
		            		}
		            	);
		                return;
					}
					else{
						console.log("DEBUG 7");
						return res.end('{"status" : "success", "message" : "'+found.port+'"}');
					}
				}
				
				newAvailablePortInRange (
					{
						min : SG.params.RANGE_PORT_MIN,
						max : SG.params.RANGE_PORT_MAX
					}, function(port){
						console.log("URL : "+url);
						//var proxy = require('redbird')({port : port});
						console.log("DEBUG 8");
				
		                console.log("SG.params.PORTAL_EXT_ADDR = "+SG.params.PORTAL_EXT_ADDR+", url = "+url);
		                //proxy.register(SG.params.PORTAL_EXT_ADDR, url);
		                //proxy.register(SG.params.MI_ADDR, url);
		                //proxy.register('localhost', url);
		                
		                var proxy = new Proxy(url, port);
		                found = {
							service_name : result.deployment.main_service,
							username : result.meta.author.username,
							service_url : url,
							port : port,
							proxy : proxy
						}
						SG.state._proxies.push(found);
						
						res.end('{"status" : "success", "message" : "'+found.port+'"}');
					}
				);
			}
		);
	});
	
	router.post('/service-url', function(req, res){
		//
		if(!req.body._id){
			return res.status(400).end(JSON.stringify({status : "failure", message : 'Field "_id" have to be specified.'}));
		}

		Algos.findById(req.body._id).populate(
			{ 
				path : 'meta',
				populate : {
					path : "author"
				}
			}).exec(function(err, result){
				console.log("err : "+err);
				if(err) return res.status(500).end('{"status" : "failure", "message" : "DB error"}');
				if(!result) return res.status(500).end('{"status" : "failure", "message" : "There\'s no algo in the DB with id : '+req.body._id+'"}');
				console.log("DEBUG 1");
				
				if(!result.infra_ready) return res.status(500).end('{"status" : "failure", "message" : "There is no infrastructure established for this algo"}');
				console.log("DEBUG 2");
				
				var url = '';
				try {
					url = SG.utils.kube.svc(result.deployment.main_service, result.meta.author.username).url();
					console.log("DEBUG 3");
					res.end('{"status" : "success", "message" : "'+url+'"}');
				}
				catch(e){
					console.log("Exception Caught : "+e);
					res.status(500).end(JSON.stringify({status : "failure", message : 'Could not get the url for sevice "'+result.deployment.main_service+'" '}));
				}
				
			}
		);
	});
	
	router.post('/remove-algo', function(req, res){
		//
		if(!req.body._id){
			return res.status(400).end(JSON.stringify({status : "failure", message : 'Field "_id" have to be specified.'}));
		}

		SG.utils.kube.removeInfra(req.body._id, function(err){
			if (err){
				console.log("kubeRemove err : "+err)
				return res.status(500).end(JSON.stringify({status : "failure", message : err.toString()}));
			}
			res.end(JSON.stringify({status : "success", message : 'Done'}));
		});
	});

	router.post('/remove-algo-version', function(req, res){
		//
		if(!req.body._id){
			return res.status(400).end({status : "failure", message : 'Field "_id" have to be specified.'});
		}

		SG.utils.kube.removeInfra(req.body._id, function(err){
			if (err){
				console.log("kubeRemove err : "+err)
				return res.status(500).json({status : "failure", message : err.toString()});
			}
			res.json({status : "success", message : 'Done'});
		});
	});

	router.post('/edit-algo-version', function(req, res){
		//
		if(!req.body._id){
			return res.status(400).json({status : "failure", message : 'Field "_id" have to be specified.'});
		}

		if(!req.body.version){
			return res.status(400).json({status : "failure", message : 'Field "version" have to be specified.'});
		}

		
		if(!req.body.username){
			return res.status(400).json({status : "failure", message : 'Field "username" have to be specified.'});
		}

		if(!req.body.contents){
			return res.status(400).json({status : "failure", message : 'Field "contents" have to be specified.'});
		}

		Algos.findById(req.body._id).populate(
			{
				path : "meta",
				populate : {
					path : "author"
				}
			}
		).exec(function(err, algo){
			if (err){
				console.log("kubeRemove err : "+err)
				return res.status(500).json({status : "failure", message : err.toString()});
			}

			if(!algo){
				console.log("This version does not exist")
				return res.status(500).json({status : "failure", message : "This algorithm does not exist"});
			}

			if (algo.meta.author.username != req.body.username){
				console.log('The requested version was not found.')
				return res.status(500).json({status : "failure", message : 'The algorithm does not belong to you, you can\'t take such a decision'});
			}
			
			var contents = req.body.contents;

			console.log("contents : "+util.inspect(contents))
			var unscript_mask = /<(( )*|(\t)*)*script(.)*<(( )*|(\t)*)*\/(( )*|(\t)*)*script(( )*|(\t)*)*>/;
			if(unscript_mask.test(contents.comment)){
				console.log('script Tags are forbidden.')
				return res.status(500).json({status : "failure", message : 'script Tags are forbidden.'});
			}
			

			if(contents.version != req.body.version){
				if(!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(contents.version)){
					console.log('Field version is in the wrong format')
					return res.status(500).json({status : "failure", message : 'Field version is in the wrong format'});
				}

				Algos.findOne({ meta : algo.meta._id.toString(), version : contents.version }).exec(function(err, v){
					if (err){
						console.log('DB error : '+err)
						return res.status(500).json({status : "failure", message : 'DB error'});
					}
					if (v){
						console.log("The requested version already exist.")
						return res.status(500).json({status : "failure", message : "The requested version already exist."});
					}

					Algos.update({ _id : algo._id.toString() }, { $set : contents }).exec(function(err){
						if(err){
							console.log('DB error : '+err)
							return res.status(500).json({status : "failure", message : 'DB error'});
						}
						console.log('DB error : '+err);
						var prefix = __dirname+'/../yaml/'+algo.meta.author.username+'/'+algo.title.toLowerCase().replace(/\.|\ |\-/g, '_'),
						old_dir = prefix+(req.body.version.replace(/\./g, '-')), 
						new_dir = prefix+(contents.version.replace(/\./g, '-'));
						
						var mv = spawnSync('mv', [old_dir, new_dir]), out = mv.stdout.toString(), err = mv.stderr.toString();
						console.log(JSON.stringify({ out : out, err : err}));
						res.json({status : "success", message : contents});
					});
				});
			}
			else {
				Algos.update({ meta : req.body._id, version : req.body.version }, { $set : contents }).exec(function(err){
					if(err){
						console.log('DB error : '+err)
						return res.status(500).json({status : "failure", message : 'DB error'});
					}

					res.json({status : "success", message : contents});
				});
			}
		});
	});

	router.post('/add-user-ns', function(req, res){
		if(!req.body.username){
			return res.status(400).end(JSON.stringify({status : "failure", message : 'Field "username" have to be specified.'}));
		}

		var cmd = spawnSync('kubectl', ['create', 'namespace', req.body.username]);
		var out = cmd.stdout.toString(), err = cmd.stderr.toString();
		if(err != ''){
			console.log("Error : "+err);
			return res.status(500).end(JSON.stringify({status : "failure", message : "Error while createing namespace"}))	;
		}
		res.end(JSON.stringify({status : "success", message : "done"}))	;
		
	});
	
	router.delete('/user-ns', function(req, res){
		if(!req.body.username){
			return res.status(400).end(JSON.stringify({status : "failure", message : 'Field "username" have to be specified.'}));
		}

		var cmd = spawnSync('kubectl', ['delete', 'namespace', req.body.username]);
		var out = cmd.stdout.toString(), err = cmd.stderr.toString();
		if(err != ''){
			console.log("Error : "+err);
			return res.status(500).end(JSON.stringify({status : "failure", message : "Error while createing namespace"}))	;
		}
		res.end(JSON.stringify({status : "success", message : "done"}))	;
		
	});
	
	return router;
}


/*
#########################################################################
#########################################################################
##########################   HANDY FUNCTIONS   ##########################
#########################################################################
#########################################################################
*/
var net = require('net');

var portInUse = function(port, cb) {
    var server = net.createServer(function(socket) {
		socket.write('Echo server\r\n');
		socket.pipe(socket);
    });

    server.listen(port, '127.0.0.1');
    server.on('error', function (e) {
		cb(true);
    });
    server.on('listening', function (e) {
		server.close();
		cb(false);
    });
}

var newAvailablePortInRange = function(range, cb, port){
	
	if(typeof range === 'function' && typeof cb === 'undefined' ) {
		cb = range;
		range = {min : 1, max : 65535};
	}
	
	if(typeof range === 'function' && typeof cb === 'number' ) {
		port = cb;
		cb = range;
		range = {min : 1, max : 65535};
	}
	
	if(typeof port === 'undefined' || !(port >= range.min && port < range.max)) {
		port = Math.floor(Math.random() * (range.max-range.min)) + range.min;
	}
	
	/*
	console.log('Range : '+range);
	console.log('CB : '+cb);
	console.log('Port : '+port);
	*/
	portInUse(port, function(inuse){
		if(inuse){
			newAvailablePortInRange(range, cb);
		}
		else
		{
			cb(port);
		}
	});
}

var newAvailablePortOutOfRange = function(range, cb, port){	
	if(typeof port === 'undefined' || (port >= range.min && port < range.max) ) {
		port = Math.floor(Math.random() * (65535-1)) + 1;
		while(port >= range.min && port < range.max)
			port = Math.floor(Math.random() * (65535-1)) + 1;
	}
	
	/*
	console.log('Range : '+range);
	console.log('CB : '+cb);
	console.log('Port : '+port);
	*/
	portInUse(port, function(inuse){
		if(inuse){
			newAvailablePortOutOfRange(range, cb);
		}
		else
		{
			cb(port);
		}
	});
}

