

const settings = require('../../settings');
const fs = require('fs'), bCrypt = require('bcrypt'), utils = require('../../utils'), ldapManager = new utils.Ldap();

const mongoModels = require('../models'), 
	usersModel = mongoModels.model('Users'), photoModel = mongoModels.model('Photos');

const TokensManager = require('./tokens'), tknManager = new TokensManager();

const hashPassword = (password)=> bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);

const isValidPassword = (user, password)=>{
	return bCrypt.compareSync(password, user.password);
}

const randomPassword = (passwordLength)=>{
	if (typeof passwordLength === 'undefined'){
		passwordLength = 20;
	}

	const cap_chars = Array.from(Array(26), (_,i)=> i+65); // A-Z
	const min_chars	= Array.from(Array(26), (_,i)=> i+97); // a-z
	const mum_chars	= Array.from(Array(10), (_,i)=> 48); // a-z
	const special_chars	= [45, 37, 36]; // "-", "%", "$" 
	
	var password = [ min_chars[ Math.floor( Math.random()*min_chars.length ) ] ];
	
	while(password.length < passwordLength){
		var rand = Math.random();

		if (rand <= 0.2){
			password.push( special_chars[ Math.floor( Math.random()*special_chars.length ) ] );
		}
		else if (rand <= 0.4){
			password.push( mum_chars[ Math.floor( Math.random()*mum_chars.length ) ] );
		}
		else if (rand <= 0.7){
			password.push( cap_chars[ Math.floor( Math.random()*cap_chars.length ) ] );
		}
		else{
			password.push( min_chars[ Math.floor( Math.random()*min_chars.length ) ] );
		}
	}
	

	return password.map(c => String.fromCharCode(c) ).join('') ;
}



class UsersManager {

	getOne(params){

		return new Promise((resolve, reject)=>{

			if ( !("uid" in params) ){
				return reject(new Error(`MissingParamError: Parameter "uid" is mandatory.`));
			}

			var query = mongoModels.Types.ObjectId.isValid(params.uid)? {_id: params.uid} : {$or: [{"profile.emails.email": params.uid }, {"profile.username": params.uid }] };

			usersModel.findOne(query, (err, user)=>{

				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

				if (!user) return reject(new Error(`NotFoundError: no user found with id : "${params.uid}".`));

				resolve(user);
			});
		});
	}

	get(params){

		return new Promise((resolve, reject)=>{

			var query = {};

			var fields = "fields" in params && params.fields? params.fields: [], select = {};
			fields.forEach((p) => { select[p] = 1;});

			usersModel.find(query, select, (err, users)=> {

				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

				resolve(users);
			});
		});
	}

	create(params){
		return new Promise (async (resolve, reject)=>{
			//
			if ( !('status' in params) ){
				params.status = settings.app_settings.user_roles.default;
			}
			else if (settings.app_settings.user_roles.values.indexOf(params.status) < 0){
				return reject(new Error(`FormatError: Status "${params.status}" not supported.`));
			}

			if ( !("email" in params) ){
				return reject(new Error(`MissingParamError: Field "email" is mandatory`));
			}

			if ( !("username" in params) ){
				return reject(new Error(`MissingParamError: Field "username" is mandatory`));
			}
			else if (!settings.app_settings.username_validation_regex.test(params.username)){
				return reject(new Error(`MissingParamError: Field "username" is not correctly formatted, please refer to the following regex : ${settings.app_settings.username_validation_regex.toString()}.`));
			}

			if ( !("firstname" in params) ){
				params.firstname = "John";
			}

			if ( !("lastname" in params) ){
				params.lastname = "DOE";
			}

			params.emails = [ {email : params.email, verified: true } ]
			var userID = mongoModels.Types.ObjectId().toString();
			var auth_token = await tknManager.create(userID);
			console.log("auth_token [", typeof auth_token, "] is : ", auth_token);
			//params.main_email = params.email;


			var existsQuery = {$or: [{"profile.username" : params.username}, {"profile.emails.email" : params.email}]};

			usersModel.find(existsQuery, (err, matchingUsers)=>{
				if (err) 
					return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

				if (matchingUsers.length != 0){
					var errMsg = `AlreadyExistError: Either the username "${params.username}" already exists or the email "${params.email}" is already taken.`;
					return reject(new Error(errMsg));
				}

				var clear_password = ("force_password" in params)? params.force_password: randomPassword();


				//console.log("new user profile is : ", params);
				new usersModel({
					_id : userID,
					profile: params,
					passwords:[{ hash : hashPassword(clear_password), expireAt: Date.now() }],
					auth_token: auth_token
				}).save((err, user)=>{
					if (err) {
						return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
					}

					var mailAndReturn = ()=>{
						utils.mail.newAccountCreation(user, clear_password).then(()=>{
							resolve(user);
						}).catch(e=>{
							user.remove((err)=>{
								if (err) {
									console.log("Too damn complicated!!!");
								}
								reject (new Error(`MailingError: ${e.toString().replace(/^Error\:\ /, '')}`) );
							});
						});
					}
					
					if ( !("ldap" in settings) ){
						return mailAndReturn();
					}

					var userInfo = {
						firstname : user.profile.firstname, 
						lastname: user.profile.lastname, 
						username: params.username,
						email: params.email, 
						password: clear_password
					};

					ldapManager.add(userInfo, true, (err, result)=>{
						if (err) {
							return reject (new Error(`LDAPAccountCreationError: ${err.toString().replace(/^Error\:\ /, '')}`) );
						}
						mailAndReturn();
					});
				});
			});
		});
	}
	
	getProfilePhoto(params){
		return new Promise ((resolve, reject)=>{
			//
			if ( !('uid' in params) ){
				return reject(new Error(`MissingParamError: Parameter "uid" is mandatory`));
			}

			var query = mongoModels.Types.ObjectId.isValid(params.uid)? {_id: params.uid} : {$or: [{"profile.emails.email": params.uid }, {"profile.username": params.uid }] };

			usersModel.findOne(query, (err, user)=>{
				if (err) return reject_child (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
				if (!user) return reject_child (new Error(`NotFoundError: no user with id "${profile.uid}" found.`));
				resolve(user.profile.photo);
			});
		});
	}

	login(params){
		return new Promise ((resolve, reject)=>{
			if ( !('uid' in params && params.uid) ){
				return reject(new Error(`MissingParamError: Parameter "uid" is mandatory`));
			}

			if ( !('password' in params && params.password) ){
				return reject(new Error(`MissingParamError: Parameter "password" is mandatory`));
			}

			

			var query = mongoModels.Types.ObjectId.isValid(params.uid)? {_id: params.uid} : {$or: [{"profile.emails.email": params.uid }, {"profile.username": params.uid }]};

			usersModel.findOne(query, (err, user)=>{

				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

				if (!user) return reject(new Error(`NotFoundError: No user found with uid "${params.uid}"`));

				
				var passwordEntered = user.passwords.filter(e=> bCrypt.compareSync(params.password, e.hash)) ;

				if (passwordEntered.length == 0) {
					return reject(new Error(`WrongValueError: Password is incorrect`));
				}

				// Expiration deadline is after right now
				if (passwordEntered[0].expireAt && Date.now() >= passwordEntered[0].expireAt.getTime() ){
					return reject(new Error(`WrongValueError: Password expired.`));	
				}

				// Expiration deadline is less than a week away   
				if (passwordEntered[0].expireAt && (Date.now() + in_ms.day * 7) >= passwordEntered[0].expireAt.getTime()){
					var in_ms = { day: 1000 * 60 * 60 * 24, hour: 1000 * 60 * 60, mins: 1000 * 60};
					var remaining_time = passwordEntered[0].expireAt.getTime() - Date.now(); 
					var r_days = parseInt(remaining_time/in_ms.day), 
						r_hours = parseInt((remaining_time - r_days*in_ms.day)/in_ms.hour),
							r_mins = parseInt((remaining_time - r_days*in_ms.day - r_hours*in_ms.hour)/in_ms.mins);
					
					var t = ((r_days != 0)? r_days+" days " : "") + ((r_hours != 0)? r_hours+" hours " : "") + ((r_mins != 0)? r_mins+" mins " : "");

					return resolve({warning: `ExpirationCloseWrning: Password expiring soon (in ${t}), please remember to update it.`});
				}

				resolve(user);
			});
		});
	}

	updatePassword(params){
		return new Promise ((resolve, reject)=>{
			if ( !('uid' in params) ){
				return reject(new Error(`MissingParamError: Parameter "uid" is mandatory`));
			}

			if ( !('password' in params) ){
				return reject(new Error(`MissingParamError: Parameter "password" is mandatory`));
			}

			if (!settings.app_settings.password_validation_regex.test(params.password)){
				return reject(new Error(`FormatError: Password "${params.password}" is not valid, make sure it matches the regex : ${settings.app_settings.password_validation_regex.toString()}`))
			}

			var query = mongoModels.Types.ObjectId.isValid(params.uid)? {_id: params.uid} : {$or: [{"profile.emails.email": params.uid }, {"profile.username": params.uid }]};

			usersModel.findOne(query, (err, user)=>{

				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

				if (!user) return reject(new Error(`NotFoundError: no user found with id : "${params.uid}".`));

				var alreadyExist = user.passwords.filter(e=> bCrypt.compareSync(params.password, e.hash)).length > 0;
				if (alreadyExist) return reject (new Error(`WrongValueError: You previously chose this password, please choose another one.`))

				for (var i=0; i<user.passwords.length; i++){
					if (user.passwords[i].expireAt && Date.now() < user.passwords[i].expireAt){
						user.passwords[i].expireAt = Date.now();
					}
				}

				user.passwords.push({hash : hashPassword(params.password), expireAt: Date.now()+settings.app_settings.password_expiration_delay });

				var saveAndQuit = ()=>{
					user.save(err=> {
						if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
						resolve(user);
					});
				}

				if ( !("ldap" in settings) ){
					return saveAndQuit();
				}

				ldapManager.change(ldapManager.makeUserDN(user.profile), {userInfo : {password: params.password}}, (err, result)=>{
					if (err) {
						return reject_child (new Error(`LDAPAccountUpdateError: ${err.toString().replace(/^Error\:\ /, '')}`) );
					}
					saveAndQuit();
				});
			});
		});
	}

	updateProfile(params){
		
		return new Promise ((resolve, reject)=>{
			//
			if ( !('uid' in params) ){
				return reject(new Error(`MissingParamError: Parameter "uid" is mandatory`));
			}

			var profile = {};
			if ("firstname" in params && params.firstname != null){
				profile.firstname = params.firstname;
			}
			if ("lastname" in params && params.lastname != null){
				profile.lastname = params.lastname;
			}
			if ("status" in params && params.status != null){
				if (settings.app_settings.user_roles.values.indexOf(params.status) < 0){
					return reject(new Error(`FormatError: Status "${params.status}" not supported.`));
				}
				profile.status = params.status;
			}
			// if ("username" in params && params.username != null){
			// 	if (!settings.app_settings.username_validation_regex.test(params.username)){
			// 		return reject(new Error(`MissingParamError: Field "username" is not correctly formatted, please refer to the following regex : ${settings.app_settings.username_validation_regex.toString()}.`));
			// 	}
			// 	profile.username = params.username;
			// }

			if ("photo" in params && params.photo != null){
				profile.photo = params.photo;
			}


			console.log("### POFILE ###", profile);
			// Check uid exists 
			new Promise ((resolve_child, reject_child)=>{
				var query = mongoModels.Types.ObjectId.isValid(params.uid)? {_id: params.uid} : {$or: [{"profile.emails.email": params.uid }, {"profile.username": params.uid }] };
				
				usersModel.findOne(query, (err, user)=>{
					if (err) return reject_child (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
					if (!user) return reject_child (new Error(`NotFoundError: no user with id "${profile.uid}" found.`));
					console.log("resolving with : ", user);
					//console.log("user.profile.photo : ", user.profile.photo, "(", typeof user.profile.photo, ")");
					resolve_child(user);
				});
			})
			// Check that username and/or email is available
			.then(function(userToUpdate){
				//console.log("#1 ", typeof userToUpdate);
				return new Promise ((resolve_child, reject_child)=>{
					//console.log("Chain 1");
					if ( !("username" in profile || "email" in profile) ){
						return resolve_child(userToUpdate);
					}
					var query;
					if ("username" in profile && "email" in profile) 
						query = {$or: [{"profile.username": profile.username}, {"profile.emails.email": profile.email}]};
					else if ("username" in profile)
						query = {"profile.username": profile.username};
					else
						query = {"profile.emails.email": profile.email};

					console.log("Check query : ", query);
					usersModel.findOne(query, (err, user)=>{
						if (err) return reject_child (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
						if (user){
							var msg = ("$or" in query)? `a user already has username "${profile.username}" or email "${profile.email}"` :
										("username" in profile)? `a user already has username "${profile.username}"` : `a user already has email "${profile.email}"` ;
							
							return reject_child (new Error(`AlreadyExistError: ${msg}`));
						}
						resolve_child(userToUpdate);
					});
				});
			})
			// handle photo
			.then((userToUpdate)=>{
				//console.log("#2 ", typeof userToUpdate);
				return new Promise ((resolve_child, reject_child)=>{
					//console.log("Chain 2");

					if ( !("photo" in profile) ){
						return resolve_child(userToUpdate);
					}

					
					//var photo_b64 = fs.readFileSync(params.photo.path);
					//console.log("photo_b64: ", photo_b64);
					//profile.photo = `data:${profile.photo.headers['content-type']};base64,${photo_b64}`;
					try{
						profile.photo = {
							content_type: "content-type" in profile.photo.headers? profile.photo.headers["content-type"]: profile.photo.originalFilename.toLowerCase().endsWith('.png')? "image/png": "image/jpeg",
							buffer: fs.readFileSync(params.photo.path)
						};

						fs.unlinkSync(params.photo.path);
						resolve_child(userToUpdate);
					}catch (e) {
						reject_child(e);
					}
				});
			})
			// handle ldap
			.then((userToUpdate)=>{
				//console.log("#3 ", typeof userToUpdate);
				
				return new Promise ((resolve_child, reject_child)=>{
					//console.log("Chain 3");

					if ( !("ldap" in settings) ){
						return resolve_child(userToUpdate);
					}

					ldapManager.change(ldapManager.makeUserDN(userToUpdate.profile), {userInfo : profile}, (err, result)=>{
						if (err) 
							return reject_child (new Error(`LDAPAccountUpdateError: ${err.toString().replace(/^Error\:\ /, '')}`) );
						resolve_child(userToUpdate);
					});
				});
			})
			.then((userToUpdate)=>{
				//console.log("#4 ", typeof userToUpdate);
				for (var p in profile){
					if (p == "email"){
						// TODO : hanlde the email cases
						// userToUpdate.profile.emails.push({
						// 	email: profile.email,
						// 	verified: false
						// });
					}
					else{
						userToUpdate.profile[p] = profile[p];
					}
				}

				userToUpdate.save((err, newUser)=>{
					if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

					resolve(newUser);
				});
			})
			.catch(reject);
		});
	}

	updateDemo(params){
		return new Promise ((resolve, reject)=>{
			if ( !('uid' in params) ){
				return reject(new Error(`User ID is mandatory`));
			}
		});
	}
	
	addEmail(params){
		//
		return new Promise ((resolve, reject)=>{
			//
			if ( !('uid' in params) ){
				return reject(new Error(`User ID is mandatory`));
			}
			if ( !('email' in params) ){
				return reject(new Error(`Email is mandatory`));
			}
			var query = mongoModels.Types.ObjectId.isValid(params.uid)? {_id: params.uid} : {$or: [{"profile.emails.email": params.uid }, {"profile.username": params.uid }] };
			
			usersModel.findOne(query, (err, user)=>{
				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
				if (!user) return reject(new Error(`NotFoundError: No user found with uid "${params.uid}"`));

				usersModel.findOne({"profile.emails.email": params.email}, (err, u_found)=>{
					if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
					if (u_found) return reject(new Error(`AlreadyExistError: Email "${params.email}" is not available, please choose a different email.`));

					user.profile.emails.push({ email: params.email, verified: false });
					user.save((err, u)=>{
						if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

						utils.mail.newEmailAccount(u, u.profile.emails[u.profile.emails.length-1]).then(()=>{
							resolve(u);
						}).catch(reject);
					});
				});
			});
		});
	}

	removeEmail(params){
		//
		return new Promise ((resolve, reject)=>{
			//
			if ( !('uid' in params) ){
				return reject(new Error(`User ID is mandatory`));
			}
			if ( !('email' in params) ){
				return reject(new Error(`Email is mandatory`));
			}
			var query = mongoModels.Types.ObjectId.isValid(params.uid)? {_id: params.uid} : {$or: [{"profile.emails.email": params.uid }, {"profile.username": params.uid }] };
			
			usersModel.findOne(query, (err, user)=>{
				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
				if (!user) return reject(new Error(`NotFoundError: No user found with uid "${params.uid}"`));

				var email_to_remove_exists = user.profile.emails.filter(e=>e.email == params.email).length != 0;
				if (!email_to_remove_exists) return reject(new Error(`NotFoundError: you do not have email "${params.email}", therefore can't remove it.`));

				var n_emails = user.profile.emails.length;
				var n_verified = user.profile.emails.filter(e=>e.verified).length;

				if (n_emails == 1) return reject(new Error(`NotAllowedError: you can't remove your only email account`));

				if (n_verified == 1 && user.profile.emails.filter(e=>e.email == params.email)[0].verified == true)
					return reject(new Error(`NotAllowedError: you can't remove your only <b>verfified</b> email account`));

				for (var i=0; i<user.profile.emails.length; i++){
					if (user.profile.emails[i].email == params.email){
						user.profile.emails.splice(i,1);
						break;
					}
				}
				// Choose a new main_email
				if (user.profile.main_email == params.email){
					user.profile.main_email = user.profile.emails.filter(e=>e.verified)[0];
				}

				user.save((err, u)=>{
					if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

					utils.mail.removedEmailAccount(u, params.email).then(()=>{
						resolve(u);
					}).catch(reject);
				});
			});
		});
	}
	
	verifyEmail(params){
		return new Promise ((resolve, reject)=>{
			if ( !('uid' in params) ){
				return reject(new Error(`User ID is mandatory`));
			}
			if ( !('id' in params) ){
				return reject(new Error(`Email ID is mandatory`));
			}

			var query = mongoModels.Types.ObjectId.isValid(params.uid)? {_id: params.uid} : {$or: [{"profile.emails.email": params.uid }, {"profile.username": params.uid }] };
			
			usersModel.findOne(query, (err, user)=>{
				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

				if (!user) return reject(new Error(`User with ID "${params.uid}" does not exist.`));

				if ( user.profile.emails.filter(e=>e._id.toString() == params.id).length ==0 ){
					return reject(new Error(`User with ID "${params.id}" does not have email with ID ${params.id}.`));
				}

				for (var i=0; i < user.profile.emails.length; i++){
					if (user.profile.emails[i]._id.toString() == params.id){
						user.profile.emails[i].verified = true;
						break;
					}
				}

				user.save((err, u)=>{
					if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
					resolve(u);
				});
			});
		});
	}

	updateSettings(params){
		return new Promise ((resolve, reject)=>{
			//
		});
	}

	remove(params){
		return new Promise ((resolve, reject)=>{
			//
			if ( !('uid' in params) ){
				return reject(new Error(`User ID is mandatory`));
			}
			if ( !('noDelay' in params) ){
				params.noDelay = false;
			}

			var query = mongoModels.Types.ObjectId.isValid(params.uid)? {_id: params.uid} : {$or: [{"profile.emails.email": params.uid }, {"profile.username": params.uid }] };

			//console.log("remove query : ", query);
			if (params.noDelay){
				usersModel.remove(query, (err)=>{
					if (err) 
						return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

					resolve();
				});
			}
			else{
				usersModel.updateOne(query, {$set: {deleteAt : Date.now()+settings.app_settings.user_removal_delay}}, (err)=>{
					if (err) 
						return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

					resolve();
				});
			}
		});
	}
}

const runTests = ()=>{

	const userManager = new UsersManager();

	const testSpecifications = [ 
		// {
		// 	title: "Getting user accounts",
		// 	method: "get",
		// 	arg: {
		// 		email: "souleymanecheickkante@yahoo.fr",
		// 	}
		// },

		// {
		// 	title: "Login user accounts",
		// 	method: "login",
		// 	arg: {
		// 		id: "souleymanecheickkante@yahoo.fr",
		// 		password: "-nC$pJbiuUvVJIwqkw%A"
		// 	}
		// },

		{
			title: "Update user password",
			method: "updatePassword",
			arg: {
				id: "souleymanecheickkante@yahoo.fr",
				password: "J7GKymem"
			}
		},
		
		// {
		// 	title: "Getting user accounts",
		// 	method: "get",
		// 	arg: {		
		// 		email: "souleymanecheickkante@yahoo.fr",
		// 	}
		// },

		// {
		// 	title: "Testing user account deletion",
		// 	method: "remove",
		// 	arg: {
		// 		id: "souleymanecheickkante@yahoo.fr",
		// 	}
		// },

		// {
		// 	title: "Testing user account creation",
		// 	method: "create",
		// 	arg: {	
		// 		email: "souleymanecheickkante@yahoo.fr",
		// 	}
		// }
	]

	var index = 0;
	const nextTest = ()=>{

		if (index >= testSpecifications.length){
			console.log("Done testing");
			return;
		}
		else if (index == 0){
			console.log("============== Running LDAP utils tests ==============\n");
		}
		const currentTS = testSpecifications[index];
		console.log(`\t============== Test n° ${index+1}: ${currentTS.title} ==============\n`);

		switch(currentTS.method){
			case "get":
				userManager.get(currentTS.arg).then(result=>{
					console.log("[RESULT] : "+JSON.stringify(result, null, 2));
					index++;
					nextTest();
				}).catch(e=>{ console.log(e); index++; nextTest(); });
				break;
			case "login":
				userManager.login(currentTS.arg).then(result=>{
					console.log("[RESULT] : "+JSON.stringify(result, null, 2));
					index++;
					nextTest();
				}).catch(e=>{ console.log(e); index++; nextTest(); });
				break;
			case "updatePassword":
				userManager.updatePassword(currentTS.arg).then(result=>{
					console.log("[RESULT] : "+JSON.stringify(result, null, 2));
					index++;
					nextTest();
				}).catch(e=>{ console.log(e); index++; nextTest(); });
				break;
			case "create":
				userManager.create(currentTS.arg).then(result=>{
					console.log("[RESULT] : "+JSON.stringify(result, null, 2));
					index++;
					nextTest();
				}).catch(e=>{ console.log(e); index++; nextTest(); });
				break;
			case "remove":
				userManager.remove(currentTS.arg).then(result=>{
					console.log("[RESULT] : "+JSON.stringify(result, null, 2));
					index++;
					nextTest();
				}).catch(e=>{ console.log(e); index++; nextTest(); });
				break;
			default:
				console.log(new Error(`Test method : "${currentTS.method}" not supported`))
		}
	}


	nextTest();
}

//runTests();

module.exports = UsersManager;