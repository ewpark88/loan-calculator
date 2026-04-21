import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  calculateRealEstateLoan,
  formatNumber, formatKRW, formatManWon,
} from '../utils/loanCalculator';
import AdBanner from '../components/AdBanner';

const PRIMARY = '#3F51B5';

const ZONES = [
  { value: 'restricted', label: '투기과열지구', desc: '강남·용산 등 — LTV 최대 40%' },
  { value: 'adjusted',   label: '조정대상지역', desc: '수도권 일부 등 — LTV 최대 50%' },
  { value: 'normal',     label: '기타 지역',    desc: '비규제 지역 — LTV 최대 70%' },
];

const OWNERSHIPS = [
  { value: 'none',  label: '무주택' },
  { value: 'one',   label: '1주택' },
  { value: 'multi', label: '다주택' },
];

const PRICE_QUICK = [
  { label: '+1억',  value: 100_000_000 },
  { label: '+3억',  value: 300_000_000 },
  { label: '+5억',  value: 500_000_000 },
  { label: '+10억', value: 1_000_000_000 },
];

const INCOME_QUICK = [
  { label: '4천만',  value: 40_000_000 },
  { label: '6천만',  value: 60_000_000 },
  { label: '8천만',  value: 80_000_000 },
  { label: '1억',    value: 100_000_000 },
];

const YEAR_QUICK = [10, 20, 30, 40];

function numFmt(v) {
  return v.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function RealEstateScreen() {
  const [propertyPrice, setPropertyPrice] = useState('');
  const [zone,          setZone]          = useState('normal');
  const [ownership,     setOwnership]     = useState('none');
  const [annualIncome,  setAnnualIncome]  = useState('');
  const [existingDebt,  setExistingDebt]  = useState('0');
  const [loanRate,      setLoanRate]      = useState('');
  const [loanYears,     setLoanYears]     = useState('30');
  const [result,        setResult]        = useState(null);

  function handleCalculate() {
    const price    = Number(propertyPrice.replace(/,/g, ''));
    const income   = Number(annualIncome.replace(/,/g, ''));
    const existing = Number(existingDebt.replace(/,/g, '')) || 0;
    const rate     = Number(loanRate);
    const years    = Number(loanYears);

    if (!price || price <= 0)             return Alert.alert('입력 오류', '부동산 매매가를 입력해주세요.');
    if (!income || income <= 0)           return Alert.alert('입력 오류', '연 소득을 입력해주세요.');
    if (!rate || rate < 0.1 || rate > 30) return Alert.alert('입력 오류', '대출 금리는 0.1% ~ 30% 사이로 입력해주세요.');
    if (!years || years < 1 || years > 50) return Alert.alert('입력 오류', '대출 기간(1~50년)을 입력해주세요.');

    const res = calculateRealEstateLoan({
      propertyPrice: price, zone, ownership,
      annualIncome: income, existingMonthlyDebt: existing,
      loanRate: rate, loanYears: years,
    });
    setResult(res);
  }

  function addPrice(amount) {
    const cur = Number(propertyPrice.replace(/,/g, '')) || 0;
    setPropertyPrice(formatNumber(cur + amount));
  }

  function setIncomeQuick(amount) {
    setAnnualIncome(formatNumber(amount));
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

          {/* ── 부동산 정보 ── */}
          <SectionCard title="부동산 정보">
            <View>
              <Text style={s.label}>매매가 (원)</Text>
              <TextInput
                style={s.input}
                value={propertyPrice}
                onChangeText={v => setPropertyPrice(numFmt(v))}
                placeholder="예: 500,000,000"
                placeholderTextColor="#BDBDBD"
                keyboardType="numeric"
              />
              <View style={s.quickRow}>
                {PRICE_QUICK.map(q => (
                  <TouchableOpacity key={q.label} style={s.quickBtn} onPress={() => addPrice(q.value)}>
                    <Text style={s.quickBtnText}>{q.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={s.label}>지역 구분</Text>
              {ZONES.map(z => (
                <TouchableOpacity
                  key={z.value}
                  style={[s.radioRow, zone === z.value && s.radioRowActive]}
                  onPress={() => setZone(z.value)}
                >
                  <View style={[s.radioCircle, zone === z.value && s.radioCircleActive]}>
                    {zone === z.value && <View style={s.radioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.radioLabel, zone === z.value && s.radioLabelActive]}>{z.label}</Text>
                    <Text style={s.radioDesc}>{z.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View>
              <Text style={s.label}>주택 보유 현황</Text>
              <View style={s.segRow}>
                {OWNERSHIPS.map(o => (
                  <TouchableOpacity
                    key={o.value}
                    style={[s.segBtn, ownership === o.value && s.segBtnActive]}
                    onPress={() => setOwnership(o.value)}
                  >
                    <Text style={[s.segBtnText, ownership === o.value && s.segBtnTextActive]}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </SectionCard>

          {/* ── 소득 및 기존 부채 ── */}
          <SectionCard title="소득 및 기존 부채">
            <View>
              <Text style={s.label}>연 소득 (원)</Text>
              <TextInput
                style={s.input}
                value={annualIncome}
                onChangeText={v => setAnnualIncome(numFmt(v))}
                placeholder="예: 60,000,000"
                placeholderTextColor="#BDBDBD"
                keyboardType="numeric"
              />
              <View style={s.quickRow}>
                {INCOME_QUICK.map(q => (
                  <TouchableOpacity key={q.label} style={s.quickBtn} onPress={() => setIncomeQuick(q.value)}>
                    <Text style={s.quickBtnText}>{q.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={s.label}>기존 월 부채 상환액 (원)</Text>
              <TextInput
                style={s.input}
                value={existingDebt}
                onChangeText={v => setExistingDebt(numFmt(v))}
                placeholder="없으면 0"
                placeholderTextColor="#BDBDBD"
                keyboardType="numeric"
              />
              <View style={s.hintBox}>
                <Text style={s.hintText}>
                  💡 자동차 할부·신용대출 등 기존 대출의 월 원리금 합계를 입력하세요.
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* ── 희망 대출 조건 ── */}
          <SectionCard title="희망 대출 조건">
            <LabeledInput
              label="희망 금리 (%)"
              value={loanRate}
              onChangeText={setLoanRate}
              placeholder="예: 4.5"
              keyboardType="decimal-pad"
            />
            <View>
              <Text style={s.label}>대출 기간 (년)</Text>
              <TextInput
                style={s.input}
                value={loanYears}
                onChangeText={setLoanYears}
                placeholder="30"
                placeholderTextColor="#BDBDBD"
                keyboardType="numeric"
              />
              <View style={s.quickRow}>
                {YEAR_QUICK.map(y => (
                  <TouchableOpacity key={y} style={s.quickBtn} onPress={() => setLoanYears(String(y))}>
                    <Text style={s.quickBtnText}>{y}년</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </SectionCard>

          <TouchableOpacity style={s.calcBtn} onPress={handleCalculate} activeOpacity={0.85}>
            <Text style={s.calcBtnText}>🏠 대출 가능 금액 계산</Text>
          </TouchableOpacity>

          {result && <RealEstateResult result={result} />}

          <AdBanner style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────
 *  결과 컴포넌트
 * ───────────────────────────────────── */
function RealEstateResult({ result }) {
  const {
    propertyPrice, ltvRate, ltvMaxLoan, dsrMaxLoan,
    maxMonthlyNew, maxLoan, monthlyPayment, totalInterest,
    isLtvZero, limitedBy, loanRate, loanYears,
  } = result;

  const ltvPct      = Math.round(ltvRate * 100);
  const selfFunding = propertyPrice - maxLoan;

  return (
    <View>
      {/* 대출 가능 금액 */}
      <View style={[s.card, isLtvZero && s.alertCard]}>
        {isLtvZero ? (
          <View style={s.alertBody}>
            <Text style={s.alertIcon}>🚫</Text>
            <Text style={s.alertTitle}>주담대 제한 대상</Text>
            <Text style={s.alertDesc}>
              15억 초과 투기과열지구 아파트는{'\n'}주택담보대출이 불가합니다.
            </Text>
          </View>
        ) : (
          <>
            <View style={s.cardHeader}>
              <View style={[s.accent, { backgroundColor: '#4CAF50' }]} />
              <Text style={s.cardTitle}>대출 가능 금액</Text>
            </View>
            <View style={s.maxLoanBox}>
              <Text style={s.maxLoanLabel}>최대 대출 가능</Text>
              <Text style={s.maxLoanValue}>{formatManWon(maxLoan)}</Text>
              <Text style={s.maxLoanSub}>{formatKRW(maxLoan)}</Text>
              <View style={s.limitBadge}>
                <Text style={s.limitBadgeText}>
                  {limitedBy === 'ltv'
                    ? `LTV ${ltvPct}% 기준 적용`
                    : 'DSR 40% 기준 적용'}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      {!isLtvZero && (
        <>
          {/* 한도 상세 */}
          <SectionCard title="한도 상세 분석">
            <LimitRow
              label={`LTV 한도 (${ltvPct}%)`}
              sub={`매매가 ${formatManWon(propertyPrice)} × ${ltvPct}%`}
              value={formatManWon(ltvMaxLoan)}
              isActive={limitedBy === 'ltv'}
              color="#3F51B5"
            />
            <LimitRow
              label="DSR 한도 (40%)"
              sub={`월 신규 상환 한도 ${formatNumber(maxMonthlyNew)}원`}
              value={formatManWon(dsrMaxLoan)}
              isActive={limitedBy === 'dsr'}
              color="#00897B"
            />
          </SectionCard>

          {/* 월 상환 예상 */}
          <SectionCard title={`상환 예상 (원리금균등 ${loanRate}% / ${loanYears}년)`}>
            <ResultRow label="대출 금액"      value={formatKRW(maxLoan)} />
            <ResultRow label="월 예상 상환액" value={formatKRW(monthlyPayment)} bold />
            <ResultRow label="총 납입 이자"   value={formatKRW(totalInterest)} />
            <ResultRow label="자기 자금 필요" value={formatManWon(selfFunding)} />
          </SectionCard>

          <View style={s.disclaimer}>
            <Text style={s.disclaimerText}>
              ※ 2024년 기준 규제를 반영한 참고용 수치입니다. 실제 한도는 금융기관·신용등급·감정가에 따라 다를 수 있습니다.
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

/* ─────────────────────────────────────
 *  공통 서브 컴포넌트
 * ───────────────────────────────────── */
function SectionCard({ title, children }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.accent} />
        <Text style={s.cardTitle}>{title}</Text>
      </View>
      <View style={s.cardBody}>{children}</View>
    </View>
  );
}

function LabeledInput({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#BDBDBD"
        keyboardType={keyboardType}
      />
    </View>
  );
}

function LimitRow({ label, sub, value, isActive, color }) {
  return (
    <View style={[s.limitRow, isActive && { borderColor: color, backgroundColor: color + '0D' }]}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          {isActive && <View style={[s.activeDot, { backgroundColor: color }]} />}
          <Text style={[s.limitLabel, isActive && { color, fontWeight: '700' }]}>{label}</Text>
          {isActive && (
            <View style={[s.activeBadge, { backgroundColor: color }]}>
              <Text style={s.activeBadgeText}>제한 기준</Text>
            </View>
          )}
        </View>
        <Text style={s.limitSub}>{sub}</Text>
      </View>
      <Text style={[s.limitValue, isActive && { color }]}>{value}</Text>
    </View>
  );
}

function ResultRow({ label, value, bold }) {
  return (
    <View style={s.resultRow}>
      <Text style={s.resultLabel}>{label}</Text>
      <Text style={[s.resultValue, bold && s.resultValueBold]}>{value}</Text>
    </View>
  );
}

/* ─────────────────────────────────────
 *  스타일
 * ───────────────────────────────────── */
const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#F0F4FF' },
  container: { padding: 20, paddingBottom: 48 },

  card: {
    backgroundColor: '#FFF', borderRadius: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  accent:    { width: 4, height: 18, backgroundColor: PRIMARY, borderRadius: 2, marginRight: 10 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1A237E' },
  cardBody:  { padding: 18, gap: 14 },

  label: { fontSize: 14, fontWeight: '600', color: '#424242', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#C5CAE9', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 16, color: '#212121', backgroundColor: '#FAFBFF',
  },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  quickBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#EEF0FB', borderRadius: 10 },
  quickBtnText: { fontSize: 14, fontWeight: '600', color: PRIMARY },

  radioRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0',
    marginBottom: 8, backgroundColor: '#FAFAFA',
  },
  radioRowActive:    { borderColor: PRIMARY, backgroundColor: '#EEF0FB' },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: '#BDBDBD', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  radioCircleActive: { borderColor: PRIMARY },
  radioDot:          { width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY },
  radioLabel:        { fontSize: 15, fontWeight: '600', color: '#424242' },
  radioLabelActive:  { color: PRIMARY },
  radioDesc:         { fontSize: 13, color: '#9E9E9E', marginTop: 2 },

  segRow: { flexDirection: 'row', gap: 8 },
  segBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#C5CAE9', alignItems: 'center', backgroundColor: '#FAFBFF',
  },
  segBtnActive:    { backgroundColor: PRIMARY, borderColor: PRIMARY },
  segBtnText:      { fontSize: 13, fontWeight: '600', color: '#757575' },
  segBtnTextActive: { color: '#FFF' },

  hintBox: {
    backgroundColor: '#F3F4FF', borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderLeftColor: PRIMARY, marginTop: 8,
  },
  hintText: { fontSize: 13, color: '#3F51B5', lineHeight: 20 },

  calcBtn: {
    backgroundColor: PRIMARY, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginBottom: 20,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  calcBtnText: { fontSize: 18, fontWeight: '700', color: '#FFF' },

  alertCard:  { borderWidth: 2, borderColor: '#FF9800' },
  alertBody:  { alignItems: 'center', padding: 32 },
  alertIcon:  { fontSize: 40, marginBottom: 12 },
  alertTitle: { fontSize: 20, fontWeight: '800', color: '#E65100', marginBottom: 8 },
  alertDesc:  { fontSize: 15, color: '#BF360C', textAlign: 'center', lineHeight: 24 },

  maxLoanBox:     { alignItems: 'center', paddingVertical: 24 },
  maxLoanLabel:   { fontSize: 15, color: '#757575', marginBottom: 8 },
  maxLoanValue:   { fontSize: 36, fontWeight: '800', color: '#1A237E' },
  maxLoanSub:     { fontSize: 16, color: '#9E9E9E', marginTop: 4 },
  limitBadge:     { marginTop: 12, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#EEF0FB', borderRadius: 20 },
  limitBadgeText: { fontSize: 13, fontWeight: '600', color: PRIMARY },

  limitRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0',
  },
  activeDot:        { width: 8, height: 8, borderRadius: 4 },
  limitLabel:       { fontSize: 15, fontWeight: '600', color: '#424242' },
  limitSub:         { fontSize: 13, color: '#9E9E9E', marginTop: 2 },
  limitValue:       { fontSize: 18, fontWeight: '700', color: '#212121' },
  activeBadge:      { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  activeBadgeText:  { fontSize: 11, fontWeight: '700', color: '#FFF' },

  resultRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  resultLabel:     { fontSize: 15, color: '#616161' },
  resultValue:     { fontSize: 15, fontWeight: '600', color: '#212121' },
  resultValueBold: { fontSize: 18, fontWeight: '800', color: '#1A237E' },

  disclaimer: {
    backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#FFE082',
  },
  disclaimerText: { fontSize: 12, color: '#795548', lineHeight: 18 },
});
