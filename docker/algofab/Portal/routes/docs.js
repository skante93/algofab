
var express = require('express');
var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');
var restler = require('restler');

var request = require('request');


var router = express.Router();

var getDocWithID = function(id, parent){
	if (typeof parent === 'undefined' || parent == null){
		parent = settings.DOCS;
	}

	for(var i=0;i<parent.length; i++){
		if (parent[i].id == id){
			return parent[i];
		}
		if ("sub" in parent[i]){
			var s = getDocWithID(id, parent[i].sub);
			if (s != null){
				return s;
			}
		}
	}
	return null;
}

router.all('*', function(req, res){
	//

	var docs = getDocWithID(req.query.id);
	if (docs == null){
		return res.redirect('/docs?id=getting_started');
	}
	
	console.log("docs:", docs);
	res.render(docs.template, { 
		user: req.session.user, 
		title: docs.title, 
		docs: settings.DOCS 
	});
});

module.exports = router;
