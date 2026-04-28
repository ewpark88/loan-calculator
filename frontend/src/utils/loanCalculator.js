/* ─────────────────────────────────────────────────
 *  대출 계산 유틸리티
 *  지원 방식: 원리금균등 / 원금균등 / 만기일시 / 체증식
 * ───────────────────────────────────────────────── */

/* ══════════════════════════════════════
 *  내부 계산 함수
 * ══════════════════════════════════════ */

/** 원리금 균등 분할 상환 (거치기간 포함) */
function calcAnnuity(p, r, n, g) {
  const m = n - g; // 실상환 개월수
  const gracePayment = g > 0 && r > 0 ? Math.round(p * r) : 0;

  let monthlyPayment;
  if (r === 0) {
    monthlyPayment = m > 0 ? Math.round(p / m) : 0;
  } else {
    monthlyPayment = Math.round(
      (p * r * Math.pow(1 + r, m)) / (Math.pow(1 + r, m) - 1)
    );
  }

  const totalGrace = gracePayment * g;
  const totalRepay = monthlyPayment * m;

  return {
    loanType: 'annuity',
    monthlyPayment,   // 상환기간 중 월 납부액 (고정)
    gracePayment,     // 거치기간 중 월 납부액 (이자만)
    totalAmount: totalGrace + totalRepay,
    totalInterest: totalGrace + totalRepay - p,
  };
}

/** 원금 균등 분할 상환 (거치기간 포함) */
function calcEqualPrincipal(p, r, n, g) {
  const m = n - g;
  if (m <= 0) return calcAnnuity(p, r, n, 0);
  const gracePayment = g > 0 && r > 0 ? Math.round(p * r) : 0;
  const monthlyPrincipal = Math.round(p / m);

  const firstPayment = Math.round(monthlyPrincipal + p * r);
  const lastPayment  = Math.round(monthlyPrincipal + monthlyPrincipal * r);

  let totalRepayInterest = 0;
  for (let i = 0; i < m; i++) {
    totalRepayInterest += (p - i * monthlyPrincipal) * r;
  }
  totalRepayInterest = Math.round(totalRepayInterest);

  const totalGrace = gracePayment * g;

  return {
    loanType: 'equalPrincipal',
    monthlyPayment: firstPayment, // 첫달 최대 납부액 (요약용)
    firstPayment,
    lastPayment,
    monthlyPrincipal,
    gracePayment,
    totalAmount: p + totalGrace + totalRepayInterest,
    totalInterest: totalGrace + totalRepayInterest,
  };
}

/** 만기 일시 상환 */
function calcBullet(p, r, n) {
  const monthlyInterest = r > 0 ? Math.round(p * r) : 0;
  const totalInterest   = monthlyInterest * n;

  return {
    loanType: 'bullet',
    monthlyPayment: monthlyInterest, // 월 이자 납부액
    gracePayment: 0,
    maturityPayment: p + monthlyInterest, // 만기 납부액 (원금 + 마지막 이자)
    totalAmount: p + totalInterest,
    totalInterest,
  };
}

/**
 * 체증식 분할 상환 (연 3% 증가, 거치기간 포함)
 * 이진탐색으로 초기 납부액 P0 산출
 */
function calcGraduated(p, r, n, g) {
  const m = n - g;
  const gracePayment   = g > 0 && r > 0 ? Math.round(p * r) : 0;
  const annualIncrease = 0.03;

  let lo = 0, hi = p, P0 = 0;

  for (let iter = 0; iter < 150; iter++) {
    P0 = (lo + hi) / 2;
    let balance = p;

    for (let month = 1; month <= m; month++) {
      const yearIdx = Math.ceil(month / 12) - 1;
      const pmt      = P0 * Math.pow(1 + annualIncrease, yearIdx);
      balance       -= pmt - balance * r;
    }

    if (Math.abs(balance) < 1) break;
    if (balance > 0) lo = P0;
    else             hi = P0;
  }
  P0 = Math.round(P0);

  let totalRepay = 0;
  const totalYears = Math.ceil(m / 12);
  for (let month = 1; month <= m; month++) {
    const yearIdx = Math.ceil(month / 12) - 1;
    totalRepay += Math.round(P0 * Math.pow(1 + annualIncrease, yearIdx));
  }

  const lastYearPayment = Math.round(P0 * Math.pow(1 + annualIncrease, totalYears - 1));
  const totalGrace      = gracePayment * g;

  return {
    loanType: 'graduated',
    monthlyPayment: P0, // 첫달 납부액 (요약용)
    firstPayment:   P0,
    lastYearPayment,
    annualIncrease,
    gracePayment,
    totalAmount:   totalGrace + totalRepay,
    totalInterest: totalGrace + totalRepay - p,
  };
}

/* ══════════════════════════════════════
 *  내부 스케줄 생성 함수
 * ══════════════════════════════════════ */

function pushYearHeader(items, year, prevYear) {
  if (year !== prevYear) {
    items.push({ type: 'yearHeader', year, id: `y${year}` });
  }
  return year;
}

function scheduleAnnuity(p, r, n, g) {
  const m = n - g;
  const gracePayment = g > 0 && r > 0 ? Math.round(p * r) : 0;
  let monthlyPayment;
  if (r === 0) {
    monthlyPayment = m > 0 ? Math.round(p / m) : 0;
  } else {
    monthlyPayment = Math.round(
      (p * r * Math.pow(1 + r, m)) / (Math.pow(1 + r, m) - 1)
    );
  }

  const items = [];
  let balance  = p;
  let prevYear = 0;

  for (let i = 1; i <= n; i++) {
    const year    = Math.ceil(i / 12);
    prevYear      = pushYearHeader(items, year, prevYear);
    const isGrace = i <= g;
    const interest = r > 0 ? Math.round(balance * r) : 0;
    let payment, principalPmt;

    if (isGrace) {
      payment      = gracePayment;
      principalPmt = 0;
    } else {
      payment      = monthlyPayment;
      principalPmt = Math.max(0, payment - interest);
      balance      = Math.max(0, Math.round(balance - principalPmt));
    }

    items.push({
      type: 'month', id: `m${i}`,
      month: i, year, monthInYear: (i - 1) % 12 + 1,
      payment, principal: principalPmt, interest, balance,
      repaidPct: ((p - balance) / p) * 100,
      isGrace,
    });
  }
  return items;
}

function scheduleEqualPrincipal(p, r, n, g) {
  const m = n - g;
  if (m <= 0) return scheduleAnnuity(p, r, n, 0);
  const gracePayment    = g > 0 && r > 0 ? Math.round(p * r) : 0;
  const monthlyPrincipal = Math.round(p / m);

  const items = [];
  let balance  = p;
  let prevYear = 0;

  for (let i = 1; i <= n; i++) {
    const year    = Math.ceil(i / 12);
    prevYear      = pushYearHeader(items, year, prevYear);
    const isGrace = i <= g;
    const interest = r > 0 ? Math.round(balance * r) : 0;
    let payment, principalPmt;

    if (isGrace) {
      payment      = gracePayment;
      principalPmt = 0;
    } else {
      // 마지막 회차: 잔여 원금 전액 상환
      principalPmt = (i === n) ? balance : monthlyPrincipal;
      payment      = principalPmt + interest;
      balance      = Math.max(0, balance - principalPmt);
    }

    items.push({
      type: 'month', id: `m${i}`,
      month: i, year, monthInYear: (i - 1) % 12 + 1,
      payment, principal: principalPmt, interest, balance,
      repaidPct: ((p - balance) / p) * 100,
      isGrace,
    });
  }
  return items;
}

function scheduleBullet(p, r, n) {
  const monthlyInterest = r > 0 ? Math.round(p * r) : 0;

  const items = [];
  let prevYear = 0;

  for (let i = 1; i <= n; i++) {
    const year    = Math.ceil(i / 12);
    prevYear      = pushYearHeader(items, year, prevYear);
    const isLast  = i === n;
    const payment = isLast ? p + monthlyInterest : monthlyInterest;

    items.push({
      type: 'month', id: `m${i}`,
      month: i, year, monthInYear: (i - 1) % 12 + 1,
      payment,
      principal: isLast ? p : 0,
      interest: monthlyInterest,
      balance:  isLast ? 0 : p,
      repaidPct: isLast ? 100 : 0,
      isGrace: false,
    });
  }
  return items;
}

function scheduleGraduated(p, r, n, g) {
  const m             = n - g;
  const gracePayment  = g > 0 && r > 0 ? Math.round(p * r) : 0;
  const annualIncrease = 0.03;

  // P0 계산 (calcGraduated와 동일)
  let lo = 0, hi = p, P0 = 0;
  for (let iter = 0; iter < 150; iter++) {
    P0 = (lo + hi) / 2;
    let balance = p;
    for (let month = 1; month <= m; month++) {
      const yearIdx = Math.ceil(month / 12) - 1;
      balance -= P0 * Math.pow(1 + annualIncrease, yearIdx) - balance * r;
    }
    if (Math.abs(balance) < 1) break;
    if (balance > 0) lo = P0; else hi = P0;
  }
  P0 = Math.round(P0);

  const items = [];
  let balance    = p;
  let prevYear   = 0;
  let repayMonth = 0;

  for (let i = 1; i <= n; i++) {
    const year    = Math.ceil(i / 12);
    prevYear      = pushYearHeader(items, year, prevYear);
    const isGrace = i <= g;
    const interest = r > 0 ? Math.round(balance * r) : 0;
    let payment, principalPmt;

    if (isGrace) {
      payment      = gracePayment;
      principalPmt = 0;
    } else {
      repayMonth++;
      const yearIdx = Math.ceil(repayMonth / 12) - 1;
      payment       = Math.round(P0 * Math.pow(1 + annualIncrease, yearIdx));
      principalPmt  = Math.max(0, payment - interest);
      balance       = Math.max(0, Math.round(balance - principalPmt));
    }

    items.push({
      type: 'month', id: `m${i}`,
      month: i, year, monthInYear: (i - 1) % 12 + 1,
      payment, principal: principalPmt, interest, balance,
      repaidPct: ((p - balance) / p) * 100,
      isGrace,
    });
  }
  return items;
}

/* ══════════════════════════════════════
 *  공개 API
 * ══════════════════════════════════════ */

/**
 * 대출 계산 통합 함수
 * @param {number} principal   - 대출 원금 (원)
 * @param {number} annualRate  - 연 이자율 (%)
 * @param {number} years       - 대출 기간 (년)
 * @param {string} loanType    - 'annuity' | 'equalPrincipal' | 'bullet' | 'graduated'
 * @param {number} gracePeriod - 거치기간 (년, 기본 0)
 */
export function calculateLoanByType(
  principal,
  annualRate,
  years,
  loanType = 'annuity',
  gracePeriod = 0
) {
  const p = Number(principal);
  const r = Number(annualRate) / 100 / 12;
  const n = Math.round(Number(years) * 12);
  const g = Math.round(Number(gracePeriod) * 12);

  if (isNaN(p) || isNaN(r) || isNaN(n) || isNaN(g) || p <= 0 || n <= 0) {
    return { loanType, monthlyPayment: 0, totalAmount: 0, totalInterest: 0 };
  }

  switch (loanType) {
    case 'equalPrincipal': return calcEqualPrincipal(p, r, n, g);
    case 'bullet':         return calcBullet(p, r, n);
    case 'graduated':      return calcGraduated(p, r, n, g);
    default:               return calcAnnuity(p, r, n, g); // 'annuity'
  }
}

/**
 * 월별 상환 일정 통합 함수 (연도 구분자 포함)
 */
export function generateScheduleByType(
  principal,
  annualRate,
  years,
  loanType = 'annuity',
  gracePeriod = 0
) {
  const p = Number(principal);
  const r = Number(annualRate) / 100 / 12;
  const n = Math.round(Number(years) * 12);
  const g = Math.round(Number(gracePeriod) * 12);

  if (isNaN(p) || isNaN(r) || isNaN(n) || isNaN(g) || p <= 0 || n <= 0) {
    return [];
  }

  switch (loanType) {
    case 'equalPrincipal': return scheduleEqualPrincipal(p, r, n, g);
    case 'bullet':         return scheduleBullet(p, r, n);
    case 'graduated':      return scheduleGraduated(p, r, n, g);
    default:               return scheduleAnnuity(p, r, n, g);
  }
}

// ── 하위 호환 래퍼 ──────────────────────────────
export function calculateLoan(principal, annualRate, years) {
  return calculateLoanByType(principal, annualRate, years, 'annuity', 0);
}
export function generateSchedule(principal, annualRate, years) {
  return generateScheduleByType(principal, annualRate, years, 'annuity', 0);
}

/* ══════════════════════════════════════
 *  포맷 유틸
 * ══════════════════════════════════════ */

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
 * 100,000,000 → "1억원"
 * 150,000,000 → "1억 5,000만원"
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

/* ══════════════════════════════════════
 *  중개보수(중개수수료) 계산 — 서울 기준 2021년 개정
 * ══════════════════════════════════════ */

/**
 * @param {string} transactionType  - 'sale'(매매) | 'jeonse'(전세) | 'monthly'(월세)
 * @param {string} propertyType     - 'house'(주택) | 'officetel' | 'presale'(분양권) | 'other'(그 외)
 * @param {number} price            - 매매가/전세가 (원)
 * @param {number} deposit          - 보증금 (원, 월세 전용)
 * @param {number} monthlyRent      - 월세 (원)
 * @param {number} prepaid          - 분양권 불입금액 (원, 융자포함)
 * @param {number} premium          - 분양권 프리미엄 (원)
 * @param {number|null} customRate  - 직접 입력 요율 (%, null이면 자동)
 */
export function calculateBrokerage({
  transactionType,
  propertyType,
  price       = 0,
  deposit     = 0,
  monthlyRent = 0,
  prepaid     = 0,
  premium     = 0,
  customRate  = null,
}) {
  // ── 거래금액 산출
  let tradeAmount;
  if (propertyType === 'presale') {
    tradeAmount = Number(prepaid) + Number(premium);
  } else if (transactionType === 'monthly') {
    const d = Number(deposit);
    const m = Number(monthlyRent);
    const c100 = d + m * 100;
    tradeAmount = c100 < 50_000_000 ? d + m * 70 : c100;
  } else {
    tradeAmount = Number(price);
  }

  if (!tradeAmount || tradeAmount <= 0) return { error: '금액을 입력해주세요.' };

  // ── 요율·한도 결정
  let rate;
  let limit = null;
  const isSale = transactionType === 'sale' || propertyType === 'presale';

  if (customRate !== null && customRate !== '' && !isNaN(Number(customRate))) {
    rate = Number(customRate) / 100;
  } else if (propertyType === 'officetel') {
    rate = isSale ? 0.005 : 0.004;
  } else if (propertyType === 'other') {
    rate = 0.009;
  } else {
    // house / presale — 주택 요율 적용
    if (isSale) {
      if      (tradeAmount < 50_000_000)      { rate = 0.006; limit = 250_000; }
      else if (tradeAmount < 200_000_000)     { rate = 0.005; limit = 800_000; }
      else if (tradeAmount < 900_000_000)     { rate = 0.004; }
      else if (tradeAmount < 1_200_000_000)   { rate = 0.005; }
      else if (tradeAmount < 1_500_000_000)   { rate = 0.006; }
      else                                    { rate = 0.007; }
    } else {
      if      (tradeAmount < 50_000_000)      { rate = 0.005; limit = 200_000; }
      else if (tradeAmount < 100_000_000)     { rate = 0.004; limit = 300_000; }
      else if (tradeAmount < 600_000_000)     { rate = 0.003; }
      else if (tradeAmount < 1_200_000_000)   { rate = 0.004; }
      else if (tradeAmount < 1_500_000_000)   { rate = 0.005; }
      else                                    { rate = 0.006; }
    }
  }

  const calculated = Math.floor(tradeAmount * rate);
  const commission = limit !== null ? Math.min(calculated, limit) : calculated;
  const vat        = Math.round(commission * 0.1);

  return {
    tradeAmount,
    rate,
    commission,
    vat,
    total: commission + vat,
    limit,
    isLimited: limit !== null && calculated > limit,
  };
}

