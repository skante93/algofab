

var bCrypt = require('bcrypt-nodejs');

var jwt = require('jwt-simple');
var mailer = require('../../mailer');


var User = global.mongo.model("User");
var Algos = global.mongo.model("Algos");
var AlgosMeta = global.mongo.model("AlgosMeta");
var User = global.mongo.model("User");
var Context = global.mongo.model("Context");
var Token = global.mongo.model("Token");
var Pass = global.mongo.model("Pass");

var mailer = require('../mailer');
var ldap = require('../ldap');

var isValidPassword = function(user, password){
	return bCrypt.compareSync(password, user.password);
}

var getHistoryIntervarl = function(id_ctxt, interv, callback){
    if(typeof interv === 'function' && !callback){
        callback = interv;
        interv = undefined;
    }
    var condition = function(compared){
        //console.log("From : "+from+"\tcompared : "+compared);
        //console.log("From.getTime() : "+from.getTime()+"\tcompared.getTime() : "+compared.getTime());
        //console.log("From : "+from+", To : "+to);

        if (!interv)
            return true;

        if ( interv.from && (interv.from.getTime() > compared.getTime()) ){
            //console.log("From failed");
            return false;
        }
        
        if ( interv.to && (interv.to.getTime() <= compared.getTime()) ){
            //console.log("To failed");
            return false;
        }
        
        return true;
    };
    
    Context.findById(id_ctxt).populate({
    	path : 'history.algo',
    	select : { version : 1, _id : 1, meta : 1},
    	populate : {
    		path : 'meta',
    		select : 'title'
    	}
    }).exec(function(err, result){
        if(err){
            console.log("DB error : "+err);
            return callback("DB error");
        }
        if(!result){
            console.log("Result : "+util.inspect(result));
            return callback("zero");
        }
        var matchedHistory = [];
        result.history.forEach(function(h, ind, arr){
            if(condition(h.date)){
                matchedHistory.push(h);
            }
        });

        callback(null, matchedHistory);
    });
}

var getUserHistory = function(u_id, interv, callback){

    Token.find({bearer : u_id}).exec(function(err, tkns){
        if(err){
            console.log("DB error : "+err);
            return callback("DB error");
        }
        if(!tkns || tkns.length == 0){
            return callback(null, []);
        }
        var history = [];

        const user_s_tokens = tkns.map(function(x) {
		   return x;
		});

        (function fetchTknHistory(){
            //
            var tkn = tkns.splice(0,1)[0];
            console.log("TKN : "+tkn._id);
            var id_ctxt = jwt.decode( tkn.token, "AF Secret").iss;
            
            console.log("CTXT : "+id_ctxt);
            
            getHistoryIntervarl(id_ctxt, interv, function(err, h){
                if(err) {
                    console.log("Oh no : "+err);
                    return callback(err);
                }

                history = history.concat(h);

                if(tkns.length == 0){
                    history.sort(function(a, b){
                        return a.date.getTime() - b.date.getTime();
                    });
                    console.log("Cool end");
                    callback(null, history, user_s_tokens);
                }
                else{
                    fetchTknHistory();
                }
            });
        })();
        
    });
}

/*
var history = function(id, month, year, cb){
	//
	Token.find({ bearer : id }).exec(function(err, tkns){
		if(err){
			console.log("DB error : "+err);
			return cb(err);
		}
		if(! tkns || tkns.length == 0){
			console.log("Empty history");
			return cb("Empty history");
		}
		var histories = [];
		var tkns_cp = tkns;
		(function treatTKNS() {
			var tkn = tkns_cp.splice(0, 1)[0];
			var ctxtID = jwt.decode( tkn.token, "AF Secret").iss;
			Context.findById(ctxtID).exec(function(errCtxt, ctxt){
				//
				if(errCtxt){
					console.log("DB error : "+err);
					return cb(err);
				}
				if(!ctxt) {
					console.log("Context not found, deleteing token");
					tkn.remove(function(err){ console.log(err || "Incoherent token removed"); })
					return cb(err);
				}


			});
				cb();
				} else {
					treatTKNS();
				}
			
		})();
	});
}
*/

var setUsersPassword = function(user, old_pass, new_pass, cb){
		
	if(!isValidPassword(user, old_pass)){
		return cb("The your current password does not match, try again.");
	}

	var err = ldap.change_pass(user, new_pass);
	
	if(err instanceof Error){
		console.log("Error : "+err);
		return cb("Update users's password on LDAP failed");
	}

	User.findOneAndUpdate( { _id : user._id }, { $set : { password : createHash(new_pass) } } , { new : true } , function(err, updated){
		if(err){
			return cb("DB error");
		}
		cb(null, updated);
	});	
}

var new_account = function(username, email, cb){
	User.findOne({ username : username }).exec(function(err, user){
		if(err){
			console.log("DB error : "+err);
			return cb ("DB error");
		}
		if (user){
			return cb('User "'+username+'" already exists');
		}

		new Pass({ username : username, email : email }).save(function(saveErr, pass){
			if(saveErr){
				console.log(mailError);
				return cb("DB error");
			}

			mailer.signupEmail(pass._id, email, function(mailError) {
			    if (mailError) {
			        console.log(mailError);
			        cb("Mail error");
			        return User.remove({ username : username }).exec(function(err){ console.log(err || "User sucessfully removed from DB")})
			    }

			    //console.log('Message %s sent: %s', info.messageId, info.response);
				cb()
			});
		});
	});
}

var confirm_account = function(passID, fname, lname, passwd, cb){
	Pass.findById(passID).exec(function(err, pass){
		if (err){
			console.log(err)
			return cb("DB error");
		}
		if (!pass){
			return cb("This confirmation link does not exist or does no longer exist.");
		}

		restler.post(global.settings.IM_PROTOCOL + global.settings.IM_ADDR +':'+ global.settings.IM_PORT+ "/add-user-ns", 
    		{ 
    			data : { username : pass.username } 
    		}
    	).on('complete', function (body, httpResponse) {
    		console.log("body : "+util.inspect(body));

    		if(body instanceof Error){
    			console.log("Body is instance of error");
    			return cb("Internal Network error : while creating new namespace on Kubernetes");
        	}

    		var json = {};
    		try{
    			json = JSON.parse(body);
    			if(json.status == "failure"){
    				console.log("Status is failure");
        			return cb("Creating new namespace on Kubernetes for new user : "+json.message);
            	}
    		}
    		catch(e){

				console.log("Could not parse");
    			return cb("Creating new namespace on Kubernetes : communication error");
    		}
    		var u = { 
    			username : pass.username,
    			firstname : fname,
    			lastname : lname,
    			password : passwd,
    			email : pass.email
    		}
    		// user : {req.body.fname.replace(/\ /g, '\\ '), req.body.lname.replace(/\ /g, '\\ '), pass.email, pass.username, req.body.password}
    		var ldapErr = ldap.add( u );
			
			if( ldapErr ){
				console.log("ldapErr : "+ldapErr);
				return cb("Registering user on LDAP : "+ldapErr);
			}

			u.password = createHash(u.password);
			var new_user = new User(u);
			
			Pass.remove({_id : passID}).exec(function(err){
				console.log( (err)? "Could not remove the user from collection Pass" : "Removed user from collection Pass" );
			});
			
			new_user.save(function(err, user){
				if(err){
					return cb("DB error : could not save the new user");
				}

				mailer.accountConfirmed(user, function(err){ console.log("Mail sent"); })
				cb(null, user);
			});
		});
	});
}

var authenticate = function(username, password, cb){
	//
	User.findOne({username : username}, function(err, data){
		if(err)
			return cb("DB error");
		if(!data)
			return cb('Username '+username+' not recognized');
		if(!isValidPassword(data, password))
			return cb('Invalid password');
		cb(null, data);
	});
}


module.exports = {
	getHistoryIntervarl : getHistoryIntervarl,
	getUserHistory : getUserHistory,
	setUsersPassword : setUsersPassword,
	new_account : new_account,
	confirm_account : confirm_account,
	authenticate : authenticate
}
/*
module.exports = function(SG){
	var User = SG.mongo.model("User");
	var Algos = SG.mongo.model("Algos");
	var AlgosMeta = SG.mongo.model("AlgosMeta");
	var User = SG.mongo.model("User");
	var Context = SG.mongo.model("Context");
	var Token = SG.mongo.model("Token");
	var Pass = SG.mongo.model("Pass");
	

	var getHistoryIntervarl = function(id_ctxt, interv, callback){
	    if(typeof interv === 'function' && !callback){
	        callback = interv;
	        interv = undefined;
	    }
	    var condition = function(compared){
	        //console.log("From : "+from+"\tcompared : "+compared);
	        //console.log("From.getTime() : "+from.getTime()+"\tcompared.getTime() : "+compared.getTime());
	        //console.log("From : "+from+", To : "+to);

	        if (!interv)
	            return true;

	        if ( interv.from && (interv.from.getTime() > compared.getTime()) ){
	            //console.log("From failed");
	            return false;
	        }
	        
	        if ( interv.to && (interv.to.getTime() <= compared.getTime()) ){
	            //console.log("To failed");
	            return false;
	        }
	        
	        return true;
	    };
	    
	    Context.findById(id_ctxt).populate({
	    	path : 'history.algo',
	    	select : { version : 1, _id : 1, meta : 1},
	    	populate : {
	    		path : 'meta',
	    		select : 'title'
	    	}
	    }).exec(function(err, result){
	        if(err){
	            console.log("DB error : "+err);
	            return callback("DB error");
	        }
	        if(!result){
	            console.log("Result : "+util.inspect(result));
	            return callback("zero");
	        }
	        var matchedHistory = [];
	        result.history.forEach(function(h, ind, arr){
	            if(condition(h.date)){
	                matchedHistory.push(h);
	            }
	        });

	        callback(null, matchedHistory);
	    });
	}

	this.getUserHistory = function(u_id, interv, callback){

	    Token.find({bearer : u_id}).exec(function(err, tkns){
	        if(err){
	            console.log("DB error : "+err);
	            return callback("DB error");
	        }
	        if(!tkns || tkns.length == 0){
	            return callback(null, []);
	        }
	        var history = [];

	        const user_s_tokens = tkns.map(function(x) {
			   return x;
			});

	        (function fetchTknHistory(){
	            //
	            var tkn = tkns.splice(0,1)[0];
	            console.log("TKN : "+tkn._id);
	            var id_ctxt = jwt.decode( tkn.token, "AF Secret").iss;
	            
	            console.log("CTXT : "+id_ctxt);
	            
	            getHistoryIntervarl(id_ctxt, interv, function(err, h){
	                if(err) {
	                    console.log("Oh no : "+err);
	                    return callback(err);
	                }

	                history = history.concat(h);

	                if(tkns.length == 0){
	                    history.sort(function(a, b){
	                        return a.date.getTime() - b.date.getTime();
	                    });
	                    console.log("Cool end");
	                    callback(null, history, user_s_tokens);
	                }
	                else{
	                    fetchTknHistory();
	                }
	            });
	        })();
	        
	    });
	};
	
	this.setUsersPassword = function(user, old_pass, new_pass, cb){
		
		if(!this.isValidPassword(user, old_pass)){
			return cb("The your current password does not match, try again.");
		}
		SG.utils.ldap.update_passwd(user.username, new_pass, function(err){
			//
			if(err){
				console.log("Error : "+err);
				return cb("Update users's password on LDAP failed");
			}
			User.findOneAndUpdate( { _id : user._id }, { $set : { password : createHash(new_pass) } } , { new : true } , function(err, updated){
				if(err){
					return cb("DB error");
				}
				cb(null, updated);
			});
		});
		
	};
	this.new_account = function(username, email, cb){
		User.findOne({ username : username }).exec(function(err, user){
			if(err){
				console.log("DB error : "+err);
				return cb ("DB error");
			}
			if (user){
				return cb('User "'+username+'" already exists');
			}

			new Pass({ username : username, email : email }).save(function(saveErr, pass){
				
				mailer.signupEmail(pass._id, email, function(mailError) {
				    if (mailError) {
				        console.log(mailError);
				        cb("mail error");
				        return User.remove({ username : username }).exec(function(err){ console.log(err || "User sucessfully removed from DB")})
				    }

				    //console.log('Message %s sent: %s', info.messageId, info.response);
					cb()
				});
			});
		});
	}
	this.isValidPassword = function(user, password){
		return bCrypt.compareSync(password, user.password);
	};

	return this
}
*/
// Generates hash using bCrypt
var createHash = function(password){
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};

