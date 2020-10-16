
const { SwaggerRouter, ServerConfig } = require('../routes');

var swaggerDoc = {
    openapi: "3.0.0",
    info: {
        version: "1.0.0",
        title: "A big API project",
        description: "Perfect API project",
        licence: {
            name: "MIT"
        },
    },
    paths: {
        "/home": {
            get: {
                parameters: [
                    {
                        name: "q",
                        in: "query",
                        //required: true,
                        type: "string"
                    }
                ]
            }
        }
    },
    definitions: {
        login: {
            type: "object",
            properties: {
                username : { type: "string", example: "jdoe", default: "jdoe"},
                password : { type: "string", required: true}// example: "jdoe", default: "jdoe", format: "password"}
            }
        },
        account: {
            type: 'object',
            properties: {
                username: {type: "string"},
                photo: {type : "string", format: "binary"}
            }
        }
    }
}

var sub_paths = {
    "/sub-path1": {
        put: {
            authorization_middleware: "sub#auth",
            handler: 'sub#put',
            responses:{},
            requestBody: {
                content: {
                    'application/json': {
                        schema: { $ref : "#/definitions/login"}
                    },
                    'multipart/form-data': {
                        schema: { $ref: '#/definitions/account' }
                    }
                }
            }
        }
    }
}
var paths = {
    '/path1': {
        post: {
            parameters: [ 
                { 
                    name: "q", 
                    in: "query", 
                    //required: true, 
                    schema: { type: "string" } 
                } 
            ],
            handler: 'path1#post',
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            '$ref' : "#/definitions/login"
                        }
                    }
                }
            }
        }
    },
    '/sub': new SwaggerRouter(sub_paths, swaggerDoc)
}

var config = new ServerConfig({
    CORS: {}
})

var router = new SwaggerRouter(paths, swaggerDoc, config);
var app = router.swagger();

app.listen(3000, ()=> { console.log("Listening ..."); } );

console.log(JSON.stringify(router.paths, null, 2));

// const express = require('express'), app = express(), router  = express.Router();

// router['post']('/toto', [
//     (req, res, next)=>{ console.log("cb1"); next() },
//     (req, res, next)=>{ console.log("cb2"); next() },
//     (req, res, next)=>{ console.log("cb3"); next() }
// ]);

// app.use('/rt', router);

// app.listen(3000, ()=> { console.log("Listening ..."); } );