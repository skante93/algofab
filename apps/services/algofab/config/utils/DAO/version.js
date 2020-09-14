
var mkdirp = require('mkdirp');
var spawnSync = require('child_process').spawnSync;
var fs = require('fs'), util = require('util');

const version_mask = /^[0-9]+\.[0-9]+\.[0-9]+$/;
const unscript_mask = /<(( )*|(\t)*)*script(.)*<(( )*|(\t)*)*\/(( )*|(\t)*)*script(( )*|(\t)*)*>/;

var User = global.mongo.model("User");
var Algos = global.mongo.model("Algos");
var AlgosMeta = global.mongo.model("AlgosMeta");
var User = global.mongo.model("User");


var meta = require('./algo');


var validator = {

	version : function(version, cb){
		if(!version){
			return cb("version is required.");
		}
		if( !version_mask.test(version) ){
			return cb("version is supposed to be in /^[0-9]+\\.[0-9]+\\.[0-9]+$/ format.");
		}
		return cb(null); 
	},

	versionSync : function(version){
		if( !version || !version_mask.test(version)) {
	        var msg = "Either version is empty or it is in the wrong format. This is the expected format : /^[0-9]+\\.[0-9]+\\.[0-9]+$/";
	        console.log(msg);
	        return new Error(msg);
	    }
	    return;
	},

	comment : function(comment, cb){
		console.log("comment : "+comment)
		try{
			comment = (comment instanceof Array)? comment.join('') : (typeof comment === 'string')? comment : undefined;
		}
		catch (e){
			return cb("Internal error.");
		}
		
		if (!comment){
			return cb("The comment is required.");
		}

		if( unscript_mask.test(comment) ){
			return cb("comment is not supposed to contain any script tag.");
		}

		return cb(null); 
	},

	UIO : function(uio){
		//
		if( !(uio.name && uio.mime_types) ){
            var msg = "UIO misses either field name or field mime_types (both are required).";
            console.log(msg);
            return new Error(msg);
        }

        if( !uio.required || (typeof uio.required !== 'boolean') )
            uio.required = false;

        return {
        	name : uio.name,
            mime_types : uio.mime_types,
            required : uio.required
        };
	},

	AUO : function(API, verb, io){
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
	            	var input_validation_result = validator.UIO(API[verb][i].inputs[j]);
	            	if(input_validation_result instanceof Error){
	            		var msg = "Field API."+verb+"["+i+"].inputs["+j+"] : "+input_validation_result.toString();
	            		console.log(msg);
	                    if(typeof io !== 'undefined')
	                        io.emit("Error", msg);
	                    return new Error(msg);
	                }
	                content_object.inputs.push(input_validation_result);
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
	},

	API : function(API, io, cb) {
		function cb_if_exists(args){ 
			if (typeof cb !== "undefined")
				cb(args) ;
		}
		if(!API){
			console.log(new Error("Error : The field API is required."));
            cb("Error : The field API is required.");
            return new Error("Error : The field API is required.");
        }

        var at_least_one_method = (API.GET && API.GET instanceof Array) || 
                                  (API.POST && API.POST instanceof Array) || 
                                  (API.PUT && API.PUT instanceof Array) || 
                                  (API.DELETE && API.DELETE instanceof Array);    

        if(!at_least_one_method){
            cb_if_exists("No VERB Given, if you did specify at least one, then checkout the format (Array of object expected).");
        	return new Error("No VERB Given, if you did specify at least one, then checkout the format (Array of object expected).")
        }

        var api_content = validator.AUO(API, 'GET', io);
        if(api_content instanceof Error){ cb_if_exists(api_content);  return api_content; }
        
        //------ FOR POST --------
        api_content = validator.AUO(API, 'POST', io);
        if(api_content instanceof Error){ cb_if_exists(api_content);  return api_content; }
        
        //------ FOR PUT --------
        api_content = validator.AUO(API, 'PUT', io);
        if(api_content instanceof Error){ cb_if_exists(api_content);  return api_content; }

        //------ FOR DELETE --------
        api_content = validator.AUO(API, 'DELETE', io);
        if(api_content instanceof Error){ cb_if_exists(api_content);  return api_content; }

        //  received.author = req.session.user._id
        cb_if_exists();
	},


	
	kubeBasic : function(specifications, authorsUsername){
		if(!specifications.apiVersion){
			var msg = 'Field "apiVersion" is not specified.'
            console.log(msg);
            return new Error(msg);
		}

		if(!specifications.kind){
			var msg = 'Field "kind" is not specified.'
            console.log(msg);
            return new Error(msg);
		}
		
		if(!specifications.metadata){
			var msg = 'Field "metadata" is not specified.'
            console.log(msg);
            return new Error(msg);
		}
		
		if(!specifications.metadata.name){
			var msg = 'Field "metadata.name" is not specified.'
            console.log(msg);
            return new Error(msg);
		}

		if( specifications.metadata.namespace && specifications.metadata.namespace != authorsUsername){
			var msg = 'Field "metadata.namespace" cannot be different from the author\'s username.'
            console.log(msg);
            return new Error(msg);
		}
		/*
		if( !specifications.spec){
			var msg = 'Field "spec" is not specified.'
            console.log(msg);
            return new Error(msg);
		}
		*/
	},

	kubePods : function(pod, authorsUsername){
		//
		var basics = validator.kubeBasic(pod, authorsUsername);
		if (basics instanceof Error)
			return basics;

		if(!pod.spec){
			var msg = 'Field "spec" is not specified.'
            console.log(msg);
            return new Error(msg);
		}

		if(pod.spec.volumes){
			var msg = 'Field "spec.volumes" is not YET supported.'
            console.log(msg);
            return new Error(msg);
		}
		/*
		if(pod.spec.imagePullSecrets){
			if( !(pod.spec.imagePullSecrets instanceof Array) ){
				var msg = 'Field "spec.imagePullSecrets" must be an array.'
	            console.log(msg);
	            return new Error(msg);
			}
			pod.spec.imagePullSecrets.push({name : "skante-registry-secret"});
			pod.spec.imagePullSecrets.push({name : "admin-private-secret"});
		}
		else{
			pod.spec.imagePullSecrets = [{name : "skante-registry-secret"}, {name : "admin-private-secret"}];
		}
		*/
		return pod;
	},

	kubeRCs : function(rc, authorsUsername){
		//
		var basics = validator.kubeBasic(rc, authorsUsername);
		if (basics instanceof Error)
			return basics;

		if(!rc.spec){
			var msg = 'Field "spec" is not specified.'
            console.log(msg);
            return new Error(msg);
		}
		if(!rc.spec.template){
			var msg = 'Field "spec.template" is not specified.'
            console.log(msg);
            return new Error(msg);
		}
		if(!rc.spec.template.spec){
			var msg = 'Field "spec.template.spec" is not specified.'
            console.log(msg);
            return new Error(msg);
		}
		/*
		if(rc.spec.template.spec.imagePullSecrets){
			if( !(rc.spec.template.spec.imagePullSecrets instanceof Array) ){
				var msg = 'Field "spec.imagePullSecrets" must be an array.'
	            console.log(msg);
	            return new Error(msg);
			}
			rc.spec.template.spec.imagePullSecrets.push({name : "skante-registry-secret"});
			rc.spec.template.spec.imagePullSecrets.push({name : "admin-private-secret"});
		}
		else{
			rc.spec.template.spec.imagePullSecrets = [{name : "skante-registry-secret"}, {name : "admin-private-secret"}];
		} 
		*/
	},
	kubeSecrets : function(secret, authorsUsername){
		//
		var basics = validator.kubeBasic(secret, authorsUsername);
		if (basics instanceof Error)
			return basics;

		if(!secret.type){
			var msg = 'Field "type" not found.'
            console.log(msg);
            return new Error(msg);
		}
		if(!secret.type == "kubernetes.io/dockerconfigjson"){
			var msg = 'Field "type" must be equal to "kubernetes.io/dockerconfigjson"'
            console.log(msg);
            return new Error(msg);
		}
		if(!secret.data){
			var msg = 'Field "data" not found.'
            console.log(msg);
            return new Error(msg);
		}
		if(!secret.data[".dockerconfigjson"]){
			var msg = 'Field ".dockerconfigjson" not found inside "secret.data".'
            console.log(msg);
            return new Error(msg);
		}
		else{
			var tkn = secret.data[".dockerconfigjson"]
			delete secret.data[".dockerconfigjson"];
			secret.data["dockerconfigjson"] = tkn;
		}
	},
	/*
	parseServicesInfo : function(services){ //services == deployment.services.[demo | api].
		
		var itemFormatTestRegex = /^(http|https|ws|wss):\/\/[a-z0-9_]+(:[a-z0-9_])?/;

		// Function that read a string formatted like:
		//		"<protocol (ex : http)>://<service_name>[:<svc_port_name>]" 
		// and parse it into an object like this : 
		//		{ protocol : "http", svc : "service_name", port : "svc_port_name" }. 
		var handleItem = function(i){
			//
			if(typeof i !== 'string' || !itemFormatTestRegex.test(i)){
				return new Error ( (typeof i !== 'string')? 'Format should be string' : 'item not correctly formatted, should be right by the "'+itemFormatTestRegex.toString()+'" regex.' )
			}
			console.log('======== handleItem ========');
			var split = i.split(/:\/\//);
			console.log("split : "+split);

			var protocol = split.shift();
			console.log("split : "+protocol);
			
			split = split.join('').split(':');
			console.log("split : "+split);
			
			console.log('======== handleItem ========');
			if (split.length == 1)
				return { protocol : protocol, svc : split[0] };
			else
				return { protocol : protocol, svc : split[0], port : split[1] };
		}

		if(services instanceof Array){
			var infos = services.map(function(item){
				return handleItem(item);		
			});
			console.log('+-+-+-+-+- handleItem (Arr) : '+util.inspect(infos)+' +-+-+-+-+-');
			
			for(var j=0; j<infos.length; j++)
				if(infos[j] instanceof Error)
					return new Error('item "'+j+'" : '+infos[j].toString());
			return infos;
		}
		else if(typeof services === 'string'){

			var infos = handleItem(services);
			console.log('+-+-+-+-+- handleItem () : '+util.inspect(infos)+' +-+-+-+-+-');
			return (infos instanceof Error)? infos : [infos];
		}
		else {
			return new Error("wrong format");
		}
	},
	*/
	mainServices : function(services, kubeArray){
		if(!services){
			var msg = 'Field "deployment.services" is required.';
			console.log(msg);
			return new Error(msg);
		}
		if(!services.demo){
			var msg = 'Field "deployment.services.demo" is required.';
			console.log(msg);
			return new Error(msg);
		}
		
		if( !services.api ){
			var msg = 'Field "deployment.services.api" is required.';
			console.log(msg);
			return new Error(msg);
		}

		
		
		
		var checkMainService = function(obj){
			
			for(var i=0; i<kubeArray.length; i++){

				// We found the object we're searching for.
				if(kubeArray[i].kind == "Service" && kubeArray[i].metadata.name == obj.svc){
					var ms = kubeArray[i];

					// Stop right there if it's not a NodePort type of service.
					if(!ms.spec.type || ms.spec.type != 'NodePort'){
						var msg = 'Service : "'+obj.svc+'" is not a NodePort type of svc.';
						console.log(msg);
						return msg;
					}

					var ports = ms.spec.ports;
					
					console.log(">>> Ports : "+util.inspect(ports));
					
					// See if spec.ports is correctly specified. 
					if(!ports || !(ports instanceof Array) || ports.length == 0) {
						var msg = 'Service : "'+obj.svc+'" does not have field spec.ports[*] or the format is wrong or its length is zero.';
						console.log(msg);
						return msg;
					}

					// If param portName is not specified by the user.
					console.log(">>> obj : "+util.inspect(obj));
					if(!obj.port_name){
						// If spec.ports contains only one port then that one is the default value therefore all is fine.
						
						if( ports.length ==1 ){ 
							console.log("ports[0].name : "+ports[0].name);
							if (!ports[0].name){
								var msg = "Please name the ports of your services."
								console.log(msg);
								return msg
							}
							obj.port_name = ports[0].name; 
							console.log(">>> obj : "+JSON.stringify(obj, null, 2));
							return; 
						};

						// Otherwise we have a problem cause we don't know wich port to choose. 
						var msg = 'Service : "'+obj.svc+'" has many ports but none was chosen.';
						console.log(msg);
						return msg;
					}

					// Param portName is specified, we search to see it is among ports.
					for(var j=0; j < ports.length; j++)
						// We found it, everything is good.
						if(ports[j].name == obj.port_name) return;
					
					// Could not find anything, we return an error message.
					var msg = 'Service : "'+obj.svc+'" we could not find the port with name "'+obj.port_name+'" in spec.ports[*].';
					console.log(msg);
					return msg;
				}

				// This is not the object we are searching for, let's not bother.
			}

			// We could not find the object matching the service's name given as param.
			return 'Service : "'+obj.svc+'" was not found in field deployment.kubernetes[*]';
		}

		for(var s in services.demo){
			if( !/^(http|ws){1}(s)?$/.test(s) )
				continue;
			console.log("services.demo."+s+" ("+util.inspect(services.demo[s])+") .... OK");
			var check = checkMainService(services.demo[s]);
			if(check){
				var msg = 'Field "deployment.services.demo.'+s+'" : '+check;
				console.log(msg);
				return new Error(msg);
			}
		}

		for(var s in services.api){
			if( !/^(http|ws){1}(s)?$/.test(s) )
				continue;

			console.log("services.api."+s+" ("+util.inspect(services.api[s])+") .... OK");
			var check = checkMainService(services.api[s]);
			if(check){
				var msg = 'Field "deployment.services.api.'+s+'" : '+check;
				console.log(msg);
				return new Error(msg);
			}
		}
		
		console.log("util.inspect(services) : "+util.inspect(services));
		
		/*
		if(ms.spec.ports.length != 1){
			var msg = 'The main_service is supposed to have exactly one Port definition (field "spec.ports" of the spec should contain only one object).';
			console.log(msg);
			return new Error(msg);
		}
		*/

	},

	kubernetes : function(kube, authorsUsername){
		var serviceFound = false, podFound = false, rcFound = false;
		
		for ( var i=0; i < kube.length; i++){
			var kubeObject = kube[i];

			
			if(kubeObject.kind == "Service"){
				serviceFound = true;
			}
			else if(kubeObject.kind == "Pod"){
				podFound = true;
				var err = validator.kubePods(kubeObject, authorsUsername);
				if(err instanceof Error){
					var msg = ((i==0)? "1st" : (i==1)? "2nd" : (i==2)? "3rd" : (i+1)+"th")+' object : '+err.toString();
		            console.log(msg);
		            return new Error(msg);
				}
			}
			else if(kubeObject.kind == "ReplicationController"){
				rcFound = true;
				var err = validator.kubeRCs(kubeObject, authorsUsername);
				if(err instanceof Error){
					var msg = ((i==0)? "1st" : (i==1)? "2nd" : (i==2)? "3rd" : (i+1)+"th")+' object : '+err.toString();
		            console.log(msg);
		            return new Error(msg);
				}
			}
			else if (kubeObject.kind == "Secret"){
				
				var err = validator.kubeSecrets(kubeObject, authorsUsername);
				if(err instanceof Error){
					var msg = ((i==0)? "1st" : (i==1)? "2nd" : (i==2)? "3rd" : (i+1)+"th")+' object : '+err.toString();
		            console.log(msg);
		            return new Error(msg);
				}
			}
			else {
				var msg = ((i==0)? "1st" : (i==1)? "2nd" : (i==2)? "3rd" : (i+1)+"th")+' object : Only "Pod", "ReplicationController" and "Service" kind of kubernetes objects are allowed'
	            console.log(msg);
	            return new Error(msg);
			}

			kubeObject.metadata.namespace = authorsUsername;
		}

		if(!serviceFound){
			var msg = 'No "Service" was found among the Kubernetes objects, there needs to at least be one.'
	        console.log(msg);
	        return new Error(msg);
		}

		if(!podFound && !rcFound){
			var msg = 'No "Pod" nor "ReplicationController" was found among the Kubernetes objects, there needs to at least be one.'
	        console.log(msg);
	        return new Error(msg);
		}
	},

	short_spec_validators : {
		secrets: (definitions, namespace) => {
			//
			var check_field_format = (field, expected_format) => {
				if (typeof field === 'undefined' || field == null){
					return false; 
				}
				if (expected_format == 'string'){
					return typeof field === 'string';
				}
				else if (expected_format == 'array'){
					return field instanceof Array;
				}
				else if (expected_format == 'object'){
					return field instanceof Object && !(field instanceof Array);
				}
				else if (expected_format == 'number'){
					return typeof field === 'number' && !isNaN(field);
				}
				else {
					throw new Error(`expected_format "${expected_format}" not understood`);
				}
			}

			if (!check_field_format(definitions, 'object')){
				return new Error( 'field "imageSecrets" must be an <a href="">xxx object</a>.' );
			}

			var specs = [];

			for (var s in definitions){
				specs.push({
					"apiVersion": "v1",
					"kind": "Secret",
					"metadata": {
						"name": s,
						"namespace": namespace
					},
					"data":{
						".dockerconfigjson": definitions[s]
					},
					"type": "kubernetes.io/dockerconfigjson"
				});
			}
			return specs;
		},

		data: (definitions, namespace)=>{//, callback) => {
			var check_field_format = (field, expected_format) => {
				if (typeof field === 'undefined' || field == null){
					return false; 
				}
				if (expected_format == 'string'){
					return typeof field === 'string';
				}
				else if (expected_format == 'array'){
					return field instanceof Array;
				}
				else if (expected_format == 'object'){
					return field instanceof Object && !(field instanceof Array);
				}
				else if (expected_format == 'number'){
					return typeof field === 'number' && !isNaN(field);
				}
				else {
					throw new Error(`expected_format "${expected_format}" not understood`);
				}
			}

			if (!check_field_format(definitions, 'object')){
				return new Error('Field "data" must be an object with fields "dataset" (type string) and storage (type number, representing the number of GB).');
			}

			if (!check_field_format(definitions.dataset, 'string')){
				return new Error('Field "data.dataset" is mandatory and must be of type string.');
			}

			if (!check_field_format(definitions.storage, 'number')){
				return new Error('Field "data.storage" is mandatory and must be a number (number of Gb).');
			}

			var  specs = {
				"kind": "PersistentVolumeClaim",
				"apiVersion": "v1",
				"metadata": {
					"name": "dataset",
					"namespace": namespace,
					"annotations": {
						"volume.beta.kubernetes.io/storage-class": APP_PARAMS.settings.k8s.volumes.default_storage_class
					}
				},
				"spec":{
					"accessModes": [ "ReadWriteMany" ],
					"resources":{
						"requests":{
							"storage": definitions.storage+"Gi"
						}
					},
					"storageClassName": APP_PARAMS.settings.k8s.volumes.default_storage_class,
					"volumeName": definitions.dataset
				}
			}

			//callback(null, pvcSpec); 
			return specs;
		},

		containers: (definitions, namespace, include_dataset, pull_secrets) => {
			//
			var check_field_format = (field, expected_format) => {
				if (typeof field === 'undefined' || field == null){
					return false; 
				}
				if (expected_format == 'string'){
					return typeof field === 'string';
				}
				else if (expected_format == 'array'){
					return field instanceof Array;
				}
				else if (expected_format == 'object'){
					return field instanceof Object && !(field instanceof Array);
				}
				else if (expected_format == 'number'){
					return typeof field === 'number' && !isNaN(field);
				}
				else {
					throw new Error(`expected_format "${expected_format}" not understood`);
				}
			}

			var validate_container_spec = (spec, index) => {
				//console.log("[validate_container_spec] CHECKPOINT 1");
				var run_checks = function(){
					
					//console.log("[validate_container_spec] CHECKPOINT 7");
					for (var item in spec){
						if (item != "name" && item != "image" && item != "ports" && 
							item != "datasetSubPath" && item != "env" && item != "cmd" && 
							item != "args" && item != "replicas"){
							//
							return new Error(`In "containers[${index}]": Field "${item}" should not be present, <a href="">visit this web page</a> for a comprehensive description..`)
						}
					}

					if (!check_field_format(spec.name, 'string')){
						return new Error(`In "containers[${index}]": Field "name" (expected format is string) is mandatory.`);
					}

					//console.log("[validate_container_spec] CHECKPOINT 2");
					if (!check_field_format(spec.image, 'string')){
						return new Error(`In "containers[${index}]": Field "name" (expected format is string) is mandatory.`);
					}
					
					//console.log("[validate_container_spec] CHECKPOINT 3");
					if (!check_field_format(spec.ports, 'array')){
						return new Error(`In "containers[${index}]": Field "port" (expected format is <a href="">array of xxx objects</a>) is mandatory.`);
					}

					//console.log("[validate_container_spec] CHECKPOINT 4");
					if (spec.ports.length == 0){
						return new Error(`In "containers[${index}]": Field "ports" can't be an empty array.`);
					}

					for (var i=0; i < spec.ports.length; i++) {
						var curr_port = spec.ports[i];
						
						if ( !check_field_format(curr_port.name, "string") ){
							return new Error(`In field "containers[${index}]" : "ports[${i}]" either does not have field "name" or the format was wrong (string expected).`);
						}
						//console.log("[validate_container_spec] CHECKPOINT 5");
						
						if ( !check_field_format(curr_port.port, "number") ){
							return new Error(`In field "containers[${index}]" : "ports[${i}]" either does not have field "port" or the format was wrong (number expected).`);
						}
						//console.log("[validate_container_spec] CHECKPOINT 6");
					}

					if ("env" in spec){
						if (!check_field_format(spec.env, 'array')){
							return new Error(`In "containers[${index}]": Field "env" must be an array of { "name": "xxx", "value": "yyy"} kind of objects.`);
						}
						for (var i=0; i < spec.env.length; i++) {
							
							if (!check_field_format(spec.env[i], 'object')){
								return new Error(`In "containers[${index}]": Field "env" must be an object with both fields "name" and "value".`);
							}

							if ( !check_field_format(spec.env[i].name, "string") ){
								return new Error(`In "containers[${index}]": field "env[${i}].name" is  either missing or in wrong format (string expected).`);
							}

							if ( !check_field_format(spec.env[i].value, "string") ){
								return new Error(`In "containers[${index}]": field "env[${i}].value" is  either missing or in wrong format (string expected).`);
							}
						}
					}

					if ("cmd" in spec && !check_field_format(spec.cmd, 'array')){
						return new Error(`In "containers[${index}]": Field "cmd" must be an array (of strings).`);
					}
					else if ("cmd" in spec && !spec.cmd.map( c => check_field_format(c, 'string') ).reduce( (a,b)=> a||b)){
						return new Error(`In "containers[${index}]": Field "cmd" must be an array of strings.`);
					}

					if ("args" in spec && !check_field_format(spec.args, 'array')){
						return new Error(`In "containers[${index}]": Field "args" must be an array (of strings).`);
					}
					else if ("args" in spec && !spec.args.map( a => check_field_format(a, 'string') ).reduce( (a,b)=> a||b)){
						return new Error(`In "containers[${index}]": Field "args" must be an array of strings.`);
					}

					if (!include_dataset && "datasetSubPath" in spec){
						return new Error(`In "containers[${index}]": Field "datasetSubPath" specified but no dataset (field "data") found in manifest.`);
					}

					if ("replicas" in spec){ 
						if(check_field_format(spec.replicas, 'object')){
							
							////console.log("[validate_container_spec] CHECKPOINT 151");
							
							if ("min" in spec.replicas && !check_field_format(spec.replicas.min, 'number')){
								return new Error(`In field "containers[${index}]" : field "replicas.auto.min" is in the wrong format (number expected).`);
							}
		
							//console.log("[validate_container_spec] CHECKPOINT 16");
							
							var min = "min" in spec.replicas ? parseInt(spec.replicas.min): APP_PARAMS.settings.k8s.deployments.min_replicas;
							if (min < APP_PARAMS.settings.k8s.deployments.min_replicas){
								return new Error(`In field "containers[${index}]" : field "replicas.auto.min" is lower than the minimum number of replicas allowed (= ${APP_PARAMS.settings.k8s.deployments.min_replicas}).`);
							}

							if (min > APP_PARAMS.settings.k8s.deployments.max_replicas){
								return new Error(`In field "containers[${index}]" : field "replicas.auto.min" is greater than the maximum number of replicas allowed (= ${APP_PARAMS.settings.k8s.deployments.max_replicas}).`);
							}
							spec.replicas.min = min;
		
							//console.log("[validate_container_spec] CHECKPOINT 17");
							
							if ("max" in spec.replicas && !check_field_format(spec.replicas.max, 'number')){
								return new Error(`In field "containers[${index}]" : field "replicas.auto.max" is in the wrong format (number expected).`);
							}
							//console.log("[validate_container_spec] CHECKPOINT 18");
							
							var max = "max" in spec.replicas ? parseInt(spec.replicas.max): min;
							if (max > APP_PARAMS.settings.k8s.deployments.max_replicas){
								return new Error(`In field "containers[${index}]" : field "replicas.auto.max" is greater than the maximum number of replicas authorized (= ${process.env.MAX_REPLICA_NUMBER}).`);
							}
							//console.log("[validate_container_spec] CHECKPOINT 19");
							
		
							if ( !check_field_format(spec.replicas.cpuPercent, "number") ){
								return new Error(`In field "containers[${index}]" : field "replicas.auto.cpuPercent" is either not specififed or is in the wrong format (number expected).`);
							}
							//console.log("[validate_container_spec] CHECKPOINT 20");
							
							if (spec.replicas.cpuPercent < APP_PARAMS.settings.k8s.hpa.min_cpuPercent || spec.replicas.cpuPercent > APP_PARAMS.settings.k8s.hpa.max_cpuPercent){
								return new Error(`In field "containers[${index}]" : field "replicas.auto.cpuPercent" must be between ${APP_PARAMS.settings.k8s.hpa.min_cpuPercent} and ${APP_PARAMS.settings.k8s.hpa.max_cpuPercent}.`);
							}
						}
						else if (!check_field_format(spec.replicas, 'number')){
							return new Error(`In "containers[${index}]": Field "replicas" is neither a number nor an <a href="">xxx object</a>.`);
						}
					}
				}

				var ok = run_checks();
				if (ok instanceof Error){
					return ok;
				}

				//console.log("[validate_container_spec] CHECKPOINT 8");
				var svc_spec = {
					"apiVersion": "v1",
					"kind": "Service",
					"metadata": {
						"namespace": namespace,
						"name": spec.name
					},
					"spec": {
						"selector": {
							"app": "app-"+index
						},
						"ports": spec.ports.map( p => {
							return {
								name: p.name,
								port: p.port,
								targetPort: p.port,
								protocol: ('protcol' in p)? p.protcol: 'TCP'
							}
						})
					}
				};

				var pod_spec = {
					"metadata": {
						"labels": {
							"app": "app-"+index
						}
					},
					"spec":{
						"imagePullSecrets": pull_secrets == null ? undefined : pull_secrets.map( (s)=>{ s.metadata.name }),
						"containers": [
							{
								"name": spec.name,
								"image": spec.image,
								"ports": spec.ports.map(p=>{
									return {
										name: p.name,
										containerPort: p.port,
										protocol: ('protcol' in p)? p.protcol: 'TCP'
									}
								}),
								"command": !("cmd" in spec) ? undefined : spec.cmd,
								"args": !("args" in spec) ? undefined : spec.args,
								"environment": !("env" in spec) ? undefined : spec.env,
								"volumeMounts": !include_dataset ? undefined : [{
									"mountPath": "/dataset",
									"name": "dataset",
									"subPath": ("datasetSubPath" in spec)? spec.datasetSubPath: undefined
								}]
							}
						],
						"volumes": !include_dataset ? undefined: [ 
							{ 
								name: "dataset", 
								persistentVolumeClaim: { claimName: "dataset" } 
							} 
						]						
					}
				}
				
				var deploy_spec = {
					"apiVersion": "v1",
					"kind": "ReplicationController",
					"metadata": {
						"namespace": namespace,
						"name": spec.name
					},
					"spec": {
						"replicas": ("replicas" in spec && check_field_format(spec.replicas, 'number'))? parseInt(spec.replicas) : 1,
						"selector": {
							// "matchLabels": {
							// 	"app": "app-"+index
							// }
							"app": "app-"+index
						},
						"template": pod_spec
					}
				}
				
				var specs = {
					svc : svc_spec,
					deploy: deploy_spec
				}
				
				//console.log("[validate_container_spec] CHECKPOINT 15");
				if ("replicas" in spec && check_field_format(spec.replicas, 'object')){
					
					specs.hpa = {
						"apiVersion": "autoscaling/v1",
						"kind": "HorizontalPodAutoscaler",
						"metadata": {
							"name": spec.name,
							"namespace": namespace 
						},
						"spec": {
							"minReplicas": spec.replicas.min,
							"maxReplicas": spec.replicas.max,
							"targetCPUUtilizationPercentage": spec.replicas.cpuPercent,
							"scaleTargetRef":{
								"apiVersion": "apps/v1",
								"kind": "Deployment",
								"name": spec.name
							}
						}
					}
				}

				return specs;
			}
			
			var specs = { svcs: [], deploys: [], hpas:[] };
			
			for(var i=0; i < definitions.length; i++){
				var s = validate_container_spec(definitions[i], i);
				if (s instanceof Error){
					//return callback(s);
					return s;
				}
				specs.svcs.push(s.svc);
				specs.deploys.push(s.deploy);
				if ("hpa" in s){
					specs.hpas.push(s.hpa);
				}
			}

			return specs;
		}
	},

	simplifiedSpec : function(submittedSpec, authorsUsername){
		console.log("submittedSpec:", submittedSpec);
		var specs = [];
		if ("imageSecrets" in submittedSpec){
			specs.push(validator.short_spec_validators.secrets(submittedSpec["imageSecrets"], authorsUsername))
			if (specs[0] instanceof Error) return specs[0];
		}

		if ( !('containers' in submittedSpec)){
			return new Error('Field "deployment.infra.containers" is mandatory');
		}

		
		var contSpecs = validator.short_spec_validators.containers(submittedSpec.containers, 
			authorsUsername, 
			null, 
			"imageSecrets" in submittedSpec? specs[0]: null);

		if (contSpecs instanceof Error) return contSpecs;

		console.log("contSpecs: ", contSpecs);
		contSpecs.svcs.forEach((s) => specs.push(s));
		contSpecs.deploys.forEach((s) => specs.push(s));
		contSpecs.hpas.forEach((s) => specs.push(s));
		
		return specs;
	},
	deployment : function(deployment, authorsUsername, cb) {
			
		// if(!deployment){
		// 	return cb('Field "deployment" is required.');
		// }

		// if( !(deployment.kubernetes && deployment.kubernetes instanceof Array) ){
		// 	return cb('Field "deployment.kubernetes" is not given or is in wrong format (Array of objects expected).');
		// }
		// if(!deployment.services){
		// 	return cb('Field "deployment.services" is not given or is in wrong format (Object expected).');
		// }

		// var err = validator.mainServices(deployment.services, deployment.kubernetes);
		// if(err instanceof Error) return cb(err.toString());

		// var err = validator.simplifiedSpec(deployment.kubernetes, authorsUsername);
		// if(err instanceof Error) return cb(err.toString());

		// cb()

		if(!deployment){
			return cb('Field "deployment" is required.');
		}

		if( !(deployment.infra) ){
			return cb('Field "deployment.infra" is not given or is in wrong format (object expected).');
		}
		if(!deployment.services){
			return cb('Field "deployment.services" is not given or is in wrong format (Object expected).');
		}

		// var err = validator.mainServices(deployment.services, deployment.infra);
		// if(err instanceof Error) return cb(err.toString());

		var err = validator.simplifiedSpec(deployment.infra, authorsUsername);
		if(err instanceof Error) return cb(err.toString());

		console.log("simplifiedSpec returns : ", err);
		deployment.k8s = JSON.stringify(err, null, 2);

		cb()
	},


	
	manifest : function(metaId, fileOrContent, io, username, cb){

		console.log("############ metaId : "+metaId);
	    if(typeof io === 'function' && typeof cb === 'undefined'){
	        cb = io; io = undefined;
	    }

	    var data;
	    if(fileOrContent.file){
		    try {
		        data = fs.readFileSync(fileOrContent.file);
		    }
		    catch(e) {
		        var msg = util.inspect(e);
		        console.log(msg);
		        if(typeof io !== 'undefined')
		            io.emit("Error", msg);
		        cb(new Error(msg));
		        //cleanUpUploads(files);
		        return;
		    }
		}
		if(fileOrContent.content) {
			data = fileOrContent.content;
		}

	    var received;
	    try {
	        received = JSON.parse(data);
	    }
	    catch(e) {
	        var msg = "Parse Error : " + util.inspect(e);
	        console.log(msg);
	        if(typeof io !== 'undefined')
	            io.emit("Error", msg);
	        cb(new Error(msg));
	        //cleanUpUploads(files);
	        return;
	    }

	    validator.version(received.version, function(errVersion){
	    	if(errVersion){
	    		if(typeof io !== 'undefined')
	            	io.emit("Error", errVersion);
	        	return cb(new Error(errVersion));
	    	}
	    	
	    	validator.comment(received.comment, function(errComment){
	    		if(errComment){
		    		if(typeof io !== 'undefined')
		            	io.emit("Error", errComment);
		        	return cb(new Error(errComment));
	    		}
	    		console.log("\t comment : good");
	    	
	    		meta.versionExistsByID(metaId, received.version, function(errVersionExists, exists){
    				console.log("exists : "+exists);
    				if(errVersionExists){
    					console.log(errVersionExists.toString());
			            if(typeof io !== 'undefined')
			               io.emit("Error", errVersionExists.toString());
			            return cb(new Error(errVersionExists.toString()));
    				}
    				if (exists){
    					var msg = "an algorithm with the same name and the same version is already recorded.";
			            console.log(msg);
			            if(typeof io !== 'undefined')
			               io.emit("Error", msg);
			            return cb(new Error(msg));
    				}
    				console.log("\t version : good");


    				validator.deployment( received.deployment, username, function(errDeployment){
    					if(errDeployment){
				    		if(typeof io !== 'undefined')
				            	io.emit("Error", errDeployment);
				        	return cb(new Error(errDeployment));
				    	}
				    	console.log("\t deployment : good");

				    	
				    	validator.API(received.API, io, function(errAPI){
				    		if(errAPI){
					    		//if(typeof io !== 'undefined')
					            //	io.emit("Error", errDeployment);
					            console.log(errAPI);
					        	return cb(errAPI);
					    	}
					    	console.log("\t API : good");

					    	console.log("\nAnalyseJSON Successfully end\n");
					        console.log("\nBY THE WAY KUBERNETES : \n"+ util.inspect(received.deployment.k8s));

					        received.meta = metaId;
					        cb(null, new Algos(received));

					        if(fileOrContent.file) rm(fileOrContent.file);
				    	}) ;
    				});
	    		});
	    	});
	    });
	}
}


var rm = function(fpath){

	var remove = spawnSync('rm', ['-r', fpath]), err = remove.stderr.toString();
	if(err){
		console.log("Error during rm "+fpath+" : "+err);
	}
	else{
		console.log(fpath+" removed");
	}
}


module.exports = {
	validator : validator
}
