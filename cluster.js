const cluster = require('cluster');

var numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    var eachWorker = function(cb) {
        for (var id in cluster.workers) {
            cb(cluster.workers[id]);
        }
    };

    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('fork', function (worker) {
        worker.on('message', function (msg) {
            eachWorker(function (doc) {
                doc.send(msg);
            });
        });
    });

    cluster.on('online', function (worker) {
    });

    cluster.on('listening', function (worker, address) {
    });

    cluster.on('disconnect', function (worker) {
    });

    cluster.on('exit', function (worker, code, signal) {
    });

} else if (cluster.isWorker) {
    process.on('message', function (msg) {
    });

    setTimeout(function () {
        process.send({obj: true});
    }, 3000);

    require('./app');

}
