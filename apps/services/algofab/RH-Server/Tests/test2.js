
/*
var request = require('request');
request('http://localhost:62538/?f_name=Souleymane', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(response) // Show the HTML for the Google homepage.
  }
  else
  	console.log(error);
});
*/
/*
var fs = require('fs');
var request = require('request');

var formData = {
	abc : 'zero',
 	my_file: fs.createReadStream(__dirname + '/package.json'),
};
request.post({ url:'http://localhost:3002/', formData: formData}, function optionalCallback(err, httpResponse, body) {
  if (err) {
    return console.error('upload failed:', err);
  }
  console.log('Upload successful!  Server responded with:', body);
});

*/

const cluster = require('cluster');
var request = require('request');

if (cluster.isMaster) {
	console.log(`Master ${process.pid} is running`);

	var goFor2nd = false;
	var w1 = cluster.fork();
	var w2 = cluster.fork();
  	
  	cluster.workers[1].on('message', function(message){

	  	console.log('1 message : '+message);
	  	/*while(!goFor2nd)
	  		setTimeout(function(){}, 100)
		console.log('\n\n\nFINALLY\n\n\n');
		request('http://fr.yahoo.com', function (error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log(body) // Show the HTML for the Google homepage.
			}
			else
				console.log(error);
		});*/

	});
	cluster.workers[2].on('message', function(message){

	  	console.log('2 message : '+message);
	  	/*while(!goFor2nd)
	  		setTimeout(function(){}, 100)
		console.log('\n\n\nFINALLY\n\n\n');
		request('http://fr.yahoo.com', function (error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log(body) // Show the HTML for the Google homepage.
			}
			else
				console.log(error);
		});*/

	});

	cluster.on('exit', (worker, code, signal) => {
		console.log(`worker ${worker.process.pid} died`);
	});
} else {
	if(cluster.worker.id == 1) {
	/*	console.log('w1 Online');
	  	request('http://www.google.com', function (error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log(body) // Show the HTML for the Google homepage.
				console.log('\n\nPorcessing 2nd');
	*/			process.send({goFor2nd : true});
	/*		}
			else
				console.log(error);
		});
	*/}
}


/*
var request = require('request');
request('http://www.google.com', function (error, response, body) {
	if (!error && response.statusCode == 200) {
		console.log('\n\nbody : ' + body);
		console.log('\n\nPorcessing 2nd');
		request('http://www.google.com', function (error1, response1, body1){
			if (!error1 && response1.statusCode == 200) {
				console.log('\n\nbody1 : ' + body1);
			}
		});
	}
	else
		console.log(error);
});*/