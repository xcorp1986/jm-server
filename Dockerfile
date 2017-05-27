FROM node:6-alpine
MAINTAINER Jeff YU, jeff@jamma.cn
ENV NODE_ENV production
RUN mkdir -p /app
WORKDIR /app
CMD npm run cluster
RUN npm install jm-server@0.1.7 -g &&  npm cache clean