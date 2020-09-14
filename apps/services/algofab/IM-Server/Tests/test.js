


/*
var fs = require('fs'), restler = require('restler');

var testCreateImage = function(tarPath, algoname, cb){
	fs.stat(tarPath, function(err, stats) {
		restler.post("http://localhost:3000/createImage", {
	        multipart: true,
	        data: {
	            "name": algoname,
	            "dockerfile": restler.file(tarPath, null, stats.size, null, "application/gzip")
	        }
	    }).on("complete", function(data) {
	        console.log(data);
	        if(typeof cb !== 'undefined')
		        cb();
	    });
	});
};
var myCID = '';
var testCreateContainer = function(config, cb){
	var data = {};
	if(config.Image)
		data.Image = config.Image;
	
	if(config.APIListeningOn)
		data.APIListeningOn = config.APIListeningOn;
	
	if(config.nbCpus)
		data.nbCpus = config.nbCpus;
	
	if(config.mem)
		data.mem = config.mem;
	
	if(config.disk)
		data.disk = config.disk;
	
	restler.post("http://localhost:3000/createContainer", {
        data: data
    }).on("complete", function(data) {
        myCID = JSON.parse(data).cid;
        console.log('Created container id : '+myCID);
        console.log('---------------------------------');
        console.log('data : '+JSON.parse(data).cid);
        console.log('---------------------------------');
        if(typeof cb !== 'undefined')
		    cb();
    });

};

var testremoveContainer = function(cid, cb){
	restler.get("http://localhost:3000/removeContainer?cid="+cid).on("complete", function(data) {
        console.log(data);
        if(typeof cb !== 'undefined')
		    cb();
    });
};



testCreateImage(__dirname+'/container/Dockerfile.tar.gz', "myNewAlgoName");
testCreateContainer({
	"Image" : 'myNewAlgoName',
	"APIListeningOn" : 3000,
	"nbCpus" : 2,
	"mem" : 4194304,
	"disk" : 4194304
}, function(){
	console.log('Now removing it ...');
	setTimeout(function(){
		testremoveContainer(myCID);
	},1000*15);
});

*/

/*
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
};


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
	
	portInUse(port, function(inuse){
		if(inuse){
			newAvailablePortInRange(range, cb);
		}
		else
		{
			cb(port);
		}
	});
};

var newAvailablePortOutOfRange = function(range, cb, port){
		
	
	if(typeof port === 'undefined' || (port >= range.min && port < range.max) ) {
		port = Math.floor(Math.random() * (65535-1)) + 1;
		while(port >= range.min && port < range.max)
			port = Math.floor(Math.random() * (65535-1)) + 1;
	}
	
	portInUse(port, function(inuse){
		if(inuse){
			newAvailablePortOutOfRange(range, cb);
		}
		else
		{
			cb(port);
		}
	});
};

newAvailablePortOutOfRange({min : 20000, max : 40000}, function(p){
	console.log('Port : '+p);
}, 19000);
*/
/*
var fs = require('fs'), ggf = fs.writeFileSync('/home/../allezHop.txt', 'Allez Hop Mon Gars');
console.log('ggf : '+ggf);
*/

/*
var pull = function(img, cb){
	console.log('Pulling '+img);
	var spawn = require('child_process').spawn;

	var cmd = spawn('docker', ['pull', img]);
	var out='', err='';

	cmd.stdout.on('data', function(data){out+=data.toString(); console.log('OUT : '+data.toString());});
	cmd.stderr.on('data', function(data){err+=data.toString(); console.log('ERR : '+data.toString());});
	cmd.on('close', function(exitCode){
		if(err){
			cb(err);
		}
		else{
			cb(null);
		}
	});
}

pull('hello-world', function(err){
	console.log("CONCLUSION : "+((err)?'FAILED':'SUCCESS'));
});
*/


/*
var spawn = require('child_process').spawn;
var path = require('path');
var util = require('util');

var docker_compose = function(context){
	this.context = context;
	this.directory = path.basename(context)

	this.ps = function(cb){
		var cmd = spawn('docker-compose', ['ps'], {cwd : this.context});
		var out='', err='';

		cmd.stdout.on('data', function(data){
			out+=data.toString(); 
			//console.log('OUT : '+data.toString());
		});

		cmd.stderr.on('data', function(data){
			err+=data.toString(); 
			//console.log('ERR : '+data.toString());
		});

		cmd.on('close', function(exitCode){
			if(err){
				cb(err);
			}
			else{
				cb(null, out);
			}
		});
	}
	
	this.numberOfServices = function(service, cb){
		this.ps(function(error, ps){
			if(error)
				cb(error)
			else{
				lines = ps.split('\n')
				var nb = 0;
				for(var i=0; i<lines.length; i++){
					if(new RegExp('^'+this.directory+'_'+service+'_'+'[0-9]+ \ ').test(lines[i]))
						nb++;
				}
				cb(null, nb);
			}
		}); 
	}

	this.scale = function(obj, cb){
		var opt = '';
		for (var k in obj)
			opt += k+"="+obj[k];

		var cmd = spawn('docker-compose', ['scale', opt], {cwd : this.context});
		
		var out='', err='';

		cmd.stdout.on('data', function(data){
			out+=data.toString(); 
			//console.log('OUT : '+data.toString());
		});
		
		cmd.stderr.on('data', function(data){
			err+=data.toString(); 
			//console.log('ERR : '+data.toString());
		});
		
		cmd.on('close', function(exitCode){
			if(err){
				cb(err);
			}
			else{
				cb(null, out);
			}
		});

	}

	this.up = function(detatchMode, cb){
		if(arguments.length == 1 && typeof detatchMode == 'function'){
			cb = detatchMode;
			detatchMode = undefined;
		}

		var cmd = spawn('docker-compose', (detatchMode)?['up', '-d']:['up'], {cwd : this.context});
		var out='', err='';

		cmd.stdout.on('data', function(data){
			out+=data.toString(); 
			//console.log('OUT : '+data.toString());
		});
		
		cmd.stderr.on('data', function(data){
			err+=data.toString(); 
			//console.log('ERR : '+data.toString());
		});

		cmd.on('close', function(exitCode){
			if(err){
				cb(err);
			}
			else{
				cb(null, out);
			}
		});
	}

	this.down = function(cb){
		var cmd = spawn('docker-compose', ['down'], {cwd : this.context});
		var out='', err='';

		cmd.stdout.on('data', function(data){
			out+=data.toString(); 
			//*console.log('OUT : '+data.toString());
		});
		
		cmd.stderr.on('data', function(data){
			err+=data.toString(); 
			//*console.log('ERR : '+data.toString());
		});

		cmd.on('close', function(exitCode){
			if(err){
				cb(err);
			}
			else{
				cb(null, out);
			}
		});
	}

	this.isRunning = function(cb){
		this.ps(function(error, ps){
			if(error)
				cb(error);
			else{
				var pp = ps.split('\n');
				console.log('PP = '+pp);
				cb(null, pp.length > 3);
			}
		});
	}
	return this;
}

var eyesnap = docker_compose("/home/skante/eyesnap/dockerapi"); 

eyesnap.ps(function(err, out){
	console.log("********* PS *********");
	console.log((err)?err:out);
	console.log("******* END PS *******");
});


var serv = "rest_api"
eyesnap.numberOfServices(serv, function(err, out){
	console.log("******* numberOfServices *******");
	console.log((err)?err:out);
	console.log("***** END numberOfServices *****");
});

eyesnap.scale({rest_api : 7}, function(err, out){
	console.log("******* SCALE *******");
	console.log((err)?err:out);
	console.log("***** END SCALE *****");
});


eyesnap.isRunning(function(err, indeed){
	if(err)
		console.log("Err : "+err);
	else{
		console.log('---- Running : '+indeed);
	}
	eyesnap.up(true, function(err, out){
		console.log("******* UP *******");
		console.log('UP-Err : '+err);
		console.log('UP-Out : '+out);
		console.log("***** END UP *****");
	});
});



setTimeout(function(){
	eyesnap.isRunning(function(err, indeed){
		if(err)
			console.log("Err : "+err);
		else{
			console.log('---- Running : '+indeed);
		}

		eyesnap.down(function(err, out){
			console.log("******* DOWN *******");
			console.log('DOWN*Err : '+err);
			console.log('DOWN*Out : '+out);
			console.log("***** END DOWN *****");
		});
	});
}, 10000);
*/

/*
var Algo_Infra = require('./models/mongoDB').model('Algo_Infra');


var n_Algo = new Algo_Infra({
	_id : "58d0ea0022345b0dd759a494",
	docker : "test"
});
console.log("DEBUG");
n_Algo.save(function(err1){
	if(!err1) {
		console.log('The end, calling cb.');
		Algo_Infra.find({$or : [ {_id : "test"}, {docker : "test"}] }, function(err, algo){
			console.log((err)?"err : "+err : algo);
		});
	}
	else{
		console.log('Failed the saving : '+err1);
		
	}
});


Algo_Infra.findById("58d0ea0022345b0dd759a494", function(err, algo){
	console.log((err)?err : 'algo : '+algo);
	algo.remove(function(err1, v){
		console.log((err1)?err1 : "Removed");
		console.log("v : "+v);
	});
});
*/

/*
var fs = require('fs'), util = require('util');
var isEligibleForCompose = function(f_path, cb){

	try {
		if( !fs.existsSync(f_path) || !fs.statSync(f_path).isDirectory()) {
			//console.log(new Error(f_path+ " does not exist or is not a directory."));
			cb(new Error(f_path+ " does not exist or is not a directory."));
			return;
		}
	}catch(e){
		console.log(e);
		cb(e);
		return;
	}

	fs.readdir(f_path, function(err, files){
		//console.log(err || util.inspect(files));
		if(files.length != 1){
			console.log(new Error("Not the expected number of files inside "+f_path+', expected ONE DIRECTORY.'));
			cb(new Error("Not the expected number of files inside "+f_path+', expected ONE DIRECTORY.'));
			return;
		}
		try {
			if( !fs.statSync(f_path+'/'+files[0]).isDirectory() ){
				//console.log(new Error("The file inside "+ f_path+ " is supposed to be a directory."));
				cb(new Error("The file inside "+ f_path+ " is supposed to be a directory."));
				return;
			}
		}catch(e){
			//console.log(e);
			cb(e);
			return;
		}

		fs.readdir(f_path+"/"+files[0],  function(err, c_dirs){
			//console.log(err || util.inspect(files));
			for(var i = 0; i < c_dirs.length; i++){
				if(c_dirs[i] == "docker-compose.yml" || c_dirs[i] == "docker-compose.yaml"){
					cb(null, f_path+"/"+files[0]);
					return;
				}
			}
			//console.log(new Error("No docker-compose.yml or docker-compose.yaml file found in "+f_path+"/"+files[0]));
			cb(new Error("No docker-compose.yml or docker-compose.yaml file found in "+f_path+"/"+files[0]));
		});

	});
} 

isEligibleForCompose("/home/cloud/eyesnap", function(err, isEligible){
	console.log("-- CONCLUSION : "+ (err || isEligible));
});
*/
/*
var spawnSync = require('child_process').spawnSync;



var watchKubeObjectStatus = function(type, name){
	this.type = type;
	this.name = name;

	var ref = this;
	var events = require('events');
	this.eventEmitter = new events.EventEmitter();
	
	var interv = setInterval(function(){
		var cmd = spawnSync('kubectl', ['get', type, name, '-o', 'json']);
		var out = cmd.stdout.toString(), err = cmd.stderr.toString();
		if(err){
			ref.eventEmitter.emit('stop', err.toString());
			ref.eventEmitter.emit('err', err.toString());
			clearInterval(interv);
			return;
		}
		var old = ref.status, out_json = JSON.parse(out);
		
		if(type == "Pod")
			ref.status = out_json.status.phase;
		else if (type == "ReplicationController")
			ref.status = (out_json.status.readyReplicas || "0" )+"/"+out_json.status.replicas;


		if (old != ref.status)
			ref.eventEmitter.emit('change', ref.status);		
	}, 900);

	this.on = function(str, action){
		ref.eventEmitter.on(str, action);
	};

	this.getType = function(){ return ref.type;};
	this.getName = function(){ return ref.name;};
	this.getStatus = function(){ return this.status};
	
	this.stop = function(){
		clearInterval(interv);
		ref.eventEmitter.emit('stop', ref.status);
	};
	return this;
}


eyesnap = new watchKubeObjectStatus('Pod', 'jdoe-eyesnap-web');
eyesnap.on('change', function(newState){
	console.log(' -- Change : ' + newState);
});
eyesnap.on('stop', function(finalState){
	console.log(' -- Stop : '+finalState);
});
*/
/*
var SG = require("./CONFIG-kube");
setTimeout(function(){
	console.log('-------------------------------------------------------------')
	var file_path = __dirname+'/yaml/jdoe/imagesoptimizer200/exple.json', type = 'pod', name = 'exple';

	SG.kube.create(file_path, function(err, res){
		//
		if (err)
			return console.log('Err : '+err);
		var test = new watchKubeObjectStatus(name, type);
			test.on('change', function(s){
			console.log('New State = '+s);
		});
	});
}, 2000);

*/

/*
var spawnSync = require('child_process').spawnSync;

var KubeObjectsMatchingLabels = function(kind, labels, ns, cb){

	var l = '';
	for(label in labels)
		l+=label+"="+labels[label]+",";

	if (l.length != 0)
		l = l.substring(0, l.length-1);

	var arg = ['get', kind, '-l', l, "-o", "jsonpath={range.items[?(@)]}{.metadata.name}:{end}", "-n", ns];
	console.log('kubectl '+arg.join(' '));
	var cmd = spawnSync('kubectl', arg);

	if(cmd.stderr.toString() != "")
		cb(cmd.stderr.toString());

	var r = cmd.stdout.toString().split(":");
	for (var i=0; i<r.length; i++)
		if( ! r[i] ){
			r.splice(i,1);
			i--;
		}

	cb(null, r)
}

KubeObjectsMatchingLabels("Services", {
	app : "helloworld", 
	by : "John_Doe", 
	from : "Company"
}, "jdoe", function(err, res){ 
	console.log(err || res); 
});
*/

var restler = require('restler');
var fs = require('fs'), util = require('util');
var path = require('path');
var kubeapi = function(conf){
	if (!conf.endpoint || ! /^https?\:\/\//.test(conf.endpoint))
		throw new Error('Endpoint have to be specified and needs to begin with "http" or https');
	
	this.endpoint = conf.endpoint.replace(/\/$/, '');;
	this.api_version = (typeof conf.version === 'undefined')? 'api/v1' : conf.version.replace(/^\//, '').replace(/\/$/, '');
	
	var api_ref = this;


	this.namespace = function(ns) {
		var prefix = api_ref.api_version+'/namespaces/'+ns.replace(/^\//, '').replace(/\/$/, '');
		
		this.get = function(ressource_path, cb) {
			var complete_path = api_ref.endpoint+'/'+prefix+'/'+ressource_path.replace(/^\//, '').replace(/\/$/, '');

			console.log('complete_path : '+complete_path);
			restler.get(complete_path).on('complete', function(body, httpResponse){
				if(body instanceof Error){
					return cb(body);
				}
				try{
					cb(null, JSON.parse(body));
				}
				catch(e){
					cb(null, body);
				}
			});
		};

		this.post = function(ressource_path, spec_file, cb){
			//
			var complete_path = api_ref.endpoint+'/'+prefix+'/'+ressource_path.replace(/^\//, '').replace(/\/$/, '');

			console.log('complete_path : '+complete_path);

			var content, ext;
			try {
				ext = path.basename(spec_file).ext;
				if (ext == "json"){
					content = JSON.parse(fs.readFileSync(spec_file));
				}
				else if ( ext != 'yaml' && ext != 'yml'){
					//content = JSON.parse(fs.readFileSync(spec_file));
					console.log('Yaml not handled for now but comming soon');
				}
				else{
					return cb(new Error ("Your specification file must be a *.json, *.yaml or *.yml") );
				}
			}
			catch(e){
			//	return cb(new Error('An error occurred, make sure file "'+spec_file+'" exists.'));
				return cb(new Error(e));
			}
			var responseHandler = function(body, httpResponse){
				if(body instanceof Error){
					return cb(body);
				}
				try{
					cb(null, JSON.parse(body));
				}
				catch(e){
					cb(null, body);
				}
			}

			if (ext == "json")
				restler.postJson(complete_path, content).on('complete', responseHandler);
			else{
				restler.postJson(complete_path, {
					headers : {
						"Content-Type" : "application/"+ext
					},
					data : fs.readFileSync(spec_file)
				} ).on('complete', responseHandler);
			}

		}

		this.create = function() {
			//
		}
		return this;
	}

	return this;
}

var api = new kubeapi({ endpoint : "http://localhost:8081", version : "api/v1"}).namespace("/jdoe");
/*
api.get("services", function(err, res){
	console.log( err || res );
});
*/

api.post('pods', __dirname+'/kube_test.json', function(err, res){
	console.log( err || res );
});



