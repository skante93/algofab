

var exec = require('child_process').exec;


var SSHA = function(pass){
	var cmd = spawnSync('slappasswd', ['-h', '{SSHA}', '-s', pass]), out = cmd.stdout.toString(), err = cmd.stderr.toString();
	//console.log('out : '+out);
	//console.log('err : '+err);
	if(err)
		return new Error(err);
	return out;
}

var add_template = function(user){
	var password = SSHA(user.password);
	if(password instanceof Error)
		return password;

	return `
	
	dn: uid=${user.username},ou=users,${global.settings.LDAP.DN}
	changetype: add
	objectClass: inetOrgPerson
	description: Algofab user.
	cn: ${user.firstname} ${user.lastname}
	givenname: ${user.firstname}
	sn: ${user.lastname}
	mail: ${user.email}
	uid: ${user.username}
	userpassword: ${ password }
	
	`.replace(/\n\t\t/g, '\n');
}

var modify_pass_template = function(user, password) {
	password = SSHA(password);
	if(password instanceof Error)
		return password;

	return `
	
	dn: uid=${user.username},ou=users,${global.settings.LDAP.DN}
	changetype: modify
	replace: userpassword
	userpassword: ${ password }

	`.replace(/\n\t\t/g, '\n');
}

var delete_template = function(user){
	return `
	
	dn: uid=${user.username},ou=users,${global.settings.LDAP.DN}
	changetype: delete

	`.replace(/\n\t\t/g, '\n');
}

var LDAP_add = function(user) {
	console.log();
	var content = add_template(user, password);
	if (content instanceof Error)
		return content;
	try{
		fs.writeFileSync(user.username+'-add.ldif', content);
	}catch(e){
		return e;
	}

	var cmd = spawnSync('ldapmodify', ['-a', '-x', '-D', global.settings.LDAP.credential.login, '-w', global.settings.LDAP.credential.password, '-H', global.settings.LDAP.server, '-f', user.username+'-add.ldif']);
	var out = cmd.stdout.toString(), err = cmd.stderr.toString();

	spawnSync('rm', [user.username+'-add.ldif']);
	
	return (err)? new Error(err) : out;
}

var LDAP_change_password = function(user, password){
	var content = modify_pass_template(user, password);
	if (content instanceof Error)
		return content;
	try{
		fs.writeFileSync(user.username+'-change_pass.ldif', content);
	}catch(e){
		return e;
	}
	
	var cmd = spawnSync('ldapmodify', ['-x', '-D', global.settings.LDAP.credential.login, '-w', global.settings.LDAP.credential.password, '-H', global.settings.LDAP.server, '-f', user.username+'-change_pass.ldif']);
	var out = cmd.stdout.toString(), err = cmd.stderr.toString();

	spawnSync('rm', [user.username+'-change_pass.ldif']);

	return (err)? new Error(err) : out;
}

var LDAP_delete = function(user, password){
	var content = delete_template(user, password);
	if (content instanceof Error)
		return content;
	try{
		fs.writeFileSync(user.username+'-delete.ldif', content);
	}catch(e){
		return e;
	}
	
	var cmd = spawnSync('ldapmodify', ['-x', '-D', global.settings.LDAP.credential.login, '-w', global.settings.LDAP.credential.password, '-H', global.settings.LDAP.server, '-f', user.username+'-delete.ldif']);
	var out = cmd.stdout.toString(), err = cmd.stderr.toString();

	//spawnSync('rm', [user.username+'-delete.ldif']);

	return (err)? new Error(err) : out;
}

//console.log( LDAP_add_template( { firstname: 'Souleymane Cheick', lastname:'KANTE', username: 'skante', mail:'skante@enst.fr'}, "pass" ) );
var check_credientials = function(user){
	
	var cmd = spawnSync('ldapwhoami', ['-x', '-w', user.password, '-D', `uid=${user.username},ou=users,${global.settings.LDAP.DN}`, '-H', global.settings.LDAP.server]);
	var out = cmd.stdout.toString(), err = cmd.stderr.toString();

	return (err)? new Error(err) : out;
}

module.exports = {
	add : LDAP_add,
	delete : LDAP_delete,
	change_pass : LDAP_change_password,
	authenticate : check_credientials
}


/*
module.exports = function(SG){
	
	var SSHA = function(pass){
		var cmd = spawnSync('slappasswd', ['-h', '{SSHA}', '-s', pass]), out = cmd.stdout.toString(), err = cmd.stderr.toString();
		//console.log('out : '+out);
		//console.log('err : '+err);
		if(err)
			return new Error(err);
		return out;
	}

	var add_template = function(user, password){
		password = SSHA(password);
		if(password instanceof Error)
			return password;

		return `
		
		dn: uid=${user.username},ou=users,${SG.LDAP.DN}
		changetype: add
		objectClass: inetOrgPerson
		description: Algofab user.
		cn: ${user.firstname} ${user.lastname}
		givenname: ${user.firstname}
		sn: ${user.lastname}
		mail: ${user.email}
		uid: ${user.username}
		userpassword: ${ password }
		
		`.replace(/\n\t\t/g, '\n');
	}

	var modify_pass_template = function(user, password) {
		password = SSHA(password);
		if(password instanceof Error)
			return password;

		return `
		
		dn: uid=${user.username},ou=users,${SG.LDAP.DN}
		changetype: modify
		replace: userpassword
		userpassword: ${ password }

		`.replace(/\n\t\t/g, '\n');
	}

	var delete_template = function(user){
		return `
		
		dn: uid=${user.username},ou=users,${SG.LDAP.DN}
		changetype: delete

		`.replace(/\n\t\t/g, '\n');
	}

	var LDAP_add = function(user, password) {

		var content = add_template(user, password);
		if (content instanceof Error)
			return content;
		try{
			fs.writeFileSync(user.username+'-add.ldif', content);
		}catch(e){
			return e;
		}

		var cmd = spawnSync('ldapmodify', ['-a', '-x', '-D', SG.LDAP.credential.login, '-w', SG.LDAP.credential.password, '-H', SG.LDAP.server, '-f', user.username+'-add.ldif']);
		var out = cmd.stdout.toString(), err = cmd.stderr.toString();

		spawnSync('rm', [user.username+'-add.ldif']);
		
		return (err)? new Error(err) : out;
	}

	var LDAP_change_password = function(user, password){
		var content = modify_pass_template(user, password);
		if (content instanceof Error)
			return content;
		try{
			fs.writeFileSync(user.username+'-change_pass.ldif', content);
		}catch(e){
			return e;
		}
		
		var cmd = spawnSync('ldapmodify', ['-x', '-D', SG.LDAP.credential.login, '-w', SG.LDAP.credential.password, '-H', SG.LDAP.server, '-f', user.username+'-change_pass.ldif']);
		var out = cmd.stdout.toString(), err = cmd.stderr.toString();

		spawnSync('rm', [user.username+'-change_pass.ldif']);

		return (err)? new Error(err) : out;
	}

	var LDAP_delete = function(user, password){
		var content = delete_template(user, password);
		if (content instanceof Error)
			return content;
		try{
			fs.writeFileSync(user.username+'-delete.ldif', content);
		}catch(e){
			return e;
		}
		
		var cmd = spawnSync('ldapmodify', ['-x', '-D', SG.LDAP.credential.login, '-w', SG.LDAP.credential.password, '-H', SG.LDAP.server, '-f', user.username+'-delete.ldif']);
		var out = cmd.stdout.toString(), err = cmd.stderr.toString();

		//spawnSync('rm', [user.username+'-delete.ldif']);

		return (err)? new Error(err) : out;
	}
	//console.log( LDAP_add_template( { firstname: 'Souleymane Cheick', lastname:'KANTE', username: 'skante', mail:'skante@enst.fr'}, "pass" ) );
	var check_credientials = function(user){
		
		var cmd = spawnSync('ldapwhoami', ['-x', '-w', user.password, '-D', `uid=${user.username},ou=users,${SG.LDAP.DN}`, '-H', SG.LDAP.server]);
		var out = cmd.stdout.toString(), err = cmd.stderr.toString();

		return (err)? new Error(err) : out;
	}

	return {
		add : LDAP_add,
		delete : LDAP_delete,
		change_pass : LDAP_change_password,
		authenticate : check_credientials
	};
}
*/

/*
module.exports = function(){
	var add = function(firstname, lastname, mail, username, password, cb){
		//
		console.log("-------------------------- ADD 1 -----------------------");
		var run = "bash "+__dirname+"/ldap_scripts/add.sh "+firstname+" "+lastname+" "+mail+" "+username+" "+password;

		exec(run, (error, stdout, stderr) => {
			console.log("-------------------------- ADD 4 -----------------------");
		
	        if(error || stderr){
	        	cb(error || stderr);
	            return console.log(`Error : ${(error)? error : stderr }`);
	        }
	        console.log("-------------------------- ADD 2 -----------------------");
		
	        console.log(`stdout : ${stdout}`);
	        console.log(`stderr : ${stderr}`);
	        console.log("-------------------------- ADD 3 -----------------------");
		
	        cb();
		});
	}
	var update_password = function(uid, new_password, cb){
		//
		var run = "bash "+__dirname+"/ldap_scripts/update_password.sh "+uid+" "+new_password;

		exec(run, (error, stdout, stderr) => {
	        if(error || stderr){
	        	cb(error || stderr);
	            return console.log(`Error : ${error}`);
	        }

	        console.log(`stdout : ${stdout}`);
	        console.log(`stderr : ${stderr}`);
	        cb();
		});
	}

	return {
		add : add,
		update_passwd : update_password
	};
		
}
*/