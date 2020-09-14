
var fs = require('fs');
var express = require('express');
var router = express.Router();

var spawnSync = require('child_process').spawnSync;


router.post('/', function(req, res){
	//
	if(!req.body.name){
		return res.status(400).end(JSON.stringify({status : "failure", message : 'Field "name" have to be specified.'}));
	}

	utils.kubectl(req.body.name).create({
		apiVersion: "v1",
		kind: "Namespace",
		metadata: {
			name: req.body.name
		}
	}).catch( (err)=>{
		console.log("Error : "+err);
		res.status(500).end(JSON.stringify({status : "failure", message : "Error while createing namespace"}))	;
	}).then( ()=>{
		res.end(JSON.stringify({status : "success", message : "done"}))	;
	});
});

router.delete('/', function(req, res){
	//
	if(!req.body.name){
		return res.status(400).end(JSON.stringify({status : "failure", message : 'Field "name" have to be specified.'}));
	}
	utils.kubectl(req.body.name).delete({
		apiVersion: "v1",
		kind: "Namespace",
		metadata: {
			name: req.body.name
		}
	}).catch( (err)=>{
		console.log("Error : "+err);
		res.status(500).end(JSON.stringify({status : "failure", message : "Error while deleteing namespace"}))	;
	}).then( ()=>{
		res.end(JSON.stringify({status : "success", message : "done"}))	;
	});
});

module.exports = router;