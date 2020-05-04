
module.exports = function(SG){

	return {
		proxy : require('./proxy'),
		dao : require('./DAO'),
		ldap : require('./ldap'),
		kube : require('./kube')(SG),
		kubectl: require('./kubectl')
	}
}