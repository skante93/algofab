

var bCrypt = require('bcrypt-nodejs');


module.exports = function(mongo){
	var User = mongo.model("User");
	var Algos = mongo.model("Algos");
	var AlgosMeta = mongo.model("AlgosMeta");
	//var Algos2 = mongo.model("Algos2");
	var User = mongo.model("User");


	this.setUsersPassword = function(user, old_pass, new_pass, cb){
		
		if(!this.isValidPassword(user, old_pass)){
			return cb("The your current password does not match, try again.");
		}

		User.findOneAndUpdate( { _id : user._id }, { $set : { password : createHash(new_pass) } } , { new : true } , function(err, updated){
			if(err){
				return cb("DB error");
			}
			cb(null, updated);
		});
	};

	this.isValidPassword = function(user, password){
		return bCrypt.compareSync(password, user.password);
	};

	return this
}

// Generates hash using bCrypt
var createHash = function(password){
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};

