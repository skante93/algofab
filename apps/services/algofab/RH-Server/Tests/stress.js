


/*
var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

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


module.exports = app;
*/
var events = require("events");
var os = require('os');
var request = require('request');
var util = require('util');
var fs = require('fs');


var BEGIN_TIMER_DOMAIN = { min : 0, max : 10 }; // In seconds
var INTERVAL_TIMER_DOMAIN = { min : 0, max : 700 }; // In milliseconds
var NUMBER_OF_SCENARIOS = 200;
var AUTHORIZATION = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI1YTMyNWU1MTdlNDA1NzFlMTM0YTdjMzEifQ.j000f0R6GJuB2yXHeUbqFFQc3CN6oYyeeB_nqrm_hDE';

var RH_ADDRESS = 'http://localhost:3000';
var REQUESTS = [
    {
        method : 'POST',
        url : RH_ADDRESS+'/HelloWorld/?outformat=xml',
        form : { firstname:'John Silver', lastname:'DOE' }
    },
    {
        method : 'POST',
        url : RH_ADDRESS+'/HelloWorld/?outformat=xml&delay',
        form : { firstname:'John Silver', lastname:'DOE' }
    }
];

class RequestGroup {
    constructor(req, numberOfTries, begin, interV){
        //
        var ref = this;
        this.req = req;
        this.numberOfTries = numberOfTries;
        this.begin = begin;
        this.interV = interV;

        this.successes = [];
        this.nbProcessingOnFailures = [];
        this.nbRequestsSent = 0;
        this.nbResponsesReceived = 0;

        this.rh_responses = [];

        this.eventEmitter = new events.EventEmitter();
        
        var memAtT0 = os.freemem();
        this.mems = [];
        this.memInterv = setInterval(function(){ 
            ref.mems.push( (memAtT0-os.freemem())/(1024*1024) ); // MB 
        }, 500);
        
        var cpuAtT0 = os.cpus();
        this.cpus = [];
        this.cpusInterv = setInterval(function(){
            var curr = os.cpus();
            var activity = 0;
            
            for(var i=0; i < curr.length; i++){
                var total = 0;
                for(var t in curr[i].times){
                    curr[i].times[t] = curr[i].times[t] - cpuAtT0[i].times[t];
                    total += curr[i].times[t];
                }
                
                for(var t in curr[i].times){
                    curr[i].times[t] = Math.round(100 * curr[i].times[t] / total);
                }
                
                activity += curr[i].times.user;
            }
            //console.log("cpu activity : "+activity+" %");
            ref.cpus.push(activity);
        }, 500);

        this.showProgress = function(){
            var rq = ` >>>>> ${parseFloat(this.nbRequestsSent*100/numberOfTries).toFixed(2)}% of requests sent`;
            var rs = ` <<<<< ${parseFloat(this.nbResponsesReceived*100/numberOfTries).toFixed(2)}% of responses received`;
            process.stdout.write(`\r`);
            process.stdout.write(`\r\t${rq}     |     ${rs}`);
        }

        var response = function(t0){
            return function(err, response, body){
                var deltaT = Date.now()-t0;

                ref.nbResponsesReceived++;
                ref.showProgress();

                if(err){
                    console.log("\n\t\tErr : "+err);
                    ref.nbProcessingOnFailures.push({ responseNumber : ref.nbResponsesReceived, nbProcess : (ref.nbRequestsSent - ref.nbResponsesReceived)});
                    if(ref.nbResponsesReceived == numberOfTries){
                        ref.result();
                    }
                    return;
                }
                else if(JSON.parse(body).status == "failure"){
                    //if(response.statusCode != 401){
                        console.log("\n\t\t"+response.statusCode+" : "+body);
                        ref.nbProcessingOnFailures.push({ responseNumber : ref.nbResponsesReceived, nbProcess : (ref.nbRequestsSent - ref.nbResponsesReceived)});
                        if(ref.nbResponsesReceived == numberOfTries){
                            ref.result();
                        }
                        return;
                    //}
                    //else{ console.log("Not enough credits"); }

                    /*try{
                        var j = JSON.parse(body);
                        if(j.status && j.status == 'failure'){
                            if(ref.nbResponsesReceived == numberOfTries){
                                ref.result();
                            }
                            return;// console.log('Failure : '+j.message);
                        }
                    }
                    catch(e){
                        return;
                    } */
                }

                ref.successes.push(deltaT);
                ref.rh_responses.push(body);
                //console.log("body.id : "+JSON.parse(body).status);
                if(ref.nbResponsesReceived == numberOfTries){
                    ref.result();
                }

            }
        }

        var method = req.method.toLowerCase(), url = req.url, form = req.form;
        setTimeout(function(){
            console.log("Begin now");

            var refInterV = setInterval(function(){
                if(++ref.nbRequestsSent == numberOfTries){ clearInterval (refInterV); }

                ref.showProgress();
                
                //console.log('method : '+method+', url : '+url+', form : '+form+', request[method] : '+request.post);

                if(form){
                    request[method](url, response(Date.now())).form(form).auth(null, null, true, AUTHORIZATION);
                }else{
                    request[method](url, response(Date.now())).auth(null, null, true, AUTHORIZATION);
                }
                //console.log("ref.nbRequestsSent ("+ref.nbRequestsSent+') == numberOfTries ('+numberOfTries+') -> '+(ref.nbRequestsSent==numberOfTries));
            }, interV);
        }, begin*1000);
    }

    getAlgoResponses(cb){
        //
        //console.log("GETTING RESPONSES");
        var index = 0, ref = this, algo_responses = [];
        if(this.rh_responses.length == 0)
            return cb([]);

        (function getResponsesFromRH(){
            var id = JSON.parse(ref.rh_responses[index]).id;
            //console.log("id : "+id);
            
            (function oneResponse(){
                //console.log("url : "+RH_ADDRESS+'/_result'+",    id : "+id);

                request.post(RH_ADDRESS+'/_result', function(error, response, body){
                    //
                    if(error){
                        //
                        console.log("error : "+error);
                        if(index == ref.rh_responses.length-1){
                            cb(algo_responses);
                        }
                        else{
                            index++;
                            getResponsesFromRH();
                        }
                        return
                    }
                    
                    var json = JSON.parse(body);

                    if(json.status == "ongoing"){
                        //
                    //    console.log(index+" : OK let's retry in 5 seconds ..."+body);
                        setTimeout(oneResponse, 3*1000);
                        return ;
                    }
                    else if(json.status == "failure" || json.response.status != 200){
                    //    console.log(index+" : failure : "+body);
                        if(index == ref.rh_responses.length-1){
                            cb(algo_responses);
                        }
                        else{
                            index++;
                            getResponsesFromRH();
                        }
                        return
                    }
                    //console.log("index : "+index+",    duration : "+json.duration);
                    algo_responses.push(json.duration);

                    if(index == ref.rh_responses.length-1){
                        cb(algo_responses);
                    }
                    else{
                        index++;
                        getResponsesFromRH();
                    }
                }).form({ id: id });
            })();
        })();
    }

    result(){
        //
        var ref = this;
        this.getAlgoResponses(function(algo_responses){
            //
            
            console.log("RESPONSES GOTTEN ("+algo_responses.length+")");
            
            clearInterval(ref.memInterv);
            clearInterval(ref.cpusInterv);
            var r = "\n\n-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+\n";

            r += " Begin at\t---->\t"+ref.begin+" s\n";
            r += " Request \t---->\t"+ref.req.method+" --on-- "+ref.req.url+((ref.req.form)?' --with-- [BODY]':'')+'\n';
            r += " Each    \t---->\t"+ref.interV+" ms\n";
            r += " Until   \t---->\t"+ref.numberOfTries+" tries\n";
            r +=   "------------------------------------------------------------------------\n";
            //var maxReducer = (a, b) => (a>b)?a:b;
            //var maxReducer = (a, b) => (a>b)?a:b;
            //if(this.successes.length != 0){

                var success_stats_client_rh = getMinMaxAndAverage(ref.successes);
                var success_stats_rh_algo = getMinMaxAndAverage(algo_responses);
                var memory_stats = getMinMaxAndAverage(ref.mems);
                var cpu_stats = getMinMaxAndAverage(ref.cpus);

                var success_client_rh_percentage = ref.successes.length*100/ref.numberOfTries;
                var success_rh_algo_percentage = algo_responses.length*100/ref.rh_responses.length;
                //console.log("this.successes : "+this.successes);
                r += "Result : -- "+ success_client_rh_percentage +" % successes between client and RH\n";
                r += "         -- "+ success_rh_algo_percentage +" % successes between RH and algo\n";
                r += "         -- "+ success_stats_client_rh.max +" ms of max delay - between client and RH\n";
                r += "         -- "+ success_stats_client_rh.min +" ms of min delay - between client and RH\n";
                r += "         -- "+ success_stats_client_rh.average +" ms of average delay - between client and RH\n";

                r += "         -- "+ success_stats_rh_algo.max +" ms of max delay - between RH and algo\n";
                r += "         -- "+ success_stats_rh_algo.min +" ms of min delay - between RH and algo\n";
                r += "         -- "+ success_stats_rh_algo.average +" ms of average delay - between RH and algo\n";
                r += "         -- "+ memory_stats.average +" MB of average memory consumption\n";

            //}
            //else{
            //    r += "Result : -- "+ this.successes.length*100/this.numberOfTries +" % successes\n";
            //}

            r += "-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+\n\n";
            //r += "         -- Errors while n requests were being treated ("+ref.nbProcessingOnFailures.length+" in total) : "+util.inspect(ref.nbProcessingOnFailures);
            console.log(r);
            ref.eventEmitter.emit("done", success_client_rh_percentage, success_rh_algo_percentage, success_stats_client_rh, success_stats_rh_algo, memory_stats, cpu_stats);
        });
    }

    on(str, action){
        this.eventEmitter.on(str, action);
    };
}

var getMinMaxAndAverage = function(tab){
    var min = tab[0], max = tab[0], average = tab[0];
    for(var i=1; i<tab.length; i++){
        if(tab[i] > max) max = tab[i];
        if(tab[i] < min) min = tab[i];
        average += tab[i];
    }
    return { min : min, max : max, average : average/tab.length };
}

var getNewTimerValuesForRG = function(){
    var bt = parseInt((BEGIN_TIMER_DOMAIN.max-BEGIN_TIMER_DOMAIN.min)*Math.random()+BEGIN_TIMER_DOMAIN.min);
    var it = parseInt((INTERVAL_TIMER_DOMAIN.max-INTERVAL_TIMER_DOMAIN.min)*Math.random()+INTERVAL_TIMER_DOMAIN.min);
    return [bt, it];
}

var SCENARIOS = [
/*    [REQUESTS[0], 70, 1, 100],
    [REQUESTS[0], 100, 60*15, 100],
    [REQUESTS[0], 200, 60*15, 100],
    [REQUESTS[0], 400, 60*15, 100],
    [REQUESTS[0], 700, 60*15, 100],
    [REQUESTS[0], 1000, 60*15, 100],
    [REQUESTS[0], 1500, 60*15, 100],
    [REQUESTS[0], 2000, 60*15, 100],

    [REQUESTS[0], 500, 60*10, 0],
    [REQUESTS[0], 500, 60*15, 50],
    [REQUESTS[0], 500, 60*15, 100],
    [REQUESTS[0], 500, 60*15, 200],
    [REQUESTS[0], 500, 60*15, 300],
    [REQUESTS[0], 500, 0, 400],
    [REQUESTS[0], 500, 20*15, 500],

    [REQUESTS[0], 1000, 20*15, 0],
    [REQUESTS[0], 1000, 60*15, 50],
    [REQUESTS[0], 1000, 60*10, 100],
    [REQUESTS[0], 1000, 60*15, 200],
    [REQUESTS[0], 1000, 60*15, 300],
    [REQUESTS[0], 1000, 60*15, 400],
*/    [REQUESTS[0], 1000, 1, 500],
];

//var rg = new RequestGroup(REQUESTS[0], 200, 1, 0);
var TriggerExperience = function(){
    //var s = SCENARIOS;
    var bench = "Time ; Number of Requests ; Interval (ms) ; Errors client-RH (%) ; Errors RH-algo (%) ; RT client-RH min (ms) ; RT client-RH max (ms) ; RT client-RH avg (ms) ; RT RH-algo min (ms) ; RT RH-algo max (ms) ; RT RH-algo avg (ms) ; RAM min (MB) ; RAM max (MB) ; RAM avg (MB) ; CPU min (%) ; CPU max (%) ; CPU avg (%)\n";

    (function sc_step(){
        var step = SCENARIOS.splice(0,1)[0];
        bench += (new Date()).toString()+" ; "+step[1]+" ; "+step[3];

        var rg = new RequestGroup(step[0], step[1], step[2], step[3]);

        rg.on("done", function(success_client_rh_percentage, success_rh_algo_percentage, success_stats_client_rh, success_stats_rh_algo, memory_stats, cpu_stats){
            bench += " ; "+(100-success_client_rh_percentage);
            bench += " ; "+(100-success_rh_algo_percentage);
            bench += " ; "+success_stats_client_rh.min+" ; "+success_stats_client_rh.max+" ; "+success_stats_client_rh.average;
            bench += " ; "+success_stats_rh_algo.min+" ; "+success_stats_rh_algo.max+" ; "+success_stats_rh_algo.average;
            bench += " ; "+memory_stats.min+" ; "+memory_stats.max+" ; "+memory_stats.average;
            bench += " ; "+cpu_stats.min+" ; "+cpu_stats.max+" ; "+cpu_stats.average+"\n";

            console.log(" -- Next ");
            if(SCENARIOS.length == 0){
                console.log("Experience ended !! ");
                console.log("------------------------------------------------");
                console.log(bench);
                try {
                    fs.writeFileSync("result_stress.txt", bench);
                }catch(e){
                    console.log("Save error : "+e);
                }
            }
            else{
                sc_step();
            }
        });
    })()
}

/*setTimeout(function(){ 
    console.log( ((os.totalmem())/(1024))+' KB Total' );
    console.log( ((os.freemem())/(1024))+' KB free' );
    console.log( ((os.totalmem() - os.freemem())/(1024))+' KB used' );
    console.log( util.inspect(os.cpus())+' cpus' );
},2000);
*/

TriggerExperience();

//request["get"]("http://localhost:3001/", function(err, resp, body){ console.log( err || resp.statusCode+" : "+body); });
/*
for(var i=0; i < NUMBER_OF_SCENARIOS; i++){

}
console.log('New Timers : '+getNewTimerValuesForRG());
*/
/*
var request = require('request');
request.post('https://ws37-rh.tl.teralab-datascience.fr/HelloWorld/?outformat=xml', function(err, respone, body){
    console.log(err || body);
}).form({ firstname:'John Silver', lastname:'DOE' }).auth(null, null, true, AUTHORIZATION);
*/

