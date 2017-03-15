jm-server
=========

a general server using jm-ms

npm install -g jm-server

jm-server -h
or
jms -h

#config file
var config = {
    development: {
        debug: true,
        host: 端口号,
        port: 21000,
        prefix: uri prefix,
        trustProxy: ip地址传递,
        lng: 语言，默认zh
        modules: {   //模块
            '': //key， 模块唯一标识
            {
                module: 'jm-ms-message', 模块名或者模块路径， 必须要能够require到
                prefix: uri prefix 默认为key
                config: {}  //可选, 模块配置, 默认采用全局配置
            },
            config: {
                module: 'jm-config'
            }
        }
    },
    production: {
        port: 21000
    }
};
