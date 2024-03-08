import wsx from './wsx.js';
import data from './data.json' assert { type: "json" };
import express from 'express';

const app = express();

const current = {};

const stream = wsx;
stream.init([...data.data]);
stream.ontrades = (d) => {
    console.log(d);
    current[d.symbol] = d.price;
};

app.get('/wsx', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(current);
});

app.listen(8000, function(req, res) {
    console.log("Server is running at port http://localhost:8000/wsx");
});