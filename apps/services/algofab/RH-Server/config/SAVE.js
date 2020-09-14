

var spawnSync = require('child_process').spawnSync;
var spawn = require('child_process').spawn;
var fs = require('fs');
var util = require('util');

var Proxy = require('../utils/proxy');

var State = {};

var Stringifier = function(){
    var cache = [];
    return function (key, value) {
            
            if(cache.indexOf(value) !== -1){
                return;
            }

            cache.push(value);

            if (typeof(value) === 'function') {
                if(value.toString() != "function () { [native code] }")
                    return value.toString();
            }
            return value;
    }
}


var Parser = function(key, value) {
    
    if (key === "") return value;
    
    if(key == '_proxies'){
        for(var i=0; i < value.length; i++){
            try {
                if(! value[i].service_name || !value[i].username || !value[i].port ){
                    value.splice(i, 1);
                    i--;
                    continue;
                }

                value[i].service_url = kube.svc(value[i].service_name, value[i].username).url();
                
                if(value[i].service_url){
                        value.splice(i, 1);
                    i--;
                    continue;
                }
                
                value[i].proxy = new Proxy(value[i].service_url, value[i].port);
            }
            catch(e){
                console.log("Error : "+e);
                value.splice(i, 1); 
                i--;
            }
        }
        return value;
    }

    if (typeof value === 'string') {
        var rfunc = /function[^\(]*\(([^\)]*)\)[^\{]*(\{([^\}]*)\})*/;
        if (rfunc.test(value)) {
    /*      var args = match[1].split(',').map(function(arg) { return arg.replace(/\s+/, ''); });
            return new Function(args, match[2]);
    */   
            return eval('('+value+')');
        }
    }
    
    return value;
}

var Save = function(){
        fs.writeFile(__dirname+'/../SG_state', JSON.stringify(State, Stringifier()), {encoding  : 'utf8'}, (err) => {
            if(err){
                console.log("An error occured during the saving process");
                console.log(err);
            }
            else{
                console.log("SuperGloabls sucessfully saved.");
            }
        });    
}


if(fs.existsSync(__dirname+'/SG_state')){
    var saved = fs.readFileSync(__dirname+'/../SG_state', {encoding : 'utf8'});
    if(saved){
        try {
            State = JSON.parse(saved, Parser);
            console.log('Retrieved SuperGloabls saved value');
        }
        catch(Exception){
            console.log("---------------------------------------------------------------");
            console.log("Exception raised while parsing, starting SG over.");
            console.log(Exception);
            console.log("---------------------------------------------------------------");
        }
    }
}

module.exports = function(frequency){
    setInterval(function(){
        Save();
    }, frequency);
    return State;
}


