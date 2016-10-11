var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('jm-ms');
    Promise = require('bluebird');
}

(function(){
    var ms = jm.ms;
    var logger = jm.logger;
    var utils = ms.utils;

    var log = function(err, doc){
        if (err) {
            logger.error(err.stack);
        }
        if(doc){
            logger.debug('%s', utils.formatJSON(doc));
        }
    };

    var done = function(resolve, reject, err, doc){
        log(err, doc);
        if (err) {
            reject(err, doc);
        } else {
            resolve(doc);
        }
    };


    var testws = function(opts){
        return new Promise(function(resolve, reject){
            logger.debug('test ws');

            ms.client({
                uri: 'ws://localhost:21000',
                reconnect: true
            }, function(err, doc){
                var client = doc;
                client.on('message', function(data){
                    logger.debug('client on message: %j', data);
                    var json = null;
                    try {
                        json = JSON.parse(data);
                    }
                    catch (err) {
                        logger.error(err.stack);
                        return;
                    }

                    if(json.type == 'message'){
                        client.emit(json.data.channel, json.data.msg);
                    }
                });

                client.on('notice', function(msg){
                    logger.debug('notice: %s', msg);
                });

                client.on('open', function(event) {
                    client.request(opts.request, function(err, doc){
                        log(err, doc);
                    });

                    client.post('/subscribe', {channel: 'notice'}, log);
                    client.post('/publish', {channel: 'notice', msg:'a msg'}, log);
                    client.post('/broadcast', {channel: 'notice', msg:'a broadcast'}, log);
                    client.post('/unsubscribe', {channel: 'notice'}, log);
                    client.post('/broadcast', {channel: 'notice', msg:'a broadcast'}, log);
                    client.post('/subscribe', {channel: 'notice'}, log);
                });
            });
            resolve(null);
        });
    };

    var testhttp = function(opts){
        return new Promise(function(resolve, reject){
            logger.debug('test http');

            ms.client({
                uri: 'http://localhost:21000'
            }, function(err, doc){
                doc.request(opts.request, function(err, doc){
                    log(err, doc);
                });
            });
            resolve(null);
        });
    };

    var opts = {
        request: {
            uri: '/',
            type: 'get'
        }
    };

    testws(opts)
        .then(function(doc){
            return testhttp(opts);
        })
        .catch(SyntaxError, function(e) {
            logger.error(e.stack);
        })
        .catch(function(e) {
            logger.error(e.stack);
        });

})();