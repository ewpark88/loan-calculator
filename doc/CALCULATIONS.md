# 대출 계산 수식

> `frontend/src/utils/loanCalculator.js` 의 핵심 로직 설명

---

## 공통 변수 정의

```
P  = 대출 원금 (principal)
r  = 월 이자율 = 연이자율(%) / 100 / 12
n  = 총 상환 개월 수 = 대출기간(년) * 12
g  = 거치기간 개월 수 = 거치기간(년) * 12
n' = 실제 원금 상환 개월 수 = n - g
```

---

## 1. 원리금균등분할 (Annuity)

**매월 동일한 금액을 상환**

### 거치 기간 없을 때

```
월납입금 = P * r * (1 + r)^n / ((1 + r)^n - 1)
```

### 거치 기간 있을 때

```
거치기간 월납입금 = P * r                                          (이자만 납입)
상환기간 월납입금 = P * r * (1 + r)^n' / ((1 + r)^n' - 1)         (원리금균등)
```

### 월별 스케줄

```
이번 달 이자   = 잔액 * r
이번 달 원금   = 월납입금 - 이번 달 이자
다음 달 잔액   = 이번 달 잔액 - 이번 달 원금
```

---

## 2. 원금균등분할 (Equal Principal)

**매월 동일한 원금을 상환, 이자는 점점 줄어듦**

```
월 원금 상환액 = P / n'
이번 달 이자   = 잔액 * r
이번 달 납입금 = 월 원금 + 이번 달 이자

첫 달 납입금  (가장 많음) = P/n' + P * r
마지막 달 납입금 (가장 적음) = P/n' + (P/n') * r
```

### 거치 기간

- 거치기간 중: `이번 달 납입금 = 잔액 * r` (이자만)
- 상환기간: 위 공식 적용

---

## 3. 만기일시상환 (Bullet)

**대출 기간 동안 이자만 납입, 만기에 원금 전액 상환**

```
매월 납입금   = P * r                    (이자만)
만기 납입금   = P + (P * r)              (원금 + 마지막 이자)
총 납입 이자  = P * r * n
```

> 거치기간 개념 없음 (처음부터 이자만 납입하는 구조)

---

## 4. 체증식분할상환 (Graduated)

**매년 납입금이 3%씩 증가**

초기 납입금 P0는 **이진 탐색(Binary Search)** 으로 결정:

```
year_index = Math.floor(month / 12)   // 0-based
이번 달 납입금 = P0 * (1.03)^year_index

// P0는 아래 조건을 만족해야 함:
// Σ(월별 납입 원금) = P  (총 원금 상환액 = 대출 원금)
```

**이진 탐색 범위:**
- 하한: `P * r` (이자만 내는 최솟값)
- 상한: `P * r * 3` (충분히 큰 초기값)
- 정밀도: 원 단위 (Math.round 기준)

---

## 월별 스케줄 항목 구조

```javascript
{
  type: 'month' | 'yearHeader',
  id: string,              // 고유 키 (FlatList용)
  month: number,           // 1 ~ 120 (전체 회차)
  year: number,            // 1 ~ 10 (년도)
  monthInYear: number,     // 1 ~ 12 (해당 년도 내 월)
  payment: number,         // 이번 달 납입금 (원)
  principal: number,       // 이번 달 원금 상환액
  interest: number,        // 이번 달 이자
  balance: number,         // 상환 후 잔액
  repaidPct: number,       // 원금 상환률 (0~100%)
  isGrace: boolean         // 거치기간 여부
}
```

---

## 포맷 유틸리티

```javascript
formatNumber(1234567)          // "1,234,567"
formatKRW(1234567)             // "₩1,234,567"
formatManWon(10000000)         // "1,000만원"
formatManWon(150000000)        // "1억 5,000만원"
convertCurrency(50000000, 0.00077)  // 38500 (USD)
```

### 만원 단위 변환 규칙

```
1억 = 100,000,000
1만 = 10,000

100,000,000 이상 → "n억 m,000만원"
10,000 이상      → "n,000만원"
10,000 미만      → "n원"
```

---

## 계산 진입점

```javascript
// 요약 계산 (SummaryCard용)
const result = calculateLoanByType(
  principal,    // 원금 (숫자)
  annualRate,   // 연이율 (%, 숫자)
  years,        // 기간 (년, 숫자)
  loanType,     // 'annuity' | 'equalPrincipal' | 'bullet' | 'graduated'
  gracePeriod   // 거치기간 (년, 숫자, 기본값 0)
);

// 월별 스케줄 생성 (ResultScreen FlatList용)
const schedule = generateScheduleByType(
  principal, annualRate, years, loanType, gracePeriod
);
```

### 반환 구조별 차이

| loanType | result 주요 필드 |
|----------|----------------|
| annuity | monthlyPayment, gracePayment?, totalInterest, totalAmount |
| equalPrincipal | firstPayment, lastPayment, monthlyPrincipal, totalInterest, totalAmount |
| bullet | monthlyPayment, maturityPayment, totalInterest, totalAmount |
| graduated | firstPayment, lastYearPayment, totalInterest, totalAmount |
