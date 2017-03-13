FROM node:alpine
MAINTAINER Jeff YU, jeff@jamma.cn
RUN npm install jm-server -g && npm cache clean
ENV NODE_ENV production
RUN mkdir -p /app
WORKDIR /app
CMD npm run cluster