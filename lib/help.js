var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('jm-ms-help');
    jm.server.on('afterLoadModules', function(router, opts){
        jm.ms.enableHelp(router);
    });
}
