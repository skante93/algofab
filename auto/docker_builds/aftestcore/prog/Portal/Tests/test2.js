
/*
var conf = require("./config");

var am = conf.mongo.model("AlgosMeta");

am.find({}).populate({
	path : "author"
}).exec(function(err, res){
	res.forEach(function(r){
		if(!r.author)
			console.log("r.title : "+r.title);
	});
});
*/

var ddf = {
	print : function(){ console.log("Works"); },
	callprint : function(){ ddf.print(); }
}

setTimeout(function(){ ddf.callprint() },1000);