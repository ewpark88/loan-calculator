import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY        = 'loan_history';
const BROKERAGE_KEY      = 'brokerage_history';
const ACQUISITION_TAX_KEY = 'acquisition_tax_history';

/** 대출 기록 전체 조회 (최신순) */
export async function getLocalHistory() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch {
    return [];
  }
}

/** 중개보수 기록 전체 조회 (최신순) */
export async function getBrokerageHistory() {
  try {
    const raw = await AsyncStorage.getItem(BROKERAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch {
    return [];
  }
}

/** 취득세 기록 전체 조회 (최신순) */
export async function getAcquisitionTaxHistory() {
  try {
    const raw = await AsyncStorage.getItem(ACQUISITION_TAX_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch {
    return [];
  }
}

/** 대출 + 중개보수 + 취득세 통합 조회 (최신순, recordType 태그 포함) */
export async function getAllHistory() {
  const [loans, brokerages, acquisitions] = await Promise.all([
    getLocalHistory(),
    getBrokerageHistory(),
    getAcquisitionTaxHistory(),
  ]);
  const merged = [
    ...loans.map(l => ({ ...l, recordType: 'loan' })),
    ...brokerages.map(b => ({ ...b, recordType: 'brokerage' })),
    ...acquisitions.map(a => ({ ...a, recordType: 'acquisition' })),
  ];
  return merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

/** 중개보수 기록 저장 */
export async function saveBrokerageHistory(data) {
  try {
    const raw  = await AsyncStorage.getItem(BROKERAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];

    const newItem = {
      id:          Date.now(),
      recordType:  'brokerage',
      txType:      data.txType,
      propType:    data.propType,
      tradeAmount: data.tradeAmount,
      commission:  data.commission,
      vat:         data.vat,
      total:       data.total,
      rate:        data.rate,
      isLimited:   data.isLimited,
      createdAt:   new Date().toISOString(),
    };

    list.push(newItem);
    await AsyncStorage.setItem(BROKERAGE_KEY, JSON.stringify(list));
    return newItem;
  } catch (err) {
    throw new Error('저장에 실패했습니다: ' + err.message);
  }
}

/** 취득세 기록 저장 */
export async function saveAcquisitionTaxHistory(data) {
  try {
    const raw  = await AsyncStorage.getItem(ACQUISITION_TAX_KEY);
    const list = raw ? JSON.parse(raw) : [];

    const newItem = {
      id:        Date.now(),
      recordType: 'acquisition',
      acqType:   data.acqType,
      propType:  data.propType,
      area:      data.area,
      houseCount: data.houseCount,
      isAdjusted: data.isAdjusted,
      isCorporation: data.isCorporation,
      isFirstHome: data.isFirstHome,
      price:     data.price,
      acqRate:   data.acqRate,
      ruralRate: data.ruralRate,
      eduRate:   data.eduRate,
      acqTax:    data.acqTax,
      ruralTax:  data.ruralTax,
      eduTax:    data.eduTax,
      total:     data.total,
      createdAt: new Date().toISOString(),
    };

    list.push(newItem);
    await AsyncStorage.setItem(ACQUISITION_TAX_KEY, JSON.stringify(list));
    return newItem;
  } catch (err) {
    throw new Error('저장에 실패했습니다: ' + err.message);
  }
}

/** 취득세 기록 삭제 */
export async function deleteAcquisitionTaxHistory(id) {
  try {
    const raw  = await AsyncStorage.getItem(ACQUISITION_TAX_KEY);
    if (!raw) return;
    const list    = JSON.parse(raw);
    const updated = list.filter(item => item.id !== id);
    await AsyncStorage.setItem(ACQUISITION_TAX_KEY, JSON.stringify(updated));
  } catch (err) {
    throw new Error('삭제에 실패했습니다: ' + err.message);
  }
}

/** 중개보수 기록 삭제 */
export async function deleteBrokerageHistory(id) {
  try {
    const raw  = await AsyncStorage.getItem(BROKERAGE_KEY);
    if (!raw) return;
    const list    = JSON.parse(raw);
    const updated = list.filter(item => item.id !== id);
    await AsyncStorage.setItem(BROKERAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    throw new Error('삭제에 실패했습니다: ' + err.message);
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
