const cluster = require('cluster');
var jm = require('jm-ms-core');
var logger = jm.getLogger('message');

module.exports = function(service, opts) {
    opts = opts || {};
    var sdk = service.sdk;

    var broadcast = function(opts, cb){
        var channel = opts.data.channel;
        var msg = JSON.stringify({type:'message', data:opts.data});
        var wss = service.app.servers['ws'];
        for(var i in wss.sessions){
            var session = wss.sessions[i];
            session.emit(channel, msg);
        }
        if(cb) cb(null, {ret: true});
    };
    
    var model = {
        subscribe: function(opts, cb){
            if(!opts.session) return cb(null, null);
            var session = opts.session;
            logger.debug('subscribe, session id(sid): %s', session.id);
            var channel = opts.data.channel;
            if(channel){
                session.on(channel, function(msg){
                    session.send(msg);
                });
            }
            cb(null, {ret: true});
        },
        
        publish: function(opts, cb) {
            if(cluster.isWorker) {
                opts.type = 'message';
                process.send(opts);
                if(cb) cb(null, {ret: true});
            } else {
                broadcast(opts, cb);
            }
        }
    };
    jm.enableEvent(model);

    if(cluster.isWorker) {
        process.on('message', function (msg) {
            if(typeof msg === 'object') {
                if(msg.type == 'message') {
                    broadcast(msg);
                }
            }
        });
    }

    return model;
};
