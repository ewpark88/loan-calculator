# 아키텍처 & 기술 스택

## 전체 구조

```
loan-calculator/
├── frontend/                          # React Native + Expo 앱
│   ├── App.js                         # 루트 컴포넌트 (AppContext + Navigator 마운트)
│   ├── app.json                       # Expo 설정 (AdMob ID, 패키지명, 아이콘 등)
│   ├── app.plugin.js                  # 커스텀 Expo 플러그인
│   ├── babel.config.js                # Babel 설정 (babel-preset-expo)
│   ├── package.json
│   ├── assets/
│   │   ├── icon.png
│   │   ├── adaptive-icon.png
│   │   └── splash.png
│   └── src/
│       ├── context/
│       │   └── AppContext.js          # 전역 상태 (환율 데이터)
│       ├── navigation/
│       │   └── AppNavigator.js        # 스택 네비게이션 설정
│       ├── screens/
│       │   ├── HomeScreen.js          # 홈 (환율 카드, 대출 유형 안내)
│       │   ├── LoanCalculatorScreen.js # 대출 조건 입력 폼
│       │   ├── ResultScreen.js        # 계산 결과 + 월별 상환 스케줄
│       │   └── HistoryScreen.js       # 저장된 이력 목록
│       ├── components/
│       │   ├── AdBanner.js            # AdMob 배너 광고
│       │   └── AdInterstitial.js      # AdMob 전면 광고
│       ├── services/
│       │   ├── api.js                 # Axios 클라이언트 (현재 미사용)
│       │   └── localHistory.js        # AsyncStorage CRUD 헬퍼
│       └── utils/
│           └── loanCalculator.js      # 핵심 계산 수식 + 포맷 유틸
│
├── backend/                           # Node.js + Express API
│   ├── src/
│   │   ├── app.js                     # Express 서버 진입점
│   │   ├── controllers/
│   │   │   ├── exchangeController.js  # 환율 API 핸들러
│   │   │   └── loanController.js      # 대출 이력 API 핸들러
│   │   ├── routes/
│   │   │   ├── exchangeRoutes.js      # GET /api/exchange-rate
│   │   │   └── loanRoutes.js          # POST/GET /api/loan-history
│   │   ├── services/
│   │   │   ├── exchangeService.js     # 외부 환율 API 호출 (fallback 체인)
│   │   │   └── loanService.js         # DB 저장/조회 로직
│   │   └── db/
│   │       └── database.js            # SQLite 초기화 (WAL 모드)
│   ├── package.json
│   ├── .env.example
│   └── loan_calculator.db             # SQLite DB 파일 (런타임 생성)
│
└── doc/                               # 이 문서 폴더
```

---

## 기술 스택

### Frontend

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| React Native | 0.73.6 | 기반 프레임워크 |
| Expo | ~50.0.6 | 빌드/배포 툴체인 |
| React Navigation (Stack) | - | 화면 전환 |
| Axios | 1.6.0 | HTTP 클라이언트 |
| AsyncStorage | 1.21.0 | 로컬 데이터 저장 |
| react-native-google-mobile-ads | 13.1.0 | AdMob 광고 |
| react-native-gesture-handler | - | 제스처 지원 |
| react-native-safe-area-context | - | 안전 영역 처리 |
| react-native-screens | - | 네이티브 화면 최적화 |

### Backend

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| Express.js | 4.18.2 | HTTP 서버 프레임워크 |
| better-sqlite3 | 9.4.3 | SQLite ORM |
| Axios | 1.6.0 | 외부 환율 API 호출 |
| cors | 2.8.5 | CORS 허용 |
| dotenv | 16.3.1 | 환경 변수 관리 |
| Nodemon | 3.0.2 | 개발 시 자동 재시작 |

---

## 상태 관리

### 전역 상태 (AppContext.js)

```javascript
// AppContext.js 에서 제공하는 값
{
  exchangeRates: null | {
    USD: number,  // 1원 = n달러
    JPY: number,
    EUR: number,
    lastUpdated: string  // ISO8601
  },
  fetchExchangeRates: (force: boolean) => Promise<void>
}
```

**데이터 흐름:**
1. AsyncStorage 캐시 확인 (TTL: 1시간)
2. 캐시 miss or force=true → 외부 API 호출
3. API 우선순위: open.er-api.com → frankfurter.app → exchangerate-api.com
4. 결과를 state + AsyncStorage에 저장

### 로컬 상태 (각 화면)

| 화면 | 주요 로컬 상태 |
|------|--------------|
| HomeScreen | loading, error, rateLimit 카운터 |
| LoanCalculatorScreen | loan1, loan2, compareMode (boolean) |
| ResultScreen | saving, saved, showAd |
| HistoryScreen | history[], loading, refreshing |

---

## 화면 네비게이션

```
HomeScreen
├── → LoanCalculatorScreen
│        params: { initialValues? }  ← HistoryScreen에서 불러올 때 전달
│        └── → ResultScreen
│                  params: { loanData, result, compareData?, compareResult? }
└── → HistoryScreen
         └── → LoanCalculatorScreen (tap 시 initialValues 전달)
```

**헤더 스타일:**
- 배경: `#3F51B5`
- 텍스트: 흰색, Bold, 18pt
- Home 화면은 뒤로가기 버튼 없음

---

## 데이터 영속성

### AsyncStorage 구조

```
AsyncStorage keys:
  "loan_history"    → JSON 배열 (최대 제한 없음)
  "exchange_rates"  → JSON { rates, timestamp }
```

### SQLite 스키마 (backend - 현재 미사용)

```sql
CREATE TABLE loan_history (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  principal       REAL    NOT NULL,
  interest_rate   REAL    NOT NULL,
  period          INTEGER NOT NULL,
  monthly_payment REAL    NOT NULL,
  total_interest  REAL    NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

> ⚠️ 백엔드 DB에는 loanType, gracePeriod 컬럼이 없음. 향후 연동 시 스키마 마이그레이션 필요.

---

## 광고 설정

### Ad Unit IDs (Production)

| 광고 유형 | Ad Unit ID |
|----------|-----------|
| 배너 | ca-app-pub-8353634332299342/8787618325 |
| 전면 | ca-app-pub-8353634332299342/8592786017 |

### 배치 전략

| 화면 | 광고 |
|------|------|
| HomeScreen | 배너 2개 (히어로 아래, 이력 버튼 위) |
| LoanCalculatorScreen | 배너 1개 (계산 버튼 위) |
| ResultScreen | 전면 1개 (600ms 지연), 배너 1개 + 스케줄 3년마다 배너 |
| HistoryScreen | 이력 3개마다 배너 삽입 |

---

## 성능 최적화 포인트

- `FlatList` 설정: `initialNumToRender={24}`, `maxToRenderPerBatch={24}`, `windowSize={10}`
- 비교 모드에서는 월별 스케줄 미생성 (240개 항목 렌더링 방지)
- AsyncStorage 환율 캐시 1시간 TTL
- 환율 갱신 속도 제한: 분당 최대 3회
