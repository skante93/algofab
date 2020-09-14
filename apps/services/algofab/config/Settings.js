



var base = {
    CLOUD : global.CLOUD,
    mailOptions : {
	    service: 'gmail',
	    auth: {
	        user: 'menodemailer@gmail.com',
	        pass: 'gipfzrowbmvqqkbj'
	    }
	},
    //RANGE_PORT_MAX : 8090,
    //RANGE_PORT_MIN : 8080,

    SAVE_FREQUENCY : 1000*60*60, // 1 hour
    SOCKET_LOG_TIMER : 1000*60*5, // 5 minutes
    TIME_TO_WAIT_BEFORE_DELETING_ALGO : 1000*60*60*24*7, // 7 days
    SERVERS_TIMEOUT : 1000*60*10
};

var available_env_configs = require('./Env');
var env = (process.argv[2])? ( (process.argv[2] in available_env_configs.settings)? process.argv[2] : null ) : available_env_configs.default;



if(!env) {
    throw new Error('The evironnement "'+process.argv[2]+'" specified does not exist');
}

Object.assign(base, available_env_configs.settings[env]);


//console.log("base : "+require('util').inspect(base));
//console.log("base : "+require('util').inspect(base));

module.exports = base;
