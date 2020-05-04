
module.exports = function(env){
    var base = {
        CLOUD : env,
        //RANGE_PORT_MAX : 8090,
        //RANGE_PORT_MIN : 8080,

        SAVE_FREQUENCY : 1000*60*60, // 1 hour
        SOCKET_LOG_TIMER : 1000*60*5, // 5 minutes
        TIME_TO_WAIT_BEFORE_DELETING_ALGO : 1000*60*60*24*7, // 7 days
        SERVERS_TIMEOUT : 1000*60*10
    };

    if (env == "CLOUDWATT-PROD"){
        Object.assign(base, {
            MONGO : "mongodb://192.168.0.17:27018/algofab",
        	PORTAL_EXT_PROTOCOL : 'https://',
            PORTAL_EXT_ADDR : 'portal.algofab.fr',
            
            PORTAL_PROTOCOL : 'https://',
            PORTAL_ADDR : '192.168.0.15',
            PORTAL_PORT : 443,

            SOCKET_PORT : 8050,

            IM_PROTOCOL : 'http://',
            IM_ADDR : '192.168.0.16',
            IM_PORT : 32080,
            IM_EXT_ADDR : '84.39.51.48',
            
            RH_PROTOCOL : 'https://',
            RH_ADDR : '192.168.0.4',
            RH_PORT : 443,
            RH_EXT_ADDR : 'rh.algofab.fr',
        });
    }
    else if(env == "CLOUDWATT-DEV"){
        Object.assign(base, {
            MONGO : "mongodb://192.168.0.6:27018/algofab",

            PORTAL_EXT_PROTOCOL : 'https://',
            PORTAL_EXT_ADDR : 'portail.hopto.org',
            
            PORTAL_PROTOCOL : 'https://',
            PORTAL_ADDR : '192.168.0.3',
            PORTAL_PORT : 443,

            IM_PROTOCOL : 'http://',
            IM_ADDR : '192.168.0.5',
            IM_PORT : 32080,
            IM_EXT_ADDR : '84.39.52.9',

            RH_PROTOCOL : 'https://',
            RH_ADDR : '192.168.0.11',
            RH_PORT : 443,
            RH_EXT_ADDR : 'req-handler.hopto.org',
        });
    }
    else if(env == "TERALAB-DEV"){
        Object.assign(base, {
            MONGO : "mongodb://10.32.5.135:27018/dev_algofab",

            LDAP : { 
                server : "ldap://ws37-cl2-en12", 
                DN : "dc=ldap,dc=algofab,dc=fr", 
                credential : { 
                    login : "cn=admin,dc=ldap,dc=algofab,dc=fr",  
                    password : "pass"
                }
            },

            DEMO : { name : "10.32.5.135", certs : undefined} ,

            PORTAL_EXT_PROTOCOL : 'https://',
            PORTAL_EXT_ADDR : 'ws37-portal-dev.tl.teralab-datascience.fr',

            RH_EXT_PROTOCOL : 'https://',
            RH_EXT_ADDR : 'ws37-rh-dev.tl.teralab-datascience.fr',

            PORTAL_PROTOCOL : 'http://',
            PORTAL_ADDR : 'localhost',
            PORTAL_PORT : 8080,

            RH_PROTOCOL : 'http://',
            RH_ADDR : '10.32.5.24',
            RH_PORT : 3000,

            IM_PROTOCOL : 'http://',
            IM_ADDR : 'localhost',
            IM_PORT : 32080,
        });
    }
    else {
    	Object.assign(base, {
            MONGO : "mongodb://10.32.5.135:27018/algofab",

            LDAP : { 
                server : "ldap://ws37-cl2-en12", 
                DN : "dc=ldap,dc=algofab,dc=fr", 
                credential : { 
                    login : "cn=admin,dc=ldap,dc=algofab,dc=fr",  
                    password : "pass"
                }
            },

            DEMO : { name : "10.32.5.135", certs : undefined} ,

            PORTAL_EXT_PROTOCOL : 'https://',
            PORTAL_EXT_ADDR : 'ws37-portal.tl.teralab-datascience.fr',
            
            RH_EXT_PROTOCOL : 'https://',
            RH_EXT_ADDR : 'ws37-rh.tl.teralab-datascience.fr',

            PORTAL_PROTOCOL : 'http://',
            PORTAL_ADDR : 'localhost',
            PORTAL_PORT : 8080,

            RH_PROTOCOL : 'http://',
            RH_ADDR : '10.32.11.139',
            RH_PORT : 3000,

            IM_PROTOCOL : 'http://',
            IM_ADDR : 'localhost',
            IM_PORT : 32080,
        });
    }

    return base;
}
