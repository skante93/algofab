
const fs = require('fs'), settings = require('../settings');

// FormatError 
// MissingParamError 
// MailingError 
// NotFoundError 
// AlreadyExistError 
// WrongValueError 
// LDAPAccountCreationError
// LDAPAccountUpdateError
// NotAllowedError
const errTypeStatusCode = {
	400 : ["FormatError", "WrongValueError", "MissingParamError"],
	401 : ['NotAllowedError'],
	404 : ["NotFoundError"],
	409 : ["AlreadyExistError"],
	500 : ["LDAPAccountCreationError", "LDAPAccountUpdateError"]
}

const statusCodeFromErrorMessage = (msg)=>{
	msg = msg.replace(/^Error\:\ /, '');
	var code = 0;
	for(var s in errTypeStatusCode){
		var found = false;
		for (var i=0; i<errTypeStatusCode[s].length; i++){
			if (msg.startsWith(errTypeStatusCode[s]+': ')){
				code = parseInt(s);
				found = true;
				break;
			}
		}
		if (found) break;
	}

	return code != 0? code : 500;
}

const log_REST = (type, obj)=> { 
	var msg = "";
	if (type == "error"){
		msg = `${obj.h} ${obj.d} [error] [${obj.u}] ${obj.s} ${obj.r} "${obj.error.toString()}"\n`;
		fs.appendFileSync(settings.app_settings.logs.err, msg);
	}
	else {
		msg = `${obj.h} ${obj.u} ${obj.d} ${obj.r} ${obj.r} ${obj.s}\n`;
		fs.appendFileSync(settings.app_settings.logs.out, msg);
	}

	if (settings.app_settings.logs.log) console.log(msg);
}



module.exports = {
	out: (req, res, responseObject)=>{
		const type = "warning" in responseObject && responseObject.warning? "warning" : "success";

		const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress.split(":").pop();
		const statusCode = "statusCode" in responseObject? responseObject.statusCode : 200;
		const user = res.locals.user? res.locals.user.profile.emails.filter(e=>e.verified == true)[0].email : '-';
		const date = `[${new Date(res.locals.t0)}] ${(Date.now()-res.locals.t0)}ms`;

		const logParams = {
			h: ip,
			u: user,
			d: date,
			r: `"${req.method.toUpperCase()} ${req.originalUrl}"`,
			s: statusCode
		}

		log_REST(type, logParams);

		var headers = "headers" in responseObject ? responseObject.headers: {"Content-Type": "application/json"};
		if (!("Content-Type" in headers)) headers["Content-Type"] = "application/json";

		var body;
		if (headers["Content-Type"] == "application/json") {
			body = { status:"success", body: responseObject.body};
			if (type == "warning"){
				body.warning = responseObject.warning; 
			}
			//console.log("req.query : ", req.query, "(has pretty :", ("pretty" in req.query && req.query.pretty == "true"), ")");
			body = ("pretty" in req.query && req.query.pretty == "true")? JSON.stringify(body, null, 2) : JSON.stringify(body);
		}
		else {
			body = responseObject.body;
		}

		res.writeHead(statusCode, headers);
		res.end(body);
	},
	err: (req, res, responseObject)=>{
		const type = "error" ;

		const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress.split(":").pop();
		const statusCode = "statusCode" in responseObject? responseObject.statusCode : statusCodeFromErrorMessage(responseObject.error);
		const user = res.locals.user? res.locals.user.profile.emails.filter(e=>e.verified == true)[0].email : '-';
		const date = `[${new Date(res.locals.t0)}] ${(Date.now()-res.locals.t0)}ms`;

		const logParams = {
			h: ip,
			u: user,
			d: date,
			r: `"${req.method.toUpperCase()} ${req.originalUrl}"`,
			s: statusCode,
			error: responseObject.error
		}

		log_REST(type, logParams);

		var headers = "headers" in responseObject ? responseObject.headers: {"Content-Type": "application/json"};
		headers["Content-Type"] = "application/json";

		var body = { status:"error", body: responseObject.error.toString().replace(/^Error\:\ /, '')};
		body = ("pretty" in req.query && req.query .pretty == "true")? JSON.stringify(body, null, 2) : JSON.stringify(body);
		
		res.writeHead(statusCode, headers);
		res.end(body);
	}
}
