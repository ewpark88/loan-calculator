import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  calculateEarlyRepayment,
  formatNumber, formatKRW,
} from '../utils/loanCalculator';
import AdBanner from '../components/AdBanner';

const PRIMARY = '#1B998B';

const LOAN_TYPES = [
  { value: 'annuity',        label: '원리금균등' },
  { value: 'equalPrincipal', label: '원금균등' },
  { value: 'bullet',         label: '만기일시' },
  { value: 'graduated',      label: '체증식' },
];

const PAID_QUICK = [
  { label: '6개월', value: 6 },
  { label: '1년',   value: 12 },
  { label: '2년',   value: 24 },
  { label: '3년',   value: 36 },
  { label: '5년',   value: 60 },
];

const REPAY_QUICK = [
  { label: '+100만',   value: 1_000_000 },
  { label: '+500만',   value: 5_000_000 },
  { label: '+1,000만', value: 10_000_000 },
  { label: '+1억',     value: 100_000_000 },
];

function numFmt(v) {
  return v.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function EarlyRepaymentScreen() {
  const [principal,   setPrincipal]   = useState('');
  const [rate,        setRate]        = useState('');
  const [years,       setYears]       = useState('');
  const [loanType,    setLoanType]    = useState('annuity');
  const [gracePeriod, setGracePeriod] = useState('0');
  const [paidMonths,  setPaidMonths]  = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [result,      setResult]      = useState(null);

  function handleCalculate() {
    const p     = Number(principal.replace(/,/g, ''));
    const r     = Number(rate);
    const y     = Number(years);
    const g     = Number(gracePeriod) || 0;
    const paid  = Number(paidMonths);
    const repay = Number(repayAmount.replace(/,/g, ''));

    if (!p || p <= 0)              return Alert.alert('입력 오류', '대출 원금을 입력해주세요.');
    if (!r || r < 0.1 || r > 30)  return Alert.alert('입력 오류', '연 이자율은 0.1% ~ 30% 사이로 입력해주세요.');
    if (!y || y < 1 || y > 50)    return Alert.alert('입력 오류', '대출 기간(1~50년)을 입력해주세요.');
    if (!paid || paid < 1)         return Alert.alert('입력 오류', '납부 경과 개월 수를 입력해주세요.');
    if (!repay || repay <= 0)      return Alert.alert('입력 오류', '중도상환 금액을 입력해주세요.');

    const res = calculateEarlyRepayment({
      principal: p, annualRate: r, years: y,
      loanType, gracePeriod: g,
      paidMonths: paid, repayAmount: repay,
    });

    if (res.error) return Alert.alert('계산 오류', res.error);
    setResult(res);
  }

  function addRepay(amount) {
    const cur = Number(repayAmount.replace(/,/g, '')) || 0;
    setRepayAmount(formatNumber(cur + amount));
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

          {/* ── 대출 정보 ── */}
          <SectionCard title="현재 대출 정보">
            <LabeledInput
              label="대출 원금 (원)"
              value={principal}
              onChangeText={v => setPrincipal(numFmt(v))}
              placeholder="예: 300,000,000"
              keyboardType="numeric"
            />
            <LabeledInput
              label="연 이자율 (%)"
              value={rate}
              onChangeText={setRate}
              placeholder="예: 3.5"
              keyboardType="decimal-pad"
            />
            <LabeledInput
              label="대출 기간 (년)"
              value={years}
              onChangeText={setYears}
              placeholder="예: 30"
              keyboardType="numeric"
            />

            <Text style={s.label}>상환 방식</Text>
            <View style={s.typeRow}>
              {LOAN_TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  style={[s.typeBtn, loanType === t.value && s.typeBtnActive]}
                  onPress={() => setLoanType(t.value)}
                >
                  <Text style={[s.typeBtnText, loanType === t.value && s.typeBtnTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {loanType !== 'bullet' && (
              <LabeledInput
                label="거치기간 (년)"
                value={gracePeriod}
                onChangeText={setGracePeriod}
                placeholder="0"
                keyboardType="numeric"
              />
            )}
          </SectionCard>

          {/* ── 납부 현황 ── */}
          <SectionCard title="현재 납부 현황">
            <LabeledInput
              label="납부 경과 개월 수"
              value={paidMonths}
              onChangeText={setPaidMonths}
              placeholder="예: 24"
              keyboardType="numeric"
            />
            <View style={s.quickRow}>
              {PAID_QUICK.map(q => (
                <TouchableOpacity key={q.label} style={s.quickBtn} onPress={() => setPaidMonths(String(q.value))}>
                  <Text style={s.quickBtnText}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </SectionCard>

          {/* ── 중도상환 금액 ── */}
          <SectionCard title="중도상환 금액">
            <LabeledInput
              label="상환할 금액 (원)"
              value={repayAmount}
              onChangeText={v => setRepayAmount(numFmt(v))}
              placeholder="예: 50,000,000"
              keyboardType="numeric"
            />
            <View style={s.quickRow}>
              {REPAY_QUICK.map(q => (
                <TouchableOpacity key={q.label} style={s.quickBtn} onPress={() => addRepay(q.value)}>
                  <Text style={s.quickBtnText}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </SectionCard>

          <TouchableOpacity style={s.calcBtn} onPress={handleCalculate} activeOpacity={0.85}>
            <Text style={s.calcBtnText}>🔢 절감 효과 계산</Text>
          </TouchableOpacity>

          {result && <EarlyRepaymentResult result={result} />}

          <AdBanner style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────
 *  결과 컴포넌트
 * ───────────────────────────────────── */
function EarlyRepaymentResult({ result }) {
  const {
    currentBalance, newBalance, repayAmount,
    originalRemainingInterest, originalRemainingMonths,
    fullyRepaid, reduceTerm, reducePayment,
  } = result;

  return (
    <View>
      {/* 현황 요약 */}
      <SectionCard title="중도상환 효과" accentColor="#E91E63">
        <SummaryRow label="현재 잔여 원금"   value={formatKRW(currentBalance)} />
        <SummaryRow label="중도상환 금액"    value={`- ${formatKRW(repayAmount)}`} valueColor="#E91E63" />
        <View style={s.divider} />
        <SummaryRow label="상환 후 잔여 원금" value={formatKRW(newBalance)} bold />
        <SummaryRow label="원래 잔여 이자"   value={formatKRW(originalRemainingInterest)} />
        <SummaryRow
          label="잔여 기간"
          value={`${Math.floor(originalRemainingMonths / 12)}년 ${originalRemainingMonths % 12}개월`}
        />
      </SectionCard>

      {fullyRepaid ? (
        <View style={s.fullRepaidCard}>
          <Text style={s.fullRepaidIcon}>🎉</Text>
          <Text style={s.fullRepaidTitle}>대출 완전 상환!</Text>
          <Text style={s.fullRepaidDesc}>
            {formatKRW(repayAmount)} 중도상환으로{'\n'}잔여 이자{' '}
            {formatKRW(originalRemainingInterest)}를 모두 절감했습니다.
          </Text>
        </View>
      ) : (
        <>
          <Text style={s.optionTitle}>📊 중도상환 후 선택 옵션</Text>

          <OptionCard
            title="기간 단축"
            icon="⏱️"
            color="#3F51B5"
            bg="#EEF0FB"
            items={[
              { label: '월 납입금', value: `${formatKRW(reduceTerm.newMonthlyPayment)} (유지)` },
              {
                label: '새 잔여 기간',
                value: `${Math.floor(reduceTerm.newRemainingMonths / 12)}년 ${reduceTerm.newRemainingMonths % 12}개월`,
              },
              {
                label: '기간 단축',
                value: `${Math.floor(reduceTerm.monthsReduced / 12)}년 ${reduceTerm.monthsReduced % 12}개월 ↓`,
                highlight: true,
              },
              { label: '잔여 이자',  value: formatKRW(reduceTerm.newRemainingInterest) },
              { label: '이자 절감',  value: formatKRW(reduceTerm.interestSaved), highlight: true },
            ]}
          />

          <OptionCard
            title="납입금 감소"
            icon="💸"
            color="#00897B"
            bg="#E0F2F1"
            items={[
              { label: '새 월 납입금', value: formatKRW(reducePayment.newMonthlyPayment) },
              {
                label: '월 납입금 감소',
                value: `${formatKRW(reducePayment.monthlyReduced)}/월 ↓`,
                highlight: true,
              },
              {
                label: '잔여 기간',
                value: `${Math.floor(reducePayment.newRemainingMonths / 12)}년 ${reducePayment.newRemainingMonths % 12}개월 (유지)`,
              },
              { label: '잔여 이자', value: formatKRW(reducePayment.newRemainingInterest) },
              { label: '이자 절감', value: formatKRW(reducePayment.interestSaved), highlight: true },
            ]}
          />

          <View style={s.tipCard}>
            <Text style={s.tipTitle}>💡 어떤 옵션이 유리할까요?</Text>
            <Text style={s.tipText}>
              {reduceTerm.interestSaved >= reducePayment.interestSaved
                ? `기간 단축이 이자를 ${formatKRW(reduceTerm.interestSaved - reducePayment.interestSaved)} 더 절감합니다.`
                : `납입금 감소가 이자를 ${formatKRW(reducePayment.interestSaved - reduceTerm.interestSaved)} 더 절감합니다.`
              }
            </Text>
            <Text style={s.tipText}>• 기간 단축 — 빠른 완전 상환 목표에 적합</Text>
            <Text style={s.tipText}>• 납입금 감소 — 월 부담을 줄이고 싶을 때 적합</Text>
          </View>
        </>
      )}
    </View>
  );
}

/* ─────────────────────────────────────
 *  공통 서브 컴포넌트
 * ───────────────────────────────────── */
function SectionCard({ title, accentColor, children }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.accent, accentColor && { backgroundColor: accentColor }]} />
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

function SummaryRow({ label, value, valueColor, bold }) {
  return (
    <View style={s.summaryRow}>
      <Text style={s.summaryLabel}>{label}</Text>
      <Text style={[s.summaryValue, bold && s.summaryValueBold, valueColor && { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}

function OptionCard({ title, icon, color, bg, items }) {
  return (
    <View style={[s.optionCard, { backgroundColor: bg, borderColor: color + '50' }]}>
      <View style={[s.optionCardHeader, { borderBottomColor: color + '30' }]}>
        <Text style={s.optionCardIcon}>{icon}</Text>
        <Text style={[s.optionCardTitle, { color }]}>{title}</Text>
      </View>
      {items.map((item, i) => (
        <View key={i} style={[s.optionRow, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: color + '20' }]}>
          <Text style={s.optionLabel}>{item.label}</Text>
          <Text style={[s.optionValue, item.highlight && { color, fontWeight: '700' }]}>
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ─────────────────────────────────────
 *  스타일
 * ───────────────────────────────────── */
const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#F4FAF8' },
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
  accent:    { width: 4, height: 20, backgroundColor: PRIMARY, borderRadius: 2, marginRight: 10 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1A2E28' },
  cardBody:  { padding: 18, gap: 14 },

  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#C5E8E2', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 17, color: '#1A2E28', backgroundColor: '#F8FFFE',
  },

  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#C5E8E2', alignItems: 'center', backgroundColor: '#F8FFFE',
  },
  typeBtnActive:     { backgroundColor: PRIMARY, borderColor: PRIMARY },
  typeBtnText:       { fontSize: 15, fontWeight: '600', color: '#557668' },
  typeBtnTextActive: { color: '#FFF' },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: { paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#E3F7F4', borderRadius: 10 },
  quickBtnText: { fontSize: 15, fontWeight: '600', color: PRIMARY },

  calcBtn: {
    backgroundColor: '#FF6B35', borderRadius: 16, paddingVertical: 19,
    alignItems: 'center', marginBottom: 20,
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  calcBtnText: { fontSize: 20, fontWeight: '700', color: '#FFF' },

  summaryRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel:     { fontSize: 16, color: '#557668' },
  summaryValue:     { fontSize: 16, fontWeight: '600', color: '#1A2E28' },
  summaryValueBold: { fontSize: 19, fontWeight: '800', color: PRIMARY },
  divider:          { height: 1, backgroundColor: '#EEEEEE', marginVertical: 4 },

  optionTitle: { fontSize: 18, fontWeight: '700', color: '#1A2E28', marginBottom: 10 },
  optionCard:  { borderRadius: 16, marginBottom: 14, borderWidth: 1.5, overflow: 'hidden' },
  optionCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16, borderBottomWidth: 1,
  },
  optionCardIcon:  { fontSize: 26 },
  optionCardTitle: { fontSize: 18, fontWeight: '700' },
  optionRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  optionLabel:     { fontSize: 15, color: '#555' },
  optionValue:     { fontSize: 15, fontWeight: '600', color: '#1A2E28' },

  tipCard: {
    backgroundColor: '#FFFBEB', borderRadius: 14, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: '#F9A825',
  },
  tipTitle: { fontSize: 17, fontWeight: '700', color: '#E65100', marginBottom: 10 },
  tipText:  { fontSize: 15, color: '#4E342E', lineHeight: 24 },

  fullRepaidCard: {
    alignItems: 'center', padding: 32, borderRadius: 18,
    backgroundColor: '#E8F5E9', borderWidth: 1.5, borderColor: '#4CAF50', marginBottom: 14,
  },
  fullRepaidIcon:  { fontSize: 52, marginBottom: 12 },
  fullRepaidTitle: { fontSize: 24, fontWeight: '800', color: '#1B5E20', marginBottom: 8 },
  fullRepaidDesc:  { fontSize: 17, color: '#2E7D32', textAlign: 'center', lineHeight: 26 },
});
