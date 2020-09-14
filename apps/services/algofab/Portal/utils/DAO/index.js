

module.exports = function(SG){
	return {
		user : require('./user')(SG),
		algo : require('./algo')(SG),
		tkn_ctxt : require('./token_context')(SG)
	}
}