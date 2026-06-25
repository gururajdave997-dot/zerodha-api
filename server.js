const express = require('express');
const dotenv = require('dotenv');
const { KiteConnect } = require('kiteconnect');

dotenv.config();

const app = express();

const kite = new KiteConnect({
  api_key: process.env.KITE_API_KEY,
});

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Zerodha API Server Running',
  });
});

// Get Zerodha login URL
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});