

const {settings, db } = require('../config');

const agreementManager = new db.AgreementManager();



var handlers = {
    get_agreements : async (req, res, next)=>{
        console.log('## GET LICENCES : ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await agreementManager.getAll(res.locals.params);
        //console.log('r : ', r);
        r.reply(req, res);
    },
    get_one_agreement: async (req, res, next) =>{
        console.log('## GET ONE LICENCE : ', res.locals.params);
        //res.status(405).json({body: "Not yet implemented!!"})
        var r = await agreementManager.getOne(res.locals.params);
        //console.log('r : ', r);
        r.reply(req, res);
    },
    create_agreement: async(req, res, next)=>{
        //console.log('## CREATE LICENCE : ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await agreementManager.create(res.locals.params, res.locals.user);
        console.log('r : ', r);
        r.reply(req, res);
    },
    update_agreement: async(req, res, next)=>{
        console.log('## UPDATE LICENCE : ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await agreementManager.update(res.locals.params, res.locals.user);
        console.log('r : ', r);
        r.reply(req, res);
    },
    remove_agreement: async(req, res, next)=>{
        console.log('## REMOVE LICENCES : ', res.locals.params);
        //res.status(405).json({body: "Not yet implemented!!"})
        var r = await agreementManager.remove(res.locals.params, res.locals.user);
        //console.log('r : ', r);
        r.reply(req, res);
    }
}

var definition = {
    '/': {
        get: {
            
            handler: "routes/agreements#handlers#get_agreements",
            tags: [ "agreements" ],
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
                },
                {
                    name: "author", 
                    in: "query", 
                    type: "string"
                }
            ]
        },
        post: {
            handler: "routes/agreements#handlers#create_agreement",
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
            tags: [ "agreements" ],
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            $ref: "#/definitions/agreement" 
                        }
                    },
                    'multipart/form-data': {
                    	schema: {
                            $ref: "#/definitions/agreement" 
                        }
                    }
                }
            }
        }
    },
    '/{agreementID}': {
        get: {
            handler: "routes/agreements#handlers#get_one_agreement",
            tags: [ "agreements" ],
            parameters: [
                {
                    name: "agreementID",
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
            handler: "routes/agreements#handlers#remove_agreement",
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
            tags: [ "agreements" ],
            parameters: [
                {
                    name: "agreementID",
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