
/*
var restler = require('restler');

restler.get('http://localhost:50498/?f_name=Souleymane').on('complete', function(data, response){
	console.log('data : ' + data);
	console.log('response : ' + response);
});
*/

/*
var express = require('express');
var path = require('path');

var bodyParser = require('body-parser');

var multiparty = require('multiparty');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.get('/', function(req, res){
  var html = '<!DOCTYPE html>'+
             '<html>'+
             '<head><title>Test</title></head>'+
             '  <body>'+
             '    <form action="http://rh.192.168.147.135:3000" method="post" enctype="multipart/form-data">'+
             '      <input type="file" name="file"/><br/>'+
             '      <input type="submit" value="submit"/><br/>'+
             '    </form>'+
             '  </body>'+
             '</html>';
            res.end(html);
});

app.post('/', function(req, res){
	
	new multiparty.Form().parse(req, function(multipart_err, fields, files) {
		console.log(require('util').inspect(fields));
		console.log(require('util').inspect(files));
	});
	console.log("require('util').inspect(req.body)  :  " + require('util').inspect(req.body));
	console.log("require('util').inspect(req.body.f_name)  :  " + require('util').inspect(req.body.f_name));
});

app.listen(3002);
*/


/*
var fs = require('fs');
var util = require('util');
//var stat = fs.statSync('public/');
//console.log(util.inspect(stat));
//console.log(stat.isDirectory());

function getDirSize(name){
  var stat = fs.statSync(name);
  if(!stat.isDirectory())
    return -1;
  var size = stat.size;
  var rd = fs.readdirSync(name);
  for(var i=0; i < rd.length; i++ ){
    //console.log(util.inspect(rd[i]));
    if(fs.statSync(name+'/'+rd[i]).isDirectory()){
      var subSize = getDirSize(name+'/'+rd[i]);
      if(subSize == -1) return -1;
      size += subSize;
    }
    else 
      size += fs.statSync(name+'/'+rd[i]).size;
  }
  return size;
}
console.log('size of public : '+getDirSize('public'));
*/
/*
var series = require('async-series');
var CID=null, PORT=null;
series([
  function(done) {
    console.log('first thing');
    CID=20;
    PORT=40;
    done(new Error('Sorry byoz'));
  },
  function(err, nb, str){//, done) {
    console.log('second thing')
    console.log('CID : '+ CID + ', PORT : '+ PORT);
    //done(new Error('another thing'))
  },
  function(done) {
    // never happens, because "second thing"
    // passed an error to the done() callback
  }
], function(err) {
  console.log(err.message) // "another thing"
}, true);
*/

mongoose = require('mongoose')
require('./mongoDB');
var user = mongoose.model('User');
/*
var getUserPormise = async function(username){
  return new Promise(resolve => {
    //
    user.findOne({username : username}, function(err, result){
      if(err){
        reject("DB error");
        return;
      }
      if(!result){
        reject("No user with username "+username);
        return;
      }
      resolve(result);
    })
  });
} 
*/
/*
var usernameExists = function* (username){

  
  yield new Promise( (resolve, reject) => {
    user.findOne({username : username}, function(err, result){
      if(err){
        reject("DB error");
        return;
      }
      if(!result){
        reject("No user with username "+username);
        return;
      }
      resolve(result);
    });
  });
  
};

var a_user = usernameExists('user');
//a_user = await a_user;
console.log("a_user.username : "+a_user.username);
/*a_user.then(function(u){
  console.log('u : '+require('util').inspect(u));
});
*/
/*console.log('a_user : ' + require('util').inspect(a_user) );



function resolveAfter2Seconds(x) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(x);
    }, 2000);
  });
}

async function f1() {
  var x = await resolveAfter2Seconds(10)+10;
  console.log(x); // 10
}
f1();
*/

var obj = {'dd':'10', dde : 14, ddf : [1, 5]};

for (var v in obj)
  console.log(v);
console.log('Length '+Object.keys(obj).length);




