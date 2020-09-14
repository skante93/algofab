
var Docker = require('dockerode');
var docker = new Docker({socketPath: '/var/run/docker.sock'});


console.log(__dirname+'/containers/Dockerfile.tar.gz');

var MI = (function(){
	
	this.createImage = function(tarPath, algoName, cb){
		docker.buildImage(tarPath, {t: algoName.toLowerCase()}, function (err, response){
			if(err){
				console.log(err);
			}
			else{
				console.log('Image '+algoName+' created.');
			}
			cb(err, response);
		});
	};
	this.createContainer = function(algoName, cb){
		docker.createContainer({Image: algoName.toLowerCase()}, function (c_err, containerID) {
			if(!c_err){
				//console.log('container.id : ' + containerID.id);
				var container = docker.getContainer(containerID.id);
				container.start(function (s_err, data) {
					if(!s_err) {
						container.inspect(function(i_err, inf){
							if(i_err)
								console.log(i_err);
								cb(i_err, inf);
							else{
								console.log(inf);
								cb(err, inf);
							}
						});
					}
					else{
						console.log(s_err);
						cb(s_err, data);
					}
				});
			}
			else {
				console.log(c_err);
				cb(c_err, containerID)
			}
		});
	};
	
	this.removeContainer = function(CID, cb){
		var container = docker.getContainer(CID);
		container.stop(function (s_err, data) {
			if(!s_err) {
				container.remove(function (r_err, r_data) {
					cif(i_err)
						console.log(i_err);
						cb(i_err, r_data);
					else{
						console.log(r_data);
						cb(err, r_data);
					}
				});
			}
			else{
				console.log(s_err);
				cb(s_err, data);
			}
		});
		
	};

})()
/*
docker.createContainer({Image: 'docker/whalesay', Cmd: ['/bin/bash'], name: 'ubuntu-test'}, function (err, containerID) {
	if(!err){
		console.log('container.id : ' + containerID.id);
		
		//container.start(function (err, data) {

		//});
	}
	else
		console.log(err);
});
*/

MI.createContainer('customtag5', function(err, resp){
	if(err) {
		console.log('END WITH ERROR');	
	}
	else
		console.log('END SUCCESSFULLY');
});

module.exports = MI;