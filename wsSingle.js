import wsx from './wsx.js';
import data from './data.json' assert { type: "json" };
import express from 'express';
import http from 'http';
import {WebSocketServer} from 'ws';
import limits from './limits.js';

const app = express();

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

const current = {};

clients = [];

const stream = wsx;
stream.init([...data.data]);

wss.on('connection', (ws) => {

    //connection is up, let's add a simple simple event
    ws.on('message', (message) => {

        //log the received message and send it back to the client
        console.log('received: %s', current);
        ws.send(`Hello, you sent -> ${JSON.stringify(current)}`);
    });

    

    //send immediatly a feedback to the incoming connection    
    ws.send(JSON.stringify(!!limits['APTUSDT']));
});
wss.broadcast = function(data) {
wss.clients.forEach(client => {
        stream.ontrades = (d) => {
            if(!current[d.symbol]) current[d.symbol] = 0;
            current[d.symbol]++;
            if(limits[d.symbol] < current[d.symbol]) {
                current[d.symbol] = 0;
                const data = JSON.stringify(d);
                console.log(limits[d.symbol]);
                client.send(data);
            } else if(!limits[d.symbol] && current[d.symbol] > 10) {
                current[d.symbol] = 0;
                const data = JSON.stringify(d);
                client.send(data);
            }
        };
    } );
};

server.listen(8000, () => {
    console.log(`Server started`);
});