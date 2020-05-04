
var mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/algofab');

var Schema = mongoose.Schema;


var userSchema = new Schema(
	{ // Schema
		name : String,
		email : String,
		status : String,
		logo : String,
		username : String,
		password : String
	}, 
	{
		collection : 'users' // Collection name
	} 
);

var algosSchema = new Schema(
	{
	  title : String,
	  version : {type : String, default : "1.0.0"},
	  types : Array,
	  description : Array,
	  keywords : Array,
	  links : Array,
	  url : String,
	  API : {
	  	listenOn : {type : Number, default : 3000},
	    get : {type : Object, default : undefined},   // { inputs : Array, outputs : Array, description : String }
	    post : {type : Object, default : undefined},  // { inputs : Array, outputs : Array, description : String }
	    put : {type : Object, default : undefined},   // { inputs : Array, outputs : Array, description : String }
	    delete : {type : Object, default : undefined} // { inputs : Array, outputs : Array, description : String }
	  },
	  author : {
	  	name : String,
	  	username : String,
	  	contact : String,
	  	logo : String
	  },
	  hardware : {
	    os : {
	    	name : String,
	    	version : String
	    },
	    cpu_threads : Number, // Nombre
	    ram : {type :Number, default : 4194304}, // en Mo
	    disk : {type :Number, default : 4194304}, // en Mo
	    gpu : {type : String, default : 'NO'} // YES ou NO
	  },
	  dependencies : Array, // [{ "algo" : "AlgoName1", "version" : "1.2.3"}, { "algo" : "AlgoName2", "version" : "1.2.3"}],
  	  other_required_infos : {
	    cluster : {
	    	size : Number, 
	    	app : String, // ex "HADOOP"
	    },
	    bdd : {
	    	app : String// ex "MYSQL"
	    }
	  },
	  date : {type : Date, default : Date.now()},
	  hidden : {type : String, default : "true"}
	},
	{
		collection : 'algos_v1' // Collection name
	}
); 

var historySchema = new Schema(
	{
	  algoID : String,
	  userID : String,
	  date : {type : Date, default : Date.now()},
	},
	{
		collection : 'history' // Collection name
	}
); 

var subscriptionsSchema = new Schema(
	{
	  algoID : String,
	  userID : String,
	  date : {type : Date, default : Date.now()},
	},
	{
		collection : 'Subscriptions' // Collection name
	}
); 

mongoose.model('User', userSchema);
mongoose.model('Algos', algosSchema);
mongoose.model('Histo', historySchema);
mongoose.model('Subscript', subscriptionsSchema);