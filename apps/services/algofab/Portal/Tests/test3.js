




var fs = require('fs'), spawnSync = require('child_process').spawnSync;
var LDAP = function(SG){
	SG = {
		LDAP : { 
		    server : "ldap://ws37-cl2-en12", 
		    DN : "dc=ldap,dc=algofab,dc=fr", 
		    credential : { 
		        login : "cn=admin,dc=ldap,dc=algofab,dc=fr",  
		        password : "pass"
		    }
		}
	};

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

	var retrieve_LDAP_account = function(user){
		var args = ['-xLLL', '-D', '"'+SG.LDAP.credential.login+'"', '-w', SG.LDAP.credential.password, '-H', SG.LDAP.server, '-b', '"'+SG.LDAP.DN+'"', '-s', 'sub', '"(uid='+user.username+')"'];
		
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

	return {
		add : LDAP_add,
		delete : LDAP_delete,
		change_pass : LDAP_change_password,
		authenticate : check_credientials,
		retrieve_account : retrieve_LDAP_account
	};
}

/*
console.log( LDAP().add( { 
	firstname: 'Simba', 
	lastname:'ROI DE LA JUNGLE', 
	username: 'simba', 
	mail:'skante@enst.fr'
}, "pass" ));
*/


/*
console.log( LDAP().change_pass( { 
	firstname: 'Simba', 
	lastname:'ROI DE LA JUNGLE', 
	username: 'simba', 
	mail:'skante@enst.fr'
}, "pass" ));
*/

/*
console.log( LDAP().delete( { 
	firstname: 'Simba', 
	lastname:'ROI DE LA JUNGLE', 
	username: 'simba', 
	mail:'skante@enst.fr',
	password : 'pass'
}));
*/

console.log( LDAP().retrieve_account( { 
	firstname: 'Simba', 
	lastname:'ROI DE LA JUNGLE', 
	username: 'skante1', 
	mail:'skante@enst.fr',
	password : 'pass'
}));