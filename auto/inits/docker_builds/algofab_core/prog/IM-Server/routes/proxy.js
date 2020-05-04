

var httpProxy = require('http-proxy');
var express = require('express');
var https = require('https');


class Proxy {

	constructor (target, port){
		
		this.start();
	}

	start() {
		
		var onProxyReq = function(proxyReq, req, res, options){
			console.log("Proxying from "+req.hostname+" to "+target);
		}
		var onProxyError = function(error){
			console.log("Proxy Error, message : "+error.toString());
			this.app.close();
		}

		this.proxy = httpProxy.createProxyServer({});
		this.proxy.on('proxyReq', onProxyReq);
		this.proxy.on('error', onProxyError);

		this.app = express();
		
		https.createServer({
		    key: fs.readFileSync(__dirname+'/../0000_key-certbot.pem', 'utf8'),
		    cert: fs.readFileSync(__dirname+'/../fullchain.pem', 'utf8')
		}, app).listen(port, function() {
		    console.log('Proxy server listening on port ' + port);
		});
		
		this.app.all('*', function(err, req, res, next){
			if(err) return;
			if(req.protocol == 'http' || req.protocol == 'https'){
				proxy.web(req, res, { target : target } );
			}
			else if (req.protocol == 'ws' || req.protocol == 'wss'){
				proxy.ws(req, res, { target : target } );
			}
		});
	}

	get_proxy() {
		//
		return this.proxy;
	}

}

module.exports = Proxy;