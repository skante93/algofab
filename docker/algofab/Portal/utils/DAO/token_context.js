var bCrypt = require('bcrypt-nodejs');
var jwt = require('jwt-simple');

module.exports = function(SG){
	var User = SG.mongo.model("User");
	var Algos = SG.mongo.model("Algos");
	var AlgosMeta = SG.mongo.model("AlgosMeta");
	var Token = SG.mongo.model("Token");
	var Context = SG.mongo.model("Context");

	var ref = this;
	this.context = {
		new : function(authorizations, cb){
			//
			new Context( {authorizations : authorizations} ).save(function(err, ctxt){
				cb(err, ctxt);
			});
		}
	}
	
	this.token = {
		new : function(ownerID, authorizations, cb) {
			ref.context.new(authorizations, function(err, ctxt){
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

	return this
}

// Generates hash using bCrypt
var createHash = function(password){
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};

