

module.exports = function(mongo){
	return {
		user : require('./user')(mongo)
	}
}