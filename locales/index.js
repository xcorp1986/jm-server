var i18next = require('i18next'),
    Backend = require('i18next-sync-fs-backend');

var config = {
    lng: 'zh',
    ns: [
        'jm'
    ],
    defaultNS: [
        'jm'
    ],
    fallbackLng: ['en'],
    fallbackNS: ['jm'],
    load: 'all',
    backend: {
        loadPath: __dirname + '/{{lng}}/{{ns}}.json',
        allowMultiLoading: true,
        crossDomain: false
    }
};

module.exports = function(opts, app){
    opts && opts.lng && (config.lng = opts.lng);
    return i18next
        .createInstance()
        .use(Backend)
        .init(config, function(err, t){
            require('./translate')(i18next);
        })
        ;
};
