
var fs = require('fs'), exp = {};

if(process.argv[2] && process.argv[2] == "cl-dev"){
	process.env.CLOUD = "CLOUDWATT-DEV";
	console.log("Environement specified is : "+process.env.CLOUD);
	
	exp.params = require('../../PARAMS')(process.env.CLOUD);
	
	exp.certs = {
	    key: fs.readFileSync(__dirname+'/../certs/'+exp.params.PORTAL_EXT_ADDR+'/privkey.pem', 'utf8'),
	    cert: fs.readFileSync(__dirname+'/../certs/'+exp.params.PORTAL_EXT_ADDR+'/fullchain.pem', 'utf8'),
	    ca :  fs.readFileSync(__dirname+'/../certs/'+exp.params.PORTAL_EXT_ADDR+'/chain.pem', 'utf8')
	}
}

else if(process.argv[2] && process.argv[2] == "cl-prod"){
	process.env.CLOUD = "CLOUDWATT-PROD";
	console.log("Environement specified is : "+process.env.CLOUD);
	
	exp.params = require('../../PARAMS')(process.env.CLOUD);
	
	exp.certs = {
	    key: fs.readFileSync(__dirname+'/../certs/'+exp.params.PORTAL_EXT_ADDR+'/privkey.pem', 'utf8'),
	    cert: fs.readFileSync(__dirname+'/../certs/'+exp.params.PORTAL_EXT_ADDR+'/fullchain.pem', 'utf8'),
	    ca :  fs.readFileSync(__dirname+'/../certs/'+exp.params.PORTAL_EXT_ADDR+'/chain.pem', 'utf8')
	}
}

else if(process.argv[2] && process.argv[2] == "tl-dev"){
	process.env.CLOUD = "TERALAB-DEV";
	
	console.log("Environement specified is : "+process.env.CLOUD);
	
	exp.params = require('../../PARAMS')(process.env.CLOUD);
	
	exp.certs = {
	    key: fs.readFileSync(__dirname+'/../certs/'+exp.params.PORTAL_EXT_ADDR+'/privkey.pem', 'utf8'),
	    cert: fs.readFileSync(__dirname+'/../certs/'+exp.params.PORTAL_EXT_ADDR+'/fullchain.pem', 'utf8'),
	    ca :  fs.readFileSync(__dirname+'/../certs/'+exp.params.PORTAL_EXT_ADDR+'/chain.pem', 'utf8')
	}
}
else{
	process.env.CLOUD = "TERALAB-PROD";
	
	if(process.argv[2] && process.argv[2] == "tl-prod")
		console.log("Environement specified is : "+process.env.CLOUD);
	else
		console.log("Default environement is : "+process.env.CLOUD);
	
	
	exp.params = require('../../PARAMS')(process.env.CLOUD);

	exp.certs = {
	    key: fs.readFileSync(__dirname+'/../certs/'+exp.params.PORTAL_EXT_ADDR+'/privkey.pem', 'utf8'),
	    cert: fs.readFileSync(__dirname+'/../certs/'+exp.params.PORTAL_EXT_ADDR+'/fullchain.pem', 'utf8'),
	    ca :  fs.readFileSync(__dirname+'/../certs/'+exp.params.PORTAL_EXT_ADDR+'/chain.pem', 'utf8')
	}
}

exp.mongo = require('./DB')(exp.params.MONGO); 
exp.utils = require('../utils')(exp);
//exp.state = require("./SAVE")(exp.params.SAVE_FREQUENCY);
exp.socket = require('./socket')(exp);	

console.log(String.raw`
	    ___     __        ______   ______   ______    ___     ______    
	   / _ \    | |      |  ____| |  __  | | _____|  / _ \    |  _  \   ${process.env.CLOUD}
	  / / \ \   | |      | | ____ | |  | | | |__    / / \ \   | |_/ /   
	 / /---\ \  | |____  | |__| | | |__| | |  __|  / /---\ \  | |_\ \   
	/_/     \_\ |______| |______| |______| |_|    /_/     \_\ |_____/   PORTAL

`);

//console.log("Env = "++", Domain = "+process.argv[3]);


module.exports = exp