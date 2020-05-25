


module.exports = {
	user : require('./user')(global),
	algo : require('./algo')(global),
	article : require('./article'),
	demo : require('./demo'),
	docs : require('./docs'),
	search : require('./search'),
	//partners : require('./partners'),
	upload : require('./upload')(global),
	recover: require('./recover')(global),
	signin : require('./signin')(global),
	signup : require('./signup'),
	proxy : require('./proxy')
};
