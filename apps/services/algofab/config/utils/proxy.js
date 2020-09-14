

var httpProxy = require('http-proxy');
var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs'), util = require('util');
var request = require('request');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var intoStream = require('into-stream');
var Cookies = require('cookies');

/*
module.exports = function(certs){
	class Proxy {

		constructor (target, port){
			if(!target.startsWith('http://'))
				target = 'http://'+target;
			this.target = target;
			this.port = port;
			console.log('target : '+target);
			
			var ref = this;
			
			//this.proxy = require("express-http-proxy");
			this.proxy = httpProxy.createServer({});
			this.app = express();
			
			
			this.app.all('*', function(req, res, next){
				console.log("Proxy's server recieved request");
				if(res.headersSent) return;
				ref.proxy.web(req, res, { target : target , changeOrigin : true } );
				
			});

			
			this.server = https.createServer(certs, this.app).listen(port, function() {
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
	return Proxy
}
*/

class Proxy {

	constructor (target, port){
		
		this.target = (/^(http:\/\/|https:\/\/|ws:\/\/|wss:\/\/)/.test(target))? target : "http://"+target;
		this.port = port;
		this.authTable = {};
		
		var ref = this;
		
		//this.proxy = require("express-http-proxy");
		//this.request = request(this.target);
		this.app = express();
		
		this.app.use(bodyParser.json({ 
		    verify : function(req, res, buff, encoding){

		        res.locals.buff = buff;
		        console.log("---------------------------------------------------");
		        console.log("RAW request json : "+buff);
		        console.log("---------------------------------------------------");
		    }
		}));

		this.app.use(bodyParser.urlencoded({ 
		    verify : function(req, res, buff, encoding){

		        res.locals.buff = buff;
		        console.log("---------------------------------------------------");
		        console.log("RAW request urlencoded : "+buff);
		        console.log("---------------------------------------------------");
		    }
		}));
		
		this.app.use(cookieParser());
		this.app.use(function(req, res, next){
			//
			if(!req.cookies.demoAuth){
				console.log("========= UNAUTHORIZED ========");
				return res.status(403).end("Not authorized");
			}

			if( !ref.authTable[req.cookies.demoAuth]){
				console.log("========= UNAUTHORIZED ========");
				return res.status(403).end("Not authorized");
			}
			console.log("========= AUTHORIZED ========");
			next();
		});

		this.app.all('*', function(req, res, next){
			//if( this.authBase.indexOf(req.session.user.username) >= 0 ){
				//console.log("SESSIONS : "+util.inspect(req.session.user));

				var trgt = ref.target+req.originalUrl, rqst = request(trgt);
				console.log("\nProxying "+req.protocol+'://'+req.hostname+req.originalUrl+"\t>>>>\t"+trgt);
				
				let stream;
			    if(res.locals.buff){
			        let text = res.locals.buff;
			        stream = intoStream(text);
			        stream.method  = req.method;
			        stream.headers = req.headers;
			    }
			    else {
			        stream = req;
			    }
				
				//var cookie = Cookies(req, res, { domain : "tl.teralab-datascience.fr" } );// { domain : global.settings.DEMO.name, maxAge : 1000*60*60 });
                //var signedOrdUnsigned = (global.settings.DEMO.certs)? { signed : true } : { httpOnly : false };
                
                //var coolfromdemo = cookie.get('coolfromdemo');
                    
				//console.log("req.headers : "+ util.inspect(req.headers));
				//console.log("req.cookies : "+ util.inspect(req.cookies));
				//console.log("cookie : "+ util.inspect(cookie));
				//console.log("coolfromdemo : "+ util.inspect(coolfromdemo));

				stream.pipe(rqst).pipe(res);
				rqst.on('response', function(response) {
					console.log("Proxying "+req.hostname+req.originalUrl+"\t<<<<\t"+trgt+' : '+response.statusCode+"\n" );
				}).on('error', function(error) {
					console.log("Proxy Error, message : "+error.toString());
				});
			//}
			//else {
			//	res.status(403).end("You are not authorized to pass through that proxy");
			//}
		});

		var onListen = function() {
		    console.log('Proxy server listening on port ' + ref.port);
		}
		console.log("global.settings.DEMO.certs : "+global.settings.DEMO.certs);
		this.server = (global.settings.DEMO.certs)? 
							https.createServer(global.settings.DEMO.certs, this.app).listen(ref.port, onListen) :
								http.createServer(this.app).listen(ref.port, onListen);
		
		
	}
	
	grantAuthorization(id) {
		if( !(id in this.authTable) || !this.authTable[id] )
			this.authTable[id] = true;
	}
	
	revokeAuthorization(id) {
		this.authTable[id] = false;
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

module.exports = Proxy;
