

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

		res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 1});
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
				res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 2, err : 'This link doesn\'t exist anymore, maybe you already used it? If not check your email again for the exact link.' });
			else{
				res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 2});
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

		if( !req.body.username ){
			res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 1, err : 'Please specify the username.'});
		}
		else {
			User.findOne({username : req.body.username}, function(u_err, u_data){
				if(u_err){
					res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 1, err : 'DB error occurred.'});
				}
				else if(!u_data){
					res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 1, err : 'The user "'+req.body.username+'" is not known.'});
				}
				else if(!u_data.email && !req.body.email){
					res.render('resetpwd', { pop_message : pop_message, title : 'Reset Password', step : 1, err : 'You don\'t have any known email, please enter one', addemail : 1});
				}
				else {
					var rsp = new Resetpwd({username : u_data.username});
					rsp.save(function(s_err, s_data){
						if(s_err){
							console.log('err : ' + s_err);
							res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 1, err : 'DB error occurred.'});
						}
						else{
							var msg = 'Hi '+u_data.username+'\n\n';
							msg    += 'this is an autmatically generated email for the purpose of helping you retreive your password.\n';
							msg    += 'Please visit the link : '+SG.params.PORTAL_EXT_PROTOCOL+SG.params.PORTAL_EXT_ADDR+'/resetpassword/'+s_data._id+'\n';
							msg    += 'to proceed to the reset.\n\nBest Regards,\nAlgoFab Team';

							var msghtml = 'Hi '+u_data.username+'<br/><br/>';
							msghtml    += 'this is an autmatically generated email for the purpose of helping you retreive your password.<br/>';
							msghtml    += 'Please visit the link : '+SG.params.PORTAL_EXT_PROTOCOL+SG.params.PORTAL_EXT_ADDR+'/resetpassword/'+s_data._id+'<br/>';
							msghtml    += 'to proceed to the reset.<br/><br/>Best Regards,<br/>AlgoFab Team';

							if(req.body.email){
								msg += '\n\nNote : this email is will not be stored permanently for you account (since you gave it during \n';
								msg += 'the password reset porcess), to do that singn and update your account.'

								msghtml += '<br/><br/><b>Note : this email is will not be stored permanently for you account (since you gave it during <br/>';
								msghtml += 'the password reset porcess), to do that singn and update your account.</b>'
							}

							var mailOptions = {
								    from: '"no-reply@algofab.fr"<foo@blurdybloop.com>', // sender address
								    to: (u_data.email)? u_data.email : req.body.email, // list of receivers
								    subject: 'Reset your password', // Subject line
								    text: msg, // plain text body
								    html: msghtml // html body
								};
							mailer.sendMail(mailOptions, function(error, info) {
							    if (error) {
							    	console.log('u_data : '+require('util').inspect(u_data));
							        console.log('mailOptions : '+require('util').inspect(mailOptions));
							        console.log(error);
							        res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 1, err : 'DB error occurred.'});
							    }else{
								    console.log('Message %s sent: %s', info.messageId, info.response);
								    res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 1, err : 'success'});
								}
							});
						}
					});
				}


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

		if( !req.body.username || !req.body.password){
			res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 2, err : 'Please specify both the username and the password fields'});
		}
		else {
			Resetpwd.findOne({_id : req.params.id}, function(rp_err, rp_data){
				if(rp_err || !rp_data) {
					res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 2, err : 'This link doesn\'t exist anymore, maybe you already used it? If not check your email again for the exact link.' });
				}
				else{
					if(rp_data.username == req.body.username){
						var pass = req.body.password;

						User.findOne({username : req.body.username}, function(u_err, u_data){
							if(rp_err){
								res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 2, err : 'DB error occurred'});
							}
							else if(!u_data){
								res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 2, err : 'The user "'+req.body.username+'" is not known.'});
							}
							else if(!u_data.email && !req.body.email){
								res.render('resetpwd', { pop_message : pop_message, title : 'Reset Password', step : 2, err : 'You don\'t have any known email, please enter one', addemail : 1});
							}
							else{
								User.update({username : rp_data.username}, {$set : {password : createHash(req.body.password)}}, function(upd_err){
									if(upd_err){
										res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 2, err : 'DB error occurred'});
									}
									else{
										Resetpwd.remove({_id : req.params.id}, function(error){});

										var msg = 'Hi '+u_data.username+'\n\n';
										msg    += 'this is an autmatically generated email to confirm your password change.\n';
										msg    += 'Since we do not register your password in our DB we can\'t send it in the email, but in case you forgot again,\n';
										msg    += 'feel free to repeat this whole process. Have a nice day :)\n\n';
										msg    += 'Best Regards,\nAlgoFab Team';

										var msghtml = 'Hi '+u_data.username+'<br/><br/>';
										msghtml    += 'this is an autmatically generated email to confirm your password change.<br/>';
										msghtml    += 'Since we do not register your password in our DB we can\'t send it in the email, but in case you forgot again,<br/>';
										msghtml    += 'feel free to repeat this whole process. Have a nice day :)<br/><br/>';
										msghtml    += 'Best Regards,<br/>AlgoFab Team';

										if(req.body.email){
											msg += '\n\nNote : this email is will not be stored permanently for you account (since you gave it during \n';
											msg += 'the password reset porcess), to do that singn and update your account.'

											msghtml += '<br/><br/><b>Note : this email is will not be stored permanently for you account (since you gave it during <br/>';
											msghtml += 'the password reset porcess), to do that singn and update your account.</b>'
										}
										
										mailer.sendMail({
											    from: '"no-reply@algofab.fr"<foo@blurdybloop.com>', // sender address
											    to: (u_data.email)? u_data.email : req.body.email, // list of receivers
											    subject: 'Reset your password', // Subject line
											    text: msg, // plain text body
											    html: msghtml // html body
											}, function(error, info) {
										    if (error) {
										        console.log(error);
										        res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 2, err : 'DB error occurred.'});
										    }else{
											    console.log('Message %s sent: %s', info.messageId, info.response);
											    res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 2, err : 'success'});
											}
										});

										res.render('resetpwd', {pop_message : pop_message, title : 'Reset Password', step : 2, err : 'success'});
									}
								});
							}
						});
					}
				}
			});
		}
	});
	return router;
}

var createHash = function(password){
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};
