
var express = require('express');
var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');
var restler = require('restler');
var request = require('request');





var User = mongo.model('User');  
var Algos = mongo.model('Algos');
var AlgosMeta = mongo.model('AlgosMeta');
var Article = mongo.model('Article');
var ArticleVersion = mongo.model('ArticleVersion');
var ArticleVersionData = mongo.model('ArticleVersionData');
var demoSessionID = mongo.model('demoSessionID');
var Subscriptions = mongo.model('Subscriptions');
var AVReports = mongo.model('AVReports');


var KNOWN_PORTS = {
	"80": { name: "HTTP" },
	"443": { name: "HTTPS" }
}

// var collections = {
// 	User : User,
// 	Algos : Algos,
// 	AlgosMeta : AlgosMeta,
// 	demoSessionID : demoSessionID,
// 	Subscriptions : Subscriptions
// }

var router = express.Router();


router.use(function(req, res, next){
	console.log("##### This is it! #####");
	console.log(" req.path : ", req.path);
	console.log(" req.url : ", req.url);
	next();

});



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

	
	var d_path = process.cwd()+'/resourceData/'+req.params.versionID+'.tar';
	
	//res.sendFile(process.cwd()+'/resourceData/'+req.params.versionID+'.tar');
	Article.findById(req.params.articleID, function(err, article){
		if (err){
			console.log(err);
			return res.status(500).end(err);
		}
		ArticleVersion.findById(req.params.versionID).populate('data').exec(function(err, av){
			if (err){
				console.log(err);
				return res.status(500).end(err);
			}
			
			//console.log("av gotten, here is data : ", av.data);
			
			if (av.data){
				res.writeHead(200, {
			        'Content-Type': av.data.type,
			        'Content-Disposition': `attachment; filename="${av.data.name}"`
			    });
			    //const download = Buffer.from(av.data.data.toString('utf-8'), 'base64');
			    const d = av.data.data.split(';base64,')[1];
			    res.end(d, 'base64');
			}
			else if (fs.existsSync(d_path)){
				res.sendFile(d_path);
			}
			else {
				res.status(404).end("Resource does not exist")
			}

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
		});
	});
		
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
		res.redirect('/article/'+req.params.articleID);
	});
});

router.get('/:articleID/version/:versionID/delete', function(req, res){
	console.log("----------------------------------------------------------");
    console.log("\t\t ALGO : MIDDLEWARE 8");
    console.log("----------------------------------------------------------");

    ArticleVersion.remove({_id: req.params.versionID}, function(err){
		if (err){
			console.log(err)
			return res.end(err);
		}
		Article.findById(req.params.articleID, function(err, article){

			if (err){
				console.log(err)
				return res.end(err);
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
					return res.end(err);
				}
				try{
					fs.unlinkSync(process.cwd()+'/resourceData/'+req.params.versionID+'.tar')
				}catch(e){
					if (e.code != 'ENOENT'){
						return res.end(err);
					}
				}
				res.redirect('/article/'+req.params.articleID);				
			});
		});
	});
});


router.post('/:id/rate', function(req, res){
	if (!req.body.username){
		return res.end('Field "username" is required.')
	}
	if (!req.body.note){
		return res.end('Field "note" is required.')
	}
	if (!req.body.comment){
		return res.end('Field "comment" is required.')
	}

	Article.findById(req.params.id, function(err, data){
		if (err){
			console.log(err)
			return res.end(err);
		}

		if (!data){
			return res.end('Article with id "'+req.params.id+'" does not exist');
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
				return res.end(err);
			}

			res.redirect('/article/'+req.params.id);
		})
	})
});

router.post('/:id/version', function(req, res){
	console.log("req.body: ", req.body);

	var form = new multiparty.Form();
	console.log("OK here!!!");
		
	form.parse(req, (error, fields, files)=>{
		console.log("error: ", error, "; fields : ", fields, "; files : ", files);
		var version = (error)? req.body.version : fields.version[0];
		var dataID = (error)? req.body.dataID : "dataID" in fields? fields.dataID[0] : null;
		var documentation = (error)? req.body.documentation : "documentation" in fields? fields.documentation[0] : null;

		if (!version){
			return res.end('Field "version" is required.')
		}
		console.log("OK here!!!");
		
		Article.findById(req.params.id, function(err, article){
			if (err){
				return res.end(err);
			}	
			if (!article){
				return res.end('Resource with id "'+req.params.id+'" does not exist');
			}

			if (article.versions.indexOf(version) >=0 ){
				return res.end(`The article already has a version "${req.body.version}"`);
			}

			

			var definition = {
				articleID: req.params.id,
				version: version,
				docs: documentation
			};
			if (dataID){
				definition.data = dataID;
			}

			var record_and_respond = ()=>{
				new ArticleVersion(definition).save(function(err, newArticleVersion){
					if (err){
						console.log(err);
						return res.end(err);
					}
					article.versions.push(newArticleVersion._id.toString());
					article.save(function(err){
						if (err){
							console.log(err);
							return res.end(err);
						}
						res.redirect('/article/'+req.params.id+'?version='+version);
					});
				});
			}

			if ( article.asset_type == settings.ARTICLE_CATEGORIES.types.filter(e => e.name == "As a Service")[0].id ) {
				if (! ('spec' in files) ){
					return res.end('Field "Portainer spec" is required.');
				}
				var spec = fs.readFileSync(files.spec[0].path);
				try{
					spec = JSON.parse(spec);
				}
				catch(e){
					return res.end(e);
				}
				
				utils.infraManager.portainer.run(spec).then(()=>{
					definition.spec = {
						type: 'portainer',
						definition: spec
					} 

					record_and_respond();
				}).catch( e => {
					res.end(e);
				});


			}
			else{
				record_and_respond();
			}
		});

	});
});

router.get('/:id/delete', function(req, res){

		Article.findById({_id: req.params.id}).exec(function(err, article){
			if (err){
				console.log(err)
				return res.end(err);
			}

			for (var i=0; i<article.versions.length; i++){
				if (fs.existsSync(process.cwd()+'/resourceData/'+article.versions[i]+'.tar')) {
					fs.unlinkSync(process.cwd()+'/resourceData/'+article.versions[i]+'.tar')
				}
			}
			ArticleVersion.remove({articleID: req.params.id}, function(err){
				if (err){
					console.log(err)
					return res.end(err);
				}
				Article.remove({_id: req.params.id}, function(err){
					if (err){
						console.log(err)
						return res.end(err);
					}
					res.redirect('/article/list');
				});
			});
		});
});

router.get('/list', function(req, res){
	console.log("----------------------------------------------------------");
    console.log("\t\t ALGO : MIDDLEWARE 111");
    console.log("----------------------------------------------------------");
	var pop_message = req.session.pop_message;
	if (pop_message)
		req.session.pop_message = undefined;

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
			return res.end('Error : '+err+', come back <a href="/"> home </a>');
		}

		else{
			console.log("DATA : "+data);
			res.render('article/list', 
				{
					pop_message : pop_message, 
					title : 'My Algorithms', 
					activeHeadersComp : 'user', 
					user : req.session.user, 
					articles : data, 
					algos : data, 
					categories: settings.ARTICLE_CATEGORIES,
					initiator : "catalog"
				}
			);
		}
	});		
});

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


router.get('/:id', function(req, res){
	console.log("----------------------------------------------------------");
    console.log("\t\t ALGO : MIDDLEWARE 8!!!!!!!!!!");
    console.log("----------------------------------------------------------");

	var pop_message = req.session.pop_message;
	if (pop_message)
		req.session.pop_message = undefined;

	if (!req.session.user)
		res.redirect('/signin?redirect='+req.originalUrl);
	else {
		
		var exec = Article.findById(req.params.id).populate(['author',{path: 'versions', sort: { version: 'asc' } }]).exec(function(err, data){
			if( err ) {
				console.log("err");
				return res.end('Some database error occured, come back <a href="/"> home </a>.');
	            //return res.redirect('/article/list');
			}
			if(!data) {
                
                return res.end("This resource doesn't exist (or not anymore), come back <a href=\"/\"> home </a>.");
            	// return res.redirect('/article/list');
            }
            console.log("Found article : ", data);
            data.versions.sort( (a,b)=> a.version > b.version? -1 : 1 );
            console.log("data.versions : ", data.versions);
            var ratings_counts = {one: 0, two: 0, three:0, four:0, five:0}, ratings_mean = 0;
            if (data.ratings.length != 0){
            	ratings_counts = {
	            	one: data.ratings.filter(e=> e.note==1).length,
	            	two: data.ratings.filter(e=> e.note==2).length,
	            	three: data.ratings.filter(e=> e.note==3).length,
	            	four: data.ratings.filter(e=> e.note==4).length,
	            	five: data.ratings.filter(e=> e.note==5).length,
            	};
            
            	ratings_mean = (ratings_counts.one + 2*ratings_counts.two + 3*ratings_counts.three + 4* ratings_counts.four + 5* ratings_counts.five) / data.ratings.length;
            }

            console.log("ratings_counts: ", ratings_counts);
            console.log("ratings_mean: ", ratings_mean);

            var is_as_a_service = data.asset_type == settings.ARTICLE_CATEGORIES.types.filter(e => e.name == "As a Service")[0].id;
            
            var demo_accesses = {};

            if (is_as_a_service){
            	//console.log("data: ", data);
            	data.versions.forEach(function(ver){
            		//console.log("[", ver.version, " -", ver._id, " ]", " | ver.spec.definition: ", ver.spec.definition);
	            	if ("spec" in ver && ver.spec.type == "portainer"){
	            		
	            		if ("definition" in ver.spec && "HostConfig" in ver.spec.definition){
	            	
		            		var portsSpec = ver.spec.definition.HostConfig.PortBindings;

		            		demo_accesses[ver.version] = [];

		            		for(var port in portsSpec){
		            			var p_info = (port.split('/')[0] in KNOWN_PORTS)? KNOWN_PORTS[ port.split('/')[0] ] : null;
		            			demo_accesses[ver.version].push({i_url: settings.DEMO_URL, i_port : portsSpec[port][0].HostPort, t_port: port, service: p_info == null ? null: p_info.name});
		            		}
		            	}
	            	}
	            });
            }

            var page = ( is_as_a_service )? 'article/page_as_a_service' : 'article/page';
            
            res.render(page, {
            	pop_message : pop_message, 
            	title : 'Page : algorithm ' + data.title, 
            	activeHeadersComp : 'algo', 
            	user : req.session.user, 
            	article : data,
            	algo : data,
            	generator : "algo", 
            	categories: settings.ARTICLE_CATEGORIES,
            	new_version_id : mongo.Types.ObjectId().toString(),
            	selected_version: req.query.version,
            	ratings: {
            		counts: ratings_counts,
            		mean: ratings_mean
            	},
            	displayed_version: req.query.version,
            	demo_accesses: demo_accesses
            });

		}); 
	}
});


module.exports = router;




    