
module.exports = function(SG){


	var r = {
		proxy : require('./proxy'),
		dao : require('./DAO'),
		ldap : require('./ldap'),
		kube : process.env.WITH_K8S == "TRUE"? require('./kube') : null,
		kubectl: process.env.WITH_K8S == "TRUE"? require('./kubectl'): null
	};

	return r;
}