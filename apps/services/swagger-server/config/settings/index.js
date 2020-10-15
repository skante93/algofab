
const YAML = require('yaml'), fs = require('fs'); 

// console.log("read : \n****" +fs.readFileSync('configOptions.yaml')+'\n****' );
// var configOptions = YAML.parse( fs.readFileSync('configOptions.yaml', {encoding : 'utf-8'}) );

// console.log('configOptions : ', JSON.stringify(configOptions, null, 2));

var example_settings = {
    settings: {
        app_name: "Algofab",
        
        remote_access: {
            direct_access: {
                protocol: 'http',
                api: "localhost:3000",
                portal: "localhost:4200",
            }
        },
        preferences: {
            ldap_support: false,
            mailing_support: true,
            workshop_support: false,
        },

        mongo: {
            url: 'mongodb://mongo/algofab'
        },

        ldap: {
            url: 'ldap://ldap',
            search_dn: "ou=test,dc=ldap,dc=algofab,dc=fr",
            auth: {
                login: "cn=admin,dc=ldap,dc=algofab,dc=fr",
                password: "password"
            }
        },

        mail: {
            server: "gmail",
            auth: {
                username: "menodemailer@gmail.com",
                password: "gipfzrowbmvqqkbj",
            }
        },

        app_roles: {
            super: {
                username: "admin",
                email: "souleymanecheickkante@yahoo.fr",
                default_password: "admin123",
                auth_token: "ABSOLUTE_PASS"
            },
            admin: {},
            user: {},
        },
        
        validation_schemes: {
            username: new RegExp("^[a-z]{1}[a-z0-9]+$"),
            password: new RegExp(".{5}"),
            resource_name: new RegExp("^[a-z]{1}[a-z0-9]+$"),
            storage_name: new RegExp("^[a-z]{1}[a-z0-9]+$"),
            algo_name: new RegExp("^[a-z]{1}[a-z0-9]+$") 
        },

        data_origin: {
            nfs: {
                address: "192.168.150.1",
                path: "/home/skante/nfs"
            }
        },

        deployment_apis: {
            docker: {}
        },

        api: {
            jwt_secret: "JWT-SIMPLE ALGOFAB SECRET",
            logging: {
                loglevel: 'INFO',
                output_path: process.cwd() + '/out.log',
                error_path: process.cwd() + '/err.log',
            },
            operations_timing: {
                user_deletion_delay: 60 * 1000, // 1m
                resource_deletion_delay: 60 * 1000, // 1m
                licence_deletion_delay: 60 * 1000, // 1m
                ratings_deletion_delay: 60 * 1000, // 1m 
                daemon_cycles: {
                    all: 60 * 1000, // 1m
                    remove_outdated: 60 * 1000 // 1m
                }
            }
        }
    }
}

exports.settings = example_settings.settings;

exports.getFullUrl = (server)=>{
    if (['portal', 'api'].indexOf(server)<0){
        throw new Error('can only get urls for the portal and the api');
    }
    if ('proxy_conf' in example_settings.settings.remote_access){
        var pf = example_settings.settings.remote_access.proxy_conf;
        var proto = pf.protocol ? pf.protocol+(pf.protocol.endsWith('://')?'':'://') : 'https://';
        if ('domain' in pf){
            //
            return proto + server+'.' + pf.domain;
        }
        else if(server in pf){
            //
            return proto + pf[server];
        }
        else{
            throw new Error('api not specified');
        }
    }
    else if('direct_access' in example_settings.settings.remote_access){
        var da = example_settings.settings.remote_access.direct_access;
        var proto = da.protocol ? da.protocol+(da.protocol.endsWith('://')?'':'://') : 'http://';
        
        if ('domain' in da){
            //
            return proto + server + '.' + da.domain;
        }
        else if(server in da){
            //
            return proto + da[server];
        }
        else{
            throw new Error('api not specified');
        }
    }
    else{
        throw new Error('remote_access badly configured');
    }
}