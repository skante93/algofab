

const {settings, db} = require('../config');
const {daemon_cycles} = settings.settings.api.operations_timing;
const usersModel = db.mongo.model('Users'), usersManager = new db.UsersManager();

const remove_outdated_interval = 'remove_outdated' in daemon_cycles? daemon_cycles.remove_outdated : daemon_cycles.all;

var removeOutdatedObject = (objectKind)=>{
    if (['users'].indexOf(objectKind) < 0){
        throw new Error(`Cannot remove "${objectKind}" of outdated objects`);
    }
    let model, manager;
    if (objectKind == "users"){
        model = usersModel;
        manager = usersManager;
    }

    return async()=>{
        try {
            var objs = await model.find({deleteAt : {$ne : null} });
            objs.forEach(async (obj)=>{
                if(Date.now() >= obj.deleteAt.getTime()){
                    try {
                        await manager.remove({userID: obj._id.toString(), delayed: false }) ; 
                        //console.log("Deamon done removing outdated ", objectKind," ...");             
                    } catch (e) {
                        console.log(`Daemon error from ${objectKind}.remove() : `, e);
                    }
                }
            });
        } catch (e) {
            console.log("Daemon error from db: ", e);
        }
    }
}

console.log("### remove_outdated_interval : ", remove_outdated_interval);

removeOutdatedObject('users')();
setInterval(removeOutdatedObject('users'), remove_outdated_interval);