
const settings = require('../settings');

//const crypto = require('crypto'), CRYPTO_SALT = '496a549da94edb360719f467f9f22f30';
const ssha = require('ssha');
const ldapjs = require('ldapjs'), ldapChange = ldapjs.Change;
const ldapClient = ldapjs.createClient( { url: settings.ldap.url } );


var hashPassword = (password) => {
    //return '{SSHA}'+crypto.pbkdf2Sync(password, CRYPTO_SALT, 1000, 16, `sha1`).toString(`hex`);
    return ssha.create(password);
}

var bind = function(callback){//userInfo, cb) {
    
    ldapClient.bind(settings.ldap.auth.login, settings.ldap.auth.password, callback);
}


class LDAPManager {

	makeUserDN(userProfile){ 
		//console.log("## makeUserDN, userProfile:", userProfile);
		// var email = null;
		// if ("main_email" in userProfile && userProfile.main_email){
		// 	email = userProfile.main_email;
		// }
		// else if ("email" in userProfile && userProfile.email){
		// 	email = userProfile.email;
		// }
		// else if ("emails" in userProfile){
		// 	email = userProfile.emails.filter(e=>e.verified ==true)[0].email;
		// }

		// if (email == null) return null;

	    return !userProfile.username? null : `uid=${userProfile.username}, ${settings.ldap.search_dn}`;
	}

	add(userInfo, changeIfExists, callback){
		if (typeof changeIfExists === 'function' && typeof callback === 'undefined'){
			callback = changeIfExists;
			changeIfExists = false;
		}

	    var cn = this.makeUserDN(userInfo);

	    var userToAdd = {
	        //dn: cn,
	        //givenname: userInfo.firstname,
	        sn: userInfo.lastname,
	        cn: `${userInfo.firstname} ${userInfo.lastname}`,
	        mail: userInfo.email,
	        uid: userInfo.username,
	        objectclass: ['top', 'inetorgperson'],
	        userPassword: hashPassword(userInfo.password)
	    }

	    console.log("userToAdd : ", userToAdd);
	    console.log("userInfo : ", userInfo);
	    
	    bind((err)=>{
	        if (err){
	            console.log("BindErr:", err);
	            return callback(err);
	        }
	        
	        console.log("cn : ", cn, "usersToAdd: ", userToAdd);
	        ldapClient.add(cn, userToAdd, (err, addedInfo)=>{
	        	console.log("changeIfExists: ", changeIfExists, " | err : ", err);
	        	if (!err){
	        		return callback(null, addedInfo);
	        	}
	        	
	        	var acceptableErrs = ["EntryAlreadyExistsError: Entry Already Exists"];
	        	console.log("err.toString() : ", err.toString());
	        	if (!changeIfExists || (changeIfExists && acceptableErrs.indexOf(err.toString()) < 0 ) ){
	        		return callback(err);
	        	}
	        	
	        	this.change(cn, userToAdd, callback);
		        
	        });
	    });
	}																																																						

	change(dn, newInfo, callback){
		//console.log("CHANGING ...");


		var newLDIF = ("ldif" in newInfo)? newInfo.ldif : ("userInfo" in newInfo)? {} : newInfo;
		var newDN = ("userInfo" in newInfo)? this.makeUserDN(newInfo.userInfo) : dn;

		if("userInfo" in newInfo){

		    //newDN = this.makeUserDN(newInfo.userInfo);
		    newDN = newDN == null? dn : newDN;
		   	
		    if ('email' in newInfo.userInfo){
		        newLDIF.mail = newInfo.userInfo.email;
		    }
		    if ('password' in newInfo.userInfo){
		        newLDIF.userpassword = ssha.create(newInfo.password);
		    }
		    if ('firstname' in newInfo.userInfo || 'lastname' in newInfo.userInfo){
				var cn = "";
		    	if ('firstname' in newInfo.userInfo ){
		        	newLDIF.givenname = newInfo.userInfo.firstname;
					cn = newInfo.userInfo.firstname;
				}
		    	if ('lastname' in newInfo.userInfo){
					newLDIF.sn = newInfo.userInfo.lastname;
					cn += (cn != ""? " ": '')+newInfo.userInfo.lastname;
			    }
			    newLDIF.cn = cn;
		    }

		    if (Object.keys(newLDIF).length == 0 ){
		        return callback(null, null);
		    }
		}
	    
	    
	    

	    bind((bindErr)=>{
	        if (bindErr){
	            return callback(bindErr);
	        }
			// handle different dns case
	        new Promise((resolve, reject)=>{
	            //
	            //console.log("current dn: ", dn, " | new dn: ", newDN);
	            if (dn == newDN){
	                return resolve();
	            }

	            //console.log("changing current dn");
	            ldapClient.modifyDN(dn, newDN, function(err){
	                if (err){
	                    return reject(err);
	                }
	                resolve();
	            });
			})
			// first retrieve the current info on ldap
			.then(()=>{
	        	//var filter = newDN.split(',')[0];
	        	//console.log("filter: ", filter);

	        	return new Promise((resolve, reject)=>{
		        	this.search({filter: newDN.split(',')[0]}, (err, results)=>{
		        		// console.log("dn : ", newDN);
		        		// console.log("search results: err: ",err, " | results : ", results);
		        		if (err) return reject(err);

		        		resolve(results.length == 0? null: results[0]);
		        	});
		        });
			})
			// make the relevant changes one by one
	        .then((currentLDAPInfo)=>{
	        	// console.log("newLDIF : ", newLDIF);
	        	// console.log("currentLDAPInfo : ", currentLDAPInfo);

	        	var allChanges = Object.keys(newLDIF);
	        	//console.log("allChanges: ", allChanges);

	        	var nextChange = ()=>{
	        		if (allChanges.length == 0){
	        			return callback(null, newLDIF);
	        		}

	        		var currentChange = allChanges.shift();
	        		//console.log("currentChange: ", currentChange);

					// Nothing tochange
	        		if (currentLDAPInfo[currentChange] == newLDIF[currentChange]){
	        			return nextChange();
	        		}

        			var change = {
        				operation: "replace",
	                    modification: {}
	                }
	                change.modification[currentChange] = newLDIF[currentChange];

	                change = new ldapChange(change);

	                ldapClient.modify(newDN, change, (modifyErr, result)=>{
		                if (modifyErr){
		                    console.log(modifyErr);
		                    return callback(modifyErr);
		                }
		                //console.log(`modifyErr: ${modifyErr}, result: ${result}`);
		                nextChange();
		            });
	        		
	        	}

	        	nextChange();
	        })
	        .catch(e=>{
	            //
	            callback(e);
	        });
	    });
	}

	search(options, callback){
		var opts = {scope: 'sub', attributes: ['dn', 'givenname', 'sn', 'cn', 'uid', 'mail', 'objectclass', 'userProfileassword']};

		if (typeof options === 'function' && typeof callback === 'undefined'){
			callback = options;
			options = {};
		}

		for (var o in options){
			opts[o] = options[o];
		}

		//console.log("search options: ", opts);
		
		ldapClient.search(settings.ldap.search_dn, opts, (err, res)=>{
			//
			var results = [];
			res.on('searchEntry', function(entry) {
				//console.log('entry: ' + JSON.stringify(entry.object));
				results.push(entry.object);
			});
			res.on('error', function(err) {
				//console.log('error: ' + err.message);
				callback(err);
			});
			res.on('end', function(result) {
				//console.log('result: ' + JSON.stringify(result, null, 2));
				callback(null, results);
			});

		});
	}

	delete(userInfo, okIfNotExists, callback){
		if (typeof okIfNotExists === 'function' && typeof callback === 'undefined'){
			callback = okIfNotExists;
			okIfNotExists = false;
		}

		var dn = this.makeUserDN(userInfo);

	    bind((err)=>{
	        if (err){
	            return callback(err);
	        }
	        
	        ldapClient.del(dn, (err, result)=>{
	        	if (!err){
	        		return callback(null, result);
	        	}
	        	
	        	//console.log("err.toString() : ", err.toString());
	        	if (!okIfNotExists || (okIfNotExists && err.toString() != "NoSuchObjectError: No Such Object") ){
	        		return callback(err);
	        	}

				callback(null);
	        });
	    });
	}
}

const runTests = ()=>{

	const ldapManager = new LDAPManager();

	const testSpecifications = [ 
		// {
		// 	title: "Testing user account creation",
		// 	method: "add",
		// 	arg: {
		// 		username: "jdoe",
		// 		firstname: "John",
		// 		lastname: "DOE1",
		// 		email: "john.doe@example.com",
		// 		password: "mypass"
		// 	}
		// }
		// {
		// 	title: "Testing user account creation",
		// 	method: "search",
		// 	arg: {
		// 		filter: '(mail=john.doe@example.com)'
		// 	}
		// } 

		{
			title: "Testing user account creation",
			method: "delete",
			arg: {
				username: "jdoe",
				firstname: "John",
				lastname: "DOE1",
				email: "john.doe@example.com",
				password: "mypass"
			}
		} 
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
			case "add":
				ldapManager.add(currentTS.arg, true, (err, result)=>{
					console.log(err || "[RESULT] : "+JSON.stringify(result));
					index++;
					nextTest();
				});
				break;
			case "search":
				ldapManager.search(currentTS.arg, (err, result)=>{
					console.log(err || "[RESULT] : "+JSON.stringify(result));
					index++;
					nextTest();
				});
				break;
			case "delete":
				ldapManager.delete(currentTS.arg, true, (err, result)=>{
					console.log(err || "[RESULT] : "+JSON.stringify(result));
					index++;
					nextTest();
				});
				break;
			default:
				console.log(new Error(`Test method : "${currentTS.method}" not supported`))
		}
	}


	nextTest();
}

//runTests();

module.exports = LDAPManager;