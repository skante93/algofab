


var express = require('express');
var bCrypt = require('bcrypt-nodejs');

var util = require('util');
var jwt = require('jwt-simple');

var router = express.Router();

module.exports = function(SG){
	var User = SG.mongoose.model('User');
	var Context = SG.mongoose.model('Context');

	router.use(function(req, res, next){
		var tkn = req.headers.authorization;
		if( !(tkn && tkn.startsWith("Bearer ")) ) 
			return res.status(400).json({status : "failure", message : 'There needs to be a token a the format "Authorization: Bearer <Token>"'});
		
		tkn = tkn.replace("Bearer ", '');
		var decoded = jwt.decode(tkn, "RH JWT Secret");

		console.log('TKN : '+util.inspect(decoded));
		Context.findById(decoded.iss).populate('owner').exec(function(err, result){
			//
			if(err)
				return res.status(500).json({status : "failure", message : "DB error"});
			if(!result)
				return res.status(401).json({status : "failure", message : "There is not context corresponding to the sent token"});
			
			//res.json({ status : "success", message : result});
			SG.CONTEXT = result;
			next();
		});
	});

	return router;
}

