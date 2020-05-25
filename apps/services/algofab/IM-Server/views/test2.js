

const spawn = require('child_process').spawn; 
var restler = require('restler'), fs = require('fs');

var MI = (function(){
	if(typeof this.workingContainers === 'undefined')
		this.workingContainers = [];

	/*
	this.createContainer = function(algoName, dockerFileUrl, cb){
		console.log('Creating container');
		console.log('\talgoName : '+algoName+' dockerFileUrl'+dockerFileUrl);
		
		
		var cmdOpts = '-v -H "Content-Type : application/tar" -X POST --data-binary \'@'+dockerFileUrl+'\' http://localhost/build?t='+algoName.toLowerCase()+' --unix-socket /var/run/docker.sock';

		console.log('\tExecuting : "curl ' + cmdOpts+' ');

		var cmd = spawn('curl', cmdOpts.split(' '), {shell : true});
		var cmd_out = '', cmd_err = '';

		cmd.stdout.setEncoding('utf8');
		cmd.stdout.on('data', function(data){
			cmd_out += data;
		});
		cmd.stderr.on('data', function(data){
			cmd_err += data;
		});
		cmd.on('close', function(exitcode){
			cb(null, [cmd_out, cmd_err]);
		});
	};
	
	this.removeContainer = function(algoName, cb){
		console.log('Removing container');
		console.log('\talgoName : '+algoName);
		
		
		var cmdOpts = '-v -H "Content-Type : application/tar" -X DELETE http://localhost/images/'+algoName.toLowerCase()+'?force=1 --unix-socket /var/run/docker.sock';

		console.log('\tExecuting : "curl ' + cmdOpts+' ');

		var cmd = spawn('curl', cmdOpts.split(' '), {shell : true});
		var cmd_out = '', cmd_err = '';

		cmd.stdout.setEncoding('utf8');
		cmd.stdout.on('data', function(data){
			cmd_out += data;
		});
		cmd.stderr.on('data', function(data){
			cmd_err += data;
		});
		cmd.on('close', function(exitcode){
			cb(null, [cmd_out, cmd_err]);
		});
	};
	*/
	
	
	this.createContainer = function(algoName, dockerFileUrl, cb){
		console.log('Creating container');
		console.log('\talgoName : '+algoName+' dockerFileUrl : '+dockerFileUrl);
		
		var postParams = {
			multipart: true,
			headers : {'Content-Type' : 'application/tar'},
			data: {
				'dockerfile': restler.file(dockerFileUrl, null, 321567, null, 'audio/mpeg')
			}
		};

		restler.post('http://localhost:5555/build?t='+algoName, postParams).on('complete', function(data) {
			console.log('Completed : '+data);
		}).on('error', function(data) {
			console.log('Error : '+data);
		});
	};
	

	/*
	this.deleteContainer = function(algoName, cb){
		console.log('Deleting container '+algoName);

	};
	
	this.startContainer = function(algoName, cb){
		console.log('Starting container '+algoName);

		var cmdOpts = '-v -X POST -H "Content-type:application/tar" --data-binary \'@'+dockerFileUrl+'\' http://localhost:5555/build?t='+algoName;

		var cmd = spawn('curl', cmdOpts.split(' '));
		var cmd_out = '', cmd_err = '';

		cmd.stdout.setEncoding('utf8');
		cmd.stdout.on('data', function(data){
			cmd_out += data;
		});
		cmd.stderr.on('data', function(data){
			cmd_err += data;
		});
		cmd.on('close', function(exitcode){
			cb();
		});
	};
	
	this.restartContainer = function(algoName, cb){
		console.log('Restarting container '+algoName);
	};
	
	this.stopContainer = function(algoName, cb){
		console.log('Stoping container '+algoName);
	};
	
	this.getContainerIPAdress = function(algoName, cb){
		console.log('Getting container IP Adress '+algoName);
	};
	
	this.getContainerList = function(algoName, cb){
		console.log('Creating container '+algoName);
	};
	
	this.getContainerList = function(algoName, cb){
		console.log('Creating container '+algoName);
	};
	*/
	return this;
})();

module.exports = MI;

/*
MI.createContainer('ImagesOptimzer', './containers/Dockefile', function(){
	console.log('Yeah');
});
*/