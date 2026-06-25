const express = require('express');
const dotenv = require('dotenv');
const { KiteConnect } = require('kiteconnect');
const WebSocket = require('ws');

dotenv.config();

const app = express();

const kite = new KiteConnect({
  api_key: process.env.KITE_API_KEY,
});

app.use(express.json());

// Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Zerodha API Server Running',
  });
});

// Zerodha Login URL
app.get('/login-url', (req, res) => {
  try {
    const loginUrl = kite.getLoginURL();

    res.json({
      success: true,
      loginUrl,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Status API
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    marketOpen: true,
    serverTime: new Date(),
  });
});

app.get('/api/instruments', async (req, res) => {

  try {

    const instruments = await kite.getInstruments();

    const stocks = instruments

      .filter(

        (e) =>

          e.exchange === 'NSE' &&

          e.segment === 'NSE'

      )

      .map((e) => ({

        symbol: e.tradingsymbol,

        name: e.name,

        instrumentToken: e.instrument_token,

      }));

    res.json({

      success: true,

      count: stocks.length,

      data: stocks,

    });

  } catch (e) {

    res.status(500).json({

      success: false,

      error: e.message,

    });

  }

});

const PORT = process.env.PORT || 3000;

// Start HTTP Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// WebSocket Server
const wss = new WebSocket.Server({
  server,
});

console.log('WebSocket server started');

wss.on('connection', (ws) => {
  console.log('Client Connected');

  let subscribedSymbols = [];

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      console.log('Received:', data);

      if (data.action === 'SUBSCRIBE') {
        subscribedSymbols = data.symbols || [];

        ws.send(
          JSON.stringify({
            type: 'MARKET_STATUS',
            data: {
              open: true,
              message: 'Connected',
            },
          }),
        );
      }
    } catch (e) {
      console.log(e);
    }
  });

  const timer = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) return;

    const ticks = {};

    for (finalSymbol of subscribedSymbols) {
      ticks[finalSymbol] =
        Number((Math.random() * 1000 + 100).toFixed(2));
    }

    ws.send(
      JSON.stringify({
        type: 'TICK',
        data: ticks,
      }),
    );
  }, 1000);

  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(timer);
  });

  ws.on('error', (err) => {
    console.log(err);
    clearInterval(timer);
  });
});