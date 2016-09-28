module.exports = function(opts){
    opts = opts || {};
    var o = require('./service')(opts);
    o.router = function(opts) {
        return require('./router')(o, opts);
    };
    return o;
};
