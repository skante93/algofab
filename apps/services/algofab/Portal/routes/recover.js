

var express = require('express');
var bCrypt = require('bcrypt-nodejs');
var mailer = require('../mailer');

var router = express.Router();

module.exports = function(SG){
	var User = SG.mongo.model('User');
	var Resetpwd = SG.mongo.model('Resetpwd');
	
	router.get('/', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t RESET PWD : MIDDLEWARE 1");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;
		
		var recover = req.query.r && req.query.r == "username"? "username": "password";
		res.render('recover', {pop_message : pop_message, title : 'Recover '+recover, step : 1, recover: recover});
	});

	router.get('/:id', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t RESET PWD : MIDDLEWARE 2");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;
		Resetpwd.findOne({_id : req.params.id}, function(err, data){
			if(err || !data)
				res.render('recover', {pop_message : pop_message, title : 'Reset Password', step : 2, recover: "password", err : 'This link doesn\'t exist anymore, maybe you already used it? If not check your email again for the exact link.' });
			else{
				res.render('recover', {pop_message : pop_message, title : 'Reset Password', step : 2, recover: "password"});
			}
		});
	});

	router.post('/', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t RESET PWD : MIDDLEWARE 3");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		var recover = req.body.recover && req.body.recover == "username"? "username": "password";

		if (recover == "password"){
			if( !req.body.username ){
				return res.render('recover', {pop_message : pop_message, title : 'Recover '+recover, recover: 'password', step : 1, err : 'Please specify the username.'});
			}
			
			User.findOne({username : req.body.username}, function(u_err, u_data){
				if(u_err){
					return res.render('recover', {pop_message : pop_message, title : 'Reset Password', recover: 'password', step : 1, err : 'DB error occurred.'});
				}
				if(!u_data){
					return res.render('recover', {pop_message : pop_message, title : 'Reset Password', recover: 'password', step : 1, err : 'The user "'+req.body.username+'" is not known.'});
				}
				if(!u_data.email && !req.body.email){
					return res.render('recover', { pop_message : pop_message, title : 'Reset Password', recover: 'password', step : 1, err : 'You don\'t have any known email, please enter one', addemail : 1});
				}
				
				var rsp = new Resetpwd({username : u_data.username});
				rsp.save(function(s_err, s_data){
					if(s_err){
						console.log('err : ' + s_err);
						return res.render('recover', {pop_message : pop_message, title : 'Reset Password', recover: 'password', step : 1, err : 'DB error occurred.'});
					}
					
					var msg = 'Hi '+u_data.username+'\n\n';
					msg    += 'this is an autmatically generated email for the purpose of helping you retrieve your password.\n';
					msg    += 'Please visit the link : '+settings.PORTAL_EXT_PROTOCOL+settings.PORTAL_EXT_ADDR+'/recover/'+s_data._id+'\n';
					msg    += 'to proceed to the recover.\n\nBest Regards,\nAlgoFab Team';

					var msghtml = 'Hi '+u_data.username+'<br/><br/>';
					msghtml    += 'this is an autmatically generated email for the purpose of helping you retrieve your password.<br/>';
					msghtml    += 'Please visit the link : <a href="'+settings.PORTAL_EXT_PROTOCOL+settings.PORTAL_EXT_ADDR+'/recover/'+s_data._id+'">'+settings.PORTAL_EXT_PROTOCOL+settings.PORTAL_EXT_ADDR+'/resetpassword/'+s_data._id+'</a><br/>';
					msghtml    += 'to proceed to the recover.<br/><br/>Sincerely,<br/>AlgoFab Team';

					var mailOptions = {
						from: '"no-reply@algofab.fr"<foo@blurdybloop.com>', // sender address
						to: (u_data.email)? u_data.email : req.body.email, // list of receivers
						subject: 'Reset your password', // Subject line
						text: msg, // plain text body
						html: msghtml // html body
					};
					mailer.sendMail(mailOptions, function(error, info) {
						if (error) {
							//console.log('u_data : '+require('util').inspect(u_data));
							//console.log('mailOptions : '+require('util').inspect(mailOptions));
							console.log(error);
							res.render('recover', {pop_message : pop_message, title : 'Reset Password', recover: 'password', step : 1, err : 'DB error occurred.'});
						}else{
							//console.log('Message %s sent: %s', info.messageId, info.response);
							res.render('recover', {pop_message : pop_message, title : 'Reset Password', recover: 'password', step : 1, err : 'success'});
						}
					});
					
				});
			});
			
		}
		else{
			//
			if( !req.body.email ){
				return res.render('recover', {pop_message : pop_message, title : 'Recover '+recover, recover: 'username', step : 1, err : 'Please specify the username.'});
			}
			User.findOne({email : req.body.email}, function(u_err, u_data){
				if(u_err){
					return res.render('recover', {pop_message : pop_message, title : 'Recover '+recover, recover: 'username', step : 1, err : 'DB error occurred.'});
				}
				if(!u_data){
					return res.render('recover', {pop_message : pop_message, title : 'Recover '+recover, recover: 'username', step : 1, err : 'The user "'+req.body.email+'" is not known.'});
				}

				
				var msg = 'Hi '+u_data.email+'\n\n';
				msg += 'this is an autmatically generated email for the purpose of helping you retrieve your username.\n';
				msg += 'Your username is: '+u_data.username+'.\n.';
				msg += 'Please visit the link : '+settings.PORTAL_EXT_PROTOCOL+settings.PORTAL_EXT_ADDR+'/signin\n';
				msg += 'to log in.\n\nBest Regards,\nAlgoFab Team';

				var msghtml = 'Hi '+u_data.username+'<br/><br/>';
				msghtml += 'this is an autmatically generated email for the purpose of helping you retreive your username.<br/>';
				msghtml += 'Your username is: '+u_data.username+'.<br/>';
				msghtml += 'Please visit the link : <a href="'+settings.PORTAL_EXT_PROTOCOL+settings.PORTAL_EXT_ADDR+'/signin">'+settings.PORTAL_EXT_PROTOCOL+settings.PORTAL_EXT_ADDR+'/signin</a><br/>';
				msghtml += 'to log in.<br/><br/>Sincerely,<br/>AlgoFab Team';

				var mailOptions = {
					from: '"no-reply@algofab.fr"<foo@blurdybloop.com>', // sender address
					to: (u_data.email)? u_data.email : req.body.email, // list of receivers
					subject: 'Recover your username', // Subject line
					text: msg, // plain text body
					html: msghtml // html body
				};
				mailer.sendMail(mailOptions, function(error, info) {
					if (error) {
						//le.log('mailOptions : '+require('util').inspect(mailOptions));
						//console.log(error);
						res.render('recover', {pop_message : pop_message, title : 'Recover username ', recover: 'username', step : 1, err : 'DB error occurred.'});
					}else{
						//console.log('Message %s sent: %s', info.messageId, info.response);
						res.render('recover', {pop_message : pop_message, title : 'Recover username', recover: 'username', step : 1, err : 'success'});
					}
				});
			});
		}
	});

	router.post('/:id', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t RESET PWD : MIDDLEWARE 4");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if( !req.body.password){
			return res.render('recover', {pop_message : pop_message, title : 'Reset Password', recover: "password", step : 2, err : 'Please specify the password fields'});
		}
		else {
			Resetpwd.findOne({_id : req.params.id}, function(rp_err, rp_data){
				if(rp_err || !rp_data) {
					return res.render('recover', {pop_message : pop_message, title : 'Reset Password', recover: "password", step : 2, err : 'This link doesn\'t exist anymore, maybe you already used it? If not check your email again for the exact link.' });
				}
				
				
				//var pass = req.body.password;

				User.findOne({username : rp_data.username}, function(u_err, u_data){
					if(u_err){
						return res.render('recover', {pop_message : pop_message, title : 'Reset Password', recover: "password", step : 2, err : 'DB error occurred'});
					}
					if(!u_data){
						return res.render('recover', {pop_message : pop_message, title : 'Reset Password', recover: "password", step : 2, err : 'The user "'+req.body.username+'" is not known.'});
					}
					if(!u_data.email && !req.body.email){
						return res.render('recover', { pop_message : pop_message, title : 'Reset Password', recover: "password", step : 2, err : 'You don\'t have any known email, please enter one', addemail : 1});
					}
					
					var ldapChangeErr = utils.ldap.change_pass(u_data, req.body.password);
					if (ldapChangeErr instanceof Error){
						console.log("ldapChangeErr:", ldapChangeErr);
						return res.render('recover', {pop_message : pop_message, title : 'Reset Password', recover: "password", step : 2, err : 'Unexpected error with the LDAP Server.'});
					}
					console.log("no ldapChangeErr: ", ldapChangeErr);
					User.update({username : rp_data.username}, {$set : {password : createHash(req.body.password)}}, function(upd_err){
						if(upd_err){
							console.log("upd_err:", upd_err);
							res.render('recover', {pop_message : pop_message, title : 'Reset Password', recover: "password", step : 2, err : 'DB error occurred'});
						}
						else{
							Resetpwd.remove({_id : req.params.id}, function(error){});

							var msg = 'Hi '+u_data.username+'\n\n';
							msg    += 'this is an autmatically generated email to confirm your password change.\n';
							msg    += 'Since we do not register your password in our DB we can\'t send it in the email, but in case you forgot again,\n';
							msg    += 'feel free to repeat this whole process. Have a nice day :)\n\n';
							msg    += 'Sincerely,\nAlgoFab Team';

							var msghtml = 'Hi '+u_data.username+'<br/><br/>';
							msghtml    += 'this is an autmatically generated email to confirm your password change.<br/>';
							msghtml    += 'Since we do not register your password in our DB we can\'t send it in the email, but in case you forgot again,<br/>';
							msghtml    += 'feel free to repeat this whole process. Have a nice day :)<br/><br/>';
							msghtml    += 'Sincerely,<br/>AlgoFab Team';
							
							mailer.sendMail({
									from: '"no-reply@algofab.fr"<foo@blurdybloop.com>', // sender address
									to: u_data.email, // list of receivers
									subject: 'Reset your password', // Subject line
									text: msg, // plain text body
									html: msghtml // html body
								}, function(error, info) {
								if (error) {
									console.log("mail error:", error);
									res.render('recover', {pop_message : pop_message, title : 'Reset Password', recover: "password", step : 2, err : 'DB error occurred.'});
								}else{
									//console.log('Message %s sent: %s', info.messageId, info.response);
									res.render('recover', {pop_message : pop_message, title : 'Reset Password', recover: "password", step : 2, err : 'success'});
								}
							});

							//res.render('recover', {pop_message : pop_message, title : 'Reset Password', recover: "password", step : 2, err : 'success'});
						}
					});
					
				});
				
				
			});
		}
	});
	return router;
}

var createHash = function(password){
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};
