const { SwaggerRouter, ServerConfig } = require('./swagger-server');

var swaggerDocs = require('./docs.json');


var paths = {
    '/users': require('./routes/users').router,
    '/resources': require('./routes/resources').router,
    '/licences': require('./routes/licences').router,
    '/agreements': require('./routes/agreements').router,
}

var config = new ServerConfig({
    CORS: {}
})

var router = new SwaggerRouter(paths, swaggerDocs, config);
var app = router.swagger();

app.listen(3000, ()=> { console.log("Listening ..."); } );

//console.log(JSON.stringify(router.paths, null, 2));

require('./routes/daemon');