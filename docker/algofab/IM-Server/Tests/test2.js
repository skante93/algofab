

/*
var stringify = function(jsonObj, pretty, indent){
	if(typeof jsonObj === 'undefined' || jsonObj == null)
		return null;
	else if( typeof jsonObj === 'string'  || typeof jsonObj === 'number')
		return jsonObj;
	else if (Array.isArray(jsonObj)){
		//console.log('DEALING WITH AN ARRAY');
		if((typeof pretty !=='undefined') && pretty == true){
			var str = '[\n';
			if(typeof indent ==='undefined') indent = 1;
			var marge = '';
			//console.log('indent : '+ indent);
			for(var i=0; i<indent; i++) marge +='\t';

			for(var i=0; i<jsonObj.length; i++){
				
				if(typeof jsonObj[i] === 'string'){
					str += marge+'"'+jsonObj[i]+'"';
				}
				else if(typeof jsonObj[i] === 'number'){
					str += marge+jsonObj[i];
				}
				else {
					str += marge+stringify(jsonObj[i], true, indent+1);
				}
				
				str += (i<jsonObj.length-1)? ',\n' : '\n';
			}
			str += marge.substring(1)+']';
			return str;
		}
		else {
			var str = '[';
			for(var i=0; i<jsonObj.length; i++){
				if(typeof jsonObj[i] === 'string'){
					str += '"'+jsonObj[i]+'"';
				}
				else if(typeof jsonObj[i] === 'number'){
					//console.log('Aother object going arround');
					str += jsonObj[i];
				}
				else{
					str += stringify(jsonObj[i]);
				}
				str += (i<jsonObj.length-1)? ',' : '';
			}
			str += ']';
			return str;
		}
	}
	else if (typeof jsonObj === 'object'){
		//console.log('DEALING WITH AN object');
		
		if((typeof pretty !=='undefined') && pretty == true){
			var str = '{\n', keys = Object.keys(jsonObj);
			if(typeof indent ==='undefined') indent = 1;
			var marge = '';
			//console.log('indent : '+ indent);
			for(var i=0; i<indent; i++) marge +='\t';

			for(var i=0; i<keys.length; i++){
				
				if(typeof jsonObj[keys[i]] === 'string'){
					str += marge+'"'+keys[i]+'" : "'+jsonObj[keys[i]]+'"';
				}
				else if(typeof jsonObj[keys[i]] === 'number'){
					str += marge+'"'+keys[i]+'" : '+jsonObj[keys[i]];
				}
				else {
					str += marge+'"'+keys[i]+'" : '+stringify(jsonObj[keys[i]], true, indent+1);
				}
				
				str += (i<keys.length-1)? ',\n' : '\n';
			}
			str += marge.substring(1)+'}';
			return str;
		}
		else {
			var str = '{', keys = Object.keys(jsonObj);
			for(var i=0; i<keys.length; i++){
				if(typeof jsonObj[keys[i]] === 'string'){
					str += '"'+keys[i]+'":"'+jsonObj[keys[i]]+'"';
				}
				else if(typeof jsonObj[keys[i]] === 'number'){
					//console.log('Aother object going arround');
					str += '"'+keys[i]+'":'+jsonObj[keys[i]];
				}
				else{
					str += '"'+keys[i]+'":'+stringify(jsonObj[keys[i]]);
				}
				str += (i<keys.length-1)? ',' : '';
			}
			str += '}';
			return str;
		}
	}
};


console.log(stringify({
	a : "a",
	b : "b",
	c : [{
		t1_c1 : "c1",
		t1_c2 : "c2",
		t1_c3 : {
			t1_c31 : "c31",
			t1_c32 : "c32"
		},
		t1_c4 : "c4"
	}, {
		t2_c1 : "c1",
		t2_c2 : "c2",
		t1_c4 : "c4"
	}, "Some Text", 154],
	d : "d",
	e : 72
}, true));

*/

/*
var t = [{}, "", [], 15];
console.log(Array.isArray(t));
*/

/*
var fs = require('fs');
var stat = fs.statSync(__dirname+'/container/Dockerfile.tar.gz');
console.log('stat : ' + require('util').inspect(stat));
*/

/*
Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

var t = ['ab', , 'cd', , 'ef'];
console.log(t.clean(undefined));
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

var newPortToUse = function(range, cb, port){
	
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
	
	
	//console.log('Range : '+range);
	//console.log('CB : '+cb);
	//console.log('Port : '+port);
	
	portInUse(port, function(inuse){
		if(inuse){
			newPortToUse(range, cb);
		}
		else
		{
			cb(port);
		}
	});
};

newPortToUse({min : 8100, max : 8110}, function(p){
	console.log('Port = '+p);
}, 22);

exports.sayHello = function(){
	console.log('Hello boy');
}

exports.sayHello();
*/
/*
var fs = require('fs'), path = require('path');
var mkdirp = require('mkdirp');
var spawnSync = require('child_process').spawnSync;

var untar = function(f_path, to_dir, cb){
	if(!fs.existsSync(f_path)){
		cb(new Error(f_path+" does not exist"));
		return;
	}

	mkdirp(to_dir, function(err){
		if(err){
			cb(err);
			return;
		}
		var mv = spawnSync('mv', [f_path, to_dir]);
		if(mv.stderr.toString() != ''){
			cb(mv.stderr.toString());
			return;
		}
		var filename = path.posix.basename(f_path);
		var cmd = spawnSync('tar', ['xvf', filename], {cwd : to_dir});

		if(cmd.stderr.toString() != ''){
			cb(cmd.stderr.toString());
			return;
		}

		cb()
	});
}

var extractOnTheSpot = function(f_path, cb){
	var filename = path.posix.basename(f_path);
	var newDirName = filename.replace(/\..*$/, '');
	newDirName = f_path.replace(filename, newDirName);

//	console.log('filename : '+filename);
//	console.log('newDirName : '+newDirName);

	untar(f_path, newDirName, cb);
}

var removeFileOrDir = function(f_path, cb){

	var cmd = spawnSync('rm', ['-r', f_path]);
	if(cmd.stderr.toString() != ''){
		cb(cmd.stderr.toString());
		return;
	}

	cb( (cmd.stderr.toString() != '')? cmd.stderr.toString() : null);
};
*/
/*
untar('/tmp/sdjkbzdfj.tar.gz', '/home/cloud/Kantesco', function(err){
	if(err){
		console.log(err);
	}
	else
		console.log('Succesfully ended');
});
*/

/*
extractOnTheSpot('/tmp/sdjkbzdfj.tar.gz', function(err){
	if(err){
		console.log(err);
	}
	else
		console.log('Succesfully ended');
});
*/
/*
removeFileOrDir('/tmp/sdjkbzdfj', function(err){
	if(err){
		console.log(err);
	}
	else
		console.log('Succesfully ended');
});
*/

var app = require('express')();
app.use(require('morgan')('dev'));
var debug = require('debug')('my-application');
var path = require('path');
var bodyParser = require('body-parser');



app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

var server = app.listen(32088, function() {
  debug('Express server listening on port ' + server.address().port);
});

var tab = [{ id : 1, version : "1.1.1"}, { id : 2, version : "2.1.1"}, { id : 3, version : "3.1.1"}, { id : 4, version : "4.1.1"}]

app.post('/', function(req, res){
	console.log("req.body.v : "+req.body.v)
	res.render('test', { title : "test", tab : tab, v : req.body.v})
});