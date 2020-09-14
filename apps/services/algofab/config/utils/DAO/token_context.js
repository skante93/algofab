var bCrypt = require('bcrypt-nodejs');
var jwt = require('jwt-simple');


var User = global.mongo.model("User");
var Algos = global.mongo.model("Algos");
var AlgosMeta = global.mongo.model("AlgosMeta");
var Token = global.mongo.model("Token");
var Context = global.mongo.model("Context");

var context = {
	new : function(authorizations, cb){
		//
		new Context( {authorizations : authorizations} ).save(function(err, ctxt){
			cb(err, ctxt);
		});
	}
}

var token = {
	new : function(ownerID, authorizations, cb) {
		context.new(authorizations, function(err, ctxt){
			if(err){
				console.log("DB error : "+error);
				return cb(err);
			}
			var encoded = jwt.encode({
					iss: ctxt._id
			}, "AF Secret");

			new Token({ bearer : ownerID, token : encoded }).save(function(tknErr){
				if(tknErr){
					console.log("DB error : "+tknErr);
					Context.remove({_id : ctxt._id}).exec(function(rmError){ 
						if(rmError){

							return console.log("Admin has to take a look at that");
						}
						console.log("Saving Token failed, then removed associated context.");
					});
					return cb(err);
				}
				cb();
			});
		})
	}
}

module.exports = {
	context : context,
	token : token
}

// Generates hash using bCrypt
var createHash = function(password){
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};

