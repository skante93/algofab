var router = require('express').Router(), rest_response = CONFIG.utils.rest_respond,
	ParamsParser = CONFIG.utils.ParamsParser, liveDataMan = new CONFIG.mongo.LiveDataManager();

const filterLiveDataObject = (u)=>{
	var uf = JSON.parse(JSON.stringify(u));
	return uf;
}


/**
* @swagger
* /live-data/{ldid}:
*   delete:
*     tags: [ "LiveData" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: ldid
*         in: path
*         type: string
*         required: true
*     responses:
*       '200':
*         description: TODO
*         
*/
router.delete('/:ldid', ParamsParser({
	ldid: {type: "string", in: "path", lowerCase: true}
}), (req, res)=>{

	if (!res.locals.user){
		//console.log("let's answer with an err");
		return rest_response.err(req, res, {
			statusCode: 401, 
			error: new Error(`UnAuthorized: you need to specifify your <b>valid</b> API key (header "X-API-KEY") to perform this operation.`) 
		});
	}

	res.locals.params.byUser = res.locals.user;

	//console.log("params: ", res.locals.params);
	liveDataMan.delete(res.locals.params).then(()=>{
		//console.log("user: ", user);
		const responseObj = { body : "Done!", statusCode: 200 };

		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});


/**
* @swagger
* /live-data:
*   get:
*     tags: [ "LiveData" ]
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
*               $ref: '#/definitions/liveData'
*/
router.get('/', ParamsParser({
	fields: { type: "array", items: {type: "string"}, in: "query"}
}), (req, res)=>{
	//console.log("params: ", res.locals.params);
	liveDataMan.get(res.locals.params).then(lds=>{
		const responseObj = { body : lds.map(ld => filterLiveDataObject(ld)) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});

/**
* @swagger
* /live-data:
*   post:
*     tags: [ "LiveData" ]
*     summary: TODO
*     description: TODO
*     requestBody: 
*       description: TODO
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/definitions/liveData'
*     responses:
*       '200':
*         description: TODO
*         
*/
router.post('/', ParamsParser({
	apiVersion: {type: "string", in: "body", default: "v1"},
	name: {type: "string", in: "body"},
	type: {type: "string", in: "body", default: "empty"},
	description: { type: "string", in: "body"},
	sshKeys: { type: "array",in: "body", items: { type: "string" } },
	// spec: {
	// 	type: "object",
	// 	in: "body"
	// }
}), (req, res)=>{

	if (!res.locals.user){
		//console.log("let's answer with an err");
		return rest_response.err(req, res, {
			statusCode: 401, 
			error: new Error(`UnAuthorized: you need to specifify your <b>valid</b> API key (header "X-API-KEY") to perform this operation.`) 
		});
	}

	res.locals.params.author = res.locals.user;

	//console.log("params: ", res.locals.params);
	liveDataMan.create(res.locals.params).then(ld=>{
		//console.log("user: ", user);
		const responseObj = { body : filterLiveDataObject(ld), statusCode: 201 };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});






module.exports = router;