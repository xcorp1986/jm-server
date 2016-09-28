var jm = require('jm-core');

module.exports = function (opts) {
    opts = opts || {};
    var o = {};
    jm.enableEvent(o);
    if(opts.mq) o.mq = require('jm-mq')({url: opts.mq});
    o.message = require('./message')(o, opts);
    return o;
};

