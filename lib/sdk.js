var jm = require('jm-playsdk');
var logger = jm.getLogger('sdk');
module.exports = function(opts, app){
    var config = opts;
    var sdk = jm.sdk;
    sdk.init({uri: config.sdk});
    function signon() {
        sdk.sso.signon(config.user, function(err, doc){
            if(err){
                logger.error(err.stack);
                logger.error('sdk signon fail. %j', doc);
            }else{
                logger.debug('sdk sigon success. %j', doc);
                if(sdk.user && sdk.user.token) sdk.sso.signout({token: sdk.user.token});
                sdk.user = doc;
                sdk.emit('signon', doc);
                setTimeout(signon, 20 * 3600 * 1000);
            }
        });
    }
    if(config.user){
        signon();
    }
    return sdk;
};
