const { getExchangeRates } = require('../services/exchangeService');

async function getExchangeRate(req, res) {
  try {
    const data = await getExchangeRates();
    res.json({ success: true, data });
  } catch (error) {
    console.error('exchangeController error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getExchangeRate };
