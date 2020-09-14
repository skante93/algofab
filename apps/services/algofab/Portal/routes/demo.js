    
var express = require('express');   
var multiparty = require('multiparty'), restler = require('restler');
var router = express.Router();
var request = require('request');
var fs = require('fs'); util = require('util');
var Cookies = require('cookies');

var Proxy = global.utils.proxy;
var User = global.mongo.model('User');  
var Algos = global.mongo.model('Algos');
var AlgosMeta = global.mongo.model('AlgosMeta');


router.get('/:algoID/', function(req, res){
	console.log("----------------------------------------------------------");
    console.log("\t\t DEMO : MIDDLEWARE 3");
    console.log("----------------------------------------------------------");
	
	if(req.params.algoID ){
		Algos.findOne({_id : req.params.algoID}, function(algo_err, a_data){
            if(algo_err || !a_data){
                return res.end('This algorithm does not appear to be online');
            }
            //console.log("");
            var rtr=0;
            restler.get(settings.IM_PROTOCOL + global.settings.IM_ADDR + "/service?_id="+req.params.algoID+"&kind=demo")
            .on('complete', function (body, httpResponse) {
                
                console.log("body : "+body);
                console.log("util.inspect(body) : "+require('util').inspect(body));
                if(body instanceof Error || !body) {
                    if(rtr < 10){
                        console.log('Err : '+ body)
                        this.retry(1000);
                        rtr++;
                    }
                    else
                        res.end("Couldn't create the service, the IM is temporarily unavailable");  
                }
                else {
                    var json = {};
                    try{
                        json = JSON.parse(body);
                    }catch(e){
                        return res.end('Failure. Error message : Internal communication error');
                    }

                    if (json.status == 'failure'){
                        return res.end('Failure. Error message : '+json.message);
                    }
                
                    var targets = json.message;;//, PORT = parseInt(target.split(':')[1]);
                    /*
                    while( !(global.settings.DEMO.port_range.min <= PORT && PORT <= global.settings.DEMO.port_range.max ) ){
                        PORT = (PORT < global.settings.DEMO.port_range.min)? PORT+3000 : PORT-3000;
                    }
                    */

                    //console.log("target : "+targets+', PORT : '+PORT);
                    

                    //var px = reuseOrCreateProxy(global.state._proxies, target, PORT)
                    //px.grantAuthorization(req.session.user._id);
                    

                    if(res.headersSent) return;
                    //var redirectTo = ( (global.settings.DEMO.certs)? 'https://':'http://' )+ global.settings.DEMO.name+':'+PORT;
                    //console.log("Redirection to : "+redirectTo);
                    
                    //var cookie = Cookies(req, res, { domain : ".tl.teralab-datascience.fr", maxAge : 1000*60*60 });
                    //var signedOrdUnsigned = (global.settings.DEMO.certs)? { signed : true } : { httpOnly : false };
                    
                    //cookie.set('coolfromdemo', 'Hey on dit quoi?', signedOrdUnsigned);
                    //console.log(">>>>>>>> cookie : "+util.inspect(cookie));
                    var proto = ('https' in targets)? 'https' : 'http';
                    var demoServer = targets[proto].split(':')[0], demoPort = targets[proto].split(':')[1];
                    
                    res.cookie('demoProto', proto, { domain : '.tl.teralab-datascience.fr', path : '/'} );
                    res.cookie('demoServer', demoServer, { domain : '.tl.teralab-datascience.fr', path : '/'} );
                    res.cookie('demoPort', demoPort, { domain : '.tl.teralab-datascience.fr', path : '/'} );

                    console.log(">>>>>>>> cookie : "+util.inspect(req.cookies));

                    
                    //res.redirect("/proxy/"+req.params.algoID+'/'+proto );
                    res.redirect(process.env.PROXY_EXT_PROTOCOL+'://'+process.env.PROXY_EXT_NAME);//+req.params.algoID+'/'+proto );
                }
            });
        }); 
	}
	
});

var reuseOrCreateProxy = function(proxies, target, port){
	//
	for(var i=0; i < proxies.length; i++)
		if(proxies[i].get_port() == port)
			return proxies[i];
	
	console.log("Proxy not found, creating new one");
	var p = new Proxy(target, port);

	console.log("New proxy created and listening at port : "+p.get_port());
	proxies.push(p);
	return p;
}


module.exports = router;
