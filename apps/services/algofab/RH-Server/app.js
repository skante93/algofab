


var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var request = require('request'), restler = require('restler'), multiparty = require('multiparty');
var fs = require('fs'), util = require('util'), https = require('https');

var CONFIG = require('./config/');

var m_User = mongo.model('User'), 
        m_AlgosMeta = mongo.model('AlgosMeta'), 
            m_Algos = mongo.model('Algos'), 
                m_Subscriptions = mongo.model('Subscriptions'),
                    m_Token = mongo.model('Token'), 
                        m_Context = mongo.model('Context');
                            //m_Requests = mongo.model('Requests');


var bCrypt = require('bcrypt-nodejs');
//var CONFIG = CONFIG.params;
var debug = require('debug')('my-application');
var series = require('async-series');
var fs = require('fs'), util = require('util');
var jwt = require('jwt-simple');

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());

app.use(logger('dev'));

app.use(bodyParser.json({ 
    verify : function(req, res, buff, encoding){

        res.locals.buff = buff;
        console.log("---------------------------------------------------");
        console.log("RAW request json : "+buff);
        console.log("---------------------------------------------------");
    }
}));

app.use(bodyParser.urlencoded({ 
    verify : function(req, res, buff, encoding){

        res.locals.buff = buff;
        console.log("---------------------------------------------------");
        console.log("RAW request urlencoded : "+buff);
        console.log("---------------------------------------------------");
    }
}));

app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){

    res.json({status : "succes", state : "RH up and running"});
});

var err_cb = function(rqst, err){
    rqst.update({ $set : {
        response : { 
            status : 500, 
            "content-type" : "",
            body : err.toString() 
        },
        duration : 0,
        beginningDate : 0,
        is_responding : false
    }}).exec(function(err2){ console.log( ((err2)? "DB error : "+err2 : "Response saved")); });
}


/*
app.post('/_result', function(req, res){
    if(!req.body.id){
        return err_cb(res.locals.algo_response, "field id is required.");
        //return res.status(500).json({status : "failure", message : "field id is required."});
    }

    m_Requests.findById(req.body.id).exec(function(err, r){
        if(err){
            console.log("DB err : "+err);
            
            //return err_cb(res.locals.algo_response, err);
            return res.status(500).json({status : "failure", message : "DB error"});
        }
        if(!r){
            //return err_cb(res.locals.algo_response, "Could not find the request. Is the provided id correct?");
            
            return res.status(500).json({status : "failure", message : "Could not find the request. Is the provided id correct?"});
        }
        if(r.is_responding == true){
            //return err_cb(res.locals.algo_response, "The response didn't come back yet");
            return res.json({status : "ongoing", message : "The response didn't come back yet"});
        }

        res.json({ status : "success", response : r.response , duration : r.duration});
    });
});
*/
/*
app.use(function(req, res, next){
    new m_Requests({}).save(function(err, result){
        //
        if(err){
            console.log("DB Error : "+err);
            return res.status(500).json({ status : "failure", message : "DB Error" });
        }
        //console.log("beginningDate : "+result.beginningDate);
        
        //console.log("Result : "+ util.inspect(result));
        res.json({ status : "succes", message : "To check if the response arrived, make a POST request on url /_result with body \"id\" : <field id>", id : result._id });
        
        res.locals.algo_response = result;        
        next();
    });
});
*/

app.use(function(req, res, next){
    //
    var tkn = req.headers.authorization;
    if( !(tkn && tkn.startsWith("Bearer ")) ){
        //return err_cb(res.locals.algo_response, 'There needs to be a token a the format "Authorization: Bearer <Token>"');
        return res.status(400).json({status : "failure", message : 'There needs to be a token a the format "Authorization: Bearer <Token>"'});
    }
    
    tkn = tkn.replace("Bearer ", '');

    console.log("TKN : "+tkn);
    m_Token.findOne({ token : tkn }).populate("bearer").exec(function(err, result){
        if(err){
            console.log("DB error 0 : "+err);
            
            //return err_cb(res.locals.algo_response, "The response didn't come back yet");
            return res.status(500).json({ status : "failure"})
        }
        //console.log(util.inspect(result));
        if(!result){
            console.log("result : "+result);
            //return err_cb(res.locals.algo_response, "the token could not be found");
            return res.status(400).json({ status : "failure", message : "the token could not be found"})
        }
        res.locals.bearer = result.bearer;
        var decoded = jwt.decode(tkn, "AF Secret");
        res.locals.context_id = decoded.iss;
        next();
    });
});

app.use('/:algoname', function(req, res, next){
    //console.log("MIDDLEWARE 4");
    
    var populateParams, versionSpecified = false;
    var version = undefined;
    if(new RegExp("/"+req.params.algoname+"/[0-9]+\.[0-9]+\.[0-9]+($|\/)").test(req.originalUrl)){
        version = req.originalUrl.split('/')[2];
    }
    if(version && /^[0-9]+\.[0-9]+\.[0-9]+$/.test(version)){
        populateParams = {
            path : "versions",
            match : {
                version : version,
                hidden : false
            }
        };
        versionSpecified = true;
    }
    else{
        populateParams = {
            path : 'versions',
            match : {
                hidden : false
            },
            options : { sort : {version : -1 }, limit : 1 },
            populate : {
                path : "meta"
            }
        };
    }
    //console.log("found version : "+version)
    m_AlgosMeta.findOne({title : req.params.algoname }).populate(["author", populateParams]).exec(function(err, algo){
        //console.log('+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
        //console.log(err || 'Algo : '+util.inspect(algo));
        //console.log('+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
        
        if(err){
            console.log("DB error : "+err);
            //return err_cb(res.locals.algo_response, "DB error 1 : "+err);
            return res.status(500).json({ status : "failure", message : "DB error 1 : "+err });
        }
        if(!algo){
            //return err_cb(res.locals.algo_response, 'Algo "'+req.params.algoname+'" does not exist. Are you sure you typped its name correctly?');
            return res.status(500).json({ status : "failure", message : 'Algo "'+req.params.algoname+'" does not exist. Are you sure you typped its name correctly?' });
        }
        //console.log("algo.versions.length : "+algo.versions.length);
        if(algo.versions.length == 0){
            if(versionSpecified){
                return err_cb(res.locals.algo_response, 'There is no version "'+version+'" available (not any visible anyway) for Algorithm '+req.params.algoname);
                //return res.status(500).json({ status : "failure", message : 'There is no version "'+version+'" available (not any visible anyway) for Algorithm '+req.params.algoname });
            }
            else{
                //return err_cb(res.locals.algo_response, 'There is no version available (not any visible anyway) for Algorithm '+req.params.algoname);
                return res.status(500).json({ status : "failure", message : 'There is no version available (not any visible anyway) for Algorithm '+req.params.algoname });
            }
        }


        res.locals.algo = algo;
        
        //console.log('res.locals.algo : '+util.inspect(res.locals.algo));
        

        next();
    });
    
});

/*
// Check subcription
app.use(function(res, res, next){
    // Request coming from the author of the algo
    if (res.locals.algo.author.username == res.locals.bearer.username){
        return next();
    }

    // Check Subcription
    m_Subscriptions.find({ user : res.locals.bearer._id }).exec(function(err, subs){
        //
        if(err){
            console.log("DB error : "+err);
            //return err_cb(res.locals.algo_response, "DB error 2 : "+err);
            return res.status(500).json({ status : "failure", message : "DB error 2" });
        }
        if(subs.algos.indexOf(res.locals.algo._id) < 0){
            //
            //return err_cb(res.locals.algo_response, "You are not subcribed to this algorithm.");
            return res.status(400).json({ status : "failure", message : "You are not subcribed to this algorithm." });
        }

        next();
    });
});
*/

app.use(function(req, res, next){
    m_Context.findById(res.locals.context_id).exec(function(err, ctxt){
        if(err){
            console.log("DB error : "+err);
            //return err_cb(res.locals.algo_response, "DB error 3 : "+err);
            return res.status(500).json({ status : "failure", message : "DB error 3 : "+err });  
        }
        if(!ctxt){
            console.log("DB error : "+err);
            //return err_cb(res.locals.algo_response, "Unrecognized token");
            return res.status(500).json({ status : "failure", message : "Unrecognized token" });  
        }
        if(!ctxt.authorizations.default_rule){
            return next();
        }

        var default_rule = ctxt.authorizations.default_rule, except = ctxt.authorizations.except;

        //console.log("+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-");
        //console.log("default_rule : "+default_rule+", except : "+util.inspect(except));
        if(default_rule == "allow"){
            if(except && except.authors){
                for(var i =0; i< except.authors.length; i++){
                    try{
                        if(new RegExp(except.authors[i]).test(res.locals.algo.author.username)){
                            //return err_cb(res.locals.algo_response, "Request blocked by token specified authorizations");
                            return res.status(401).json({ status : "failure", message : "Request blocked by token specified authorizations" });
                        }
                    }
                    catch(e){
                        console.log("Error while executing regex : "+e);
                    }
                }
            }

            if(except && except.algos){
                for(var i =0; i< except.algos.length; i++){
                    try{
                        if(new RegExp(except.algos[i]).test(res.locals.algo.title)){
                            //return err_cb(res.locals.algo_response, "Request blocked by token specified authorizations");
                            return res.status(401).json({ status : "failure", message : "Request blocked by token specified authorizations" });
                        }
                    }
                    catch(e){
                        console.log("Error while executing regex : "+e);
                    }
                }
            }
        }
        // Deny by default
        else {
            if(except && except.authors){
                var deny = true;
                for(var i =0; i< except.authors.length; i++){
                    try{
                        if(new RegExp(except.authors[i]).test(res.locals.algo.author.username)){
                            deny = false;
                            break;
                        }
                    }
                    catch(e){
                        console.log("Error while executing regex : "+e);
                    }
                }
                
                if(deny){
                    //return err_cb(res.locals.algo_response, "Request blocked by token specified authorizations");
                    return res.status(401).json({ status : "failure", message : "Request blocked by token specified authorizations" });
                }
            }

            if(except && except.algos){
                var deny = true;
                for(var i =0; i< except.algos.length; i++){
                    try{
                        if(new RegExp(except.algos[i]).test(res.locals.algo.title)){
                            deny = false;
                            break;
                        }
                    }
                    catch(e){
                        console.log("Error while executing regex : "+e);
                    }
                }

                if(deny){
                    //return err_cb(res.locals.algo_response, "Request blocked by token specified authorizations");
                    return res.status(401).json({ status : "failure", message : "Request blocked by token specified authorizations" });
                }
            }
        }

        //console.log("+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-");
        next();
    });
});

app.use(function(req, res, next){
    var credits = res.locals.bearer.credits, credits_per_call = res.locals.algo.versions[0].credits_per_call;
    //console.log("credits : "+credits+", credits_per_call : "+credits_per_call);
    //console.log("+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-");
    if(credits < credits_per_call){
        //return err_cb(res.locals.algo_response, "Not enough credits");
        return res.status(401).json({ status : "failure", message : "Not enough credits" });
    }

    next();
});

app.use(function(req, res, next){
    //restler.post(CONFIG.params.IM_PROTOCOL + CONFIG.params.IM_ADDR +':'+ CONFIG.params.IM_PORT+ "/service-url", 
    //    { data : {_id : res.locals.algo.versions[0]._id.toString() } }
    restler.get(settings.IM_PROTOCOL + settings.IM_ADDR + "/service?kind=api&_id="+res.locals.algo.versions[0]._id.toString() 
    ).on('complete', function (body, httpResponse) {

        if(body instanceof Error){
            console.log("Internal network error : "+body);
            //return err_cb(res.locals.algo_response, "Internal network error");
            return res.status(500).json({ status : "failure", message : "Internal network error" });
        }

        var json = {};
        try{
            json = JSON.parse(body);
            console.log("service url response : "+JSON.stringify(json, null, 2));
        }catch(e){
            console.log("### body : "+body);
            console.log("### error : "+e);
            //return err_cb(res.locals.algo_response, 'Internal communication error');
            return res.status(500).json({ status : "failure", message : 'Internal communication error'});
        }

        if (json.status == 'failure'){
            console.log("RESTLER FAILED : "+json.message)
            //return err_cb(res.locals.algo_response, "From IM : "+json.message);
            return res.status(500).json({ status : "failure", message : "From IM : "+json.message});
        }

        res.locals.url = ('https' in json.message)? 'https://'+json.message.https : 'http://'+json.message.http;
        //console.log("res.locals.url : "+res.locals.url);
        next();
    }).on('error', function(){ console.log("Err from IM /service-url"); });
});




var intoStream = require('into-stream');

app.use(function(req, res, next){
    console.log("res.locals.algo.title : "+res.locals.algo.title);
    var target = res.locals.url+req.originalUrl.replace(new RegExp(res.locals.algo.title+'(\/[0-9]+\.[0-9]+\.[0-9]+\/?)?'), '');
    target = target.startsWith('http://')? target : 'http://'+target
    console.log('target : '+target)
    console.log("res.locals.algo.title : "+res.locals.algo.title);

    let stream;
    if(res.locals.buff){
        let text = res.locals.buff;
        console.log("RAW buff : "+text);
        stream = intoStream(text);
        stream.method  = req.method;
        stream.headers = req.headers;
    }
    else {
        stream = req;
    }

    var r = request[req.method.toLowerCase()](target);
    stream.pipe(r).pipe(res);
    var t1 = Date.now();
    
    r.on('response', function(response){
        console.log("Got response : "+response.statusCode);
        response.on('data', function(chunk){
            console.log("### response chunk : "+chunk);
        })
        .on('end', function(){
            //
            console.log("Connexion closed");
            var t2 = Date.now(), delta = (t2-t1)/1000;

            var history = {
                date : t1,
                duration : delta,
                algo : res.locals.algo.versions[0]._id
            };

            m_Context.update({ _id : res.locals.context_id }, {
                $push : {
                    history : {
                        $each : [history]
                    }
                }
            }).exec(function(err){
                if(err){
                    console.log("DB error : "+err);
                }
                else{
                    console.log("History updated");
                }
            });
            var credits = res.locals.bearer.credits, credits_per_call = res.locals.algo.versions[0].credits_per_call;
            credits -= credits_per_call + delta;
            credits = (credits < 0)? 0 : credits;
            res.locals.bearer.update({ $set : { credits : credits } }).exec(function(err){
                if(err){
                    console.log("DB error : "+err);
                }
                else{
                    console.log("User's credits updated");
                }
            });
        })
        .on('error', function(){ console.log("Err container could not respond properly"); });
    });
    
});


/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var intoStream = require('into-stream');
var strm = function(rqst, rsps){
    let stream;
    if(rsps.locals.buff){
        let text = rsps.locals.buff;
        stream = intoStream(text);
        stream.method  = rqst.method;
        stream.headers = rqst.headers;
    }
    else {
        stream = rqst;
    }
    return stream;
}

var afterAlgoResponse = function(error, t1, req, res, rqst, response, body){
    //
    var t2 = Date.now(), delta = (t2-t1)/1000;
    var statusCode = (error)? 500 : response.statusCode;

    //console.log("beginningDate : "+result.beginningDate+", t2 : "+new Date(t2).toString()+",  delta : "+delta);
    var history = {
        date : t1,
        duration : delta,
        algo : res.locals.algo.versions[0]._id
    };

    m_Context.update({ _id : res.locals.context_id }, {
        $push : {
            history : {
                $each : [history]
            }
        }
    }).exec(function(err){ console.log( ((err)? "DB error : "+err : "History updated") ); });
    
    var credits = res.locals.bearer.credits, credits_per_call = res.locals.algo.versions[0].credits_per_call;
    credits -= credits_per_call + delta;
    credits = (credits < 0)? 0 : credits;
    res.locals.bearer.update({ $set : { credits : credits } })
    .exec(function(err){ console.log( ((err)? "DB error : "+err : "User's credits updated")); });
            
    rqst.update({ $set : {
        response : { 
            status : (response)? response.statusCode : 500, 
            "content-type" : (response)? response.headers['content-type'] : "",
            body : (response)? body : error.toString() 
        },
        duration : delta,
        beginningDate : t1,
        is_responding : false
    }}).exec(function(err){ console.log( ((err)? "DB error : "+err : "Response saved")); });
}
//console.log("certs : "+util.inspect(CONFIG));

module.exports = { app: app, CONFIG : CONFIG };
/*
var port = process.env.PORT || CONFIG.params.PORTAL_PORT, onListen = function(){
    debug('Express server listening on port ' + port);
} ;
var server = (!CONFIG.params.CLOUD.startsWith('TERALAB'))? 
                https.createServer(CONFIG.certs, app).listen(port, onListen) :
                    require('http').createServer(app).listen(port, onListen);

server.timeout = CONFIG.params.SERVERS_TIMEOUT;

console.log("CONFIG.params.SERVERS_TIMEOUT : "+CONFIG.params.SERVERS_TIMEOUT);
*/