

var express = require('express');
var bCrypt = require('bcrypt-nodejs');

var util = require('util');
var jwt = require('jwt-simple');



module.exports = function(SG){
	var User = SG.mongo.model('User');
	var m_Algos = SG.mongo.model('Algos');
	var m_Algos2 = SG.mongo.model('Algos2');
	var m_AlgosMeta = SG.mongo.model('AlgosMeta');

	var router = express.Router();

	var ALGO ;
	
	router.use(function(req,res, next){ ALGO = undefined; next(); });

	router.use('/:algoname/:version', function(req, res, next){
	    console.log("MIDDLEWARE 4");
	    if(req.params.version && /^[0-9]+\.[0-9]+\.[0-9]+$/.test(req.params.version)){
	        m_AlgosMeta.findOne({title : req.params.algoname }).populate({
	        	path : "versions",
	        	match : {
	        		version : req.params.version
	        	},
	        	populate : {
	        		path : "meta"
	        	}
	        }).exec(function(err, algo){
		        console.log('+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
		        console.log(err || 'Algo : '+util.inspect(algo));
		        console.log('+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
	        
	            if(err || !algo){
	                next();
	                return;
	            }
	            console.log("algo.versions.length : "+algo.versions.length);
	            if(algo.versions.length == 0)
	            	return res.status(500).json({ status : "failure", message : "There is no version "+req.params.version+" for Algorithm "+req.params.algoname });


	            if(SG.CONTEXT.algo && SG.CONTEXT.algo._id.toString() != algo.versions[0]._id.toString())
	                return res.status(500).json({ status : "failure", message : "The same context can't execute two different algorithms" });
				
	            ALGO = SG.CONTEXT.algo = algo.versions[0];
	            //URI = req.originalUrl.replace(new RegExp('/'+req.params.algoname+'/'+req.params.version+'\/?'), '');
	            
	            //m_Context.update({_id : SG.CONTEXT._id}, { $set : { "status.text" : "PROCESSING", "status.since" : Date.now(), "algo" : algo._id } }, function(err){
	            m_Context.update({_id : SG.CONTEXT._id}, { $set : { "algo" : algo.versions[0]._id } }, function(err){
	            	if (err)
	            		console.log("Could not update context : "+err);
	            	else
	            		console.log("Conextext updated");
	            });
	            next();
	        });
	        return;
	    }
	    next();
	});

	router.use('/:algoname/', function(req, res, next){
	    console.log("MIDDLEWARE 5");
	    if( ALGO ){
	        console.log("");
	        return next();
	    }

	    m_AlgosMeta.findOne({title : req.params.algoname}).populate({
	    	path : 'versions',
	    	options : { sort : {version : -1 }, limit : 1 },
	    	populate : {
	    		path : "meta"
	    	}
	    }).sort({version : -1}).exec(function(err, algo){
	    	console.log('+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
	        console.log(err || 'Algo : '+util.inspect(algo));
	        console.log('+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
	        if(err || !algo){
	            //console.log("err || !algo : "+(err || !algo));
	            res.status(400).end("There is no algo by the name \""+req.params.algoname+"\"");
	            return;
	        }
	        if(algo.versions.length == 0)
            	return res.status(500).json({ status : "failure", message : "There is no version for algorithm "+req.params.algoname});

	        //console.log("SG.CONTEXT.algo._id : "+util.inspect(SG.CONTEXT.algo._id));
	        //console.log("algo.versions[0]._id : "+algo.versions[0]._id);
	        if(SG.CONTEXT.algo && SG.CONTEXT.algo._id.toString() != algo.versions[0]._id.toString())
	            return res.status(500).json({ status : "failure", message : "The same context can't execute two different algorithms" });


	        SG.CONTEXT.algo = algo.versions[0];
	        //URI = req.originalUrl.replace(new RegExp('/'+req.params.algoname+'\/?'), '');
	        
	        //m_Context.update({_id : SG.CONTEXT._id}, { $set : { "status.text" : "PROCESSING", "status.since" : Date.now(), "algo" : algo._id } }, function(err){
            m_Context.update({_id : SG.CONTEXT._id}, { $set : { "algo" : algo.versions[0]._id } }, function(err){
            	if (err)
            		console.log("Could not update context : "+err);
            	else
            		console.log("Conextext updated");
            });

	        next();
	    });
	});

	return router;
}


