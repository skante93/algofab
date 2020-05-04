

var httpProxy = require('http-proxy');
var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs'), util = require('util');
var request = require('request');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

/*
class Proxy {

	constructor (target, port){
		
		this.target = target;
		this.port = port;

		
		var ref = this;
		
		//this.proxy = require("express-http-proxy");
		this.proxy = httpProxy.createServer({});
		this.app = express();
		
		
		this.app.all('*', function(req, res, next){
			console.log("Proxy's server recieved request");
			if(res.headersSent) return;
			ref.proxy.web(req, res, { target : target.startsWith('http://')? target : 'http://'+target, changeOrigin : true  } );
			
		});

		
		this.server = https.createServer({
		    key: fs.readFileSync(__dirname+'/../certs/privkey.pem', 'utf8'),
		    cert: fs.readFileSync(__dirname+'/../certs/fullchain.pem', 'utf8'),
    		ca :  fs.readFileSync(__dirname+'/../certs/chain.pem', 'utf8')
		}, this.app).listen(port, function() {
		    console.log('Proxy server listening on port ' + port);
		});
		
		
		//this.server = http.createServer(this.app).listen(port, function() {
		//    console.log('Proxy server listening on port ' + port);
		//});
		
		
		

		var onProxyReq = function(proxyReq, req, res, options){
			console.log("Proxying "+req.hostname+req.originalUrl+"\t>>>>\t"+target);
		}
		var onProxyRes = function(proxyRes, req, res){
			console.log("Proxying "+req.hostname+req.originalUrl+"\t<<<<\t"+target+' : '+proxyRes.statusCode );
		}
		var onProxyError = function(error){
			console.log("Proxy Error, message : "+error.toString());
		}

		
		this.proxy.on('proxyReq', onProxyReq);
		this.proxy.on('proxyRes', onProxyRes);
		this.proxy.on('error', onProxyError);
	}

	close (){
		this.server.close();
		this.proxy.close();
	}
	set_id (_id) {
		this._id = _id;
	}
	get_id () {
		return this._id;
	}
	get_port () {
		return this.port;
	}
	get_proxy() {
		//
		return this.proxy;
	}
	restart() {
		
		
	}
}
*/
module.exports = function(certs){
	class Proxy {

		constructor (target, port){
			
			this.target = (/^(http:\/\/|https:\/\/|ws:\/\/|wss:\/\/)/.test(target))? target : "http://"+target;
			this.port = port;
			//this.authBase = [];
			
			var ref = this;
			
			//this.proxy = require("express-http-proxy");
			//this.request = request(this.target);
			this.app = express();
			
			this.app.all('*', function(req, res, next){
				//if( this.authBase.indexOf(req.session.user.username) >= 0 ){
					console.log("Proxying "+req.hostname+req.originalUrl+"\t>>>>\t"+ref.target);
					var trgt = ref.target+req.originalUrl, rqst = request(trgt);
					req.pipe(rqst);

					rqst.on('response', function(response) {
						console.log("Proxying "+req.hostname+req.originalUrl+"\t<<<<\t"+trgt+' : '+response.statusCode );
					}).on('error', function(error) {
						console.log("Proxy Error, message : "+error.toString());
					}).pipe(res);
				//}
				//else {
				//	res.status(403).end("You are not authorized to pass through that proxy");
				//}
			});

			var onListen = function() {
			    console.log('Proxy server listening on port ' + port);
			}

			this.server = (typeof certs !== 'undefined')? 
								https.createServer(certs, this.app).listen(ref.port, onListen) :
									http.createServer(this.app).listen(ref.port, onListen);
			
			
		}

		/*grantAuthorization(username){
			if(this.authBase.indexOf(username) < 0)
				this.authBase.push(username)

		}*/
		close (){
			this.server.close();
			this.proxy.close();
		}
		set_id (_id) {
			this._id = _id;
		}
		get_id () {
			return this._id;
		}
		get_port () {
			return this.port;
		}
		get_proxy() {
			//
			return this.proxy;
		}
		restart() {
			
			
		}
	}

	return Proxy
}

