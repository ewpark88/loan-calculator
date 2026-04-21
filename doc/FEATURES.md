# 구현된 기능 상세

---

## 화면별 기능

### 1. HomeScreen (홈)

**구성 요소:**
- 히어로 배너 (앱 설명)
- 환율 카드 (USD / JPY / EUR → KRW)
- 메인 CTA 버튼 → LoanCalculatorScreen 이동
- 이력 보기 버튼 → HistoryScreen 이동
- 대출 방식 4가지 안내 카드 (2×2 그리드)
- 주요 기능 하이라이트 리스트
- AdBanner 광고 2개

**환율 갱신 동작:**
1. 화면 포커스 시 자동 갱신 (`useFocusEffect`)
2. 새로고침 버튼으로 수동 갱신
3. 1분 내 3회 초과 갱신 시 경고 표시

---

### 2. LoanCalculatorScreen (계산기 입력)

**입력 필드:**

| 필드 | 설명 | 기본값 |
|------|------|--------|
| 대출 방식 | 4가지 중 선택 (세그먼트 버튼) | 원리금균등 |
| 대출 원금 | 숫자 입력 + 빠른 입력 버튼 | - |
| 연 이자율(%) | 소수점 입력 가능 | - |
| 대출 기간(년) | 숫자 입력 | - |
| 거치기간(년) | 선택적 입력 (만기일시상환은 숨김) | 0 |

**빠른 입력 버튼:**
- 원금: `+100만`, `+500만`, `+1,000만`, `+1억` 버튼
- 거치기간: `없음`, `1년`, `3년`, `5년` 버튼

**비교 모드:**
- 토글 스위치로 활성화
- 두 번째 대출 조건 입력 폼 노출
- 각각 다른 대출 방식 선택 가능

**유효성 검사 오류 메시지 (한국어):**
- 원금 미입력: "대출 원금을 입력해주세요"
- 이자율 미입력/범위 초과: "연 이자율은 0.1% ~ 30% 사이로 입력해주세요"
- 기간 미입력: "대출 기간을 입력해주세요"
- 거치기간 초과: "거치기간은 대출 기간보다 작아야 합니다"

---

### 3. ResultScreen (계산 결과)

#### 요약 카드 (SummaryCard)

대출 방식별 표시 내용:

| 방식 | 표시 라벨 |
|------|----------|
| 원리금균등 | 월 납입금 |
| 원금균등 | 첫 달 납입금 ~ 마지막 달 납입금 |
| 만기일시상환 | 월 이자 / 만기 상환금 |
| 체증식 | 첫 달 납입금 (3%/년 증가) |

#### 상세 요약 (SummarySection)

- 대출 원금 / 연 이자율 / 대출 기간 / 거치기간
- 총 납입 이자
- 총 납입 금액
- 환율 적용 금액 (USD, JPY, EUR)

#### 비교 모드 뷰 (CompareView)

- 두 대출 조건을 나란히 표시
- 차이 분석: 월 납입금 / 총 이자 / 총 금액 비교
- 어떤 조건이 유리한지 강조 표시

#### 월별 상환 스케줄 (FlatList)

- 년도 구분선 (YearSeparator)
- 월별 카드 (ScheduleCard):
  - 납입금, 원금, 이자 분리 표시
  - 잔액 표시
  - 원금 상환률 프로그레스 바
  - 거치기간 표시 (isGrace)

#### 저장 기능

- "저장" 버튼 → AsyncStorage에 기록
- 저장 후 버튼 텍스트 "저장됨" 으로 변경 (재저장 방지)

---

### 4. HistoryScreen (이력)

**이력 카드 (HistoryCard) 표시 정보:**
- 대출 원금 + 저장 날짜/시간
- 대출 방식 칩 (색상 코딩)
- 이자율 / 기간 / 거치기간 칩
- 월 납입금 / 총 이자 / 총 금액 요약
- 삭제 버튼 (확인 없이 즉시 삭제)

**대출 방식 색상:**

| 방식 | 색상 |
|------|------|
| 원리금균등 | #3F51B5 (Indigo) |
| 원금균등 | #009688 (Teal) |
| 만기일시 | #FF5722 (Deep Orange) |
| 체증식 | #9C27B0 (Purple) |

**이력 불러오기:**
- 카드 탭 → LoanCalculatorScreen으로 이동 (initialValues 전달)
- Pull-to-Refresh 지원

**광고 삽입:**
- 이력 3개마다 배너 광고 1개 삽입

---

## 환율 데이터 흐름

```
사용자 → HomeScreen 접속
  → AppContext.fetchExchangeRates() 호출
    → AsyncStorage "exchange_rates" 확인
      → 캐시 유효 (1시간 이내)? → 캐시 반환
      → 캐시 만료 또는 없음?
        → open.er-api.com 호출
          → 성공? → 저장 & 반환
          → 실패? → frankfurter.app 호출
            → 성공? → 저장 & 반환
            → 실패? → exchangerate-api.com 호출
              → 성공? → 저장 & 반환
              → 실패? → 만료된 캐시라도 반환, 없으면 에러
```

---

## 이력 데이터 구조 (AsyncStorage)

```javascript
// AsyncStorage key: "loan_history"
// 값: JSON 배열

[
  {
    id: 1705315200000,              // Unix timestamp (ms)
    principal: 50000000,            // 원금 (원)
    interestRate: 3.5,              // 연이율 (%)
    period: 10,                     // 기간 (년)
    loanType: 'annuity',            // 대출 방식
    gracePeriod: 0,                 // 거치기간 (년)
    monthlyPayment: 483265,         // 월 납입금 (원리금균등 기준)
    totalInterest: 8391800,         // 총 이자
    totalAmount: 58391800,          // 총 납입액
    createdAt: "2025-01-15T12:00:00.000Z"
  },
  // ...
]
```

---

## 광고 컴포넌트

### AdBanner.js

```javascript
<AdBanner />  // 320×50 배너, 자동 로드
```

- 실패 시 자동 재시도
- 개발 환경: 테스트 ID 사용
- 프로덕션: 실제 Ad Unit ID 사용

### AdInterstitial.js

```javascript
const adRef = useRef();
<AdInterstitial ref={adRef} />

// 결과 화면 진입 후 600ms 뒤 표시
adRef.current?.show();
```

- 미리 로드(preload) → 즉각 표시
- 닫힌 후 자동 재로드
- `onAdClosed` 콜백 지원
