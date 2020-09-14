
var fs = require('fs');
var express = require('express');
var router = express.Router();

var spawnSync = require('child_process').spawnSync;

var Algos = global.mongo.model('Algos');
/*
router.get('/url', function(req, res){
	//
});
*/



router.get('/new-impl', function(req, res){
	if(!req.query._id){
		return res.status(400).end(JSON.stringify({status : "failure", message : 'query parameter "_id" have to be specified.'}));
	}

	Algos.findById(req.query._id).populate(
		{ 
			path : 'meta',
			populate : {
				path : "author"
			}
		}
	).exec(function(err, result){
		console.log("err : "+err);
		if(err) return res.status(500).end('{"status" : "failure", "message" : "DB error"}');
		if(!result) return res.status(500).end('{"status" : "failure", "message" : "There\'s no algo in the DB with id : '+req.body._id+'"}');
		console.log("DEBUG 1");
		
		if(!result.infra_ready) return res.status(500).end('{"status" : "failure", "message" : "There is no infrastructure established for this algo"}');
		console.log("DEBUG 2");
		
		var url = '';
		try {
			url = global.utils.kube.svc(result.deployment.main_service, result.meta.author.username).new_url();
			console.log("DEBUG 3");
			res.end('{"status" : "success", "message" : "'+ require('util').inspect(url)+'"}');
		}
		catch(e){
			console.log("Exception Caught : "+e);
			res.status(500).end(JSON.stringify({status : "failure", message : 'Could not get the url for sevice "'+result.deployment.main_service+'" '}));
		}
		
	});
});

router.get('/', function(req, res){
	console.log("###### DEB ########");
	if(!req.query._id){
		return res.status(400).end(JSON.stringify({status : "failure", message : 'query parameter "_id" have to be specified.'}));
	}

	if(!req.query.kind){
		return res.status(400).end(JSON.stringify({status : "failure", message : 'query parameter "kind" have to be specified.'}));
	}

	if(req.query.kind != "demo" && req.query.kind != "api"){
		return res.status(400).end(JSON.stringify({status : "failure", message : 'query parameter "kind" must either be "demo" or "api".'}));
	}

	Algos.findById(req.query._id).populate(
		{ 
			path : 'meta',
			populate : {
				path : "author"
			}
		}
	).exec(function(err, result){
		console.log("err : "+err);
		if(err) return res.status(500).end('{"status" : "failure", "message" : "DB error"}');
		if(!result) return res.status(500).end('{"status" : "failure", "message" : "There\'s no algo in the DB with id : '+req.body._id+'"}');
		console.log("DEBUG 1");
		console.log("###### DEB ########");
		
		if(!result.infra_ready) return res.status(500).end('{"status" : "failure", "message" : "There is no infrastructure established for this algo"}');
		console.log("DEBUG 2");

		var svc = result.deployment.services[req.query.kind];
		console.log("Demo svc : "+JSON.stringify(svc, null, 2));

		var nsctl = utils.kubectl(result.meta.author.username);

		function get_url_for_protocol(svc_name, port_name, cb){
			console.log("## GET URL get svc "+svc_name+" (port "+port_name+") ##");
			nsctl.get({
				apiVersion: "v1",
				kind : "Service",
				metadata: {
					name : svc_name
				}
			}).catch( (e)=> { 
				cb(e.toString()); 
			}).then( (result) => {
				console.log('result : '+JSON.stringify(result, null, 2));
				//var r = result.items[0].spec,
				var clusterIP = result.spec.clusterIP,
				port = null, 
				ports = result.spec.ports;
				console.log("result : "+JSON.stringify(result)+'\nclusterIP : '+clusterIP+'\nports : '+JSON.stringify(ports));
				for (var i=0; i < ports.length; i++){
					console.log(`- port_name : ${port_name}, ports[i].name : ${ports[i].name}`);
					if (port_name == ports[i].name){
						port = ports[i]; 
						break;
					}
				}

				console.log("Port : "+JSON.stringify(port));
				//res.end(JSON.stringify({status: "success", message: result.items[0].spec.clusterIP+':'+port.port}))
				cb(null, clusterIP+':'+port.port);
			});
		}
		
		var protos = [];
		if (svc.http)
			protos.push('http');
		if (svc.https)
			protos.push('https');
		if (svc.ws)
			protos.push('ws');
		if (svc.wss)
			protos.push('wss');

		console.log("protos : "+JSON.stringify(protos, null, 2));
		//console.log("svc : "+JSON.stringify(svc, null, 2));
		var links = {};
		(function get_urls(){
			console.log('protos.length : '+protos.length);
			if (protos.length == 0){
				return res.end(JSON.stringify({status: "success", message: links}));
			}
			var current = protos.shift();
			console.log("current  = "+current);
			get_url_for_protocol(svc[current].svc, svc[current].port_name, (err, u)=>{
				if (err){
					return res.status(500).json({status: "failure", message: err }); 
				}
				links[current] = u;
				get_urls();
			})
		})()


		/*
		var url = '';
		try {
			url = global.utils.kube.svc(result.deployment.main_service, result.meta.author.username).url();
			console.log("DEBUG 3");
			res.end('{"status" : "success", "message" : "'+url+'"}');
		}
		catch(e){
			console.log("Exception Caught : "+e);
			res.status(500).end(JSON.stringify({status : "failure", message : 'Could not get the url for sevice "'+result.deployment.main_service+'" '}));
		}
		*/
		
	});
});



module.exports = router;