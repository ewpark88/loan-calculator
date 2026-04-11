const { Router } = require('express');
const { saveLoan, getHistory } = require('../controllers/loanController');

const router = Router();
router.post('/loan-history', saveLoan);
router.get('/loan-history', getHistory);

module.exports = router;
