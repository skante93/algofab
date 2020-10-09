

const {settings, db } = require('../config');

const licenceManager = new db.LicencesManager();



var handlers = {
    get_licences : async (req, res, next)=>{
        console.log('## GET LICENCES : ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await licenceManager.getAll(res.locals.params);
        //console.log('r : ', r);
        r.reply(req, res);
    },
    get_one_licence: async (req, res, next) =>{
        console.log('## GET ONE LICENCE : ', res.locals.params);
        //res.status(405).json({body: "Not yet implemented!!"})
        var r = await licenceManager.getOne(res.locals.params);
        //console.log('r : ', r);
        r.reply(req, res);
    },
    create_licence: async(req, res, next)=>{
        //console.log('## CREATE LICENCE : ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await licenceManager.create(res.locals.params, res.locals.user);
        //console.log('r : ', r);
        r.reply(req, res);
    },
    update_licence: async(req, res, next)=>{
        console.log('## UPDATE LICENCE : ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await licenceManager.update(res.locals.params, res.locals.user);
        console.log('r : ', r);
        r.reply(req, res);
    },
    remove_licence: async(req, res, next)=>{
        console.log('## REMOVE LICENCES : ', res.locals.params);
        //res.status(405).json({body: "Not yet implemented!!"})
        var r = await licenceManager.remove(res.locals.params, res.locals.user);
        //console.log('r : ', r);
        r.reply(req, res);
    }
}

var definition = {
    '/': {
        get: {
            
            handler: "routes/licences#handlers#get_licences",
            tags: [ "licences" ],
            parameters: [
                {
                    name: "fields", 
                    in: "query", 
                    schema: { 
                        type: "array", 
                        items: { 
                            type: "string" 
                        }
                    }
                }
            ]
        },
        post: {
            handler: "routes/licences#handlers#create_licence",
            authorization_middleware: {
                middleware: "routes/auths#authorizations#api_token",
                security: {
                    apiKeyAuth: {
                        type: 'apiKey',
                        in: 'header',
                        name: "X-API-KEY"
                    } 
                }
            },
            tags: [ "licences" ],
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            $ref: "#/definitions/licence" 
                        }
                    },
                    'multipart/form-data': {
                    	schema: {
                            $ref: "#/definitions/licence" 
                        }
                    }
                }
            }
        }
    },
    '/{licenceID}': {
        get: {
            handler: "routes/licences#handlers#get_one_licence",
            tags: [ "licences" ],
            parameters: [
                {
                    name: "licenceID",
                    in: "path",
                    required: true,
                    type: "string"
                },
                {
                    name: "fields", 
                    in: "query", 
                    schema: { 
                        type: "array", 
                        items: { 
                            type: "string" 
                        }
                    }
                }
            ]
        },
        delete: {
            handler: "routes/licences#handlers#remove_licence",
            authorization_middleware: {
                middleware: "routes/auths#authorizations#api_token",
                security: {
                    apiKeyAuth: {
                        type: 'apiKey',
                        in: 'header',
                        name: "X-API-KEY"
                    } 
                }
            },
            tags: [ "licences" ],
            parameters: [
                {
                    name: "licenceID",
                    in: "path",
                    required: true,
                    type: "string"
                },
                {
                    name: "delayed",
                    in: "query",
                    required: false,
                    type: "boolean"
                }
            ]
        }
    }
}

const { SwaggerRouter } = require('../swagger-server'), swaggerDocs = require('../docs.json');

exports.router = new SwaggerRouter(definition, swaggerDocs);

exports.handlers = handlers;

//exports.authorizations = authorizations;