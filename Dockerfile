# npm install --registry=https://registry.npm.taobao.org
# docker build -t jm-server:latest .
FROM dashersw/node-pm2:alpine
MAINTAINER Jeff YU, 2651339@qq.com
ADD . /app
ENV APP app.json