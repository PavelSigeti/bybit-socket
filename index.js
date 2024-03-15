import wsx from './wsx.js';
import data from './data.json' assert { type: "json" };
import express from 'express';
import http from 'http';
import {Server} from 'socket.io';
import limits from './limits.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
    },
    path: '/socket-bybit'
  });

const current = {};


const stream = wsx;
stream.init([...data.data]);

io.on("connection", (socket) => {

    stream.ontrades = (d) => {
        if(!current[d.symbol]) current[d.symbol] = 0;
        current[d.symbol]++;
        if(limits[d.symbol] < current[d.symbol]) {
            current[d.symbol] = 0;
            const data = JSON.stringify(d);
            io.emit('data', data);
        } else if(!limits[d.symbol] && current[d.symbol] > 15) {
            current[d.symbol] = 0;
            const data = JSON.stringify(d);
            io.emit('data', data);
        }
    };
});


server.listen(8100);