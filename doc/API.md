# 백엔드 API 명세

> ⚠️ 현재 프론트엔드에서 미사용. 프론트엔드는 AsyncStorage + 외부 API를 직접 호출 중.
> 향후 백엔드 연동 시 이 문서를 참조.

---

## 서버 정보

- **포트:** `.env` 에서 `PORT` 설정 (기본값: 3000)
- **기본 URL:** `http://localhost:3000`
- **CORS:** 전체 허용 (`*`)

---

## 환경 변수 (.env)

```bash
# backend/.env
PORT=3000
```

`.env.example` 참고 후 `.env` 파일 생성 필요.

---

## API 엔드포인트

### GET /api/exchange-rate

환율 정보 조회 (KRW 기준)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "base": "KRW",
    "rates": {
      "USD": 0.00077,
      "JPY": 0.0069,
      "EUR": 0.00071
    },
    "date": "2025-01-15",
    "source": "open.er-api.com",
    "cached": false
  }
}
```

**캐시:** 서버 메모리에 1시간 저장. 만료된 캐시도 fallback으로 사용.

**외부 API 호출 우선순위:**
1. `https://open.er-api.com/v6/latest/KRW`
2. `https://api.frankfurter.app/latest?base=KRW&symbols=USD,JPY,EUR`
3. `https://v6.exchangerate-api.com/v6/latest/KRW`

---

### POST /api/loan-history

대출 계산 이력 저장

**Request Body:**
```json
{
  "principal": 50000000,
  "interestRate": 3.5,
  "period": 10,
  "monthlyPayment": 483265,
  "totalInterest": 8391800
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "principal": 50000000,
    "interestRate": 3.5,
    "period": 10,
    "monthlyPayment": 483265,
    "totalInterest": 8391800,
    "totalAmount": 58391800
  }
}
```

---

### GET /api/loan-history

저장된 이력 목록 조회 (최근 50개)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "principal": 50000000,
      "interestRate": 3.5,
      "period": 10,
      "monthlyPayment": 483265,
      "totalInterest": 8391800,
      "totalAmount": 58391800,
      "createdAt": "2025-01-15T12:30:00.000Z"
    }
  ]
}
```

---

## 에러 응답 형식

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

---

## 백엔드 연동 시 해결해야 할 사항

1. **SQLite 스키마 업데이트 필요:**
   - `loanType` 컬럼 추가 (TEXT)
   - `gracePeriod` 컬럼 추가 (INTEGER)

2. **프론트엔드 `services/api.js` 활성화:**
   - 현재 Axios 클라이언트만 설정되어 있고 실제 호출 없음
   - `localHistory.js`의 AsyncStorage 로직을 API 호출로 교체

3. **환경 설정:**
   - 개발: `BACKEND_URL=http://localhost:3000`
   - 프로덕션: 실제 서버 URL로 변경
