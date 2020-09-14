const net = require('net');

const settings = require('../settings');

var default_host_port_range = (settings.app_settings.host_port_range)? settings.app_settings.host_port_range : {min: 30000,max: 32767};

function portAvailable(port, callback) {

	var server = net.createServer(function(socket) {
		socket.write('Echo server\r\n');
		socket.pipe(socket);
    });

    server.listen(port, '127.0.0.1');
    server.on('error', function (e) {
		callback(false);
    });
    server.on('listening', function (e) {
		server.close();
		callback(true);
    });
};


function randomAvailablePort (range, callback, attempts){
	if (typeof range === 'function' && typeof callback === "undefined"){
		callback = range;
		range = default_host_port_range;
	}

	if (typeof attempts === 'undefined') 
		attempts = {max:5, current:0};

	//console.log("attemp n° ", attempts.current);
	
	if (attempts.current >= attempts.max ) 
		return callback(new Error(`Could not find a random available port in ${attempts.max} attemps`));
	
	var p = Math.round(Math.random() * (range.max-range.min)) + range.min;

	//console.log("Let's check for ", p);
	
	portAvailable(p, function(ok){
		if (ok){
			callback(null, p);
		}
		else{
			attempts.current ++;
			randomAvailablePort(range, callback, attempts);
		}
	});
}

async function randomAvailablePortSync (range, attempts){
	if (typeof range === "undefined"){
		range = default_host_port_range;
	}

	if (typeof attempts === 'undefined') 
		attempts = {max:5, current:0};

	//console.log("attemp n° ", attempts.current);
	
	if (attempts.current >= attempts.max ) 
		return new Error(`Could not find a random available port in ${attempts.max} attemps`);
	
	var p = Math.round(Math.random() * (range.max-range.min)) + range.min;

	//console.log("Let's check for ", p);
	
	var ok = await new Promise(resolve=>{ portAvailable(p, resolve); });
	if (ok){
		return p;
	}
	else{
		attempts.current ++;
		return randomAvailablePortSync(range, attempts);
	}
}

exports.portAvailable = portAvailable;
exports.randomAvailablePort = randomAvailablePort;
exports.randomAvailablePortSync = randomAvailablePortSync;