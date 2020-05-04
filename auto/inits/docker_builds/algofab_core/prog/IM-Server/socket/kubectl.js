
var fs = require('fs');
var request = require('request');

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
var API_TOKEN = fs.readFileSync("/var/run/secrets/kubernetes.io/serviceaccount/token");
var K8S_API = `https://${process.env.KUBERNETES_SERVICE_HOST}:${process.env.KUBERNETES_PORT_443_TCP_PORT}/api/v1`;

console.log("API_TOKEN: "+API_TOKEN);
console.log("K8S_API: "+K8S_API);

var accepted_kinds = ["namespaces", "pods", "services", "replicationcontrollers", "events"];

var k8s_object_create_validator = {
	pods : (get_objects) => {
		//console.log("Status : "+get_objects['status']["phase"]);
		if (get_objects['status']["phase"] == "Running"){
			//clearTimeout(intervID);
			//return resolve();
			return true;
		}
		//console.log(JSON.stringify(get_objects['status']["containerStatuses"], null, 2)+"\n\n");
		var cStatus = get_objects['status']["containerStatuses"]
		for(var i=0; i < cStatus.length; i++){
			if ("waiting" in cStatus[i]["state"] && "message" in cStatus[i]["state"]["waiting"]){
				//clearTimeout(intervID);
				//return reject(cStatus[i]["state"]["waiting"]["message"]);
				return new Error(cStatus[i]["state"]["waiting"]["message"]);
			}
		}
	}
}




var kubectl = (ns) => {
	
	var _get = (spec, fieldSelectors) => {
		if (typeof fieldSelectors === 'undefined')
			fieldSelectors = {}
		return new Promise((resolve, reject)=>{
			var kind = spec.kind;
			kind = accepted_kinds.indexOf(kind.toLowerCase()) >=0? kind.toLowerCase(): 
				accepted_kinds.indexOf(kind.toLowerCase()+'s') >= 0 ? kind.toLowerCase()+'s': null;

			if (kind == null)
				return reject("Kind "+spec.kind+ " unsupported.")
			var fieldSelector = '';
			for (k in fieldSelectors)
				fieldSelector += k+'='+fieldSelectors[k]+',';
			fieldSelector = fieldSelector.replace(/\,$/, '');

			var options = {
				url: K8S_API+'/namespaces/'+ns+((kind == 'namespaces')? '': ('/'+kind+'/'+(spec.metadata.name? spec.metadata.name: '' )) )+'?pretty=true&fieldSelector='+fieldSelector,
				method: 'GET',
				headers: {
					"Authorization": "Bearer "+API_TOKEN
				}
			}

			request(options, (error, response, body)=>{
				console.log("error : "+error);
				console.log(`GET ${spec.kind} ${spec.metadata.name}, Status: ${response.statusCode}`);
				//console.log("body : "+body);
				if (error || (response.statusCode != 200 && response.statusCode != 201))
					return reject(error || JSON.parse(body).message)
				resolve(JSON.parse(body));
			});
		});
	}

	var _get_using_labels = (kind, labels)=> {

		return new Promise((resolve, reject)=>{
			var kind_ = kind;
			kind_ = accepted_kinds.indexOf(kind.toLowerCase()) >=0? kind_.toLowerCase(): 
				accepted_kinds.indexOf(kind_.toLowerCase()+'s') >= 0 ? kind_.toLowerCase()+'s': null;

			if (kind_ == null)
				return reject("Kind "+kind+ " unsupported.")
			var labelSelector = Object.entries(labels).map( (e) => e[0]+"="+e[1] ).join(',');
			
			var options = {
				url: K8S_API+'/namespaces/'+ns+'/'+kind_+'?labelSelector='+labelSelector+'&pretty=true',
				method: 'GET',
				headers: {
					"Authorization": "Bearer "+API_TOKEN
				}
			}

			request(options, (error, response, body)=>{
				console.log("url : "+options.url);
				console.log("error : "+error);
				console.log(`GET ${kind} using labels ${labelSelector}, Status: ${response.statusCode}`);
				//console.log("body : "+body);
				if (error || (response.statusCode != 200 && response.statusCode != 201))
					return reject(error || JSON.parse(body).message)
				resolve(JSON.parse(body));
			});
		});
	}

	var delete_pod = (spec, options, cb) => {
		request(options, (error, response, body)=>{
			// console.log("error : "+error);
			console.log(`DELETE POD ${spec.metadata.name}, Status: ${response.statusCode}`);
			// console.log("body : "+JSON.stringify(JSON.parse(body)['spec']) );
			if (error || (response.statusCode != 200 && response.statusCode != 201))
				return cb(error || JSON.parse(body).message)
			
			var intervID = setInterval(()=> {
				_get(spec)/*.then( (gotten) => {
				
					console.log("status: " + gotten['status']["phase"]);
					console.log(JSON.stringify(gotten['status']["containerStatuses"], null, 2)+"\n\n");
					
				})*/.catch( (reason)=> {
					clearTimeout(intervID);
					if(reason.endsWith("not found")){
						return cb();
					}

					cb(reason);
				} );
			
			}, 1000);
		});
	}

	var create_pod = (spec, options, cb) => {
		request(options, (error, response, body)=>{
			// console.log("error : "+error);
			console.log(`CREATE POD ${spec.metadata.name}, Status: ${response.statusCode}`);
			// console.log("body : "+JSON.stringify(JSON.parse(body)['spec']) );
			if (error || (response.statusCode != 200 && response.statusCode != 201))
				return cb(error || JSON.parse(body).message)
			
			var intervID = setInterval(()=> {
				_get(spec).then( (gotten) => {
					if (gotten['status']["phase"] == "Running"){
						clearTimeout(intervID);
						return cb();
					}
					
					//console.log(JSON.stringify(gotten['status']["containerStatuses"], null, 2)+"\n\n");
					var cStatus = gotten['status']["containerStatuses"]
					for(var i=0; i < cStatus.length; i++){
						if ("waiting" in cStatus[i]["state"] && "message" in cStatus[i]["state"]["waiting"]){
							clearTimeout(intervID);
							return cb(cStatus[i]["state"]["waiting"]["message"]);
						}
					}
				}).catch( (e)=> { clearTimeout(intervID); cb(e) } );
			}, 1000);
		});
	}

	var delete_pod_group = (labels, cb) => {
		_get_using_labels("Pod", labels).catch( cb ).then( (pod_group_object)=> {
			var pod_group = pod_group_object.items;
			(function delete_pods_one_by_one(error){
				if (pod_group.length == 0)
					return cb();
				if (error)
					return cb(error);

				var pod_spec = pod_group.shift();
				pod_spec.kind = "Pod";
				console.log("\n\n------ POD_SPEC : "+JSON.stringify(pod_spec, null, 2));
				var pod_option = {
					url: K8S_API+'/namespaces/'+ns+'/pods/'+pod_spec.metadata.name+'?pretty=true',
					method: 'DELETE',
					headers: {
						"Authorization": "Bearer "+API_TOKEN,
						"Content-Type": "application/json"
					}
				}
				
				delete_pod(pod_spec, pod_option, delete_pods_one_by_one );
			})()
		});
	}

	var create_ns = (spec, options, cb) => {
		
		console.log("OPTIONS : "+JSON.stringify(options, null, 2));
		request(options, (error, response, body)=>{
			// console.log("error : "+error);
			console.log(`CREATE NS ${spec.metadata.name}, Status: ${response.statusCode}`);
			// console.log("body : "+JSON.stringify(JSON.parse(body)['spec']) );
			if (error || (response.statusCode != 200 && response.statusCode != 201))
				return cb(error || JSON.parse(body).message)
			
			var intervID = setInterval(()=> {
				_get(spec).then( (gotten) => {
					if (gotten['status']["phase"] == "Active"){
						clearTimeout(intervID);
						return cb();
					}
				}).catch( (e)=> { clearTimeout(intervID); cb(e) } );
			}, 1000);
		});
	}

	var delete_ns = (spec, options, cb) => {
		request(options, (error, response, body)=>{
			// console.log("error : "+error);
			console.log(`DELETE POD ${spec.metadata.name}, Status: ${response.statusCode}`);
			// console.log("body : "+JSON.stringify(JSON.parse(body)['spec']) );
			if (error || (response.statusCode != 200 && response.statusCode != 201))
				return cb(error || JSON.parse(body).message)
			
			var intervID = setInterval(()=> {
				_get(spec).catch( (reason)=> {
					clearTimeout(intervID);
					if(reason.endsWith("not found")){
						return cb();
					}
					cb(reason);
				});
			
			}, 1000);
		});
	}

	var delete_rc = (spec, options, cb) => {
		request(options, (error, response, body)=>{
			// console.log("error : "+error);
			console.log(`DELETE RC ${spec.metadata.name}, Status: ${response.statusCode}`);
			// console.log("body : "+JSON.stringify(JSON.parse(body)['spec']) );
			if (error || (response.statusCode != 200 && response.statusCode != 201))
				return cb(error || JSON.parse(body).message)
			
			var intervID = setInterval(()=> {
				_get(spec).catch( (reason)=> {
					clearTimeout(intervID);
					if(!reason.endsWith("not found")){
						return cb(reason);
					}

					delete_pod_group(spec.spec.selector, cb );
				} );
			
			}, 1000);
		});
	}
	
	var create_rc = (spec, options, cb) => {
		request(options, (error, response, body)=>{
			// console.log("error : "+error);
			console.log(`CREATE RC ${spec.metadata.name}, Status: ${response.statusCode}`);
			// console.log("body : "+JSON.stringify(JSON.parse(body)['spec']) );
			if (error || (response.statusCode != 200 && response.statusCode != 201))
				return cb(error || JSON.parse(body).message)
			
			_get_using_labels("Pod", spec.spec.selector).catch( cb ).then( (pod_group_object)=> {
				var pod_group = pod_group_object.items;
				(function check_pods_status_one_by_one(error){
					if (pod_group.length == 0)
						return cb();
					if (error)
						return cb(error);

					var pod_spec = pod_group.shift();
					pod_spec.kind = "Pod";
					var intervID = setInterval(()=> {
						_get(pod_spec).then( (gotten) => {
							if (gotten['status']["phase"] == "Running"){
								clearTimeout(intervID);
								return check_pods_status_one_by_one();
							}
							
							//console.log(JSON.stringify(gotten['status']["containerStatuses"], null, 2)+"\n\n");
							var cStatus = gotten['status']["containerStatuses"]
							for(var i=0; i < cStatus.length; i++){
								if ("waiting" in cStatus[i]["state"] && "message" in cStatus[i]["state"]["waiting"]){
									clearTimeout(intervID);
									return check_pods_status_one_by_one(cStatus[i]["state"]["waiting"]["message"]);
								}
							}
						}).catch( check_pods_status_one_by_one );
					}, 1000);
				})()
				
			});
		});
	}
	
	var create_svc = (spec, options, cb) => {
		
		console.log("OPTIONS : "+JSON.stringify(options, null, 2));
		request(options, (error, response, body)=>{
			// console.log("error : "+error);
			console.log(`CREATE SVC ${spec.metadata.name}, Status: ${response.statusCode}`);
			// console.log("body : "+JSON.stringify(JSON.parse(body)['spec']) );
			if (error || (response.statusCode != 200 && response.statusCode != 201))
				return cb(error || JSON.parse(body).message)
			cb();
		});
	}

	var delete_svc = (spec, options, cb) => {
		
		console.log("OPTIONS : "+JSON.stringify(options, null, 2));
		request(options, (error, response, body)=>{
			// console.log("error : "+error);
			console.log(`DELETE SVC ${spec.metadata.name}, Status: ${response.statusCode}`);
			// console.log("body : "+JSON.stringify(JSON.parse(body)['spec']) );
			if (error || (response.statusCode != 200 && response.statusCode != 201))
				return cb(error || JSON.parse(body).message)
			cb();
		});
	}

	var _create = (spec)=>{
		return new Promise((resolve, reject)=>{
			//console.log("KIND is : "+kind);
			var kind = spec.kind;
			kind = accepted_kinds.indexOf(kind.toLowerCase()) >=0? kind.toLowerCase(): 
				accepted_kinds.indexOf(kind.toLowerCase()+'s') >= 0 ? kind.toLowerCase()+'s': null;

			if (kind == null)
				return reject("Kind "+spec.kind+ " unsupported.")
			
			var options = {
				url: K8S_API+'/namespaces'+((kind == 'namespaces')? '': ('/'+ns+'/'+kind)),
				method: 'POST',
				headers: {
					"Authorization": "Bearer "+API_TOKEN,
					"Content-Type": "application/json"
				},
				body: JSON.stringify(spec)
			}

			var callback = (err)=>{
				if (err){
					return reject(err.toString());
				}
				resolve();
			}

			console.log("KIND is : "+kind);
			if (kind == 'pods')
				create_pod(spec, options, callback);
			else if (kind == 'replicationcontrollers')
				create_rc(spec, options, callback);
			else if (kind == 'namespaces')
				create_ns(spec, options, callback);
			else if (kind == 'services')
				create_svc(spec, options, callback);
		});
	}

	var _delete = (spec)=>{
		return new Promise((resolve, reject)=>{
			var kind = spec.kind;
			kind = accepted_kinds.indexOf(kind.toLowerCase()) >=0? kind.toLowerCase(): 
				accepted_kinds.indexOf(kind.toLowerCase()+'s') >= 0 ? kind.toLowerCase()+'s': null;

			if (kind == null)
				return reject("Kind "+spec.kind+ " unsupported.")
			
			var options = {
				url: K8S_API+'/namespaces/'+ns+((kind == 'namespaces')? '': ('/'+kind+'/'+spec.metadata.name))+'?pretty=true',
				method: 'DELETE',
				headers: {
					"Authorization": "Bearer "+API_TOKEN,
					"Content-Type": "application/json"
				}
			}

			var callback = (err)=>{
				if (err){
					return reject(err.toString());
				}
				resolve();
			}
			if (kind == 'pods')
				delete_pod(spec, options, callback);
			else if (kind == 'replicationcontrollers')
				delete_rc(spec, options, callback);
			else if (kind == 'namespaces')
				delete_ns(spec, options, callback);
			else if (kind == 'services')
				delete_svc(spec, options, callback);
		});
	}

	return {
		get: _get,
		get_using_labels: _get_using_labels, 
		create: _create,
		delete: _delete
	}
}

module.exports = kubectl;
/*
var ns_toto = kubectl('toto');
ns_toto.create({kind: "Namespace", metadata: {name: "toto"}})
	.then(function(){ console.log("SUCCESS"); })
	.catch(function(reason){ console.log("Failure : "+reason); });

setTimeout(()=>{
	ns_toto.delete({kind: "Namespace", metadata: {name: "toto"}})
	.then(function(){ console.log("SUCCESS"); })
	.catch(function(reason){ console.log("Failure : "+reason); });
}, 5000);
*/

/*
var ns_algofab = kubectl('algofab');
ns_algofab.get({kind: "Pod", metadata: {name: "portal"}})
	.then(function(){ console.log("SUCCESS"); })
	.catch(function(reason){ console.log("Failure : "+reason); });
*/

/*
var ns_skante = kubectl('skante');
ns_skante.create({
	apiVersion: "v1",
	kind: "Pod",
	metadata:{
		labels: {
			app: "busybox"
		},
		name: "busybox"
	},
	spec: {
		containers: [
			{
				name: "busy",
				image: "busybox",
				command: ["/bin/sh"],
				args: ["-c", "while true; do echo hello; sleep 10;done"]
			}
		]
	}
}).then(function(){ console.log("SUCCESS"); })
	.catch(function(reason){ console.log("Failure : "+reason); });
*/

/*
var ns_skante = kubectl('skante');
ns_skante.delete({kind: "Pod", metadata: {name: "busybox"}})
	.then(function(){ console.log("SUCCESS"); })
	.catch(function(reason){ console.log("Failure : "+reason); });
*/

/*
var ns_skante = kubectl('skante');
ns_skante.create({
	apiVersion: "v1",
	kind: "ReplicationController",
	metadata:{
		name: "busybox"
	},
	spec: {
		replicas: 4,
		selector:{
			app: "busytag",
			author: "skante"
		},
		template:{
			metadata: {
				name: "busybro",
				labels:{
					app: "busytag",
					author: "skante"
				}
			},
			spec: {
				containers: [
					{
						name: "busy",
						image: "busybox",
						command: ["/bin/sh"],
						args: ["-c", "while true; do echo hello; sleep 10;done"]
					}
				]
			}
		}
	}
}).then(function(){ console.log("SUCCESS"); })
	.catch(function(reason){ console.log("Failure : "+reason); });

setTimeout(()=>{
	ns_skante.delete({
		kind: "ReplicationController", 
		metadata: {name: "busybox"}, 
		spec: { 
			selector: {
				app: "busytag",
				author: "skante"
			}
		} 
	}).then(function(){ console.log("SUCCESS"); })
		.catch(function(reason){ console.log("Failure : "+reason); });
}, 15000);
*/

/*
var ns_skante = kubectl('skante');
ns_skante.get_using_labels("Pod", {app: "busytag"})
	.then(function(results){ console.log("SUCCESS ("+results.items.length+" results found)"); })
	.catch(function(reason){ console.log("Failure : "+reason); });
*/

/*
var ns_skante = kubectl('skante');
ns_skante.get({
	apiVersion: "v1",
	kind: "Event",
	metadata: {
		//name : "helloworld",
		//namespace: "skante"
	}
}, {
	"involvedObject.name" : "helloworld",
	"involvedObject.namespace" : "skante",
	"involvedObject.kind" : "Pod"
})
	.then(function(results){ console.log("SUCCESS ("+JSON.stringify(results, null, 2)+" results found)"); })
	.catch(function(reason){ console.log("Failure : "+reason); });
*/

/*
var ns_skante = kubectl('skante');
ns_skante.create({
	apiVersion: "v1",
	kind: "Service",
	metadata: {
		name: "busybox"
	},
	spec: {
		selector: {
			app: "busytag"
		},
		ports: [
			{ port: 80, name: "http", targetPort: 3000 }
		]
	}
}).then(function(){ console.log("SUCCESS"); })
.catch(function(reason){ console.log("Failure : "+reason); });

setTimeout(()=>{
	ns_skante.delete({
		apiVersion: "v1",
		kind: "Service",
		metadata: {
			name: "busybox"
		}
	}).then(function(){ console.log("SUCCESS"); })
	.catch(function(reason){ console.log("Failure : "+reason); });
}, 4000);
*/


