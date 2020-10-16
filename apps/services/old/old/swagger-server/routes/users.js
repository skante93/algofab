

const {settings, db } = require('../config');

const userManager = new db.UsersManager();

const filteruserAccount = (u)=>{
    //console.log("############# filteruserAccount called !!! #######");
    //console.log("before : ", u);
    var user = JSON.parse(JSON.stringify(u));

    if (user.profile.photo && user.profile.photo.data){
        console.log("Changing photo from binary to base64 ...");
        if (user.profile.photo.data instanceof Buffer){
            //console.log("... Already a buffer");
            var base64 = user.profile.photo.data.toString('base64')
            user.profile.photo.data = base64;
            //console.log("hop thats done!!", user.profile.photo.data);
        }
        else if (user.profile.photo.data && user.profile.photo.data.type === 'Buffer'){
            //console.log("... Only a json representation of a buffer");
            user.profile.photo.data = Buffer.from(user.profile.photo.data.data).toString('base64');
        }
    }
    //console.log("results : ", user);
    return user;
}

var handlers = {
    get_users : async (req, res, next)=>{
        console.log('## GET USERS : ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await userManager.getAll(res.locals.params);
        //console.log('r : ', r);
        r.reply(req, res);
    },
    get_one_user: async (req, res, next) =>{
        console.log('## GET ONE USER : ', res.locals.params);
        //res.status(405).json({body: "Not yet implemented!!"})
        var r = await userManager.getOne(res.locals.params);
        //console.log('r : ', r);
        r.reply(req, res);
    },
    create_user: async(req, res, next)=>{
        //console.log('## CREATE USER : ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await userManager.create(res.locals.params);
        //console.log('r : ', r);
        r.reply(req, res);
    },
    update_user_profile: async(req, res, next)=>{
        console.log('## UPDATE USER Profile: ', res.locals.params);
        // res.status(405).json({body: "Not yet implemented!!"})
        var r = await userManager.updateProfile(res.locals.params, res.locals.user);
        console.log('r : ', r);
        r.reply(req, res, filteruserAccount);
    },
    remove_user: async(req, res, next)=>{
        console.log('## REMOVE USER : ', res.locals.params);
        //res.status(405).json({body: "Not yet implemented!!"})
        var r = await userManager.remove(res.locals.params, res.locals.user);
        //console.log('r : ', r);
        r.reply(req, res);
    },
    login_user : async (req, res, next)=>{
        console.log("## LOGIN USER : ", res.locals.params);
        var r = await userManager.loginUser(res.locals.params, res.locals.user);
        //console.log('r : ', r);
        r.reply(req, res);
    }
}

var definition = {
    '/': {
        get: {
            
            handler: "routes/users#handlers#get_users",
            tags: [ "users" ],
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
            handler: "routes/users#handlers#create_user",
            tags: [ "users" ],
            requestBody: {
                content: {
                    'application/x-www-form-urlencoded': {
                        schema: {
                            type: 'object',
                            properties: {
                                username: {type: "string", required: true},
                                email: {type: "string", required: true}                                
                            } 
                        }
                    },
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                username: {type: "string", required: true},
                                email: {type: "string", required: true}                                
                            } 
                        }
                    }
                }
            }
        }
    },
    '/{userID}': {
        get: {
            handler: "routes/users#handlers#get_one_user",
            tags: [ "users" ],
            parameters: [
                {
                    name: "userID",
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
            handler: "routes/users#handlers#remove_user",
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
            tags: [ "users" ],
            parameters: [
                {
                    name: "userID",
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
    '/{userID}/profile': {
        put: {
            handler: "routes/users#handlers#update_user_profile",
            tags: [ "users" ],
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
                    name: "userID",
                    in: "path",
                    required: true,
                    type: "string"
                }
            ],
            requestBody: {
                content: {
                    'multipart/form-data': {
                        schema: { $ref : "#/definitions/accountProfile" }
                    }
                }
            }
        }
    },
    '/login': {
        post: {
            tags: [ "users" ],
            handler: "routes/users#handlers#login_user",
            requestBody: {
                content:{
                    'application/x-www-form-urlencoded': {
                        schema : {
                            $ref: "#/definitions/login"
                        }
                    },
                    'application/json':{
                        schema : {
                            $ref: "#/definitions/login"
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