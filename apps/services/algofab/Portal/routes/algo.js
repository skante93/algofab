
var express = require('express');
var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');
var restler = require('restler');
var request = require('request');



var router = express.Router();
module.exports = function(SG){
	var User = SG.mongo.model('User');  
	var Algos = SG.mongo.model('Algos');
	var AlgosMeta = SG.mongo.model('AlgosMeta');
	var demoSessionID = SG.mongo.model('demoSessionID');
	var Subscriptions = SG.mongo.model('Subscriptions');
	
	var collections = {
		User : User,
		Algos : Algos,
		AlgosMeta : AlgosMeta,
		demoSessionID : demoSessionID,
		Subscriptions : Subscriptions
	}


	//var io = SG.io.of('/algos/new');
	
	router.get('/catalog', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t ALGO : MIDDLEWARE 111");
	    console.log("----------------------------------------------------------");
		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;


		if (!req.session.user)
			res.redirect('/');
		else {
			/*
				AlgosMeta.find().populate({
					path : "versions",
					match : { 
						"hidden" : false
					}
				}).count(function(err, max_nb_algos){
					if (req.query.page) {
						if(req.query.page < 0)
							req.query.page = 0;
						
						if(req.query.number){
							if (req.query.number < 0)
								req.query.number = 10;
							
							if(req.query.number * req.query.page > max_nb_algos)
								req.query.page = parseInt(max_nb_algos/req.query.number);
							
							AlgosMeta.find().populate({
								path : "versions",
								match : { 
									"hidden" : false 
								}
							}).sort( {'date': -1} ).skip(req.query.number * req.query.page ).limit(req.query.number).exec(function(err, data){
								if(err)
									res.end('Some database error occured, come back <a href="/"> home </a>');
								else
									res.render('algo_list2', 
										{
											pop_message : pop_message, 
											title : 'My Algorithms', 
											activeHeadersComp : 'user', 
											user : req.session.user, 
											algos : data, 
											initiator : "catalog",
											page : parseInt(req.query.page)
										}
									);
							});
							
						} else {
							if(10 * (req.query.page) > max_nb_algos) 
								req.query.page = parseInt(max_nb_algos/10);
							
							AlgosMeta.find().populate({
								path : "versions",
								match : { 
									"hidden" : false 
								}
							}).sort ({'date': -1}).skip(10 * req.query.page ).limit(10).exec(function(err, data){
								if(err)
									res.end('Some database error occured, come back <a href="/"> home </a>');
								else
									res.render('algo_list2', 
										{
											pop_message : pop_message, 
											title : 'My Algorithms', 
											activeHeadersComp : 'user', 
											user : req.session.user, 
											algos : data, 
											initiator : "catalog",
											page : parseInt(req.query.page)
										}
									);
							});
						}
					} else {
						if(req.query.number){
							AlgosMeta.find().populate({
								path : "versions",
								match : { 
									"hidden" : false 
								}
							}).limit(req.query.number).exec(function(err, data){
								if(err)
									res.end('Some database error occured, come back <a href="/"> home </a>');
								else
									res.render('algo_list2', 
										{
											pop_message : pop_message, 
											title : 'Algorithms', 
											activeHeadersComp : 'algo', 
											user : req.session.user, 
											algos : data, 
											initiator : "catalog",
											page : 0
										}
									);
							});
						} else {
							AlgosMeta.find().populate({
								path : "versions",
								match : { 
									"hidden" : false 
								}
							}).limit(10).exec(function(err, data){
								if(err)
									res.end('Some database error occured, come back <a href="/"> home </a>');
								else
									res.render('algo_list2', 
										{
											pop_message : pop_message, 
											title : 'Algorithms', 
											activeHeadersComp : 'algo', 
											user : req.session.user, 
											algos : data, 
											initiator : "catalog",
											page : 0
										}
									);
							});
						}
					}
				});
			*/
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
			AlgosMeta.find().populate(pop_Query).exec(function(err, data){
				//
				if (err){
					//
					res.end('Error : '+error+', come back <a href="/"> home </a>');
				}

				else{
					console.log("DATA : "+data);
					res.render('algo_list', 
						{
							pop_message : pop_message, 
							title : 'My Algorithms', 
							activeHeadersComp : 'user', 
							user : req.session.user, 
							algos : data, 
							initiator : "catalog"
						}
					);
				}
			});
			/*
			paginatingAlgoList(collections, req.session.user.username, "catalog", {page : req.query.page, number : req.query.number}, function(err, data, real_pagination){
				//
				if (err){
					//
					res.end('Error : '+error+', come back <a href="/"> home </a>');
				}
				else{
					console.log("DATA : "+data);
					res.render('algo_list2', 
						{
							pop_message : pop_message, 
							title : 'My Algorithms', 
							activeHeadersComp : 'user', 
							user : req.session.user, 
							algos : data, 
							initiator : "catalog",
							page : real_pagination.page,
							number : real_pagination.number
						}
					);
				}
			});
			*/
		}
	});
	
	router.get('/new-algo', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t ALGO : MIDDLEWARE 3");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user)
			res.redirect('/');
		else {
			res.render('algo_new_meta', 
				{pop_message : pop_message, title : "Register a new Algorithm", activeHeadersComp : 'algo', 
				user : req.session.user});
		}
	});

	router.post('/new-algo', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t ALGO : MIDDLEWARE 4");
	    console.log("----------------------------------------------------------");
		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user)
			res.redirect('/');
		else {
			console.log("POST new-algo req.body : "+util.inspect(req.body));
			new multiparty.Form().parse(req, function(error, fields, files){
				var title, description, logo, keywords;
				
				if(error){
					title = req.body.title;
					description = req.body.description;

					fields.title = [title];
					fields.description = [description];
				}
				else{
					title = fields.title[0];
					description = fields.description[0];
					logo = (files.logo && files.logo[0].size != 0)? files.logo[0] : undefined;
				}

				console.log("title : "+title);
				console.log("description : "+description);
				console.log("keywords : "+keywords);
				console.log("logo : "+util.inspect(logo));
				console.log("fields : "+util.inspect(fields));

				SG.utils.dao.algo.new.validateUpload(fields, logo, function(err, logoPath){
					if (err){
						console.log("DB error");
						req.session.pop_message = {title : "Error", msg : err};
						
						res.redirect('/algo/new-algo'); 
						return;
					}
					var newAlgo = new AlgosMeta({
						title : title,
						description : description,
						keywords : keywords,
						author : req.session.user._id,
						logo : logoPath
					});
					
					newAlgo.save(function(saveErr){
						if(saveErr){
							console.log("DB error, could not save it");
							req.session.pop_message = {title : "Error", msg : "DB error"};
							res.redirect('/algo/new-algo'); 
						}
						else {
							console.log("Hey everything is fine now");
							req.session.pop_message = {title : "Confirmation", msg : "Algorithm successfully created"};
							res.redirect('/algo/new-algo'); 
							
							User.findById(req.params.id, function(err, user_to_update){
								if(err || !user_to_update){
									console.log('\nCloud not record owner for the algo\n');
									Algos.remove({_id : newAlgo._id}, function(){});
									res.status(500).end("DB error");
									return;
								}

								user_to_update.contributions.push(newAlgo._id);
								user_to_update.save(function(err){
									console.log("\nUser recorded as owner for the algo\n");
								});
							});
						}
					});
				});
				/*
				AlgosMeta.findOne({ title : req.body.title }).populate('author').exec(function( err, result ) {
					//
					if(err){
						console.log("DB error");
						req.session.pop_message = {title : "Error", msg : "DB error"};
						
						res.redirect('/algo/new-algo'); 
					}
					else if(result){
						console.log("Already exist");
						if(result.author.username == req.session.user.username){
							req.session.pop_message = {title : "Error", msg : 'You already created an algorithm "'+req.body.title+'", please choose another title.'};
							res.redirect('/algo/new-algo'); 
							
							console.log("\tI'm author");
						}
						else{
							req.session.pop_message = {title : "Error", msg : 'The title "'+req.body.title+'" is already taken by another user, please choose another title.'};
							res.redirect('/algo/new-algo'); 
							
							console.log("\tI'm not author");
						}
					}
					else {
						console.log("Cool let's create it");
						var newAlgo = {
							title : req.body.title,
							description : req.body.description,
							keywords : req.body.kwds,
							author : req.session.user._id
						};

						newAlgo = new AlgosMeta(newAlgo);
						newAlgo._id = SG.mongo.Types.ObjectId().toString();
						newAlgo.save(function(err){
							if(err){
								console.log("DB error, could not save it");
								req.session.pop_message = {title : "Error", msg : "DB error"};
								res.redirect('/algo/new-algo'); 
							}
							else {
								console.log("Hey everything is fine now");
								req.session.pop_message = {title : "Confirmation", msg : "Algorithm successfully created"};
								res.redirect('/algo/new-algo'); 
								
								User.findById(req.params.id, function(err, user_to_update){
									if(err || !user_to_update){
										console.log('\nCloud not record owner for the algo\n');
										Algos.remove({_id : newAlgo._id}, function(){});
										res.status(500).end("DB error");
										return;
									}

									user_to_update.contributions.push(newAlgo._id);
									user_to_update.save(function(err){
										console.log("\nUser recorded as owner for the algo\n");
									});
								});
							}
						});
					}
				});
				//res.render('algo_new_meta', {title : "Register a new Algorithm", activeHeadersComp : 'algo', user : req.session.user, received : JSON.stringify(req.body)});
				*/
			});
		}
	});
	/*
	router.post('/update-logo', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t ALGO : MIDDLEWARE 4");
	    console.log("----------------------------------------------------------");
		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user)
			res.redirect('/');
		else {
			console.log("POST new-algo req.body : "+util.inspect(req.body));
			new multiparty.Form().parse(req, function(error, fields, files){
				var title, description, logo, keywords;
				
				if(error){
					req.session.pop_message = {title : "Error", msg : "Could not correctly parse the request, are you sure it was multipart?"};
						
					res.redirect('/algo/new-algo'); 
					return;
				}
				if ( !files.logo || files.logo[0].size == 0){
					req.session.pop_message = {title : "Error", msg : "No file detected in the form"};
						
					res.redirect('/algo/new-algo'); 
					return;
				}

				console.log("id : "+fields.id[0]);
				console.log("username : "+fields.username[0]);
				console.log("files : "+util.inspect(files.logo[0]));
				
				SG.utils.dao.algo.new.updateLogo(fields.id[0], files.logo[0], fields.username[0], function(err){
					if (err){
						console.log("updateLogo Error : "+err);
						req.session.pop_message = {title : "Error", msg : err};
						
						res.redirect('/user/myalgos/'+fields.id[0]); 
						return;
					}
					req.session.pop_message = {title : "Confirmation", msg : "Logo successfully updated"};
					res.redirect('/user/myalgos/'+fields.id[0]); 
					
				});
				/*
				AlgosMeta.findOne({ title : req.body.title }).populate('author').exec(function( err, result ) {
					//
					if(err){
						console.log("DB error");
						req.session.pop_message = {title : "Error", msg : "DB error"};
						
						res.redirect('/algo/new-algo'); 
					}
					else if(result){
						console.log("Already exist");
						if(result.author.username == req.session.user.username){
							req.session.pop_message = {title : "Error", msg : 'You already created an algorithm "'+req.body.title+'", please choose another title.'};
							res.redirect('/algo/new-algo'); 
							
							console.log("\tI'm author");
						}
						else{
							req.session.pop_message = {title : "Error", msg : 'The title "'+req.body.title+'" is already taken by another user, please choose another title.'};
							res.redirect('/algo/new-algo'); 
							
							console.log("\tI'm not author");
						}
					}
					else {
						console.log("Cool let's create it");
						var newAlgo = {
							title : req.body.title,
							description : req.body.description,
							keywords : req.body.kwds,
							author : req.session.user._id
						};

						newAlgo = new AlgosMeta(newAlgo);
						newAlgo._id = SG.mongo.Types.ObjectId().toString();
						newAlgo.save(function(err){
							if(err){
								console.log("DB error, could not save it");
								req.session.pop_message = {title : "Error", msg : "DB error"};
								res.redirect('/algo/new-algo'); 
							}
							else {
								console.log("Hey everything is fine now");
								req.session.pop_message = {title : "Confirmation", msg : "Algorithm successfully created"};
								res.redirect('/algo/new-algo'); 
								
								User.findById(req.params.id, function(err, user_to_update){
									if(err || !user_to_update){
										console.log('\nCloud not record owner for the algo\n');
										Algos.remove({_id : newAlgo._id}, function(){});
										res.status(500).end("DB error");
										return;
									}

									user_to_update.contributions.push(newAlgo._id);
									user_to_update.save(function(err){
										console.log("\nUser recorded as owner for the algo\n");
									});
								});
							}
						});
					}
				});
				//res.render('algo_new_meta', {title : "Register a new Algorithm", activeHeadersComp : 'algo', user : req.session.user, received : JSON.stringify(req.body)});
				* /
			});
		}
	});
	
	
	router.get('/new-version', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t ALGO : MIDDLEWARE 2");
	    console.log("----------------------------------------------------------");
		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user)
			res.redirect('/');
		else {
			res.render('algo_new', {pop_message : pop_message, title : "Register a new Algorithm", activeHeadersComp : 'algo', user : req.session.user});
		}
	});
	
	router.get('/:id/version/:version/edit', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t ALGO : MIDDLEWARE 6");
	    console.log("----------------------------------------------------------");
	    
		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user)
			res.redirect('/');
		else {

			AlgosMeta.findById(req.params.id).populate(['author', {
				path : "versions",
				match : {
					version : req.params.version
				}
			}]).exec(function(err, data){
				//res.end('Some database error occured, come back <a href="/"> home </a>.');
				console.log(err || 'data : '+data);
				if(err) {
					console.log("Err : "+err);
					req.session.pop_message = {title : "err", msg : err.toString()};
		            res.redirect('/algo/catalog');
				}
				if(!data || data.versions.length == 0 ) {
	                //res.end("This algorithm doesn't exist (or not anymore), come back <a href=\"/\"> home </a>.");
	            	res.redirect('/algo/catalog');
	            }
	            else if(data.versions[0].hidden == true && req.session.user.username != data.author.username){
	                //res.end("Not allowed to access this algorithm, come back <a href=\"/\"> home </a>.");
	            	res.redirect('/algo/catalog');
	            }
	            else {
	            	var kube = data.versions[0].deployment.kubernetes, pods = [], rcs = [];
	            	for (var i=0; i < kube.length; i++){
	            		if( kube[i].kind == 'Pod' )
	            			pods.push(kube[i].metadata.name);
	            		if( kube[i].kind == 'ReplicationController' )
	            			rcs.push(kube[i].metadata.name);
					}
						
	            	var sock = require('socket.io-client')(SG.params.IM_PROTOCOL + SG.params.IM_ADDR +':'+ '32081'+"/new-kubernetes-objects");
					var cmpt = 0;
					var sockConnected = false;
					sock.on('connect', function(){
						const room = SG.mongo.Types.ObjectId().toString();
						sock.emit('room', room);
						sockConnected = true;
						console.log('\n\n\nSOCKET.IO-CLIENT : CONNECTED TO IM-SERVER SOCKET OF /kubernetes-objects\n\n\n');
						if(res.headersSent){
							console.log("HEADERS ALREADY SENT");
							sock.disconnect();
							return;
						}
						
						sock.on('error', function(error){
			            	console.log(' <<< ROOM : '+room+' >>> | <ERROR> | MESSAGE : '+error);
						});

						sock.on('disconnect', function(reason){
							console.log(' <<< ROOM : '+room+' >>> | <DISCONNECT> | MESSAGE : '+reason);
						});

						console.log(' <<< ROOM >>> | ID : '+room);
						res.render('algo_edit', 
		                    {
		                    	pop_message : pop_message, 
		                    	title : 'Page : algorithm ' + data.title, 
		                    	activeHeadersComp : 'algo', 
		                    	user : req.session.user, 
		                    	algo : data,
		                    	pods : pods,
		                    	rcs :  (rcs.length !=0)? rcs:undefined
		                    }
		                );
			            

						SG.io.of('/algo/edit/').on('connection', function(socket){
							console.log('SG SOCKET OF /algo/edit : CONNECTION ESTABLISHED');

							sock.emit('states', room, data.versions[0]._id);
							sock.on('states', function(kind, name, result){
								console.log(' PORTAL <<< IM | ROOM : '+room+' | <STATES> | KIND : '+kind+', NAME : '+name);
								socket.emit('state', kind, name, result);
							});
								
							socket.on('describe', function(kind, name){
								console.log(' PORTAL >>> IM | ROOM : '+room+' | <DESCRIBE> | KIND : '+kind+', NAME : '+name);
								sock.emit('describe', room, kind, name, data.author.username);
							});
							sock.on('describe', function(kind, name, result){
								console.log(' PORTAL <<< IM | ROOM : '+room+' | <DESCRIBE> | KIND : '+kind+', NAME : '+name);
								socket.emit('describe', kind, name, result);
							});
							socket.on('full description', function(kind, name){
								console.log(' PORTAL >>> IM | ROOM : '+room+' | <FULL DESCRIPTION> | KIND : '+kind+', NAME : '+name);
								console.log('\nSG SOCKET ON full description : "'+kind+'" '+name);
								sock.emit('full description', room, kind, name, data.author.username);
							});
							sock.on('full description', function(kind, name, result){
								console.log(' PORTAL <<< IM | ROOM : '+room+' | <FULL DESCRIPTION> | KIND : '+kind+', NAME : '+name);
								socket.emit('full description', kind, name, result);
							});
							socket.on('clean', function(){
								console.log(' PORTAL >>> IM | ROOM : '+room+' | <CLEAN>');
								if (sock){
									sock.emit('clean', room);
									sock.disconnect();
								}
							});
						});
					
						
							
					});
					
					
					
					setTimeout(function(){
						if(!sockConnected){
							res.render('algo_edit', 
			                    {
			                    	pop_message : pop_message, 
			                    	title : 'Page : algorithm ' + data.title, 
			                    	activeHeadersComp : 'algo', 
			                    	user : req.session.user, 
			                    	algo : data
			                    }
			                );
						}
					}, 15000);
	            }
			});
		}
	});
	
	router.post('/:id/version/:version/edit', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t ALGO : MIDDLEWARE 7");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user)
			res.redirect('/');
		else {
			console.log('show me req.body : '+require('util').inspect(req.body));
			AlgosMeta.findById(req.params.id).populate(['author', {
				path : 'versions',
				match : {
					version : req.params.version
				}
			}]).exec(function(err, data){
				if(err) {
	                //res.end('Some database error occured, come back <a href="/"> home </a>.');
	                //req.session.pop_message = {title : "Error", msg : 'DB error'};
	                //res.redirect('/algo/catalog');
	                res.end('<script>'+
							'window.top.window.alert("a database error occurred");'+
						'</script>');
				}
				else if(!data ){
	                //res.end("This algorithm doesn't exist (or not anymore), come back <a href=\"/\"> home </a>.");
	                //req.session.pop_message = {title : "Error", msg : 'The algorithm does not exist'};
					//res.redirect('/algo/catalog');
					res.end('<script>'+
							'window.top.window.alert("The algorithm does not exist");'+
						'</script>');
				}
				else if (data.versions.length ==0 ){
					//req.session.pop_message = {title : "Error", msg : 'This version of the algorithm does not exist'};
					//res.redirect('/algo/catalog');
					res.end('<script>'+
							'window.top.window.alert("This version of the algorithm does not exist");'+
						'</script>');
				}
	            else if(data.versions[0].hidden == true && req.session.user.username != data.author.username) {
	                //res.end("Not allowed to access this page (cause you're not th author), come back <a href=\"/\"> home </a>.");
	                //req.session.pop_message = {title : "Error", msg : 'Not allowed to access this page cause you are not th author'};
					//res.redirect('/algo/catalog');
					res.end('<script>'+
							'window.top.window.alert("Not allowed to access this page cause you are not th author");'+
						'</script>');
	            }
	            else {
	            	if(!req.body.triggeredBy) {
	            		//req.session.pop_message = {title : "Error", msg : 'Operation not understood'};
	            		//res.redirect('/algo/catalog');
	            		res.end('<script>'+
								'window.top.window.alert("Operation not understood");'+
							'</script>');
	            	}
	            	else {
	            		if(req.body.triggeredBy == "hide"){
	            			Algos.update({meta : req.params.id, version : req.params.version }, {$set : {hidden : !data.versions[0].hidden}}, function(error, updated){
	            				if(err){
	            					res.end('<script>'+
	            								'window.top.window.alert("a database error occurred");'+
	            							'</script>');
	            				}
	            				else{
	            					console.log('updated.hidden : '+updated.hidden);
	            					//req.session.pop_message = {title : "Success", msg : 'Hidden is now : '+!data.versions[0].hidden};
	            					//res.redirect('/algo/catalog');

	            					res.render('algo_edit', {iframing : {cause : 'hidden', msg : !data.versions[0].hidden}});
	            				}

	            			});
	            		}
	            		if(req.body.triggeredBy == "delete"){
        			      	//res.end('<script>'+
							//	'window.top.window.alert("Not implemented yet but will ve soon");'+
							//'</script>');
							//
							restler.post(SG.params.IM_PROTOCOL + SG.params.IM_ADDR +':'+ SG.params.IM_PORT+ '/remove-algo', { data : {_id : req.params.id} }).on('complete',
								function(del, resp) {
									console.log("DEL DEL DEL DEL : "+del);
									if(del instanceof Error){
										return res.end('<script>'+
			            								'window.top.window.alert("Server error");'+
			            							'</script>');
									}

									if ( JSON.parse(del).status == "failure" ){
										if ( !JSON.parse(del).message.startsWith("Error from server (NotFound): error when stopping "))
											return res.end('<script>'+
				            								'window.top.window.alert("Failed to remove the algorithm");'+
				            							'</script>');
									}
									
									Algos.remove({"_id" : req.params.id}, function(error){
			            				if(err){
			            					console.log('Could not remove');
			            					res.end('<script>'+
			            								'window.top.window.alert("a database error occurred");'+
			            							'</script>');
			            				}
			            				else{
			            					console.log('Cool');
			            					
			            					res.render('algo_edit', {iframing : {cause : 'delete'}});
			            				}
			            			});
								});

	                    }
	                	else if(req.body.triggeredBy == "updateForm"){
	            			res.end('Updating');
	            		}
	                }
	            }
			});
		}
	});
	
	router.get('/:id/version/:version', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t ALGO : MIDDLEWARE 8");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user)
			res.redirect('/');
		else {
			AlgosMeta.findById(req.params.id).populate(['author', {
				path : "versions",
				match : {
					version : req.params.version
				}
			}]).exec(function(err, data){
				//res.end('Some database error occured, come back <a href="/"> home </a>.');
				console.log(err || 'data : '+data);
				if(err) {
					console.log("Err : "+err);
					req.session.pop_message = {title : "err", msg : err.toString()};
		            res.redirect('/algo/catalog');
				}
				if(!data || data.versions.length == 0 ) {
	                //res.end("This algorithm doesn't exist (or not anymore), come back <a href=\"/\"> home </a>.");
	            	res.redirect('/algo/catalog');
	            }
	            else if(data.versions[0].hidden == true && req.session.user.username != data.author.username){
	                //res.end("Not allowed to access this algorithm, come back <a href=\"/\"> home </a>.");
	            	res.redirect('/algo/catalog');
	            }
	            else{
	            	//(new demoSessionID({user : req.session.user._id, algo : data.versions[0]._id})).save({}, function(s_err, doc){
		            //	console.log('Docs '+require('util').inspect(doc));
		            	/*
		            	get_Algos_Service_Url (Algos, data.versions[0]._id.toString(), SG.params, function(err, result){
		            		console.log("GET ALGO SERVICE URL : "+ (err || "RESULT : "+result));
		            		if(err){
				            	res.render('algo_version_page', {
									pop_message : pop_message, 
									title : 'Page : algorithm ' + data.title, 
									activeHeadersComp : 'algo', 
									user : req.session.user, 
									algo : data, 
									sessionID : doc._id
								});
				            }
				            else {
				            	res.render('algo_version_page', {
									pop_message : pop_message, 
									title : 'Page : algorithm ' + data.title, 
									activeHeadersComp : 'algo', 
									user : req.session.user, 
									algo : data, 
									sessionID : doc._id,
									demoAt : result
								});
				            }
		            	});
						* /
						res.render('algo_version_page', {
							pop_message : pop_message, 
							title : 'Page : algorithm ' + data.title, 
							activeHeadersComp : 'algo', 
							user : req.session.user, 
							algo : data//, 
					//		sessionID : doc._id
						});
	    			//});
	            }
			});
			
		}
	});
	
	
	router.post('/:id/version/:version', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t ALGO : MIDDLEWARE 8");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user)
			res.redirect('/');
		else {
			AlgosMeta.findById(req.params.id).populate(['author', {
				path : "versions",
				match : {
					version : req.params.version
				}
			}]).exec(function(err, data){
				//res.end('Some database error occured, come back <a href="/"> home </a>.');
				console.log(err || 'data : '+data);
				if(err) {
					console.log("Err : "+err);
					req.session.pop_message = {title : "err", msg : err.toString()};
		            res.redirect('/algo/catalog');
				}
				if(!data || data.versions.length == 0 ) {
	                //res.end("This algorithm doesn't exist (or not anymore), come back <a href=\"/\"> home </a>.");
	            	res.redirect('/algo/catalog');
	            }
	            else if(data.versions[0].hidden == true && req.session.user.username != data.author.username){
	                //res.end("Not allowed to access this algorithm, come back <a href=\"/\"> home </a>.");
	            	res.redirect('/algo/catalog');
	            }
	            else{
	            	(new demoSessionID({user : req.session.user._id, algo : data.versions[0]._id})).save({}, function(s_err, doc){
		            	console.log('Docs '+require('util').inspect(doc));
		            	/*
		            	get_Algos_Service_Url (Algos, data.versions[0]._id.toString(), SG.constants, function(err, result){
		            		console.log("GET ALGO SERVICE URL : "+ (err || "RESULT : "+result));
		            		if(err){
				            	res.render('algo_version_page', {
									pop_message : pop_message, 
									title : 'Page : algorithm ' + data.title, 
									activeHeadersComp : 'algo', 
									user : req.session.user, 
									algo : data, 
									sessionID : doc._id
								});
				            }
				            else {
				            	res.render('algo_version_page', {
									pop_message : pop_message, 
									title : 'Page : algorithm ' + data.title, 
									activeHeadersComp : 'algo', 
									user : req.session.user, 
									algo : data, 
									sessionID : doc._id,
									demoAt : result
								});
				            }
		            	});
						* /
						res.render('algo_version_page', {
							pop_message : { title : "bug-report", msg : req.body["bug_report"]}, 
							title : 'Page : algorithm ' + data.title, 
							activeHeadersComp : 'algo', 
							user : req.session.user, 
							algo : data, 
							sessionID : doc._id
						});
	    			});
	            }
			});
			
		}
	});
	
	router.post('/:id/version', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t ALGO : MIDDLEWARE 5");
	    console.log("----------------------------------------------------------");

		if (!req.session.user){
			io.emit("user not connected");
			setTimeout(function(){
				res.redirect('/');
			}, 3000);
			
		}
		else {
			new multiparty.Form().parse(req, function(err, fields, files) {
		      	//res.writeHead(200, {'content-type': 'text/plain'});
			    console.log("util.inspect(files.dockerfile) : "+util.inspect(files.dockerfile));
			    console.log("util.inspect(files.newAlgoData) : "+util.inspect(files.newAlgoData));
			    if(err){
			    	io.emit("multipart parsing error");
			    	res.end('an error occured');
			    	cleanUpUploads(files);
			   	}
			    else if(files.newAlgoData){
			    	SG.utils.dao.algo.version.analyseManifest(req.params.id, files.newAlgoData[0].path, io, req.session.user.username, function(err, newAlgo){
			      		if(err){
			      			console.log("Err: "+err);
			      			res.end(err.toString());
			      			io.emit("Error", err);
			      		}
			      		else{
			      			//newAlgo.author = req.session.user._id;
			      			newAlgo._id = SG.mongo.Types.ObjectId().toString();
			      			console.log('OK for the JSON file');
			      			io.emit("done with json");
			      			
			      			Algos.collection.insert([newAlgo], {}, function(s_err, docs){
								if(s_err){
									res.end('a database error occurred');
			      				}
								else{
									AlgosMeta.findById(req.params.id, function(err, meta){
										if(err || !meta){
											console.log('\nCloud not Link the algo to its metadata\n');
											Algos.remove({_id : newAlgo._id}, function(){});
											res.status(500).end("DB error");
											return;
										}

										meta.versions.push(newAlgo._id);
										meta.save(function(err){
											console.log("\nVersion "+newAlgo.version+" recorded as a version of Algo "+meta.title+"\n");
										});

										console.log("util.inspect(docs) : "+util.inspect(docs));
										var sock = require('socket.io-client')(SG.params.IM_PROTOCOL + SG.params.IM_ADDR +':'+ SG.params.IM_PORT+"/createImage");
										sock.on('connect', function(){
											console.log('\n\n\nsocket.io-client Connect\n\n\n');
										});
										sock.on('error', function(data){
											console.log('\n\n\nsocket.io-client error : '+util.inspect(data)+'\n\n\n');
										});
										sock.on("data stdout build", function(data){
								          	console.log("data stdout build : "+data);
								          	io.emit("data stdout build", data);
								        });
										sock.on("data stderr build", function(data){
								          	console.log("data stdout build : "+data);
								          	io.emit("data stderr build", data);
								        });
										
										console.log("\nNEWALGO.deployment.MAIN_SERVICE : " + newAlgo.deployment.main_service);
										console.log("util.inspect(newAlgo.deployment.kubernetes) : " + util.inspect(newAlgo.deployment.kubernetes));
										/*restler.post(SG.params.IM_PROTOCOL + SG.params.IM_ADDR +':'+ SG.params.IM_PORT+ "/build-infra", {
									        data: {_id : newAlgo._id.toString()}
									    }).on("complete", function(create_image, resp) {
									    * /
									    var buildResponse = "";
									    request.post(SG.params.IM_PROTOCOL + SG.params.IM_ADDR +':'+ SG.params.IM_PORT+ "/build-infra", {
									        form: {_id : newAlgo._id.toString()}
									    }).on("response", function(resp) {
									        cleanUpUploads(files);
									        resp.on('data', function(data){
									        	console.log("data chunk : "+data);
									        	if(data == "Keep Alive"){
									        		return;
									        	}
									        	buildResponse += data;
									        	try {
									        		var json = JSON.parse(buildResponse);
									        		if(json.status == 'failure'){
												    	console.log('---------------------------------');
												        console.log('Failed to create Image, data : '+json.message);
												        console.log('---------------------------------');
												        sock.close();
												        io.emit("Error", json.message);
												        res.end('Failed');
												        Algos.remove({_id : newAlgo._id}, function(){});
												    }
												    else {
												    	console.log('---------------------------------');
												        console.log('Image successfully created, data : '+json.message);
												        console.log('---------------------------------');
												        io.emit("create image succeded");
												        sock.close();
												    } 
									        	}
									        	catch(e){
									        		//
									        		console.log("Data not completed yet : "+e);
									        	}
									        });
									        /*
									        if(create_image instanceof Error){
										        console.log('---------------------------------');
										        console.log('Error : '+util.inspect(create_image));
										    	console.log('---------------------------------');
										    	io.emit("Error", create_image);
										    	sock.close();
										    	Algos.remove({_id : newAlgo._id}, function(){});
										    }
										    else{
										    	console.log('-_-_-__-_-_-_-_--__--__-_-_-_')
										    	console.log('create_image : '+create_image)
										    	console.log('-_-_-__-_-_-_-_--__--__-_-_-_')
										    	create_image = create_image.replace(/Keep Alive/g, '').replace('\n', '');
										    	console.log('create_image : '+create_image)
										    	console.log('-_-_-__-_-_-_-_--__--__-_-_-_')
										    	
										    	var json = {};
										    	try {
										    		json = JSON.parse(create_image);
										    	}catch (e){
										    		console.log('---------------------------------');
											        console.log('Failed to create Image, parse error : '+e);
											        console.log('---------------------------------');
											        sock.close();
											        io.emit("Error", create_image);
											        Algos.remove({_id : newAlgo._id}, function(){});
											        return res.end('Failed');

										    	}
										    	
										    	if(json.status == 'failure'){
											    	console.log('---------------------------------');
											        console.log('Failed to create Image, data : '+create_image);
											        console.log('---------------------------------');
											        sock.close();
											        io.emit("Error", create_image);
											        res.end('Failed');
											        Algos.remove({_id : newAlgo._id}, function(){});
											    }
											    else {
											    	console.log('---------------------------------');
											        console.log('Image successfully created, data : '+create_image);
											        console.log('---------------------------------');
											        io.emit("create image succeded");
											        sock.close();
											    }    
										    }
										    * /
									    }).on('error', function(error){
									    	console.log('---------------------------------');
									        console.log('Error : '+util.inspect(error));
									    	console.log('---------------------------------');
									    	sock.close();
									        io.emit("Error", "Internal connection error");
									        res.end('Failed');
									        Algos.remove({_id : newAlgo._id}, function(){});
									    });
									});
			      				}
			      			});
			      		}
			      	});
												
			    } else {
		      		res.end('You need to upload a json file\n\n');
		      		cleanUpUploads(files);
		      	}
		      
		    });
		}
	});
	*/
	router.get('/:id/page', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t ALGO : MIDDLEWARE 8");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user)
			res.redirect('/');
		else {
			
			var exec = AlgosMeta.findById(req.params.id).populate([
				'author', 
				{
					path : 'versions',
					match : {
						hidden : false
					}
				}
			]).exec(function(err, data){
				if( err ) {
					//res.end('Some database error occured, come back <a href="/"> home </a>.');
		            return res.redirect('/algo/catalog');
				}
				if(!data) {
	                //res.end("This algorithm doesn't exist (or not anymore), come back <a href=\"/\"> home </a>.");
	            	return res.redirect('/algo/catalog');
	            }
	            res.render('algo_meta_page', {
                	pop_message : pop_message, 
                	title : 'Page : algorithm ' + data.title, 
                	activeHeadersComp : 'algo', 
                	user : req.session.user, 
                	algo : data,
                	generator : "algo"
                });

			}); 
		}
	});

	/*
	router.get('/new', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t ALGO : MIDDLEWARE 2");
	    console.log("----------------------------------------------------------");
		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user)
			res.redirect('/');
		else {
			res.render('algo_new', {pop_message : pop_message, title : "Register a new Algorithm", activeHeadersComp : 'algo', user : req.session.user});
		}
	});

	router.post('/new', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t ALGO : MIDDLEWARE 5");
	    console.log("----------------------------------------------------------");

		if (!req.session.user){
			io.emit("user not connected");
			setTimeout(function(){
				res.redirect('/');
			}, 3000);
			
		}
		else {
			new multiparty.Form().parse(req, function(err, fields, files) {
		      	//res.writeHead(200, {'content-type': 'text/plain'});
			    console.log("util.inspect(files.dockerfile) : "+util.inspect(files.dockerfile));
			    console.log("util.inspect(files.newAlgoData) : "+util.inspect(files.newAlgoData));
			    if(err){
			    	io.emit("multipart parsing error");
			    	res.end('an error occured');
			    	cleanUpUploads(files);
			   	}
			    else if(files.newAlgoData){
			    	analyseJSON(Algos, files.newAlgoData[0].path, io, req.session.user.username, function(err, newAlgo){
			      		if(err){
			      			res.end(util.inspect(err));
			      			io.emit("Error", err);
			      		}
			      		else{
			      			newAlgo.author = req.session.user._id;
			      			newAlgo._id = SG.mongo.Types.ObjectId().toString();
			      			console.log('OK for the JSON file');
			      			io.emit("done with json");

			      			Algos.collection.insert([newAlgo], {}, function(s_err, docs){
								if(s_err){
									res.end('a database error occurred');
			      				}
								else{
									User.findById(req.session.user._id, function(err, user_to_update){
										if(err || !user_to_update){
											console.log('\nCloud not record owner for the algo\n');
											Algos.remove({_id : newAlgo._id}, function(){});
											res.status(500).end("DB error");
											return;
										}

										user_to_update.contributions.push(newAlgo._id);
										user_to_update.save(function(err){
											console.log("\nUser recorded as owner for the algo\n");
										});

										console.log("util.inspect(docs) : "+util.inspect(docs));
										var sock = require('socket.io-client')(SG.params.IM_PROTOCOL + SG.params.IM_ADDR +':'+ SG.params.IM_PORT+"/createImage");
										sock.on('connect', function(){
											console.log('\n\n\nsocket.io-client Connect\n\n\n');
										});
										sock.on('error', function(data){
											console.log('\n\n\nsocket.io-client error : '+util.inspect(data)+'\n\n\n');
										});
										sock.on("data stdout build", function(data){
								          	console.log("data stdout build : "+data);
								          	io.emit("data stdout build", data);
								        });
										sock.on("data stderr build", function(data){
								          	console.log("data stdout build : "+data);
								          	io.emit("data stderr build", data);
								        });
										
										console.log("\nNEWALGO.deployment.MAIN_SERVICE : " + newAlgo.deployment.main_service);
										console.log("util.inspect(newAlgo.deployment.kubernetes) : " + util.inspect(newAlgo.deployment.kubernetes));
										restler.post(SG.params.IM_PROTOCOL + SG.params.IM_ADDR +':'+ SG.params.IM_PORT+ "/createImage", {
									        data: {_id : newAlgo._id.toString()}
									    }).on("complete", function(create_image, resp) {
									        cleanUpUploads(files);
									        if(create_image instanceof Error){
										        console.log('---------------------------------');
										        console.log('Error : '+create_image);
										    	console.log('---------------------------------');
										    	io.emit("Error", create_image);
										    	sock.close();
										    }
										    else{
										    	create_image = create_image.replace(/Keep Alive/g, '').replace('\n', '');
										    	var json = {};
										    	try {
										    		json = JSON.parse(create_image);
										    	}catch (e){
										    		console.log('---------------------------------');
											        console.log('Failed to create Image, data : '+create_image);
											        console.log('---------------------------------');
											        sock.close();
											        io.emit("Error", create_image);
											        return res.end('Failed');
										    	}
										    	
										    	if(json.status == 'failure'){
											    	console.log('---------------------------------');
											        console.log('Failed to create Image, data : '+create_image);
											        console.log('---------------------------------');
											        sock.close();
											        io.emit("Error", create_image);
											        res.end('Failed');
											    }
											    else {
											    	console.log('---------------------------------');
											        console.log('Image successfully created, data : '+create_image);
											        console.log('---------------------------------');
											        io.emit("create image succeded");
											        sock.close();
											    }    
										    }
									    });
										
									});
			      				}
			      			});
			      		}
			      	});
												
			    } else {
		      		res.end('You need to upload a json file\n\n');
		      		cleanUpUploads(files);
		      	}
		      
		    });
		}
	});
	
	router.get('/:id/edit', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t ALGO : MIDDLEWARE 6");
	    console.log("----------------------------------------------------------");
	    
		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user)
			res.redirect('/');
		else {
			Algos.findById(req.params.id).exec(function(err, data){
				
				if(err) {
					res.redirect('/algo/catalog');
				}
	            else if(!data) {
	                res.redirect('/algo/catalog');
	            }
	            else if(data.hidden == "true" && req.session.user.username != data.author.username) {
	                res.redirect('/algo/catalog');
	            }
	            else {
	            	var pods = [], rcs = [];
	            	for (var i=0; i < data.deployment.kubernetes.length; i++){
	            		if( data.deployment.kubernetes[i].kind == 'Pod' )
	            			pods.push(data.deployment.kubernetes[i].metadata.name);
	            		if( data.deployment.kubernetes[i].kind == 'ReplicationController' )
	            			rcs.push(data.deployment.kubernetes[i].metadata.name);
					}
						
	            	var sock = require('socket.io-client')(SG.params.IM_PROTOCOL + SG.params.IM_ADDR +':'+ '32081'+"/kubernetes-objects");
					var cmpt = 0;
					var sockConnected = false;
					sock.on('connect', function(){
						const room = SG.mongo.Types.ObjectId().toString();
						sock.emit('room', room);
						sockConnected = true;
						console.log('\n\n\nSOCKET.IO-CLIENT : CONNECTED TO IM-SERVER SOCKET OF /kubernetes-objects\n\n\n');
						if(res.headersSent){
							console.log("HEADERS ALREADY SENT");
							sock.disconnect();
							return;
						}
						
						sock.on('error', function(error){
			            	console.log(' <<< ROOM : '+room+' >>> | <ERROR> | MESSAGE : '+error);
						});

						sock.on('disconnect', function(reason){
							console.log(' <<< ROOM : '+room+' >>> | <DISCONNECT> | MESSAGE : '+reason);
						});

						console.log(' <<< ROOM >>> | ID : '+room);
						res.render('algo_edit', 
		                    {
		                    	pop_message : pop_message, 
		                    	title : 'Page : algorithm ' + data.title, 
		                    	activeHeadersComp : 'algo', 
		                    	user : req.session.user, 
		                    	algo : data,
		                    	pods : pods,
		                    	rcs :  (rcs.length !=0)? rcs:undefined
		                    }
		                );
			            

						SG.io.of('/algo/edit/').on('connection', function(socket){
							console.log('SG SOCKET OF /algo/edit : CONNECTION ESTABLISHED');

							sock.emit('states', room, data._id);
							sock.on('states', function(kind, name, result){
								console.log(' PORTAL <<< IM | ROOM : '+room+' | <STATES> | KIND : '+kind+', NAME : '+name);
								socket.emit('state', kind, name, result);
							});
								
							socket.on('describe', function(kind, name){
								console.log(' PORTAL >>> IM | ROOM : '+room+' | <DESCRIBE> | KIND : '+kind+', NAME : '+name);
								sock.emit('describe', room, kind, name);
							});
							sock.on('describe', function(kind, name, result){
								console.log(' PORTAL <<< IM | ROOM : '+room+' | <DESCRIBE> | KIND : '+kind+', NAME : '+name);
								socket.emit('describe', kind, name, result);
							});
							socket.on('full description', function(kind, name){
								console.log(' PORTAL >>> IM | ROOM : '+room+' | <FULL DESCRIPTION> | KIND : '+kind+', NAME : '+name);
								console.log('\nSG SOCKET ON full description : "'+kind+'" '+name);
								sock.emit('full description', room, kind, name);
							});
							sock.on('full description', function(kind, name, result){
								console.log(' PORTAL <<< IM | ROOM : '+room+' | <FULL DESCRIPTION> | KIND : '+kind+', NAME : '+name);
								socket.emit('full description', kind, name, result);
							});
							socket.on('clean', function(){
								console.log(' PORTAL >>> IM | ROOM : '+room+' | <CLEAN>');
								if (sock){
									sock.emit('clean', room);
									sock.disconnect();
								}
							});
						});
					
						
							
					});
					
					
					
					setTimeout(function(){
						if(!sockConnected){
							res.render('algo_edit', 
			                    {
			                    	pop_message : pop_message, 
			                    	title : 'Page : algorithm ' + data.title, 
			                    	activeHeadersComp : 'algo', 
			                    	user : req.session.user, 
			                    	algo : data
			                    }
			                );
						}
					}, 15000);
	            }
			});
		}
	});
	
	router.post('/:id/edit', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t ALGO : MIDDLEWARE 7");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user)
			res.redirect('/');
		else {
			console.log('show me req.body : '+require('util').inspect(req.body));
			Algos.findById(req.params.id).populate('author').exec(function(err, data){
				if(err) {
	                //res.end('Some database error occured, come back <a href="/"> home </a>.');
	                res.redirect('/algo/catalog');
				}
				else if(!data){
	                //res.end("This algorithm doesn't exist (or not anymore), come back <a href=\"/\"> home </a>.");
					res.redirect('/algo/catalog');
				}
	            else if(data.hidden == true && req.session.user.username != data.author.username) {
	                //res.end("Not allowed to access this page (cause you're not th author), come back <a href=\"/\"> home </a>.");
	                res.redirect('/algo/catalog');
	            }
	            else {
	            	if(!req.body.triggeredBy) {
	            		res.end("Could not understand the demand.");
	            	}
	            	else {
	            		if(req.body.triggeredBy == "hide"){
	            			Algos.update({_id : req.params.id}, {$set : {hidden : !data.hidden}}, function(error, updated){
	            				if(err){
	            					res.end('<script>'+
	            								'window.top.window.alert("a database error occurred");'+
	            							'</script>');
	            				}
	            				else{
	            					res.render('algo_edit', {iframing : {cause : 'hidden', msg : !data.hidden}});
	            				}

	            			});
	            		}
	            		if(req.body.triggeredBy == "delete"){
        			      	restler.post(SG.params.IM_PROTOCOL + SG.params.IM_ADDR +':'+ SG.params.IM_PORT+ '/remove-algo', { data : {_id : req.params.id} }).on('complete',
								function(del, resp) {
									console.log("DEL DEL DEL DEL : "+del);
									if(del instanceof Error){
										return res.end('<script>'+
			            								'window.top.window.alert("Server error");'+
			            							'</script>');
									}

									if ( JSON.parse(del).status == "failure" ){
										if ( !JSON.parse(del).message.startsWith("Error from server (NotFound): error when stopping "))
											return res.end('<script>'+
				            								'window.top.window.alert("Failed to remove the algorithm");'+
				            							'</script>');
									}
									
									Algos.remove({"_id" : req.params.id}, function(error){
			            				if(err){
			            					console.log('Could not remove');
			            					res.end('<script>'+
			            								'window.top.window.alert("a database error occurred");'+
			            							'</script>');
			            				}
			            				else{
			            					console.log('Cool');
			            					
			            					res.render('algo_edit', {iframing : {cause : 'delete'}});
			            				}
			            			});
								});
        			      	

	                    }
	                	else if(req.body.triggeredBy == "updateForm"){
	            			res.end('Updating');
	            		}
	                }
	            }
			});
		}
	});
	*/
	return router;
}

var algoNameExists = function(name){
	return Algos.find({'title' : name}).count() > 0 ;
};

function cleanUpUploads(files){
	for (var n in files){
		for(var i=0; i<files[n].length; i++)
			require('child_process').spawn('rm', ['-r', files[n][i].path]);
	}
}

var analyseAPIField = function(API, verb, io){
    var unscript_mask = /<(( )*|(\t)*)*script(.)*<(( )*|(\t)*)*\/(( )*|(\t)*)*script(( )*|(\t)*)*>/;
    var content = [];
    if(API[verb]){
        for(var i=0; i < API[verb].length; i++){
            var content_object = {};
            if( API[verb][i].uri && typeof API[verb][i].uri !== 'string' ) {
                var msg = "Field API."+verb+"["+i+"].uri doesn't exist or is not string";
                console.log(msg);
                if(typeof io !== 'undefined')
                    io.emit("Error", msg);
                return new Error(msg);
            }
            if(API[verb][i].uri)
            	content_object.uri = API[verb][i].uri;
            else
            	content_object.uri = "/";


            if( !(API[verb][i].description) && API[verb][i].description instanceof Array) {
                var msg = "Field API."+verb+"["+i+"].description doesn't exist.";
                console.log(msg);
                if(typeof io !== 'undefined')
                    io.emit("Error", msg);
                return new Error(msg);
            }
            else if(API[verb][i].description instanceof Array){
            	try {
	                API[verb][i].description = API[verb][i].description.join('').replace(unscript_mask, '');
	            }catch(e){
	                var msg = "Field API."+verb+"["+i+"].description is in the wrong format, it should be an array of string.";
	                console.log(msg);
	                if(typeof io !== 'undefined')
	                    io.emit("Error", msg);
	                return new Error(msg);
	            }
            }
            else if(typeof API[verb][i].description === "string"){
            	//
            	API[verb][i].description = API[verb][i].description.replace(unscript_mask, '');
            }

            content_object.description = API[verb][i].description;
            
            if( !(API[verb][i].inputs && API[verb][i].inputs instanceof Array) ){
                var msg = "Field API."+verb+"["+i+"].inputs doesn't exist or is not array";
                console.log(msg);
                if(typeof io !== 'undefined')
                    io.emit("Error", msg);
                return new Error(msg);
            }
            content_object.inputs = [];
            for(var j=0; j < API[verb][i].inputs.length; j++){
                if( !(API[verb][i].inputs[j].name && API[verb][i].inputs[j].mime_types) ){
                    var msg = "Field API."+verb+"["+i+"].inputs["+j+"] has either not field name or field mime_types (both are required).";
                    console.log(msg);
                    if(typeof io !== 'undefined')
                        io.emit("Error", msg);
                    return new Error(msg);
                }

                if( !API[verb][i].inputs[j].required || (typeof API[verb][i].inputs[j].required !== 'boolean') )
                    API[verb][i].inputs[j].required = false;

                var someObject = {
                	name : API[verb][i].inputs[j].name,
	                mime_types : API[verb][i].inputs[j].mime_types,
	                required : API[verb][i].inputs[j].required
                };
                content_object.inputs.push(someObject);
            }

            if( !(API[verb][i].outputs && API[verb][i].outputs instanceof Array) ){
                var msg = "Field API."+verb+"["+i+"].outputs doesn't exist or is not array";
                console.log(msg);
                if(typeof io !== 'undefined')
                    io.emit("Error", msg);
                return new Error(msg);
            }
            content_object.outputs = API[verb][i].outputs;
            content.push(content_object);
        }

        if(content.length > 0)
        	return content;
    }
}


var checkKubernetesValidity = function(kube, username, io){
	
	var atLeastAService = false;

	for ( var i=0; i < kube.length; i++){
		var kubeObject = kube[i];

		if(!kubeObject.apiVersion){
			var msg = 'Field "apiVersion" is not specified in the '+((i==0)? "1st" : (i==1)? "2nd" : (i==2)? "3rd" : (i+1)+"th")+' object.'
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            return new Error(msg);
		}

		if(!kubeObject.kind){
			var msg = 'Field "kind" is not specified in the '+((i==0)? "1st" : (i==1)? "2nd" : (i==2)? "3rd" : (i+1)+"th")+' object.'
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            return new Error(msg);
		}
		
		if(!kubeObject.metadata){
			var msg = 'Field "metadata" is not specified in the '+((i==0)? "1st" : (i==1)? "2nd" : (i==2)? "3rd" : (i+1)+"th")+' object.'
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            return new Error(msg);
		}
		
		if(!kubeObject.metadata.name){
			var msg = 'Field "metadata.name" is not specified in the '+((i==0)? "1st" : (i==1)? "2nd" : (i==2)? "3rd" : (i+1)+"th")+' object.'
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            return new Error(msg);
		}
		
		if(kubeObject.kind == "Service"){
			atLeastAService = true;
		}
		else if(kubeObject.kind != "ReplicationController" && kubeObject.kind != "Pod"){
			var msg = ((i==0)? "1st" : (i==1)? "2nd" : (i==2)? "3rd" : (i+1)+"th")+' object : Only "Pod", "ReplicationController" and "Service" kind of kubernetes objects are allowed'
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            return new Error(msg);
		}

		kubeObject.metadata.namespace = username;
	}

	if(!atLeastAService){
		var msg = 'No "Service" was found among the Kubernetes objects, there needs to at least be one.'
        console.log(msg);
        if(typeof io !== 'undefined')
            io.emit("Error", msg);
        return new Error(msg);
	}
}

var createPodSpecFromDockerRegistry = function(infos, pullName){
	// 	infos : {
	//		name,
	//		version,
	//		username,
	//		port
	//	}
	
	if( !infos.name || !infos.version || !infos.port ) 
		return new Error( "Field " +
			((!infos.name)? "title" : (!infos.version)? "version" : "API.listenOn" ) +
			"is needed" );
	return [
		{
			apiVersion : "v1",
			kind : "Pod",
			metadata : {
				name : infos.username+'-'+infos.name.toLowerCase().replace(/\.|\ |\-/g, '_')+(infos.version.replace(/\./g, '')),
				labels : {
					app : infos.name.toLowerCase(),
					version : infos.version,
					by : infos.username.replace(/\.|\ |\-/g, '_')
				}
			},

			spec : {
				containers : [{
					name : infos.name.toLowerCase(),
					image : pullName,
					ports : [{
						name : "http",
						protocol : "TCP",
						containerPort : infos.port
					}]
				}]
			}
		},
		{
			apiVersion : "v1",
			kind : "Service",
			metadata : {
				name : infos.username+'-'+infos.name.toLowerCase().replace(/\.|\ |\-/g, '_')+(infos.version.replace(/\./g, ''))
			},
			spec : {
				selector : {
					app : infos.name.toLowerCase(),
					version : infos.version,
					by : infos.username.replace(/\.|\ |\-/g, '_')
				},
				type : "NodePort",
				ports : [{
					port : infos.port
				}]
			}
		}
	]
}

var analyseJSON = function(bdd, file, io, username, cb){

    if(typeof io === 'function' && typeof cb === 'undefined'){
        cb = io; io = undefined;
    }

    var data;
    try {
        data = fs.readFileSync(file);
    }
    catch(e) {
        var msg = util.inspect(e);
        console.log(msg);
        if(typeof io !== 'undefined')
            io.emit("Error", msg);
        cb(new Error(msg));
        //cleanUpUploads(files);
        return;
    }
    var new_algo = new bdd();
    var received;
    try {
        received = JSON.parse(data);
    }
    catch(e) {
        var msg = "Parse Error : " + util.inspect(e);
        console.log(msg);
        if(typeof io !== 'undefined')
            io.emit("Error", msg);
        cb(new Error(msg));
        //cleanUpUploads(files);
        return;
    }

    if( !received.title || !/^[a-zA-Z0-9_\.]{4,}$/.test(received.title)) {
        var msg = "Either title is empty or it is in the wrong format. It should be composed of at least 4 ALPHANUMERIC CHARACTERS";
        console.log(msg);
        if(typeof io !== 'undefined')
            io.emit("Error", msg);
        cb(new Error(msg));
        //cleanUpUploads(files);
        return;
    }
    new_algo.title = received.title;

    var version_mask = /^[0-9]+\.[0-9]+\.[0-9]+$/;
    var unscript_mask = /<(( )*|(\t)*)*script(.)*<(( )*|(\t)*)*\/(( )*|(\t)*)*script(( )*|(\t)*)*>/;

    if( !received.version || !version_mask.test(received.version)) {
        var msg = "Either version is empty or it is in the wrong format. This is the expected format : 1.2.3";
        console.log(msg);
        if(typeof io !== 'undefined')
            io.emit("Error", msg);
        cb(new Error(msg));
        //cleanUpUploads(files);
        return;
    }
    

    bdd.find({'title' : received.title, 'version' : received.version}, function(a_err, algo){
        //console.log('a_err : '+a_err+',\tAlgo : '+algo);
        if(a_err){
            var msg = "db error.";
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }

        if(algo && algo.length != 0){ 
        	var msg = "an algorithm with the same name and the same version is already recorded.";
            console.log(msg);
            if(typeof io !== 'undefined')
               io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }
        new_algo.version = received.version;

        if(!received.description){
            console.log("received.description : "+received.description+", typeof received.description : "+(typeof received.description));
            var msg = "Either field description doesn't exist or it isn't an array.";
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }
        else if(received.description instanceof Array){
        	try{
        		received.description = received.description.join('').replace(unscript_mask, '');
        	}
        	catch (e){
        		var msg = "Error " + util.inspect(e);
		        console.log(msg);
		        if(typeof io !== 'undefined')
		            io.emit("Error", msg);
		        cb(new Error(msg));
		        //cleanUpUploads(files);
		        return;
        	}

        }
        else if(typeof received.description === 'string' ){
			received.description = received.description.replace(unscript_mask, '');
        }
        else {
        	var msg = "Error : field description is either an Array of String or String";
	        console.log(msg);
	        if(typeof io !== 'undefined')
	            io.emit("Error", msg);
	        cb(new Error(msg));
	        //cleanUpUploads(files);
	        return;
        }

        new_algo.description = received.description;
        
        if(!received.deployment) {
            var msg = "Error : The field deployment is NOT optional.";
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }

	/*
	        if(received.deployment.docker && typeof received.deployment.docker === 'string' ) {
	                try {
	                        var kube = createPodSpecFromDockerRegistry(
	                                {
	                                        username : username,
	                                        name : received.title,
	                                        version : received.version,
	                                        port : received.API.listenOn
	                                }, 
	                                received.deployment.docker
	                        );
	                        if(kube instanceof Error){
	                                console.log(kube);
	                            if(typeof io !== 'undefined')
	                                io.emit("Error", kube);
	                            cb(new Error(kube));
	                            //cleanUpUploads(files);
	                            return;
	                        }
	                                                received.deployment.docker = undefined;
	                        received.deployment.kubernetes = kube;
	                        received.deployment.main_service = kube[1].metadata.name;
	                }
	                catch(e){
	                        //
	                        var msg = "Error : please check the conformity of you JSON file";
	                        console.log(msg);
	                    if(typeof io !== 'undefined')
	                        io.emit("Error", msg);
	                    cb(new Error(msg));
	                    //cleanUpUploads(files);
	                    return;
	                }
	        }
	        else if(received.deployment.docker){
	            var msg = "Error : The field deployment.docker is a string (docker registry name of the image : <login>/<image>[:<version>]) and is required.";
	            console.log(msg);
	            if(typeof io !== 'undefined')
	                io.emit("Error", msg);
	            cb(new Error(msg));
	            //cleanUpUploads(files);
	            return;
	        }
	*/
		if( !(received.deployment.main_service && typeof received.deployment.main_service === 'string') ){

            var msg = 'Error : Field "deployment.main_service" is not given.';
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }else {
        	var found_and_checked_main_service = false;
        	console.log("ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd");
        	for (var i=0; i < received.deployment.kubernetes.length; i++){
        		var kubeObject = received.deployment.kubernetes[i];
        		found_and_checked_main_service = (kubeObject.metadata.name == received.deployment.main_service 
        											&& kubeObject.kind == "Service" 
        												&& kubeObject.spec.type == "NodePort")? true : false;

        		console.log('i : '+i+', found_and_checked_main_service : '+found_and_checked_main_service);
        		if (found_and_checked_main_service)
        			break;
        	}
        	if (!found_and_checked_main_service){
        		var msg = 'Error : Either the claimed main_service was not specified or is not NodePort type.';
	            console.log(msg);
	            if(typeof io !== 'undefined')
	                io.emit("Error", msg);
	            cb(new Error(msg));
	            //cleanUpUploads(files);
	            return;
        	}
        }
        if(received.deployment.kubernetes) {


            try {
                    var missContructed =  checkKubernetesValidity(received.deployment.kubernetes, username, io);
                    if(missContructed instanceof Error){
                        console.log(missContructed);
                        if(typeof io !== 'undefined')
                            io.emit("Error", missContructed);
                        cb(missContructed);
                        return;
                    }

            }catch(e){
                    //
                var msg = "Error : Your deployment.kubernetes Field might be in the wrong format";
                console.log("Exception caught : "+e);
                if(typeof io !== 'undefined')
                    io.emit("Error", msg);
                cb(new Error(msg));
                //cleanUpUploads(files);
                return;
            }
        }

        if(!received.API){
            var msg = "Error : The field API is NOT optional.";
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }

        //new_algo.API = received.API;


        var at_least_one_method = (received.API.GET && received.API.GET instanceof Array) || 
                                  (received.API.POST && received.API.POST instanceof Array) || 
                                  (received.API.PUT && received.API.PUT instanceof Array) || 
                                  (received.API.DELETE && received.API.DELETE instanceof Array);    

        if(!at_least_one_method){
            var msg = "No VERB Given, if you did specify at least one, then checkout the format (Array of object expected).";
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }

        //------ FOR GET --------
        var api_content = analyseAPIField(received.API, 'GET', io);
        if(api_content instanceof Error) {
            cb(api_content);
            return;
        }
        new_algo.API.GET = api_content;

        //------ FOR POST --------
        api_content = analyseAPIField(received.API, 'POST', io);
        if(api_content instanceof Error) {
            cb(api_content);
            return;
        }
        new_algo.API.POST = api_content;

        //------ FOR PUT --------
        api_content = analyseAPIField(received.API, 'PUT', io);
         if(api_content instanceof Error) {
            cb(api_content);
            return;
        }
        new_algo.API.PUT = api_content;

        //------ FOR DELETE --------
        api_content = analyseAPIField(received.API, 'DELETE', io);
        if(api_content instanceof Error) {
            cb(api_content);
            return;
        }
        new_algo.API.DELETE = api_content;
	//  received.author = req.session.user._id

        console.log("\nAnalyseJSON Successfully end\n");
        console.log("\nBY THE WAY KUBERNETES : \n"+ util.inspect(received.deployment.kubernetes));

        cb(null, new bdd(received));
    });
}

var analyseJSON2 = function(metaId, bdd, file, io, username, cb){

	console.log("############ metaId : "+metaId);
    if(typeof io === 'function' && typeof cb === 'undefined'){
        cb = io; io = undefined;
    }

    var data;
    try {
        data = fs.readFileSync(file);
    }
    catch(e) {
        var msg = util.inspect(e);
        console.log(msg);
        if(typeof io !== 'undefined')
            io.emit("Error", msg);
        cb(new Error(msg));
        //cleanUpUploads(files);
        return;
    }
    var new_algo = new bdd();
    var received;
    try {
        received = JSON.parse(data);
    }
    catch(e) {
        var msg = "Parse Error : " + util.inspect(e);
        console.log(msg);
        if(typeof io !== 'undefined')
            io.emit("Error", msg);
        cb(new Error(msg));
        //cleanUpUploads(files);
        return;
    }

    var version_mask = /^[0-9]+\.[0-9]+\.[0-9]+$/;
    var unscript_mask = /<(( )*|(\t)*)*script(.)*<(( )*|(\t)*)*\/(( )*|(\t)*)*script(( )*|(\t)*)*>/;

    if( !received.version || !version_mask.test(received.version)) {
        var msg = "Either version is empty or it is in the wrong format. This is the expected format : 1.2.3";
        console.log(msg);
        if(typeof io !== 'undefined')
            io.emit("Error", msg);
        cb(new Error(msg));
        //cleanUpUploads(files);
        return;
    }
    
    if(received.comment){
    	if(received.comment instanceof Array)
	    	try{
	    		received.comment = received.comment.join()
	    	}
	    	catch(e){
	    		var msg = 'Field "comment" is supposed to be a String or an array of string. Please check if your array constituants are all string.';
	            console.log(msg);
	            if(typeof io !== 'undefined')
	               io.emit("Error", msg);
	            cb(new Error(msg));
	            //cleanUpUploads(files);
	            return;
	    	}
	    else if(typeof received.comment !== 'string'){
	    	//
	    	var msg = 'Field "comment" is supposed to be a String or an array of string.';
            console.log(msg);
            if(typeof io !== 'undefined')
               io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
	    }

    	new_algo.comment = received.comment;
    }

    bdd.find({'meta' : metaId, 'version' : received.version}, function(a_err, algo){
        //console.log('a_err : '+a_err+',\tAlgo : '+algo);
        if(a_err){
            var msg = "db error.";
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }

        if(algo && algo.length != 0){ 
        	var msg = "an algorithm with the same name and the same version is already recorded.";
            console.log(msg);
            if(typeof io !== 'undefined')
               io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }
        new_algo.version = received.version;
        
        if(!received.deployment) {
            var msg = "Error : The field deployment is NOT optional.";
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }

        if(received.deployment.kubernetes) {


            try {
                    var missContructed =  checkKubernetesValidity(received.deployment.kubernetes, username, io);
                    if(missContructed instanceof Error){
                        console.log(missContructed);
                        if(typeof io !== 'undefined')
                            io.emit("Error", missContructed);
                        cb(missContructed);
                        return;
                    }

            }
            catch(e){
                    //
                var msg = "Error : Your deployment.kubernetes Field might be in the wrong format";
                console.log("Exception caught : "+e);
                if(typeof io !== 'undefined')
                    io.emit("Error", msg);
                cb(new Error(msg));
                //cleanUpUploads(files);
                return;
            }
        }

		if( !(received.deployment.main_service && typeof received.deployment.main_service === 'string') ){

            var msg = 'Error : Field "deployment.main_service" is not given or is in wrong format (String expected).';
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }
        else if( !(received.deployment.kubernetes && received.deployment.kubernetes instanceof Array ) ){

            var msg = 'Error : Field "deployment.kubernetes" is not given or is in wrong format (Array expected).';
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }
        else {
        	var found_and_checked_main_service = false;
        	for (var i=0; i<received.deployment.kubernetes.length; i++){
        		try{
	        		var kubeObject = received.deployment.kubernetes[i];
	        		found_and_checked_main_service = (kubeObject.metadata.name == received.deployment.main_service 
	        											&& kubeObject.kind == "Service" 
	        												&& kubeObject.spec.type == "NodePort")? true : false;
	        		if(found_and_checked_main_service)
	        			break;
	        	}
	        	catch(e){
	        		var msg = e;
		            console.log(msg);
		            if(typeof io !== 'undefined')
		                io.emit("Error", msg);
		            cb(new Error(msg));
		            //cleanUpUploads(files);
		            return;
	        	}
        	}
        	if (!found_and_checked_main_service){
        		var msg = 'Error : Either the claimed main_service was not specified or is not NodePort type.';
	            console.log(msg);
	            if(typeof io !== 'undefined')
	                io.emit("Error", msg);
	            cb(new Error(msg));
	            //cleanUpUploads(files);
	            return;
        	}
        }
        

        if(!received.API){
            var msg = "Error : The field API is NOT optional.";
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }

        //new_algo.API = received.API;


        var at_least_one_method = (received.API.GET && received.API.GET instanceof Array) || 
                                  (received.API.POST && received.API.POST instanceof Array) || 
                                  (received.API.PUT && received.API.PUT instanceof Array) || 
                                  (received.API.DELETE && received.API.DELETE instanceof Array);    

        if(!at_least_one_method){
            var msg = "No VERB Given, if you did specify at least one, then checkout the format (Array of object expected).";
            console.log(msg);
            if(typeof io !== 'undefined')
                io.emit("Error", msg);
            cb(new Error(msg));
            //cleanUpUploads(files);
            return;
        }

        //------ FOR GET --------
        var api_content = analyseAPIField(received.API, 'GET', io);
        if(api_content instanceof Error) {
            cb(api_content);
            return;
        }
        new_algo.API.GET = api_content;

        //------ FOR POST --------
        api_content = analyseAPIField(received.API, 'POST', io);
        if(api_content instanceof Error) {
            cb(api_content);
            return;
        }
        new_algo.API.POST = api_content;

        //------ FOR PUT --------
        api_content = analyseAPIField(received.API, 'PUT', io);
         if(api_content instanceof Error) {
            cb(api_content);
            return;
        }
        new_algo.API.PUT = api_content;

        //------ FOR DELETE --------
        api_content = analyseAPIField(received.API, 'DELETE', io);
        if(api_content instanceof Error) {
            cb(api_content);
            return;
        }
        new_algo.API.DELETE = api_content;
	//  received.author = req.session.user._id

        console.log("\nAnalyseJSON Successfully end\n");
        console.log("\nBY THE WAY KUBERNETES : \n"+ util.inspect(received.deployment.kubernetes));

        received.meta = metaId;
        cb(null, new bdd(received));
    });
}

var paginatingAlgoList = function(collections, username, reason, pagination, cb){
	var pop_Query = [], collection;
	if(reason == "myalgos"){
		//
		pop_Query = [
			{
				path : "author",
				match : {
					username : username
				}
			}, 
			{
				path : "versions"
			}
		];
		collection = collections.AlgosMeta;
	}
	else if(reason == "catalog") {
		//
		pop_Query = [
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
		collection = collections.AlgosMeta;
	}
	else if (reason == "subscriptions"){
		//
		pop_Query = [
			{
				path : "algo",
				populate : [
					{
						path : "author"
					},
					{
						path : "versions"
					}
				]
			}
		];
		collection = collections.Subscriptions;
	}
	pagination.page = (!pagination.page || pagination.page < 0)? 0 : pagination.page;
	pagination.number = (!pagination.number || pagination.number < 10)? 10 : (pagination.number > 20)? 20 : pagination.number;

	var have_to_skip = pagination.page * pagination.number;
	collection.find().populate(pop_Query).skip(have_to_skip).limit(pagination.number).exec(function( err, result ) {
		
		if(collection == collections.Subscriptions){
			if(err) cb(err)
			else cb(null, result.algo, {page : pagination.page, number : pagination.number});
		}
		else{
			cb(err, result, {page : pagination.page, number : pagination.number});
		}
		
	});
}

var get_Algos_Service_Url = function(AlgoModel, algoID, MIparams, cb) {
	AlgoModel.findOne({_id : algoID}, function(algo_err, a_data){
        if(algo_err || !a_data){
            return cb('This algorithm does not appear to be online');
        }
        
            
        //############################################################
        //############################################################
        //################ CHECK SUBSCRIPTIONN FIRST #################
        //############################################################
        //############################################################
        
        
        var rtr=0;
        restler.post(MIparams.MI_PROTOCOL + MIparams.MI_ADDR +':'+ MIparams.MI_PORT+ "/new-service-port", 
        	{ data : {_id : algoID} }).on('complete', function (body, httpResponse) {
            
	            console.log("body : "+body);
	            console.log("util.inspect(body) : "+require('util').inspect(body));
	            if(body instanceof Error || !body) {
	            	if(rtr < 10){
	                    console.log('Err : '+ body)
	                    this.retry(1000);
	                    rtr++;
	                }
	                else
	                	cb("Couldn't create the service, the IM is temporarily unavailable");	
	            }
	            else {
	            	var json = {};
	            	try{
	            		json = JSON.parse(body);
	            	}catch(e){
	            		return cb('Failure. Error message : Internal communication error');
	            	}

	            	if (json.status == 'failure'){
	            		return cb('Failure. Error message : '+json.message);
	            	}

	            	var PORT = json.message, target = MIparams.MI_ADDR+':'+PORT;

	            	var PORT = json.message, target = MIparams.MI_ADDR+':'+PORT;
	                var Proxy = require('./proxy');
	                var p = new Proxy(target, PORT);
	                console.log("Proxy sarted");
	            	cb(null, MIparams.PORTAL_EXT_PROTOCOL + MIparams.PORTAL_EXT_ADDR + ":" + PORT);
	            }
	        }
	    );
    });
}




    