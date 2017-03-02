FROM node:alpine
MAINTAINER Jeff YU, jeff@jamma.cn
ENV NODE_ENV production
RUN mkdir -p /user/app
WORKDIR /user/app
COPY package.json .
RUN npm install --production && npm cache clean
COPY . .
CMD npm run cluster