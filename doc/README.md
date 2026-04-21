# 대출 계산기 (Loan Calculator) - 프로젝트 문서

> 다른 PC나 환경에서 빠르게 작업 재개를 위한 완전한 레퍼런스 문서

---

## 목차

| 문서 | 내용 |
|------|------|
| [README.md](README.md) | 프로젝트 개요 (현재 문서) |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 아키텍처, 기술 스택, 디렉토리 구조 |
| [FEATURES.md](FEATURES.md) | 구현된 기능 상세 설명 |
| [CALCULATIONS.md](CALCULATIONS.md) | 대출 계산 수식 및 로직 |
| [API.md](API.md) | 백엔드 API 명세 |
| [DEVELOPMENT.md](DEVELOPMENT.md) | 개발 환경 설정 및 실행 방법 |

---

## 프로젝트 개요

**React Native(Expo) 기반 한국어 대출 계산기 앱**

- 4가지 상환 방식 계산 지원
- 실시간 환율 조회
- 계산 이력 저장
- Google AdMob 광고 수익화

### 빠른 현황 파악

```
loan-calculator/
├── frontend/    ← React Native + Expo (메인 앱)
├── backend/     ← Express + SQLite (현재 프론트엔드와 미연동)
└── doc/         ← 이 문서 폴더
```

### 핵심 정보 요약

| 항목 | 값 |
|------|-----|
| 플랫폼 | Android (iOS 미지원) |
| 앱 이름 | 대출 계산기 |
| Android 패키지 | com.example.loancalculator |
| AdMob App ID | ca-app-pub-8353634332299342~9237376168 |
| EAS Project ID | 74411a45-cfb3-4301-b7a7-1c297df84e33 |
| 주요 색상 (Primary) | #3F51B5 (Indigo) |
| Splash 배경 | #1A237E |

### 현재 상태

- ✅ 프론트엔드 완성 (4가지 상환방식, 환율, 이력, 광고)
- ✅ 백엔드 완성 (API 구현됨)
- ⚠️ 백엔드-프론트엔드 미연동 (프론트엔드가 AsyncStorage + 외부 API 직접 호출)
- ⚠️ 수익화 기능 보강 필요 (기능 다양성 확대 검토 중)
