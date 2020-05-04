


var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
//var MongoStore = require('connect-mongo')(session);

//var SUPERGLOBALS = require('./config/');
var https = require('https');
var fs = require('fs'), util = require('util');
var cors = require('cors');
var debug = require('debug')('my-application');


var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(favicon());
app.use(logger('dev'));
app.use(session({
    secret: 'algofab secret',
    resave : false,
    saveUnutilized : false,
    store : global.store, 
    cookie:{maxAge: 60*60*1000}
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


/*
app.use(function(req, res, next){

    res.set('x-frame-options', 'SAMEORIGIN');
    next();

});
*/

/*
var proxy = require('redbird')({port : process.env.PORT || CONFIG.PORTAL_PORT, xfwd: true})
proxy.register(CONFIG.PORTAL_ADDR, "localhost:22450");
proxy.register('rh.'+CONFIG.PORTAL_ADDR, CONFIG.PORTAL_ADDR+':3002');//'+CONFIG.RH_PORT);
*/

/*
var httpProxy = require('http-proxy');
httpProxy.createProxyServer({target:'http://localhost:22450'}).listen(3000);

var proxy = httpProxy.createProxyServer({
    xfwd : true, 
    changeOrigin : true, 
    toProxy : true, 
    ws : true
});
*/
//var debug = require('debug')('my-application');

/*var port = process.env.PORT || SUPERGLOBALS.params.PORTAL_PORT, onListen = function(){
    debug('Express server listening on port ' + port);
} ;
*/

/*
var server = (!SUPERGLOBALS.params.CLOUD.startsWith('TERALAB'))? 
                https.createServer(SUPERGLOBALS.certs, app).listen(port, onListen) :
                    require('http').createServer(app).listen(port, onListen);
*/
//module.exports = function(SUPERGLOBALS, store){
    //SUPERGLOBALS.io = require('socket.io')( server );
    
    /*
    var port = process.env.PORT || SUPERGLOBALS.settings.PORTAL_PORT, onListen = function(){
        debug('Express server listening on port ' + port);
    } ;

    var server = (!SUPERGLOBALS.settings.CLOUD.startsWith('TERALAB'))? 
                    https.createServer(SUPERGLOBALS.certs, app).listen(port, onListen) :
                        require('http').createServer(app).listen(port, onListen);

    */

//var s = global.socket(server, store);
//SUPERGLOBALS.mongoose = require('./models/db-plus');

var routes = require('./routes/index');



var User = global.mongo.model('User');
var Algos = global.mongo.model('Algos');

// So the user data in session is updated at each call
app.use(function(req, res, next){
    if(req.session.user){
        var User = global.mongo.model('User');
        return User.findById(req.session.user._id).exec(function(err, u){
            if(err || !u){
                req.session.user = undefined;
                return res.redirect('/');
            }
            req.session.user = u;
            next();
        });
    }
    next();
});

app.get('/', function(req, res){
    console.log("----------------------------------------------------------");
    console.log("\t\t APP : MIDDLEWARE 1");
    console.log("----------------------------------------------------------");
    console.log('req.headers : ' + require('util').inspect(req.headers));
    if(req.session.user)
        res.render("index", {pop_message : req.session.pop_message, title : "AlgoFab", user : req.session.user});
    else
        res.render("index", {pop_message : req.session.pop_message, title : "AlgoFab"});
});

app.get('/test', function(req, res){

    global.mongo.model("AlgosMeta").find().populate(["author", {
        path : "versions",
        options : { sort : { version : 1 } }
    }]).exec(function(err, algos){
        res.render("test/menu", {
            pop_message : req.session.pop_message, 
            title : "AlgoFab", 
            algos : algos,
            user : req.session.user
        });
    });
});

app.use('/signin', routes.signin);
app.use('/signup', routes.signup);
app.get('/signout', function(req, res){
    console.log("----------------------------------------------------------");
    console.log("\t\t APP : MIDDLEWARE 2");
    console.log("----------------------------------------------------------");
    if(req.session.user){
        console.log('Loging out : ' + req.session.user.username);
        req.session.user = undefined;
        res.redirect('/');
    }
});

app.use(cors());
app.use('/algo', routes.algo);
app.use('/article', routes.article);
app.use('/user', routes.user);
app.use('/demo', routes.demo);
app.use('/docs', routes.docs);
//app.use('/partners', routes.partners);
app.use('/upload', routes.upload);
app.use('/recover', routes.recover);
app.use('/proxy', routes.proxy);

app.get('/catalog', function(req, res){
    console.log("----------------------------------------------------------");
    console.log("\t\t ALGO : MIDDLEWARE 111");
    console.log("----------------------------------------------------------");

    var pop_Query = [
        {
            path : "author",
        }, 
        {
            path : "versions",
            match : {
                hidden : false
            }
        }
    ];

    var AlgosMeta = mongo.model('AlgosMeta');

    AlgosMeta.find().populate(pop_Query).exec(function(err, data){
        //
        if (err){
            //
            res.end('Error : '+error+', come back <a href="/"> home </a>');
        }

        else{
            console.log("DATA : "+data);
            res.render('algo_list', 
                {
                    title : 'My Algorithms', 
                    activeHeadersComp : 'catalog', 
                    //user : req.session.user, 
                    algos : data, 
                    initiator : "catalog"
                }
            );
        }
    });
})



/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
//if (app.get('env') === 'development') {
    // app.use(function(err, req, res, next) {
    //     res.status(err.status || 500);
    //     res.render('error', {
    //         message: err.message,
    //         error: err
    //     });
    // });
//}

// production error handler
// no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//         message: err.message,
//         error: {}
//     });
// });
/*
console.log("\n\n++++++++++++++++++");
console.log("  SERVER STARTED  ");
if(!SUPERGLOBALS.state || !SUPERGLOBALS.state._proxies || SUPERGLOBALS.state._proxies.length == 0)
    console.log("  ->No proxies found.");
else
    console.log("  ->"+SUPERGLOBALS.state._proxies.length+" proxies found.");
console.log("++++++++++++++++++\n\n");
*/

//return server;
//}
//module.exports = app;

module.exports = app;