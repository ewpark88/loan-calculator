const { Router } = require('express');
const { getExchangeRate } = require('../controllers/exchangeController');

const router = Router();
router.get('/exchange-rate', getExchangeRate);

module.exports = router;
