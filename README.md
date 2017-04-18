# jm-server

a general server using jm-ms

## using

npm install -g jm-server

jm-server -h
or
jms -h

## config

debug  [false] 是否debug模式

port   [21000] 监听端口

host   ['0.0.0.0'] 监听IP地址

prefix [''] Uri前缀

trustProxy [false] 是否传递IP地址

lng [''] 语言

## config/index.js

```javascript
var config = {
    development: {
        //....
        modules: {   //模块
            '': //key， 模块唯一标识
            {
                module: 'jm-ms-message', 模块名或者模块路径， 必须要能够require到
                prefix: uri prefix 默认为key
                config: {}  //可选, 模块配置, 默认采用全局配置
            },
            oms: {
                proxy: 'http://localhost:20170/oms' //proxy指令, 把对于模块的请求转发到指定URI
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
```
