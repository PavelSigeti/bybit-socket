import WebSocket from 'ws';

var last_event = Infinity
var token = ''
var ws = null
var _ontrades = () => {}
var _onquotes = () => {}
var _onready = () => {}
var _onrefine = () => {}
var reconnecting = false
var ready = false
var symbols = []
var terminated = false

function now() {
    return new Date().getTime();
}

async function init(syms) {

    if (ready) return;
    symbols = syms;
    start_hf(symbols);

    // setInterval(ping, 25000);
    // setTimeout(() => init(symbols), 20000);
}
const ping = () => {
    ws.send(JSON.stringify({"req_id": "jrp123", "op": "ping"}));
}

function start_hf() {
    var msg = syms => ({
        "op": "subscribe",
        "args": syms,
        "req_id": "jrp123"
    });

    ws = new WebSocket(`wss://stream.bybit.com/v5/public/spot`);
    ws.onmessage = function(e) {
        try {
            let data = JSON.parse(e.data);
            const inf = (data.data[0].s) ? 'publicTrade' : false;
            
            if (!inf) return print(data);
            switch (inf) {
                case 'publicTrade':
                    _ontrades({
                        symbol: data.data[0].s,
                        price: parseFloat(data.data[0].p),
                        size: parseFloat(data.data[0].v),
                    })
                    break
                case 'pong':
                    // console.log('pong', data)
                    break
            }
            last_event = now()
        } catch (e) {
            console.log(e.toString())
        }
    };
    ws.onopen = () => {
        try {
            const syms = symbols.map(x => 'publicTrade.' + x);
            const chunks = [];
            for (let i = 0; i < syms.length; i += 10) {
                chunks.push(syms.slice(i, i + 10));
            }
            chunks.forEach(el=>{
                console.log('SEND >>>', JSON.stringify(msg(el)));
                ws.send(JSON.stringify(msg(el)));
            });
        } catch(e) {
            console.log(e.toString())
        }
    };
    ws.onclose = function (e) {
        switch (e) {
            case 1000:
                console.log("WebSocket: closed");
            break;
        }
        reconnect();
    };
    ws.onerror = function (e) {
        console.log("WS", e);
        reconnect();
    };
}


// function reset(s) {
//     let remove = sym => ({
//         'method': 'UNSUBSCRIBE',
//         'channel': 'trades',
//         'market': sym.toLowerCase()+"@aggTrade"
//     });
//     try {
//         ws.send(JSON.stringify(remove(symbols[0])))
//         symbols = [];
//     } catch(e) {
//         console.log(e.toString())
//     }

//     try {
//         ws.send(JSON.stringify(msg(s)));
//         symbols = [s];
//         ws.close();
//         start_hf(symbols);
//     } catch(e) {
//         console.log(e.toString())
//     }
// }

function reconnect() {
    reconnecting = true
    console.log('Reconnecting...');
    try {
        ws.close()
        setTimeout(() => start_hf(symbols) , 1000)
    } catch(e) {
        console.log(e.toString())
    }
}

function print(data) {
    // TODO: refine the chart
    if (reconnecting) {
        _onrefine()
    } else if (!ready) {
        console.log('Stream [OK]')
        _onready()
        ready = true
        last_event = now()
        setTimeout(heartbeat, 10000);
    }
    reconnecting = false
}

function heartbeat() {
    if (terminated) return;
    if (now() - last_event > 30000) {
        console.log('No events for 30 seconds')
        if (!reconnecting) reconnect()
        setTimeout(heartbeat, 10000)
    } else {
        setTimeout(heartbeat, 3000)
    }
}

function terminate() {
    ws.close()
    console.log('Stream [Close]');
    terminated = true
}

export default {
    init,
    reconnect,
    terminate,
    // reset,
    set ontrades(val) {
        _ontrades = val
    },
    set onquotes(val) {
        _onquotes = val
    },
    set ready(val) {
        _onready = val
    },
    set refine(val) {
        _onrefine = val
    },

}
