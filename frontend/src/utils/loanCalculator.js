/**
 * 원리금 균등 상환 방식 계산
 */
export function calculateLoan(principal, annualRate, years) {
  const p = Number(principal);
  const r = Number(annualRate) / 100 / 12;
  const n = Number(years) * 12;

  let monthlyPayment;
  if (r === 0) {
    monthlyPayment = Math.round(p / n);
  } else {
    monthlyPayment = Math.round(
      (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    );
  }

  return {
    monthlyPayment,
    totalAmount:   Math.round(monthlyPayment * n),
    totalInterest: Math.round(monthlyPayment * n - p),
  };
}

/**
 * 월별 상환 일정 생성 (연도 구분자 포함)
 */
export function generateSchedule(principal, annualRate, years) {
  const p = Number(principal);
  const r = Number(annualRate) / 100 / 12;
  const n = Number(years) * 12;
  const { monthlyPayment } = calculateLoan(p, annualRate, years);

  const items = [];
  let balance = p;
  let prevYear = 0;

  for (let i = 1; i <= n; i++) {
    const interest    = r === 0 ? 0 : Math.round(balance * r);
    const principalPmt = monthlyPayment - interest;
    balance = Math.max(0, Math.round(balance - principalPmt));

    const year = Math.ceil(i / 12);

    if (year !== prevYear) {
      items.push({ type: 'yearHeader', year, id: `y${year}` });
      prevYear = year;
    }

    items.push({
      type:        'month',
      id:          `m${i}`,
      month:       i,
      year,
      monthInYear: (i - 1) % 12 + 1,
      payment:     monthlyPayment,
      principal:   principalPmt,
      interest,
      balance,
      repaidPct:   ((p - balance) / p) * 100,
    });
  }

  return items;
}

/** 천 단위 콤마 */
export function formatNumber(n) {
  if (n == null || isNaN(n)) return '0';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** ₩ 원화 포맷 */
export function formatKRW(n) {
  return `₩${formatNumber(n)}`;
}

/**
 * 원 → 억/만원 표시
 * 100,000,000 → 1억원
 * 150,000,000 → 1억 5,000만원
 * 50,000,000  → 5,000만원
 */
export function formatManWon(won) {
  if (!won || won === 0) return '';
  const man = Math.round(won / 10000);
  if (man === 0) return `${formatNumber(won)}원`;
  if (man < 10000) return `${formatNumber(man)}만원`;
  const eok = Math.floor(man / 10000);
  const rem  = man % 10000;
  return rem === 0 ? `${eok}억원` : `${eok}억 ${formatNumber(rem)}만원`;
}

/** KRW → 외화 변환 */
export function convertCurrency(krwAmount, rate) {
  if (!rate || rate === 0) return 0;
  return krwAmount * rate;
}
