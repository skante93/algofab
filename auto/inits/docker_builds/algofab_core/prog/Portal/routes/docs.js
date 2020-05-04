
var express = require('express');
var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');
var restler = require('restler');

var request = require('request');


var router = express.Router();


module.exports = function(SG){
	router.all('*', function(req, res){
		//
		console.log("url : "+req.originalUrl);
		var url = req.originalUrl.replace(/^.*docs\//, "");
		console.log("url : "+url);

		var rqst = request('http://docs'+url);

		req.pipe(rqst).pipe(res);
	});
	return router;
};
