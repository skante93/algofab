


var router = require('express').Router(), rest_response = CONFIG.utils.rest_respond,
	ParamsParser = CONFIG.utils.ParamsParser, resourceMan = new CONFIG.mongo.ResourcesManager();

const filterResourceObject = (u)=>{
	var uf = JSON.parse(JSON.stringify(u));

	return uf;
}

//const resourceMetaParsingDefinition = 

/**
* @swagger
* /resources:
*   get:
*     tags: [ "Resources" ]
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
*           type: array'
*/
router.get('/', ParamsParser({
	fields: { type: "array", items: {type: "string"}, in: "query"}
}), (req, res)=>{
	//console.log("params: ", res.locals.params);

	resourceMan.get(res.locals.params).then(resources=>{
		const responseObj = { body : resources.map(r=>filterResourceObject(r)) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});


/**
* @swagger
* /resources:
*   post:
*     tags: [ "Resources" ]
*     summary: TODO
*     description: TODO
*     requestBody: 
*       description: TODO
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/definitions/resourceMetadata'
*         multipart/form-data:
*           schema:
*             $ref: '#/definitions/resourceMetadata'
*     responses:
*       '200':
*         description: TODO
*         
*/
router.post('/', ParamsParser({
	name : {type: "string", in: "body"},
	version: {type: "string", in: "body"},
	short_intro: {type: "string", in: "body"},
	description : {type: "string", in: "body"},
	docs_type: {type:"string", in:"body"},
	docs_details:{ $or: [{ type:"string", in: "body"}, {type: "file", in: "body"}] },
	logoFile: { type: "file", format: "binary" },
	tags : { 
		type: "array",
		in: "body", 
		items: {
			type: "object", 
			properties: {
				name: {type: "string"},
				value: {type: "string"}
			}
		} 
	},
	asset_type: {type:"string", in:"body", required:true},
	private : { type : "boolean", in:"body", default : false },
	licence: {type:"string", in:"body"},
	agreement: {type:"string", in:"body"}
}), (req, res)=>{
	// console.log("params: ", res.locals.params);
	// console.log("params.tags.length: ", res.locals.params.tags.length);
	if (!res.locals.user){
		//console.log("let's answer with an err");
		return rest_response.err(req, res, {
			statusCode: 401, 
			error: new Error(`UnAuthorized: you need to specifify your <b>valid</b> API key (header "X-API-KEY") to perform this operation.`) 
		});
	}

	res.locals.params.author = res.locals.user._id.toString();

	resourceMan.create(res.locals.params).then(resource=>{
		const responseObj = { body : filterResourceObject(resource) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});

/**
* @swagger
* /resources/{rid}:
*   get:
*     tags: [ "Resources" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: rid
*         in: path
*         type: string
*         required: true
*     responses:
*       '200':
*         description: TODO
*         
*/
router.get('/:rid', ParamsParser({
	rid: {type: "string", in: "path", lowerCase: true}
}), (req, res)=>{
	console.log("params: ", res.locals.params);

	resourceMan.getOne(res.locals.params).then(resource=>{
		const responseObj = { body : filterResourceObject(resource) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});

/**
* @swagger
* /resources/{rid}:
*   delete:
*     tags: [ "Resources" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: rid
*         in: path
*         type: string
*         required: true
*       - name: noDelay
*         in: query
*         type: boolean
*         required: false
*     responses:
*       '200':
*         description: TODO
*         
*/
router.delete('/:rid', ParamsParser({
	rid: {type: "string", in: "path", lowerCase: true},
	noDelay: {type: "boolean", in: "query", default: false}
}), (req, res)=>{

	if (!res.locals.user){
		//console.log("let's answer with an err");
		return rest_response.err(req, res, {
			statusCode: 401, 
			error: new Error(`UnAuthorized: you need to specifify your <b>valid</b> API key (header "X-API-KEY") to perform this operation.`) 
		});
	}

	if (res.locals.user.profile.status == "user" && res.locals.user._id.toString() != req.params.uid){
		return rest_response.err(req, res, {
			statusCode: 401, 
			error: new Error(`UnAuthorized: you cannot delete an account that does not belong to you.`) 
		});
	}


	resourceMan.remove(res.locals.params).then(user=>{
		const responseObj = { body : "Done" };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});

/**
* @swagger
* /resources/{rid}/metadata:
*   put:
*     tags: [ "Resources" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: rid
*         in: path
*         type: string
*         required: true
*     requestBody: 
*       description: TODO
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/definitions/resourceMetadata'
*         multipart/form-data:
*           schema:
*             $ref: '#/definitions/resourceMetadata'
*     responses:
*       '200':
*         description: TODO
*         
*/
router.put('/:rid/metadata', ParamsParser({
	rid : {type: "string", in: "path"},
	name : {type: "string", in: "body"},
	version: {type: "string", in: "body"},
	short_intro: {type: "string", in: "body"},
	description : {type: "string", in: "body"},
	docs_type: {type:"string", in:"body"},
	docs_details:{ $or: [{ type:"string", in: "body"}, {type: "file", in: "body"}] },
	logoFile: { type: "file", format: "binary" },
	tags : { 
		type: "array",
		in: "body", 
		items: {
			type: "object", 
			properties: {
				name: {type: "string"},
				value: {type: "string"}
			}
		} 
	},
	asset_type: {type:"string", in:"body", required:true},
	private : { type : "boolean", in:"body", default : false },
	licence: {type:"string", in:"body"},
	agreement: {type:"string", in:"body"}
}), (req, res)=>{
	// console.log("params: ", res.locals.params);

	if (!res.locals.user){
		//console.log("let's answer with an err");
		return rest_response.err(req, res, {
			statusCode: 401, 
			error: new Error(`UnAuthorized: you need to specifify your <b>valid</b> API key (header "X-API-KEY") to perform this operation.`) 
		});
	}

	// TODO check if user has the right to perform the operation

	// if (res.locals.user.profile.status == "user" && res.locals.user._id.toString() != req.params.uid){
	// 	return rest_response.err(req, res, {
	// 		statusCode: 401, 
	// 		error: new Error(`UnAuthorized: you cannot remove emails from an account that does not belong to you.`) 
	// 	});
	// }

	resourceMan.updateMetadata(res.locals.params).then(resource=>{
		const responseObj = { body : filterResourceObject(resource) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});



/**
* @swagger
* /resources/{rid}/demo:
*   put:
*     tags: [ "Resources" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: rid
*         in: path
*         type: string
*         required: true
*     requestBody: 
*       description: TODO
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               format: 
*                 type: string
*               manifest:
*                 type: object
*     responses:
*       '200':
*         description: TODO
*         
*/
router.put('/:rid/demo', ParamsParser({
	rid : {type: "string", in: "path"},
	format : {type: "string", in: "body"},
	manifest: { type: "object", in: "body" }
}), (req, res)=>{
	console.log("params: ", res.locals.params);

	if (!res.locals.user){
		//console.log("let's answer with an err");
		return rest_response.err(req, res, {
			statusCode: 401, 
			error: new Error(`UnAuthorized: you need to specifify your <b>valid</b> API key (header "X-API-KEY") to perform this operation.`) 
		});
	}

	// TODO check if user has the right to perform the operation

	// if (res.locals.user.profile.status == "user" && res.locals.user._id.toString() != req.params.uid){
	// 	return rest_response.err(req, res, {
	// 		statusCode: 401, 
	// 		error: new Error(`UnAuthorized: you cannot remove emails from an account that does not belong to you.`) 
	// 	});
	// }

	// resourceMan.updateMetadata(res.locals.params).then(resource=>{
	// 	const responseObj = { body : filterResourceObject(resource) };
	// 	rest_response.out(req, res, responseObj);
	// }).catch(e=>{
	// 	//
	// 	console.log(e);

	// 	rest_response.err(req, res, { error: e.toString() });
	// });
});


/**
* @swagger
* /resources/{rid}/tags:
*   post:
*     tags: [ "Resources" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: rid
*         in: path
*         type: string
*         required: true
*     requestBody:
*       description: TODO
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               tags:
*                 type: array
*                 items:
*                   $ref: '#/definitions/tags'
*     responses:
*       '200':
*         description: TODO
*         
*/
router.post('/:rid/tags', ParamsParser({
	rid: {type: "string", in: "path"},
	tags : { 
		type: "array",
		in: "body", 
		items: {
			type: "object", 
			properties: {
				name: {type: "string"},
				value: {type: "string"}
			}
		} 
	}
}), (req, res)=>{
	
	console.log("params: ", res.locals.params);
	if (!res.locals.user){
		//console.log("let's answer with an err");
		return rest_response.err(req, res, {
			statusCode: 401, 
			error: new Error(`UnAuthorized: you need to specifify your <b>valid</b> API key (header "X-API-KEY") to perform this operation.`) 
		});
	}

	// TODO : make sure user has the rights to add tags for this resource

	// if (res.locals.user.profile.status == "user" && res.locals.user._id.toString() != req.params.uid){
	// 	return rest_response.err(req, res, {
	// 		statusCode: 401, 
	// 		error: new Error(`UnAuthorized: you cannot add emails to an account that does not belong to you.`) 
	// 	});
	// }

	resourceMan.addTag(res.locals.params).then(user=>{
		//console.log("photo : ", photo.toString("base64"), "(", typeof photo, ")")
		const responseObj = { body : filterResourceObject(user) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});

/**
* @swagger
* /resources/{rid}/tags:
*   delete:
*     tags: [ "Resources" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: rid
*         in: path
*         type: string
*         required: true
*       - name: id
*         in: query
*         type: string
*         required: true
*     responses:
*       '200':
*         description: TODO
*         
*/
router.delete('/:rid/tags', ParamsParser({
	rid: {type: "string", in: "path"},
	id: {type: "string", in: "query"}
}), (req, res)=>{
	if (!res.locals.user){
		//console.log("let's answer with an err");
		return rest_response.err(req, res, {
			statusCode: 401, 
			error: new Error(`UnAuthorized: you need to specifify your <b>valid</b> API key (header "X-API-KEY") to perform this operation.`) 
		});
	}

	// TODO : make sure user has the rights to remove tags from this resource

	// if (res.locals.user.profile.status == "user" && res.locals.user._id.toString() != req.params.uid){
	// 	return rest_response.err(req, res, {
	// 		statusCode: 401, 
	// 		error: new Error(`UnAuthorized: you cannot add emails to an account that does not belong to you.`) 
	// 	});
	// }

	resourceMan.removeTag(res.locals.params).then(user=>{
		//console.log("photo : ", photo.toString("base64"), "(", typeof photo, ")")
		const responseObj = { body : filterResourceObject(user) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});

router.put('/:rid', (req, res)=>{

});

router.delete('/:rid', (req, res)=>{});

module.exports = router;