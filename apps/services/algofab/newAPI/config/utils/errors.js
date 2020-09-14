
class APIError {
	constructor(errorCode, message, statusCode){
		Error.call(message);
		this.errorCode = errorCode;
		this.statusCode = statusCode;
	}

	statusCode(){
		return this.statusCode;
	}

	concat(err){
		return `${this.errorCode} > ${err.toString()}`;
	}

	toString(){
		return `${this.errorCode}: ${this.message}`
	}
}