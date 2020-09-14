
/*
var f_name = "qdscfqdf/qQSQs/QSQS";
console.log(new RegExp("/").test(f_name));
*/
/*
var mkdirp = require('mkdirp');
try{
    var r = mkdirp.sync('some/random/route');
    console.log('r : '+r);
}catch(e) {
    console.log('Exception '+e);
}
*/
/*
var fs = require('fs');

fs.readFile('/home/kante/Bureau/HelloWorld.json', function(err, data){
	console.log('data : ' + data);
	var received = JSON.parse(data+' ');
	console.log(received);
	console.log('\n\nreceived.API.get.description.join(\'\') : \n' + received.API.get.description.join(''));

});
*/

/*
var mask = /<(( )*|(\t)*)*script(.)*<(( )*|(\t)*)*\/(( )*|(\t)*)*script(( )*|(\t)*)*>/,
	sstr = "some text <script     </script> after.";

console.log(sstr);

console.log(sstr.replace(mask, ''));
*/

/*
var mongoose = require('mongoose');
require('./models/mongoDB');
var Algos = mongoose.model('Algos');

var myalgo = new Algos({'title' : 'coco'});

console.log(myalgo);
*/

/*
var exec = require('child_process').exec;

exec('ls -l', function(error, stdout, stderr){
	console.log('error : '+ error+'\n\n\n');
	console.log('stderr : '+ stderr+'\n\n\n');
	console.log('stdout : '+ stdout+'\n\n\n');

});*/



/*
var express = require('express');
var path = require('path');


var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function(req, res){
	res.render('test', {title : 'test'});
});

app.listen(3000);
*/
/*
var fs = require('fs');
console.log("process.argv[0] : "+process.argv[0]);
console.log("process.argv[1] : "+process.argv[1]);
console.log("process.argv[2] : "+process.argv[2]);
var data = fs.readFileSync(__dirname+'/public/img/test.jpeg');
console.log('\n\n\n data : ' + data + ' \n\n\n');
fs.writeFileSync('/home/kante/'+process.argv[2], data);
*/


/*
var express = require('express');
var fs = require('fs');

var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.get('/', function(req, res){
    //res.set('Content-Type', 'image/jpeg');
    res.sendFile(__dirname+'/public/img/test.jpeg');
    //res.end();
    //res.end('\n\n Done');
});

app.listen(3006);
*/

/*
var fs = require('fs');

function clearDirectory(dir){
    if(dir.charAt(dir.length-1) != '/')
        dir +='/';
    fs.readdir(dir, function(err, files) {
        files.forEach(function(file) {
            console.log(dir+file);
            fs.unlink(dir+file, function(err){
                if(err)
                    console.log('error occured : '+ err);
                else
                    console.log('"'+dir+file+'" unlinked' );
            });
        });
    });
};

clearDirectory('/home/kante/Téléchargements/Test/');
*/
/*
var restler = require('restler'), fs = require('fs');
var srcPath = '/home/kante/Téléchargements/Démo.tar.gz', destPath = '/home/kante/Téléchargements/images.jpeg';
var srcSize = fs.statSync(srcPath).size, destSize = fs.statSync(destPath).size;

restler.post('http://localhost:3000/upload', {
    multipart: true,
    data: {
        username : 'jdoe',
        password : 'jdoe',
        file : restler.file(srcPath, null, srcSize, null, "application/gzip"),
        //path : 'abc/d'
    }
}).on("complete", function(upload_imgs, resp) {
    
    console.log('upload_imgs : '+upload_imgs);
    
});
*/
/*
var mkdirp = require('mkdirp');
mkdirp(__dirname+'/../size/public/data/saitama', function(err){
    if(err)
        console.log(err);
    else
        console.log('Done');
});
*/
/*
var version_mask = /^[0-9]+\.[0-9]+\.[0-9]+$/;
console.log(version_mask.test("1.2.3"));
*/

/*
var express = require('express');
var path = require('path');

var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function(req, res){
	res.render('test2', {title : 'test'});
});
app.post('/', function(req, res){
	console.log(req.body);
	res.render('test2', {title : 'test', iframing : req.body.n_content});
});

app.listen(3000);
*/

/*
var version_mask = /[0-9]+\.[0-9]+\.[0-9]+/;
console.log(version_mask.test("1.2."));
*/



/*
'use strict';
var nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'menodemailer@gmail.com',
        pass: 'J7GKymem'
    }
});

// setup email data with unicode symbols
var mailOptions = {
    from: '"no-reply@algofab.fr"<foo@blurdybloop.com>', // sender address
    to: 'souleymanecheickkante@yahoo.fr', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world ?', // plain text body
    html: '<b>Hello world ?</b>' // html body
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
        return console.log(error);
    }
    console.log('Message %s sent: %s', info.messageId, info.response);
});
*/

/*
var fs = require('fs'), util = require('util');
var mongoose = require('./models/mongoDB');   
var User = mongoose.model('User');
var Algos = mongoose.model('Algos');

var analyseAPIField = function(API, verb, io){
    var unscript_mask = /<(( )*|(\t)*)*script(.)*<(( )*|(\t)*)*\/(( )*|(\t)*)*script(( )*|(\t)*)*>/;
    if(API[verb]){
        for(var i=0; i < API[verb].length; i++){
            
            if( API[verb][i].uri && typeof API[verb][i].uri !== 'string' ) {
                var msg = "Field API."+verb+"["+i+"].uri doesn't exist or is not string";
                console.log(msg);
                if(typeof io !== 'undefined')
                    io.emit("Error", msg);
                return new Error(msg);
            }

            if( !(API[verb][i].description && API[verb][i].description instanceof Array) ){
                var msg = "Field API."+verb+"["+i+"].description doesn't exist or is not array";
                console.log(msg);
                if(typeof io !== 'undefined')
                    io.emit("Error", msg);
                return new Error(msg);
            }
            try {
                API[verb][i].description = API[verb][i].description.join('').replace(unscript_mask, '');
            }catch(e){
                var msg = "Field API."+verb+"["+i+"].description is in the wrong format, it should be an array of string.";
                console.log(msg);
                if(typeof io !== 'undefined')
                    io.emit("Error", msg);
                return new Error(msg);
            }

            if( !(API[verb][i].inputs && API[verb][i].inputs instanceof Array) ){
                var msg = "Field API."+verb+"["+i+"].inputs doesn't exist or is not array";
                console.log(msg);
                if(typeof io !== 'undefined')
                    io.emit("Error", msg);
                return new Error(msg);
            }
            
            for(var j=0; j < API[verb][i].inputs.length; j++){
                if( !(API[verb][i].inputs[j].name && API[verb][i].inputs[j].type) ){
                    var msg = "Field API."+verb+"["+i+"].inputs["+j+"] has either not field name or field type (both are required).";
                    console.log(msg);
                    if(typeof io !== 'undefined')
                        io.emit("Error", msg);
                    return new Error(msg);
                }

                if( !API[verb][i].inputs[j].required )
                    API[verb][i].inputs[j].required = false;
            }

            if( !(API[verb][i].outputs && API[verb][i].outputs instanceof Array) ){
                var msg = "Field API."+verb+"["+i+"].outputs doesn't exist or is not array";
                console.log(msg);
                if(typeof io !== 'undefined')
                    io.emit("Error", msg);
                return new Error(msg);
            }
            
        }
        
    }
}

var analyseJSON = function(file, io, cb){
    if(typeof io === 'function' && typeof cb === 'undefined'){
        cb = io; io = undefined;
    }

    var data;
    try {
        data = fs.readFileSync(file);
    }
    catch(e) {
        var msg = util.inspect(e);
        console.log(msg);
        if(typeof io !== 'undefined')
            io.emit("Error", msg);
        cb(new Error(msg));
        //cleanUpUploads(files);
        return;
    }

    var received;
    try {
        received = JSON.parse(data);
    }
    catch(e) {
        var msg = "Parse Error : " + util.inspect(e);
        console.log(msg);
        if(typeof io !== 'undefined')
            io.emit("Error", msg);
        cb(new Error(msg));
        //cleanUpUploads(files);
        return;
    }

    if( !received.title || !/^[a-zA-Z0-9_\.]{4,}$/.test(received.title)) {
        var msg = "Either title is empty or it is in the wrong format. It should be composed of at least 4 ALPHANUMERIC CHARACTERS";
        console.log(msg);
        if(typeof io !== 'undefined')
            io.emit("Error", msg);
        cb(new Error(msg));
        //cleanUpUploads(files);
        return;
    }

    var version_mask = /^[0-9]+\.[0-9]+\.[0-9]+$/;
    var unscript_mask = /<(( )*|(\t)*)*script(.)*<(( )*|(\t)*)*\/(( )*|(\t)*)*script(( )*|(\t)*)*>/;

    if( !received.version || !version_mask.test(received.version)) {
        var msg = "Either version is empty or it is in the wrong format. This is the expected format : 1.2.3";
        console.log(msg);
        if(typeof io !== 'undefined')
            io.emit("Error", msg);
        cb(new Error(msg));
        //cleanUpUploads(files);
        return;
    }

    Algos.find({'title' : received.title, 'version' : received.version}, function(a_err, algo){
        //console.log('a_err : '+a_err+',\tAlgo : '+algo);
        if(a_err){
            var msg = "db error.";
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }

        if(algo && algo.length != 0){ 
            var msg = "an algorithm with the same name and the same version is already recorded.";
            console.log(msg);
            if(typeof io !== 'undefined')
               io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }

        if(!received.description || !received.description instanceof Array){
            console.log("received.description : "+received.description+", typeof received.description : "+(typeof received.description));
            var msg = "Either field description doesn't exist or it isn't an array.";
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }

        received.description = received.description.join('').replace(unscript_mask, '');

        if(!received.API){
            var msg = "Errror : The field API is NOT optional.";
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }

        var at_least_one_method = (received.API.get && received.API.get instanceof Array) || 
                                  (received.API.post && received.API.post instanceof Array) || 
                                  (received.API.put && received.API.put instanceof Array) || 
                                  (received.API.delete && received.API.delete instanceof Array);    

        if(!at_least_one_method){
            var msg = "No VERB Given, if not checkout the format. (Array of object expected).";
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }

        //------ FOR GET --------
        var wentWrong = analyseAPIField(received.API, 'get', io);
        if(wentWrong instanceof Error) {
            cb(wentWrong);
            return;
        }

        //------ FOR POST --------
        wentWrong = analyseAPIField(received.API, 'post', io);
        if(wentWrong instanceof Error) {
            cb(wentWrong);
            return;
        }

        //------ FOR PUT --------
        wentWrong = analyseAPIField(received.API, 'put', io);
        if(wentWrong instanceof Error) {
            cb(wentWrong);
            return;
        }

        //------ FOR DELETE --------
        wentWrong = analyseAPIField(received.API, 'delete', io);
        if(wentWrong instanceof Error) {
            cb(wentWrong);
            return;
        }

//        received.author = req.session.user._id

        console.log("\nAnalyseJSON Successfully end\n");
        cb(null, received);
    });
}

analyseJSON('algo.json', function(err){
    if(err instanceof Error){
        console.log(err);
    }
    else {
        console.log("Went right");
    }  
});
*/
/*
var express = require('express');
var app = express();
var multiparty = require('multiparty');
var config = require('./config');
var util = require('util');

app.all('*', function(req, res, next){
    new multiparty.Form().parse(req, function(error, fields, files){
        console.log(util.inspect(config.utils.dao.meta));
        var algo = config.utils.dao.algo.meta("598c50d119508551f8978131");
        algo.then(meta => {
            meta.sayHello();
        }).catch(err => {
            console.log("Err : "+util.inspect(err));
        });
        res.end('ff');

    });
    
});

app.listen(33567, function(){ console.log('server started');});
*/
/*
const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
*/
/*
var req = require("request").get("https://google.com");
req.on('response', function(res){
    res.on('data', function(data){
        console.log("------------------------------------------------------------------");
        console.log("data : "+data);
    });
})
*/
var mongo = require('./config').mongo;
var c = mongo.model("Context"), t = mongo.model('Token'), u = mongo.model('User'), util = require('util');
var jwt = require('jwt-simple');


var mongoose = require('mongoose');

var getHistoryIntervarl = function(id_ctxt, interv, callback){
    if(typeof interv === 'function' && !callback){
        callback = interv;
        interv = undefined;
    }
    var condition = function(compared){
        //console.log("From : "+from+"\tcompared : "+compared);
        //console.log("From.getTime() : "+from.getTime()+"\tcompared.getTime() : "+compared.getTime());
        //console.log("From : "+from+", To : "+to);

        if (!interv)
            return true;

        if ( interv.from && (interv.from.getTime() > compared.getTime()) ){
            //console.log("From failed");
            return false;
        }
        
        if ( interv.to && (interv.to.getTime() <= compared.getTime()) ){
            //console.log("To failed");
            return false;
        }
        
        return true;
    };
    c.findById(id_ctxt).exec(function(err, result){
        if(err){
            console.log("DB error : "+err);
            return callback("DB error");
        }
        if(!result){
            console.log("Result : "+util.inspect(result));
            return callback("zero");
        }
        var matchedHistory = [];
        result.history.forEach(function(h, ind, arr){
            if(condition(h.date)){
                matchedHistory.push(h);
            }
        });

        callback(null, matchedHistory);
    });
}

var getUserHistory = function(u_id, interv, callback){

    t.find({bearer : u_id}).exec(function(err, tkns){
        if(err){
            console.log("DB error : "+err);
            return callback("DB error");
        }
        if(!tkns || tkns.length == 0){
            return callback(null, []);
        }
        var history = [];

        (function fetchTknHistory(){
            //
            var tkn = tkns.splice(0,1)[0];
            console.log("TKN : "+tkn._id);
            var id_ctxt = jwt.decode( tkn.token, "AF Secret").iss;
            
            console.log("CTXT : "+id_ctxt);
            
            getHistoryIntervarl(id_ctxt, interv, function(err, h){
                if(err) {
                    console.log("Oh no : "+err);
                    return callback(err);
                }

                history = history.concat(h);

                if(tkns.length == 0){
                    history.sort(function(a, b){
                        return a.date.getTime() - b.date.getTime();
                    });
                    console.log("Cool end");
                    callback(null, history);
                }
                else{
                    fetchTknHistory();
                }
            });
        })();
        
    });
}
//{from : new Date(2017, 9, 13, 15, 07, 56), to: new Date(2017, 9, 13, 15, 09, 02)}
/*
getHistoryIntervarl("59de9e9e5166ae187a929ca6", {from : new Date(2017, 9, 13, 15, 07, 56), to: new Date(2017, 9, 13, 15, 09, 02)}, function(history){
    console.log("We found "+history.length+" matching elements");
});
*/

var now = new Date(), thisYear = now.getFullYear(), thisMonth = now.getMonth()-1;
var interv = { from : new Date(thisYear, thisMonth) };
console.log("now : "+now+", thisYear : "+thisYear+", thisMonth : "+thisMonth+", interv.from : "+interv.from);

getUserHistory("5989cbb5daddb946a4217698", {from : interv}, function(err, history){
    console.log("We found these "+history.length+" matching elements : "+util.inspect(history));
});