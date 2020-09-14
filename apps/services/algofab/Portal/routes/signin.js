
var express = require('express');
var bCrypt = require('bcrypt-nodejs');


var router = express.Router();


module.exports = function(SG){
	var User = SG.mongo.model('User');
	router.get('/', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t SIGNIN : MIDDLEWARE 1");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (req.session.user)
			res.redirect('/');
		else 
			if(req.query.err)
				res.render("login", {pop_message : pop_message, title : 'Sign In', activeHeadersComp : 'signin', err : req.query.err});
			else
				res.render("login", {pop_message : pop_message, title : 'Sign In', activeHeadersComp : 'signin'});
	});

	router.post('/', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t SIGNIN : MIDDLEWARE 2");
	    console.log("----------------------------------------------------------");

		var username = req.body.username;
		var password = req.body.password;
		var err_msg;
		console.log('username : ' + username + ', password : ' + password + ',  !username || !password = ' +(!username || !password) );
		if( !username || !password )
			res.redirect('/signin?err=at least one the fields were not specified');
		else{
			global.utils.dao.user.authenticate(username, password, function(err, user){
				if(err)
					return res.redirect('/signin?err='+err);

				req.session.user = user;
				res.redirect((req.query.redirect)? req.query.redirect : "/article/list");

			});
		}
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