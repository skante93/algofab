var express = require('express');
var router = express.Router();

var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');
var exec = require('child_process').exec;
var restler = require('restler');


module.exports = function(SG) {
	var User = SG.mongo.model('User');  
	var Algos = SG.mongo.model('Algos');
	var AlgosMeta = SG.mongo.model('AlgosMeta');
	var Subscriptions = SG.mongo.model('Subscriptions');
	var Token = SG.mongo.model('Token');
	var Context = SG.mongo.model('Context');
	var BugReports = SG.mongo.model('BugReports');
	var AVReports = SG.mongo.model('AVReports');
	
	var current_user;
	/*
	var collections = {
		User : User,
		Algos : Algos,
		AlgosMeta : AlgosMeta,
		Subscriptions : Subscriptions
	}*/
	/*
	var socketcopy = null;
	SG.io.of('/algo-page/').on('connection', function(socket){
		socketcopy = socket;
    	socket.on('room', function(room){
    		var msg = '/algo-page/'+" <<< ROOM >>> | CLIENT ADMITTED IN ROOM : "+room;
			console.log(msg);
			
			socket.join(room);
		});
    	
		socket.on('updateAlgo', function(algoID, title, description, keywords){
			AlgosMeta.update({ _id : algoID }, { $set : { title : title, description : description, keywords : keywords } }).exec(function(err){
				if (err)
					return socket.emit('updateAlgo', "failure", err);
				socket.emit('updateAlgo', 'success');
			});
		});

		socket.on('toggleHidden', function(algoID, version, username){
			AlgosMeta.findById(algoID).populate([ 'author',
			{
				path : "versions",
				match : {
					version : version
				}
			}]).exec(function(err, algo){
				if (err)
					return socket.emit('toggleHidden', "failure", version, err);
				if(!algo)
					return socket.emit('toggleHidden', "failure", version, "This algorithm does not exist");
				if (algo.versions.length == 0)
					return socket.emit('toggleHidden', "failure", version, 'The version "'+version+'" was not found.');

				if (algo.author.username != username)
					return socket.emit('toggleHidden', "failure", 'The algorithm doe not belong to you, you can\'t take such a decision');
				Algos.update({ meta : algoID, version : version }, { $set : { hidden : !algo.versions[0].hidden } }).exec(function(err){
					if(err){
						return socket.emit('toggleHidden', "failure", 'DB error');
					}
					socket.emit('toggleHidden', 'success', version, algo.versions[0].hidden);
				});
				
			});
		});

		socket.on('remove-version', function(algoID, version, username){
			AlgosMeta.findById(algoID).populate([ 'author',
			{
				path : "versions",
				match : {
					version : version
				}
			}]).exec(function(err, algo){
				if (err)
					return socket.emit('remove-version', "failure", version, err);
				if(!algo)
					return socket.emit('remove-version', "failure", version, "This algorithm does not exist");
				if (algo.versions.length == 0)
					return socket.emit('remove-version', "failure", version, 'The version "'+version+'" was not found.');

				if (algo.author.username != username)
					return socket.emit('remove-version', "failure", version, 'The algorithm doe not belong to you, you can\'t take such a decision');
				
				restler.post(SG.params.IM_PROTOCOL + SG.params.IM_ADDR +':'+ SG.params.IM_PORT+ "/remove-algo-version", 
                	{ data : {_id : algo.versions[0]._id.toString() } }
                ).on('complete', function(body, http_response){
                	console.log("body : "+body+", body.status : "+body.status);
					if(body instanceof Error){
						return socket.emit('remove-version', "failure", version, "Internal Network error.");
					}
					if(body.status == 'failure'){
						console.log(body.message);
						return socket.emit('remove-version', "failure", version, body.message);
					}
					Algos.remove({ meta : algoID, version : version }).exec(function(err){
						if(err) {
							return console.log("Remove algo from DB error :"+err);
						}
						socket.emit('remove-version', 'success', version, body.message);
						
					});
				});
				
			});
		});

		socket.on('edit-version', function(algoID, version, username, contents){
			restler.post(SG.params.IM_PROTOCOL + SG.params.IM_ADDR +':'+ SG.params.IM_PORT+ "/edit-algo-version-number", 
            	{ data : {_id : algoID, version : version, username : username, contents : contents } }
            ).on('complete', function(body, http_response){
            	console.log("body : "+body+", body.status : "+body.status);
				if(body instanceof Error){
					return socket.emit('edit-version', "failure", version, "Internal Network error.");
				}
				if(body.status == 'failure'){
					console.log(body.message);
					return socket.emit('edit-version', "failure", version, "Internal coordination error.");
				}
				socket.emit('edit-version', 'success', version, body.message);
				
			});
			/*
			AlgosMeta.findById(algoID).populate([ 'author',
			{
				path : "versions",
				match : {
					version : version
				}
			}]).exec(function(err, algo){
				if (err)
					return socket.emit('edit-version', "failure", version, err);
				if(!algo)
					return socket.emit('edit-version', "failure", version, "This algorithm does not exist");
				if (algo.versions.length == 0)
					return socket.emit('edit-version', "failure", version, 'The version "'+version+'" was not found.');

				if (algo.author.username != username)
					return socket.emit('edit-version', "failure", version, 'The algorithm doe not belong to you, you can\'t take such a decision');
				

				console.log("contents : "+util.inspect(contents))
				var unscript_mask = /<(( )*|(\t)*)*script(.)*<(( )*|(\t)*)*\/(( )*|(\t)*)*script(( )*|(\t)*)*>/;
				contents.comment = contents.comment.replace(unscript_mask, '');
				
				if(contents.version != version){
					if(!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(contents.version)){
						return socket.emit('edit-version', "failure", version, 'version is in tha wrong format');
					}
					Algos.findOne({ meta : algoID, version : contents.version }).exec(function(err, v){
						if (err){
							return socket.emit('edit-version', "failure", version, err);
						}
						if (v){
							console.log("edit-version : v : "+util.inspect(v));
							return socket.emit('edit-version', "failure", version, "The requested version already exist.");
						}

						Algos.update({ meta : algoID, version : version }, { $set : contents }).exec(function(err){
							if(err){
								return socket.emit('edit-version', "failure", 'DB error');
							}
							socket.emit('edit-version', 'success', version, contents);
						});
					});
				}
				else {
					Algos.update({ meta : algoID, version : version }, { $set : contents }).exec(function(err){
						if(err){
							return socket.emit('edit-version', "failure", 'DB error');
						}
						socket.emit('edit-version', 'success', version, contents);
					});
				}
			});
			* /-----------------
		});

		socket.on('error', function(error){
        	console.log('/algo-page/'+' <ERROR> | MESSAGE : '+error);
		});

		socket.on('disconnect', function(reason){
			console.log('/algo-page/'+' <DISCONNECT> | MESSAGE : '+reason);
		});

		socket.on('clean', function(){
			socket.disconnect();
		});
    });
	*/

	router.use(function(req, res, next){
		console.log("----------------------------------------------------------");
	    console.log("\t\t USER : MIDDLEWARE 1");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user)
			return res.redirect('/signin');

		User.findOne({_id : req.session.user._id}).populate('contributions').sort('-contributions.date').exec(function(err, result){
			//
			console.log('Err : '+err, ' result : '+result);
			if(err || !result){
				res.status(500).end('DB error');
				return;
			}

			current_user = result;
			console.log('CURRENT USER : '+util.inspect(current_user));
			next();
		});
	});

	router.get('/account', function(req, res) {
		console.log("----------------------------------------------------------");
	    console.log("\t\t USER : MIDDLEWARE 2");
	    console.log("----------------------------------------------------------");
	    console.log("PRINTING POP_MESSAGE : "+util.inspect(req.session.pop_message));
		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;


		if(!req.session.user)
			res.redirect('/');
		else {
			res.render('users_account', {pop_message : pop_message, title : req.session.user.username+ ' : Account', activeHeadersComp : 'user', user : req.session.user});
		}
	});

	router.post('/account', function(req, res) {
		console.log("----------------------------------------------------------");
	    console.log("\t\t USER : MIDDLEWARE 3");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if(!req.session.user)
			return res.redirect('/');
		
		console.log("req.body : "+ util.inspect(req.body));
		if(req.body.op && req.body.op == "password"){
			console.log("Changing password");

			console.log("+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-");
			console.log("SG.utils : " + util.inspect(SG.utils));
			console.log("SG.utils.dao : " + util.inspect(SG.utils.dao));
			console.log("SG.utils.dao.user : " + util.inspect(SG.utils.dao.user));

			global.utils.dao.user.setUsersPassword ( req.session.user, req.body.current, req.body.new, function(err, updated){
				if(err){

					console.log("Changing password failed : "+err);
					pop_message = { title : "Error", msg : err } 
					return res.render('users_account', {pop_message : pop_message, title : req.session.user.username+ ' : Account', activeHeadersComp : 'user', user : req.session.user});
				}

				console.log("Changing password done.");
				pop_message = { title : "Success", msg : "Password successfully updated" } 
				//req.session.user = updated;
				res.render('users_account', {pop_message : pop_message, title : req.session.user.username+ ' : Account', activeHeadersComp : 'user', user : req.session.user});
			});
		}
		else{
			new multiparty.Form().parse(req, function(err, fields, files){
				//console.log(fields);
				//console.log(files);
				//console.log(files.logo[0].headers);
				if(err){
					res.end('An error occurred.');
				}
				else{
					var inf = {};
					inf.company_name = fields.name[0];
					inf.email = fields.email[0];
					//inf.username = fields.username[0];
					
					if(files.logo && files.logo[0] && files.logo[0].headers ){
						var headers = files.logo[0].headers;
						var format = headers['content-type'].replace(/image\//, '');
						
						exec('mv '+files.logo[0].path+' '+ __dirname+'/../public/uploads/users/logoAccount_'+req.session.user._id+'.'+format, function(error, stdout, stderr){
							if(error) {
								console.log("Error : "+error+"\n\n\nstderr : "+stderr);
							}
							else {
								inf.logo = '/uploads/users/logoAccount_'+req.session.user._id+'.'+format;
							}

							User.findOneAndUpdate({_id : req.session.user._id}, {$set : inf}, {new : true}, function(u_err, u_data){
								
								console.log('UPDATED USER, NEW DOCS : '+util.inspect(u_data));
								
								if(u_err){
									res.end('a database error occurred');
									console.log('UPDATED USER, NEW DOCS : '+util.inspect(u_data));
								}
								else{
									req.session.user = u_data;
									Algos.update({'author.username' : u_data.username}, 
										{ 
											$set : {
												"author.name" : u_data.name, "author.username" : u_data.username, "author.contact" : u_data.email, "author.logo" : u_data.logo
											}
										}, function(a_err, a_data){
											if(a_err){
												console.log('FAILED TO UPDATE ALGOS AUTHOR FIELD');
											}
											else{
												console.log('UPDATED ALGOS, NEW DOCS : '+util.inspect(a_data));
											}

											res.redirect('/user/account');	
										});
								}
							});
						});
						
					} else {
						User.findOneAndUpdate({_id : req.session.user._id}, {$set : inf}, {new : true}, function(u_err, u_data){
							console.log('UPDATED USER, NEW DOCS : '+util.inspect(u_data));
								
							if(u_err){
								res.end('a database error occurred');
								console.log('UPDATED USER, NEW DOCS : '+util.inspect(u_data));
							}
							else{
								req.session.user = u_data;
								Algos.update({'author.username' : u_data.username}, 
									{ 
										$set : {
											"author.name" : u_data.name, "author.username" : u_data.username, "author.contact" : u_data.email, "author.logo" : u_data.logo
										}
									}, function(a_err, a_data){
										if(a_err){
											console.log('FAILED TO UPDATE ALGOS AUTHOR FIELD');
										}
										else{
											console.log('UPDATED ALGOS, NEW DOCS : '+util.inspect(a_data));
										}

										res.redirect('/user/account');	
									});
							}
						});
					}
					cleanUpUploads(files);
				}
			});
		}
	});

	router.post('/tkn', function(req, res) {
		console.log("----------------------------------------------------------");
	    console.log("\t\t USER : MIDDLEWARE 4");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if(!req.session.user)
			res.redirect('/');
		else {
			console.log("body : "+util.inspect(req.body));
			var df_rule = req.body['default-rule'], algos = req.body.algo, authors = req.body.author;

			if(!df_rule){
				req.session.pop_message = { title:"Error", msg: "Default Rule is required"};
				res.redirect("/user/history");
				return;
			}

			if(algos){
				algos = (algos instanceof Array)? algos : [algos];
			}

			if(authors){
				authors = (authors instanceof Array)? authors : [authors];
			}
			var autorizations = {
				default_rule : df_rule,
				except : {
						algos : algos,
						authors : authors
				}
			}

			console.log("autorizations : "+util.inspect(autorizations));
			//setTimeout(function(){
				SG.utils.dao.tkn_ctxt.token.new(req.session.user._id, autorizations, function(err){
					if(err){
						req.session.pop_message = { title:"Confirmation", msg: "Failed"};
						return res.redirect("/user/history");
					}
					req.session.pop_message = { title:"Confirmation", msg: "Done"};
					res.redirect("/user/history");
				});
			///}, 10*1000);
		}
	});

	router.get('/remove-tkn/:id', function(req, res) {
		console.log("----------------------------------------------------------");
	    console.log("\t\t USER : MIDDLEWARE 4");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if(!req.session.user)
			res.redirect('/');
		else {
			Token.remove({_id : req.params.id}).exec(function(err){
				if(err) {
					console.log("DB error : "+err)
					req.session.pop_message = { title:"Error", msg: "DB error"};
					res.redirect("/user/history");
					return;
				}
				res.redirect("/user/history");
			})
		}
	});

	router.get('/history', function(req, res) {
		console.log("----------------------------------------------------------");
	    console.log("\t\t USER : MIDDLEWARE 4");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if(!req.session.user)
			res.redirect('/');
		else {
			var now = new Date(), thisYear = now.getFullYear(), thisMonth = now.getMonth();
			var interv = { from : new Date(thisYear, thisMonth) };
			console.log("now : "+now+", thisYear : "+thisYear+", thisMonth : "+thisMonth+" interv.from : "+interv.from);
			global.utils.dao.user.getUserHistory(req.session.user._id, interv, function(err, history, tkns){
				
				if(err){
					console.log("Err : "+err);
					return res.render('users_history', {
						pop_message : pop_message, 
						title : 'History', 
						activeHeadersComp : 'user', 
						user : req.session.user,
						tkns_err : "DB error while retrieveing tokens"
					});
				}
				console.log("history : "+util.inspect(history));
				
				res.render('users_history', {
					pop_message : pop_message, 
					title : 'History', 
					activeHeadersComp : 'user', 
					user : req.session.user,
					history : history,
					tkns : tkns
				});
			});
		}
	});

	router.post('/credits', function(req, res) {
		//
		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user){
			return res.redirect('/');
		}

		console.log("req.body : "+util.inspect(req.body));
		if(!(req.body.price && req.body.credits)){
			req.session.pop_message = { title : "Transaction failed", msg : 'Fields "price" and credit are required'};
			return res.redirect("/user/account");
		}

		var new_credit = parseFloat(req.session.user.credits)+parseFloat(req.body.credits);
		console.log(" req.session.user.credits : "+req.session.user.credits+", req.body.credits : "+req.body.credits+", new_credit"+new_credit)
		User.findOneAndUpdate({_id : req.session.user._id}, { credits : new_credit}, {new : true} ).exec(function(err, u){
			if(err){
				console.log("DB error : "+err);
				req.session.pop_message = { title : "Transaction failed", msg : 'DB error'};
				return res.redirect("/user/account");
			}
			console.log("Cool credit is now : "+util.inspect(u));
			
			req.session.user = u;
			req.session.pop_message = { title : "Transaction succeded", msg : 'You now have '+u.credits+' credits'};
			res.redirect("/user/account");
		});
	});

	router.get('/myalgos/:id', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t ALGO : MIDDLEWARE 8");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user)
			res.redirect('/');
		else {
			
			AlgosMeta.findById(req.params.id).populate(['author', 
				{ 
					path : 'versions', 
					options : { 
						sort : {
							version : 1 
						}
					}
				}]
			).exec(function(err, data){

				if( err ) {
					//res.end('Some database error occured, come back <a href="/"> home </a>.');
		            return res.redirect("/article/list");
				}

				if(!data) {
	                //res.end("This algorithm doesn't exist (or not anymore), come back <a href=\"/\"> home </a>.");
	            	return res.redirect("/article/list");
	            }

	            if( data.author.username != req.session.user.username ){
	            	req.session.pop_message = {title : "Identity error", msg : "This algorithm is not one of yours"};
	            	return res.render("notify", {
	            		status : "danger",
	            		title : "Authorization denied",
	            		msg : "Only the author of the algorith can access this page",
	            		redirectTo : '/article/list'
	            	});
	            }
	            /*
	            var clasifiedKubeObjects = {};
	            for(var i=0; i < data.versions.length; i++){
		            var pods = [], rcs = [], svc = []; const infra = data.versions[i].deployment.kubernetes;
		            for(var j=0; j<infra.length; j++){
		            	console.log("J = "+j+" Kind = "+infra[j].kind+", name = "+infra[j].metadata.name);
		            	if(infra[j].kind == "Pod"){
		            		console.log("J = "+j+" added to pods");
		            		pods.push(infra[j].metadata.name);
		            	}
		            	else if(infra[j].kind == "ReplicationController"){
		            		console.log("J = "+j+" added to rcs");
		            		rcs.push(infra[j].metadata.name);
		            	}
		            	else if (infra[j].kind == "Service"){
		            		console.log("J = "+j+" added to svc");
		            		svc.push(infra[j].metadata.name);
		            	}
		            }

		            console.log('\n');
		            clasifiedKubeObjects[data.versions[i].version] = { 
		            	pods : (pods.legnth == 0)? undefined : pods, 
		            	rcs : (rcs.legnth == 0)? undefined : rcs, 
		            	svc : (svc.legnth == 0)? undefined : svc 
		            };
		        }
				*/
		        //console.log("clasifiedKubeObjects : "+util.inspect(clasifiedKubeObjects));
	            res.render('algo_meta_page', {
                	pop_message : pop_message, 
                	title : 'Page : algorithm ' + data.title, 
                	activeHeadersComp : 'algo', 
                	user : req.session.user, 
                	algo : data,
                	initiator : "myalgos"/*,
                	clasifiedKubeObjects : clasifiedKubeObjects*/
                });
	            /*
                var sock = require('socket.io-client')(SG.params.IM_PROTOCOL + SG.params.IM_ADDR +':'+ '32081'+"/new-kubernetes-objects");
				var cmpt = 0;
				var sockConnected = false;
				sock.on('connect', function(){
					if(sockConnected)
						return;
					const room = SG.mongo.Types.ObjectId().toString();
					sock.emit('room', room);
					sockConnected = true;
					console.log('\n\n\nSOCKET.IO-CLIENT : CONNECTED TO IM-SERVER SOCKET OF /kubernetes-objects\n\n\n');
					
					/*if(res.headersSent){
						console.log("HEADERS ALREADY SENT");
						sock.disconnect();
						return;
					}* /-------------
					
					sock.on('error', function(error){
		            	console.log(' <<< ROOM : '+room+' >>> | <ERROR> | MESSAGE : '+error);
					});

					sock.on('disconnect', function(reason){
						console.log(' <<< ROOM : '+room+' >>> | <DISCONNECT> | MESSAGE : '+reason);
					});

					console.log(' <<< ROOM >>> | ID : '+room);
					
		            
		            var io_edit = SG.io.of('/algo/edit/');
		            var connected = false;
					io_edit.on('connection', function(secondSocket){
						if(connected)
							return;
						connected = true;
						console.log('SG SOCKET OF /algo/edit : CONNECTION ESTABLISHED');
						secondSocket.on('room', function(r){
							//console.log('io_edit.in(r).clients : '+util.inspect(io_edit.clients().adapter.rooms[r] ));
							if(io_edit.clients().adapter.rooms[r] != undefined)
								return;
							secondSocket.join(r);
							
							console.log("Client joined room : "+r);
							
							
							
							for(var i=0; i < data.versions.length; i++){
								const ind = i, waitFor = 1000*ind;
								setTimeout(function(){
									sock.emit('states', room, data.versions[ind]._id);
								}, waitFor);
							}
							sock.on('states', function(version, kind, name, result){
								console.log(' PORTAL <<< IM | ROOM : '+room+' | <STATES> | VERSION : '+version+', KIND : '+kind+', NAME : '+name);
								io_edit.to(r).emit('state', kind, name, result);
							});
								
							secondSocket.on('describe', function(kind, name){
								console.log(' PORTAL >>> IM | ROOM : '+room+' | <DESCRIBE> | KIND : '+kind+', NAME : '+name);
								sock.emit('describe', room, kind, name, data.author.username);
							});
							sock.on('describe', function(kind, name, result){
								console.log(' PORTAL <<< IM | ROOM : '+room+' | <DESCRIBE> | KIND : '+kind+', NAME : '+name);
								io_edit.to(r).emit('describe', kind, name, result);
							});
							
							secondSocket.on('full description', function(kind, name){
								console.log(' PORTAL >>> IM | ROOM : '+room+' | <FULL DESCRIPTION> | KIND : '+kind+', NAME : '+name);
								console.log('\nSG SOCKET ON full description : "'+kind+'" '+name);
								sock.emit('full description', room, kind, name, data.author.username);
							});
							sock.on('full description', function(kind, name, result){
								console.log(' PORTAL <<< IM | ROOM : '+room+' | <FULL DESCRIPTION> | KIND : '+kind+', NAME : '+name);
								io_edit.to(r).emit('full description', kind, name, result);
							});
							
							secondSocket.on('new spec', function(id, kind, name, spec){
								console.log(' PORTAL >>> IM | ROOM : '+room+' | <NEW SPEC> | KIND : '+kind+', NAME : '+name);
								console.log('\nSG SOCKET ON new spec : "'+kind+'" '+name);
								sock.emit('new spec', room, id, kind, name, spec, data.author.username);
							});
							sock.on('new spec', function(kind, name, result){
								console.log(' PORTAL <<< IM | ROOM : '+room+' | <NEW SPEC> | KIND : '+kind+', NAME : '+name);
								io_edit.to(r).emit('new spec', kind, name, result);
							});
							
							secondSocket.on('clean', function(){
								console.log(' PORTAL >>> IM | ROOM : '+room+' | <CLEAN>');
								if (sock){
									sock.emit('clean', room);
									sock.disconnect();
								}
							});
							
						});
					});
						
				});
				*/
			}); 
		}
	});
	
	router.get('/myalgos', function(req, res) {
		console.log("----------------------------------------------------------");
	    console.log("\t\t USER : MIDDLEWARE 5");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;
		
		if (!req.session.user)
			res.redirect('/');
		else {
			var pop_Query = {
				path : "author",
				match : {
					username : req.session.user.username
				}
			};
			AlgosMeta.find().populate(pop_Query).exec(function(err, data){
				//
				if (err){
					//
					res.end('Error : '+err+', come back <a href="/"> home </a>');
				}
				var algos = [];
				data.forEach(function(algo){ if(algo.author) algos.push(algo); });

				res.render('algo_list', 
					{
						pop_message : pop_message, 
						title : 'My Algorithms', 
						activeHeadersComp : 'user', 
						user : req.session.user, 
						algos : algos, 
						initiator : "myalgos"
					}
				);
			});
			/*
			paginatingAlgoList(collections, req.session.user.username, "myalgos", {page : req.query.page, number : req.query.number}, function(err, data, real_pagination){
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
							initiator : "myalgos",
							page : real_pagination.page,
							number : real_pagination.number
						}
					);
				}
			});
			*/
		}
	});

	router.get('/algos', function(req, res) {
		console.log("----------------------------------------------------------");
	    console.log("\t\t USER : MIDDLEWARE 6");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;
		
		if (!req.session.user)
			res.redirect('/');
		else {
			var max_nb_algos = current_user.contributions.length;
			var number = (req.query.number)? ( (req.query.number < max_nb_algos)? Math.max(5, req.query.number) : 5) : 5;
			var page = (req.query.page)? Math.max(0, req.query.page) : 0;
			page = (page*number > max_nb_algos)? parseInt(max_nb_algos/req.query.number) : page;
	
			AlgosMeta.find().populate({
				path : "author",
				match : {
					username : req.session.user.username
				}
			}).skip(page*number).limit(Math.min(max_nb_algos, (page+1)*number)).exec(function(err, data){
				if (err){
					pop_message = {title : "Error", msg : "DB error"};
					console.log('DB error : '+err)
					return res.render('algo_list', {
						pop_message : pop_message, 
						title : 'My Algorithms', 
						activeHeadersComp : 'user', 
						user : req.session.user, 
						algos : data, 
						page : page
					});
				}
				
				res.render('algo_list', {
					pop_message : pop_message, 
					title : 'My Algorithms', 
					activeHeadersComp : 'user', 
					user : req.session.user, 
					algos : data, 
					page : page
				});
			})
			
		}
	});

	router.get('/subscriptions', function(req, res) {
		console.log("----------------------------------------------------------");
	    console.log("\t\t USER : MIDDLEWARE 7");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user)
			res.redirect('/');
		else {
			Subscriptions.findOne({ user : req.session.user._id.toString() }).populate({
				path : "algos",
				populate : {
					path : "author"
				}
			}).exec(function(s_err, s_data){
				if (s_err){
					res.end("DB error.")
				}
				else if(!s_data || s_data.algos.length == 0){

					res.render('algo_subscribe', {pop_message : pop_message, title : 'Subscriptions', activeHeadersComp : 'user', user : req.session.user, algos : [], page : 0});
				}
				else{
					res.render('algo_subscribe', {pop_message : pop_message, title : 'Subscriptions', activeHeadersComp : 'user', user : req.session.user, algos : s_data.algos, page : 0});
				}

			});
			
		}
	});

	router.post('/subscriptions', function(req, res) {
		console.log("----------------------------------------------------------");
	    console.log("\t\t USER : MIDDLEWARE 8");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user) {
			res.redirect('/');
		}
		else {
			console.log('require("util").inspect(req.body) : '+require("util").inspect(req.body));
			if(!req.body.title){
				return res.render('algo_subscribe', {iframing : true, err: 'Field "Name" is obligatory.'});
			}

			AlgosMeta.findOne({title : req.body.title}).populate('author').exec(function(err, data){
				if(err || !data){
					res.render('algo_subscribe', {iframing : true, err: 'DB error, are you sure algo "'+req.body.title+'" exist?'});
					console.log(" -- err : "+err);
				} else {
					Subscriptions.findOne( { user : req.session.user._id.toString() }).populate({
						path : 'algos',
						match : {
							title : req.body.title
						}
					}).exec(function(err2, data2){
						if(err2){
							res.render('algo_subscribe', {iframing : true, err: "DB error."});
							console.log(" -- err2 : "+err2);
						}
						else if(!data2){
							var newSubs = new Subscriptions({user : req.session.user._id.toString(), algos : [data._id] });
							newSubs.save(function(error){
								if(error){
									res.render('algo_subscribe', {iframing : true, err: "DB error."});
								}
								else {
									res.render('algo_subscribe', {iframing : true, err: "Subscription complete"});
								}
							});
						}
						else if(data2.algos.length != 0){
							res.render('algo_subscribe', {iframing : true, err: "Already subscribed"});
						}
						else {

							//var newSubs = new Subscriptions({algoname : req.body.title, username : req.session.user.username});
							data2.algos.push(data._id);
							data2.save(function(error){
								if(error){
									res.render('algo_subscribe', {iframing : true, err: "DB error."});
								}
								else {
									res.render('algo_subscribe', {iframing : true, err: "Subscription complete"});
								}
							});
						}
					});
				}
			});
			
		}
	});

	router.post('/unsubscribe', function(req, res) {
		console.log("----------------------------------------------------------");
	    console.log("\t\t USER : MIDDLEWARE 9");
	    console.log("----------------------------------------------------------");

		var pop_message = req.session.pop_message;
		if (pop_message)
			req.session.pop_message = undefined;

		if (!req.session.user)
			res.redirect('/');
		else {
			console.log('require("util").inspect(req.body) : '+require("util").inspect(req.body));
			if(!req.body.title){
				return res.render('algo_subscribe', {iframing : true, err: 'Field "Name" is obligatory.'});
			}
			AlgosMeta.findOne({title : req.body.title}).populate('author').exec(function(err, data){
				if(err || !data){
					res.render('algo_subscribe', {iframing : true, err: 'DB error, are you sure algo "'+req.body.title+'" exist?'});
					console.log(" -- err : "+err);
				} else {
					Subscriptions.findOne({ user : req.session.user._id.toString()}).exec(function(err, subs){

						if(err){
							console.log("Err : "+err);
							return res.render('algo_subscribe', {iframing : true, err: 'DB error'});
						}

						if(!subs || subs.algos.indexOf(data._id.toString()) < 0){
							return res.render('algo_subscribe', {iframing : true, err: 'You did not subscribe to this algorithm.'});
						}
						console.log("id : "+data._id.toString()+", subs.algos : "+util.inspect(subs.algos));
						var ind = subs.algos.indexOf(data._id.toString());
						console.log("ind : "+ind);
						subs.algos.splice(ind, 1);
						console.log("subs.algos : "+util.inspect(subs.algos));
						subs.save(function(err, s){
							if(!err){
								console.log("Unsubcribed successfully, subs : "+util.inspect(s));
								res.render('algo_subscribe', {iframing : true, err: 'Unsubsription done'});
							}
							else{
								console.log("unsubscribe failed, err : "+err);
								res.render('algo_subscribe', {iframing : true, err: 'DB error : Unsubsription failed'});
							}
						});
					});
				}
			});
		}
	});

	router.get('/bugreports', function(req, res){
		//
		AVReports.find({ addressedTo : req.session.user._id}).sort({"date": "desc"}).populate(["emittedBy", { path : "article_version", populate : { path : "articleID" } }]).exec(function(err, reports){
			//

			res.render('user/bugreports', { title : "Bug Reports", activeHeadersComp : 'user', user : req.session.user, reports : reports, err : err });
		});
	});
	
	router.post('/bugreports', function(req, res){
		//
		var addressedTo = req.body.authorID, message = req.body.report, algo_version = req.body.versionID;

		if( !(addressedTo && message && algo_version) ){
			console.log("REQ.BODY : "+util.inspect(req.body));
			return res.render('bugreports', { title : "Bug Reports", activeHeadersComp : 'user', user : req.session.user, reports : [], err : "Something is missing with the form" });
		}
		
		var n = new BugReports({ emittedBy : req.session.user._id, addressedTo : addressedTo, message : message, algo_version : algo_version});
		n.save(function(err){
			if(err){
				console.log("DB error : "+err);	
			}
			res.redirect("/article/list");
		});
		
	});

	router.get("/:id/delete", function(req, res){
		//
		if (req.session.user._id.toString() != req.params.id){
			return res.status(403).end("Unauthorized.");
		}

		utils.dao.user.delete(req.session.user, function(err){
			if (err){
				return res.status(500).end(err.toString());
			}

			User.deleteOne({_id: req.session.user._id.toString()}, function(err){
				req.session.user = undefined;

				return res.end(`
					<html>
						<head><title>Deleting User acoint</title></head>
						<body>
							<h2> Account successfully deleted, redirection in <span id="countDown"></span> seconds</h2>
							<script>
								var c = 5;
								setTimeout(function(){
									if (c == 0){
										return window.location.url = "/";
									}
									document.getElementById("countDown").text = c;
									c--;
								}, 1000)
							</script>
						</body>
					</html>
				`);
			});
		});
	});
	return router;
}

function cleanUpUploads(files){
	for (var n in files){
		for(var i=0; i<files[n].length; i++)
			require('child_process').spawn('rm', ['-r', files[n][i].path]);
	}
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
		
		if(reason == "subscriptions"){
			if(err) cb(err)
			else cb(null, result.algo, {page : pagination.page, number : pagination.number});
		}
		else if (reason == "myalgos"){
			result = result.filter(function(result){
		        return result.author;
		    });
		    cb(err, result, {page : pagination.page, number : pagination.number});
		}
		else{
			cb(err, result, {page : pagination.page, number : pagination.number});
		}
		
	});
}
