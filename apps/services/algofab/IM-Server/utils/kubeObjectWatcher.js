
var spawnSync = require('child_process').spawnSync;
var events = require('events');
var fs = require('fs');

var watcher = function(type, name, ns){
	if(arguments.length == 1){

		var spec = JSON.parse(fs.readFileSync(type, "utf8"));

		type = spec.kind;
		name = spec.metadata.name;
		ns = spec.metadata.namespace;

		console.log("GOT params from file : ");
		console.log("\t type : "+type);
		console.log("\t name : "+name);
		console.log("\t ns : "+ns);
	}

	if(typeof ns === 'undefined')
		ns = "default";
	
	this.type = type;
	this.name = name;
	this.ns = ns;
	
	var ref = this;
	var events = require('events');
	this.eventEmitter = new events.EventEmitter();

	var nsctl = utils.kubectl(ns);
	// Stops this watcher after 10 seconds
	setTimeout(function(){ console.log("Stopping watcher!"); ref.stop(); }, 20*1000);
	
	var interv = setInterval(function(){
		// var cmd = spawnSync('kubectl', ['get', type, name, '-o', 'json', '-n', ns]);
		// var out = cmd.stdout.toString(), err = cmd.stderr.toString();
		nsctl.get({
			kind: type,
			metadata: {
				name: name
			}
		}).then((out)=>{
			//console.log("kubeObjectWatcher: out : "+JSON.stringify(out, null, 2));
			var old = ref.status;//, out = JSON.parse(out);
			//console.log("out.kind : "+out.kind);

			if(type == "Pod"){
				containerStatuses = out.status.containerStatuses;
				console.log("containerStatuses: old : "+JSON.stringify(containerStatuses, null, 2));
				for (var i=0; i<containerStatuses.length; i++){
					console.log("kubeObjectWatcher: old : "+old);
					//console.log('containerStatuses['+i+'] : '+require('util').inspect(containerStatuses[i])+'  waiting : '+
					//	Boolean(containerStatuses[i].state.waiting)+", terminated : "+Boolean(containerStatuses[i].state.terminated));

					if(containerStatuses[i].state.waiting ){
						ref.status = containerStatuses[i].state.waiting.reason;
						ref.status = "WAITING => " +((containerStatuses[i].name)? containerStatuses[i].name+' : '+ref.status : ref.status);
						ref.message = containerStatuses[i].state.waiting.message;
						//console.log('""""""""" ref.status : '+ref.status);
						if (old != ref.status)
							ref.eventEmitter.emit('change', ref.status, ref.message);
						return;
					}
					else if(containerStatuses[i].state.terminated){
						ref.status = containerStatuses[i].state.terminated.reason;
						ref.status = "TERMINATED => " +((containerStatuses[i].name)? containerStatuses[i].name+' : '+ref.status : ref.status);
						ref.message = containerStatuses[i].state.terminated.message;
						if (old != ref.status)
							ref.eventEmitter.emit('change', ref.status, ref.message);
						return;
					}
				}
				ref.status = "running";
				if (old != ref.status)
					ref.eventEmitter.emit('change', ref.status);
			}
			else if (type == "ReplicationController"){
				ref.status = (out.status.readyReplicas || "0" )+"/"+out.status.replicas;
				if (old != ref.status)
					ref.eventEmitter.emit('change', ref.status);
			}
			else if (type == "Service"){
				ref.status = "Configured"
				if (old != ref.status)
					ref.eventEmitter.emit('change', ref.status);
			}
		}).catch( (err)=>{
			console.log("err : "+err);
			ref.eventEmitter.emit('stop', err.toString());
			ref.eventEmitter.emit('err', err.toString());
			if(err.toString().startsWith('Error from server (NotFound):')){
				ref.eventEmitter.emit('not found', type, name);
			}
			clearInterval(interv);
			return;
		});
				
	}, 2000);

	this.on = function(str, action){
		ref.eventEmitter.on(str, action);
	};

	this.getType = function(){ return ref.type;};
	this.getName = function(){ return ref.name;};
	this.getNs = function(){ return ref.ns;};
	this.getStatus = function(){ return this.status};
	
	this.stop = function(){
		clearInterval(interv);
		ref.eventEmitter.emit('stop', ref.status);
	};
	return this;
}

module.exports = watcher;

/*
var w = watcher("Pod", "jdoe-eyesnap-web", "jdoe");
w.on("change", function(s){
	console.log("s : "+s);
});

w.on("not found", function(type, name){
	console.log(type + ' '+name+' does not exist');
});

setTimeout(function(){
	console.log("status : "+w.getStatus());
}, 9000);
*/
