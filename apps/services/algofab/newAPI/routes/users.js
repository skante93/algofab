


var router = require('express').Router(), rest_response = CONFIG.utils.rest_respond,
	ParamsParser = CONFIG.utils.ParamsParser, userMan = new CONFIG.mongo.UsersManager();

const filterUserObject = (u)=>{
	var uf = JSON.parse(JSON.stringify(u));

	delete uf.passwords;
	if ('photo' in uf.profile && uf.profile.photo && "content_type" in uf.profile.photo && uf.profile.photo.content_type){
		uf.profile.photo.buffer = Buffer.from(uf.profile.photo.buffer.data).toString('base64');
	}
	return uf;
}

/**
* @swagger
* /users:
*   get:
*     tags: [ "Users" ]
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
router.get('/', ParamsParser({
	fields: { type: "array", items: {type: "string"}, in: "query"}
}), (req, res)=>{
	//console.log("params: ", res.locals.params);
	userMan.get(res.locals.params).then(users=>{
		const responseObj = { body : users.map(u => filterUserObject(u)) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});

/**
* @swagger
* /users:
*   post:
*     tags: [ "Users" ]
*     summary: TODO
*     description: TODO
*     requestBody: 
*       description: TODO
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/definitions/userProfile'
*         multipart/form-data:
*           schema:
*             $ref: '#/definitions/userProfile'
*     responses:
*       '200':
*         description: TODO
*         
*/
router.post('/', ParamsParser({
	email: {type: "string", in: "body", lowerCase: true},
	username: {type: "string", in: "body"},
	firstname: {type: "string", in: "body"},
	lastname: {type: "string", in: "body"},
	status: {type: "string", in: "body"},
	photo: {type: "file", in: "body"}
}), (req, res)=>{

	//console.log("res.locals :", res.locals);
	userMan.create(res.locals.params).then(user=>{
		//console.log("user: ", user);
		const responseObj = { body : filterUserObject(user), statusCode: 201 };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});


/**
* @swagger
* /users/{uid}:
*   get:
*     tags: [ "Users" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: uid
*         in: path
*         type: string
*         example: jdoe
*         required: true
*     responses:
*       '200':
*         description: TODO
*         
*/
router.get('/:uid', ParamsParser({
	uid: {type: "string", in: "path", lowerCase: true}
}), (req, res)=>{
	//console.log("res.locals.params: ", res.locals.params)
	userMan.getOne(res.locals.params).then(user=>{
		const responseObj = { body : filterUserObject(user) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
	
});


/**
* @swagger
* /users/{uid}:
*   delete:
*     tags: [ "Users" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: uid
*         in: path
*         type: string
*         example: jdoe
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
router.delete('/:uid', ParamsParser({
	uid: {type: "string", in: "path", lowerCase: true},
	noDelay: {type: "boolean", in: "query", default: false}
}), (req, res)=>{

	//console.log("params: ", res.locals.params);
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

	userMan.remove(res.locals.params).then(user=>{
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
* /users/{uid}/login:
*   post:
*     tags: [ "Users" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: uid
*         in: path
*         type: string
*         example: jdoe
*         required: true
*     requestBody:
*       description: TODO
*       content:
*         application/x-www-form-urlencoded:
*           schema:
*             type: object
*             properties: 
*               password: 
*                 type: string
*                 required: true 
*               expiredPasswordOK:
*                 type: boolean    
*     responses:
*       '200':
*         description: TODO
*         
*/
router.post('/:uid/login', ParamsParser({
	uid: {type: "string", in: "path"},
	password: {type: "string", in: "body", required: true},
	expiredPasswordOK: {type:"boolean", in: "body"}
}), (req, res)=>{
	//console.log("params: ", res.locals);

	userMan.login(res.locals.params).then(user=>{
		//console.log("photo : ", photo.toString("base64"), "(", typeof photo, ")")
		const responseObj = ("warning" in user)? 
			{ statusCode: 299, warning: user.warning, body : filterUserObject(user.user)}
				: { body : filterUserObject(user) };
		
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});


/**
* @swagger
* /users/{uid}/photo:
*   get:
*     tags: [ "Users" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: uid
*         in: path
*         type: string
*         example: jdoe
*         required: true
*     responses:
*       '200':
*         description: TODO
*         
*/
router.get('/:uid/photo', ParamsParser({
	uid: {type: "string", in: "path"}
}), (req, res)=>{

	userMan.getProfilePhoto(res.locals.params).then(photo=>{
		//console.log("photo : ", photo.toString("base64"), "(", typeof photo, ")")
		const responseObj = { body : photo.buffer, headers:{"Content-Type": photo.content_type }};
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});



/**
* @swagger
* /users/{uid}/email:
*   post:
*     tags: [ "Users" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: uid
*         in: path
*         type: string
*         example: jdoe
*         required: true
*       - name: email
*         in: query
*         type: string
*         required: true
*     responses:
*       '200':
*         description: TODO
*         
*/
router.post('/:uid/email', ParamsParser({
	uid: {type: "string", in: "path"},
	email: {type: "string", in: "query", lowerCase: true}
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
			error: new Error(`UnAuthorized: you cannot add emails to an account that does not belong to you.`) 
		});
	}

	userMan.addEmail(res.locals.params).then(user=>{
		//console.log("photo : ", photo.toString("base64"), "(", typeof photo, ")")
		const responseObj = { body : filterUserObject(user) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});

/**
* @swagger
* /users/{uid}/email:
*   delete:
*     tags: [ "Users" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: uid
*         in: path
*         type: string
*         example: jdoe
*         required: true
*       - name: email
*         in: query
*         type: string
*         required: true
*     responses:
*       '200':
*         description: TODO
*         
*/
router.delete('/:uid/email', ParamsParser({
	uid: {type: "string", in: "path"},
	email: {type: "string", in: "query", lowerCase: true}
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
			error: new Error(`UnAuthorized: you cannot remove emails from an account that does not belong to you.`) 
		});
	}

	userMan.removeEmail(res.locals.params).then(user=>{
		//console.log("photo : ", photo.toString("base64"), "(", typeof photo, ")")
		const responseObj = { body : filterUserObject(user) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});

/**
* @swagger
* /users/{uid}/verify-email:
*   get:
*     tags: [ "Users" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: uid
*         in: path
*         type: string
*         example: jdoe
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
router.get('/:uid/verify-email', ParamsParser({
	uid: {type: "string", in: "path"},
	id: {type: "string", in: "query"}
}), (req, res)=>{

	userMan.verifyEmail(res.locals.params).then(user=>{
		//console.log("photo : ", photo.toString("base64"), "(", typeof photo, ")")
		const responseObj = { body : filterUserObject(user) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});

/**
* @swagger
* /users/{uid}/profile:
*   put:
*     tags: [ "Users" ]
*     summary: TODO
*     description: TODO
*     parameters:
*       - name: uid
*         in: path
*         type: string
*         example: jdoe
*         required: true
*     requestBody: 
*       description: TODO
*       content:
*         application/json:
*           schema:
*             $ref: '#/definitions/userProfile'
*         multipart/form-data:
*           schema:
*             $ref: '#/definitions/userProfile'
*     responses:
*       '200':
*         description: TODO
*         
*/
router.put('/:uid/profile', ParamsParser({
	uid: {type: "string", in: "path"},
	email: {type: "string", in: "body", lowerCase: true},
	username: {type: "string", in: "body"},
	firstname: {type: "string", in: "body"},
	lastname: {type: "string", in: "body"},
	status: {type: "string", in: "body"},
	photo: {type: "file", in: "body", extensions: ["jpg", "jpeg", "png"]}
}), (req, res)=>{
	
	//console.log("res.locals.params: ", res.locals.params);
	userMan.updateProfile(res.locals.params).then(u=>{
		const responseObj = { body : filterUserObject(u) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});


/**
* @swagger
* /users/{uid}/password:
*   put:
*     tags: [ "Users" ]
*     summary: TODO
*     description: TODO
*     consumes: [ "application/ x-www-form-urlencoded" ]
*     parameters:
*       - name: uid
*         in: path
*         type: string
*         example: jdoe
*         required: true
*     requestBody: 
*       description: TODO
*       content:
*         application/json:
*           schema:
*             type: object
*             properties: 
*               password: 
*                 type: string
*     responses:
*       '200':
*         description: TODO
*         
*/
router.put('/:uid/password', ParamsParser({
	uid: {type: "string", in: "path"},
	password: {type: "string", in: "body"}
}), (req, res)=>{
	console.log("res.locals.params: ", res.locals.params);
	userMan.updatePassword(res.locals.params).then(user=>{
		const responseObj = { body : filterUserObject(user) };
		rest_response.out(req, res, responseObj);
	}).catch(e=>{
		//
		console.log(e);

		rest_response.err(req, res, { error: e.toString() });
	});
});


/**
* @swagger
* /users/{uid}/freeze:
*   put:
*     tags: [ "Users" ]
*     summary: TODO
*     description: TODO
*     requestBody: 
*       application/json:
*         #
*       multipart/form-data:
*         schema:
*           $ref: '#/definitions/userProfile'
*     responses:
*       '200':
*         description: TODO
*         
*/
router.put('/:uid/freeze', (req, res)=>{});


module.exports = router;
