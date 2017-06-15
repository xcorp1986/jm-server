'use strict';

var _jmMsCore = require('jm-ms-core');

var _jmMsCore2 = _interopRequireDefault(_jmMsCore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ms = new _jmMsCore2.default();

module.exports = function (app) {
    var router = ms.router();
    var modules = app.modules;
    router.add('/', 'get', function (opts, cb, next) {
        cb(null, app.moduleConfigs);
    });
    router.add('/:name', 'delete', function (opts, cb, next) {
        app.unuse(opts.params.name);
        cb(null, { ret: true });
    });
    app.router.use('/modules', router);
};