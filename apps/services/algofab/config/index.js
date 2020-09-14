
var fs = require('fs');


if(process.argv[2] && process.argv[2] == "cl-dev"){
	global.CLOUD = "CLOUDWATT-DEV";
	console.log("Environement specified is : "+global.CLOUD);

	
	if(global.algofab_server == "Portail" || global.algofab_server == "RH" ){
		var certs_dir = __dirname+'/certs/'+global.algofab_server+'/'+global.settings[ (global.algofab_server == "Portail")? 'PORTAL_EXT_ADDR':'RH_EXT_ADDR' ];
		
		global.certs = {
		    key: fs.readFileSync(certs_dir+'/privkey.pem', 'utf8'),
		    cert: fs.readFileSync(certs_dir+'/fullchain.pem', 'utf8'),
		    ca :  fs.readFileSync(certs_dir+'/chain.pem', 'utf8')
		}
	}
}

else if(process.argv[2] && process.argv[2] == "cl-prod"){
	global.CLOUD = "CLOUDWATT-PROD";
	console.log("Environement specified is : "+global.CLOUD);
	
	if(global.algofab_server == "Portail" || global.algofab_server == "RH" ){
		var certs_dir = __dirname+'/certs/'+global.algofab_server+'/'+global.settings[ (global.algofab_server == "Portail")? 'PORTAL_EXT_ADDR':'RH_EXT_ADDR' ];
		
		global.certs = {
		    key: fs.readFileSync(certs_dir+'/privkey.pem', 'utf8'),
		    cert: fs.readFileSync(certs_dir+'/fullchain.pem', 'utf8'),
		    ca :  fs.readFileSync(certs_dir+'/chain.pem', 'utf8')
		}
	}
}

else if(process.argv[2] && process.argv[2] == "tl-dev"){
	global.CLOUD = "TERALAB-DEV";
	console.log("Environement specified is : "+global.CLOUD);
}

else{
	global.CLOUD = "TERALAB-PROD";
	if(process.argv[2] && process.argv[2] == "tl-prod")
		console.log("Environement specified is : "+global.CLOUD);
	else
		console.log("Default environement is : "+global.CLOUD);
}

settings = require('./Settings');

mongo = require('./Mongo');

utils = require('./utils')(global);
console.log("This is my utis : "+Object.keys(utils))
//exp.state = require("./SAVE")(exp.params.SAVE_FREQUENCY);
//global.socket = require('./socket')(global);	



//console.log("Env = "++", Domain = "+process.argv[3]);

//console.log("settings : "+require('util').inspect(global.settings))
module.exports = global