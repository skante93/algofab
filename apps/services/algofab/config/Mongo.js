	
var mongoose = require('mongoose');

var options = {
	useMongoClient : true,
	//server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
	//replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
};

mongoose.connect(settings.MONGO, options);

var Schema = mongoose.Schema;


var userSchema = new Schema(
	{ // Schema
		company_name : String,
		email : String,
		status : String,
		logo : String,
		firstname : String,
		lastname : String,
		username : String,
		password : String,
		storage_limit : {type : Number, default : 2*1024*1024*1024},
		contributions : [{ type: Schema.Types.ObjectId, ref: 'Algos' }],
		credits : { type : Number, default : 20000 }
	}, 
	{
		collection : 'users' // Collection name
	} 
);

var passSchema = new Schema(
	{
		username : String,
		email : String
	}, 
	{ 
		collection : 'password'
	}
);

var algoMetaSchema = new Schema (
	{
		title : String,
		description : String,
		logo : String,
		keywords : Array,
		author : { type: Schema.Types.ObjectId, ref: 'User' },
		date : {type : Date, default : Date.now},
		hidden : {type : Boolean, default : true},
		versions : [{ type: Schema.Types.ObjectId, ref: 'Algos' }],
		delete_date : { type : Date, default : undefined },
		ratings: [
			{
				username: String,
				note: Number,
				message: String
			}
		]
	},
	{
		collection : "algo_meta",
		usePushEach: true
	}
);

var articleSchema = new Schema (
	{
		name : String,
		description : String,
		logo : String,
		tags : Array,
		author : { type: Schema.Types.ObjectId, ref: 'User' },
		date : {type : Date, default : Date.now},
		hidden : {type : Boolean, default : true},
		versions : [{ type: Schema.Types.ObjectId, ref: 'ArticleVersion' }],
		delete_date : { type : Date, default : undefined },

		short_intro: String,
		asset_type: Number,
		business_category: Number,
		technical_category: Number,

		ratings: [
			{
				username: String,
				note: Number,
				comment: String,
				date: {type : Date, default : Date.now}
			}
		]
	},
	{
		collection : "articles",
		usePushEach: true
	}
);

articleSchema.index( { name: "text", description: "text", tags: "text" } ); 

var articleVersionSchema = new Schema({
	version: { type : String, default : "1.0.0"},
	articleID: { type: Schema.Types.ObjectId, ref: 'Article' },
	docs: String,
	downloads: [ 
		{
			username: String,
			date: {type : Date, default : Date.now},
			agreementID: String,
			licenceID: String
		} 
	],
	data: { type: Schema.Types.ObjectId, ref: 'ArticleVersionData' },
	spec: { type: Object },
	date : {type : Date, default : Date.now},
}, { collection: 'articles_versions' });

var articleVersionDataSchema = new Schema({
	name: String,
	type: String,
	data: String
}, {collection: "articles_versions_data"});


var algosSchema = new Schema(
	
	{
		meta : { type: Schema.Types.ObjectId, ref: 'AlgosMeta' },
		version : { type : String, default : "1.0.0"},
		comment : String,
		is_stateless : { type : Boolean, default : true},
		credits_per_call : { type : Number, default : 1000 },
		deployment : {
			main_service : String,
			services : {
				demo : {
					http : { 
						type : {
							svc : String,
							port_name : String
						},
						default : undefined
					},
					https : {
						type : {
							svc : String,
							port_name : String
						},
						default : undefined
					},
					ws : {
						type : {
							svc : String,
							port_name : String
						},
						default : undefined
					},
					wss : {
						type : {
							svc : String,
							port_name : String
						},
						default : undefined
					}
				},
				api : {
					http : { 
						type : {
							svc : String,
							port_name : String
						},
						default : undefined
					},
					https : {
						type : {
							svc : String,
							port_name : String
						},
						default : undefined
					},
					ws : {
						type : {
							svc : String,
							port_name : String
						},
						default : undefined
					},
					wss : {
						type : {
							svc : String,
							port_name : String
						},
						default : undefined
					}
				}
			},
			kubernetes : { type : Array, default : undefined },
			infra : Object,
			k8s: String
		},
		infra_ready : {type : Boolean, default : false},
		API : {
		  	//listenOn : {type : Number, default : 3000},
		    GET : {

		    	type : [{
		    		uri : {type : String, default : '/'},
	    			inputs : {
	    				type : [ 
			    			{
					    		name : String,
					    		mime_types : [String],
					    		required : Boolean
					    	}
					    ],
					    default : []
			    	},
			    	outputs : [String],
			    	description : [String]
			    }], 
			    default : undefined
		    },
		    POST : {

		    	type : [{
		    		uri : {type : String, default : '/'},
	    			inputs : {
	    				type : [ 
			    			{
					    		name : String,
					    		mime_types : [String],
					    		required : Boolean
					    	}
					    ],
					    default : []
			    	},
			    	outputs : [String],
			    	description : String
			    }], 
			    default : undefined
		    },
		    PUT : {

		    	type : [{
		    		uri : {type : String, default : '/'},
	    			inputs : {
	    				type : [ 
			    			{
					    		name : String,
					    		mime_types : [String],
					    		required : Boolean
					    	}
					    ],
					    default : []
			    	},
			    	outputs : [String],
			    	description : String
			    }], 
			    default : undefined
		    },
		    DELETE : {

		    	type : [{
		    		uri : {type : String, default : '/'},
	    			inputs : {
	    				type : [ 
			    			{
					    		name : String,
					    		mime_types : [String],
					    		required : Boolean
					    	}
					    ],
					    default : []
			    	},
			    	outputs : [String],
			    	description : String
			    }], 
			    default : undefined
		    }
		},
		//author : { type: Schema.Types.ObjectId, ref: 'User' },
		date : {type : Date, default : Date.now},
		hidden : {type : Boolean, default : true},
		shareable : {type : Boolean, default : true}
	}
	,
	{
		//collection : 'algo_versions'
		collection : 'algos_version' // Collection name
	}
); 

var historySchema = new Schema(
	{
	  algo : {
	  	title : String,
	  	version : String
	  },
	  userID : String,
	  date : {type : Date, default : Date.now},
	},
	{
		collection : 'history' // Collection name
	}
); 

var subscriptionsSchema = new Schema(
	{
		algos : [{ type: Schema.Types.ObjectId, ref: 'AlgosMeta' }],
		user : { type: Schema.Types.ObjectId, ref: 'User' },
		date : {type : Date, default : Date.now},
	},
	{
		collection : 'Subscriptions' // Collection name
	}
);

var resetPWDSchema = new Schema(
	{
	  username : String,
	},
	{
		collection : 'resetpwd' // Collection name
	}
);

var demoSessionID = new Schema(
	{
		user : String,
		algo : String,
	}, 
	{
		collection : 'demoSessionID'
	}
)

var contextSchema = new Schema(
	{ // Schema
		history : {
			type : [
				{
					date : Date,
	                duration : Number,
	                algo : { type: Schema.Types.ObjectId, ref: 'Algos' }
	            }
            ],
            default : []
        },
        authorizations : { type :
			{
				default_rule : String,
				except : { 
					type : {
						algos : [String],
						authors : [String]
					}, 
					default : undefined 
				}
			}
			, 
			default : []
		},
			
		creation_date : {type : Date, default : Date.now}
	}, 
	{
		collection : 'context' // Collection name
	} 
);

var tokenSchema = new Schema(
	{ // Schema
		bearer : { type: Schema.Types.ObjectId, ref: 'User' },
		token : String,
		creation_date : {type : Date, default : Date.now}
	}, 
	{
		collection : 'token' // Collection name
	} 
);

var bugReports = new Schema(
	{
		emittedBy : {type : Schema.Types.ObjectId, ref: 'User' },
		addressedTo : {type : Schema.Types.ObjectId, ref: 'User' },
		algo_version : {type : Schema.Types.ObjectId, ref: 'Algos' },
		message : String,
		date : {type : Date, default : Date.now},
		read : {type : Boolean, default : false}
	},
	{
		collection : 'bugreports'
	}
);

var avReports = new Schema(
	{
		emittedBy : {type : Schema.Types.ObjectId, ref: 'User' },
		addressedTo : {type : Schema.Types.ObjectId, ref: 'User' },
		article_version : {type : Schema.Types.ObjectId, ref: 'ArticleVersion' },
		message : String,
		date : {type : Date, default : Date.now},
		read : {type : Boolean, default : false}
	},
	{
		collection : 'version_reports'
	}
);

mongoose.model('User', userSchema);
mongoose.model('Pass', passSchema);
mongoose.model('Algos', algosSchema);
mongoose.model('AlgosMeta', algoMetaSchema);
mongoose.model('Article', articleSchema);
mongoose.model('ArticleVersion', articleVersionSchema);
mongoose.model('ArticleVersionData', articleVersionDataSchema);
mongoose.model('Histo', historySchema);
mongoose.model('Subscriptions', subscriptionsSchema);
mongoose.model('Resetpwd', resetPWDSchema);
mongoose.model('demoSessionID', demoSessionID);
mongoose.model('Context', contextSchema);
mongoose.model('Token', tokenSchema);
mongoose.model('BugReports', bugReports);
mongoose.model('AVReports', avReports);


/*
mongoose.connection.on('connected', function(error){
	console.log(">>> Mongoose connected");
});

mongoose.connection.on('error', function(error){
	console.log(" MONGOOSE ERROR : "+error);
});
*/


mongoose.Promise = require('q').Promise;
module.exports = mongoose;


/*
var m = f("mongodb://192.168.0.6:27018/algofab");

var AlgosMeta = m.model('AlgosMeta');
AlgosMeta.find().populate([
	{
		path : "versions"
	},
	{
		path : "author",
		match : {
			username : "jdoe"
		}
	}
]).where("author").ne(null).exec(function(err, res){
	res = res.filter(function(res){
        return res.author;
    });
	console.log(err || res[0]+'\n\n'+res.length+' elements');
	
})*/

