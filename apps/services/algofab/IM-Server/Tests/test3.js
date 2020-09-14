

/*
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
var multiparty = require('multiparty');

app.get('/nmultipart', function(req, res){
	var html = '<form method="post" action="/">'+ 
					'<input type="text" name="anything"/>' +
					'<input type="submit" value="submit"/>'+
				'</form>';
	res.writeHead(200, {'content-type': 'text/html'});
	res.end(html);
});
app.get('/multipart', function(req, res){
	var html = '<form method="post"  action="/" enctype="multipart/form-data">'+ 
					'<input type="file" name="anything"/>' +
					'<input type="submit" value="submit"/>'+
				'</form>';
	res.writeHead(200, {'content-type': 'text/html'});
	res.end(html);
});

app.post('/', function(req, res){
	new multiparty.Form().parse(req, function(err, fields, files) {
		if(!err){
			console.log("require('util').inspect(fields)  : " + require('util').inspect(fields));
			console.log("require('util').inspect(files)  : " + require('util').inspect(files));
			if(!files){
				console.log('\tThis request is not multiparted');
			}
			
		}
		else
			console.log('ERR : '+ err);
		console.log('\n\n');
	});
	
	res.end('good');
});

app.listen(3000);
*/


/*
var strobj = '{"abc" : "ddf", "deb" : "dffg", "ddsa" : 15}';
var obj = JSON.parse(strobj, function(key, value){
	return value;
});
console.log('obj : '+require('util').inspect(obj));


var serial = function(tab){
	
	var recurs = function(done, index){
		if(typeof index === 'undefined')
			index = 0;
		
		var nextInd;
		if(done instanceof Error)
			nextInd = tab.length-1;
		else
			nextInd = index+1;

		next = tab[nextInd];
		if(nextInd == tab.length-1){
			return next();
		}
		else {
			return next(function(done){
				return recurs(done, index+1)
			});
		}
	}

	return tab[0](function(done){
		return recurs(done)
	});
}
*/

/*
var t = 0;

var val = serial([
	function(done){
		t += 100;
		console.log('First one, t = '+t);
		return done();
	},
	function(done){
		t /= 10;
		console.log('Second one, t = '+t);
		return done();
	},
	function(done){
		t -= 5;
		console.log('Third one, t = '+t);
		return done();
	},
	function(){
		t *= 3;
		console.log('last one, t = '+t);
		return t;
	}
]);

console.log('VAL : '+val);
*/


/*
var t;
var restler = require('restler');
var val = serial([
	function(done){
		restler.get('http://localhost:32080').on('complete', function(body, response){
			t = body 
			return done();
		});
		
	},
	function(){
		console.log('T = '+t)
		return t;
	}
]);

console.log('VAL : '+val);
*/
/*
var wait(f1, f2) = {

	f1(function(done){

	});
}



var async = function(func){
	console.log('1');
	return func();
}

var b = async(function(){
	console.log('2');
	return (function(){
		console.log('3');
	
		return (function(){
			console.log('4');
			return 200;
		})();
	})();
});

setTimeout(function(){
	console.log('B = '+b);
},500);
*/
//console.log('process : '+require('util').inspect(process));
/*
var fs = require('fs'), util = require('util'), mkdirp = require('mkdirp'), path = require('path'),
spawn = require('child_process').spawn, spawnSync = require('child_process').spawnSync;


var _create = function(file, cb){

	var cmdArgs = ['create', '-f', file];
	var cmd = spawn('kubectl', cmdArgs), out = '', err = '';

	cmd.stdout.on('data', function(data){
		out += data.toString();
		//console.log(data.toString());
	});

	cmd.stderr.on('data', function(data){
		err += data.toString();
		//console.log('Err : '+data.toString());
	});
	cmd.on('close', function(code){
		//
		if(err){
			cb(err);
		}
		else {
			cb(null, out)
		}
	});
}

var _delete = function(file, cb){

	var cmdArgs = ['delete', '-f', file];
	var cmd = spawn('kubectl', cmdArgs), out = '', err = '';

	cmd.stdout.on('data', function(data){
		out += data.toString();
		//console.log(data.toString());
	});

	cmd.stderr.on('data', function(data){
		err += data.toString();
		//console.log('Err : '+data.toString());
	});
	cmd.on('close', function(code){
		//
		if(err){
			cb(err);
		}
		else {
			cb(null, out)
		}
	});
}

var _createPodSpec = function(infos, pullName, cb){
	// 	infos : {
	//		name,
	//		version,
	//		username,
	//		port
	//	}

	var specifications = {
		apiVersion : "v1",
		kind : "Pod",
		metadata : {
			name : infos.username+'-'+infos.name.toLowerCase().replace(/\.|\ |\-/g, '_')+(infos.version.replace(/\./g, '')),
			labels : {
				app : infos.name.toLowerCase(),
				version : infos.version,
				by : infos.username
			}
		},

		spec : {
			containers : [{
				name : infos.name.toLowerCase(),
				image : pullName,
				ports : [{
					name : "http",
					protocol : "TCP",
					containerPort : infos.port
				}]
			}]
		}
	};

	var location = __dirname+'/yaml/'+infos.username+'/'+infos.name+(infos.version.replace(/\./g, ''));
	mkdirp(location, function(err){
		if(!err) {
			//
			var filename = path.posix.basename(location)+'.json';

			try{
				//console.log('location : '+location);
				//console.log('filename : '+filename);
				fs.writeFileSync( location+'/'+filename, JSON.stringify(specifications) );
				cb(null, specifications);
			}catch(e){
				//
				console.log(e);
				cb(new Error('System error 1 '));
			}
		}
		else {
			//
			cb(new Error('System error 2 '));
		}
	});
}

var _rc = function(name){
	//
	this.name = name;

	var cmd = spawnSync('kubectl', ['get', 'svc', name, '-o json'], {shell : true});
	
	if((cmd.stderr.toString() !='')){
		console.log(cmd.stderr.toString());
		return null;
	}

	this.details = cmd.stdout.toString();

	this.scale = function(nb) {
		//
		var cmd = spawnSync('kubectl', ['scale', 'rc', this.name, '--replicas='nb], {shell : true});
		
		if(cmd.stderr.toString() !='')
			return null;
		return cmd.stdout.toString();
	}
	
	return this;
}

var _svc = function(name){
	//
	this.name = name;

	var cmd = spawnSync('kubectl', ['get', 'svc', name, '-o json'], {shell : true});
	
	if((cmd.stderr.toString() !='')){
		console.log(cmd.stderr.toString());
		return null;
	}

	this.details = cmd.stdout.toString();

	this.url = function(){
		//
		var cmd = spawnSync('minikube', ['service', this.name, '--url'], {shell : true});
		
		if(cmd.stderr.toString() !='')
			return null;
		return cmd.stdout.toString();
	}
	return this;
}

var _pod = function(name) {
	//
	this.name = name;

	var cmd = spawnSync('kubectl', ['get', 'pod', name, '-o json'], {shell : true});
	if((cmd.stderr.toString() !='')){
		console.log(cmd.stderr.toString());
		return null;
	}

	this.details = cmd.stdout.toString();

	this.expose = function(){
		//
		var cmdArgs = ['expose', 'pod', name];
		
		console.log('kubectl '+cmdArgs.join(' '));
		var cmd = spawnSync('kubectl', cmdArgs), out = '', err = '';

		if(cmd.stderr.toString() !='')
			return null;
		return _svc(cmd.stdout.toString());
	}
	return this;
}

/*
var _pod = function() {
	

	this.get = function(filter, cb){
		//
		if(typeof filter === 'function' && typeof cb === 'undefined'){
			cb = filter; filter = undefined;
		}

		var cmdArgs = ['get', 'pod'];
		if (typeof filter !== 'undefined')
			if(typeof filter === 'object') {
				for(var l in filter)
					cmdArgs.push('-l '+l+'='+filter[l]);
			}
			else if(typeof filter === 'string')
				cmdArgs.push(filter);

		console.log('kubectl '+cmdArgs.join(' '));
		var cmd = spawn('kubectl', cmdArgs), out = '', err = '';

		cmd.stdout.on('data', function(data){
			//console.log(data.toString());
			out += data.toString();
		});

		cmd.stderr.on('data', function(data){
			//console.log(data.toString());
			err += data.toString();
		});
		cmd.on('close', function(code){
			//
			if(err){
				cb(err);
			}
			else {
				cb(null, out)
			}
		});
	}

	this.expose = function(name, options, cb){
		//
		
		var cmdArgs = ['expose', 'pod', name];
		for(var l in filter)
			cmdArgs.push(l+'='+filter[l]);

		console.log('kubectl '+cmdArgs.join(' '));
		var cmd = spawn('kubectl', cmdArgs), out = '', err = '';

		cmd.stdout.on('data', function(data){
			//console.log(data.toString());
			out += data.toString();
		});

		cmd.stderr.on('data', function(data){
			//console.log(data.toString());
			err += data.toString();
		});
		cmd.on('close', function(code){
			//
			if(err){
				cb(err);
			}
			else {
				cb(null, out)
			}
		});
	}
	
	return this;
}
*/

/*
var kube = {
	create : _create,
	createPodSpec : _createPodSpec,
	rc : _rc,
	svc : _svc,
	delete : _delete,
	pod : _pod
}



/*
kubectl.pod.get(function(err, data){
	console.log( (err)? 'err : '+err : data );
});
*/

/*
kubectl.create("YAML/example.yaml", function(err, data){
	console.log( (err)? 'err : '+err : data );
});
*/

/*
kubectl.delete("YAML/example.yaml", function(err, data){
	console.log( (err)? 'err : '+err : data );
});
*/

/*
kubectl.pod.expose("imagesoptimizer", {"--type" : "NodePort", "--target-port" : 3000}, function(err, data){
	console.log( (err)? 'err : '+err : data );
});
*/

//console.log(service_url('imagesoptimizer'));

/*
kubectl.pod.createSpec({
	name : 'ImagesOptimizer',
	version : '1.0.0',
	username : 'visionr',
	port : 80
}, 'skante/imagesoptimizer' , function(err, result){
	console.log( (err)?'Err : '+err : JSON.stringify(result) );
})
*/

var net = require('net');

var portInUse = function(port, cb) {
    var server = net.createServer(function(socket) {
		socket.write('Echo server\r\n');
		socket.pipe(socket);
    });

    return new Promise(resolve => {
	    server.listen(port, '127.0.0.1');
	    server.on('error', function (e) {
			resolve(true);
	    });
	    server.on('listening', function (e) {
			server.close();
			resolve(false);
	    });
	});
}

async function newAvailablePortInRange(range, port){
	
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
	var inuse = await portInUse(port);
	if(!inuse)
		return port;
	return newAvailablePortInRange(range);

	
}

console.log( newAvailablePortInRange({min : 30000, max : 35000}) );


