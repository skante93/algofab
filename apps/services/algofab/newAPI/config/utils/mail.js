

var settings = require('../settings');

const nodemailer = require('nodemailer'), transporter = nodemailer.createTransport(settings.mail_options);


exports.newAccountCreation = (user, password)=>{

	var email = "main_email" in user.profile && user.profile.main_email? user.profile.main_email: user.profile.emails.filter(e=>e.verified == true)[0].email;
	var portal_ext_url = ('portal_ext_url' in settings.app_settings)? settings.app_settings.portal_ext_url : settings.app_settings.app_ext_protocol+'://portal.'+settings.app_settings.app_domain;
	var signin_link = `${portal_ext_url}/${settings.app_settings.uri_names.signin}`;

	var options = {
		from: '"no-reply@algofab.fr',
		//to : '<' + user.profile.emails.filter(e=>e.verified == true).map(e=>e.email).join('>, <') + '>',
		to: '<' +  email + '>',
		subject: 'Signup confirmation',
		text: `
			Hi ${email},

			This is a confirmation for the successful account creation on ${settings.app_settings.app_name}.

			You can login via the url [${portal_ext_url}] and the temporary password is "${password}"

			Please do not respond to this email. If you have questions address them to admin@teralab-datascience.fr.

			Wellcome on ${settings.app_settings.app_name}, have a nice experience.

			${settings.app_settings.app_name} Team
		`,
		html : `
			Hi ${email},

			<p>
				This is a confirmation for the successful account creation on <a href="${portal_ext_url}">${settings.app_settings.app_name}</a>. <br>

				You can login via the url [<a href="${signin_link}">${signin_link}</a>] and the temporary password is <b>${password}</b> <br>

				Please do not respond to this email. If you have questions address them to <a href="mailto:admin@teralab-datascience.fr">admin@teralab-datascience.fr</a>. <br>

				Wellcome on <a href="${portal_ext_url}">${settings.app_settings.app_name}</a>, have a nice experience.
			</p>
			
			<p>
				${settings.app_settings.app_name} Team
			</p>
		` 
	}

	return new Promise ((resolve, reject)=>{
		transporter.sendMail(options, function(error, info) {
		    if (error) {
		        return reject (new Error(`MailingError: ${error}`)) 
		    }
		    resolve();
		});
	});
}

exports.newEmailAccount = (user, email)=>{
	var portal_ext_url = ('portal_ext_url' in settings.app_settings)? settings.app_settings.portal_ext_url : settings.app_settings.app_ext_protocol+'://portal.'+settings.app_settings.app_domain;
	var verfify_link = `${portal_ext_url}/users/${user._id.toString()}/verify-email?id=${email._id.toString()}`;

	var options = {
		from: '"no-reply@algofab.fr',
		//to : '<' + user.profile.emails.filter(e=>e.verified == true).map(e=>e.email).join('>, <') + '>',
		to: `< ${email.email} >`,
		subject: 'New email account addition',
		text: `
			Hi ${email.email},

			The ${settings.app_settings.app_name} user ${user.profile.main_email} just added this email as on of his mail accounts.

			You can either ignore this notification if there was a mistake or follow the following link to verify you email : [${verfify_link}]."

			Please do not respond to this email. If you have questions address them to admin@teralab-datascience.fr.

			${settings.app_settings.app_name} Team
		`,
		html : `
			Hi ${email.email},

			<p>
				The <a href="${portal_ext_url}">${settings.app_settings.app_name}</a> user ${user.profile.main_email} just added this email as on of his mail accounts. <br>
				
				You can either ignore this notification if there was a mistake or follow the following link to verify you email : [<a href="${verfify_link}">${verfify_link}</a>]."
				
				Please do not respond to this email. If you have questions address them to <a href="mailto:admin@teralab-datascience.fr">admin@teralab-datascience.fr</a>. <br>
			</p>
			
			<p>
				${settings.app_settings.app_name} Team
			</p>
		` 
	}

	return new Promise ((resolve, reject)=>{
		transporter.sendMail(options, function(error, info) {
		    if (error) {
		        return reject (new Error(`MailingError: ${error}`)) 
		    }
		    resolve();
		});
	});
}

exports.removedEmailAccount = (user, email)=>{
	var portal_ext_url = ('portal_ext_url' in settings.app_settings)? settings.app_settings.portal_ext_url : settings.app_settings.app_ext_protocol+'://portal.'+settings.app_settings.app_domain;
	
	var options = {
		from: '"no-reply@algofab.fr',
		//to : '<' + user.profile.emails.filter(e=>e.verified == true).map(e=>e.email).join('>, <') + '>',
		to: `< ${user.profile.main_email} >`,
		subject: 'Email account removal',
		text: `
			Hi ${user.profile.main_email},

			You just successfully removed ${email} from your email accounts on  ${settings.app_settings.app_name}.

			Please do not respond to this email. If you have questions address them to admin@teralab-datascience.fr.

			${settings.app_settings.app_name} Team
		`,
		html : `
			Hi ${user.profile.main_email},

			<p>
				You just successfully removed ${email} from your email accounts on <a href="${portal_ext_url}">${settings.app_settings.app_name}</a>.<br>
				
				Please do not respond to this email. If you have questions address them to <a href="mailto:admin@teralab-datascience.fr">admin@teralab-datascience.fr</a>. <br>
			</p>
			
			<p>
				${settings.app_settings.app_name} Team
			</p>
		` 
	}

	return new Promise ((resolve, reject)=>{
		transporter.sendMail(options, function(error, info) {
		    if (error) {
		        return reject (new Error(`MailingError: ${error}`)) 
		    }
		    resolve();
		});
	});
}