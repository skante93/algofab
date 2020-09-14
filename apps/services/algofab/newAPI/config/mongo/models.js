	
var mongoose = require('mongoose');

const settings  = require('../settings');

var options = {
	useMongoClient : true,
	//server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
	//replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
};

mongoose.connect(settings.mongo_url, options);

var Schema = mongoose.Schema;

var photosSchema = new Schema(
	{
		content_type: String,
		data: Buffer,
	},
	{
		collection: "photos"
	}
);

var ratingsSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: "Users", required: true},
		note: { type: Number, min: 1, max: 5, required: true },
		comment: String,
		responses: [{ type: Schema.Types.ObjectId, ref: "Ratings" }],
		date: { type : Date, default : Date.now }
	},
	{
		collection: "ratings"
	}
);

var downloadsSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: "Users" },
		resourceID: { type: Schema.Types.ObjectId, ref: "Resources" },
		resource_version: String,
		licenceID: { type: Schema.Types.ObjectId, ref: "Licences" },
		agreementID: { type: Schema.Types.ObjectId, ref: "Agreements" },
		date: { type : Date, default : Date.now },
	},
	{
		collection: "downloads"
	}
);

var licencesSchema = new Schema(
	{
		name: { type: String, required: true},
		version: { type: String },
		external_links: [{ type: String}],
		content: String
	},
	{
		collection: "licences"
	}
);

var agreementsSchema = new Schema(
	{
		name: { type: String, required: true},
		external_links: [{ type: String, required: true}],
		content: {
			media_type: {type: String, required: true},
			details: String
		},
		author: { type: Schema.Types.ObjectId, ref: "Users" }
	},
	{
		collection: "agreements"
	}
);

var usersSchema = new Schema(
	{ // Schema
		profile: {
			username: String,
			emails : [
				{
					email: String,
					verified: { type: Boolean, default: false }
				}
			],
			main_email: String,
			firstname: String,
			lastname: String,
			status: String,
//			photo: { type: Schema.Types.ObjectId, ref : 'Photos' }
			photo: { content_type: String, buffer: Buffer }
		},
		passwords: [
			{
				hash: String,
				expireAt: { type: Date, default: function(){ Date.now() + 1000*2 } }
			}
		],
		groups: [ {type: Schema.Types.ObjectId, ref : 'Groups'} ],
		preferences: {
			//
		},
		freezed: { type: Boolean, default: false},
		date: {type: Date, default: Date.now },
		deleteAt: {type: Date}
	}, 
	{
		collection : 'users', // Collection name
		usePushEach: true
	} 
);

var groupsSchema = new Schema({
	name: String,
});

var resourcesSchema = new Schema (
	{
		metadata: {
			name : String,
			version: { type : String, default : "1.0.0", match: /^([0-9]{1,3}\.){2}([0-9]{1,3})$/ },
			short_intro: String,
			description : String,
			documentations : {
				media_type: { type: String, enum : ["html", "file", "external_links"] },
				details: Object
			},
			logo : { content_type: String, buffer: Buffer },
			tags : [
				{
					name : String,
					value: String 
				}
			],
			asset_type: String,
			private : { type : Boolean, default : false },
			licence: { type: Schema.Types.ObjectId, ref : 'Licences' },
			agreement: { type: Schema.Types.ObjectId, ref : 'Agreements' }
		},
		demo: { 
			apiVersion: {type: String, enum: ["v1"], default: "v1" },
			type: {type: String, enum: ["docker", "docker-compose", "kubernetes"]},
			spec: Object,
		},
		settings: {
			upForDownload: { type: Boolean, default: true }
		},
		//versions : [{ type: Schema.Types.ObjectId, ref: 'ResourceVersions' }],
		archiveData : { type: Schema.Types.ObjectId },
		deleteAt : Date,
		date : {type : Date, default : Date.now},
		author: { type: Schema.Types.ObjectId, ref : 'Users'},
		workflow: {type: Schema.Types.ObjectId}
	},
	{
		collection : "resources",
		usePushEach: true
	}
);
resourcesSchema.index( { "metadata.name": "text", "metadata.description": "text", "metadata.tags": "text" } ); 

var resourceVersionSchema = new Schema(
	{
		version: {type: String, enum: ["v1"] },
		resourceID: { type: Schema.Types.ObjectId, ref: 'Resources' },
		version: { type : String, default : "1.0.0", match: /^([0-9]{1,3}\.){2}([0-9]{1,3})$/ },
		docs: String,
		private : { type : Boolean, default : false },

		data: { type: Schema.Types.ObjectId, ref: 'ArticleVersionData' },
		spec: { type: Object },
		date : {type : Date, default : Date.now},
	}, 
	{ 
		collection: 'resource_versions' 
	}
);


var liveDataSchema = new Schema({
	apiVersion: {type: String, enum: ["v1"], default: "v1" },
	name: {type: String, required: true},
	type: {type: String, enum: ["empty"]},
	description: String,
	sshKeys: {type: String, required: true},
	spec: {type:Object, required:true},
	author: { type: Schema.Types.ObjectId, ref : 'Users'}
});

var articleVersionDataSchema = new Schema({
	name: String,
	type: String,
	data: String
}, {collection: "articles_versions_data"});



mongoose.model('Photos', photosSchema);
mongoose.model('Ratings', ratingsSchema);
mongoose.model('Downloads', downloadsSchema);
mongoose.model('Licences', licencesSchema);
mongoose.model('Agreements', agreementsSchema);
mongoose.model('Users', usersSchema);
mongoose.model('Groups', groupsSchema);
mongoose.model('Resources', resourcesSchema);
mongoose.model('LiveData', liveDataSchema);

//mongoose.model('Downloads', downloadsSchema);




//mongoose.model('User', userSchema);
//mongoose.model('Pass', passSchema);
// mongoose.model('Algos', algosSchema);
// mongoose.model('AlgosMeta', algoMetaSchema);
// mongoose.model('Article', articleSchema);
// mongoose.model('ArticleVersion', articleVersionSchema);
// mongoose.model('ArticleVersionData', articleVersionDataSchema);
// mongoose.model('Histo', historySchema);
// mongoose.model('Subscriptions', subscriptionsSchema);
// mongoose.model('Resetpwd', resetPWDSchema);
// mongoose.model('demoSessionID', demoSessionID);
// mongoose.model('Context', contextSchema);
// mongoose.model('Token', tokenSchema);
// mongoose.model('BugReports', bugReports);
// mongoose.model('AVReports', avReports);


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

