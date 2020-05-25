
var express = require('express');
var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');
var restler = require('restler');

var request = require('request');


var router = express.Router();

var Article = mongo.model('Article');


router.get('/', function(req, res){
	console.log("SEARCH CALLED!!");
	var query = [];
	if (req.query.name){
		query.push( {name: new RegExp(req.query.name)} );
	} 
	if (req.query.tag){
		query.push( {tag: req.query.tag } );
	} 
	if (req.query.text){
		query.push(  { $text: { $search: req.query.text } } );
	//	query.push( {$or: [{ short_intro: new RegExp(req.query.text) }, { description: new RegExp(req.query.text) }] } );
	} 
	if (req.query.date){
		query.push( {date: new Date(req.query.date)} );
	} 
	if (req.query.before_date){
		query.push( {date: {$gt : new Date(req.query.before_date)} } );
	} 
	if (req.query.after_date){
		query.push( {date: {$lt : new Date(req.query.after_date)} } );
	} 

	query = (query.length == 0)? {} : { $and: query };


	console.log("query : ", query);
	Article.find(query, function(err, data){
		console.log("err: ", err);
		if (err){
			return res.status(500).end(err);
		}
		console.log("Search result : ", data);
		res.render('article/list', 
			{
				title : 'Search results', 
				activeHeadersComp : 'search', 
				user : req.session.user, 
				articles : data, 
				search: true,
				categories: settings.ARTICLE_CATEGORIES,
				initiator : "catalog"
			}
		);
	})
});

module.exports = router;
