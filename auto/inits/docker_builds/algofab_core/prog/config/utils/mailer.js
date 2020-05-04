'use strict';
var nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport(global.settings.mailOptions);

var domain = process.env.PORTAL_EXT_PROTOCOL+'://'+ process.env.PORTAL_EXT_NAME;

var signupEmail = function(pass, cb){
	var url = domain+'/signup/confirmation/'+pass._id.toString();

	var raw_msg = `
		Hi ${pass.email}, 
		
		We inform you that your user account were successfully created. The last step for you now is to confirm you subcription.
		To do so just click on the folowing hyperlink : <a href="${url}">${url}</a>, and choose your password.
		
		We hope to see you soon on <a href"${domain}">${domain}</a>.
		
		Best regards, 
		AlgoFab Team.
	` ;
	
	var html_msg =`
		<div>
			<p>
				Hi ${pass.email}, 
			</p>
			<p>
				We inform you that your user account were successfully created. The last step for you now is to confirm you subcription.
				To do so just click on the folowing hyperlink : <a href="${url}">${url}</a>, and choose your password.
			</p>
			<p>
				We hope to see you soon on <a href"${domain}">${domain}</a>.
			</p>
			<p>
				Best regards, 
				AlgoFab Team.
			</p>
		</div>
	` ;

	transporter.sendMail({
		from : '"no-reply@algofab.fr"<foo@blurdybloop.com>',
		to : pass.email,
		subject: 'Subscription notification',
		text: raw_msg,
		html : html_msg
	}, function(error, info) {
	    if (error) {
	        console.log(error);
	        return cb("mail error");
	    }

	    console.log('Message %s sent: %s', info.messageId, info.response);
		cb();
	});
}

var account_from_LDAP = function(user, cb){

	var raw_msg = `
		Hi ${user.email}, 
		
		We inform you that your user account were just retreived from our LDAP server. 
		Your account we be as good as new (if you used to have an account, the data associated will be reset anew). 
		
		We hope to see you soon on <a href"${domain}">Algofab</a>.
		
		Best regards, 
		AlgoFab Team.
	` ;
	
	var html_msg =`
		<div>
			<p>
				Hi ${user.email}, 
			</p>
			<p>
				We inform you that your user account were just retreived from our LDAP server. <br/>
				Your account we be as good as new (if you used to have an account, the data associated will be reset anew).
			</p>
			<p>
				We hope to see you soon on <a href"${domain}">Algofab</a>.
			</p>
			<p>
				Best regards, 
				AlgoFab Team.
			</p>
		</div>
	` ;

	console.log("MAIL : "+user.email);

	transporter.sendMail({
		from : '"no-reply@algofab.fr"<foo@blurdybloop.com>',
		to : user.email,
		subject: 'Subscription notification',
		text: raw_msg,
		html : html_msg
	}, function(error, info) {
	    if (error) {
	        console.log(error);
	        return cb("mail error");
	    }

	    console.log('Message %s sent: %s', info.messageId, info.response);
		cb();
	});
}

var accountConfirmed = function(userData, cb){
	var msg = 'Hi '+userData.username+'\n\n';
	msg    += 'Congratulations on our account being confirmed.\n';
	msg    += 'You can access the portal via the link : '+domain+'\n';
	msg    += 'If you are new we suggest you start reading the docs first ('+domain+'/docs).\n\nBest Regards,\nAlgoFab Team';


	var msghtml = `
		<p> Hi ${userData.username} </p>
		<p>
			Congratulations on our account being confirmed. <br/>
			You can access the portal via the link : <a href="${domain}" target="_blank">${domain}</a>
		</p>
		<p>
			If you are new we suggest you start <a href="${domain+'/docs'}">reading the docs</a> first.
		</p>

		<p>
			Best Regards, <br/>
			AlgoFab Team
		</p>
	`;
	

	var mailOptions = {
	    from: '"no-reply@algofab.fr"<foo@blurdybloop.com>', // sender address
	    to: (userData.email)? userData.email : bodyEmail, // list of receivers
	    subject: 'Account confirmed', // Subject line
	    text: msg, // plain text body
	    html: msghtml // html body
	};

	transporter.sendMail(mailOptions, function(error, info) {
	    if (error) {
	        console.log(error);
	        return cb("Mail error");
	    }

	    console.log('Message %s sent: %s', info.messageId, info.response);
		cb();
	});
}

var resetPassword = function(userData,bodyEmail, cb){
	var msg = 'Hi '+userData.username+'\n\n';
	msg    += 'this is an autmatically generated email for the purpose of helping you retreive your password.\n';
	msg    += 'Please visit the link : '+domain+'/resetpassword/'+userData._id+'\n';
	msg    += 'to proceed to the reset.\n\nBest Regards,\nAlgoFab Team';

	var msghtml = 'Hi '+userData.username+'<br/><br/>';
	msghtml    += 'this is an autmatically generated email for the purpose of helping you retreive your password.<br/>';
	msghtml    += 'Please visit the link : '+domain+'/resetpassword/'+userData._id+'<br/>';
	msghtml    += 'to proceed to the reset.<br/><br/>Best Regards,<br/>AlgoFab Team';

	var mailOptions = {
	    from: '"no-reply@algofab.fr"<foo@blurdybloop.com>', // sender address
	    to: (userData.email)? userData.email : bodyEmail, // list of receivers
	    subject: 'Reset your password', // Subject line
	    text: msg, // plain text body
	    html: msghtml // html body
	};

	transporter.sendMail(mailOptions, function(error, info) {
	    if (error) {
	        console.log(error);
	        return cb("mail error");
	    }

	    console.log('Message %s sent: %s', info.messageId, info.response);
		cb();
	});

}

var passwordReseted = function(userData, bodyEmail, cb){
	var msg = 'Hi '+userData.username+'\n\n';
	msg    += 'this is an autmatically generated email to confirm your password change.\n';
	msg    += 'Since we do not register your password in our DB we can\'t send it in the email, but in case you forgot again,\n';
	msg    += 'feel free to repeat this whole process. Have a nice day :)\n\n';
	msg    += 'Best Regards,\nAlgoFab Team';

	var msghtml = 'Hi '+userData.username+'<br/><br/>';
	msghtml    += 'this is an autmatically generated email to confirm your password change.<br/>';
	msghtml    += 'Since we do not register your password in our DB we can\'t send it in the email, but in case you forgot again,<br/>';
	msghtml    += 'feel free to repeat this whole process. Have a nice day :)<br/><br/>';
	msghtml    += 'Best Regards,<br/>AlgoFab Team';

	transporter.sendMail({
	    from: '"no-reply@algofab.fr"<foo@blurdybloop.com>', // sender address
	    to: (userData.email)? userData.email : bodyEmail, // list of receivers
	    subject: 'Reset your password', // Subject line
	    text: msg, // plain text body
	    html: msghtml // html body
	}, function(error, info) {
	    if (error) {
	        console.log(error);
	        return cb("mail error");
	    }

	    console.log('Message %s sent: %s', info.messageId, info.response);
		cb();
	});
}

module.exports = {
	transporter : transporter,
	signupEmail : signupEmail,
	accountConfirmed : accountConfirmed,
	resetPassword : resetPassword,
	passwordReseted : passwordReseted,
	account_from_LDAP : account_from_LDAP
};
