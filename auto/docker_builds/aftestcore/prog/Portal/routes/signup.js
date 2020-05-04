
var express = require('express');
var bCrypt = require('bcrypt-nodejs');

var util = require('util');
var restler = require('restler');
var mailer = require("../mailer");

var router = express.Router();

var User = mongo.model('User');
var Pass = mongo.model('Pass');

router.get('/confirmation/:id', function(req, res){
	console.log("----------------------------------------------------------");
    console.log("\t\t SIGNUP : MIDDLEWARE 1");
    console.log("----------------------------------------------------------");

	var pop_message = req.session.pop_message;
	if (pop_message)
		req.session.pop_message = undefined;

	Pass.findById(req.params.id).exec(function(err, pass){
		if (err){
			return res.render('confirm_password', {pop_message : pop_message, title : "Sign up", activeHeadersComp : "signup", nopass : "DB error"});
		}
		if (!pass){
			return res.render('confirm_password', {pop_message : pop_message, title : "Sign up", activeHeadersComp : "signup", nopass : "This confirmation link does not exist or does no longer exist."});
		}

		res.render('confirm_password', {pop_message : pop_message, title : "Sign up", activeHeadersComp : "signup", pass : pass });
	});	
});

router.post('/confirmation/:id', function(req, res){
	console.log("----------------------------------------------------------");
    console.log("\t\t SIGNUP : MIDDLEWARE 1");
    console.log("----------------------------------------------------------");

	var pop_message = req.session.pop_message;
	if (pop_message)
		req.session.pop_message = undefined;

	if(!req.body.password)
		return res.render('confirm_password', {pop_message : pop_message, title : "Sign up", activeHeadersComp : "signup", err : "The password is required"});
	
	Pass.findById(req.params.id).exec(function(err, pass){
		if(err){
			return res.render('confirm_password', {pop_message : pop_message, title : "Sign up", activeHeadersComp : "signup", nopass : "DB error"});
		}
		if(!pass)
			return res.render('confirm_password', {pop_message : pop_message, title : "Sign up", activeHeadersComp : "signup", nopass : "This confirmation link does not exist or does no longer exist."});
		
		utils.dao.user.confirm_account(req.params.id, req.body.fname.replace(/\ /g, '\\ '), req.body.lname.replace(/\ /g, '\\ '), req.body.password, function(err, user){
			//
			if (err){
				return res.render('confirm_password', {pop_message : pop_message, title : "Sign up", activeHeadersComp : "signup", err : err, pass : pass});
			}

			req.session.user = user;
			req.session.pop_message = { title : "Subcription", msg : "You successfully signed up"};
			res.redirect('/user/account');
		});
	});
	/*
	Pass.findById(req.params.id).exec(function(err, pass){
		if (err){
			return res.render('confirm_password', {pop_message : pop_message, title : "Sign up", activeHeadersComp : "signup", err : "DB error"});
		}
		if (!pass){
			return res.render('confirm_password', {pop_message : pop_message, title : "Sign up", activeHeadersComp : "signup", err : "This URL does not exist (not anymore at the least)."});
		}

		restler.post(params.IM_PROTOCOL + params.IM_ADDR +':'+ params.IM_PORT+ "/add-user-ns", 
    		{ 
    			data : { username : pass.username } 
    		}
    	).on('complete', function (body, httpResponse) {
    		console.log("body : "+util.inspect(body));

    		if(body instanceof Error){
    			console.log("Body is instance of error");
    			return res.redirect('/signup?err=an error occured on the IM');
        	}

    		var json = {};
    		try{
    			json = JSON.parse(body);
    			if(json.status == "failure"){
    				console.log("Status is failure");
        			return res.redirect('/signup?err=an error occured on the IM');
            	}
    		}
    		catch(e){

				console.log("Could not parse");
    			return res.redirect('/signup?err=an error occured on the IM');
    		}

    		utils.ldap.add( req.body.fname.replace(/\ /g, '\\ '), req.body.lname.replace(/\ /g, '\\ '), pass.email, pass.username, req.body.password, function(err){
    			console.log("----------------------------------------------------------------------------");
    			if(err){
    				console.log("Error : "+err);
    				return res.render('confirm_password', {pop_message : pop_message, title : "Sign up", activeHeadersComp : "signup", pass: pass, err : "LDAP registry error. Please contact administrators"});
    			}

    			var new_user = new User({ firstname : req.body.fname, lastname : req.body.lname, username : pass.username, email : pass.email, password : createHash(req.body.password) });
				
				Pass.remove({_id : req.params.id}).exec(function(err){
					console.log( (err)? "Could not remove the user from collection Pass" : "Removed user from collection Pass" );
				});
				
				new_user.save(function(err, user){
					if(err){
						return res.render('confirm_password', {pop_message : pop_message, title : "Sign up", activeHeadersComp : "signup", err : "DB error : could not save the new user"});
					}
					console.log("user : "+util.inspect(user));
					req.session.user = user;
					req.session.pop_message = { title : "Subcription", msg : "You successfully signed up"};
					res.redirect('/user/account');
				});
    		});
		});
	});
	*/	
});

router.get('/', function(req, res){
	console.log("----------------------------------------------------------");
    console.log("\t\t SIGNUP : MIDDLEWARE 1");
    console.log("----------------------------------------------------------");

	var pop_message = req.session.pop_message;
	if (pop_message)
		req.session.pop_message = undefined;

	res.render("login", {pop_message : pop_message, title : 'Sign Up', activeHeadersComp : 'signup', err : req.query.err});
	
});

router.post('/', function(req, res){
	console.log("----------------------------------------------------------");
    console.log("\t\t SIGNUP : MIDDLEWARE 1");
    console.log("----------------------------------------------------------");

	var pop_message = req.session.pop_message;
	if (pop_message)
		req.session.pop_message = undefined;

	
	if (!req.body.email || !req.body.username){
		return res.render("login", {pop_message : pop_message, title : 'Sign Up', activeHeadersComp : 'signup', err : "Both email and username are required"});	
	}

	global.utils.dao.user.new_account(req.body.username, req.body.email, function(err){
		if(err){
			return res.render("login", {pop_message : pop_message, title : 'Sign Up', activeHeadersComp : 'signup', err : err});	
		}
		res.render("login", {pop_message : pop_message, title : 'Sign Up', activeHeadersComp : 'signup', err : "success"});	
	});
});

module.exports = router;


var isValidPassword = function(user, password){
	return bCrypt.compareSync(password, user.password);
};

// Generates hash using bCrypt
var createHash = function(password){
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};
