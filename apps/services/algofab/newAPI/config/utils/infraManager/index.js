
const request = require('request'), settings = require('../../settings'), YAML = require('yaml');

const hostPorts = require("../hostPorts"), validateSpecAgainstSchema = require('./validateSpecAgainstSchema');

const spawnSync = require('child_process').spawnSync;

const portainerConnectionOptions = {
	url: settings.infraManager && settings.infraManager.docker && settings.infraManager.docker.portainerUrl? settings.infraManager.docker.portainerUrl : "http://localhost:9000",
	auth: {
		username: "admin",
		password: settings.infraManager && settings.infraManager.docker && settings.infraManager.docker.password? settings.infraManager.docker.password : "password"
	}
};



function mkdirp(dir){
	spawnSync("mkdir", ["-p", dir], {shell: true});
}


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




	//console.log("randomAvailablePortSync : ", await randomAvailablePortSync({min:8000,max:8005}));
	
var portainerAPIParams = null; //= await fetchPortainerAPIParams();
//console.log("portainerAPIParams:", portainerAPIParams);

//const API_VERSIONS = ["v1"];
const DEMO_MANIFEST_FORMATS = {
	"v1": {
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
	}
};
const LIVE_DATA_MANIFEST_FORMATS = {
	"v1": {
		"empty": {
			type: "object",
			required: true,
			properties: {
				name: { type: "string", required: true },
				//description: {type: "string"},
				sshKeys: {
					type: "array",
					required: true,
					items: { type: "string" }
				}
			}
		}
	}
};

const ALGO_INSTANCE_MANIFEST_FORMATS = {
	"v1": {
		"*": {
			type: "object",
			required: true,
			properties: {
				name: { type: "string", required: true },
				//description: {type: "string"},
				settings: {
					type: "array",
					items: {
						type: "object",
						properties: {
							name: {type: "string", required: true},
							value: {type: "string", required: true},
						}
					}
				},
				container: {
					type: "object",
					properties: {
						image: { type: "string", required: true },
						ports: {
							type: "array",
							items :{
								type: "object",
								properties: {
									containerPort: {type: "integer", required: true}
								}
							}
						}
					}
				},
				liveDataMountPoints: {
					type: "array",
					items:{
						type: "object",
						properties: {
							name: { type: "string", required : true},
							liveDataID: {type: "string", required : true},
							mountPoint: {type: "string", required : true}
						}
					}
				}
			}
		}
	}
};

const waitTillOk = (condition, callback, maxWaitTime)=>{
	if (typeof maxWaitTime === 'undefined'){
		maxWaitTime = 20; // seconds
	}
	if (condition()) return callback();
	var totalTime = 0;
	var intervID = setInterval(()=>{
		if (condition()){
			clearInterval(intervID);
			return callback(null);
		}
		else{
			totalTime += 1000;
			if (totalTime >= maxWaitTime*1000){
				clearInterval(intervID);
				return callback("Timeout");
			}
		}
		console.log("waiting...");
	}, 1000);
}

class InfraManager {
	constructor(){
		if (portainerAPIParams == null){
			fetchPortainerAPIParams().then(p=> { 
				portainerAPIParams = p 
			}).catch( e=> {
				console.log(e);
				throw e;
			});
		}
	}

	async validateManifest(type, manifest){
		return new Promise(async (resolve,reject)=>{

			const MANIFEST_FORMATS = (type == "live-data")? LIVE_DATA_MANIFEST_FORMATS : (type == "algo-instance")? ALGO_INSTANCE_MANIFEST_FORMATS : DEMO_MANIFEST_FORMATS;
			
			if (!("apiVersion" in manifest && manifest.apiVersion)) {
				return reject(`MissingParamError: Field "apiVersion" is mandatory.`);
			}
			if (typeof manifest.apiVersion !== "string") {
				return reject(`FormatError: Field "apiVersion" has to be a string but got ${manifest.apiVersion instanceof Array ? "array": typeof manifest.apiVersion}.`);
			}
			if (Object.keys(MANIFEST_FORMATS).indexOf(manifest.apiVersion) < 0) {
				return reject(`ValueError: Field "apiVersion" has wrong value: "${manifest.apiVersion}" not supported. Please choose one of the following values: "${Object.keys(MANIFEST_FORMATS).join('", "')}".`);
			}

			if (!("type" in manifest && manifest.type)) {
				return reject(`MissingParamError: Field "type" is mandatory.`);
			}
			if (typeof manifest.type !== "string") {
				return reject(`FormatError: Field "type" has to be a string but got ${manifest.type instanceof Array ? "array": typeof manifest.type}.`);
			}
			if (Object.keys(MANIFEST_FORMATS[manifest.apiVersion]).indexOf(manifest.type) < 0) {
				if (!('*' in MANIFEST_FORMATS[manifest.apiVersion])){
					return reject(`ValueError: Field "type" has wrong value: "${manifest.type}" not supported. Please choose one of the following values: "${Object.keys(MANIFEST_FORMATS[manifest.apiVersion]).join('", "')}".`);
				}
			}

			/*
			if (!("unique_name" in manifest && manifest.unique_name)) {
				return reject(`MissingParamError: Field "unique_name" is mandatory.`);
			}
			if (typeof manifest.unique_name !== "string") {
				return reject(`FormatError: Field "unique_name" has to be a string but got ${manifest.unique_name instanceof Array ? "array": typeof manifest.unique_name}.`);
			}
			*/

			var newManifest = JSON.parse(JSON.stringify(manifest));
			newManifest.spec = await validateSpecAgainstSchema(manifest.spec, MANIFEST_FORMATS[manifest.apiVersion][ ('*' in MANIFEST_FORMATS[manifest.apiVersion]? '*': manifest.type)]);
			//console.log("manifest.spec: ", manifest.spec);
			(newManifest.spec instanceof Error)? reject(newManifest.spec) : resolve(newManifest);
		});
	}
	/*
	async validateDemoManifest(manifest){
		//
		return new Promise(async (resolve,reject)=>{
			if (!("apiVersion" in manifest && manifest.apiVersion)) {
				return reject(`MissingParamError: Field "apiVersion" is mandatory.`);
			}
			if (typeof manifest.apiVersion !== "string") {
				return reject(`FormatError: Field "apiVersion" has to be a string but got ${manifest.apiVersion instanceof Array ? "array": typeof manifest.apiVersion}.`);
			}
			if (Object.keys(DEMO_MANIFEST_FORMATS).indexOf(manifest.apiVersion) < 0) {
				return reject(`ValueError: Field "apiVersion" has wrong value: "${manifest.apiVersion}" not supported. Please choose one of the following values: "${Object.keys(DEMO_MANIFEST_FORMATS).join('", "')}".`);
			}


			if (!("type" in manifest && manifest.type)) {
				return reject(`MissingParamError: Field "type" is mandatory.`);
			}
			if (typeof manifest.type !== "string") {
				return reject(`FormatError: Field "type" has to be a string but got ${manifest.type instanceof Array ? "array": typeof manifest.type}.`);
			}
			if (Object.keys(DEMO_MANIFEST_FORMATS[manifest.apiVersion]).indexOf(manifest.type) < 0) {
				return reject(`ValueError: Field "type" has wrong value: "${manifest.type}" not supported. Please choose one of the following values: "${Object.keys(DEMO_MANIFEST_FORMATS[manifest.apiVersion]).join('", "')}".`);
			}

			if (!("spec" in manifest && manifest.spec)) {
				return reject(`MissingParamError: Field "spec" is mandatory.`);
			}
			if (manifest.spec.constructor.prototype !== ({}).constructor.prototype ){
				return reject(`FormatError: Field "spec" has to be an object but got ${manifest.spec instanceof Array ? "array": typeof manifest.spec}.`);
			}

			var newManifest = JSON.parse(JSON.stringify(manifest));
			newManifest.spec = await validateSpecAgainstSchema(manifest.spec, DEMO_MANIFEST_FORMATS[manifest.apiVersion][manifest.format]);
			if (newManifest.spec instanceof Error) return reject(newManifest.spec);
			
			resolve(newManifest);
		});
	}
	*/

	deployStack(stack_name, stack_json) {
		return new Promise((resolve, reject)=>{
			request.post({ 
				url: portainerConnectionOptions.url+`/api/stacks?type=1&method=string&endpointId=${portainerAPIParams.endpoint.Id}`,
				body: JSON.stringify({
					Name: stack_name,
					SwarmID: portainerAPIParams.swarm.ID,
					StackFileContent: YAML.stringify(stack_json)
				}),
				headers: { "Authorization": `Bearer ${portainerAPIParams.authToken}` } 
			}, function(error, res, body){ 
				if (error || res.statusCode != 200){
					return reject( error || JSON.parse(body).message );
				}

				//manifest.docker_response = JSON.parse(body);
				//console.log(error || `[${res.statusCode}] ${JSON.stringify(JSON.parse(body), null, 2)}`);
				resolve({deployed: stack_json, response: JSON.parse(body)});
			});
		});
	}

	async buildLiveData(manifest, author){
		//
		return new Promise( (resolve, reject)=>{
			//console.log("portainerAPIParams: ", portainerAPIParams);
			waitTillOk( ()=> portainerAPIParams != null, async (err)=>{
				//console.log("Reahced here!!! ###1");
				try{ var v_manifest = await this.validateManifest("live-data", manifest); } catch(e) { return reject(e) }
				//console.log("Manifest is valid");
				//console.log("Reahced here!!! ###2");
				
				if (v_manifest.type == "empty"){
					//
					//console.log("Reahced here!!! ###3");
				
					var nfs_dirname = `${author.profile.username}-${v_manifest.spec.name}`;
					
					mkdirp(`${settings.nfs_data_options.apiMountPoint}/live-data/${nfs_dirname}`);

					var hp = await hostPorts.randomAvailablePortSync();
					var stack = {
						version: "3",
						services: {
							sftp: {
								image: "algofab2018/sftp",
								ports: [ hp+':22' ],
								environment: [ "SFTP_PUB_KEYS="+v_manifest.spec.sshKeys.join(',') ],
								volumes: [ 'live_data:/live-data' ],
								//user: "1001:1001"
							}
						},
						volumes: {
							live_data: {
								driver_opts:{
									type: "nfs",
								    o: `addr=${settings.nfs_data_options.address},nolock,soft,rw`,
								    device: `:${settings.nfs_data_options.path}/live-data/${nfs_dirname}`
								}
							}
						}
					}

					//console.log("stack: ", JSON.stringify(stack, null, 2));
					this.deployStack(nfs_dirname, stack).then( resolve ). catch( reject );
					// request.post({ 
					// 	url: portainerConnectionOptions.url+`/api/stacks?type=1&method=string&endpointId=${portainerAPIParams.endpoint.Id}`,
					// 	body: JSON.stringify({
					// 		Name: nfs_dirname,
					// 		SwarmID: portainerAPIParams.swarm.ID,
					// 		StackFileContent: YAML.stringify(stack)
					// 	}),
					// 	headers: { "Authorization": `Bearer ${portainerAPIParams.authToken}` } 
					// }, function(error, res, body){ 
					// 	if (error || res.statusCode != 200){
					// 		return reject( error || JSON.parse(body).message );
					// 	}

					// 	//manifest.docker_response = JSON.parse(body);
					// 	//console.log(error || `[${res.statusCode}] ${JSON.stringify(JSON.parse(body), null, 2)}`);
					// 	resolve({deployed: stack, response: JSON.parse(body)});
					// });
				}
				else{ //Kubernetes
					//
					//console.log("Reahced here!!! ###4");
				}
				//console.log("Reahced here!!! ###5");
			});
		});
	}

	
	async buildAlgoInstance(manifest, author){
		//
		return new Promise( (resolve, reject)=>{
			//console.log("portainerAPIParams: ", portainerAPIParams);
			waitTillOk( ()=> portainerAPIParams != null, async (err)=>{
				//console.log("Reahced here!!! ###1");
				try{ var v_manifest = await this.validateManifest("algo-instance", manifest); } catch(e) { return reject(e) }
				//console.log("Manifest is valid");
				//console.log("Reahced here!!! ###2");
				
				
				
				var stack_name = `${author.profile.username}-${v_manifest.spec.name}`;
				
				//mkdirp(`${settings.nfs_data_options.apiMountPoint}/live-data/${nfs_dirname}`);
				var service_algo = { image: v_manifest.spec.container.image, volumes:[] }, volumes = {};
				if (v_manifest.spec.container.ports){
					//console.log("v_manifest.spec.container.ports [before] : ", v_manifest.spec.container.ports);
					for (var i=0; i<v_manifest.spec.container.ports.length; i++){
						v_manifest.spec.container.ports[i].hostPort = await hostPorts.randomAvailablePortSync();
					}
					//console.log("v_manifest.spec.container.ports [after] : ", v_manifest.spec.container.ports);
					service_algo.ports = v_manifest.spec.container.ports.map(p=> p.hostPort+':'+p.containerPort);
				}

				if (v_manifest.spec.settings){
					service_algo.environment = v_manifest.spec.settings.map(e=> 'ALGO_INPUT_'+e.name.toUpperCase()+'='+e.value);
				}

				if (v_manifest.spec.liveDataMountPoints){
					v_manifest.liveDataMountPoints.forEach((ld)=>{
						var vol_name = ld.liveData.spec.info.name+'_live_data';
						volumes[vol_name] = {external: true};
						service_algo.volumes.push(vol_name+':'+ld.mountPoint);
					});
				}
				
				var stack = {
					version: "3",
					services: {
						algo: service_algo
					},
					volumes: volumes
				}
				if (Object.keys(volumes).length == 0){
					delete stack.volumes
					delete stack.services.algo.volumes
				}
				console.log("stack: \n", YAML.stringify(stack));

				this.deployStack(stack_name, stack).then( resolve ). catch( reject );
				
				// request.post({ 
				// 	url: portainerConnectionOptions.url+`/api/stacks?type=1&method=string&endpointId=${portainerAPIParams.endpoint.Id}`,
				// 	body: JSON.stringify({
				// 		Name: nfs_dirname,
				// 		SwarmID: portainerAPIParams.swarm.ID,
				// 		StackFileContent: YAML.stringify(stack)
				// 	}),
				// 	headers: { "Authorization": `Bearer ${portainerAPIParams.authToken}` } 
				// }, function(error, res, body){ 
				// 	if (error || res.statusCode != 200){
				// 		return reject( error || JSON.parse(body).message );
				// 	}

				// 	//manifest.docker_response = JSON.parse(body);
				// 	//console.log(error || `[${res.statusCode}] ${JSON.stringify(JSON.parse(body), null, 2)}`);
				// 	resolve({deployed: stack, response: JSON.parse(body)});
				// });
				
			});
		});
	}

	async removeStack(stackId){
		//
		return new Promise( (resolve, reject)=>{
			//console.log("stackID : ", stackId);
			waitTillOk( ()=> portainerAPIParams != null, async (err)=>{
				request.delete({ 
					url: portainerConnectionOptions.url+`/api/stacks/${stackId}?endpointId=${portainerAPIParams.endpoint.Id}`,
					headers: { "Authorization": `Bearer ${portainerAPIParams.authToken}` } 
				}, function(error, res, body){ 
					if (error || res.statusCode != 204){
						return reject( error || JSON.parse(body).message );
					}

					//manifest.docker_response = JSON.parse(body);
					//console.log(error || `[${res.statusCode}] ${JSON.stringify(JSON.parse(body), null, 2)}`);
					resolve();
				});
			});
		});
	}
	async buildDemo(stack_name, manifest){
		//
		return new Promise(async (resolve, reject)=>{
			try{ var v_manifest = await this.validateDemoManifest("demo", manifest); } catch(e) { return reject(e) }
			//console.log("Manifest is valid");

			if (v_manifest.type == "docker-container"){
				//
			}
			else if(v_manifest.type == "docker-stack"){
				//
				request.post({ 
					url: portainerConnectionOptions.url+`/api/stacks?type=1&method=string&endpointId=${portainerAPIParams.endpoint.Id}`,
					body: JSON.stringify({
						Name: v_manifest.unique_name,
						SwarmID: portainerAPIParams.swarm.ID,
						StackFileContent: YAML.stringify(v_manifest.spec)
					}),
					headers: { "Authorization": `Bearer ${portainerAPIParams.authToken}` } 
				}, function(error, res, body){ 
					if (error || res.statusCode != 200){
						return reject( error || JSON.parse(body).message );
					}

					//manifest.docker_response = JSON.parse(body);
					//console.log(error || `[${res.statusCode}] ${JSON.stringify(JSON.parse(body), null, 2)}`);
					resolve({deployed: v_manifest, response: JSON.parse(body)});
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
			//try{ var v_manifest = await this.validateDemoManifest("demo",manifest); } catch(e) { return reject(e) }
			
			if (manifest.type == "docker-container"){
				//
			}
			else if(manifest.type == "docker-stack"){
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

//tests();


module.exports = InfraManager;

// main().then((infraManager) =>{ 
// 	module.exports = infraManager ;
// }).catch(e=>{ 
// 	console.log(e);
// 	throw e; 
// });
//module.exports = ;
