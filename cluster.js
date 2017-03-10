const cluster = require('cluster');
if (cluster.isMaster) {
    var numCPUs = require('os').cpus().length;
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    var eachWorker = function(cb) {
        for (var id in cluster.workers) {
            cb(cluster.workers[id]);
        }
    };

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
    require('./app');
}
