


module.exports = {
	user : require('./user')(global),
	algo : require('./algo')(global),
	demo : require('./demo'),
	docs : require('./docs')(global),
	partners : require('./partners'),
	upload : require('./upload')(global),
	resetpwd: require('./resetpwd')(global),
	signin : require('./signin')(global),
	signup : require('./signup'),
	proxy : require('./proxy')
};
