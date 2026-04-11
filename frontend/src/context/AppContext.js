import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getExchangeRate as fetchRate } from '../services/api';

const AppContext = createContext(null);

const CACHE_KEY = '@loan_calc_exchange_rates';
const CACHE_TTL = 60 * 60 * 1000; // 1시간

export function AppProvider({ children }) {
  const [exchangeRates, setExchangeRates] = useState(null);

  /**
   * @param {boolean} force - true이면 캐시 무시하고 강제 새로고침
   */
  const fetchExchangeRates = useCallback(async (force = false) => {
    // 강제 새로고침이 아니면 로컬 캐시 먼저 확인
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
    } else {
      // 캐시 삭제
      try { await AsyncStorage.removeItem(CACHE_KEY); } catch (_) {}
    }

    // 백엔드 API 호출
    const data = await fetchRate();
    setExchangeRates(data);

    // 로컬 캐시 갱신
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
