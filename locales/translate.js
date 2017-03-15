var jm = require('jm-core');

var translate_ERR = function (lan, ns, o, key) {
    if(o.err !== undefined) {
        var _key = key;
        if(ns && ns != '') _key = ns + ':' + key;
        var v = lan.t(_key);
        if(v == key) return;
        return o.msg = v;
    }

    key || (key='');
    for(var i in o) {
        var _key = i;
        if(key && key!='') _key = key + '.' + i;
        translate_ERR(lan, ns, o[i], _key);
    }

};

module.exports = function(lan) {
    var ERR = jm.ERR;
    translate_ERR(lan, '', ERR, 'ERR');
};