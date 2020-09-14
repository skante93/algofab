


var settingsValues = {
	mongo_url : "mongodb://mongo/test_algofab",
	ldap: {
		url : "ldap://ldap",
		search_dn: "ou=test,dc=ldap,dc=algofab,dc=fr",
		auth: {
			login: "cn=admin,dc=ldap,dc=algofab,dc=fr",
			password: "password"
		}
	},
	mail_options : {
	    service: 'gmail',
	    auth: {
	        user: 'menodemailer@gmail.com',
	        pass: 'gipfzrowbmvqqkbj'
	    }
	},
	app_settings: {
		app_name: "Algofab",
		app_ext_protocol: "https",
		app_domain: "tl.teralab-datascience.fr",
		uri_names: {
			signin: "signin",
			signup: "signup",
			signout: "signout",
		},

		user_roles: {
			values: [ 'admin', 'user' ],
			default: "user"
		},
		username_validation_regex : new RegExp('^[a-z]{1}[a-z0-9]+$'),
		password_validation_regex: new RegExp('^[a-zA-Z0-9\-\$\%]{8,20}$'),
		livedata_name_regex: new RegExp('^[a-zA-Z]{1}[a-zA-Z0-9\-\ ]+$'),
		password_expiration_delay : 1000*60*5, // 5 mins
		logs: {
			out: process.cwd()+'/out.log',
			err: process.cwd()+'/err.log',
			log_console: true
		},
		super_user: {
			login: "admin",
			email: "souleymane.kante@mines-telecom.fr",
			default_password: "admin",
			auth_token: "ABSOLUTE_PASS"
		},

		user_removal_delay: 1000*60, // 1 min
		resource_removal_delay: 1000*60, // 1 min
		//host_port_range: { min: 8000, max: 8005},
		daemon_interval: 1000*60 // 1min
	},
	
	nfs_data_options: {
		address: "192.168.43.128",
		path: "/home/skante/nfs",
		apiMountPoint: "/app-data"
	},

	infraManager: {
		docker: {
			portainerUrl: "http://portainer:9000",
			// portainerUrl: "http://localhost:9000",
			// password: "password"
		}
	} 
}



module.exports = settingsValues;