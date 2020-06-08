
var express = require('express');
var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');
var restler = require('restler');

var request = require('request');


var router = express.Router();

var getDocWithID = function(id, parent, parentIds, level){
	if (typeof parent === 'undefined' || parent == null){
		parent = settings.DOCS;
	}
	if (typeof parentIds === 'undefined' || parentIds == null){
		parentIds = [];
	}
	if (typeof level === 'undefined' || level == null){
		level = 0;
	}

	var tab = '  '.repeat(level);

	for(var i=0;i<parent.length; i++){
		//console.log(tab+"[i = "+i+"]", "parent: ", parent[i], ", parentIds: ", parentIds);
		if (parent[i].id == id){
		//	console.log(tab+"[i = "+i+"]", "pushing parent id: ", parent[i].id);
			parentIds.push(parent[i].id)
			parent[i].parentIds = parentIds;
			return parent[i];
		}
		else if ("sub" in parent[i]){
			var pid = JSON.parse(JSON.stringify(parentIds));
			pid.push(parent[i].id);

		//	console.log(tab+"[i = "+i+"]", "pushing pid: ", parent[i].id);
		//	console.log(tab+"[i = "+i+"]", "pid: ", pid, '\n');
			var s = getDocWithID(id, parent[i].sub, pid, level+1);
			if (s != null){
				return s;
			}
		}
	}
	return null;
}

router.all('*', function(req, res){
	//

	var currentDoc = getDocWithID(req.query.id);
	if (currentDoc == null){
		return res.redirect('/docs');
	}
	
	console.log("currentDoc:", currentDoc);
	res.render(currentDoc.template, { 
		user: req.session.user, 
		title: currentDoc.title, 
		docs: settings.DOCS,
		currentDoc: currentDoc
	});
});

module.exports = router;
