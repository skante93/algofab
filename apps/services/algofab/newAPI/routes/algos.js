
var router = require('express').Router(), rest_response = CONFIG.utils.rest_respond,
ParamsParser = CONFIG.utils.ParamsParser, algoMan = new CONFIG.mongo.AlgosManager();

const filterAlgoObject = (u)=>{
    //if (!u) return u;

    var uf = JSON.parse(JSON.stringify(u));

    delete uf.spec;

    return uf;
}


/**
* @swagger
* /algos/templates:
*   get:
*     tags: [ "Algos" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: fields
*         in: query
*         required: false
*         schema:
*           type: array
*           items: 
*             type: string
*     responses:
*       '200':
*         description: TODO
*         schema:
*           type: array
*           items:
*             schema:
*               $ref: '#/definitions/users'
*/
router.get('/templates', ParamsParser({
    fields: { type: "array", items: {type: "string"}, in: "query"}
}), (req, res)=>{
    console.log("res.locals.params : ", res.locals.params);
    
    algoMan.get("template", res.locals.params).then(algos=>{
		const responseObj = { body : algos.map(a => filterAlgoObject(a)) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);
		rest_response.err(req, res, { error: e.toString() });
	});
});

/**
* @swagger
* /algos/templates:
*   post:
*     tags: [ "Algos" ]
*     summary: TODO
*     description: TODO
*     requestBody:
*       description: TODO
*       content: 
*         application/json:
*           schema:
*             $ref: '#/definitions/algoTemplate'
*     responses:
*       '200':
*         description: TODO
*/
router.post('/templates', ParamsParser({
    //fields: { type: "array", items: {type: "string"}, in: "query"}
    name: { type: "string", in : "body", required: true, },
	description: { type: "string", in : "body", required: true },
	settings: { 
        type: "array",
        in : "body",
        items: {
            type: "object",
            properties: {
                name: {type:"string", required: true},
                type: {type:"string", required: true},
                description: {type:"string"},
                required: {type: "boolean", default: false},
                default: { type: "string" }
            }
        }
    },
    container: {
        type: "object",
        required: true,
        in: "body",
        properties: {
            image: {type: "string", required: true},
            ports:{
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        name: { type: "string", required: true },
                        containerPort: { type: "integer", required: true },
                        description: {type: "string" }
                    }
                }
            }
        }
    },
	input: { type: "object", in : "body" },
	output: { type: "object", in : "body" },
	liveDataMountPoints: {
        type: "array",
        in: "body",
        items: {
            type: "object",
            properties: {
                name: {type:"string", required: true, lowerCase: true},
                description: {type:"string"},
                mountPoint: {type:"string", required: true}
            }
        }
    },
}), (req, res)=>{
   
    //console.log("res.locals.params : ", res.locals.params);

    if (!res.locals.user){
		//console.log("let's answer with an err");
		return rest_response.err(req, res, {
			statusCode: 401, 
			error: new Error(`UnAuthorized: you need to specifify your <b>valid</b> API key (header "X-API-KEY") to perform this operation.`) 
		});
    }
    
    algoMan.createTemplate(res.locals.params, res.locals.user).then(algo=>{
		console.log("algo: ", algo);
		const responseObj = { body : filterAlgoObject(algo), statusCode: 201 };
        rest_response.out(req, res, responseObj);
        
	}).catch(e=>{
		//
		console.log(e);
		rest_response.err(req, res, { error: e.toString() });
	});
});


/**
* @swagger
* /algos/templates/{templateID}:
*   get:
*     tags: [ "Algos" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: templateID
*         in: path
*         required: true
*         type: string
*     responses:
*       '200':
*         description: TODO
*         schema:
*           type: array
*           items:
*             schema:
*               $ref: '#/definitions/users'
*/
router.get('/templates', ParamsParser({
    templateID: {type: "string", in: "path"},
}), (req, res)=>{
    console.log("res.locals.params : ", res.locals.params);
    
    res.locals.params.id = params.templateID;

    algoMan.getOne("template", res.locals.params).then(algo=>{
		const responseObj = { body : filterAlgoObject(algo) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);
		rest_response.err(req, res, { error: e.toString() });
	});
});


/**
* @swagger
* /algos/templates/{templateID}:
*   delete:
*     tags: [ "Algos" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: templateID
*         in: path
*         required: true
*         type: string
*       - name: instanceID
*         in: path
*         required: true
*         type: string
*     responses:
*       '200':
*         description: TODO
*/
router.delete('/templates/:templateID', ParamsParser({
    templateID: {type: "string", in: "path"}
}), (req, res)=>{
   
    //console.log("res.locals.params : ", res.locals.params);

    if (!res.locals.user){
		//console.log("let's answer with an err");
		return rest_response.err(req, res, {
			statusCode: 401, 
			error: new Error(`UnAuthorized: you need to specifify your <b>valid</b> API key (header "X-API-KEY") to perform this operation.`) 
		});
    }
    
    algoMan.removeTemplate(res.locals.params, res.locals.user).then(()=>{
        
        const responseObj = { body : "Done!" };
        rest_response.out(req, res, responseObj);
        
	}).catch(e=>{
		//
		console.log(e);
		rest_response.err(req, res, { error: e.toString() });
	});
});


/**
* @swagger
* /algos/templates/{templateID}/instances:
*   get:
*     tags: [ "Algos" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: templateID
*         in: path
*         required: true
*         type: string
*       - name: fields
*         in: query
*         required: false
*         schema:
*           type: array
*           items: 
*             type: string
*     responses:
*       '200':
*         description: TODO
*         schema:
*           type: array
*           items:
*             schema:
*               $ref: '#/definitions/users'
*/
router.get('/templates/:templateID/instances', ParamsParser({
    fields: { type: "array", items: {type: "string"}, in: "query"},
    templateID: {type: "string", in: "path"},
}), (req, res)=>{
    console.log("res.locals.params : ", res.locals.params);
    
    algoMan.getTemplateInstances(res.locals.params).then(algos=>{
		const responseObj = { body : algos.map(a => filterAlgoObject(a)) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);
		rest_response.err(req, res, { error: e.toString() });
	});
});

/**
* @swagger
* /algos/instances:
*   get:
*     tags: [ "Algos" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: fields
*         in: query
*         required: false
*         schema:
*           type: array
*           items: 
*             type: string
*     responses:
*       '200':
*         description: TODO
*         schema:
*           type: array
*           items:
*             schema:
*               $ref: '#/definitions/users'
*/
router.get('/instances', ParamsParser({
    fields: { type: "array", items: {type: "string"}, in: "query"}
}), (req, res)=>{
    console.log("res.locals.params : ", res.locals.params);
    
    algoMan.get("instance", res.locals.params).then(algos=>{
		const responseObj = { body : algos.map(a => filterAlgoObject(a)) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);
		rest_response.err(req, res, { error: e.toString() });
	});
});

/**
* @swagger
* /algos/instances:
*   post:
*     tags: [ "Algos" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: templateID
*         in: path
*         required: true
*         type: string
*     requestBody:
*       description: TODO
*       content: 
*         application/json:
*           schema:
*             $ref: '#/definitions/algoInstance'
*     responses:
*       '200':
*         description: TODO
*/
router.post('/instances', ParamsParser({
    //fields: { type: "array", items: {type: "string"}, in: "query"}

    templateID: {type: "string", in: "body"},
    name: {type: "string", required: true, in: "body"},
    settings: { 
        type: "array",
        in : "body",
        items: {
            type: "object",
            properties: {
                name: {type:"string", required: true},
                value: {type:"string", required: true}
            }
        }
    },
    input: { type: "object", in : "body" },
	output: { type: "object", in : "body" },
	liveDataMountPoints: {
        type: "array",
        in: "body",
        items: {
            type: "object",
            properties: {
                name: {type:"string", required: true, lowerCase: true},
                liveDataID: {type:"string", required: true}
            }
        }
    },
}), (req, res)=>{
   
    //console.log("res.locals.params : ", res.locals.params);

    if (!res.locals.user){
		//console.log("let's answer with an err");
		return rest_response.err(req, res, {
			statusCode: 401, 
			error: new Error(`UnAuthorized: you need to specifify your <b>valid</b> API key (header "X-API-KEY") to perform this operation.`) 
		});
    }
    
    algoMan.createInstance(res.locals.params, res.locals.user).then(algo=>{
		console.log("algo: ", algo);
		const responseObj = { body : filterAlgoObject(algo), statusCode: 201 };
        rest_response.out(req, res, responseObj);
        
	}).catch(e=>{
		//
		console.log(e);
		rest_response.err(req, res, { error: e.toString() });
	});
});


/**
* @swagger
* /algos/instances/{instanceID}:
*   get:
*     tags: [ "Algos" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: instanceID
*         in: path
*         required: true
*         type: string
*     responses:
*       '200':
*         description: TODO
*/
router.get('/instances/:instanceID', ParamsParser({
    instanceID: {type: "string", in: "path"},
}), (req, res)=>{
   
    //console.log("res.locals.params : ", res.locals.params);

    if (!res.locals.user){
		//console.log("let's answer with an err");
		return rest_response.err(req, res, {
			statusCode: 401, 
			error: new Error(`UnAuthorized: you need to specifify your <b>valid</b> API key (header "X-API-KEY") to perform this operation.`) 
		});
    }
    
    res.locals.params.id = params.instanceID;

    algoMan.getOne("instance", res.locals.params).then(()=>{
        
        const responseObj = { body : "Done!" };
        rest_response.out(req, res, responseObj);
        
	}).catch(e=>{
		//
		console.log(e);
		rest_response.err(req, res, { error: e.toString() });
	});
});

/**
* @swagger
* /algos/instances/{instanceID}:
*   delete:
*     tags: [ "Algos" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: instanceID
*         in: path
*         required: true
*         type: string
*     responses:
*       '200':
*         description: TODO
*/
router.delete('/instances/:instanceID', ParamsParser({
    instanceID: {type: "string", in: "path"},
}), (req, res)=>{
   
    //console.log("res.locals.params : ", res.locals.params);

    if (!res.locals.user){
		//console.log("let's answer with an err");
		return rest_response.err(req, res, {
			statusCode: 401, 
			error: new Error(`UnAuthorized: you need to specifify your <b>valid</b> API key (header "X-API-KEY") to perform this operation.`) 
		});
    }
    
    algoMan.removeInstance(res.locals.params, res.locals.user).then(()=>{
        
        const responseObj = { body : "Done!" };
        rest_response.out(req, res, responseObj);
        
	}).catch(e=>{
		//
		console.log(e);
		rest_response.err(req, res, { error: e.toString() });
	});
});

module.exports = router;