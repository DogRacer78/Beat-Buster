FROM node:18-alpine AS BUILD_IMAGE

# working dir
WORKDIR /usr/src/beat_buster

COPY package*.json ./

RUN npm install

COPY . .

FROM node:18-alpine

WORKDIR /usr/src/beat_buster

COPY --from=BUILD_IMAGE /usr/src/beat_buster/*.js .
COPY --from=BUILD_IMAGE /usr/src/beat_buster/*.json .
COPY --from=BUILD_IMAGE /usr/src/beat_buster/node_modules ./node_modules

CMD [ "node", "index.js" ]