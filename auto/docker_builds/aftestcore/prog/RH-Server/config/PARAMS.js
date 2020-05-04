
module.exports = function(env){
    if (env == "CLOUDWATT-PROD"){
        return {

            MONGO : "mongodb://192.168.0.17:27018/algofab",
            PORTAL_EXT_PROTOCOL : 'https://',
            PORTAL_EXT_ADDR : 'portal.algofab.fr',
            
            PORTAL_PROTOCOL : 'https://',
            PORTAL_ADDR : '192.168.0.15',
            PORTAL_PORT : 443,

            MI_PROTOCOL : 'http://',
            MI_ADDR : '192.168.0.16',
            MI_PORT : 32080,
            MI_EXT_ADDR : '84.39.51.48',

            
            RH_PROTOCOL : 'https://',
            RH_ADDR : '192.168.0.4',
            RH_PORT : 443,
            RH_EXT_ADDR : 'rh.algofab.fr',

            RANGE_PORT_MAX : 8090,
            RANGE_PORT_MIN : 8080,

            SAVE_FREQUENCY : 60*1000
        }
    }
    else if(env == "CLOUDWATT-DEV"){
        return {

            MONGO : "mongodb://192.168.0.6:27018/algofab",
            PORTAL_EXT_PROTOCOL : 'https://',
            PORTAL_EXT_ADDR : 'portail.hopto.org',
            
            PORTAL_PROTOCOL : 'https://',
            PORTAL_ADDR : '192.168.0.3',
            PORTAL_PORT : 443,

            MI_PROTOCOL : 'http://',
            MI_ADDR : '192.168.0.5',
            MI_PORT : 32080,
            MI_EXT_ADDR : '84.39.52.9',

            RH_PROTOCOL : 'https://',
            RH_ADDR : '192.168.0.11',
            RH_PORT : 443,
            RH_EXT_ADDR : 'req-handler.hopto.org',

            RANGE_PORT_MAX : 8090,
            RANGE_PORT_MIN : 8080,

            SAVE_FREQUENCY : 60*1000
        }
    }
    else if (env == "TERALAB"){
        return {

            MONGO : "mongodb://192.168.0.17:27018/algofab",
            PORTAL_EXT_PROTOCOL : 'https://',
            PORTAL_EXT_ADDR : 'ws37.tl.teralab-datascience.fr',
            
            PORTAL_PROTOCOL : 'https://',
            PORTAL_ADDR : '192.168.0.15',
            PORTAL_PORT : 443,

            MI_PROTOCOL : 'http://',
            MI_ADDR : '192.168.0.16',
            MI_PORT : 32080,

            MI_EXT_PROTOCOL : 'http://',
            MI_EXT_ADDR : '84.39.51.48',

            RH_PROTOCOL : 'http://',
            RH_ADDR : '10.32.1.19',
            RH_PORT : 443,

            RANGE_PORT_MAX : 8090,
            RANGE_PORT_MIN : 8080,

            SAVE_FREQUENCY : 60*1000
        }
    }
}