
var fs = require('fs');
var express = require('express');
var router = express.Router();


var Algos = global.mongo.model('Algos');


router.post('/', function(req, res){
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
		global.utils.kube.createInfra(req.body._id, function(err){
			
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
					min : global.params.RANGE_PORT_MIN ,
					max : global.params.RANGE_PORT_MAX 
				}, function(port){
					if(loop < max_attempts){
						loop ++;
						console.log('Loop : '+loop);
						var url = '';
						try {
							var url = global.kube.svc(result.deployment.main_service, result.meta.author.username).url();
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
						global.state._proxies.push({
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

router.put('/', function(req, res){
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

router.delete('/', function(req, res){
	if(!req.body._id){
		return res.status(400).end(JSON.stringify({status : "failure", message : 'Field "_id" have to be specified.'}));
	}

	utils.kube.removeInfra(req.body._id, function(err){
		if (err){
			console.log("kubeRemove err : "+err)
			return res.status(500).end(JSON.stringify({status : "failure", message : err.toString()}));
		}
		res.end(JSON.stringify({status : "success", message : 'Done'}));
	});
});

module.exports = router;