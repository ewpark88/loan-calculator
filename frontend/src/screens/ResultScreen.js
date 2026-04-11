import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { saveLoanHistory } from '../services/api';
import { formatNumber, formatKRW, convertCurrency } from '../utils/loanCalculator';
import AdBanner from '../components/AdBanner';
import AdInterstitial from '../components/AdInterstitial';

export default function ResultScreen({ navigation, route }) {
  const { loanData, result, compareData, compareResult } = route.params;
  const { exchangeRates, fetchExchangeRates } = useApp();
  const [loadingRates, setLoadingRates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAd, setShowAd] = useState(false);

  const isCompare = !!compareData;

  useEffect(() => {
    // 전면 광고 (딜레이)
    const adTimer = setTimeout(() => setShowAd(true), 600);

    // 환율 데이터 로드
    if (!exchangeRates) {
      setLoadingRates(true);
      fetchExchangeRates()
        .catch(() => {}) // 실패해도 UI는 정상 표시
        .finally(() => setLoadingRates(false));
    }

    return () => clearTimeout(adTimer);
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await saveLoanHistory({
        principal:      loanData.principal,
        interestRate:   loanData.interestRate,
        period:         loanData.period,
        monthlyPayment: result.monthlyPayment,
        totalInterest:  result.totalInterest,
      });
      setSaved(true);
      Alert.alert('저장 완료', '계산 결과가 기록에 저장되었습니다.');
    } catch (err) {
      Alert.alert('저장 실패', err.message || '백엔드 서버를 확인해주세요.');
    } finally {
      setSaving(false);
    }
  }

  const rates = exchangeRates?.rates;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <AdInterstitial visible={showAd} onClose={() => setShowAd(false)} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {isCompare ? (
          <CompareView
            loanData={loanData}     result={result}
            compareData={compareData} compareResult={compareResult}
          />
        ) : (
          <SingleResultView loanData={loanData} result={result} />
        )}

        {/* 환율 변환 카드 (항상 표시) */}
        <ExchangeCard
          monthlyPayment={result.monthlyPayment}
          rates={rates}
          loading={loadingRates}
        />

        {/* 액션 버튼 */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.saveBtn, saved && styles.savedBtn]}
            onPress={handleSave}
            disabled={saving || saved}
          >
            {saving
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Text style={styles.saveBtnText}>{saved ? '✓ 저장됨' : '결과 저장'}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.recalcBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.recalcBtnText}>다시 계산</Text>
          </TouchableOpacity>
        </View>

        {/* 배너 광고 (결과 화면 하단) */}
        <AdBanner />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────── */
/*  단일 결과 뷰                            */
/* ─────────────────────────────────────── */
function SingleResultView({ loanData, result }) {
  const { monthlyPayment, totalInterest, totalAmount } = result;

  return (
    <>
      {/* 메인 요약 카드 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>월 상환금</Text>
        <Text style={styles.summaryAmount}>{formatKRW(monthlyPayment)}</Text>
        <Text style={styles.summaryCondition}>
          {formatNumber(loanData.principal)}원 · {loanData.interestRate}% · {loanData.period}년
        </Text>
      </View>

      {/* 상세 카드 */}
      <View style={styles.detailCard}>
        <DetailRow label="대출 원금"  value={formatKRW(loanData.principal)} />
        <DetailRow label="월 상환금"  value={formatKRW(monthlyPayment)} highlight />
        <DetailRow label="총 이자"    value={formatKRW(totalInterest)} color="#E53935" />
        <DetailRow label="총 납부액"  value={formatKRW(totalAmount)} isLast />
      </View>
    </>
  );
}

/* ─────────────────────────────────────── */
/*  비교 뷰                                */
/* ─────────────────────────────────────── */
function CompareView({ loanData, result, compareData, compareResult }) {
  const diff = {
    monthly:  Math.abs(result.monthlyPayment  - compareResult.monthlyPayment),
    interest: Math.abs(result.totalInterest   - compareResult.totalInterest),
    total:    Math.abs(result.totalAmount     - compareResult.totalAmount),
  };
  const betterMonthly  = result.monthlyPayment  <= compareResult.monthlyPayment  ? 'A' : 'B';
  const betterInterest = result.totalInterest   <= compareResult.totalInterest   ? 'A' : 'B';
  const betterTotal    = result.totalAmount     <= compareResult.totalAmount     ? 'A' : 'B';

  return (
    <>
      <Text style={styles.compareHeader}>대출 조건 비교</Text>

      <View style={styles.compareRow}>
        <CompareCard label="조건 A" data={loanData}    result={result}        color="#3F51B5" />
        <CompareCard label="조건 B" data={compareData} result={compareResult} color="#7B1FA2" />
      </View>

      <View style={styles.diffCard}>
        <Text style={styles.diffTitle}>비교 분석</Text>
        <DiffRow label="월 상환금 차이" value={formatKRW(diff.monthly)}  better={betterMonthly} />
        <DiffRow label="총 이자 차이"   value={formatKRW(diff.interest)} better={betterInterest} />
        <DiffRow label="총 납부액 차이" value={formatKRW(diff.total)}    better={betterTotal} isLast />
      </View>
    </>
  );
}

function CompareCard({ label, data, result, color }) {
  return (
    <View style={[styles.compareCard, { borderTopColor: color }]}>
      <Text style={[styles.compareCardLabel, { color }]}>{label}</Text>
      <Text style={styles.compareCardAmount}>{formatKRW(result.monthlyPayment)}</Text>
      <Text style={styles.compareCardSub}>월 상환금</Text>
      <View style={styles.compareCardDetails}>
        <Text style={styles.compareDetailText}>원금 {formatNumber(data.principal)}원</Text>
        <Text style={styles.compareDetailText}>금리 {data.interestRate}%</Text>
        <Text style={styles.compareDetailText}>기간 {data.period}년</Text>
        <Text style={[styles.compareDetailText, { color: '#E53935' }]}>
          이자 {formatKRW(result.totalInterest)}
        </Text>
      </View>
    </View>
  );
}

/* ─────────────────────────────────────── */
/*  환율 카드                               */
/* ─────────────────────────────────────── */
function ExchangeCard({ monthlyPayment, rates, loading }) {
  return (
    <View style={styles.exchangeCard}>
      <Text style={styles.exchangeTitle}>💱 환율 변환 (월 상환금 기준)</Text>
      {loading ? (
        <ActivityIndicator color="#3F51B5" style={{ padding: 20 }} />
      ) : rates ? (
        <>
          <ExchangeRow
            currency="USD" symbol="$"
            amount={convertCurrency(monthlyPayment, rates.USD)} decimals={2}
          />
          <ExchangeRow
            currency="JPY" symbol="¥"
            amount={convertCurrency(monthlyPayment, rates.JPY)} decimals={0}
          />
          <ExchangeRow
            currency="EUR" symbol="€"
            amount={convertCurrency(monthlyPayment, rates.EUR)} decimals={2} isLast
          />
        </>
      ) : (
        <Text style={styles.exchangeError}>
          환율 데이터를 불러올 수 없습니다.{'\n'}서버 연결을 확인해주세요.
        </Text>
      )}
    </View>
  );
}

/* ─────────────────────────────────────── */
/*  공통 행 컴포넌트                        */
/* ─────────────────────────────────────── */
function DetailRow({ label, value, highlight, color, isLast }) {
  return (
    <View style={[styles.detailRow, !isLast && styles.rowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[
        styles.detailValue,
        highlight && styles.detailHighlight,
        color ? { color } : null,
      ]}>
        {value}
      </Text>
    </View>
  );
}

function DiffRow({ label, value, better, isLast }) {
  return (
    <View style={[styles.detailRow, !isLast && styles.rowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.diffRight}>
        <Text style={styles.detailValue}>{value}</Text>
        <View style={styles.betterBadge}>
          <Text style={styles.betterBadgeText}>{better} 유리</Text>
        </View>
      </View>
    </View>
  );
}

function ExchangeRow({ currency, symbol, amount, decimals, isLast }) {
  const formatted = amount
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (
    <View style={[styles.exchangeRow, !isLast && styles.rowBorder]}>
      <Text style={styles.exchangeCurrency}>{currency}</Text>
      <Text style={styles.exchangeAmount}>{symbol}{formatted}</Text>
    </View>
  );
}

/* ─────────────────────────────────────── */
/*  스타일                                 */
/* ─────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4FF' },
  container: { padding: 20, paddingBottom: 40 },

  summaryCard: {
    backgroundColor: '#3F51B5',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3F51B5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  summaryLabel:     { fontSize: 14, color: '#C5CAE9', marginBottom: 8 },
  summaryAmount:    { fontSize: 34, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  summaryCondition: { fontSize: 13, color: '#9FA8DA', marginTop: 8 },

  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  detailLabel:    { fontSize: 14, color: '#757575' },
  detailValue:    { fontSize: 15, fontWeight: '600', color: '#1A237E' },
  detailHighlight:{ fontSize: 17, color: '#3F51B5', fontWeight: '700' },

  exchangeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  exchangeTitle:    { fontSize: 14, fontWeight: '700', color: '#1A237E', marginBottom: 12 },
  exchangeRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  exchangeCurrency: { fontSize: 15, fontWeight: '700', color: '#3F51B5', width: 50 },
  exchangeAmount:   { fontSize: 16, fontWeight: '600', color: '#212121' },
  exchangeError:    { fontSize: 13, color: '#9E9E9E', textAlign: 'center', paddingVertical: 16, lineHeight: 20 },

  btnRow: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  saveBtn: {
    flex: 1,
    backgroundColor: '#3F51B5',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#3F51B5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  savedBtn:     { backgroundColor: '#43A047' },
  saveBtnText:  { color: '#FFF', fontSize: 16, fontWeight: '700' },
  recalcBtn: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C5CAE9',
  },
  recalcBtnText: { color: '#3F51B5', fontSize: 16, fontWeight: '700' },

  // Compare
  compareHeader: { fontSize: 18, fontWeight: '800', color: '#1A237E', marginBottom: 14, textAlign: 'center' },
  compareRow:    { flexDirection: 'row', marginBottom: 16, gap: 12 },
  compareCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderTopWidth: 4,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  compareCardLabel:   { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  compareCardAmount:  { fontSize: 18, fontWeight: '800', color: '#1A237E', marginBottom: 2 },
  compareCardSub:     { fontSize: 11, color: '#9E9E9E', marginBottom: 10 },
  compareCardDetails: { gap: 3 },
  compareDetailText:  { fontSize: 12, color: '#616161' },

  diffCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  diffTitle: { fontSize: 14, fontWeight: '700', color: '#1A237E', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  diffRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  betterBadge:     { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  betterBadgeText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
});
