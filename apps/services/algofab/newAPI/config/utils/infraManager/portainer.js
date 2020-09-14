
const request = require('request'), settings = require('../../settings'), YAML = require('yaml');

const hostPorts = require("../hostPorts"), validateSpecAgainstSchema = require('./validateSpecAgainstSchema');

const portainerConnectionOptions = {
	url: settings.infraManager && settings.infraManager.docker && settings.infraManager.docker.portainerUrl? settings.infraManager.docker.portainerUrl : "http://localhost:9000",
	auth: {
		username: "admin",
		password: settings.infraManager && settings.infraManager.docker && settings.infraManager.docker.password? settings.infraManager.docker.password : "password"
	}
};

function fetchPortainerAPIParams(){
	return new Promise((resolve, reject)=>{
		// Initialize admin user account 
		request.post({ 
			url: portainerConnectionOptions.url+'/api/users/admin/init',
			body: JSON.stringify({ 
				Username: portainerConnectionOptions.auth.username, 
				Password: portainerConnectionOptions.auth.password 
			}),
			headers: { "Content-Type": "application/json" } 
		}, (error, res, body)=>{
			//console.log("[INIT] res.statusCode :", res.statusCode, "\n----");

			if (error) return reject(error);
			
			
			//if (res.statusCode != 201 && JSON.parse(body).message != ""){
			//	return reject(JSON.parse(body).message);
			//}
			
			
			// Authenticate the admin account
			request.post({ 
				url: portainerConnectionOptions.url+'/api/auth',
				body: JSON.stringify({ 
					Username: portainerConnectionOptions.auth.username, 
					Password: portainerConnectionOptions.auth.password 
				}),
				headers: { "Content-Type": "application/json" } 
			}, function(error, res, body){
				//console.log("error :", error, "\n----");
				//console.log("res.statusCode :", res.statusCode, "\n----");
				//console.log("body (", typeof body, ") :", body, "\n----");
				if (error || res.statusCode != 200){
					return reject( error || JSON.parse(body).message );
				}
				var authToken = JSON.parse(body).jwt;

				// Get enpoint
				request.get({ 
					url: portainerConnectionOptions.url+'/api/endpoints',
					headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` } 
				}, function(error, res, body){ 
					//console.log("[CE] error :", error, "\n----");
					//console.log("[CE] res.statusCode :", res.statusCode, "\n----");
					//console.log("[CE] body (", typeof body, ") :", body, "\n----");
					
					if (error || res.statusCode != 200){
						return reject( error || JSON.parse(body).message );
					}
					
					var endpoint = JSON.parse(body)[0];
					
					// Get Swarm
					request.get({ 
						url: portainerConnectionOptions.url+`/api/endpoints/${endpoint.Id}/docker/swarm`,
						//body: JSON.stringify(spec),
						headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` } 
					}, function(error, res, body){ 
						if (error || res.statusCode != 200){
							return reject( error || JSON.parse(body).message );
						}
						resolve({ authToken: authToken, endpoint: endpoint, swarm : JSON.parse(body) });
						//console.log(error || `[${res.statusCode}] ${JSON.stringify(JSON.parse(body), null, 2)}`);
					});
				});
			});
		});
	});
}



async function main(){
	//console.log("randomAvailablePortSync : ", await randomAvailablePortSync({min:8000,max:8005}));
	
	const portainerAPIParams = await fetchPortainerAPIParams();
	//console.log("portainerAPIParams:", portainerAPIParams);
	
	const API_VERSIONS = ["v1"];
	const MANIFEST_FORMATS = {
		"docker-container": {
			type: "object",
			properties: {
				image: { type: "string", required: true},
				ports: {
					type: "array",
					required: true,
					items: {
						type: "object",
						properties: {
							app_protocol: { type: "string", required: true },
							container_port: { type: "integer", required: true},
							host_port: { type: "integer", min: 30000, max: 32767, default: hostPorts.randomAvailablePortSync }
						}
					}
				}
			}
		}, 
		"docker-stack": {
			type: "object",
			required: true,
			properties: {
				version: { type: "string", required: true},
				services: { 
					type: "object", 
					required: true,
					notEmpty: true,
					properties: {
						'*': {
							type: "object",
							required: true,
							//keysMatch: '^[a-z0-9]+$',
							properties: {
								image: { type: "string", required: true, process: (name)=> { return name.split(':').length == 1? name+":latest": name} },
								volumes: {
									type: "array",
									items: { type: "string" }
								}
							}
						}
					} 
				},
				volumes: {
					type: "object",
					properties: {
						'*': { type: "object"}
					}
				}
			}
		}, 
		"kubernetes": {
			type: "object"
		}
	};

	class InfraManager {
		constructor(){}

		async validateDemoManifest(manifest){
			//
			return new Promise(async (resolve,reject)=>{
				if (!("apiVersion" in manifest && manifest.apiVersion)) {
					return reject(`MissingParamError: Field "apiVersion" is mandatory.`);
				}
				if (typeof manifest.apiVersion !== "string") {
					return reject(`FormatError: Field "apiVersion" has to be a string but got ${manifest.apiVersion instanceof Array ? "array": typeof manifest.apiVersion}.`);
				}
				if (API_VERSIONS.indexOf(manifest.apiVersion) < 0) {
					return reject(`ValueError: Field "apiVersion" has wrong value: "${manifest.apiVersion}" not supported. Please choose one of the following values: ${API_VERSIONS.join(', ')}.`);
				}


				if (!("format" in manifest && manifest.format)) {
					return reject(`MissingParamError: Field "format" is mandatory.`);
				}
				if (typeof manifest.format !== "string") {
					return reject(`FormatError: Field "format" has to be a string but got ${manifest.format instanceof Array ? "array": typeof manifest.format}.`);
				}
				if (Object.keys(MANIFEST_FORMATS).indexOf(manifest.format) < 0) {
					return reject(`ValueError: Field "format" has wrong value: "${manifest.format}" not supported. Please choose one of the following values: ${Object.keys(MANIFEST_FORMATS).join(', ')}.`);
				}

				if (!("spec" in manifest && manifest.spec)) {
					return reject(`MissingParamError: Field "spec" is mandatory.`);
				}
				if (manifest.spec.constructor.prototype !== ({}).constructor.prototype ){
					return reject(`FormatError: Field "spec" has to be an object but got ${manifest.spec instanceof Array ? "array": typeof manifest.spec}.`);
				}

				var newManifest = JSON.parse(JSON.stringify(manifest));
				newManifest.spec = await validateSpecAgainstSchema(manifest.spec, MANIFEST_FORMATS[manifest.format]);
				if (newManifest.spec instanceof Error) return reject(newManifest.spec);
				
				resolve(newManifest);
			});
		}

		async buildDemo(stack_name, manifest ){
			//
			return new Promise(async (resolve, reject)=>{
				try{ manifest = await this.validateDemoManifest(manifest); } catch(e) { return reject(e) }
				//console.log("Manifest is valid");

				if (manifest.format == "docker-container"){
					//
				}
				else if(manifest.format == "docker-stack"){
					//
					request.post({ 
						url: portainerConnectionOptions.url+`/api/stacks?type=1&method=string&endpointId=${portainerAPIParams.endpoint.Id}`,
						body: JSON.stringify({
							Name: stack_name,
							SwarmID: portainerAPIParams.swarm.ID,
							StackFileContent: YAML.stringify(manifest.spec)
						}),
						headers: { "Authorization": `Bearer ${portainerAPIParams.authToken}` } 
					}, function(error, res, body){ 
						if (error || res.statusCode != 200){
							return reject( error || JSON.parse(body).message );
						}

						//manifest.docker_response = JSON.parse(body);
						//console.log(error || `[${res.statusCode}] ${JSON.stringify(JSON.parse(body), null, 2)}`);
						resolve(JSON.parse(body));
					});
				}
				else{ //Kubernetes
					//
				}
			});
		}

		async removeDemo(manifest){
			//
			return new Promise(async (resolve, reject)=>{
				try{ manifest = await this.validateDemoManifest(manifest); } catch(e) { return reject(e) }
				//console.log("Manifest is valid");

				if (manifest.format == "docker-container"){
					//
				}
				else if(manifest.format == "docker-stack"){
					//
					
					request.delete({ 
						url: portainerConnectionOptions.url+`/api/stacks/${manifest.Id}?endpointId=${portainerAPIParams.endpoint.Id}`,
						headers: { "Authorization": `Bearer ${portainerAPIParams.authToken}` } 
					}, function(error, res, body){ 
						if (error || res.statusCode != 204){
							return reject( error || JSON.parse(body).message );
						}

						//manifest.docker_response = JSON.parse(body);
						//console.log(error || `[${res.statusCode}] ${JSON.stringify(JSON.parse(body), null, 2)}`);
						resolve();
					});
				}
				else{ //Kubernetes
					//
				}
			});
		}
	}

	var tests = async ()=>{
		console.log("Running infraManager tests");

		var im = new InfraManager();
		
		// try{
		// 	var result = await im.buildDemo("skante-super-demo1", {
		// 		apiVersion: "v1",
		// 		format: "docker-stack",
		// 		spec: {
		// 			version: "3",
		// 			services: {
		// 				nginx: {
		// 					image: "nginx"
		// 				}
		// 			}
		// 		}
		// 	});

		// 	console.log("[buildDemo] : ", result);
		// }
		// catch(e){
		// 	console.log("[buildDemoErr] : ", e);
		// }


		try{
			var result = await im.removeDemo({
				apiVersion: "v1",
				Id: 7,
				format: "docker-stack",
				spec: {
					version: "3",
					services: {
						nginx: {
							image: "nginx"
						}
					}
				}
			});

			console.log("[buildDemo] : ", result);
		}
		catch(e){
			console.log("[buildDemoErr] : ", e);
		}
		

	}

	tests();
}

//console.log(YAML.stringify({k1:"v1",k2:["v21","v22"]}));
main();
// 

class ContainerHandler{

	constructor(options){
		//console.log("New ContainerHandler primaryEndoint : ", options);

		this.portainerURL = options.portainerURL;
		this.adminPassword = options.adminPassword;
		this.jwt = options.jwt;
		this.primaryEndpoint = options.primaryEndpoint;

		this.CONTAINER_SPEC_INFO = {
			keys: ["hostname"],
			restrictions: ["attachstdin", "attachstdout", "attachstderr", "tty", "openstdin", "stdinonce", "networkingconfig"],
			required: {
				'image': { 'errorMsg': 'the key "image" is required.' }, 
				'hostconfig.portbindings': { 'errorMsg': 'the key "hostconfig.portbindings" (i.e key "hostconfig" in the container spec and key "portbindings" in "hostconfig" field) is required, pleasse specify a port binding so you app can be exposed on the internet.' }
			},
			hostconfigs_accepted: [ "portbindings" ]
		};

		this.HOST_PORT_INTERVAL = { min: 32000, max: 32767 };
	}

	spec_is_valid(spec){
		return new Promise((resolve, reject)=>{
			var l_spec = JSON.parse(JSON.stringify(spec).toLowerCase());

			for (var k in l_spec){
				// if (this.CONTAINER_SPEC_INFO.keys.indexOf(k) < 0){
				// 	return new Error(`KeyError: key "${k}" is not part of a container specification, more details on: https://docs.docker.com/engine/api/v1.30/#operation/ContainerCreate`);
				// }

				if (this.CONTAINER_SPEC_INFO.restrictions.indexOf(k) >= 0){
					return reject(new Error(`Algofab restricts the use of the key "${k}"`));
				}

			}

			for(var r in this.CONTAINER_SPEC_INFO.required){
				var r_parts = r.split('.'), check_against = l_spec;

				for(var i=0; i < r_parts.length; i++){
					if( !(r_parts[i] in check_against) ){
						return reject(new Error(`MissingKeyError: ${this.CONTAINER_SPEC_INFO.required[r].errorMsg}`));
					}
					check_against = check_against [ r_parts[i] ];
				}
			}


			// Checking port bindings
			var ports = Object.keys(l_spec.hostconfig.portbindings);

			var check_next_port = ()=>{
				if (ports.length == 0){
					return resolve();
				}
				var p = ports.shift();

				if ( !/^[0-9]{1,5}\/(tcp|udp)$/.test(p) ){
					return reject(new Error(`PortNamingError: in "hostconfig.portbindings", every key should follow the following pattern: <port number>/<tcp or udp>, which the specified key "${p}" does not follow.`));
				}
				var port_config = l_spec.hostconfig.portbindings[p];
				if ( !(port_config instanceof Array) ){
					return reject(new Error(`PortSpecificationError: in "hostconfig.portbindings", the value expected from port "${p}" is an Array of object`));
				}
				else if (port_config.length != 1){
					return reject(new Error(`PortSpecificationError: in "hostconfig.portbindings", we expect the port "${p}" to have exactly one element (in the array).`));
				}

				if (!('hostport' in port_config[0])){
					return reject(new Error(`PortSpecificationError: in "hostconfig.portbindings", port ${p}, field "hostport" is missing`));
				}

				if (isNaN(parseInt(port_config[0].hostport))){
					return reject(new Error(`PortSpecificationError: in "hostconfig.portbindings", port ${p}, field "hostport" is not a port number.`));
				}

				if (port_config[0].hostport < this.HOST_PORT_INTERVAL.min || port_config[0].hostport > this.HOST_PORT_INTERVAL.max){
					return reject(new Error(`PortSpecificationError: in "hostconfig.portbindings", port ${p}, Algofab restricts the "hostport" filed between ${this.HOST_PORT_INTERVAL.min} and ${this.HOST_PORT_INTERVAL.max}.`));				
				}

				portAvailable( parseInt(port_config[0].hostport), function(port_dispo){
					if ( !port_dispo ){
						return reject(new Error(`PortSpecificationError: in "hostconfig.portbindings", port ${p}, the "hostport" ${port_config[0].hostport} is no longer available.`));				
					}
					check_next_port();
				});
			}
			check_next_port();
		});
	}

	list(){
		return new Promise((resolve, reject)=>{
			
			request.get({ 
				url: this.portainerURL+`/api/endpoints/${this.primaryEndpoint.Id}/docker/containers/json`,
				headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.jwt}` } 
			}, function(error, res, body){ 
				//console.log("[C_LIST] error :", error, "\n----");
				//console.log("[C_LIST] res.statusCode :", res.statusCode, "\n----");
				//console.log("[C_LIST] body (", typeof body, ") :", body, "\n----");
				
				if (error || res.statusCode != 200){
					return reject( error || JSON.parse(body).message );
				}
				
				resolve(JSON.parse(body));
				
			});
		});
	}
	
	create(spec){
		var l_spec = JSON.parse(JSON.stringify(spec).toLowerCase());
		
		return new Promise((resolve, reject)=>{
			this.spec_is_valid(spec).then(()=>{
				//this.images_pull_one(l_spec.image).then(()=>{
					request.post({ 
						url: this.portainerURL+`/api/endpoints/${this.primaryEndpoint.Id}/docker/containers/create`,
						body: JSON.stringify(spec),
						headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.jwt}` } 
					}, function(error, res, body){ 
						//console.log("[C_CREATE] error :", error, "\n----");
						//console.log("[C_CREATE] res.statusCode :", res.statusCode, "\n----");
						//console.log("[C_CREATE] body (", typeof body, ") :", body, "\n----");
						
						if (error || res.statusCode != 200){
							return reject( error || JSON.parse(body).message );
						}
						
						resolve(JSON.parse(body));
					});
				// }).catch( e=> {
				// 	return reject(e);
				// });
			}).catch( e=> {
				return reject(e);
			});
		});	
	}
	
	start_stop_restart(id, operation){
		return new Promise((resolve, reject)=>{
			
			request.post({ 
				url: this.portainerURL+`/api/endpoints/${this.primaryEndpoint.Id}/docker/containers/${id}/${operation}`,
				//body: JSON.stringify(spec),
				headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.jwt}` } 
			}, function(error, res, body){ 
				//console.log("[C_START] error :", error, "\n----");
				console.log("[C_START] res.statusCode :", res.statusCode, "\n----");
				//console.log("[C_START] body (", typeof body, ") :", body, "\n----");
				console.log("body: ", body);

				var ok_start = operation == "start" && (res.statusCode == 204 || res.statusCode == 304);  
				var ok_restart = operation == "restart" && res.statusCode == 204;  
				var ok_stop = operation == "stop" && (res.statusCode == 204 || res.statusCode == 304);  
				
				const ok = ok_start || ok_restart || ok_stop;
				
				if (error || !ok){
					return reject( error || JSON.parse(body).message );
				}
				
				resolve();
			});
		});
	}

	start(id){ return this.start_stop_restart(id, "start"); }
	stop(id){ return this.start_stop_restart(id, "stop"); }
	restart(id){ return this.start_stop_restart(id, "restart"); }

	remove_one(id, options){
		if (typeof options === 'undefined'){
			options = {
				v: true, // remove associated volumes
				force: false, 
				link: false // remove the specified link associated with the container
			};
		}
		//console.log("options: ", options);
		
		var query = !("v" in options) || options.v == true ? "?v=true" : ""; // option v is true wheter it is specified as such or not specified at all.
		//console.log("query: ", query);
		query = "force" in options && options.force == true ? (query == "" ? "?force=true" : query+"&force=true") : query;
		//console.log("query: ", query);
		query = "link" in options && options.link == true ? (query == "" ? "?link=true" : query+"&link=true") : query;
		//console.log("query: ", query);
			
		return new Promise((resolve, reject)=>{
			
			request.delete({ 
				url: this.portainerURL+`/api/endpoints/${this.primaryEndpoint.Id}/docker/containers/${id}${query}`,
				//body: JSON.stringify(spec),
				headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.jwt}` } 
			}, function(error, res, body){ 
				//console.log("[C_REMOVE] error :", error, "\n----");
				console.log("[C_REMOVE] res.statusCode :", res.statusCode, "\n----");
				//console.log("[C_REMOVE] body (", typeof body, ") :", body, "\n----");
				console.log("body: ", body);
				
				if (error || res.statusCode != 204){
					return reject( error || JSON.parse(body).message );
				}
				
				resolve();
			});
		});
	}

	remove(ids, options){

		if (typeof ids === 'string')
			return this.remove_one(ids, options);

		return new Promise((resolve, reject)=>{
			if ( !(ids instanceof Array))
				return reject('argument must be string or array of strings.');
			
			var idsCopy = JSON.parse(JSON.stringify(ids));
		
			var remove_next = ()=> {
				if (idsCopy.length == 0)
					return resolve();
				
				var id = idsCopy.shift();
				//console.log("pulling ", name);

				this.remove_one(id, options).then(()=>{ 
					remove_next(); 
				}).catch( e=> {
					if (e.toString().startsWith("No such container: ")){
						return remove_next();
					}
					reject(e);
				});
			}

			remove_next();
		});
	}
}

class ImagesHandler {

	constructor(options){
		//console.log("New ContainerHandler primaryEndoint : ", options);

		this.portainerURL = options.portainerURL;
		this.adminPassword = options.adminPassword;
		this.jwt = options.jwt;
		this.primaryEndpoint = options.primaryEndpoint;
	}

	is_present(name){
		if (name.split(':').length == 1 ){
			name += ':latest';
		}

		return new Promise((resolve, reject)=>{
			this.list().then(list=>{
				console.log("list : ", list);
				var found = list.map((i)=> i.RepoTags? i.RepoTags.indexOf(name) >= 0 : false ).reduce( (a, b)=> a || b );
				if (found)
					resolve(true);
				else
					resolve(false);
			}).catch(reject);
		});
	}

	pull_one(name){
		if (name.split(':').length == 1 ){
			name += ':latest';
		}

		return new Promise((resolve, reject)=>{
			var url  = this.portainerURL+`/api/endpoints/${this.primaryEndpoint.Id}/docker/images/create?fromImage=${name}`
			//console.log("url :", url);

			request.post({ 
				url: url,
				headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.jwt}` } 
			}, function(error, res, body){ 
				//console.log("[I_PULL] error :", error, "\n----");
				//console.log("[I_PULL] res.statusCode :", res.statusCode, "\n----");
				//console.log("[I_PULL] body (", typeof body, ") :", body, "\n----");
				
				if (error || res.statusCode != 200){
					return reject( error || JSON.parse(body).message );
				}
				
				resolve(body);
				
			}).on('response', function(response){
				//console.log("[I_PULL] error :", error, "\n----");
				//console.log("[I_PULL] res.statusCode :", res.statusCode, "\n----");
				//console.log("[I_PULL] body (", typeof body, ") :", body, "\n----");
				var data = "";
				response.on('data', function(d){ 
					console.log("[", typeof d, "]: ", d.toString()); 
					data += d;
				});
			});
		});
	}

	pull(names){

		if (typeof names === 'string')
			return this.pull_one(names);

		return new Promise((resolve, reject)=>{
			if ( !(names instanceof Array))
				return reject('argument must be string or array of strings.');
			
			var namesCopy = JSON.parse(JSON.stringify(names));
		
			var pull_next = ()=> {
				if (namesCopy.length == 0)
					return resolve();
				
				var name = namesCopy.shift();
				//console.log("pulling ", name);

				this.pull_one(name).then(()=>{ 
					pull_next(); 
				}).catch( e=> {
					reject(e);
				});
			}

			pull_next();
		});
	}

	list() {
		return new Promise((resolve, reject)=>{
			
			request.get({ 
				url: this.portainerURL+`/api/endpoints/${this.primaryEndpoint.Id}/docker/images/json`,
				//url: `https://index.docker.io/v2`,
				headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.jwt}` } 
			}, function(error, res, body){ 
				//console.log("[I_LIST] error :", error, "\n----");
				//console.log("[I_LIST] res.statusCode :", res.statusCode, "\n----");
				//console.log("[I_LIST] body (", typeof body, ") :", body, "\n----");
				
				if (error || res.statusCode != 200){
					return reject( error || JSON.parse(body).message );
				}
				
				resolve(JSON.parse(body));
			});
		});
	}

	remove_one(name){
		if (name.split(':').length == 1 ){
			name += ':latest';
		}

		return new Promise((resolve, reject)=>{
			
			request.delete({ 
				url: this.portainerURL+`/api/endpoints/${this.primaryEndpoint.Id}/docker/images/${name}`,
				//url: `https://index.docker.io/v2`,
				headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.jwt}` } 
			}, function(error, res, body){ 
				//console.log("[I_LIST] error :", error, "\n----");
				//console.log("[I_LIST] res.statusCode :", res.statusCode, "\n----");
				//console.log("[I_LIST] body (", typeof body, ") :", body, "\n----");
				
				if (error || res.statusCode != 200){
					return reject( error || JSON.parse(body).message );
				}
				try{
					resolve(JSON.parse(body));
				}
				catch(e){
					console.log(e);
					resolve();
				}
			});
		});
	}

	remove(names){

		if (typeof names === 'string')
			return this.remove_one(names);

		return new Promise((resolve, reject)=>{
			if ( !(names instanceof Array))
				return reject('argument must be string or array of strings.');
			
			var namesCopy = JSON.parse(JSON.stringify(names));
		
			var remove_next = ()=> {
				if (namesCopy.length == 0)
					return resolve();
				
				var name = namesCopy.shift();
				//console.log("pulling ", name);

				this.remove_one(name).then(()=>{ 
					remove_next(); 
				}).catch( e=> {
					if (e.toString().startsWith("No such image: ")){
						return remove_next();
					}
					reject(e);
				});
			}

			remove_next();
		});
	}
}

class StackManager {

	constructor(options){
		//console.log("New ContainerHandler primaryEndoint : ", options);

		this.portainerURL = options.portainerURL;
		this.adminPassword = options.adminPassword;
		this.jwt = options.jwt;
		this.primaryEndpoint = options.primaryEndpoint;
	}


}

class PortainerAPI {
	
	
	
	constructor(options){
		this.portainerURL = process.env.PORTAINER_URL;
		this.adminPassword = process.env.PORTAINER_ADMIN_PASSWORD;
		
		if (options && "portainerURL" in options){
			this.portainerURL = options.portainerURL;
		}
		if (options && "adminPassword" in options){
			this.adminPassword = options.adminPassword;
		}


		this.authenticate().then((jwt)=>{
			console.log("TOKEN RECEIVED : ", jwt);
			this.jwt = jwt;
			
			this.createEndpoint().then((primaryEndpoint)=>{
				//console.log("Endpoint created : ", primaryEndpoint);
				console.log("Endpoint created");
				this.primaryEndpoint = primaryEndpoint;

				var handlers_options = {
					portainerURL: this.portainerURL, 
					adminPassword: this.adminPassword, 
					jwt: this.jwt,
					primaryEndpoint: this.primaryEndpoint
				}

				this.containers = new ContainerHandler(handlers_options);
				this.images = new ImagesHandler(handlers_options);
			}).catch((e)=>{
				console.log(e);
			});
		}).catch((e)=>{
			console.log(e);
		});
	}
	
	authenticate(){
		return new Promise((resolve, reject)=>{
			// Initialize admin user account 
			request.post({ 
				url: this.portainerURL+'/api/users/admin/init',
				body: JSON.stringify({ Username: "admin", Password: this.adminPassword }),
				headers: { "Content-Type": "application/json" } 
			}, (error, res, body)=>{
				console.log("[INIT] res.statusCode :", res.statusCode, "\n----");
				
				if (error) return reject(error);
				
				
				//if (res.statusCode != 201 && JSON.parse(body).message != ""){
				//	return reject(JSON.parse(body).message);
				//}
				
				
				// Authenticate the admin account
				request.post({ 
					url: this.portainerURL+'/api/auth',
					body: JSON.stringify({ Username: "admin", Password: this.adminPassword }),
					headers: { "Content-Type": "application/json" } 
				}, function(error, res, body){
					//console.log("error :", error, "\n----");
					//console.log("res.statusCode :", res.statusCode, "\n----");
					//console.log("body (", typeof body, ") :", body, "\n----");
					if (error || res.statusCode != 200){
						return reject( error || JSON.parse(body).message );
					}
					resolve(JSON.parse(body).jwt);
				});
			});
		});
	}
	
	createEndpoint(){
		return new Promise((resolve, reject)=>{
			//request.post({ 
			request.get({ 
				url: this.portainerURL+'/api/endpoints',
				headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.jwt}` } 
			}, function(error, res, body){ 
				//console.log("[CE] error :", error, "\n----");
				//console.log("[CE] res.statusCode :", res.statusCode, "\n----");
				//console.log("[CE] body (", typeof body, ") :", body, "\n----");
				
				if (error || res.statusCode != 200){
					return reject( error || JSON.parse(body).message );
				}
				
				resolve(JSON.parse(body)[0]);
				
			});
		});
	}
	
	run_one(spec){
		var l_spec = JSON.parse(JSON.stringify(spec).toLowerCase());
		return new Promise((resolve, reject)=>{
			if (! ('image' in l_spec)){
				return reject(new Error('MissingKeyError: key "image" is required.'));
			}

			this.images.is_present(l_spec.image).then((image_was_present)=>{
				this.images.pull(l_spec.image).then(()=>{
					this.containers.create(spec).then((container)=>{
						this.containers.start(container.Id).then(()=> resolve(container) ).catch(reject);
					}).catch(err=>{
						console.log("create failed !!!! ", image_was_present);
						reject(err);

						if (!image_was_present){
							this.images.remove(l_spec.image).then(()=>{ 
								console.log(`Image "${l_spec.image}" cleanned 'cause no longer needed.`); 
							}).catch(e=>{
								console.log(`Could'nt clean up the useless image "${l_spec.image}".`);
							})
						}
					});
				}).catch(reject);
			}).catch(reject);
		});
	}

	run(specs){
		if ( !(specs instanceof Array) ){
			return this.run_one(specs);
		}

		return new Promise((resolve, reject)=>{
			var index = 0, images_to_remove_in_case = [], created_containers = [];//JSON.parse(JSON.stringify(specs));
			
			var run_next = ()=> {
				if (index == specs.length)
					return resolve(created_containers);
				
				var spec = specs[index], l_spec = JSON.parse(JSON.stringify(spec).toLowerCase());
				//console.log("pulling ", name);
				this.images.is_present(l_spec.image).then((image_was_present)=>{
					
					
					
					this.run_one(spec).then((container)=>{ 
						if (!image_was_present) images_to_remove_in_case.push(l_spec.image);
						created_containers.push(container);

						index++;
						run_next(); 
					}).catch( e=> {
						reject(e);
						cleanup_created_containers();
					});
				});
			}
			
			var cleanup_created_containers = ()=>{
				if (created_containers.length == 0){
					console.log("Nothing to cleanup, everythin is well!!");
					return ;
				}

				this.containers.remove( created_containers.map(i=> i.Id), {force: true} ).then(()=>{
					console.log("Previously successfully created containers have all been removed for the sake of of coherence and maanaging our processing resources well.");
					if (images_to_remove_in_case.length == 0){
						console.log("No image to be cleanned, eveything is back to normal!!");
						return;
					};
					
					this.images.remove(images_to_remove_in_case).then(()=>{
						console.log("The no-longer-needed images are removed as well!!");
					}).catch(e=>{
						console.log("However, could not remove no-longer-needed images, reason: ", e);
					});
				}).catch(e=>{
					console.log("Could'nt remove previous containers to keep everythin clean, reason: ", e);
				});
			}

			run_next();
		});
	}
}



var runTest = ()=>{
	var pAPI = new PortainerAPI({adminPassword: "password", portainerURL: "http://localhost:9000"});
	var clusterID = "byhnn9ypc3j4i1hye5bab8jbq";
	var expleStack = `
	version: "3"

	services:
	  nginx:
	    image: nginx
	    ports:
	      - 8090:80
	`.split('\n').map(l => l.replace(/^\t/, '')).join('\n').trim();

	console.log(`expleStack: \n\n${expleStack}\n\n----`);
	setTimeout(()=>{ 
		//request.post({ 
		request.get({ 
			url: pAPI.portainerURL+`/api/endpoints/${pAPI.primaryEndpoint.Id}/docker/swarm`,
			//body: JSON.stringify(spec),
			headers: { "Content-Type": "application/json", "Authorization": `Bearer ${pAPI.jwt}` } 
		}, function(error, res, body){ 
			console.log(error || `[${res.statusCode}] ${JSON.stringify(JSON.parse(body), null, 2)}`);
		});

		request.post({ 
			url: pAPI.portainerURL+`/api/stacks?type=1&method=string&endpointId=${pAPI.primaryEndpoint.Id}`,
			body: JSON.stringify({
				Name: "myStack",
				SwarmID: "byhnn9ypc3j4i1hye5bab8jbq",
				StackFileContent: expleStack
			}),
			headers: { "Authorization": `Bearer ${pAPI.jwt}` } 
		}, function(error, res, body){ 
			console.log(error || `[${res.statusCode}] ${JSON.stringify(JSON.parse(body), null, 2)}`);
		});


		//console.log("pAPI.jwt : ", pAPI.jwt); 
		//console.log("pAPI.primaryEndpoint : ", pAPI.primaryEndpoint); 
		
		// pAPI.containers.list().then(function(list){
		// 	console.log("Container list : ", list);
		// });
		
		// pAPI.containers.create({
		// 	Name: "busy",
		// 	Image: "nginx",
		// 	HostConfig: { 
		// 		PortBindings: {
		// 			"80/tcp": [
		// 				{ 	
		// 					HostIP: "",
		// 					HostPort : "32123" 
		// 				} 
		// 			]
		// 		}
		// 	}
		// }).then(function(list){
		// 	console.log("Container Create : ", list);
		// }).catch(e=>{ console.log(e); });
		
		
		// pAPI.containers.stop("2145da3d95ed", "restart").then(function(list){
		// 	console.log("Container list : ", list);
		// }).catch(e=>{ console.log(e); });
		
		// pAPI.containers.remove("2145da3d95ed").then(function(list){
		// 	console.log("Container list : ", list);
		// }).catch(e=>{ console.log(e); });
		
		// pAPI.images.pull(["redis", "mysql"]).then(function(list){
		// 	console.log("Container list : ", list);
		// }).catch(e=>{ console.log(e); });

		// pAPI.images.list().then(function(list){
		// 	console.log("Container list : ", list);
		// }).catch(e=>{ console.log(e); });

		// pAPI.images.remove(["redis", "alpine"]).then(function(list){
		// 	console.log("Container list : ", list);
		// }).catch(e=>{ console.log(e); });

		// pAPI.images.is_present("ubuntu").then(function(list){
		// 	console.log("Container list : ", list);
		// }).catch(e=>{ console.log(e); });

		// pAPI.run_one({
		// 	Name: "busy",
		// 	Image: "nginx",
		// 	HostConfig: { 
		// 		PortBindings: {
		// 			"80/tcp": [
		// 				{ 	
		// 					HostIP: "",
		// 					HostPort : "32121" 
		// 				} 
		// 			]
		// 		}
		// 	}
		// }).then(function(list){
		// 	console.log("Container list : ", list);
		// }).catch(e=>{ console.log(e); });

		// pAPI.run([
		// 	{
		// 		Name: "busy",
		// 		Image: "nginx",
		// 		HostConfig: { 
		// 			PortBindings: {
		// 				"80/tcp": [
		// 					{ 	
		// 						HostIP: "",
		// 						HostPort : "32122" 
		// 					} 
		// 				]
		// 			}
		// 		}
		// 	},
		// 	{
		// 		Name: "redis",
		// 		Image: "redis",
		// 		HostConfig: { 
		// 			PortBindings: {
		// 				"80/tcp": [
		// 					{ 	
		// 						HostIP: "",
		// 						HostPort : "32122" 
		// 					} 
		// 				]
		// 			}
		// 		}
		// 	},
		// ]).then(function(list){
		// 	console.log("Container list : ", list);
		// }).catch(e=>{ console.log(e); });


	}, 1000);
}

//runTest();

module.exports = PortainerAPI;
