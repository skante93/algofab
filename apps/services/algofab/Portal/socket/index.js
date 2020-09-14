
//var socket_io = require('socket-io')

//var cookieParser = require('cookie-parser')();
//var session = require('express-session')({secret: 'algofab secret', cookie:{maxAge: 15*1000}});
//var MemoryStore = new (require('express-session').MemoryStore)();
var cookie = require('cookie');
var fs = require("fs"),  util = require('util');
var restler = require("restler");
var request = require('request');

//console.log('MemoryStore : '+util.inspect( MemoryStore.get ));
//console.log('session : '+util.inspect(session));

var unscript_mask = /<(( )*|(\t)*)*script(.)*<(( )*|(\t)*)*\/(( )*|(\t)*)*script(( )*|(\t)*)*>/;
var LOG_TIMERS = {}, RMV_ALGO_TIMERS = {};

//module.exports = function(SG){
	//
var Algos = global.mongo.model('Algos');
var AlgosMeta = global.mongo.model('AlgosMeta');
var Article = global.mongo.model('Article');
var ArticleVersionData = global.mongo.model('ArticleVersionData');

//console.log("*** Connecting via socket to "+('http://'+ process.env.IM_SERVICE_HOST));

var im_socket = require('socket.io-client')('http://'+ process.env.IM_SERVICE_HOST);
var IM_SOCKET_CONNECTED = false;
im_socket.on('connect', function(){
	IM_SOCKET_CONNECTED = true;

	console.log("------------IM_SOCKET_CONNECTED is true------------");

	//socket_client_im.emit('states', "59ef155a0ae7812ed2bdbedd");
	//socket_client_im.on('states', function(version, kind, name, state){
	//	console.log("SOCKET RESPONSE : "+version+" "+kind+" "+name+" : "+state);
	//});
});

var im_client = function(main_socket){
	//
	this.states = function(socket_id, version, kind, name, state){
		if(socket_id == main_socket.id) {
			main_socket.emit('states', version, kind, name, state);
			console.log('PORTAL <<<<<<<< IM | <STATES> '+version+" "+kind+" "+name+" : "+state);
		}
	}

	this.events = function(socket_id, kind, name, result){
		if(socket_id == main_socket.id) {
			console.log(' PORTAL <<<<<<<< IM | <EVENTS> | KIND : '+kind+', NAME : '+name);
			console.log("result : "+result);
			main_socket.emit('events', kind, name, result);
		}
	}
	
	this.spec = function(socket_id, kind, name, result){
		//console.log(socket_id+' : PORTAL <<<<<<<< IM | <EVENTS> | KIND : '+kind+', NAME : '+name);
			
		if(socket_id == main_socket.id) {
			console.log(' PORTAL <<<<<<<< IM | <SPEC> | KIND : '+kind+', NAME : '+name);
			console.log("result : "+result);
			main_socket.emit('spec', kind, name, result);
		}
	}

	this.new_spec = function(socket_id, kind, name, result){
		//console.log(socket_id+' : PORTAL <<<<<<<< IM | <EVENTS> | KIND : '+kind+', NAME : '+name);
			
		if(socket_id == main_socket.id) {
			console.log(' PORTAL <<<<<<<< IM | <NEW SPEC> | KIND : '+kind+', NAME : '+name);
			console.log("result : "+result);
			main_socket.emit('new spec', kind, name, result);
		}
	}

	this.edit_version = function(socket_id, status, algoID, message){
		//console.log(socket_id+' : PORTAL <<<<<<<< IM | <EVENTS> | KIND : '+kind+', NAME : '+name);
			
		if(socket_id == main_socket.id) {
			console.log(' PORTAL <<<<<<<< IM | <EDIT VERSION> | STATUS : '+status+', ALGOID : '+algoID+", MESSAGE : "+message);
			main_socket.emit('edit version', status, algoID, message);
		}
	}

	this.edit_version_progress = function(socket_id, algoID, message){
		//console.log(socket_id+' : PORTAL <<<<<<<< IM | <EVENTS> | KIND : '+kind+', NAME : '+name);
			
		if(socket_id == main_socket.id) {
			console.log(' PORTAL <<<<<<<< IM | <EDIT VERSION PROGRESS> | ALGOID : '+algoID+", MESSAGE : "+message);
			main_socket.emit('edit version progress', algoID, message);
		}
	}

	this.create_version = function(socket_id, status, vid, message){
		//console.log(socket_id+' : PORTAL <<<<<<<< IM | <EVENTS> | KIND : '+kind+', NAME : '+name);
			
		if(socket_id == main_socket.id) {
			console.log(' PORTAL <<<<<<<< IM | <CREATE VERSION> | STATUS : '+status+", MESSAGE : "+message);
			message += (status == 'failure')? ". Creation aborted" : "";
			main_socket.emit('create version', status, message );

			if (status == 'failure') {
				
				Algos.remove({ _id : vid }).exec(function(err){ console.log( (err)? "Could not remove version because : "+err : "Version successfully removed after creation failed" ); });
			}

		}
	}

	this.create_version_progress = function(socket_id, message){
		//console.log(socket_id+' : PORTAL <<<<<<<< IM | <EVENTS> | KIND : '+kind+', NAME : '+name);
			
		if(socket_id == main_socket.id) {
			console.log(' PORTAL <<<<<<<< IM | <CREATE VERSION PROGRESS> | MESSAGE : '+message);
			main_socket.emit('create version progress', message);
		}
	}

	im_socket.on('states', this.states);
	im_socket.on('events', this.events);
	im_socket.on('spec', this.spec);
	im_socket.on('new spec', this.new_spec);
	im_socket.on('edit version', this.edit_version);
	im_socket.on('edit version progress', this.edit_version_progress);
	im_socket.on('create version', this.create_version);
	im_socket.on('create version progress', this.create_version_progress);

	this.clean = function(){
		im_socket.removeListener('states', this.states);
		im_socket.removeListener('events', this.events);
		im_socket.removeListener('spec', this.spec);
		im_socket.removeListener('new spec', this.new_spec);
		im_socket.removeListener('edit version', this.edit_version);
		im_socket.removeListener('edit version progress', this.edit_version_progress);
		im_socket.removeListener('create version', this.create_version);
		im_socket.removeListener('create version progress', this.create_version_progress);

		delete this.states;
		delete this.events;
		delete this.spec;
		delete this.new_spec;
		delete this.edit_version;
		delete this.edit_version_progress;
		delete this.create_version;
		delete this.create_version_progress;
	}
}

module.exports = function(server, sessionStore) {
	//console.log("Session Store : "+util.inspect(sessionStore.load));

	var resource_data_writter = {}; 

	var socket_io = require('socket.io')(server);
	socket_io.use(function(socket, next) {
		//session(socket.handshake, {}, next);
		console.log("Authorization Middleware");
		
		if(!socket.handshake.headers.cookie) {
	    	return callback('No cookie transmitted.', false);
	    }
	    console.log("Authorization Middleware : debug 1");
	    var cookies = cookie.parse(socket.handshake.headers.cookie);
	    //console.log("Cookies : "+util.inspect(cookies));
	    
	    console.log("Authorization Middleware : debug 2");
	    if(!cookies || !cookies['connect.sid']){
	    	return next(new Error('No cookie transmitted.'));
	    }

	    console.log("Authorization Middleware : debug 3");
	    var sid = cookies['connect.sid'];
	    //console.log("sid : "+sid);
	    
	    var storeID = sid.substring(2, 34);
	    //console.log("storeID : "+storeID); 
	    
	    sessionStore.load(storeID, function(err, sess) {

	    	if(err || !sess) return next(new Error("Could not retrieve session"));
	    	console.log(err || 'SESS : '+util.inspect(sess));
	    	
	    	//console.log("Authorization Middleware : debug 4");
	    	socket.handshake.session = sess;
	    	next();
	    	
	    	LOG_TIMERS[socket.id] = setInterval(function(){
	    		sessionStore.load(storeID, function(err1, sess1) {
	    			//
	    			if(err1 || !sess1){

	    				console.log("Disconnected");
		    			socket.emit('logout');

	    				clearInterval(LOG_TIMERS[sess.socket_room]);
	    				LOG_TIMERS[sess.socket_room] = undefined;
		    		}
	    		});
	    	}, global.settings.SOCKET_LOG_TIMER);
	    	
	    });
	});

	socket_io.on('connection', function(socket){
		
		
		var session = socket.handshake.session;
		//console.log("SESSION : "+util.inspect(session));

		var client = new im_client(socket);

		socket.on('room', function(room){
			var msg = '/algo-page/'+" <<< ROOM >>> | CLIENT ADMITTED IN ROOM : "+room;
    		console.log(msg);
			socket.join(room);

			socket.emit("Hello", global.mongo.Types.ObjectId().toString());
		});

		socket.on('states', function(id){
			//
			console.log(' PORTAL >>>>>>>> IM | <STATES> '+id);
			im_socket.emit('states', socket.id, id);

		});

		socket.on('events', function(kind, name){
			console.log(' PORTAL >>>>>>>> IM | <EVENTS> | KIND : '+kind+', NAME : '+name);
			im_socket.emit('events', socket.id, kind, name, session.user.username);
		});
		
		socket.on('spec', function(kind, name){
			console.log(' PORTAL >>>>>>>> IM | <SPEC> | KIND : '+kind+', NAME : '+name);
			//console.log('\nSG SOCKET ON full description : "'+kind+'" '+name);
			im_socket.emit('spec', socket.id, kind, name, session.user.username);
		});

		socket.on('new spec', function(vid, kind, name, spec){
			console.log(' PORTAL >>>>>>>> IM | <NEW SPEC> | KIND : '+kind+', NAME : '+name);
			//console.log('\nSG SOCKET ON full description : "'+kind+'" '+name);
			im_socket.emit('new spec', socket.id, vid, kind, name, spec, session.user.username);
		});

		socket.on('create algo', function(title, description, keywords, logo){
			console.log(' <UPDATE ALGO> | TITLE : '+title+', DESCRIPTION : '+description);
			if (!title){
				return socket.emit('create algo', 'failure', 'Fields "Title" is required');
			}
			if (!description){
				return socket.emit('create algo', 'failure', 'Fields "Description" is required');
			}
			AlgosMeta.findOne({ title : title }).exec(function(err, algo){
				if(err){
					return socket.emit('create algo', 'failure', 'DB error');
				}
				console.log('title : '+title+", algo : "+util.inspect(algo));
				if(algo){
					return socket.emit('create algo', 'failure', 'The algorithm "'+title+'" does already exist in the DB');
				}

				var n_algo = {};
				if(description){
					if (unscript_mask.test(description)){
						return socket.emit('create algo', 'failure', 'description field should not have a <script><script> tag');
					}
					n_algo.description = description;
					socket.emit('create algo progress', 'description OK');
				}

				if(keywords) {
					n_algo.keywords = keywords;
					socket.emit('create algo progress', 'Tags OK');
				}
				
				n_algo._id = global.mongo.Types.ObjectId().toString();
				n_algo.author = session.user._id.toString();

				if(logo){
					var base64Data = logo.replace(/^data:image\/.+;base64,/,""),
					binaryData = new Buffer(base64Data, 'base64').toString('binary');
					var extension = logo.replace(base64Data, "");
					extension = extension.replace(/^data:image\//, '').replace(";base64,", '');
					console.log("extension : "+extension);
					var logo_path = __dirname+"/../public/img/logo/"+n_algo._id+"."+extension;
					try {
						fs.writeFileSync(logo_path, binaryData, "binary");
						n_algo.logo = logo_path.replace(__dirname+"/../public", '');
						socket.emit('create algo progress', 'logo OK');
					}
					catch(e){
						//
						console.log("could not create logo, error : "+e);
						socket.emit('create algo progress', 'logo : Error');
					}
				}

				if(title){
					n_algo.title = title;
				}

				var new_algo = new AlgosMeta(n_algo);
				new_algo.save(function(err, u){
					console.log("new algo : "+util.inspect(u));
					if(err){
						console.log("err");
						return socket.emit('create algo', 'failure', 'DB error');
					}
					socket.emit('create algo', 'success', "algorithm successfully created, <a href= \"/user/myalgos/"+u._id+"\">here is its page</a>.");
				});

			});
		});

		socket.on('create article', function(name, short_intro, description, keywords, categories, logo){
			console.log(' <UPDATE ARTICLE> | TITLE : '+name+', DESCRIPTION : '+description);
			if (!name){
				return socket.emit('create article', 'failure', 'Fields "Title" is required');
			}
			if (!short_intro){
				return socket.emit('create article', 'failure', 'Fields "short_intro" is required');
			}
			if (!description){
				return socket.emit('create article', 'failure', 'Fields "Description" is required');
			}
			Article.findOne({ name : name }).exec(function(err, article){
				if(err){
					return socket.emit('create article', 'failure', 'DB error');
				}
				console.log('name : '+name+", article : "+util.inspect(article));
				if(article){
					return socket.emit('create article', 'failure', 'The algorithm "'+name+'" does already exist in the DB');
				}

				var n_article = {};
				if(description){
					if (unscript_mask.test(description)){
						return socket.emit('create article', 'failure', 'description field should not have any <script></script> tag');
					}
					n_article.description = description;
					socket.emit('create article progress', 'description OK');
				}

				if(keywords) {
					n_article.tags = keywords;
					socket.emit('create article progress', 'Tags OK');
				}
				
				n_article._id = global.mongo.Types.ObjectId().toString();
				n_article.author = session.user._id.toString();

				if(logo){
					var base64Data = logo.replace(/^data:image\/.+;base64,/,""),
					binaryData = new Buffer(base64Data, 'base64').toString('binary');
					var extension = logo.replace(base64Data, "");
					extension = extension.replace(/^data:image\//, '').replace(";base64,", '');
					console.log("extension : "+extension);
					var logo_path = __dirname+"/../public/img/logo/"+n_article._id+"."+extension;
					try {
						fs.writeFileSync(logo_path, binaryData, "binary");
						n_article.logo = logo_path.replace(__dirname+"/../public", '');
						socket.emit('create article progress', 'logo OK');
					}
					catch(e){
						//
						console.log("could not create logo, error : "+e);
						socket.emit('create article progress', 'logo : Error');
					}
				}

				n_article.name = name;
				n_article.short_intro = short_intro;
				
				if (isNaN(categories.technical) || settings.ARTICLE_CATEGORIES.technical.filter(e=> e.id == categories.technical).length == 0 ){
					return socket.emit('create article', 'failure', `Technical catagory "${categories.technical}" not supported.`);
				}
				else{
					n_article.technical_category = categories.technical;
				}
				
				if (isNaN(categories.business) || settings.ARTICLE_CATEGORIES.business.filter(e=> e.id == categories.business).length == 0 ){
					return socket.emit('create article', 'failure', `Business catagory "${categories.business}" not supported.`);
				}
				else{
					n_article.business_category = categories.business;
				}
				
				if (isNaN(categories.types) || settings.ARTICLE_CATEGORIES.types.filter(e=> e.id == categories.types).length == 0 ){
					return socket.emit('create article', 'failure', `Asset type "${categories.types}" not supported.`);
				}
				else{
					n_article.asset_type = categories.types;
				}
				

				var new_article = new Article(n_article);
				new_article.save(function(err, u){
					console.log("new article : "+util.inspect(u));
					if(err){
						console.log("err");
						return socket.emit('create article', 'failure', 'DB error');
					}
					socket.emit('create article', 'success', "Article successfully created, <a href= \"/article/"+u._id+"\">here is its page</a>.");
				});

			});
		});

		socket.on('update algo', function(algoMetaID, title, description, keywords, logo){
			console.log(' <UPDATE ALGO> | TITLE : '+title+', DESCRIPTION : '+description);
			AlgosMeta.findById(algoMetaID).populate("author").exec(function(err, algo){
				if(err){
					return socket.emit('update algo', 'failure', 'DB error');
				}
				if(!algo){
					return socket.emit('update algo', 'failure', 'The requested algorithm does not exist in the DB');
				}

				if(algo.author.username != session.user.username){
					return socket.emit('update algo', 'failure', 'Only the author is allow to make such an operation');
				}
				var set = {};
				if(description){
					if (unscript_mask.test(description)){
						return socket.emit('update algo', 'failure', 'description field should not have a <script><script> tag');
					}
					set.description = description;
					socket.emit('update algo progress', 'description OK');
				}

				if(keywords) {
					set.keywords = keywords;
					socket.emit('update algo progress', 'Tags OK');
				}

				if(logo){
					var base64Data = logo.replace(/^data:image\/.+;base64,/,""),
					binaryData = new Buffer(base64Data, 'base64').toString('binary');
					var extension = logo.replace(base64Data, "");
					extension = extension.replace(/^data:image\//, '').replace(";base64,", '');
					console.log("extension : "+extension);
					var logo_path = __dirname+"/../public/img/logo/"+algoMetaID+"."+extension;
					try {
						fs.writeFileSync(logo_path, binaryData, "binary");
						set.logo = logo_path.replace(__dirname+"/../public", '');
						socket.emit('update algo progress', 'logo OK');
					}
					catch(e){
						//
						console.log("could not create logo, error : "+e);
						socket.emit('update algo progress', 'logo : Error');
					}
				}

				if(title){
					if(title == algo.title){
						return AlgosMeta.update({ _id : algoMetaID }, { $set : set }).exec(function(err){
							if (err)
								return socket.emit('updateAlgo', "failure", "DB error");
							socket.emit('update algo', 'success', 'algorithm successfully updated');
						});
					}

					AlgosMeta.findOne({ title : title }).exec(function(err, found){
						if(err)
							return socket.emit('update algo', 'failure', 'DB error');
						if(found)
							return socket.emit('update algo', 'failure', 'An algorithm with title : '+title+' already exist');
						set.title = title;

						AlgosMeta.update({ _id : algoMetaID }, { $set : set }).exec(function(err){
							if (err)
								return socket.emit('updateAlgo', "failure", "DB error");
							socket.emit('update algo', 'success', 'algorithm successfully updated');
						});
					});
				}
				else if(set.description || set.keywords || set.logo){
					AlgosMeta.update({ _id : algoMetaID }, { $set : set }).exec(function(err){
						if (err)
							return socket.emit('updateAlgo', "failure", "DB error");
						socket.emit('update algo', 'success', 'algorithm successfully updated');
					});
				}
				else {
					socket.emit("update algo", 'success', 'algorithm successfully updated');
				}


			});
		});

		socket.on('update article', function(articleID, name, short_intro, description, tags, categories, logo){
			console.log(' <UPDATE ARTICLE> | NAME : '+name+', DESCRIPTION : '+description);
			Article.findById(articleID).populate("author").exec(function(err, article){
				if(err){
					return socket.emit('update article', 'failure', 'DB error');
				}
				if(!article){
					return socket.emit('update article', 'failure', 'The requested article does not exist in the DB');
				}

				if(article.author.username != session.user.username){
					return socket.emit('update article', 'failure', 'Only the author is allow to make such an operation');
				}
				var set = {};
				if(description && description != article.description){
					if (unscript_mask.test(description)){
						return socket.emit('update article', 'failure', 'description field should not have a <script></script> tag');
					}
					set.description = description;
					socket.emit('update article progress', 'description OK');
				}

				if(short_intro && short_intro != article.short_intro){
					set.short_intro = short_intro;
					socket.emit('update article progress', 'short intro OK');
				}

				console.log("categories: ", categories);

				
				if (categories.technical &&(isNaN(categories.technical) || settings.ARTICLE_CATEGORIES.technical.filter(e=> e.id == categories.technical).length == 0 )){
					return socket.emit('create article', 'failure', `Technical catagory "${categories.business}" not supported.`);
				}
				else if (categories.technical && categories.technical != article.technical_category){
					set.technical_category = categories.technical;
					console.log("set.technical_category : ", set.technical_category);
					socket.emit('update article progress', 'technical category OK');
				}

				if (categories.business &&(isNaN(categories.business) || settings.ARTICLE_CATEGORIES.business.filter(e=> e.id == categories.business).length == 0 )){
					return socket.emit('create article', 'failure', `Technical catagory "${categories.business}" not supported.`);
				}
				else if (categories.business && categories.business != article.business_category){
					set.business_category = categories.business;
					console.log("set.business_category : ", set.business_category);
					socket.emit('update article progress', 'business category OK');
				}
				
				if (categories.types && (isNaN(categories.types) || settings.ARTICLE_CATEGORIES.types.filter(e=> e.id == categories.types).length == 0 )){
					return socket.emit('create article', 'failure', `Technical catagory "${categories.types}" not supported.`);
				}
				else if (categories.types && categories.types != article.asset_type){
					set.asset_type = categories.types;
					console.log("set.asset_type : ", set.asset_type);
					socket.emit('update article progress', 'asset type OK');
				}

				
				
				if(tags && JSON.stringify(tags) != JSON.stringify(article.tags)) {
					set.tags = tags;
					socket.emit('update article progress', 'Tags OK');
				}

				if(logo){
					var base64Data = logo.replace(/^data:image\/.+;base64,/,""),
					binaryData = new Buffer(base64Data, 'base64').toString('binary');
					var extension = logo.replace(base64Data, "");
					extension = extension.replace(/^data:image\//, '').replace(";base64,", '');
					console.log("extension : "+extension);
					var logo_path = __dirname+"/../public/img/logo/"+articleID+"."+extension;
					try {
						fs.writeFileSync(logo_path, binaryData, "binary");
						set.logo = logo_path.replace(__dirname+"/../public", '');
						socket.emit('update article progress', 'logo OK');
					}
					catch(e){
						//
						console.log("could not create logo, error : "+e);
						socket.emit('update article progress', 'logo : Error');
					}
				}

				if(name){
					if(name == article.name){
						return Article.update({ _id : articleID }, { $set : set }).exec(function(err){
							if (err)
								return socket.emit('update article', "failure", "DB error");
							socket.emit('update article', 'success', 'algorithm successfully updated');
						});
					}

					Article.findOne({ name : name }).exec(function(err, found){
						if(err)
							return socket.emit('update article', 'failure', 'DB error');
						if(found)
							return socket.emit('update article', 'failure', 'An algorithm with title : '+name+' already exist');
						set.name = name;
						Article.update({ _id : articleID }, { $set : set }).exec(function(err){
							if (err)
								return socket.emit('update article', "failure", "DB error");
							socket.emit('update article', 'success', 'algorithm successfully updated');
						});
					});
				}
				else if(set.description || set.short_intro || set.tags || set.logo || set.technical_category || set.business_category || set.asset_type){
					Article.update({ _id : articleID }, { $set : set }).exec(function(err){
						if (err)
							return socket.emit('updateAlgo', "failure", "DB error");
						socket.emit('update article', 'success', 'algorithm successfully updated');
					});
				}
				else {
					socket.emit("update article", 'success', 'algorithm successfully updated');
				}
			});
		});
		// socket.on('upload resource data init', function(versionID){
		// 	console.log(' <UPLOAD RESOURCE DATA INIT> | versionID : '+versionID);
		// 	console.log("process.cwd(): ", process.cwd());
		// 	console.log("fs.readdirSync(process.cwd()): ", fs.readdirSync(process.cwd()));
		// 	resource_data_writter[versionID] = [];//fs.createWriteStream(process.cwd()+'/resourceData/'+versionID+'.tar');
		// });

		// socket.on('upload resource data progress', function(versionID, data){
		// 	console.log(' <UPLOAD RESOURCE DATA PROGRESS> | versionID : '+versionID);
			
		// 	resource_data_writter[versionID].push(data);
		// });
		
		socket.on('upload resource data', function(versionID, data, transfer_state){
			console.log(' <UPLOAD RESOURCE DATA> | versionID : '+versionID, ", transfer_state : ", transfer_state);
			if (transfer_state.start == 0){
				console.log("beginning the tasks");
				resource_data_writter[versionID] = [data];
			}
			else {
				
				resource_data_writter[versionID].push(data);
				
			}
			
			if (transfer_state.end < transfer_state.size){
				console.log("right in the middle");
			}
			else{
				console.log("end of the transfert");
				//console.log("data: ", resource_data_writter[versionID]);
				new ArticleVersionData({ 
					_id: versionID,
					name: transfer_state.name, 
					type: transfer_state.type, 
					data: resource_data_writter[versionID].join('') 
				}).save(function(err, saved){
					if (err){
						console.log(err);
						return;
					}
					//console.log("resource data saved: ", saved);
					socket.emit('upload resource data', transfer_state.start, 'success');
				});
				return;
			}

			socket.emit('upload resource data', transfer_state.start, 'success');
		});

		// socket.on('upload resource data end', function(versionID){
		// 	console.log(' <UPLOAD RESOURCE DATA END> | versionID : '+versionID);
		// 	//resource_data_writter[versionID].end();
		// 	var data = resource_data_writter[versionID].join('');

		// 	fs.writeFileSync(process.cwd()+'/resourceData/'+versionID+'.tar', data.split(';base64,').pop(), {encoding: 'base64'});
		// 	socket.emit('upload resource data', 'success', '/path/to/data');
		// });

		socket.on('remove algo', function(algoMetaID){
			console.log(' <REMOVE ALGO> | ID : '+algoMetaID);
			AlgosMeta.update({ _id : algoMetaID, author : session.user._id}, { $set : { delete_date : Date.now()+global.settings.TIME_TO_WAIT_BEFORE_DELETING_ALGO } }).exec(function(err, u){
				if(err){
					return socket.emit('remove algo', 'failure', 'DB error');
				}
				console.log("Delete period started "+util.inspect(u));
				socket.emit('remove algo', 'success');
				
				var del = function(){
					console.log("DEL CALLED");
					AlgosMeta.remove({_id : algoMetaID}, function(err){
						if(err){
							console.log("Error : "+err);
							return socket_io.to(algoMetaID).emit('algo removed', 'failure', 'DB error');
						}
						console.log("Algo successfully removed");
						socket_io.to(algoMetaID).emit('algo removed', 'success', "Algorithm successfully removed");
					});
				}

				RMV_ALGO_TIMERS[algoMetaID] = setTimeout(function(){
					console.log('Trying to remove algo : '+algoMetaID);

					AlgosMeta.findById(algoMetaID).populate('author versions').exec(function(err, algo){
						if(err){
							return socket_io.to(algoMetaID).emit('algo removed', 'failure', 'DB error');
						}
						if(algo.versions.length == 0){
							return del();
						}
						var successes = 0, total = algo.versions.length;
						console.log("successes : "+successes+', total : '+total);
						
						(function removeVers(){
							var v = algo.versions.splice(0,1)[0];
							
							request.delete(global.settings.IM_PROTOCOL + global.settings.IM_ADDR +"/version", 
			                	{ form : {_id : v._id.toString() } }
			                ).on('complete', function(body, http_response){
			                	console.log("body : "+body+", body.status : "+body.status);
								if(body instanceof Error){
									return socket_io.to(algoMetaID).emit('algo removed progress', "Error on deleting Version : "+v.version+" : Internal Network error.");
								}

								if(body.status == 'failure'){
									console.log(body.message);
									return socket_io.to(algoMetaID).emit('algo removed progress', "Error on deleting Version : "+v.version+' : '+body.message);
								}
								
								Algos.remove({ _id : v._id.toString() }).exec(function(err){
									if(err) {
										socket_io.to(algoMetaID).emit('algo removed progress', 'failure', "Error on deleting Version : "+v.version+" : DB error");
										return console.log("Remove algo version from DB error :"+err);
									}
									socket_io.to(algoMetaID).emit('algo removed progress', 'Version '+v.version+' : successfully removed');
									successes++;

									if(algo.versions.length > 0){
										return removeVers();
									}
									console.log("successes : "+successes+', total : '+total);
									if(successes == total){
										return del();
									}

									socket_io.to(algoMetaID).emit('algo removed', 'failure', 'Could not remove all the versions');
									
								});
							});
						})();
					})

					
				}, global.settings.TIME_TO_WAIT_BEFORE_DELETING_ALGO);
			});
		});

		socket.on('cancel algo removal', function(algoMetaID){
			console.log(' <REMOVE ALGO> | ID : '+algoMetaID);
			AlgosMeta.update({ _id : algoMetaID, author : session.user._id}, { $set : { delete_date : undefined } }).exec(function(err, u){
				if(err){
					return socket.emit('cancel algo removal', 'failure', 'DB error');
				}
				console.log("Delete period stoped "+util.inspect(u));
				socket.emit('cancel algo removal', 'success');
				if(RMV_ALGO_TIMERS[algoMetaID]){
					clearTimeout(RMV_ALGO_TIMERS[algoMetaID]);
					delete RMV_ALGO_TIMERS[algoMetaID];
				}
			});
		});

		socket.on('edit version', function(algoID, contents){
			console.log(' PORTAL >>>>>>>> IM | <EDIT VERSION> | ALGOID : '+algoID+', version : '+contents.version);
			im_socket.emit('edit version', socket.id, algoID, contents, session.user.username);
		});
		
		socket.on('create version', function(algoMetaID, manifest){
			try{
				console.log(' PORTAL >>>>>>>> IM | <CREATE VERSION> | ALGOID : '+algoMetaID+', manifest.version : '+JSON.parse(manifest).version);
			}
			catch(e){
				console.log("Manifes error : "+e.toString());
				return socket.emit("create version", "failure", e.toString());
			}
			console.log("global.utils.dao.version.validator : "+util.inspect(global.utils.dao.version.validator));
			
			global.utils.dao.version.validator.manifest(algoMetaID, 
				{ content : manifest }, undefined, 
				session.user.username, 
				function(err, newAlgo){
	
	      		if(err){
	      			console.log("Err: "+err);
	      			//res.end(err.toString());
	      			return socket.emit("create version", "failure", err.toString());
	      		}
	      		
      			//newAlgo.author = req.session.user._id;
      			newAlgo._id = mongo.Types.ObjectId().toString();
      			console.log('OK for the JSON file!!!!!!');
      			socket.emit("create version progress", "Manifest successfully analysed");
      			
      			Algos.collection.insert([newAlgo], {}, function(s_err, docs){
				//newAlgo.save({checkKeys: false}, function(s_err, docs){
					if(s_err){
						console.log("DB error : "+s_err);
      					return socket.emit("create version progress", "DB error : "+s_err);
      				}
					
					AlgosMeta.findById(algoMetaID, function(err, meta){
						if(err || !meta){
							console.log('\nCloud not Link the algo to its metadata\n');
							Algos.remove({_id : newAlgo._id}, function(){});
							return socket.emit("create version progress", "DB error. Could not Link the algo to its metadata");
						}

						meta.versions.push(newAlgo._id);
						console.log("meta : "+JSON.stringify(meta, null, 2));
						meta.save(function(err){
							console.log("ERROR : "+err);

							console.log("\nVersion "+newAlgo.version+" recorded as a version of Algo "+meta.title+"\n");
							socket.emit("create version progress", "Version recorded in the DB and you are pointed as the author.");
						});

						im_socket.emit('create version', socket.id, newAlgo._id);
						/*
							console.log("util.inspect(docs) : "+util.inspect(docs));
							var sock = require('socket.io-client')(global.settings.IM_PROTOCOL + global.settings.IM_ADDR +':'+ global.settings.IM_PORT+"/createImage");
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
							*/
							/*restler.post(global.settings.IM_PROTOCOL + global.settings.IM_ADDR +':'+ global.settings.IM_PORT+ "/build-infra", {
						        data: {_id : newAlgo._id.toString()}
						    }).on("complete", function(create_image, resp) {
						    */
						    
						    /*var buildResponse = "";
						    request.post(global.settings.IM_PROTOCOL + global.settings.IM_ADDR +':'+ global.settings.IM_PORT+ "/build-infra", {
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
						        
						    }).on('error', function(error){
						    	console.log('---------------------------------');
						        console.log('Error : '+util.inspect(error));
						    	console.log('---------------------------------');
						    	sock.close();
						        io.emit("Error", "Internal connection error");
						        res.end('Failed');
						        Algos.remove({_id : newAlgo._id}, function(){});
						    });
					    */
					});
      				
      			});
	      		
	      	});	
		});

		socket.on('remove version', function(algoID){
			console.log(' PORTAL >>>>>>>> IM | <REMOVE VERSION> | ID : '+algoID);
			
			Algos.findById(algoID).populate(
				{
					path : "meta",
					populate : {
						path : "author"
					}
				}
			).exec(function(err, algo){
				if (err)
					return socket.emit('remove version', "failure", algo.version, err);
				if(!algo)
					return socket.emit('remove version', "failure", algo.version, "This algorithm does not exist");
				if(algo.meta.author.username != session.user.username)
					return socket.emit('toggleHidden', 'failure', 'Only the author is allow to make such an operation');
				
				request.delete(global.settings.IM_PROTOCOL + global.settings.IM_ADDR + "/version", 
                	{ form : {_id : algo._id.toString() } }
                ).on('complete', function(body, http_response){
                	console.log("body : "+body+", body.status : "+body.status);
					if(body instanceof Error){
						return socket.emit('remove version', "failure", algo.version, "Internal Network error.");
					}
					if(body.status == 'failure'){
						console.log(body.message);
						return socket.emit('remove version', "failure", algo.version, body.message);
					}
					Algos.remove({ _id : algoID }).exec(function(err){
						if(err) {
							socket.emit('remove version', 'failure', algo.version, "DB error");
							return console.log("Remove algo from DB error :"+err);
						}
						socket.emit('remove version', 'success', algo.version, body.message);
					});
				});
				
			});
		});
		socket.on('toggle share', function(algoID){
			console.log(' <TOGGLE SHARE> | ALGOID : '+algoID);
			Algos.findById(algoID).populate(
				{
					path : "meta",
					populate : {
						path : "author"
					}
				}
			).exec(function(err, algo){
				//console.log(err || algo);
				if (err)
					return socket.emit('toggle share', "failure", algo.version, err);
				if(!algo)
					return socket.emit('toggle share', "failure", algo.version, "This algorithm does not exist");
				if(algo.meta.author.username != session.user.username)
					return socket.emit('toggle share', 'failure', algo.version, 'Only the author is allow to make such an operation');
				//console.log("Before : "+algo.hidden);
				var shareable = algo.shareable? true: false;
				console.log("shareable: ", shareable);
				algo.update({ $set : { shareable : !shareable } }).exec(function(err, u){
					if(err){
						return socket.emit('toggle share', "failure", algo.version, 'DB error');
					}
					//console.log("After : "+algo.hidden);
					//console.log("Now hidden  = "+util.inspect(u));
					socket.emit('toggle share', 'success', algo.version, !shareable);
				});
				
			});
		});

		socket.on('toggle hidden', function(algoID){
			console.log(' <TOGGLE HIDDEN> | ALGOID : '+algoID);
			Algos.findById(algoID).populate(
				{
					path : "meta",
					populate : {
						path : "author"
					}
				}
			).exec(function(err, algo){
				//console.log(err || algo);
				if (err)
					return socket.emit('toggle hidden', "failure", algo.version, err);
				if(!algo)
					return socket.emit('toggle hidden', "failure", algo.version, "This algorithm does not exist");
				if(algo.meta.author.username != session.user.username)
					return socket.emit('toggle hidden', 'failure', algo.version, 'Only the author is allow to make such an operation');
				//console.log("Before : "+algo.hidden);
				algo.update({ $set : { hidden : !algo.hidden } }).exec(function(err, u){
					if(err){
						return socket.emit('toggle hidden', "failure", algo.version, 'DB error');
					}
					//console.log("After : "+algo.hidden);
					//console.log("Now hidden  = "+util.inspect(u));
					socket.emit('toggle hidden', 'success', algo.version, !algo.hidden);
				});
				
			});
		});

		
		/*
		socket.on('clean', function(){
			console.log(' PORTAL >>> IM | ROOM : '+room+' | <CLEAN>');
			if (sock){
				sock.emit('clean', room);
				sock.disconnect();
			}
		});
		*/
		socket.on('disconnect', function() {
			client.clean();

			clearInterval(LOG_TIMERS[socket.id]);
	    	delete LOG_TIMERS[socket.id];
		});
	});
	return socket_io;
}
//};

