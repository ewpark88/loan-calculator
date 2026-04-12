/**
 * AppContext — 환율 데이터 관리
 *
 * 백엔드 서버 없이 외부 API를 프론트엔드에서 직접 호출합니다.
 *  1차: open.er-api.com
 *  2차: frankfurter.app
 *  캐시: AsyncStorage (1시간 TTL)
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AppContext = createContext(null);

const CACHE_KEY = '@loan_calc_exchange_rates';
const CACHE_TTL = 60 * 60 * 1000; // 1시간

async function fetchRatesFromAPI() {
  // ── 1차: open.er-api.com ──────────────────────────────
  try {
    const res = await axios.get(
      'https://open.er-api.com/v6/latest/KRW',
      { timeout: 8000 }
    );
    if (res.data?.result === 'success') {
      const { USD, JPY, EUR } = res.data.rates;
      return {
        base: 'KRW',
        rates: { USD, JPY, EUR },
        date: new Date(res.data.time_last_update_utc).toISOString().split('T')[0],
        source: 'open.er-api.com',
      };
    }
    throw new Error('open.er-api.com 응답 형식 오류');
  } catch (e1) {
    console.warn('[환율] open.er-api.com 실패:', e1.message);
  }

  // ── 2차: frankfurter.app ──────────────────────────────
  try {
    const res = await axios.get(
      'https://api.frankfurter.app/latest?base=KRW&symbols=USD,JPY,EUR',
      { timeout: 8000 }
    );
    return {
      base: 'KRW',
      rates: res.data.rates,
      date: res.data.date,
      source: 'frankfurter',
    };
  } catch (e2) {
    console.warn('[환율] frankfurter.app 실패:', e2.message);
  }

  // ── 3차: exchangerate-api.com ─────────────────────────
  try {
    const res = await axios.get(
      'https://v6.exchangerate-api.com/v6/latest/KRW',
      { timeout: 8000 }
    );
    if (res.data?.result === 'success') {
      const { USD, JPY, EUR } = res.data.conversion_rates;
      return {
        base: 'KRW',
        rates: { USD, JPY, EUR },
        date: new Date().toISOString().split('T')[0],
        source: 'exchangerate-api.com',
      };
    }
    throw new Error('exchangerate-api.com 응답 오류');
  } catch (e3) {
    console.warn('[환율] exchangerate-api.com 실패:', e3.message);
  }

  throw new Error('모든 환율 API 호출에 실패했습니다.');
}

export function AppProvider({ children }) {
  const [exchangeRates, setExchangeRates] = useState(null);

  /**
   * @param {boolean} force - true면 캐시 무시하고 강제 새로고침
   */
  const fetchExchangeRates = useCallback(async (force = false) => {
    // 캐시 확인 (강제 새로고침이 아닐 때)
    if (!force) {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setExchangeRates(data);
            return data;
          }
        }
      } catch (_) {}
    }

    // 외부 API 직접 호출
    const data = await fetchRatesFromAPI();
    setExchangeRates(data);

    // 캐시 저장
    try {
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch (_) {}

    return data;
  }, []);

  return (
    <AppContext.Provider value={{ exchangeRates, fetchExchangeRates }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
