import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { formatNumber } from '../utils/loanCalculator';

// 4가지 상환 방식 안내
const LOAN_TYPE_CARDS = [
  {
    key: 'annuity',
    icon: '🔄',
    title: '원리금균등분할',
    desc: '매달 동일한 금액을 납부하는 가장 일반적인 방식',
    color: '#3F51B5',
    bg: '#EEF0FB',
  },
  {
    key: 'equal',
    icon: '📉',
    title: '원금균등분할',
    desc: '원금을 균등 상환, 시간이 지날수록 납부액 감소',
    color: '#00897B',
    bg: '#E0F2F1',
  },
  {
    key: 'bullet',
    icon: '📅',
    title: '만기일시상환',
    desc: '매달 이자만 납부 후 만기에 원금 전액 상환',
    color: '#C62828',
    bg: '#FFEBEE',
  },
  {
    key: 'graduated',
    icon: '📈',
    title: '체증식분할상환',
    desc: '납부액이 점차 증가, 보금자리론 등 특수 대출에 적용',
    color: '#6A1B9A',
    bg: '#F3E5F5',
  },
];

// 기타 주요 기능
const FEATURES = [
  { icon: '⏳', text: '거치기간 설정 — 이자만 납부하는 기간 별도 지정' },
  { icon: '🔀', text: '조건 비교 — 두 가지 대출 조건을 동시에 비교' },
  { icon: '💱', text: '실시간 환율 — USD · JPY · EUR 실시간 조회' },
  { icon: '📋', text: '계산 기록 — 결과 저장 및 재계산 지원' },
];

export default function HomeScreen({ navigation }) {
  const { exchangeRates, fetchExchangeRates } = useApp();
  const [loadingRates, setLoadingRates] = useState(false);
  const [rateError, setRateError]       = useState(false);

  useFocusEffect(
    useCallback(() => { loadRates(false); }, [])
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
          <Text style={styles.heroSubtitle}>
            원리금균등 · 원금균등 · 만기일시 · 체증식
          </Text>
        </View>

        {/* 실시간 환율 카드 */}
        <ExchangeCard
          rates={exchangeRates?.rates}
          date={exchangeRates?.date}
          loading={loadingRates}
          error={rateError}
          onRefresh={() => loadRates(true)}
        />

        {/* 대출 계산 시작 버튼 */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('LoanCalculator')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>📊</Text>
          <View style={styles.btnTextWrap}>
            <Text style={styles.primaryBtnTitle}>대출 계산 시작</Text>
            <Text style={styles.primaryBtnSub}>4가지 상환 방식 · 월 상환금 즉시 계산</Text>
          </View>
          <Text style={styles.arrowWhite}>›</Text>
        </TouchableOpacity>

        {/* 계산 기록 버튼 */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>📋</Text>
          <View style={styles.btnTextWrap}>
            <Text style={styles.secondaryBtnTitle}>계산 기록 보기</Text>
            <Text style={styles.secondaryBtnSub}>저장된 이전 계산 결과 확인</Text>
          </View>
          <Text style={styles.arrowBlue}>›</Text>
        </TouchableOpacity>

        {/* 상환 방식 안내 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>상환 방식 안내</Text>
          </View>
          <View style={styles.typeGrid}>
            {LOAN_TYPE_CARDS.map(item => (
              <View key={item.key} style={[styles.typeCard, { backgroundColor: item.bg }]}>
                <Text style={styles.typeCardIcon}>{item.icon}</Text>
                <Text style={[styles.typeCardTitle, { color: item.color }]}>{item.title}</Text>
                <Text style={styles.typeCardDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 기타 주요 기능 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>주요 기능</Text>
          </View>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureBorder]}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
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
  const krwPerUSD = rates?.USD ? Math.round(1 / rates.USD) : null;
  const krwPerJPY = rates?.JPY ? (1 / rates.JPY).toFixed(2) : null;
  const krwPerEUR = rates?.EUR ? Math.round(1 / rates.EUR) : null;

  return (
    <View style={styles.rateCard}>
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

      {loading && !rates ? (
        <View style={styles.rateLoading}>
          <ActivityIndicator color="#3F51B5" />
          <Text style={styles.rateLoadingText}>환율 불러오는 중...</Text>
        </View>
      ) : error && !rates ? (
        <View style={styles.rateError}>
          <Text style={styles.rateErrorText}>⚠️  환율을 불러올 수 없습니다</Text>
          <Text style={styles.rateErrorSub}>네트워크 연결 확인 후 새로고침 해주세요</Text>
        </View>
      ) : rates ? (
        <View style={styles.rateGrid}>
          <RateCell flag="🇺🇸" currency="USD" symbol="$" krw={krwPerUSD} />
          <View style={styles.rateGridDivider} />
          <RateCell flag="🇯🇵" currency="JPY" symbol="¥" krw={krwPerJPY} isDecimal />
          <View style={styles.rateGridDivider} />
          <RateCell flag="🇪🇺" currency="EUR" symbol="€" krw={krwPerEUR} />
        </View>
      ) : null}
    </View>
  );
}

function RateCell({ flag, currency, symbol, krw, isDecimal }) {
  const display = krw != null
    ? (isDecimal ? `₩${krw}` : `₩${formatNumber(krw)}`)
    : '-';
  return (
    <View style={styles.rateCell}>
      <Text style={styles.rateCellFlag}>{flag}</Text>
      <Text style={styles.rateCellCurrency}>{currency}</Text>
      <Text style={styles.rateCellLabel}>1{symbol} =</Text>
      <Text style={styles.rateCellValue}>{display}</Text>
    </View>
  );
}

/* ──────────────────────────────────── */
/*  스타일                               */
/* ──────────────────────────────────── */
const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#F0F4FF' },
  container: { padding: 20, paddingBottom: 48 },

  // ── Hero
  hero: { alignItems: 'center', paddingVertical: 28 },
  heroIcon:     { fontSize: 60, marginBottom: 12 },
  heroTitle:    { fontSize: 34, fontWeight: '800', color: '#1A237E', marginBottom: 6 },
  heroSubtitle: { fontSize: 15, color: '#7986CB', textAlign: 'center', lineHeight: 22 },

  // ── 환율 카드
  rateCard: {
    backgroundColor: '#FFF', borderRadius: 18, marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#3F51B5', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  rateCardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFBFF',
  },
  rateCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rateCardTitle:    { fontSize: 16, fontWeight: '700', color: '#1A237E' },
  rateDate:         { fontSize: 13, color: '#9E9E9E' },
  refreshBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: '#EEF0FB', borderRadius: 10,
    minWidth: 90, alignItems: 'center',
  },
  refreshBtnText: { fontSize: 14, fontWeight: '600', color: '#3F51B5' },

  rateLoading:     { alignItems: 'center', padding: 24, gap: 10 },
  rateLoadingText: { fontSize: 15, color: '#9E9E9E' },
  rateError:       { alignItems: 'center', padding: 20 },
  rateErrorText:   { fontSize: 15, color: '#E53935', fontWeight: '600' },
  rateErrorSub:    { fontSize: 13, color: '#9E9E9E', marginTop: 6 },

  rateGrid: { flexDirection: 'row', paddingVertical: 20, paddingHorizontal: 8 },
  rateGridDivider: { width: 1, backgroundColor: '#EEEEEE', marginVertical: 4 },

  rateCell:         { flex: 1, alignItems: 'center', gap: 5 },
  rateCellFlag:     { fontSize: 26 },
  rateCellCurrency: { fontSize: 15, fontWeight: '700', color: '#3F51B5' },
  rateCellLabel:    { fontSize: 13, color: '#9E9E9E' },
  rateCellValue:    { fontSize: 18, fontWeight: '800', color: '#1A237E' },

  // ── 버튼
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#3F51B5', borderRadius: 16,
    padding: 22, marginBottom: 12,
    shadowColor: '#3F51B5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 16,
    padding: 22, marginBottom: 20,
    borderWidth: 1.5, borderColor: '#C5CAE9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  btnIcon:           { fontSize: 30, marginRight: 16 },
  btnTextWrap:       { flex: 1 },
  primaryBtnTitle:   { fontSize: 19, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  primaryBtnSub:     { fontSize: 14, color: '#C5CAE9' },
  secondaryBtnTitle: { fontSize: 19, fontWeight: '700', color: '#1A237E', marginBottom: 4 },
  secondaryBtnSub:   { fontSize: 14, color: '#9E9E9E' },
  arrowWhite:        { fontSize: 30, color: '#FFF', fontWeight: '300' },
  arrowBlue:         { fontSize: 30, color: '#3F51B5', fontWeight: '300' },

  // ── 섹션 카드 공통
  sectionCard: {
    backgroundColor: '#FFF', borderRadius: 18, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  sectionAccent: { width: 4, height: 18, backgroundColor: '#3F51B5', borderRadius: 2, marginRight: 10 },
  sectionTitle:  { fontSize: 17, fontWeight: '700', color: '#1A237E' },

  // ── 상환 방식 2×2 그리드
  typeGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: 12, gap: 10,
  },
  typeCard: {
    width: '47%', borderRadius: 14,
    padding: 14,
  },
  typeCardIcon:  { fontSize: 26, marginBottom: 8 },
  typeCardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  typeCardDesc:  { fontSize: 13, color: '#616161', lineHeight: 19 },

  // ── 주요 기능 리스트
  featureRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 18, paddingVertical: 14,
  },
  featureBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  featureIcon:   { fontSize: 18, marginRight: 14, marginTop: 1 },
  featureText:   { flex: 1, fontSize: 15, color: '#424242', lineHeight: 22 },
});
