const { getDatabase } = require('../db/database');

/**
 * 원리금 균등 상환 방식 계산
 * @param {number} principal  - 대출 원금 (원)
 * @param {number} annualRate - 연 이자율 (%)
 * @param {number} years      - 대출 기간 (년)
 */
function calculateLoan(principal, annualRate, years) {
  const r = annualRate / 100 / 12; // 월 이자율
  const n = years * 12;            // 총 상환 개월 수

  let monthlyPayment;
  if (r === 0) {
    monthlyPayment = Math.round(principal / n);
  } else {
    monthlyPayment = Math.round(
      (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    );
  }

  const totalAmount = monthlyPayment * n;
  const totalInterest = totalAmount - principal;

  return {
    monthlyPayment,
    totalAmount: Math.round(totalAmount),
    totalInterest: Math.round(totalInterest),
  };
}

function saveLoanHistory({ principal, interestRate, period, monthlyPayment, totalInterest }) {
  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT INTO loan_history (principal, interest_rate, period, monthly_payment, total_interest)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(principal, interestRate, period, monthlyPayment, totalInterest);

  return {
    id: result.lastInsertRowid,
    principal,
    interestRate,
    period,
    monthlyPayment,
    totalInterest,
    totalAmount: monthlyPayment * period * 12,
  };
}

function getLoanHistory() {
  const db = getDatabase();

  return db.prepare(`
    SELECT
      id,
      principal,
      interest_rate   AS interestRate,
      period,
      monthly_payment AS monthlyPayment,
      total_interest  AS totalInterest,
      (monthly_payment * period * 12) AS totalAmount,
      created_at      AS createdAt
    FROM loan_history
    ORDER BY created_at DESC
    LIMIT 50
  `).all();
}

module.exports = { calculateLoan, saveLoanHistory, getLoanHistory };
