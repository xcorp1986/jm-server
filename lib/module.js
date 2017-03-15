var jm = require('jm-ms');
jm.server.on('afterLoadModules', function(router, app){
    var r = jm.ms();
    var modules = app.modules;
    r.add('/', 'get', function (opts, cb, next) {
        cb(null, {ret: Object.keys(modules)})
    });
    r.add('/:name', 'delete', function (opts, cb, next) {
        app.unloadModule(opts.params.name);
        cb(null, {ret: true})
    });
    router.use('/modules', r);
});
