const cluster = require('cluster');
var jm = require('jm-ms-core');
var ms = jm.ms;

module.exports = function(service, opts) {
    var package = require('../../package.json');
    var help = function(opts, cb, next){
        var o = {
            name: package.name,
            version: package.version
        };
        if (cluster.isWorker) {
            o.clusterId = cluster.worker.id;
        }
        cb(null, o);
    };

    var router = ms();
    router.add('/', 'get', help);
    return router;
};
