

const {settings, db } = require('../config');

const resourcesManager = new db.ResourcesManager();

const filterResource = (r)=>{
    //console.log("############# filteruserAccount called !!! #######");
    //console.log("before : ", u);
    
    return r;
}

var handlers = {
    get_resources : async (req, res, next)=>{
        console.log('## GET RESOURCEs : ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await resourcesManager.getAll(res.locals.params);
        //console.log('r : ', r);
        r.reply(req, res);
    },
    get_one_resource: async (req, res, next) =>{
        console.log('## GET ONE RESOURCE : ', res.locals.params);
        //res.status(405).json({body: "Not yet implemented!!"})
        var r = await resourcesManager.getOne(res.locals.params);
        //console.log('r : ', r);
        r.reply(req, res);
    },
    create_resource: async(req, res, next)=>{
        console.log('##### CREATE RESOURCE : ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await resourcesManager.create(res.locals.params, res.locals.user);
        //console.log('r : ', r);
        r.reply(req, res);
    },
    update_resource_meta: async(req, res, next)=>{
        console.log('## UPDATE RESOURCE META: ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await resourcesManager.updateMetadata(res.locals.params, res.locals.user);
        console.log('r : ', r);
        r.reply(req, res, filterResource);
    },
    update_resource_archive: async(req, res, next)=>{
        console.log('## UPDATE RESOURCE ARCHIVE: ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await resourcesManager.updateArchive(res.locals.params, res.locals.user);
        console.log('r : ', r);
        r.reply(req, res, filterResource);
    },
    get_resource_archive: async(req, res, next)=>{
        console.log('## GET RESOURCE ARCHIVE: ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await resourcesManager.getArchive(res.locals.params, res.locals.user, res);
        //console.log('r : ', r);
        //r.reply(req, res, filterResource);
    },
    remove_resource: async(req, res, next)=>{
        console.log('## REMOVE USER : ', res.locals.params);
        //res.status(405).json({body: "Not yet implemented!!"})
        var r = await resourcesManager.remove(res.locals.params, res.locals.user);
        //console.log('r : ', r);
        r.reply(req, res);
    }
}

var definition = {
    '/': {
        get: {
            handler: "routes/resources#handlers#get_resources",
            tags: [ "resources" ],
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
            handler: "routes/resources#handlers#create_resource",
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
            tags: [ "resources" ],
            requestBody: {
                content: {
                    'multipart/form-data': {
                        schema: { $ref : "#/definitions/resourceMetadata" }
                    }
                }
            }
        }
    },
    '/{resourceID}': {
        get: {
            handler: "routes/resources#handlers#get_one_resource",
            tags: [ "resources" ],
            parameters: [
                {
                    name: "resourceID",
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
            handler: "routes/resources#handlers#remove_resource",
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
            tags: [ "resources" ],
            parameters: [
                {
                    name: "resourceID",
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
    },
    '/{resourceID}/metadata': {
        put: {
            handler: "routes/resources#handlers#update_resource_meta",
            tags: [ "resources" ],
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
            parameters: [
                {
                    name: "resourceID",
                    in: "path",
                    required: true,
                    type: "string"
                }
            ],
            requestBody: {
                content: {
                    'multipart/form-data': {
                        schema: { $ref : "#/definitions/resourceMetadata" }
                    }
                }
            }
        }
    },
    '/{resourceID}/archive': {
        get:{
            handler: "routes/resources#handlers#get_resource_archive",
            tags: [ "resources" ],
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
            parameters: [
                {
                    name: "resourceID",
                    in: "path",
                    required: true,
                    type: "string"
                }
            ]
        },
        put: {
            handler: "routes/resources#handlers#update_resource_archive",
            tags: [ "resources" ],
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
            parameters: [
                {
                    name: "resourceID",
                    in: "path",
                    required: true,
                    type: "string"
                }
            ],
            requestBody: {
                content: {
                    'multipart/form-data': {
                        type: "object",
                        properties:{
                            "archive": { type: "string", format: "binary"}
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
