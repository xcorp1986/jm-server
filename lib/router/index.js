var jm = require('jm-ms-core');
var ms = jm.ms;

module.exports = function(service, opts) {
    var router = ms();

    router.use(require('./help')(service));
    router.use(require('./message')(service));

    return router;
};
