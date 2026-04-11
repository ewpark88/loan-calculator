/**
 * 원리금 균등 상환 방식 계산
 */
export function calculateLoan(principal, annualRate, years) {
  const p = Number(principal);
  const r = Number(annualRate) / 100 / 12; // 월 이자율
  const n = Number(years) * 12;            // 총 개월 수

  let monthlyPayment;
  if (r === 0) {
    monthlyPayment = Math.round(p / n);
  } else {
    monthlyPayment = Math.round(
      (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    );
  }

  const totalAmount = monthlyPayment * n;
  const totalInterest = totalAmount - p;

  return {
    monthlyPayment,
    totalAmount:   Math.round(totalAmount),
    totalInterest: Math.round(totalInterest),
  };
}

/** 숫자를 천 단위 콤마 포맷으로 */
export function formatNumber(n) {
  if (n == null || isNaN(n)) return '0';
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 원화 포맷 */
export function formatKRW(n) {
  return `₩${formatNumber(n)}`;
}

/** KRW → 외화 변환 */
export function convertCurrency(krwAmount, rate) {
  if (!rate || rate === 0) return 0;
  return krwAmount * rate;
}
