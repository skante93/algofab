
/*
var request = require('request');

//request.get('http://localhost:32011', function(err, resp, body){ console.log(body); });


var app = require('express')();

app.all('*', function(req, res){
	var r = request('http://localhost:32011');
	req.pipe(r);
	r.pipe(res);
});

app.listen(32010);
*/


var conf = require('./config');

console.log(conf.kube.svc('eyesnap-web', 'jdoe').url())