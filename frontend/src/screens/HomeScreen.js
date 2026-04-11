import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { formatNumber } from '../utils/loanCalculator';

const FEATURES = [
  '원리금 균등 상환 방식 월 상환금 계산',
  '실시간 USD · JPY · EUR 환율 표시',
  '두 가지 대출 조건 동시 비교',
  '계산 기록 저장 및 재사용',
];

export default function HomeScreen({ navigation }) {
  const { exchangeRates, fetchExchangeRates } = useApp();
  const [loadingRates, setLoadingRates] = useState(false);
  const [rateError, setRateError]       = useState(false);

  // 화면 포커스마다 환율 갱신
  useFocusEffect(
    useCallback(() => {
      loadRates(false);
    }, [])
  );

  async function loadRates(force = false) {
    setLoadingRates(true);
    setRateError(false);
    try {
      await fetchExchangeRates(force);
    } catch {
      setRateError(true);
    } finally {
      setLoadingRates(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🏦</Text>
          <Text style={styles.heroTitle}>대출 계산기</Text>
          <Text style={styles.heroSubtitle}>원리금 균등 상환  ·  환율 변환  ·  조건 비교</Text>
        </View>

        {/* 실시간 환율 카드 */}
        <ExchangeCard
          rates={exchangeRates?.rates}
          date={exchangeRates?.date}
          loading={loadingRates}
          error={rateError}
          onRefresh={() => loadRates(true)}
        />

        {/* 주요 버튼 */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('LoanCalculator')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>📊</Text>
          <View style={styles.btnTextWrap}>
            <Text style={styles.primaryBtnTitle}>대출 계산 시작</Text>
            <Text style={styles.primaryBtnSub}>월 상환금, 총 이자 즉시 계산</Text>
          </View>
          <Text style={styles.arrowWhite}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>📋</Text>
          <View style={styles.btnTextWrap}>
            <Text style={styles.secondaryBtnTitle}>계산 기록 보기</Text>
            <Text style={styles.secondaryBtnSub}>이전 계산 결과를 확인합니다</Text>
          </View>
          <Text style={styles.arrowBlue}>›</Text>
        </TouchableOpacity>

        {/* 기능 소개 */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>주요 기능</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ──────────────────────────────────── */
/*  실시간 환율 카드                     */
/* ──────────────────────────────────── */
function ExchangeCard({ rates, date, loading, error, onRefresh }) {
  // API는 "1 KRW = X 외화" 형태 → 화면엔 "1 외화 = ₩X" 로 역산
  const krwPerUSD = rates?.USD ? Math.round(1 / rates.USD) : null;
  const krwPerJPY = rates?.JPY ? (1 / rates.JPY).toFixed(2) : null;
  const krwPerEUR = rates?.EUR ? Math.round(1 / rates.EUR) : null;

  return (
    <View style={styles.rateCard}>
      {/* 헤더 */}
      <View style={styles.rateCardHeader}>
        <View style={styles.rateCardTitleRow}>
          <Text style={styles.rateCardTitle}>💱 실시간 환율</Text>
          {date && <Text style={styles.rateDate}>{date} 기준</Text>}
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color="#3F51B5" />
            : <Text style={styles.refreshBtnText}>↻ 새로고침</Text>
          }
        </TouchableOpacity>
      </View>

      {/* 내용 */}
      {loading && !rates ? (
        <View style={styles.rateLoading}>
          <ActivityIndicator color="#3F51B5" />
          <Text style={styles.rateLoadingText}>환율 불러오는 중...</Text>
        </View>
      ) : error && !rates ? (
        <View style={styles.rateError}>
          <Text style={styles.rateErrorText}>⚠️  환율을 불러올 수 없습니다</Text>
          <Text style={styles.rateErrorSub}>백엔드 서버 연결을 확인해주세요</Text>
        </View>
      ) : rates ? (
        <View style={styles.rateGrid}>
          <RateCell flag="🇺🇸" currency="USD" symbol="$" krw={krwPerUSD} unit="1" />
          <View style={styles.rateGridDivider} />
          <RateCell flag="🇯🇵" currency="JPY" symbol="¥" krw={krwPerJPY} unit="1" isDecimal />
          <View style={styles.rateGridDivider} />
          <RateCell flag="🇪🇺" currency="EUR" symbol="€" krw={krwPerEUR} unit="1" />
        </View>
      ) : null}
    </View>
  );
}

function RateCell({ flag, currency, symbol, krw, unit, isDecimal }) {
  const display = krw != null
    ? (isDecimal ? `₩${krw}` : `₩${formatNumber(krw)}`)
    : '-';

  return (
    <View style={styles.rateCell}>
      <Text style={styles.rateCellFlag}>{flag}</Text>
      <Text style={styles.rateCellCurrency}>{currency}</Text>
      <Text style={styles.rateCellLabel}>{unit}{symbol} =</Text>
      <Text style={styles.rateCellValue}>{display}</Text>
    </View>
  );
}

/* ──────────────────────────────────── */
/*  스타일                               */
/* ──────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4FF' },
  container: { padding: 20, paddingBottom: 40 },

  hero: { alignItems: 'center', paddingVertical: 24 },
  heroIcon:     { fontSize: 52, marginBottom: 10 },
  heroTitle:    { fontSize: 28, fontWeight: '800', color: '#1A237E', marginBottom: 4 },
  heroSubtitle: { fontSize: 13, color: '#7986CB', textAlign: 'center' },

  // ── 환율 카드
  rateCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#3F51B5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFBFF',
  },
  rateCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rateCardTitle:    { fontSize: 14, fontWeight: '700', color: '#1A237E' },
  rateDate:         { fontSize: 11, color: '#9E9E9E' },
  refreshBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: '#EEF0FB', borderRadius: 10,
    minWidth: 80, alignItems: 'center',
  },
  refreshBtnText: { fontSize: 12, fontWeight: '600', color: '#3F51B5' },

  rateLoading: { alignItems: 'center', padding: 20, gap: 8 },
  rateLoadingText: { fontSize: 13, color: '#9E9E9E' },
  rateError: { alignItems: 'center', padding: 16 },
  rateErrorText: { fontSize: 13, color: '#E53935', fontWeight: '600' },
  rateErrorSub: { fontSize: 12, color: '#9E9E9E', marginTop: 4 },

  rateGrid: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  rateGridDivider: { width: 1, backgroundColor: '#EEEEEE', marginVertical: 4 },

  rateCell: { flex: 1, alignItems: 'center', gap: 3 },
  rateCellFlag:     { fontSize: 22 },
  rateCellCurrency: { fontSize: 13, fontWeight: '700', color: '#3F51B5' },
  rateCellLabel:    { fontSize: 11, color: '#9E9E9E' },
  rateCellValue:    { fontSize: 15, fontWeight: '800', color: '#1A237E' },

  // ── 버튼
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#3F51B5', borderRadius: 16,
    padding: 20, marginBottom: 12,
    shadowColor: '#3F51B5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 16,
    padding: 20, marginBottom: 20,
    borderWidth: 1.5, borderColor: '#C5CAE9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  btnIcon:          { fontSize: 26, marginRight: 14 },
  btnTextWrap:      { flex: 1 },
  primaryBtnTitle:  { fontSize: 17, fontWeight: '700', color: '#FFF', marginBottom: 3 },
  primaryBtnSub:    { fontSize: 13, color: '#C5CAE9' },
  secondaryBtnTitle:{ fontSize: 17, fontWeight: '700', color: '#1A237E', marginBottom: 3 },
  secondaryBtnSub:  { fontSize: 13, color: '#9E9E9E' },
  arrowWhite:       { fontSize: 26, color: '#FFF', fontWeight: '300' },
  arrowBlue:        { fontSize: 26, color: '#3F51B5', fontWeight: '300' },

  // ── 기능 카드
  featuresCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  featuresTitle: { fontSize: 15, fontWeight: '700', color: '#1A237E', marginBottom: 14 },
  featureRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  featureBullet: { fontSize: 14, color: '#3F51B5', marginRight: 10, fontWeight: '700' },
  featureText:   { fontSize: 14, color: '#424242' },
});
