

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

var express_http_proxy = require('express-http-proxy');

PROXY_CONF = {};
var router = express.Router();

router.use ('/5d2860296f0b6400a2872a86/http', express_http_proxy('http://10.102.214.239:80'));
`
router.all('*', function(req, res, next){
	var url = req.originalUrl, proto = url.split('/')[3], apiUrl = url.split('/').splice(4).join('/');
	console.log('Porxy : originalUrl : '+url);
	console.log('Porxy : proto : '+proto);
	console.log('Porxy : apiUrl : '+apiUrl);
	
	if(!req.cookies.demoAuth){
		console.log("========= UNAUTHORIZED ========");
		return res.status(403).end("Not authorized");
	}
	console.log('Porxy : req.cookies.demoAuth : '+req.cookies.demoAuth);
	var info = null;
	for (var algoID in PROXY_CONF){
		if (url.startsWith('/proxy/'+algoID)){
			info = PROXY_CONF[algoID];
			break;
		}
	}

	if (info == null) {
		return res.status(404).end("could not find AV");
	}
	
	if( !info.auth[req.cookies.demoAuth]){
		console.log("========= UNAUTHORIZED ========");
		return res.status(403).end("Not authorized");
	}
	

	console.log("========= AUTHORIZED ========");
	//var targetPort = (t) => parseInt(t.split(':')[1]);

	//console.log("targets : "+JSON.stringify(info.targets, null, 2));
	
	var trgt = proto+'://'+info.targets[proto]+apiUrl;//, rqst = request(trgt);
	console.log("trgt : "+trgt);
	router.stack.unshift({route: req.originalUrl, handle: express_http_proxy(trgt)});
	//req.pipe(rqst);
	//rqst.pipe(res);
	


	//};

	/*
	var trgt = self.target+req.originalUrl, rqst = request(trgt);
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
	
	stream.pipe(rqst).pipe(res);
	rqst.on('response', function(response) {
		console.log("Proxying "+req.hostname+req.originalUrl+"\t<<<<\t"+trgt+' : '+response.statusCode+"\n" );
	}).on('error', function(error) {
		console.log("Proxy Error, message : "+error.toString());
	});
	*/

	//var trgt = self.target+req.originalUrl, rqst = request(trgt);
	//req.pipe(rqst);
	//rqst.pipe(res);	
});
`
dodo = `
class Proxy {

	constructor (target, port){
		
		//this.target = (/^(http:\/\/|https:\/\/|ws:\/\/|wss:\/\/)/.test(target))? target : "http://"+target;
		//this.port = port;
		//this.authTable = {};
		
		var self = this;
		
		
		
		/*
		router.use(bodyParser.json({ 
		    verify : function(req, res, buff, encoding){

		        res.locals.buff = buff;
		        console.log("---------------------------------------------------");
		        console.log("RAW request json : "+buff);
		        console.log("---------------------------------------------------");
		    }
		}));
		
		router.use(bodyParser.urlencoded({ 
		    verify : function(req, res, buff, encoding){

		        res.locals.buff = buff;
		        console.log("---------------------------------------------------");
		        console.log("RAW request urlencoded : "+buff);
		        console.log("---------------------------------------------------");
		    }
		}));
		

		router.use(cookieParser());
		*/
		/*
		router.use(function(req, res, next){
			//
			if(!req.cookies.demoAuth){
				console.log("========= UNAUTHORIZED ========");
				return res.status(403).end("Not authorized");
			}

			if( !self.authTable[req.cookies.demoAuth]){
				console.log("========= UNAUTHORIZED ========");
				return res.status(403).end("Not authorized");
			}
			console.log("========= AUTHORIZED ========");
			next();
		});
		*/

		
		/*
		var onListen = function() {
		    console.log('Proxy server listening on port ' + self.port);
		}
		console.log("global.settings.DEMO.certs : "+global.settings.DEMO.certs);
		this.server = (global.settings.DEMO.certs)? 
							https.createServer(global.settings.DEMO.certs, this.app).listen(self.port, onListen) :
								http.createServer(this.app).listen(self.port, onListen);
		*/
		
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
*/`

module.exports = router;
