

var fs = require('fs'), restler = require('restler');


var testCreateImage = function(tarPath, algoname, cb){
	fs.stat(tarPath, function(err, stats) {
		restler.post("http://localhost:3000/createImage", {
	        multipart: true,
	        data: {
	            "name": algoname,
	            "dockerfile": restler.file(tarPath, null, stats.size, null, "application/gzip")
	        }
	    }).on("complete", function(data) {
	        console.log(data);

	        cb(data);
	    });
	});
};

var myCID = '';
var testCreateContainer = function(config, cb){
	var data = {};
	if(config.Image)
		data.Image = config.Image;
	
	if(config.APIListeningOn)
		data.APIListeningOn = config.APIListeningOn;
	
	if(config.nbCpus)
		data.nbCpus = config.nbCpus;
	
	if(config.mem)
		data.mem = config.mem;
	
	if(config.disk)
		data.disk = config.disk;
	
	restler.post("http://localhost:3000/createContainer", {
        data: data
    }).on("complete", function(resp) {
        myCID = JSON.parse(resp).cid;
        console.log('Created container id : '+myCID);
        console.log('---------------------------------');
        console.log('data : '+resp);
        console.log('---------------------------------');
        if(typeof cb !== 'undefined')
		    cb(resp);
    });

};

var testremoveContainer = function(cid, cb){
	restler.get("http://localhost:3000/removeContainer?cid="+cid).on("complete", function(data) {
        console.log(data);
        if(typeof cb !== 'undefined')
		    cb();
    });
};



testCreateImage('/home/kante/Bureau/test_hello_dockerfile/dockerfile.tar.gz', "HelloWorld", function(data){
	if(data instanceof Error)
		console.log("DIDN'T END WELL");
	else
		console.log("GONGRATS");
});
setTimeout(function(){
	testCreateContainer({
		"Image" : 'HelloWorld',
		"APIListeningOn" : 3000,
		"nbCpus" : 2,
		"mem" : 4194304,
		"disk" : 4194304
	}, function(data){
		console.log('Now removing it ...');
	/*
		setTimeout(function(){
			restler.get("http://localhost:"+JSON.parse(data).port+"?f_name=skante").on("complete", function(resp) {
		        console.log(resp);
		    });
	    },1000);
	*/

		setTimeout(function(){
			testremoveContainer(myCID);
		},1000*15);
	});
},2000);
