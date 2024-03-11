FROM node:18.12

WORKDIR /socket-bybit

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8100

CMD [ "node", "index.js"]
