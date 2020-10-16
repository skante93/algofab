const jwt = require('jwt-simple');
const {settings, db, utils } = require('../config');

const usersManager = new db.UsersManager();
var authorizations = {
    api_token : async (req, res, next)=>{
        //console.log('## API TOKEN ', req.headers);
        //res.status(405).json({body: "Not yet implemented!!"})
        if ( !('x-api-key' in req.headers) ){
            return res.status(400).json({
                type:"error", 
                code: "AuthorizationDenied", 
                message:'You need to specify an apikey (header X-API-KEY)'
            });
        }
        try {
            console.log("API KEY : ", req.headers['x-api-key']);
            var key = utils.others.decodeJWT(req.headers['x-api-key']);
            try {
                
                var user = await usersManager.getOne({userID: key.iss});
                
                if (user.isError()){
                    return user.reply(req, res);    
                }
                if (user.freeze === true){
                    return res.status(500).json({type:"error", code: "AuthorizationDenied", messgae: 'your account has been frozen, contact and administrator to get back to normal.'})
                }
                res.locals.user = user.response;
            } catch (e) {
                console.log(e);
                return res.status(500).json({type:"error", code: "ApiKeyParsingError", messgae: 'could not parse the apikey, was it the right value?'}); 
            }
            
        } catch (e) {
            console.log(e);
            return res.status(500).json({type:"error", code: "ApiKeyParsingError", messgae: 'could not parse the apikey, was it the right value?'});    
        }

        next();
    }
}

exports.authorizations = authorizations;