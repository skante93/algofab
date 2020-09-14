



var MI = require('./test2.js');


MI.createContainer('ImagesOptimzerSolomani', './containers/Dockerfile.tar.gz', function(err, out){
	if(out[0])
		console.log('ERR : ' + out[0]+'\n\n');
	if(out[1])
		console.log('OUT : ' + out[1]+'\n\n');
});

/*
MI.removeContainer('ImagesOptimzerSolomani', function(err, out){
	if(out[0])
		console.log('ERR : ' + out[0]+'\n\n');
	if(out[1])
		console.log('OUT : ' + out[1]+'\n\n');
});
*/
/*
const spawn = require('child_process').spawn;

var MI = function(){
	//if(typeof this.containers === 'undefined')
	//	this.containers = {};
	//
	var MI = this;

	this.containerExists = function(contName, cb) {
		var cmd = spawn('docker', ['images']);
		cmd.stdout.setEncoding('utf8');
		
		var out = '', err = '';
		
		cmd.stdout.on('data', function(data){
			out += data;
		});
		
		cmd.stderr.on('data', function(data){
			err += data;
		});
		
		cmd.on('close', function(exitcode){
			var lines = out.split('\n');
			for(var i=0; i<lines.length; i++){
				//console.log('this line:  '+lines[i]);
				//console.log('contName:  '+contName);
				//var matches =  new RegExp('^'+contName+'').test(lines[i]) ;
				//console.log('matches : '+matches);
				if(new RegExp('^'+contName+'').test(lines[i])){
					//console.log('YEAAAAAAAAAAAH')
					cb(null, true);
					return;
				}
			}
			//console.log('DAMN IT')
			cb(err, false);
		}); 

	} 

	this.launchContainer = function(label, options, cb){
		//console.log(require('util').inspect(options));
		var completeName = options.os.name+((options.os.version)? ':'+options.os.version : '');
		var cmdOptions = ['run', completeName];
		if(options.args){
			for(var i = 0; i<options.args.split(' ').length; i++)
				cmdOptions.push(options.args.split(' ')[i]);
		}
		
		this.containerExists(completeName, function(err, confirm){
			if(confirm){
				console.log('Running : docker '+cmdOptions.join(' '));
				var cmd = spawn('docker', cmdOptions);
				var out = '', err = '';

				cmd.stdout.on('data', function(data){
					out += data;
				});
				
				cmd.stderr.on('data', function(data){
					err += data;
				});
				
				cmd.on('close', function(exitcode){
					cb(null, {out, err});
				});
			}
			else {
				console.log('The container doesn\'t exist, pulling it now ...');
				var pull = spawn('docker', ['pull', completeName]), pout='', perr='';
				pull.stdout.on('data', function(data){
					pout += data;
				});
				
				pull.stderr.on('data', function(data){
					perr += data;
				});

				pull.on('close', function(exitcode){
					MI.containerExists(completeName, function(err, confirmpull){
						if(confirmpull) {
							console.log('Running : docker '+cmdOptions.join(' '));
							var cmd = spawn('docker', cmdOptions);
							var out = '', err = '';

							cmd.stdout.on('data', function(data){
								out += data;
							});
							
							cmd.stderr.on('data', function(data){
								err += data;
							});
							
							cmd.on('close', function(exitcode){
								cb(null, {out, err});
							});
						}
						else {
							console.log('The creation failed, here is the pulling error message : ');
							console.log(perr);
							cb(perr, null);
						}
					});
				});
			}
		});
	};
	
	return this;
};

var MI = MI();
/*MI.containerExists('docker/whalesay', function(err, confirm){
	if(confirm){
		console.log('Yes it exists');
	}
	else {
		console.log('No it doesn\'t exist.');
	}
});
*/
/*
MI.launchContainer( 'algoName', {
						os : {
							name : 'docker/whalesay'
						},
						args : "cowsay boo-boo"
					}, function(err, result){
	if(result){
		console.log(result.out+'\n\n');
		//console.log('result.err : \n'+result.err+'\n\n');
	}
	else {

		console.log('The creation failed');
		console.log('err : '+err);
	}
});
*/