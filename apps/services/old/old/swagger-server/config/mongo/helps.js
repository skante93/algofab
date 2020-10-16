const bCrypt = require('bcrypt'), jwt = require('jwt-simple');

var processParamsFields = (params, fields) => {
    // Look for required and default values
    for (let field of fields) {
        if (!fields){
            continue;
        }

        if ( !(field.name in params && typeof params[field.name] !== 'undefined' && params[field.name] != null) ){
            if ('default' in field){
                params[field.name] = field.default;
            }
            else if (field.required === true) {
                return new Error(`field ${field.name} is required`);
            }
        }
    }
    
    // Processing fields
    for (let field of fields) {
        if ( typeof params[fields.name] === 'string' && field.toLowerCase === true ){
            params[field.name] = params[field.name].toLowerCase();
        }
        else if(typeof params[fields.name] === 'string' && field.toUpperCase === true){
            params[field.name] = params[field.name].toUpperCase();
        }
    }
}

class RestResponse {
    constructor(code, statusCode, message, warning){
        this.code = code;
        this.statusCode = statusCode;
        
        if ( !(statusCode >= 200 && statusCode < 300) ){
            this.error = message instanceof Error ? message : new Error(message);
        }
        else{
            this.response = message;
        }

        this.warning = warning? warning : null;
    }
    reply(req, res){
        if (this.warning != null){
            //
            res.status(this.statusCode).json({ type: "warning", response: this.response, warning: this.warning });
        }
        else if (this.statusCode >= 200 && this.statusCode < 300){ //success
            //
            res.status(this.statusCode).json({ type: "success", response: this.response });
        }
        else {
            res.status(this.statusCode).json({ type: "error", code: this.code, message: this.error.message });
        }
    }
}

const randomPassword = (passwordLength)=>{
	if (typeof passwordLength === 'undefined'){
		passwordLength = 20;
	}

	const cap_chars = Array.from(Array(26), (_,i)=> i+65); // A-Z
	const min_chars	= Array.from(Array(26), (_,i)=> i+97); // a-z
	const mum_chars	= Array.from(Array(10), (_,i)=> 48); // a-z
	const special_chars	= [45, 37, 36]; // "-", "%", "$" 
	
	var password = [ min_chars[ Math.floor( Math.random()*min_chars.length ) ] ];
	
	while(password.length < passwordLength){
		var rand = Math.random();

		if (rand <= 0.2){
			password.push( special_chars[ Math.floor( Math.random()*special_chars.length ) ] );
		}
		else if (rand <= 0.4){
			password.push( mum_chars[ Math.floor( Math.random()*mum_chars.length ) ] );
		}
		else if (rand <= 0.7){
			password.push( cap_chars[ Math.floor( Math.random()*cap_chars.length ) ] );
		}
		else{
			password.push( min_chars[ Math.floor( Math.random()*min_chars.length ) ] );
		}
	}
	

	return password.map(c => String.fromCharCode(c) ).join('') ;
}

const createHash = (str)=> bCrypt.hashSync(str, bCrypt.genSaltSync(10), null);
const compareSync = (clear, hash)=> bCrypt.compareSync(clear, hash);

const JWT_SECRET = "JWT-SIMPLE ALGOFAB SECRET";

const createJWT = (options)=> {
    var tkn = jwt.encode(options, JWT_SECRET);
    return tkn;
}

exports.processParamsFields = processParamsFields;

exports.RestResponse = RestResponse;

exports.randomPassword = randomPassword;

exports.createHash = createHash;

exports.compareSync = compareSync;

exports.createJWT = createJWT;