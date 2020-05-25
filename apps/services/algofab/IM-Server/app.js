var express = require('express');
var path = require('path');
var fs = require('fs'), util = require('util');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');



var app = express();

var routes = require('./routes');

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.writeHead(200, {'content-type': 'text/html'});
    res.end(JSON.stringify({message : "Infrastructure Manager up and running"}));
});

//app.use('/im', routes.im);
app.use('/version', routes.version);
app.use('/service', routes.service);
app.use('/namespace', routes.namespace);
app.use('/datasets', routes.datasets);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
// if (app.get('env') === 'development') {
//     app.use(function(err, req, res, next) {
//         res.status(err.status || 500);
//         res.render('error', {
//             message: err.message,
//             error: err
//         });
//     });
// }

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        status: "failure",
        message: err.message,
    });
});

module.exports = app;
