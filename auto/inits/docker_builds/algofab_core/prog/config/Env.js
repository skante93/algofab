
exports.settings = {
    "cl-prod" : {
        MONGO : "mongodb://192.168.0.17:27017/algofab",
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
    },
    "cl-dev" : {
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
    },
    "tl-prod" : {
        MONGO : 'mongodb://'+process.env.MONGO_SERVICE_HOST+"/algofab",

        LDAP : { 
            server : `ldap://${process.env.LDAP_SERVICE_HOST}`, 
            DN : process.env.LDAP_BASE_DN, 
            credential : { 
                login : `cn=admin,${process.env.LDAP_BASE_DN}`,  
                password : process.env.LDAP_PASSWORD
            }
        },

        DEMO : { 
            name : "ws37.tl.teralab-datascience.fr" , 
            port_range: { min : 33000, max : 35767}, 
            certs : undefined
        },

        PORTAL_EXT_PROTOCOL : 'https://',
        PORTAL_EXT_ADDR : 'ws37-kube-dev-portal.tl.teralab-datascience.fr',
        
        RH_EXT_PROTOCOL : 'https://',
        RH_EXT_ADDR : 'ws37-kube-dev-rh.tl.teralab-datascience.fr',

        PORTAL_PROTOCOL : 'http://',
        PORTAL_ADDR : 'portal',
        PORTAL_PORT : 8080,

        RH_PROTOCOL : 'http://',
        RH_ADDR : 'rh',
        RH_PORT : 3000,

        IM_PROTOCOL : 'http://',
        IM_ADDR : process.env.IM_SERVICE_HOST,
        IM_PORT : 32080,
    },
    "tl-dev" : {
        MONGO : "mongodb://10.32.5.135:27018/dev_algofab",

        LDAP : { 
            server : "ldap://ws37-cl2-en12", 
            DN : "dc=ldap,dc=algofab,dc=fr", 
            credential : { 
                login : "cn=admin,dc=ldap,dc=algofab,dc=fr",  
                password : "pass"
            }
        },

        DEMO : { 
            name : "ws37.tl.teralab-datascience.fr" , 
            port_range: { min : 36000, max : 38767}, 
            certs : undefined
        },

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
    }
}

exports.default = "tl-prod";