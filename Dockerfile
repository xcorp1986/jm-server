FROM node:8-alpine
MAINTAINER Jeff YU, jeff@jamma.cn
ENV NODE_ENV production
RUN mkdir -p /app
WORKDIR /app
CMD npm run cluster