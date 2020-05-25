
var fs = require('fs');
var spawnSync = require('child_process').spawnSync;


var SSHA = function(pass){
	var cmd = spawnSync('slappasswd', ['-h', '{SSHA}', '-s', pass], {shell: true}), out = cmd.stdout.toString(), err = cmd.stderr.toString();
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
	
	`.replace(/\n\t/g, '\n');
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

	`.replace(/\n\t/g, '\n');
}

var delete_template = function(user){
	return `
	
	dn: uid=${user.username},ou=users,${global.settings.LDAP.DN}
	changetype: delete

	`.replace(/\n\t/g, '\n');
}

var LDAP_add = function(user) {
	console.log("##### LDAP_add #####");
	
	var content = add_template(user, user.password);
	var filename = '/tmp/'+user.username+'-add.ldif';
	
	if (content instanceof Error)
		return content;
	try{
		fs.writeFileSync(filename, content);
	}catch(e){
		return e;
	}
	console.log("CONTENT: \n"+content+"\n---------");
	var cmdArgs = ['-a', '-x', '-D', settings.LDAP.credential.login, '-w', settings.LDAP.credential.password, '-H', settings.LDAP.server, '-f', filename]
	console.log("SHELL~$ ldapmodify "+cmdArgs.join(" "));
	
	var cmd = spawnSync('ldapmodify', cmdArgs, {shell: true});
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

var LDAP_delete = function(user){//}, password){
	var content = delete_template(user);//, password);
	if (content instanceof Error)
		return content;
	try{
		fs.writeFileSync(user.username+'-delete.ldif', content);
	}catch(e){
		return e;
	}
	
	console.log("LDAP_DELETE:", 'ldapmodify', ['-x', '-D', global.settings.LDAP.credential.login, '-w', global.settings.LDAP.credential.password, '-H', global.settings.LDAP.server, '-f', user.username+'-delete.ldif'].join(" "));
	var cmd = spawnSync('ldapmodify', ['-x', '-D', global.settings.LDAP.credential.login, '-w', global.settings.LDAP.credential.password, '-H', global.settings.LDAP.server, '-f', user.username+'-delete.ldif']);
	var out = cmd.stdout.toString(), err = cmd.stderr.toString();

	//spawnSync('rm', [user.username+'-delete.ldif']);

	return (err)? new Error(err) : out;
}

var check_credientials = function(user, isAdmin){
	if(typeof isAdmin === 'undefined') isAdmin = false;

	var cmd = spawnSync('ldapwhoami', ['-x', '-w', user.password, '-D', `uid=${user.username},ou=${(isAdmin)?'admins':'users'},${global.settings.LDAP.DN}`, '-H', global.settings.LDAP.server]);
	var out = cmd.stdout.toString(), err = cmd.stderr.toString();

	return (err)? new Error(err) : out;
}

var retrieve_LDAP_account = function(user, isAdmin){
	//if(typeof isAdmin === 'undefined') isAdmin = false;
	var args = ['-xLLL', '-D', '"'+global.settings.LDAP.credential.login+'"', '-w', global.settings.LDAP.credential.password, '-H', global.settings.LDAP.server, '-b', '"'+global.settings.LDAP.DN+'"', '-s', 'sub', '"(uid='+user.username+')"'];
	
	var cmd = spawnSync('ldapsearch', args, { shell : true});
	var out = cmd.stdout.toString(), err = cmd.stderr.toString();
	
	if (err) return new Error(err);

	var lines = out.split('\n');
	var obj = {};
	lines.forEach(function(line){
		if(line){
			//console.log('line : '+line);
			var parts = line.split(':');
			obj[parts[0]] = parts[parts.length-1].replace(/^ /,'');
		}
	});

	return obj;
}

module.exports = {
	add : LDAP_add,
	delete : LDAP_delete,
	change_pass : LDAP_change_password,
	authenticate : check_credientials,
	retrieve_LDAP_account : retrieve_LDAP_account
}
