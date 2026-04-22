# 개발 환경 설정

## 사전 요구사항

| 도구 | 버전 | 확인 |
|------|------|------|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| Expo CLI | 최신 | `npx expo --version` |
| Android Studio | 최신 | Android Emulator 실행 용 |
| Git | 최신 | - |

**Android 개발 필수:**
- Android Studio 설치 후 `ANDROID_HOME` 환경변수 설정
- Android Emulator 생성 (API 34 권장)
- 또는 실제 Android 기기 + USB 디버깅 활성화

---

## 프로젝트 클론 및 초기 설정

```bash
git clone <repo-url>
cd loan-calculator
```

---

## Frontend 실행

```bash
cd frontend
npm install
npx expo start
```

**실행 후 선택:**
- `a` → Android Emulator 실행
- `w` → 웹 브라우저 실행 (일부 기능 제한)
- QR 코드 → Expo Go 앱으로 실기기 테스트

### 주의사항

- `react-native-google-mobile-ads`는 Expo Go에서 작동 안 함
- 광고 테스트를 위해서는 EAS Build 또는 `expo run:android` 필요

```bash
# 네이티브 빌드 (광고 포함 테스트)
npx expo run:android
```

---

## Backend 실행

```bash
cd backend
npm install
cp .env.example .env   # 환경 변수 설정
npm run dev            # nodemon으로 자동 재시작
```

개발 서버: `http://localhost:3000`

**package.json scripts:**
```json
{
  "start": "node src/app.js",
  "dev": "nodemon src/app.js"
}
```

---

## 빌드 (Production)

### EAS Build (권장)

```bash
cd frontend
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

**프로필 설정 (`eas.json`):**
```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "aab" }
    }
  }
}
```

### 로컬 빌드

```bash
cd frontend
npx expo run:android --variant release
```

---

## 환경별 광고 ID

광고 ID는 `app.json`에서 설정:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-8353634332299342~9237376168"
        }
      ]
    ]
  }
}
```

컴포넌트 내 Unit ID (`AdBanner.js`, `AdInterstitial.js`):
- `__DEV__` 가 `true`이면 Google 제공 테스트 ID 사용
- `__DEV__` 가 `false`이면 실제 Production ID 사용

---

## 주요 파일 수정 위치

| 수정 목적 | 파일 |
|----------|------|
| 계산 로직 변경 | `frontend/src/utils/loanCalculator.js` |
| 화면 UI 변경 | `frontend/src/screens/*.js` |
| 전역 상태/환율 | `frontend/src/context/AppContext.js` |
| 이력 저장/불러오기 | `frontend/src/services/localHistory.js` |
| 광고 배너 | `frontend/src/components/AdBanner.js` |
| 광고 전면 | `frontend/src/components/AdInterstitial.js` |
| 화면 이동 구조 | `frontend/src/navigation/AppNavigator.js` |
| 앱 설정 (이름, 아이콘, AdMob) | `frontend/app.json` |
| 백엔드 API 라우트 | `backend/src/routes/` |
| 백엔드 비즈니스 로직 | `backend/src/services/` |
| DB 스키마 | `backend/src/db/database.js` |

---

## 트러블슈팅

### Metro bundler 캐시 문제

```bash
cd frontend
npx expo start --clear
```

### Android 빌드 실패 (gradle)

```bash
cd frontend/android
./gradlew clean
cd ..
npx expo run:android
```

### better-sqlite3 빌드 오류 (백엔드)

```bash
cd backend
npm rebuild better-sqlite3
```

### 환율 API 호출 실패

- 네트워크 연결 확인
- API rate limit 확인 (open.er-api.com: 1,500회/월 무료)
- fallback 체인 동작 확인 (`AppContext.js` 로그)

---

## 코드 컨벤션

- 언어: 한국어 UI, 영어 코드/변수명
- 스타일: `StyleSheet.create()` 인라인 스타일 (별도 CSS 없음)
- 컴포넌트: 함수형 컴포넌트 + Hooks
- 상태: `useState`, `useEffect`, `useContext` 활용
- 비동기: `async/await` 패턴 (Promise.then 미사용)
- 에러 처리: `try/catch` + 사용자 친화적 Alert


## 개발앱 다운로드 apk
adb devices
npx expo run:android