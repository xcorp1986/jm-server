var jm = require('jm-ms-help');
jm.server.on('afterLoadModules', function (router, app) {
    var modules = app.modules;
    router.add('/', 'get', function (opts, cb, next) {
        opts.help || (opts.help = {});
        var _modules = {};
        var status = 1;
        for (var key in modules) {
            var module = modules[key];
            _modules[key] = 1;
            if (module.ready === undefined) continue;
            if (!module.ready) {
                _modules[key] = 0;
                status = 0;
            }
        }
        opts.help.status = status;
        opts.help.modules = _modules;
        next();
    });

    jm.ms.enableHelp(router, require('../package.json'));
});
