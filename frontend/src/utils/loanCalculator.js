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
  const n = Number(years) * 12;
  const g = Number(gracePeriod) * 12;

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
  const n = Number(years) * 12;
  const g = Number(gracePeriod) * 12;

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
 *  조기(중도) 상환 시뮬레이션
 * ══════════════════════════════════════ */

/**
 * @param {number} principal     - 원래 대출 원금
 * @param {number} annualRate    - 연 이자율 (%)
 * @param {number} years         - 대출 기간 (년)
 * @param {string} loanType      - 상환 방식
 * @param {number} gracePeriod   - 거치기간 (년)
 * @param {number} paidMonths    - 지금까지 납부한 개월 수
 * @param {number} repayAmount   - 중도상환 금액 (원)
 */
export function calculateEarlyRepayment({
  principal, annualRate, years,
  loanType = 'annuity', gracePeriod = 0,
  paidMonths, repayAmount,
}) {
  const n    = Number(years) * 12;
  const paid = Number(paidMonths);
  const repay = Number(repayAmount);

  if (paid < 1 || paid >= n) {
    return { error: `경과 개월은 1 ~ ${n - 1}개월 사이여야 합니다.` };
  }

  const schedule = generateScheduleByType(principal, annualRate, years, loanType, gracePeriod);
  const monthItems = schedule.filter(s => s.type === 'month');

  const currentBalance = monthItems[paid - 1]?.balance ?? Number(principal);

  if (repay <= 0) return { error: '중도상환 금액을 입력해주세요.' };
  if (repay > currentBalance) {
    return { error: `중도상환 금액이 잔여 원금(${formatNumber(currentBalance)}원)보다 큽니다.` };
  }

  const originalRemainingInterest = Math.round(
    monthItems.slice(paid).reduce((sum, m) => sum + m.interest, 0)
  );

  const newBalance      = currentBalance - repay;
  const remainingMonths = n - paid;
  const r               = Number(annualRate) / 100 / 12;
  const currentMonthlyPayment = monthItems[paid]?.payment ?? 0;

  if (newBalance === 0) {
    return {
      currentBalance, newBalance: 0, repayAmount: repay,
      originalRemainingInterest, originalRemainingMonths: remainingMonths,
      fullyRepaid: true,
      reduceTerm: {
        newRemainingMonths: 0, monthsReduced: remainingMonths,
        newMonthlyPayment: 0, newRemainingInterest: 0,
        interestSaved: originalRemainingInterest,
      },
      reducePayment: {
        newRemainingMonths: 0, newMonthlyPayment: 0,
        monthlyReduced: currentMonthlyPayment, newRemainingInterest: 0,
        interestSaved: originalRemainingInterest,
      },
    };
  }

  // 옵션 A: 기간 단축 (납입금 유지)
  let newTermMonths = remainingMonths;
  if (r > 0 && currentMonthlyPayment > newBalance * r) {
    const ratio = currentMonthlyPayment / (currentMonthlyPayment - newBalance * r);
    newTermMonths = Math.max(1, Math.ceil(Math.log(ratio) / Math.log(1 + r)));
  } else if (r === 0 && currentMonthlyPayment > 0) {
    newTermMonths = Math.max(1, Math.ceil(newBalance / currentMonthlyPayment));
  }
  newTermMonths = Math.min(newTermMonths, remainingMonths);

  let termInterest = 0, balA = newBalance;
  for (let i = 0; i < newTermMonths; i++) {
    const interest    = Math.round(balA * r);
    const principalPmt = Math.max(0, currentMonthlyPayment - interest);
    termInterest += interest;
    balA = Math.max(0, balA - principalPmt);
  }

  // 옵션 B: 납입금 감소 (기간 유지)
  let newMonthlyPayment;
  if (r === 0) {
    newMonthlyPayment = Math.round(newBalance / remainingMonths);
  } else {
    newMonthlyPayment = Math.round(
      (newBalance * r * Math.pow(1 + r, remainingMonths)) /
      (Math.pow(1 + r, remainingMonths) - 1)
    );
  }

  let paymentInterest = 0, balB = newBalance;
  for (let i = 0; i < remainingMonths; i++) {
    const interest    = Math.round(balB * r);
    const principalPmt = Math.max(0, newMonthlyPayment - interest);
    paymentInterest += interest;
    balB = Math.max(0, balB - principalPmt);
  }

  return {
    currentBalance, newBalance, repayAmount: repay,
    originalRemainingInterest, originalRemainingMonths: remainingMonths,
    fullyRepaid: false,
    reduceTerm: {
      newRemainingMonths: newTermMonths,
      monthsReduced: remainingMonths - newTermMonths,
      newMonthlyPayment: currentMonthlyPayment,
      newRemainingInterest: Math.round(termInterest),
      interestSaved: Math.round(originalRemainingInterest - termInterest),
    },
    reducePayment: {
      newRemainingMonths: remainingMonths,
      newMonthlyPayment,
      monthlyReduced: currentMonthlyPayment - newMonthlyPayment,
      newRemainingInterest: Math.round(paymentInterest),
      interestSaved: Math.round(originalRemainingInterest - paymentInterest),
    },
  };
}

/* ══════════════════════════════════════
 *  부동산 담보대출 한도 계산 (LTV + DSR)
 *  2024년 기준 간소화 적용
 * ══════════════════════════════════════ */

/**
 * @param {number} propertyPrice       - 부동산 가격 (원)
 * @param {string} zone                - 'restricted'(투기과열) | 'adjusted'(조정) | 'normal'(기타)
 * @param {string} ownership           - 'none'(무주택) | 'one'(1주택) | 'multi'(다주택)
 * @param {number} annualIncome        - 연 소득 (원)
 * @param {number} existingMonthlyDebt - 기존 월 부채 상환액 (원)
 * @param {number} loanRate            - 희망 금리 (%)
 * @param {number} loanYears           - 대출 기간 (년)
 */
export function calculateRealEstateLoan({
  propertyPrice, zone, ownership,
  annualIncome, existingMonthlyDebt,
  loanRate, loanYears,
}) {
  const price    = Number(propertyPrice);
  const income   = Number(annualIncome);
  const existing = Number(existingMonthlyDebt);
  const rate     = Number(loanRate);
  const years    = Number(loanYears);
  const r = rate / 100 / 12;
  const n = years * 12;

  // LTV 비율 결정
  let ltvRate;
  if (zone === 'restricted') {
    if (price > 1_500_000_000)      ltvRate = 0;
    else if (price > 900_000_000)   ltvRate = 0.20;
    else                            ltvRate = ownership === 'none' ? 0.40 : 0.30;
  } else if (zone === 'adjusted') {
    if (price > 900_000_000)        ltvRate = 0.30;
    else                            ltvRate = ownership === 'none' ? 0.50 : 0.40;
  } else {
    ltvRate = ownership === 'multi' ? 0.60 : 0.70;
  }

  const ltvMaxLoan = Math.round(price * ltvRate);

  // DSR 기준 (은행권 40%)
  const maxMonthlyNew = Math.max(0, Math.round(income / 12 * 0.40) - existing);
  let dsrMaxLoan;
  if (r === 0 || maxMonthlyNew === 0) {
    dsrMaxLoan = maxMonthlyNew * n;
  } else {
    dsrMaxLoan = Math.round(
      maxMonthlyNew * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n))
    );
  }
  dsrMaxLoan = Math.max(0, dsrMaxLoan);

  const maxLoan = Math.min(ltvMaxLoan, dsrMaxLoan);

  let monthlyPayment = 0;
  if (maxLoan > 0) {
    monthlyPayment = r > 0
      ? Math.round((maxLoan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1))
      : Math.round(maxLoan / n);
  }

  return {
    propertyPrice: price,
    ltvRate, ltvMaxLoan,
    dsrMaxLoan,
    maxMonthlyNew,
    maxLoan,
    monthlyPayment,
    totalInterest: Math.max(0, monthlyPayment * n - maxLoan),
    isLtvZero: ltvRate === 0,
    limitedBy: ltvMaxLoan <= dsrMaxLoan ? 'ltv' : 'dsr',
    loanRate: rate,
    loanYears: years,
  };
}
