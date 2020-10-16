
const fs = require('fs');
const {mongoose} = require('./schemas'), { settings } = require('../settings'), mailer = require('../utils/mailer');
var GridFs = require('gridfs-stream');

exports.mongoose = mongoose;

const photosModel = mongoose.model('Photos');
const ratingsModel = mongoose.model('Ratings');
//const downloadsModel = mongoose.model('Downloads');
const licencesModel = mongoose.model('Licences');
const agreementsModel = mongoose.model('Agreements');
const tokenModel = mongoose.model('Tokens');
const usersModel = mongoose.model('Users');
const groupsModel= mongoose.model('Groups');
const resourcesModel = mongoose.model('Resources');
//const liveDataModel = mongoose.model('LiveData');
//const algoTemplatesModel = mongoose.model('AlgoTemplates');
//const algoInstancesModel = mongoose.model('AlgoInstances');
const FilesMeta = mongoose.model('GFS');

const { processParamsFields, RestResponse, randomPassword, createHash, compareSync, createJWT } = require('../utils/others');

let gfs;

mongoose.connection.on('open', ()=>{
    console.log("Yo MONGOOSE CONNECTED!");
    gfs = new GridFs(mongoose.connection.db, mongoose.mongo);
});

const userIDQuery = (id)=> {
    return mongoose.Types.ObjectId.isValid(id)? { _id: id} : { $or: [{"profile.username": id}, {"profile.email": id }] };
}
const resourceIDQuery = (id)=>{
    return {_id: id};
}
const licenceIDQuery = (id)=>{
    return {_id: id};
}
const agreementIDQuery = (id)=>{
    return {_id: id};
}
const ratingsIDQuery = (id)=>{
    return {_id:id};
}

const LDAP_AVAILABLE_SWITCH = false;

class UsersManager {

    async getAll(params) {
        if ('fields' in params){
            params.fields = params.fields.filter(e=>e!=null);
        }
        try {
            var selector = {};
            params.fields.forEach((f)=>{selector[f] = 1});
            //console.log("selector: ", selector);
            //var users = await usersModel.find({},selector).populate('profile.photo');
            
            var users;
            if ('profile' in selector || 'profile.photo' in selector || Object.keys(selector).length == 0){
                console.log("####### POPULATING PROFILE PHOTO");
                users = await usersModel.find({},selector).populate('profile.photo');
            }
            else{
                console.log("####### NOT POPULATING PROFILE PHOTO");
                users = await usersModel.find({},selector);
            }
            return new RestResponse("Gotten", 200, users);
        } catch (e) {
            return new RestResponse("DBError", 500, e);
        }
    }

    async getOne(params) {
        
        var err = processParamsFields(params, [
            {name: "userID", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("ParameterSpecError", 500, err);
        }
        var selector = {};
        if ('fields' in params){
            params.fields = params.fields.filter(e=>e!=null);
            params.fields.forEach((f)=>{selector[f] = 1});
        }

        try {
            
            //console.log("selector: ", selector);
            var user;
            if ('profile' in selector || 'profile.photo' in selector){
                console.log("####### POPULATING PROFILE PHOTO");
                user = await usersModel.findOne(userIDQuery(params.userID), selector).populate('profile.photo');
            }
            else{
                console.log("####### NOT POPULATING PROFILE PHOTO");
                user = await usersModel.findOne(userIDQuery(params.userID), selector);
            }
            if (!user){
                return new RestResponse("NotFoundError", 404, `user "${params.userID}" does not exist`)
            }
            return new RestResponse("Gotten", 200, user);
        } catch (e) {
            return new RestResponse("DBError", 500, e);
        }
    }

    async create(params, requestedBy) {
        var err = processParamsFields(params, [
            {name: "username", required: true},
            {name: "email", required: true},
            {name: "firstname", default: "John"},
            {name: "lastname", default: "DOE"},
        ]);

        if (err instanceof Error){
            return new RestResponse("DBError", 500, err);
        }

        if ( !settings.validation_schemes.username.test(params.username)){
            return new RestResponse("FormatError", 500, `username invalid, it needs to match the following regex: ${settings.validation_schemes.username.toString()}`);
        }

        try {
            var q = { $or: [{"profile.username": params.username}, {"profile.email" : params.email}] };
            console.log("find query : ", q);
            var users = await usersModel.findOne(q);
            if (users != null){
                return new RestResponse("AlreadyExistsError", 500, `a user with the ${users.profile.username == params.username? `username "${params.username}"` : `email "${params.email}"`} alredy exists.`);
            }

            if (LDAP_AVAILABLE_SWITCH){
                console;log("Adding to LDAP");
            }
            var clear_password = "password" in params && typeof params.password != 'undefined' && params.password != null? params.password : randomPassword();
            
            console.log("+-+-+-+- CLEAR PASSWORD :", clear_password, "-+-+-+-+");
            var id = mongoose.Types.ObjectId().toString();
            var u = new usersModel({
                _id: id,
                profile: {
                    username: params.username,
                    email: params.email,
                    firstname: params.firstname,
                    lastname: params.lastname,
                    password: createHash(clear_password)
                },
                auth_token: createJWT({iss: id})
            });
            try{
                if (typeof mailer !== 'undefined'){
                    await mailer.newAccountNotification(u, clear_password);
                }
            }
            catch(e){
                return new RestResponse("MailingError", 500, e);
            }

            try{
                var newUser = await u.save();
                console.log("newUser : ", newUser);
                return new RestResponse("Created", 201, newUser);
            }
            catch(e){
                return new RestResponse("DbError", 500, e);
            }
        }
        catch(e){
            return new RestResponse("DbError", 500, e);
        }
    }

    async remove(params, requestedBy) {

        //console.log(`userManager removeing : `, params);
        var err = processParamsFields(params, [
            {name: "userID", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("ParameterSpecError", 500, err);
        }
        if (!requestedBy){
            return RestResponse("AuthorzationDenied", 500, `an unidentified user cannot remove a user account`);
        }

        try {
            var user = await usersModel.findOne(userIDQuery(params.userID) ).populate('profile.photo');
            if (!user){
                return new RestResponse("NotFoundError", 404, `user with id "${params.userID}" does not exist.`)
            }
        } catch (e) {
            return new RestResponse("DBError", 500, e);
        }

        if (params.delayed === true){

            user.deleteAt = Date.now() + settings.api.operations_timing.user_deletion_delay;
            try{


                await user.save();
                return new RestResponse("Deleted", 200, `user "${params.userID}" successfully up for deletion`, "the account will be automatically deleted in x days");
            }catch(e){
                return new RestResponse("DBError", 500, e);
            }
        }
        else{
            try{

                if ( user.profile.photo != null ){
                    //
                    try{
                        console.log("removing photo ..");
                        await user.profile.photo.remove();
                        console.log("removed !!");
                    }
                    catch(e){
                        return new RestResponse("DBError", 500, e);
                    }
                }

                await user.remove();
                return new RestResponse("Deleted", 200, `user "${params.userID}" successfully deleted`);
            }catch(e){
                return new RestResponse("DBError", 500, e);
            }
        }
    }

    async loginUser(params){
        var err = processParamsFields(params, [
            {name: "login", required: true},
            {name: "password", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("DBError", 500, err);
        }

        var query = userIDQuery(params.login);
        try{
            var user = await usersModel.findOne(query);
            if (!user){
                return new RestResponse("NotFoundError", 404, `login ${params.login} not found`);
            }
            if (!compareSync(params.password, user.profile.password) ){
                return new RestResponse("WrongValueError", 500, `wrong password`);
            }
            return new RestResponse("LoggedIn", 200, user);
        }
        catch(e){
            return new RestResponse("DBError", 500, e);
        }
    }

    async updateProfile(params, requestedBy) {
        var err = processParamsFields(params, [
            {name: "userID", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("DBError", 500, err);
        }
        if (!requestedBy){
            return RestResponse("AuthorzationDenied", 500, `an unidentified user cannot update a user account`);
        }
        // if ('username' in params){
        //     if (typeof params.username === 'undefined' || params.username == null){
        //         delete params.username;
        //     }
        // }
        if ('email' in params){
            if (typeof params.email === 'undefined' || params.email == null){
                delete params.email;
            }
        }
        if ('firstname' in params){
            if (typeof params.firstname === 'undefined' || params.firstname == null){
                delete params.firstname;
            }
        }
        if ('lastname' in params){
            if (typeof params.lastname === 'undefined' || params.lastname == null){
                delete params.lastname;
            }
        }
        if ('status' in params){
            if (typeof params.status === 'undefined' || params.status == null){
                delete params.status;
            }
        }
        if ('photo' in params){
            if (typeof params.photo === 'undefined' || params.photo == null){
                delete params.photo;
            }
        }
        
        const query = userIDQuery(params.userID); 
        try{
            var user = await usersModel.findOne(query).populate('profile.photo');
        }catch(e){
            return new RestResponse("DBError", 500, e)
        };
        
        if (!user){
            return new RestResponse("NotFoundError", 404, `login ${params.userID} not found`);
        }
        
        //console.log("user.profile.photo : ", user.profile.photo);

        // email should be updated
        if ('email' in params){
            user.profile.email = params.email;
            // TODO check email
        }

        if ('firstname' in params){
            user.profile.firstname = params.firstname;
        }
        if ('lastname' in params){
            user.profile.lastname = params.lastname;
        }
        if ('status' in params){
            if (Object.keys(settings.app_roles).indexOf(params.status) < 0){
                return new RestResponse("WrongValueError", 500, `status "${params.status}" is invalid, try one of following : ${Object.keys(settings.app_roles).join(', ')}`);
            }
            user.profile.staus = params.status;
        }
        
        if ('photo' in params){
            if (params.photo instanceof Array) {
                params.photo = params.photo[0];
            }
            var originalName = params.photo.originalFilename, ext = params.photo.originalFilename.split('.').pop();
            if ( !(originalName.toLowerCase().endsWith('.jpg') || originalName.toLowerCase().endsWith('.jpeg') || originalName.toLowerCase().endsWith('.png'))){
                return new RestResponse("FormatError", 500, "a user's profile photo is expected to either be JPEG or a PNG image")
            }

            var photo = {
                content_type: 'content-type' in params.photo.headers? params.photo.headers['content-type'] : ext.toLowerCase() == 'jpg'? 'image/jpg' : ext.toLowerCase('jpeg')? 'image/jpeg': 'image/png',
                data: fs.readFileSync(params.photo.path)
            }

            console.log("user.profile.photo : ", user.profile.photo);
            
            // updating existing photo
            if (user.profile.photo != null){
                //console.log("updating photo");
                user.profile.photo.content_type = photo.content_type;
                user.profile.photo.data = photo.data;
            }
            // creating a new one
            else{
                //console.log("creating photo");
                user.profile.photo = new photosModel(photo);
            }
            try {
                user.profile.photo = await user.profile.photo.save();
            } catch (error) {
                return new RestResponse("DBError", 500, e)
            }
        }
        try{
            var updatedUser = await user.save();
            //console.log("updated user : ", updatedUser);
            return new RestResponse('Updated', 200, updatedUser);
        }catch(e){
            return new RestResponse("DBError", 500, e)
        }
    }

    async updatePassword(params, requestedBy) {
        var err = processParamsFields(params, [
            {name: "userID", required: true},
            {name: "currentPassword", required: true},
            {name: "newPassword", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("DBError", 500, err);
        }
        if (!requestedBy){
            return RestResponse("AuthorzationDenied", 500, `an unidentified user cannot update a user account`);
        }
        // if ('username' in params){
        //     if (typeof params.username === 'undefined' || params.username == null){
        //         delete params.username;
        //     }
        // }
        
        
        const query = userIDQuery(params.userID); 
        try{
            var user = await usersModel.findOne(query).populate('profile.photo');
        }catch(e){
            return new RestResponse("DBError", 500, e)
        };
        
        if (!user){
            return new RestResponse("NotFoundError", 404, `login ${params.login} not found`);
        }

        if (!compareSync(params.currentPassword, user.profile.password) ){
            return new RestResponse("WrongValueError", 500, `wrong password`);
        }

        user.profile.password = createHash(params.newPassword);


        try{
            var updatedUser = await user.save();
            //console.log("updated user : ", updatedUser);
            return new RestResponse('Updated', 200, updatedUser);
        }catch(e){
            return new RestResponse("DBError", 500, e);
        }
    }
}

class ResourcesManager {
    async getAll(params) {
        if ('fields' in params){
            params.fields = params.fields.filter(e=>e!=null);
        }
        try {
            var selector = {};
            params.fields.forEach((f)=>{selector[f] = 1});
            //console.log("selector: ", selector);
            var resources;// = await resourcesModel.find({},selector).populate('metadata.logo');
            if ('metadata' in selector || 'metadata.logo' in selector || Object.keys(selector).length == 0){
                resources = await resourcesModel.find({},selector).populate('metadata.logo');
            }
            else{
                resources = await resourcesModel.find({},selector);
            }
            return new RestResponse("Gotten", 200, resources);
        } catch (e) {
            return new RestResponse("DBError", 500, e);
        }
    }

    async getOne(params) {
        
        var err = processParamsFields(params, [
            {name: "resourceID", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("ParameterSpecError", 500, err);
        }
        var selector = {};
        if ('fields' in params){
            params.fields = params.fields.filter(e=>e!=null);
            params.fields.forEach((f)=>{selector[f] = 1});
        }

        try {
            
            //console.log("selector: ", selector);
            var resource; // = await resourcesModel.findOne(resourceIDQuery(params.resourceID), selector).populate('metadata.logo');
            if ('metadata' in selector || 'metadata.logo' in selector || Object.keys(selector).length == 0){
                resource = await resourcesModel.findOne(resourceIDQuery(params.resourceID), selector).populate('metadata.logo');
            }
            else{
                resource = await resourcesModel.findOne(resourceIDQuery(params.resourceID), selector);
            }
            if (!resource){
                return new RestResponse("NotFoundError", 404, `resource "${params.resourceID}" does not exist`)
            }
            return new RestResponse("Gotten", 200, resource);
        } catch (e) {
            return new RestResponse("DBError", 500, e);
        }
    }

    async search(params, requestedBy){

        let selector = {};

        if ('fields' in params){
            params.fields = params.fields.filter(e=>e!=null);
            params.fields.forEach((f)=>{selector[f] = 1});
        }

        console.log("PARAMS.Q : ", params.q);
        let query = params.q ? resourcesModel.find({ $text : { $search: params.q } }) : resourcesModel.find();


        console.log("DEALING WITH TYPE FILTERS ....");
        if (params.type_filter){
            let types = params.type_filter.split('|').map(e=>e.trim()).filter(e=>e!='');
            for (let t of types){
                if (['ai_model', 'notebook', 'dataset', 'docker', 'executable', 'service', 'library'].indexOf(t) < 0){
                    return new RestResponse("WrongValueError", 500, `filter type "${t}" is not a valid type`);
                }
            }
            let filter = {
                $or : types.map(t=> {
                    return {'metadata.type' : t};
                })
            }

            query = query.find(filter);
        }

        console.log("DEALING WITH TAGS FILTERS ....");
        if (params.tags_filter){
            let tags = params.tags_filter.split('|').map(e=>e.trim()).filter(e=>e!='');

            let filter = {
                $or : tags.map(t=>{
                    if (t.split(':').length == 1){
                        try{
                            return {'metadata.tags.name' : new RegExp(t)};
                        }
                        catch(e){
                            return {'metadata.tags.name' : t};
                        }
                    }
                    else {
                        let seg = t.split(':'), tag_name = seg.shift(), tag_val = seg.join(':');
                        let $and = [];

                        try{
                            $and.push({'metadata.tags.name' : new RegExp(tag_name)});
                        }
                        catch(e){
                            $and.push({'metadata.tags.name' : tag_name});
                        }
                        try{
                            $and.push({'metadata.tags.value' : new RegExp(tag_val)});
                        }
                        catch(e){
                            $and.push({'metadata.tags.value' : tag_val});
                        }
                        // try{
                        //     return { $and : [{'metadata.tags.name' : new RegExp(tag_name)}, {'metadata.tags.value' : new RegExp(tag_val)}]};
                        // }catch(e){
                        //     return { $and : [{'metadata.tags.name' : tag_name}, {'metadata.tags.value' : tag_val}]};
                        // }
                        return {$and : $and};
                    }
                })
            }
            query = query.find(filter);
        }

        console.log("DEALING WITH DATE FILTERS ....");
        if(params.date_filter){
            let date = params.date_filter.trim();
            let test = date.startsWith('>=') || date.startsWith('>')? '$gt' : date.startsWith('<=') || date.startsWith('<')? '$lt' : '$eq', 
                date_point = new Date(date.replace(/^(\<|\>)?\=?/, '').trim());
            
            if (isNaN(date_point.valueOf())){
                return new RestResponse("WrongValueError", 500, `filter date "${date.replace(/^(\<|\>)?\=?/, '').trim()}" is not a valid date`);
            }

            let filter = {date: {}};
            filter.date[test] = date_point;
            
            console.log('DATE FILTER : ', filter);

            query = query.find(filter);
        }

        query = query.select(selector).populate('metadata.logo');
        try{
            let resources = await query;
            return new RestResponse("Gotten", 200, resources);
        }
        catch(e){
            return new RestResponse("DbError", 500, e);
        }
    }

    async create(params, requestedBy) {
        var err = processParamsFields(params, [
            {name: "name", required: true},
            {name: "type", required: true}
        ]);

        if (err instanceof Error){
            return new RestResponse("DBError", 500, err);
        }

        if (!requestedBy){
            return new RestResponse("AuthorzationDenied", 500, `an unidentified user cannot create a resource`);
        }

        if ( !settings.validation_schemes.resource_name.test(params.name)){
            return new RestResponse("FormatError", 500, `resource name invalid, it needs to match the following regex: ${settings.validation_schemes.resource_name.toString()}`);
        }

        if ('verson' in params){
            //
            if (!params.version){
                delete params.version;
            }
        }
        if ('introduction' in params){
            //
            if (!params.introduction){
                delete params.introduction;
            }
        }
        if ('description' in params){
            //
            if (!params.description){
                delete params.description;
            }
        }
        if ('documentation' in params){
            //
            if (!params.documentation){
                delete params.documentation;
            }
        }
        if ('logo' in params){
            //
            if (!params.logo){
                delete params.logo;
            }
            else{
                var ext = params.logo.originalFilename.split('.').pop();
                var logo = {
                    content_type: 'content-type' in params.logo.headers? params.logo.headers['content-type'] : ext.toLowerCase() == 'jpg'? 'image/jpg' : ext.toLowerCase('jpeg')? 'image/jpeg': 'image/png',
                    data: fs.readFileSync(params.logo.path)
                }
                try {
                    logo = await new photosModel(logo).save();                
                } catch (error) {
                    return new RestResponse("DbError", 500, e);
                }
                params.logo = logo._id.toString();
            }
        }
        if ('tags' in params){
            //
        }
        if ('private' in params){
            //
            params.private = typeof params.private === 'boolean' ? params.private : params.private === 'true'? true : false;
        }
        if ('licence' in params){
            //
            params.licence = params.licence ? params.licence : null;
        }
        if ('agreement' in params){
            //
            params.agreement = params.agreement ? params.agreement : null;
        }
        console.log("requestedBy: ", requestedBy);
        try {
            
            var r = new resourcesModel({ metadata: params, author: requestedBy._id.toString() });
            
            try{
                var newResource = await r.save();
                console.log("newResource : ", newResource);
                return new RestResponse("Created", 201, newResource);
            }
            catch(e){
                return new RestResponse("DbError", 500, e);
            }
        }
        catch(e){
            return new RestResponse("DbError", 500, e);
        }
    }

    async remove(params, requestedBy) {

        //console.log(`userManager removeing : `, params);
        var err = processParamsFields(params, [
            {name: "resourceID", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("ParameterSpecError", 500, err);
        }
        if (!requestedBy){
            return RestResponse("AuthorzationDenied", 500, `an unidentified user cannot remove a resource`);
        }
        // else if(requestedBy.status != "admin" && requestedBy.status != "super"){
        //     return RestResponse("AuthorzationDenied", 500, `only admins can create a licence`);
        // }
        try {
            var resource = await resourcesModel.findOne(resourceIDQuery(params.resourceID) );
            if (!resource){
                return new RestResponse("NotFoundError", 404, `user with id "${params.resourceID}" does not exist.`)
            }
        } catch (e) {
            return new RestResponse("DBError", 500, e);
        }

        if (params.delayed === true){

            resource.deleteAt = Date.now() + settings.api.operations_timing.resource_deletion_delay;
            try{
                await resource.save();
                return new RestResponse("Deleted", 200, `resource "${params.resourceID}" successfully up for deletion`, "the resource will be automatically deleted in x days");
            }catch(e){
                return new RestResponse("DBError", 500, e);
            }
        }
        else{
            try{
                await resource.remove();
                return new RestResponse("Deleted", 200, `user "${params.resourceID}" successfully deleted`);
            }catch(e){
                return new RestResponse("DBError", 500, e);
            }
        }
    }

    async updateMetadata(params, requestedBy) {
        var err = processParamsFields(params, [
            {name: "resourceID", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("DBError", 500, err);
        }
        if (!requestedBy){
            return RestResponse("AuthorzationDenied", 500, `an unidentified user cannot update a user account`);
        }
        // if ('username' in params){
        //     if (typeof params.username === 'undefined' || params.username == null){
        //         delete params.username;
        //     }
        // }
        if ('name' in params){
            if (typeof params.name === 'undefined' || params.name == null || params.name === ""){
                delete params.name;
            }
        }
        if ('version' in params){
            if (typeof params.version === 'undefined' || params.version == null || params.version === ""){
                delete params.version;
            }
        }
        if ('introduction' in params){
            if (typeof params.introduction === 'undefined' || params.introduction == null || params.introduction === ""){
                delete params.introduction;
            }
        }
        if ('description' in params){
            if (typeof params.description === 'undefined' || params.description == null || params.description === ""){
                delete params.description;
            }
        }
        if ('type' in params){
            if (typeof params.type === 'undefined' || params.type == null || params.type === ""){
                delete params.type;
            }
        }
        if ('tags' in params){
            if (typeof params.tags === 'undefined' || params.tags == null || params.tags === ""){
                delete params.tags;
            }
        }
        if ('private' in params){
            if (typeof params.private === 'undefined' || params.private == null || params.private === ""){
                delete params.private;
            }
        }

        
        
        const query = resourceIDQuery(params.resourceID); 
        var resource = await resourcesModel.findOne(query).populate('metadata.logo');
        
        //console.log("user.profile.photo : ", user.profile.photo);
        if ('name' in params){
            resource.metadata.name = params.name;
        }
        if ('version' in params){
            resource.metadata.version = params.version;
        }
        if ('introduction' in params){
            resource.metadata.introduction = params.introduction;
        }
        if ('description' in params){
            resource.metadata.description = params.description;
        }
        if ('type' in params){
            resource.metadata.type = params.type;
        }
        if ('tags' in params){
            resource.metadata.tags = params.tags;
        }
        if ('private' in params){
            resource.metadata.private = params.private;
        }
        

        if ('logo' in params && params.logo != null){
            if (params.logo instanceof Array) {
                params.logo = params.logo[0];
            }
            var originalName = params.logo.originalFilename, ext = params.logo.originalFilename.split('.').pop();
            if ( !(originalName.toLowerCase().endsWith('.jpg') || originalName.toLowerCase().endsWith('.jpeg') || originalName.toLowerCase().endsWith('.png'))){
                return new RestResponse("FormatError", 500, "a resource logo photo is expected to either be JPEG or a PNG image")
            }

            var logo = {
                content_type: 'content-type' in params.logo.headers? params.logo.headers['content-type'] : ext.toLowerCase() == 'jpg'? 'image/jpg' : ext.toLowerCase('jpeg')? 'image/jpeg': 'image/png',
                data: fs.readFileSync(params.logo.path)
            }

            console.log("resource.metadata.logo : ", resource.metadata.logo );
            
            // updating existing photo
            if (resource.metadata.logo != null){
                //console.log("updating photo");
                resource.metadata.logo.content_type = logo.content_type;
                resource.metadata.logo.data = logo.data;
            }
            // creating a new one
            else{
                //console.log("creating photo");
                resource.metadata.logo = new photosModel(logo);
            }
            try {
                resource.metadata.logo = await resource.metadata.logo.save();
            } catch (error) {
                return new RestResponse("DBError", 500, e)
            }
        }

        if ('documentations' in params && params.documentations){
            resource.metadata.documentations = params.documentations;
        }
        try{
            var updatedUResource = await resource.save();
            //console.log("updated user : ", updatedUser);
            return new RestResponse('Updated', 200, updatedUResource);
        }catch(e){
            return new RestResponse("DBError", 500, e)
        }
    }

    async getDocs(params, requestedBy, res){
        var err = processParamsFields(params, [
            {name: "resourceID", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("DBError", 500, err);
        }
        if (!requestedBy){
            return RestResponse("AuthorzationDenied", 500, `an unidentified user cannot update a user account`);
        }

        var resource = await resourcesModel.findOne(resourceIDQuery(params.resourceID));
        
        if (!resource){
            return new RestResponse("NotFoundError", 404, `resource "${params.resourceID}" does not exist`)
        }

        if (!resource.metadata.documentations){
            return new RestResponse("NotFoundError", 404, `resource "${params.resourceID}" does not have any documentation`)
        }

        if (resource.metadata.documentations.media_type === 'html' || resource.metadata.documentations.media_type === 'external_links'){
            res.json(resource.metadata.documentations);
        }
        else if (resource.metadata.documentations.media_type === 'pdf'){
            let rs = gfs.createReadStream({_id: resource.metadata.documentations.pdf.toString()}), file = [];
            rs.pipe(res);
            // try{
            //     resource.documentations.pdf = await new Promise((resolve, reject)=> {
            //         rs.on('data', (chunk)=>{file.push(chunk); });
            //         rs.on('error', (e)=>{ console.log(e); reject(e); });
            //         rs.on('end', ()=>{ resolve(Buffer.concat(file)) });
            //     });
            //     res.json(resource.metadata.documentations);
            // }
            // catch(e){
            //     res.status(500).json({ message: e});
            // }
            
        }

    }

    async updateDocs(params, requestedBy){
        var err = processParamsFields(params, [
            {name: "resourceID", required: true},
            {name: 'media_type', required: true}
        ]);

        if (err instanceof Error){
            return new RestResponse("DBError", 500, err);
        }
        if (!requestedBy){
            return RestResponse("AuthorzationDenied", 500, `an unidentified user cannot update a user account`);
        }

        var resource = await resourcesModel.findOne(resourceIDQuery(params.resourceID));
        
        if (!resource){
            return new RestResponse("NotFoundError", 404, `resource "${params.resourceID}" does not exist`)
        }

        if (params.media_type == 'html'){
            resource.metadata.documentations.media_type = params.media_type;
            resource.metadata.documentations.html = params.html;
        }
        else if(params.media_type == 'external_links'){
            //
            resource.metadata.documentations.media_type = params.media_type;
            resource.metadata.documentations.links = params.links;

        }
        else if (params.media_type == 'pdf'){
            console.log("REACHED HERE!!!");
            resource.metadata.documentations.media_type = params.media_type;
            resource.metadata.documentations.pdf = mongoose.Types.ObjectId().toString();

            let f = {_id: resource.metadata.documentations.pdf, filename: params.pdf.originalFilename, content_type: params.pdf.headers['content-type']};
            let writestream = gfs.createWriteStream(f);
            fs.createReadStream(params.pdf.path).pipe(writestream);

            console.log('PDF recording ....');
            await new Promise((resolve, reject)=>{
                writestream.on('close', ()=>{
                    fs.unlinkSync(params.pdf.path);
                    resolve();
                });
                writestream.on('error', (err)=>{
                    console.log("Stoooop : ", err);
                })
            });

            console.log('PDF recorded!!!');
            
        }
        try{
            await resource.save();
            return new RestResponse("Gotten", 200, resource);
        }
        catch(e){
            return new RestResponse("DbError", 500, e);
        }
    }

    async updateArchive(params, requestedBy){
        var err = processParamsFields(params, [
            {name: "resourceID", required: true},
            {name: "archive", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("DBError", 500, err);
        }
        if (!requestedBy){
            return RestResponse("AuthorzationDenied", 500, `an unidentified user cannot update a user account`);
        }
        // if ('username' in params){
        //     if (typeof params.username === 'undefined' || params.username == null){
        //         delete params.username;
        //     }
        // }

        var id = mongoose.Types.ObjectId().toString();
        
        var resource = await resourcesModel.findOne(resourceIDQuery(params.resourceID));
        
        if (!resource){
            return new RestResponse("NotFoundError", 404, `resource "${params.resourceID}" does not exist`)
        }

        try{
            console.log("archvie.headers:", params.archive.headers);

            let f = {_id: id, filename: params.archive.originalFilename, content_type: params.archive.headers['content-type']};

            console.log('f:', f);

            let writestream = gfs.createWriteStream(f);
            fs.createReadStream(params.archive.path).pipe(writestream);
            
            await new Promise((resolve, reject)=>{
                writestream.on('close', ()=>{
                    fs.unlinkSync(params.archive.path);
                    resolve();
                });
                writestream.on('error', (err)=>{
                    console.log("Stoooop : ", err);
                })
            });

            resource.archiveData = id;
            await resource.save();
            return new RestResponse("Gotten", 200, resource);
        }
        catch(e){
            console.log(e);
            return RestResponse("UnexpectedError")
        }
    }

    async getArchive(params, requestedBy, res){
        var err = processParamsFields(params, [
            {name: "resourceID", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("DBError", 500, err);
        }
        if (!requestedBy){
            return RestResponse("AuthorzationDenied", 500, `an unidentified user cannot update a user account`);
        }
        // if ('username' in params){
        //     if (typeof params.username === 'undefined' || params.username == null){
        //         delete params.username;
        //     }
        // }

        var resource = await resourcesModel.findOne(resourceIDQuery(params.resourceID));
        
        if (!resource){
            return new RestResponse("NotFoundError", 404, `resource "${params.resourceID}" does not exist`)
        }

        if (!resource.archiveData){
            return new RestResponse("NotFoundError", 404, `resource "${params.resourceID}" does not (yet) have any archive`)
        }

        console.log("resource.archiveData.toString()", resource.archiveData.toString());
        
        try{
            var archiveMeta = await FilesMeta.findOne({_id : resource.archiveData.toString()});
        }
        catch(e){
            return new RestResponse("DBError", 500, e);
        }

        //res.writeHead(200, {'Content-Type': archiveMeta.contentType });
        let rs = gfs.createReadStream({_id: resource.archiveData.toString()}); //.pipe(res);
        rs.pipe(res);

        // archiveMeta.buffer = gfs.createReadStream({_id: resource.archiveData.toString()}); //.pipe(res);
        
        // archiveMeta.buffer.on('end', ()=>{
        //     res.status(200).json(archiveMeta);
        // });
        
    }
}

class LicencesManager {

    async getAll(params){
        if ('fields' in params){
            params.fields = params.fields.filter(e=>e!=null);
        }
        try {
            var selector = {};
            params.fields.forEach((f)=>{selector[f] = 1});
            //console.log("selector: ", selector);
            var licences = await licencesModel.find({},selector);
            return new RestResponse("Gotten", 200, licences);
        } catch (e) {
            return new RestResponse("DBError", 500, e);
        }
    }

    async getOne(params){

        var err = processParamsFields(params, [
            {name: "licenceID", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("ParameterSpecError", 500, err);
        }
        var selector = {};
        if ('fields' in params){
            params.fields = params.fields.filter(e=>e!=null);
            params.fields.forEach((f)=>{selector[f] = 1});
        }

        try {
            
            //console.log("selector: ", selector);
            var licence = await licencesModel.findOne(licenceIDQuery(params.licenceID), selector);
            if (!licence){
                return new RestResponse("NotFoundError", 404, `licence "${params.licenceID}" does not exist`)
            }
            return new RestResponse("Gotten", 200, licence);
        } catch (e) {
            return new RestResponse("DBError", 500, e);
        }
    }
    
    async create(params, requestedBy) {
        //
        var err = processParamsFields(params, [
            {name: "name", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("ParameterSpecError", 500, err);
        }

        if (!requestedBy){
            return RestResponse("AuthorzationDenied", 500, `an unidentified user cannot create a licence`);
        }
        // else if(requestedBy.status != "admin" && requestedBy.status != "super"){
        //     return RestResponse("AuthorzationDenied", 500, `only admins can create a licence`);
        // }

        try{
            //
            params.author = requestedBy._id.toString();
            var l = new licencesModel(params);
            var l = await l.save();
            return new RestResponse("Created", 201, l);
        }
        catch(e){
            return new RestResponse("DBError", 500, e);
        }
    }

    async remove(params, requestedBy) {
        var err = processParamsFields(params, [
            {name: "licenceID", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("ParameterSpecError", 500, err);
        }
        if (!requestedBy){
            return RestResponse("AuthorzationDenied", 500, `an unidentified user cannot remove a licence`);
        }

        try {
            var licence = await licencesModel.findOne(licenceIDQuery(params.licenceID) );
            if (!licence){
                return new RestResponse("NotFoundError", 404, `licence with id "${params.licenceID}" does not exist.`)
            }
        } catch (e) {
            return new RestResponse("DBError", 500, e);
        }

        if (params.delayed === true){

            licence.deleteAt = Date.now() + settings.api.operations_timing.licence_deletion_delay;
            try{
                await licence.save();
                return new RestResponse("Deleted", 200, `licence "${params.licenceID}" successfully up for deletion`, "the account will be automatically deleted in x days");
            }catch(e){
                return new RestResponse("DBError", 500, e);
            }
        }
        else{
            try{
                await licence.remove();
                return new RestResponse("Deleted", 200, `licence "${params.licenceID}" successfully deleted`);
            }catch(e){
                return new RestResponse("DBError", 500, e);
            }
        }
    }

    async update(params){
        //
    }
}

class AgreementManager {

    async getAll(params){
        if ('fields' in params){
            params.fields = params.fields.filter(e=>e!=null);
        }
        try {
            var selector = {};
            params.fields.forEach((f)=>{selector[f] = 1});
            //console.log("selector: ", selector);
            var query = 'author' in params && params.author ? {$or:[{public:true},{author:params.author}]} : {public: true};
            var agreements = await agreementsModel.find(query,selector);
            return new RestResponse("Gotten", 200, agreements);
        } catch (e) {
            return new RestResponse("DBError", 500, e);
        }
    }

    async getOne(params){

        var err = processParamsFields(params, [
            {name: "agreementsID", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("ParameterSpecError", 500, err);
        }
        var selector = {};
        if ('fields' in params){
            params.fields = params.fields.filter(e=>e!=null);
            params.fields.forEach((f)=>{selector[f] = 1});
        }

        try {
            
            //console.log("selector: ", selector);
            var agreement = await agreementsModel.findOne(agreementIDQuery(params.agreementID), selector);
            if (!agreement){
                return new RestResponse("NotFoundError", 404, `agreement "${params.agreementID}" does not exist`)
            }
            return new RestResponse("Gotten", 200, agreement);
        } catch (e) {
            return new RestResponse("DBError", 500, e);
        }
    }
    
    async create(params, requestedBy) {
        //
        var err = processParamsFields(params, [
            {name: "name", required: true},
            {name: "content", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("ParameterSpecError", 500, err);
        }

        if (!requestedBy){
            return RestResponse("AuthorzationDenied", 500, `an unidentified user cannot create an agreement`);
        }
        // else if(requestedBy.status != "admin" && requestedBy.status != "super"){
        //     return RestResponse("AuthorzationDenied", 500, `only admins can create a licence`);
        // }

        try{
            //
            params.author = requestedBy._id.toString();
            var a = new agreementsModel(params);
            var a = await a.save();
            return new RestResponse("Created", 201, a);
        }
        catch(e){
            return new RestResponse("DBError", 500, e);
        }
    }

    async remove(params, requestedBy) {
        var err = processParamsFields(params, [
            {name: "agreementID", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("ParameterSpecError", 500, err);
        }
        if (!requestedBy){
            return RestResponse("AuthorzationDenied", 500, `an unidentified user cannot remove an agreement`);
        }

        try {
            var agreement = await agreementsModel.findOne(agreementIDQuery(params.agreementID) );
            if (!agreement){
                return new RestResponse("NotFoundError", 404, `agreement with id "${params.agreementID}" does not exist.`)
            }
        } catch (e) {
            return new RestResponse("DBError", 500, e);
        }

        if (params.delayed === true){

            agreement.deleteAt = Date.now() + settings.api.operations_timing.agreement_deletion_delay;
            try{
                await agreement.save();
                return new RestResponse("Deleted", 200, `agreement "${params.agreementID}" successfully up for deletion`, "the account will be automatically deleted in x days");
            }catch(e){
                return new RestResponse("DBError", 500, e);
            }
        }
        else{
            try{
                await agreement.remove();
                return new RestResponse("Deleted", 200, `agreement "${params.agreementID}" successfully deleted`);
            }catch(e){
                return new RestResponse("DBError", 500, e);
            }
        }
    }

    async update(params){
        //
    }
}

class RatingsManager {

    async getAll(params){
        if ('fields' in params){
            params.fields = params.fields.filter(e=>e!=null);
        }
        try {
            var selector = {};
            params.fields.forEach((f)=>{selector[f] = 1});
            //console.log("selector: ", selector);
            var query = {};
            if ('userID' in params && params.userID && 'resourceID' in params && params.resourceID){
                query = {$or: [{user: params.userID}, {resource: params.resourceID}] };
            }
            else if('userID' in params && params.userID){
                query = {user: params.userID}
            }
            else if('resourceID' in params && params.resourceID){
                query = {resource: params.resourceID};
            }

            var ratings = await ratingsModel.find(query, selector).populate(['user', 'resource']);
            return new RestResponse("Gotten", 200, ratings);
        } catch (e) {
            return new RestResponse("DBError", 500, e);
        }
    }

    async getOne(params){

        var err = processParamsFields(params, [
            {name: "ratingsID", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("ParameterSpecError", 500, err);
        }
        var selector = {};
        if ('fields' in params){
            params.fields = params.fields.filter(e=>e!=null);
            params.fields.forEach((f)=>{selector[f] = 1});
        }

        try {
            
            //console.log("selector: ", selector);
            var ratings = await ratingsModel.findOne(ratingsIDQuery(params.ratingsID), selector);
            if (!ratings){
                return new RestResponse("NotFoundError", 404, `ratings "${params.ratingsID}" does not exist`)
            }
            return new RestResponse("Gotten", 200, ratings);
        } catch (e) {
            return new RestResponse("DBError", 500, e);
        }
    }
    
    async create(params, requestedBy) {
        //
        var err = processParamsFields(params, [
            //{name: "userID", required: true},
            {name: "resource", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("ParameterSpecError", 500, err);
        }

        if (!requestedBy){
            return RestResponse("AuthorzationDenied", 500, `an unidentified user cannot create an agreement`);
        }
        // else if(requestedBy.status != "admin" && requestedBy.status != "super"){
        //     return RestResponse("AuthorzationDenied", 500, `only admins can create a licence`);
        // }

        try{
            //
            params.user = requestedBy._id.toString();
            //params.resource = requestedBy._id.toString();
            
            var r = new ratingsModel(params);
            var r = await r.save();
            return new RestResponse("Created", 201, r);
        }
        catch(e){
            return new RestResponse("DBError", 500, e);
        }
    }

    async remove(params, requestedBy) {
        var err = processParamsFields(params, [
            {name: "ratingsID", required: true},
        ]);

        if (err instanceof Error){
            return new RestResponse("ParameterSpecError", 500, err);
        }
        if (!requestedBy){
            return RestResponse("AuthorzationDenied", 500, `an unidentified user cannot remove an agreement`);
        }

        try {
            var ratings = await ratingsModel.findOne(ratingsIDQuery(params.ratingsID) );
            if (!ratings){
                return new RestResponse("NotFoundError", 404, `ratings with id "${params.ratings}" does not exist.`)
            }
        } catch (e) {
            return new RestResponse("DBError", 500, e);
        }

        if (params.delayed === true){

            ratings.deleteAt = Date.now() + settings.api.operations_timing.ratings_deletion_delay;
            try{
                await ratings.save();
                return new RestResponse("Deleted", 200, `ratings "${params.ratingsID}" successfully up for deletion`, "the account will be automatically deleted in x days");
            }catch(e){
                return new RestResponse("DBError", 500, e);
            }
        }
        else{
            try{
                await ratings.remove();
                return new RestResponse("Deleted", 200, `ratings "${params.ratingsID}" successfully deleted`);
            }catch(e){
                return new RestResponse("DBError", 500, e);
            }
        }
    }

    async update(params, requestedBy){
        //
        var err = processParamsFields(params, [
            {name: "ratingsID", required: true},
        ]);
        if (!requestedBy){
            return RestResponse("AuthorzationDenied", 500, `an unidentified user cannot remove an agreement`);
        }

        try {
            var ratings = await ratingsModel.findOne(ratingsIDQuery(params.ratingsID) );
            if (!ratings){
                return new RestResponse("NotFoundError", 404, `ratings with id "${params.ratings}" does not exist.`)
            }
        } catch (e) {
            return new RestResponse("DBError", 500, e);
        }

        if (params.note || params.comment){
            if (params.note){
                ratings.note = params.note;
            }
            if (params.comment){
                ratings.comment = params.comment;
            }
            ratings.last_edited = Date.now();
        }

        try{
            var r = await ratings.save();
            return new RestResponse("Updated", 200, r);
        }catch(e){
            return new RestResponse("DBError", 500, e);
        }
    }
}


exports .UsersManager = UsersManager;
exports .ResourcesManager = ResourcesManager;
exports .LicencesManager = LicencesManager;
exports .AgreementManager = AgreementManager;
exports .RatingsManager = RatingsManager;