
const settings = require('../../settings');
const jwt = require('jwt-simple');

const mongoModels = require('../models'), 
    tokensModel = mongoModels.model('Tokens'), usersModel = mongoModels.model('Users');


class TokensManager {
    
    constructor(){
        this.secret = "JWT-SIMPLE ALGOFAB SECRET";
    }

    create(iss) {
        
        return new Promise((resolve, reject)=>{
            var tkn = jwt.encode({
                iss: iss
            }, this.secret);

            new tokensModel({jwt: tkn}).save((err, savedTkn)=>{
                err ? reject(err) : resolve(savedTkn);
            });
        });
    }

    apiKey(apk) {
        
        
        return new Promise ((resolve, reject)=>{
            try {
                var obj = jwt.decode(apk, this.secret);
            }
            catch(e){
                return reject("ParseError: not a valid token, jwt module says: "+e);
            }
            
            usersModel.findById(obj.iss, (err, u)=>{
                err ? reject(err) : resolve(u);
            });
        });
    }

}

module.exports = TokensManager;