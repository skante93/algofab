

var {settings, getFullUrl } = require('../settings');



module.exports = (function(){
    if (false){
        return undefined;
    }
    if (settings.mail.server == "gmail"){
        settings.mail.service = "gmail";
    }
    if (settings.mail.auth.username){
        settings.mail.auth.user = settings.mail.auth.username;
    }
    if (settings.mail.auth.password){
        settings.mail.auth.pass = settings.mail.auth.password;
    }
    //console.log("settings.mail , ",settings.mail);
    //console.log("MAIL IS NOT UNDEFINED THANKS GOD!!!!!");
    const nodemailer = require('nodemailer'), transporter = nodemailer.createTransport(settings.mail);

    const app_name = settings.app_name;
    const ext_url = getFullUrl('api');

    this.newAccountNotification = (user, clear_password)=>{

        //var email = "main_email" in user.profile && user.profile.main_email? user.profile.main_email: user.profile.emails.filter(e=>e.verified == true)[0].email;
        var email = user.profile.email; 
        //var portal_ext_url = ('portal_ext_url' in settings.app_settings)? settings.app_settings.portal_ext_url : settings.app_settings.app_ext_protocol+'://portal.'+settings.app_settings.app_domain;
        //var app_name = settings.app_settings.app_name;
        var signin_link = `${ext_url}/signin`;
    
        var options = {
            from: '"no-reply@algofab.fr',
            //to : '<' + user.profile.emails.filter(e=>e.verified == true).map(e=>e.email).join('>, <') + '>',
            to: '<' +  email + '>',
            subject: 'Signup Notification',
            text: `
                Hi ${email},
    
                This is a confirmation for the successful account creation on ${app_name}.
    
                You can login via the url [${ext_url}] and the temporary password is "${clear_password}"
    
                Please do not respond to this email. If you have questions address them to admin@teralab-datascience.fr.
    
                Wellcome on ${app_name}, have a nice experience.
    
                ${app_name} Team
            `,
            html : `
                Hi ${email},
    
                <p>
                    This is a confirmation for the successful account creation on <a href="${ext_url}">${app_name}</a>. <br>
    
                    You can login via the url [<a href="${signin_link}">${signin_link}</a>] and the temporary password is <b>${clear_password}</b> <br>
    
                    Please do not respond to this email. If you have questions address them to <a href="mailto:admin@teralab-datascience.fr">admin@teralab-datascience.fr</a>. <br>
    
                    Wellcome on <a href="${ext_url}">${app_name}</a>, have a nice experience.
                </p>
                
                <p>
                    ${app_name} Team
                </p>
            ` 
        }

        //console.log("MAIL OPTIONS : ", options);
        return new Promise ((resolve, reject)=>{
            transporter.sendMail(options, function(error, info) {
                if (error) {
                    return reject (new Error(`MailingError: ${error}`)) 
                }
                resolve();
            });
        });
    }

    this.newEmailAccount = (user, email)=>{
	
        var portal_ext_url = ('portal_ext_url' in settings.app_settings)? settings.app_settings.portal_ext_url : settings.app_settings.app_ext_protocol+'://portal.'+settings.app_settings.app_domain;
        var app_name = settings.app_settings.app_name;
        var verfify_link = `${portal_ext_url}/users/${user._id.toString()}/verify-email?id=${email._id.toString()}`;
    
        var options = {
            from: '"no-reply@algofab.fr',
            //to : '<' + user.profile.emails.filter(e=>e.verified == true).map(e=>e.email).join('>, <') + '>',
            to: `< ${email.email} >`,
            subject: 'New email account addition',
            text: `
                Hi ${email.email},
    
                The ${app_name} user ${user.profile.main_email} just added this email as on of his mail accounts.
    
                You can either ignore this notification if there was a mistake or follow the following link to verify you email : [${verfify_link}]."
    
                Please do not respond to this email. If you have questions address them to admin@teralab-datascience.fr.
    
                ${app_name} Team
            `,
            html : `
                Hi ${email.email},
    
                <p>
                    The <a href="${portal_ext_url}">${app_name}</a> user ${user.profile.main_email} just added this email as on of his mail accounts. <br>
                    
                    You can either ignore this notification if there was a mistake or follow the following link to verify you email : [<a href="${verfify_link}">${verfify_link}</a>]."
                    
                    Please do not respond to this email. If you have questions address them to <a href="mailto:admin@teralab-datascience.fr">admin@teralab-datascience.fr</a>. <br>
                </p>
                
                <p>
                    ${app_name} Team
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

    this.removedEmailAccount = (user, email)=>{
        var portal_ext_url = ('portal_ext_url' in settings.app_settings)? settings.app_settings.portal_ext_url : settings.app_settings.app_ext_protocol+'://portal.'+settings.app_settings.app_domain;
        var app_name = settings.app_settings.app_name;
    
        var options = {
            from: '"no-reply@algofab.fr',
            //to : '<' + user.profile.emails.filter(e=>e.verified == true).map(e=>e.email).join('>, <') + '>',
            to: `< ${user.profile.main_email} >`,
            subject: 'Email account removal',
            text: `
                Hi ${user.profile.main_email},
    
                You just successfully removed ${email} from your email accounts on  ${app_name}.
    
                Please do not respond to this email. If you have questions address them to admin@teralab-datascience.fr.
    
                ${app_name} Team
            `,
            html : `
                Hi ${user.profile.main_email},
    
                <p>
                    You just successfully removed ${email} from your email accounts on <a href="${portal_ext_url}">${app_name}</a>.<br>
                    
                    Please do not respond to this email. If you have questions address them to <a href="mailto:admin@teralab-datascience.fr">admin@teralab-datascience.fr</a>. <br>
                </p>
                
                <p>
                    ${app_name} Team
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

    return this;
})();
