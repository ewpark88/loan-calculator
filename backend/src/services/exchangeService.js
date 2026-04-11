const axios = require('axios');

// In-memory cache (1시간 TTL)
let cache = {
  data: null,
  timestamp: null,
  TTL: 60 * 60 * 1000,
};

async function getExchangeRates() {
  const now = Date.now();

  // 캐시가 유효하면 반환
  if (cache.data && cache.timestamp && now - cache.timestamp < cache.TTL) {
    console.log('캐시된 환율 데이터 반환');
    return { ...cache.data, cached: true };
  }

  try {
    // Frankfurter API: 무료, API 키 불필요
    // 1 KRW → USD / JPY / EUR 비율 반환
    const response = await axios.get(
      'https://api.frankfurter.app/latest?base=KRW&symbols=USD,JPY,EUR',
      { timeout: 8000 }
    );

    const rates = {
      base: 'KRW',
      rates: response.data.rates,
      date: response.data.date,
      cached: false,
    };

    cache.data = rates;
    cache.timestamp = now;

    console.log('새 환율 데이터 가져옴:', rates.date);
    return rates;
  } catch (error) {
    console.error('환율 API 오류:', error.message);

    // API 오류 시 만료된 캐시라도 반환
    if (cache.data) {
      console.log('만료 캐시 반환 (API 오류)');
      return { ...cache.data, cached: true, stale: true };
    }

    throw new Error('환율 데이터를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.');
  }
}

module.exports = { getExchangeRates };
