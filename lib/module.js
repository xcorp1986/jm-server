var jm = require('jm-ms');
module.exports = function(app) {
    var router = jm.ms();
    var modules = app.modules;
    router.add('/', 'get', function (opts, cb, next) {
        cb(null, app.moduleConfigs);
    });
    router.add('/:name', 'delete', function (opts, cb, next) {
        app.unuse(opts.params.name);
        cb(null, {ret: true})
    });
    app.root.use('/modules', router);
};
