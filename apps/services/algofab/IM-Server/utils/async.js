
function Timeout(fn, interval) {
    var id = setTimeout(fn, interval);
    this.cleared = false;
    this.clear = function () {
        this.cleared = true;
        clearTimeout(id);
    };
}

/*
var kow = require('./kubeObjectWatcher');

var createKubeObjectsValidation = function(error, args, io, cb){
	if(error){
		return cb(error);
	}

	var watcher = new kow(args[0]);
	var t = watcher.getType(), n = watcher.getName();
	console.log("########## Yo : "+t+' <=> '+n);
	var rcTimeout = null;
	watcher.on('change', function(state){
		
		if(t=="Pod"){

			var blockedAtWaiting = state.startsWith("WAITING => ") && !state.endsWith("ContainerCreating");
			var terminated = state.startsWith("TERMINATED => ");

			if(blockedAtWaiting || terminated){
				watcher.stop();
				cb(state);
			}

			if(state == "running") {
				cb(null);
				watcher.stop();
			
			}
		}
		else if(t=="ReplicationController"){
			if(rcTimeout != null && rcTimeout instanceof Timeout && !rcTimeout.cleared){
				rcTimeout.clear();
			}

			if(state.split('/')[0] == state.split('/')[1]){
				cb(null);
				watcher.stop();
				return;
			}

			rcTimeout = new Timeout(function(){
				rcTimeout.clear();
				watcher.stop();
				cb(state);
			}, 60*1000);
		}
		else {
			cb(null);
			watcher.stop();
		}
	});
}
*/


class Async {
	

	constructor(f_tab, args_tab, io) {
		this.level = 0;
		this.f_tab = f_tab;
		this.args_tab = args_tab;
		this.io = io;
	}

	start(stepValidationFunction, callback){
		var ref = this;
		console.log("Async chain level = "+this.level+", tabOfFunc.length : "+this.f_tab.length);

		var ith = (this.level==0)? "First" : (this.level==1)? "Second" : (this.level==2)? "Third" : (this.level+1)+" th";

		console.log("----------level : "+this.level);
		if(this.level == this.f_tab.length-1){
			console.log("----------Last level");
			this.args_tab[this.level].push( function(err) {

				callback(err, ref.level);
			});
		}
		else{
			console.log("----------Level : "+this.level);
			this.args_tab[this.level].push( function(err) {

				stepValidationFunction(err, ref.args_tab[ref.level], ref.io, function(validationError){

					if(validationError){
						console.log("validationError : "+validationError);
						return callback(validationError, ref.level);
					}

					ref.level++;
					ref.start(stepValidationFunction, callback);
				}); 
			});
		}

		var f = Object.create(this.f_tab[this.level].prototype);
		this.f_tab[this.level].apply(f, this.args_tab[this.level]);
	}
}

/*
var asynchronousChain = function(tabOfFunc, args, level, callback, creation){
	if (typeof level === 'function') {
		if(typeof callback === 'boolean'){
			creation = callback;
		}

		callback = level;
		level = 0;
	}

	console.log("Async chain level = "+level+", tabOfFunc.length : "+tabOfFunc.length);
	
	var f = Object.create(tabOfFunc[level].prototype);
	var ith = (level==0)? "First" : (level==1)? "Second" : (level==2)? "Third" : (level+1)+" th";

	console.log("----------level : "+level);
	if(level == tabOfFunc.length-1){
		console.log("----------Last level");
		args[level].push(
			function(err, result) {
				if(err){
					console.log("  --  Async : Error on last Object");
					callback(err, level);
				}
				else{
					if(creation == true) {
						console.log('///////////:: creation is true');
						var watcher = new kow(args[level][0]);
						checkKubecObjectHealth(watcher, function(error){
							if(error){
								return callback(ith+" Object : "+error, level);
							}
							console.log("  --  Async : last Object OK ");
							callback(null);
						});
					}
					else{
						console.log('///////////:: creation is false');
						console.log("  --  Async : last Object OK ");
						callback(null);
					}
				}
			}
		);
		
	}
	else{
		console.log("----------Level : "+level);
		args[level].push(
			function(err, result) {
				if(err){
					console.log("  --  Async : Error on "+ith+" Object");
					callback(err, level);
				}
				else{
					if(creation == true) {

						console.log('///////////:: creation is true');
						var watcher = new kow(args[level][0]);
						checkKubecObjectHealth(watcher, function(error){
							if(error){
								return callback(ith+" Object : "+error, level);
							}
							console.log("  --  Async : last Object OK ");
							asynchronousChain(tabOfFunc, args, level+1, callback, creation);
						});
					}
					else{

						console.log('///////////:: creation is false');
						console.log("  --  Async : last Object OK ");
						asynchronousChain(tabOfFunc, args, level+1, callback, creation);
					}
				}
			}
		);

	}

	tabOfFunc[level].apply(f, args[level]);
}
*/
module.exports = Async;
/*
function printsomething( st, cb ){
	if (typeof cb === 'undefined' && typeof st === "function"){
		cb = st;
		st = undefined;
	}

	if(st){ 
		console.log(st);
		cb(null, st) 
	}
	else{
		cb("error");
	}
}

function printsomethingelse( st1, st2, cb ){
	
	console.log(st1+st2);
	cb(null, st1+st2);
}

asynchronousChain([printsomething, printsomething, printsomething, printsomethingelse], 
	[ ["Hello"], ["\ti am"], ["\t\tKANTE"], ['\t\t\tThank', " you"] ], function(err, res){
	if(err){
		console.log("Ended with error");
	}
	else{
		console.log("Ended without error");
	}
});
*/