

const {settings, db } = require('../config');

const ratingsManager = new db.RatingsManager();



var handlers = {
    get_ratings : async (req, res, next)=>{
        console.log('## GET RATINGS : ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await ratingsManager.getAll(res.locals.params);
        //console.log('r : ', r);
        r.reply(req, res);
    },
    get_one_ratings: async (req, res, next) =>{
        console.log('## GET ONE RATINGS : ', res.locals.params);
        //res.status(405).json({body: "Not yet implemented!!"})
        var r = await ratingsManager.getOne(res.locals.params);
        //console.log('r : ', r);
        r.reply(req, res);
    },
    create_ratings: async(req, res, next)=>{
        //console.log('## CREATE RATINGS : ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await ratingsManager.create(res.locals.params, res.locals.user);
        console.log('r : ', r);
        r.reply(req, res);
    },
    update_ratings: async(req, res, next)=>{
        console.log('## UPDATE RATINGS : ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await ratingsManager.update(res.locals.params, res.locals.user);
        console.log('r : ', r);
        r.reply(req, res);
    },
    remove_ratings: async(req, res, next)=>{
        console.log('## REMOVE RATINGS : ', res.locals.params);
        //res.status(405).json({body: "Not yet implemented!!"})
        var r = await ratingsManager.remove(res.locals.params, res.locals.user);
        //console.log('r : ', r);
        r.reply(req, res);
    }
}

var definition = {
    '/': {
        get: {
            
            handler: "routes/ratings#handlers#get_ratings",
            tags: [ "ratings" ],
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
                    name: "userID", 
                    in: "query", 
                    type: "string"
                },
                {
                    name: "resourceID", 
                    in: "query", 
                    type: "string"
                }
            ]
        },
        post: {
            handler: "routes/ratings#handlers#create_ratings",
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
            tags: [ "ratings" ],
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            $ref: "#/definitions/ratings" 
                        }
                    },
                    'multipart/form-data': {
                    	schema: {
                            $ref: "#/definitions/ratings" 
                        }
                    }
                }
            }
        }
    },
    '/{ratingsID}': {
        get: {
            handler: "routes/ratings#handlers#get_one_ratings",
            tags: [ "ratings" ],
            parameters: [
                {
                    name: "ratingsID",
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
            handler: "routes/ratings#handlers#remove_ratings",
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
            tags: [ "ratings" ],
            parameters: [
                {
                    name: "ratingsID",
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
        },
        put: {
        	handler: "routes/ratings#handlers#update_ratings",
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
            tags: [ "ratings" ],
            parameters: [
                {
                    name: "ratingsID",
                    in: "path",
                    required: true,
                    type: "string"
                }
            ],
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            $ref: "#/definitions/ratings" 
                        }
                    },
                    'multipart/form-data': {
                    	schema: {
                            $ref: "#/definitions/ratings" 
                        }
                    }
                }
            }
        }
    }
}

const { SwaggerRouter } = require('../swagger-server'), swaggerDocs = require('../docs.json');

exports.router = new SwaggerRouter(definition, swaggerDocs);

exports.handlers = handlers;

//exports.authorizations = authorizations;