FROM node:alpine
MAINTAINER Jeff YU, jeff@jamma.cn
ENV NODE_ENV production
RUN mkdir -p /app
WORKDIR /app
COPY . .
RUN npm install --production && npm cache clean
CMD npm run cluster