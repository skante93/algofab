

var express = require('express');
var bCrypt = require('bcrypt-nodejs');

var util = require('util');
var jwt = require('jwt-simple');



module.exports = function(SG){
	var User = SG.mongo.model('User');
	var Context = SG.mongo.model('Context');

	var router = express.Router();
	router.post('/_new_context', function(req, res){
		var username = req.body.username;
		var password = req.body.password;
		
		console.log('username : ' + username + ', password : ' + password + ',  !username || !password = ' +(!username || !password) );
		if( !username || !password )
			res.status(500).json({status : "failure", message : 'Please specify both "username" and "password"'});
		else
			User.findOne({username : username}, function(err, data){
				if(err)
					return res.status(500).json({status : "failure", message : 'DB error'});
				if(!data)
					return res.status(401).json({status : "failure", message : 'There is no known user with username "'+username+'"'});
				
				if(!isValidPassword(data, password))
					return res.status(401).json({status : "failure", message : 'Wrong password, authentication failed'});
				
				// New Token
				var ctxt = new Context({
					owner : data._id,
					status : {
						desc : "idle",
						since : Date.now()
					}
				});

				ctxt.save(function(err, saved){
					if(err)
						return res.status(500).json({status : "success", message : "DB error"});
					
					var encoded = jwt.encode({
						iss: saved._id
					}, "RH JWT Secret");
					console.log('Token : '+encoded);
					res.json({status : "success", token : encoded})
				});
			});
	});

	router.use(function(req, res, next){
		var tkn = req.headers.authorization;
		if( !(tkn && tkn.startsWith("Bearer ")) ) 
			return res.status(400).json({status : "failure", message : 'There needs to be a token a the format "Authorization: Bearer <Token>"'});
		
		tkn = tkn.replace("Bearer ", '');
		var decoded = jwt.decode(tkn, "RH JWT Secret");

		console.log('TKN : '+util.inspect(decoded));
		Context.findById(decoded.iss).populate([
			'owner', {
				path : "algo",
				populate : {
					path : "meta"
				}
			}]).exec(function(err, result){
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

	router.get('/_close_context', function(req, res){
		if(!SG.CONTEXT)
			return res.status(400).json({status : "failure", message : "There is no context to close"});
		
		Context.remove({ _id : SG.CONTEXT._id }).exec(function(err){
			if(err)
				return res.status(500).json({status : "failure", message : "DB error"});
			res.json({status : 'success', message : "Context successfully removed"});
		});
	});

	return router;
}

var isValidPassword = function(user, password){
	return bCrypt.compareSync(password, user.password);
};
// Generates hash using bCrypt
var createHash = function(password){
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};