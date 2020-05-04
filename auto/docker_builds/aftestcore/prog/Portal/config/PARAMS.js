
module.exports = function(env){
    if (env == "CLOUDWATT-PROD"){
        return {
            CLOUD : 'CLOUDWATT-PROD',
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

            RANGE_PORT_MAX : 8090,
            RANGE_PORT_MIN : 8080,

            SAVE_FREQUENCY : 60*60*1000, // 1 hour
            SOCKET_LOG_TIMER : 5*60*1000, // 5 minutes
            TIME_TO_WAIT_BEFORE_DELETING_ALGO : 7*24*60*60*1000 // 7 days
        }
    }
    else if(env == "CLOUDWATT-DEV"){
        return {
            CLOUD : 'CLOUDWATT-DEV',
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

            RANGE_PORT_MAX : 8090,
            RANGE_PORT_MIN : 8080,

            SAVE_FREQUENCY : 60*60*1000, // 1 hour
            SOCKET_LOG_TIMER : 5*60*1000, // 5 minutes
            TIME_TO_WAIT_BEFORE_DELETING_ALGO : 7*24*60*60*1000 // 7 days
        }
    }
    else if (env == "TERALAB"){
        return {
            CLOUD : 'TERALAB',
            MONGO : "mongodb://10.32.4.157:27018/algofab",
            PORTAL_EXT_PROTOCOL : 'https://',
            PORTAL_EXT_ADDR : 'ws37-portal.tl.teralab-datascience.fr',
            
            PORTAL_PROTOCOL : 'http://',
            PORTAL_ADDR : '10.32.11.138',
            PORTAL_PORT : 443,

            IM_PROTOCOL : 'http://',
            IM_ADDR : '10.200.212.30',
            IM_PORT : 32080,
            
            RH_EXT_PROTOCOL : 'https://',
            RH_EXT_ADDR : 'ws37-rh.tl.teralab-datascience.fr',

            RH_PROTOCOL : 'http://',
            RH_ADDR : '10.32.11.139',
            RH_PORT : 443,

            RANGE_PORT_MAX : 8090,
            RANGE_PORT_MIN : 8080,

            SAVE_FREQUENCY : 60*60*1000, // 1 hour
            SOCKET_LOG_TIMER : 5*60*1000, // 5 minutes
            TIME_TO_WAIT_BEFORE_DELETING_ALGO : 15*1000 // 7 days
        }
    }
}