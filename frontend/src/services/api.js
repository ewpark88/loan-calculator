import axios from 'axios';

/**
 * 백엔드 API (현재 미사용)
 *
 * - 환율: AppContext.js 에서 외부 API 직접 호출로 전환됨
 * - 대출 기록: localHistory.js (AsyncStorage) 로 전환됨
 *
 * 추후 서버 기능이 필요할 경우 실제 기기 IP로 BASE_URL 변경 필요:
 *   Android 에뮬레이터 → http://10.0.2.2:3000/api
 *   실제 기기          → http://<컴퓨터 IP>:3000/api
 */
const BASE_URL = 'http://10.0.2.2:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 공통 에러 인터셉터
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED' ? '요청 시간이 초과됐습니다.' : '서버에 연결할 수 없습니다.');
    return Promise.reject(new Error(message));
  }
);

export async function getExchangeRate() {
  const res = await api.get('/exchange-rate');
  return res.data.data;
}

export async function saveLoanHistory(data) {
  const res = await api.post('/loan-history', data);
  return res.data.data;
}

export async function getLoanHistory() {
  const res = await api.get('/loan-history');
  return res.data.data;
}
