const { saveLoanHistory, getLoanHistory } = require('../services/loanService');

async function saveLoan(req, res) {
  try {
    const { principal, interestRate, period, monthlyPayment, totalInterest } = req.body;

    const fields = { principal, interestRate, period, monthlyPayment, totalInterest };
    const missing = Object.entries(fields)
      .filter(([, v]) => v == null || v === '')
      .map(([k]) => k);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `누락된 필드: ${missing.join(', ')}`,
      });
    }

    const result = saveLoanHistory({
      principal:      Number(principal),
      interestRate:   Number(interestRate),
      period:         Number(period),
      monthlyPayment: Number(monthlyPayment),
      totalInterest:  Number(totalInterest),
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('loanController saveLoan error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getHistory(req, res) {
  try {
    const history = getLoanHistory();
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('loanController getHistory error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { saveLoan, getHistory };
