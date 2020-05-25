

var express = require('express');
var bCrypt = require('bcrypt-nodejs');

var util = require('util');
var jwt = require('jwt-simple');
var restler = require("restler");


module.exports = function(SG) {

	var router = require('./algo')(SG);
	
	router.use(function(req, res, next){
		if(SG.url){
			return next();
		}

		console.log("########################################################################");
		console.log("SG.CONTEXT.algo : "+util.inspect(SG.CONTEXT.algo));
		get_svc_url(SG, SG.CONTEXT.algo._id.toString(), function(err, result){
			if(err){
				console.log('ssssssssssssssssssssssssssssssssssssssssssssssssssss')
				console.log(err);
				return res.status(500).json({ status : "failure", message : "internal error"});
			}

			SG.CONTEXT.url = result;
			next();
		});
	});
	return router;
}

var get_svc_url = function(SG, id, cb){
	restler.post(SG.params.MI_PROTOCOL + SG.params.MI_ADDR +':'+ SG.params.MI_PORT+ "/new-service-port", 
    	{ data : {_id : id} }
    ).on('complete', function (body, httpResponse) {
        
        console.log("body : "+body);
        console.log("util.inspect(body) : "+require('util').inspect(body));
        var rtr = 0;
        if(body instanceof Error || !body) {
        	if(rtr < 10){
                console.log('Err : '+ body)
                this.retry(1000);
                rtr++;
            }
            else
            	cb("Couldn't create the service, the IM is temporarily unavailable");	
        }
        else {
        	var json = {};
        	try{
        		json = JSON.parse(body);
        	}catch(e){
        		return cb('Failure. Error message : Internal communication error');
        	}

        	if (json.status == 'failure'){
        		return cb('Failure. Error message : '+json.message);
        	}
        	cb(null, SG.params.MI_ADDR+':'+json.message)
        }
    });
}