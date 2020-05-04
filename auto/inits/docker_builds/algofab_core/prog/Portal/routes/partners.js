var express = require('express');
var router = express.Router();

/* GET partners page. */
router.get('/', function(req, res) {
	console.log("----------------------------------------------------------");
    console.log("\t\t PARTNERS : MIDDLEWARE 1");
    console.log("----------------------------------------------------------");
    
	var pop_message = req.session.pop_message;
	if (pop_message)
		req.session.pop_message = undefined;

	if (req.session.user)
	 	res.render('partners', { pop_message : pop_message, title: 'Partneraires', activeHeadersComp: 'partners', user : req.session.user });
	 else
	 	res.render('partners', { pop_message : pop_message, title: 'Partneraires', activeHeadersComp: 'partners'});
});

module.exports = router;
