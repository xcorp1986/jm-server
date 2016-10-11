var jm = require('jm-ms-core');
var ms = jm.ms;

module.exports = function(service, opts) {
    var message = service.message;
    var router = ms();
    router.add('/subscribe', 'post', function(opts, cb, next){message.subscribe(opts, cb);});
    router.add('/unsubscribe', 'post', function(opts, cb, next){message.unsubscribe(opts, cb);});
    router.add('/publish', 'post', function(opts, cb, next){message.publish(opts, cb);});
    router.add('/broadcast', 'post', function(opts, cb, next){message.broadcast(opts, cb);});
    return router;
};
