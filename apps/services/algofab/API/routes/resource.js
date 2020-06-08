
var express = require('express');
var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');
var restler = require('restler');
var request = require('request');

var spawnSync = require('child_process').spawnSync;



var User = mongo.model('User');  
var Algos = mongo.model('Algos');
var AlgosMeta = mongo.model('AlgosMeta');
var Article = mongo.model('Article');
var ArticleVersion = mongo.model('ArticleVersion');
var demoSessionID = mongo.model('demoSessionID');
var Subscriptions = mongo.model('Subscriptions');
var AVReports = mongo.model('AVReports');

// var collections = {
// 	User : User,
// 	Algos : Algos,
// 	AlgosMeta : AlgosMeta,
// 	demoSessionID : demoSessionID,
// 	Subscriptions : Subscriptions
// }

var router = express.Router();


// router.use(function(req, res, next){
// 	console.log("##### This is it! #####");
// 	console.log(" req.path : ", req.path);
// 	console.log(" req.url : ", req.url);
// 	next();

// });



router.get('/:articleID/version/:versionID/download', function(req, res){
	console.log("----------------------------------------------------------");
    console.log("\t\t ALGO : MIDDLEWARE 8");
    console.log("----------------------------------------------------------");

    if (!req.query.agreement){
    	return res.end('query parameter "agreement" is required');
    }
    if (!req.query.licence){
    	return res.end('query parameter "licence" is required');
    }

	if (!fs.existsSync(process.cwd()+'/../Portal/resourceData/'+req.params.versionID+'.tar')){
		return res.status(404).end("Resource data does not exist");
	}
	else{
		res.sendFile(process.cwd()+'/../Portal/resourceData/'+req.params.versionID+'.tar');
		
		ArticleVersion.update({_id: req.params.versionID}, {
			$push: {
				downloads : {
					username: req.session.user.username, 
					agreementiD : req.query.agreement, 
					licenceID : req.query.licence
				}
			}
		}, function(err){
			console.log(err? err : "Download recorded");
		});
	}
});

router.post('/:articleID/version/:versionID/report', function(req, res){
	console.log("----------------------------------------------------------");
    console.log("\t\t ALGO : MIDDLEWARE 8 **");
    console.log("----------------------------------------------------------");

    console.log("req.body: ", req.body);
    
    var addressedTo = req.body.authorID, message = req.body.report;

	if( !(addressedTo && message ) ){
		console.log("REQ.BODY : "+util.inspect(req.body));
		return res.render('bugreports', { title : "Bug Reports", activeHeadersComp : 'user', user : req.session.user, reports : [], err : "Something is missing with the form" });
	}
	
	var n = new AVReports({ 
		emittedBy : req.session.user._id.toString(), 
		addressedTo : addressedTo, 
		message : message, 
		article_version : req.params.versionID
	});

	n.save(function(err){
		if(err){
			console.log("DB error : "+err);	
		}
		res.writeHead(200, {'Content-Type': 'application/json'}).end(JSON.stringify({status: 1, response: n}, null, 2));
		// res.json({status: 1, response: n});
	});
});

router.get('/:articleID/version/:versionID/delete', function(req, res){
	console.log("----------------------------------------------------------");
    console.log("\t\t ALGO : MIDDLEWARE 8");
    console.log("----------------------------------------------------------");

    ArticleVersion.remove({_id: req.params.versionID}, function(err){
		if (err){
			console.log(err)
			return res.status(500).json({status: 0, response: err});
		}
		Article.findById(req.params.articleID, function(err, article){

			if (err){
				console.log(err)
				return res.status(500).json({status: 0, response: err});
			}

			for(var i=0; i<article.versions.length; i++){
				if (article.versions[i].toString() == req.params.versionID){
					article.versions.splice(i, 1);
					break;
				}
			}

			article.save(function(err){
				if (err){
					console.log(err)
					return res.status(500).json({status: 0, response: err});
				}
				try{
					fs.unlinkSync(process.cwd()+'/../Portal/resourceData/'+req.params.versionID+'.tar')
				} catch(e){
					return res.status(500).json({status: 0, response: e});
				}

				// res.json({status: 1});
				res.writeHead(200, {'Content-Type': 'application/json'}).end(JSON.stringify({status: 1}, null, 2));				
			});
		});
	});
});


router.post('/:id/rate', function(req, res){
	if (!req.body.username){
		return res.status(400).json({status: 0, response: 'Field "username" is required.'}); 
	}
	if (!req.body.note){
		return res.status(400).json({status: 0, response: 'Field "note" is required.'}); 
	}
	if (!req.body.comment){
		return res.status(400).json({status: 0, response: 'Field "comment" is required.'}); 
	}

	Article.findById(req.params.id, function(err, data){
		if (err){
			console.log(err)
			return res.status(500).json({status: 0, response: err});
		}

		if (!data){
			return res.status(404).json({status: 0, response: 'Article with id "'+req.params.id+'" does not exist'}); 
		}

		var note = data.ratings.filter(e=> e.username == req.body.username);
		if (note.length != 0){
			for (var i=0; i<data.ratings.length; i++){
				if (data.ratings[i].username == req.body.username){
					data.ratings[i].note = parseInt(req.body.note);
					data.ratings[i].comment = req.body.comment;
				}
			}
		}
		else{
			data.ratings.push({
				username: req.body.username,
				note: parseInt(req.body.note),
				comment: req.body.comment
			});
		}

		data.save(function(err){
			if (err){
				console.log(err)
				return res.status(500).json({status: 0, response: err});
			}

			res.redirect('/article/'+req.params.id);
		})
	})
});

router.post('/:id/version', function(req, res){
	// console.log("req.body: ", req.body);

	var Form = new multiparty.Form();
	Form.parse(req, function(error, fields, files){
		//
		console.log("fileds: ", fields, "files: ", files);
		
		if (error){
			return res.status(500).json({status: 0, response: error}); 
		}

		if ( !( 'version' in fields) ){
			return res.status(400).json({status: 0, response: 'Field "version" is required.'}); 
		}

		if ( !( 'data' in files) ){
			return res.status(400).json({status: 0, response: 'Field "version" is required.'}); 
		}


		// if (!req.body.versionNumber){
		// 	return res.status(400).json({status: 0, response: 'Field "versionNumber" is required.'}); 
		// }
		var versionNumber = ( 'versionNumber' in fields)? fields.versionNumber[0] : mongo.Types.ObjectId().toString();

		ArticleVersion.findOne({ articleID: req.params.id, version : fields.version[0] }, function(err, av){

			if (err){
				console.log(err);
				return res.status(500).json({status: 0, response: err});
			}


			if (av){
				return res.status(400).json({status: 0, response: `The article already has a version "${fields.version[0]}"`});
			}

			new ArticleVersion({
				_id: versionNumber,
				articleID: req.params.id,
				version: fields.version[0],
				docs: 'documentation' in fields ? fields.documentation[0] : null
			}).save(function(err, av){
				if (err){
					console.log(err);
					return res.status(500).json({status: 0, response: err});
				}
				Article.findById(req.params.id, function(err, article){
					if (err){
						console.log(err);
						return res.status(500).json({status: 0, response: err});
					}
					article.versions.push(versionNumber);
					article.save(function(err, saved){
						if (err){
							console.log(err);
							return res.status(500).json({status: 0, response: err});
						}
						// res.json({ status:1, response: saved });
						
						//fs.writeFileSync(process.cwd()+'/../Portal/resourceData/'+av._id.toString()+'.tar')
						var cmd = spawnSync('mv', [ files.data[0].path,  process.cwd()+'/../Portal/resourceData/'+av._id.toString()+'.tar']);

						console.log("cmd.stderr.toString(): ", cmd.stderr.toString());

						res.writeHead(200, {'Content-Type': 'application/json'}).end(JSON.stringify({status: 1, response: av}, null, 2));
					});
				});
			});
		});
	});
});

router.get('/:id/versions', function(req, res){
	
	Article.findById(req.params.id).populate('versions').exec(function(err, article){

		if (err){
			console.log(err);
			return res.status(500).json({status: 0, response: err});
		}

		res.writeHead(200, {'Content-Type': 'application/json'}).end(JSON.stringify({status: 1, response: article.versions}, null, 2));
	});
});


router.get('/list', function(req, res){
	console.log("----------------------------------------------------------");
    console.log("\t\t ALGO : MIDDLEWARE 111");
    console.log("----------------------------------------------------------");
	

	console.log("req.query : ", req.query)
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
	if (req.query.asset_type){
		query.push( { asset_type: req.query.asset_type} );
	}
	if (req.query.technical_category){
		query.push( { technical_category: req.query.technical_category} );
	}
	if (req.query.business_category){
		query.push( { business_category: req.query.business_category} );
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

	if (req.query.authorID){
		query.push( { author : req.query.authorID } );
	} 

	query = (query.length == 0)? {} : { $and: query };

	var pop_Query = [
		{
			path : "author",
		}, 
		{
			path : "versions",
			match : {
				hidden : false
			}
		}
	];
	console.log("query :", query);
	Article.find(query).populate(pop_Query).exec(function(err, data){
		//
		if (err){
			//
			return res.status(500).json({status:0, response: err});
		}

		res.writeHead(200, {'Content-Type': 'application/json'}).end(JSON.stringify({status: 1, response: data}, null, 2));
	});		
});

router.delete('/:id', function(req, res){

	Article.findById({_id: req.params.id}).exec(function(err, article){
		if (err){
			console.log(err)
			return res.status(500).json({status: 0, response: err});
		}

		for (var i=0; i<article.versions.length; i++){
			if (fs.existsSync(process.cwd()+'/../Portal/resourceData/'+article.versions[i]+'.tar')) {
				try{
					fs.unlinkSync(process.cwd()+'/../Portal/resourceData/'+article.versions[i]+'.tar')
				} catch(e){
					console.log(err);
					return res.status(500).json({status: 0, response: e});
				}
			}
		}

		ArticleVersion.remove({articleID: req.params.id}, function(err){
			if (err){
				console.log(err);
				return res.status(500).json({status: 0, response: err});
			}

			Article.remove({_id: req.params.id}, function(err){
				if (err){
					console.log(err)
					return res.status(500).json({status: 0, response: err});
				}
				// res.json({status: 1});
				res.writeHead(200, {'Content-Type': 'application/json'}).end(JSON.stringify({status: 1}, null, 2));
			});
		});
	});
});
/*
router.get('/new', function(req, res){
	console.log("----------------------------------------------------------");
    console.log("\t\t ALGO : MIDDLEWARE 3");
    console.log("----------------------------------------------------------");

	var pop_message = req.session.pop_message;
	if (pop_message)
		req.session.pop_message = undefined;

	if (!req.session.user)
		res.redirect('/');
	else {
		res.render('article/new', 
			{pop_message : pop_message, title : "Register a new Algorithm", activeHeadersComp : 'algo', 
			user : req.session.user, categories: settings.ARTICLE_CATEGORIES});
	}
});

*/

router.get('/:id', function(req, res){
	console.log("----------------------------------------------------------");
    console.log("\t\t ALGO : MIDDLEWARE 8!!!!!!!!!!");
    console.log("----------------------------------------------------------");

	

	
		
	Article.findById(req.params.id).populate(['author',{path: 'versions', sort: { version: 'asc' } }]).exec(function(err, data){
		if( err ) {
			console.log(err);
			return res.status(500).json({status:0, response: err});
            //return res.redirect('/article/list');
		}

		if(!data) {
            
            return  res.status(404).json({status:0, response: "This algorithm doesn't exist (or not anymore)"});
        	// return res.redirect('/article/list');
        }

        console.log("Found article : ", data);
        data.versions.sort( (a,b)=> a.version > b.version? -1 : 1 );
        console.log("data.versions : ", data.versions);
        
        res.writeHead(200, {'Content-Type': 'application/json'}).end(JSON.stringify({status: 1, response: data}, null, 2));
	}); 
	
});


module.exports = router;




    