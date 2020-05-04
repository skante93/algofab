



var express = require('express');
var bCrypt = require('bcrypt-nodejs');

var util = require('util');
var jwt = require('jwt-simple');
var httpProxy = require('http-proxy');
var url = require('url');
var request = require('request');

module.exports = function(SG) {

	var router = require('./context')(SG);
	var proxy = httpProxy.createServer({});
	router.use(function(req, res){
		//
		var target = SG.CONTEXT.url+req.originalUrl.replace(new RegExp(SG.CONTEXT.algo.meta.title+'\/([0-9]+\.[0-9]+\.[0-9]+)?'), '');
		target = target.startsWith('http://')? target : 'http://'+target
		console.log('target : '+target)
		console.log("SG.CONTEXT.algo.meta.title : "+SG.CONTEXT.algo.meta.title);

		var r = request(target);
		req.pipe(r);
		r.pipe(res)
		//	request.get(target).pipe(res);
		/*proxy.web(req, res, { target : target.startsWith('http://')? target : 'http://'+target, changeOrigin : true  } );
		var onProxyReq = function(proxyReq, req, res, options){
			console.log("req.originalUrl : "+req.originalUrl);
			req.Url = url.parse(req.originalUrl.replace('/HelloWorld/', ""));
			console.log("req. : "+req.originalUrl);
			//console.log('req.headers : '+util.inspect(req));
			console.log("RH | Proxying "+req.hostname+req.originalUrl+"\t>>>>\t"+target);
		}
		proxy.on('proxyReq', onProxyReq);
		*/
	});
	
	return router;
}

