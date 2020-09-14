
var mkdirp = require('mkdirp');
var spawnSync = require('child_process').spawnSync;
var fs = require('fs'), util = require('util');

const version_mask = /^[0-9]+\.[0-9]+\.[0-9]+$/;
const unscript_mask = /<(( )*|(\t)*)*script(.)*<(( )*|(\t)*)*\/(( )*|(\t)*)*script(( )*|(\t)*)*>/;

var User = global.mongo.model("User");
var Algos = global.mongo.model("Algos");
var AlgosMeta = global.mongo.model("AlgosMeta");
var User = global.mongo.model("User");


var meta = require('./algometa');


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
		try{
			comment = (comment instanceof Array)? comment.join('') : (typeof comment === 'string')? comment : undefined;
		}
		catch (e){
			return cb("Internal error.");
		}
		
		if (!comment){
			return cb("The description is required.");
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

        return = {
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
		if(!API){
			console.log(new Error("Error : The field API is required."));
            return cb("Error : The field API is required.");
        }

        var at_least_one_method = (API.GET && API.GET instanceof Array) || 
                                  (API.POST && API.POST instanceof Array) || 
                                  (API.PUT && API.PUT instanceof Array) || 
                                  (API.DELETE && API.DELETE instanceof Array);    

        if(!at_least_one_method){
            return cb("No VERB Given, if you did specify at least one, then checkout the format (Array of object expected).");
        }

        var api_content = validator.AUO(API, 'GET', io);
        if(api_content instanceof Error) return cb(api_content);
        
        //------ FOR POST --------
        api_content = validator.AUO(API, 'POST', io);
        if(api_content instanceof Error) return cb(api_content);
        
        //------ FOR PUT --------
        api_content = validator.AUO(API, 'PUT', io);
         if(api_content instanceof Error) {
            cb(api_content);
            return;
        }
        if(api_content instanceof Error) return cb(api_content);

        //------ FOR DELETE --------
        api_content = validator.AUO(API, 'DELETE', io);
        if(api_content instanceof Error) return cb(api_content);

        //  received.author = req.session.user._id
        cb();
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
	},

	mainService : function(name, kubeArray){
		if(!name){
			var msg = 'Field "deployment.main_service" is required.';
			console.log(msg);
			return new Error(msg);
		}
		var ms = null;

		for(var i=0; i<kubeArray.length; i++){
			if(kubeArray[i].kind == "Service" && kubeArray[i].metadata.name == name){
				ms = kubeArray[i];
				break;
			}
		}
		
		if(ms == null){
			var msg = 'No Service goes by the name of the specified main_service('name+') amongst the kubernetes objects.';
			console.log(msg);
			return new Error(msg);
		}

		if(ms.spec.type != "NodePort"){
			var msg = 'The main_service has to be a NodePort type Service.';
			console.log(msg);
			return new Error(msg);
		}

		if(ms.spec.ports.length != 1){
			var msg = 'The main_service is supposed to have exactly one Port definition (field "spec.ports" of the spec should contain only one object).';
			console.log(msg);
			return new Error(msg);
		}

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
			else {
				var msg = ((i==0)? "1st" : (i==1)? "2nd" : (i==2)? "3rd" : (i+1)+"th")+' object : Only "Pod", "ReplicationController" and "Service" kind of kubernetes objects are allowed'
	            console.log(msg);
	            return new Error(msg);
			}

			kubeObject.metadata.namespace = username;
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

	deployment : function(deployment, authorsUsername, cb) {
			
		if(!deployment){
			return cb('Field "deployment" is required.');
		}

		if( !(deployment.kubernetes && deployment.kubernetes instanceof Array) ){
			return cb('Field "deployment.kubernetes" is not given or is in wrong format (Array of objects expected).');
		}
		if(!deployment.main_service || typeof deployment.main_service !== 'string'){
			return cb('Field "deployment.main_service" is not given or is in wrong format (String expected).');
		}

		var err = validator.mainService(deployment.main_service, deployment.kubernetes);
		if(err instanceof Error) return cb(err.toString());

		var err = validator.kubernetes(deployment.kubernetes, authorsUsername);
		if(err instanceof Error) return cb(err.toString());

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
					        console.log("\nBY THE WAY KUBERNETES : \n"+ util.inspect(received.deployment.kubernetes));

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
