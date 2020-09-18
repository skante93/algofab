

const express = require('express'), bodyParser = require('body-parser');

const cors = require('cors');

const app = express();

CONFIG = require('./config');

app.use((req,res, next)=>{ res.locals.t0 = Date.now(); next(); });

app.use(cors());

app.use(async (req, res, next)=>{
	if ( !("x-api-key" in req.headers) ){
		// Anonymous user
		return next();
	}
	var userMan = new CONFIG.mongo.UsersManager(), tknMan = new CONFIG.mongo.TokensManager();


	// console.log("req.headers: ", req.headers);
	if (req.headers['x-api-key'].trim() == CONFIG.settings.app_settings.super_user.auth_token){
		userMan.getOne({uid: "admin"}).then(u=> {
			res.locals.user = u;
			next();
		}).catch(e=>{ next(); });
	}
	else{
		try{
			res.locals.user = await tknMan.apiKey(req.headers['x-api-key'].trim());
			next();
		}
		catch(e){
			CONFIG.utils.rest_respond.err(req, res, { statusCode: 401, error : e });
		}
	}
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//app.use((req,res,next)=>{ console.log("#1 ok"); next(); })

app.use('/users', require('./routes/users'));
//app.use((req,res,next)=>{ console.log("#2 ok"); next(); })
app.use('/resources', require('./routes/resources'));

app.use('/live-data', require('./routes/livedata'));
app.use('/algos', require('./routes/algos'));
//app.use((req,res,next)=>{ console.log("#3 ok"); next(); })
//app.use('/resource-version', require('./routes/resource_versions'));
//app.use((req,res,next)=>{ console.log("#4 ok"); next(); })
app.use('/uploads', require('./routes/uploads'));
//app.use((req,res,next)=>{ console.log("#5 ok"); next(); })
app.use('/api-docs', require('./routes/api-docs'));
//app.use((req,res,next)=>{ console.log("#6 ok"); next(); })

app.use((req, res, next)=>{
	//console.log("Aiie 404");
	CONFIG.utils.rest_respond.err(req, res, { statusCode: 404, error : "not found" });
});

app.use((err, req, res, next)=>{
	CONFIG.utils.rest_respond.err(req, res, { error : err.toString() });
});

app.listen(process.env.PORT || 3000, ()=>{
	console.log("  > Algofab API Server started!");
});

module.exports = app;