'use strict';

var _jmMsHelp = require('jm-ms-help');

var _jmMsHelp2 = _interopRequireDefault(_jmMsHelp);

var _jmMsCore = require('jm-ms-core');

var _jmMsCore2 = _interopRequireDefault(_jmMsCore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ms = new _jmMsCore2.default();

module.exports = function (app) {
  var router = ms.router();
  var modules = app.modules;
  router.add('/', 'get', function (opts, cb, next) {
    opts.help || (opts.help = {});
    var _modules = {};
    var status = 1;
    for (var key in modules) {
      var _module = modules[key];
      _modules[key] = 1;
      if (!_module || _module.ready === undefined) continue;
      if (!_module.ready) {
        _modules[key] = 0;
        status = 0;
      }
    }
    opts.help.status = status;
    opts.help.modules = _modules;
    next();
  });
  _jmMsHelp2.default.enableHelp(router, require('../package.json'));
  app.router.use(router);
};