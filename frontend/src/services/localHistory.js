/**
 * 대출 계산 기록 — AsyncStorage 기반 로컬 저장소
 * 서버 없이 기기 내부에 데이터를 저장/조회합니다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'loan_history';

/** 전체 기록 조회 (최신순) */
export async function getLocalHistory() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    // 최신순 정렬
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch {
    return [];
  }
}

/** 새 기록 저장 */
export async function saveLocalHistory(data) {
  try {
    const raw  = await AsyncStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];

    const newItem = {
      id:             Date.now(),
      principal:      data.principal,
      interestRate:   data.interestRate,
      period:         data.period,
      loanType:       data.loanType   || 'annuity',
      gracePeriod:    data.gracePeriod || 0,
      monthlyPayment: data.monthlyPayment,
      totalInterest:  data.totalInterest,
      totalAmount:    data.totalAmount,
      createdAt:      new Date().toISOString(),
    };

    list.push(newItem);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return newItem;
  } catch (err) {
    throw new Error('저장에 실패했습니다: ' + err.message);
  }
}

/** 특정 기록 삭제 */
export async function deleteLocalHistory(id) {
  try {
    const raw  = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const list    = JSON.parse(raw);
    const updated = list.filter(item => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    throw new Error('삭제에 실패했습니다: ' + err.message);
  }
}

/** 전체 기록 초기화 */
export async function clearLocalHistory() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
