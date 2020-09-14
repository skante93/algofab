
module.exports = function(SG){

	return {
		proxy : require('./proxy'),
		dao : require('./DAO')(SG.mongo),
		ldap : require('./ldap')(SG)
	}
}