

exports.put = [
    (req, res, next) => { console.log("Handler [STEP 1] "); next(); }, 
    (req, res, next)=> { 
        console.log("Handler [STEP 2], params : ", res.locals.params); 
        res.json({body : "cool"}); 
    }
]

exports.auth = [
    (req, res, next) => { console.log("Authentication [STEP 1] .... "); next(); }, 
    (req, res, next) => { console.log("Authentication [STEP 2] .... "); next(); }
]