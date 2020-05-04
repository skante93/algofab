'use strict';
var nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'menodemailer@gmail.com',
        pass: 'J7GKymem'
    }
});

// setup email data with unicode symbols
/*var mailOptions = {
    from: '"no-reply@algofab.fr"<foo@blurdybloop.com>', // sender address
    to: 'souleymanecheickkante@yahoo.fr', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world ?', // plain text body
    html: '<b>Hello world ?</b>' // html body
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
        return console.log(error);
    }
    console.log('Message %s sent: %s', info.messageId, info.response);
});
*/
/*
var username = "skante", password = "sqds", email = "souleymanecheickkante@yahoo.fr";
var mailOptions = {
    from: '"no-reply@algofab.fr"<foo@blurdybloop.com>', // sender address
    to: email, // list of receivers
    subject: 'Subscription notification', // Subject line
    text: `
    Hi ${username}, 
    We inform you that your user account were successfully created. The last step for your now is to confirm you subcription.
    To do so just sign in with the following :
         - Username : ${username}
         - Password : ${password}

    We hope to see you soon on algofab.fr.
    
    Best regards, 
    AlgoFab Team.
    `, // plain text body
    html: `
    <p>Hi ${username}, <br/>
        We inform you that your user account were successfully created. The last step for your now is to confirm you subcription.<br/> 
        To do so just sign in with the following :<br/>
        <ul>
            <li>Username : ${username}</li>
            <li>Password : ${password}</li>
        </ul>
    </p>
    <p>
        We hope to see you soon on algofab.fr.
    </p>
    <p>
        Best regards, <br/>
        AlgoFab Team.
    </p>
    ` // html body
};

transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
        return console.log(error);
    }
    console.log('Message %s sent: %s', info.messageId, info.response);
});
*/

module.exports = transporter;