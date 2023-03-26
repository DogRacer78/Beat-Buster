FROM node:18

# working dir
WORKDIR /usr/src/beat_buster

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "node", "index.js" ]