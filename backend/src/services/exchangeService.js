const axios = require('axios');

// In-memory cache (1시간 TTL)
let cache = {
  data: null,
  timestamp: null,
  TTL: 60 * 60 * 1000,
};

/**
 * open.er-api.com (primary) → Frankfurter (fallback) 순으로 시도
 * 둘 다 실패하면 만료 캐시라도 반환, 그것도 없으면 에러
 */
async function getExchangeRates() {
  const now = Date.now();

  if (cache.data && cache.timestamp && now - cache.timestamp < cache.TTL) {
    console.log('[환율] 캐시 반환');
    return { ...cache.data, cached: true };
  }

  // ── 1차: open.er-api.com ──────────────────────────
  try {
    const res = await axios.get('https://open.er-api.com/v6/latest/KRW', { timeout: 8000 });
    if (res.data?.result === 'success') {
      const { USD, JPY, EUR } = res.data.rates;
      const rates = {
        base: 'KRW',
        rates: { USD, JPY, EUR },
        date: new Date(res.data.time_last_update_utc).toISOString().split('T')[0],
        source: 'open.er-api.com',
        cached: false,
      };
      cache = { ...cache, data: rates, timestamp: now };
      console.log('[환율] open.er-api.com 성공:', rates.date);
      return rates;
    }
    throw new Error('open.er-api.com 응답 오류');
  } catch (e1) {
    console.warn('[환율] open.er-api.com 실패:', e1.message);
  }

  // ── 2차: Frankfurter ─────────────────────────────
  try {
    const res = await axios.get(
      'https://api.frankfurter.app/latest?base=KRW&symbols=USD,JPY,EUR',
      { timeout: 8000 }
    );
    const rates = {
      base: 'KRW',
      rates: res.data.rates,
      date: res.data.date,
      source: 'frankfurter',
      cached: false,
    };
    cache = { ...cache, data: rates, timestamp: now };
    console.log('[환율] Frankfurter 성공:', rates.date);
    return rates;
  } catch (e2) {
    console.warn('[환율] Frankfurter 실패:', e2.message);
  }

  // ── 만료 캐시라도 반환 ─────────────────────────────
  if (cache.data) {
    console.warn('[환율] 만료 캐시 반환 (두 API 모두 실패)');
    return { ...cache.data, cached: true, stale: true };
  }

  throw new Error('환율 데이터를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.');
}

module.exports = { getExchangeRates };
