import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calculateLoanByType, formatNumber, formatManWon } from '../utils/loanCalculator';
import AdBanner from '../components/AdBanner';

/* ──────────────────────────────────── */
/*  대출 방식 정의                       */
/* ──────────────────────────────────── */
const LOAN_TYPES = [
  {
    key: 'annuity',
    label: '원리금균등',
    desc: '총 이자와 원금을 기간으로 나누어 매달 균등하게 같은 금액을 납부합니다.',
    hasGrace: true,
  },
  {
    key: 'equalPrincipal',
    label: '원금균등',
    desc: '매달 같은 비율로 원금을 상환합니다. 이자는 남은 잔액만큼 내므로 원금이 상환되는 만큼 점점 줄어듭니다. 즉 시간이 지날수록 납부금액이 줄어드는 방식입니다.',
    hasGrace: true,
  },
  {
    key: 'bullet',
    label: '만기일시',
    desc: '원금은 만기에 전액 상환하고 그 전까진 이자만 납입합니다.',
    hasGrace: false,
  },
  {
    key: 'graduated',
    label: '체증식',
    desc: '상환액을 일정하게 증가시키며 납부합니다. 초기엔 적은 금액을, 시간이 지날수록 많은 금액을 납부합니다. 보금자리론 등 일부 특수 대출에만 적용되는 방식입니다.',
    hasGrace: true,
  },
];

const EMPTY_LOAN = {
  principal: '',
  interestRate: '',
  period: '',
  loanType: 'annuity',
  gracePeriod: '',
};

// 빠른 금액 버튼 (만원 단위)
const QUICK_AMOUNTS = [
  { label: '+100만', value: 100 },
  { label: '+500만', value: 500 },
  { label: '+1,000만', value: 1000 },
  { label: '+1억', value: 10000 },
];

// 거치기간 빠른 선택
const GRACE_QUICK = [
  { label: '없음', value: 0 },
  { label: '1년', value: 1 },
  { label: '3년', value: 3 },
  { label: '5년', value: 5 },
];

export default function LoanCalculatorScreen({ navigation, route }) {
  const [loan1, setLoan1] = useState(EMPTY_LOAN);
  const [loan2, setLoan2] = useState(EMPTY_LOAN);
  const [compareMode, setCompareMode] = useState(false);

  // 기록 화면에서 값 복원
  useEffect(() => {
    if (route.params?.initialValues) {
      const { principal, interestRate, period, loanType, gracePeriod } = route.params.initialValues;
      setLoan1({
        principal:    String(Math.round(Number(principal) / 10000)),
        interestRate: String(interestRate),
        period:       String(period),
        loanType:     loanType || 'annuity',
        gracePeriod:  gracePeriod ? String(gracePeriod) : '',
      });
    }
  }, [route.params]);

  function validate(loan, label) {
    const { principal, interestRate, period, loanType, gracePeriod } = loan;
    if (!principal || !interestRate || !period) {
      Alert.alert('입력 오류', `${label}의 모든 항목을 입력해주세요.`);
      return null;
    }
    const p = Number(String(principal).replace(/,/g, '')) * 10000;
    const r = Number(interestRate);
    const y = Number(period);
    const g = Number(gracePeriod || 0);

    if (p <= 0 || r < 0 || y <= 0) {
      Alert.alert('입력 오류', `${label}에 올바른 값을 입력해주세요.`);
      return null;
    }
    if (r > 100) {
      Alert.alert('입력 오류', '이자율은 100% 이하로 입력해주세요.');
      return null;
    }
    if (y > 50) {
      Alert.alert('입력 오류', '대출 기간은 50년 이하로 입력해주세요.');
      return null;
    }
    if (!Number.isInteger(g) || g < 0) {
      Alert.alert('입력 오류', '거치기간은 0 이상의 정수(년)를 입력해주세요.');
      return null;
    }
    if (g >= y) {
      Alert.alert('입력 오류', '거치기간은 대출 기간보다 짧아야 합니다.');
      return null;
    }
    return { p, r, y, type: loanType, grace: g };
  }

  function handleCalculate() {
    const v1 = validate(loan1, '대출 조건 A');
    if (!v1) return;

    const params = {
      loanData: {
        principal:    v1.p,
        interestRate: v1.r,
        period:       v1.y,
        loanType:     v1.type,
        gracePeriod:  v1.grace,
      },
      result: calculateLoanByType(v1.p, v1.r, v1.y, v1.type, v1.grace),
    };

    if (compareMode) {
      const v2 = validate(loan2, '대출 조건 B');
      if (!v2) return;
      params.compareData = {
        principal:    v2.p,
        interestRate: v2.r,
        period:       v2.y,
        loanType:     v2.type,
        gracePeriod:  v2.grace,
      };
      params.compareResult = calculateLoanByType(v2.p, v2.r, v2.y, v2.type, v2.grace);
    }

    navigation.navigate('Result', params);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionLabel}>
            {compareMode ? '📌 대출 조건 A' : '📌 대출 정보 입력'}
          </Text>
          <LoanInputGroup data={loan1} onChange={setLoan1} />

          {/* 비교 모드 토글 */}
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>비교 모드</Text>
              <Text style={styles.toggleDesc}>두 가지 조건을 동시에 비교합니다</Text>
            </View>
            <Switch
              value={compareMode}
              onValueChange={setCompareMode}
              trackColor={{ false: '#E0E0E0', true: '#7986CB' }}
              thumbColor={compareMode ? '#3F51B5' : '#BDBDBD'}
            />
          </View>

          {compareMode && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 4 }]}>📌 대출 조건 B</Text>
              <LoanInputGroup data={loan2} onChange={setLoan2} />
            </>
          )}

          <AdBanner style={{ marginBottom: 14 }} />

          <TouchableOpacity style={styles.calcBtn} onPress={handleCalculate}>
            <Text style={styles.calcBtnText}>
              {compareMode ? '비교 계산하기' : '계산하기'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ──────────────────────────────────── */
/*  대출 입력 그룹                       */
/* ──────────────────────────────────── */
function LoanInputGroup({ data, onChange }) {
  const principalWon   = Number(data.principal || 0) * 10000;
  const principalLabel = principalWon > 0 ? formatManWon(principalWon) : null;

  const selectedType = LOAN_TYPES.find(t => t.key === data.loanType) || LOAN_TYPES[0];

  function addPrincipal(man) {
    const current = Number(data.principal || 0);
    onChange(prev => ({ ...prev, principal: String(current + man) }));
  }
  function clearPrincipal() {
    onChange(prev => ({ ...prev, principal: '' }));
  }
  function setGrace(val) {
    onChange(prev => ({ ...prev, gracePeriod: val === 0 ? '' : String(val) }));
  }
  function setLoanType(key) {
    onChange(prev => ({ ...prev, loanType: key, gracePeriod: '' }));
  }

  return (
    <View style={styles.inputCard}>
      {/* ── 대출 방식 선택 (2×2 격자) ── */}
      <View style={styles.typeSection}>
        <Text style={styles.typeSectionLabel}>상환 방식</Text>

        <View style={styles.typeSegmentWrap}>
        {/* 상단 2개 */}
        <View style={styles.typeSegmentRow}>
          {LOAN_TYPES.slice(0, 2).map((t, idx) => {
            const isActive = data.loanType === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.typeSegmentBtn,
                  isActive && styles.typeSegmentBtnActive,
                  idx === 0 && styles.typeSegmentBorderRight,
                  styles.typeSegmentBorderBottom,
                ]}
                onPress={() => setLoanType(t.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeSegmentText, isActive && styles.typeSegmentTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 하단 2개 */}
        <View style={styles.typeSegmentRow}>
          {LOAN_TYPES.slice(2, 4).map((t, idx) => {
            const isActive = data.loanType === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.typeSegmentBtn,
                  isActive && styles.typeSegmentBtnActive,
                  idx === 0 && styles.typeSegmentBorderRight,
                ]}
                onPress={() => setLoanType(t.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeSegmentText, isActive && styles.typeSegmentTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        </View>{/* end typeSegmentWrap */}

        {/* 방식 설명 */}
        <View style={styles.typeDescBox}>
          <Text style={styles.typeDescText}>{selectedType.desc}</Text>
        </View>
      </View>

      <View style={styles.inputDivider} />

      {/* ── 대출 금액 (만원 단위) ── */}
      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>대출 금액</Text>
        <View style={styles.inputRight}>
          <TextInput
            style={styles.input}
            placeholder="예: 10,000"
            placeholderTextColor="#BDBDBD"
            value={data.principal}
            onChangeText={v => onChange(prev => ({ ...prev, principal: v }))}
            keyboardType="numeric"
            returnKeyType="done"
          />
          <Text style={styles.inputUnit}>만원</Text>
        </View>
      </View>

      {principalLabel ? (
        <View style={styles.principalHintRow}>
          <Text style={styles.principalHint}>= {principalLabel}</Text>
        </View>
      ) : null}

      {/* 빠른 금액 버튼 */}
      <View style={styles.quickRow}>
        {QUICK_AMOUNTS.map(({ label, value }) => (
          <TouchableOpacity key={label} style={styles.quickBtn} onPress={() => addPrincipal(value)}>
            <Text style={styles.quickBtnText}>{label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.quickBtnClear} onPress={clearPrincipal}>
          <Text style={styles.quickBtnClearText}>초기화</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputDivider} />

      {/* ── 연 이자율 ── */}
      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>연 이자율</Text>
        <View style={styles.inputRight}>
          <TextInput
            style={styles.input}
            placeholder="예: 3.5"
            placeholderTextColor="#BDBDBD"
            value={data.interestRate}
            onChangeText={v => onChange(prev => ({ ...prev, interestRate: v }))}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
          <Text style={styles.inputUnit}>%</Text>
        </View>
      </View>

      <View style={styles.inputDivider} />

      {/* ── 대출 기간 ── */}
      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>대출 기간</Text>
        <View style={styles.inputRight}>
          <TextInput
            style={styles.input}
            placeholder="예: 10"
            placeholderTextColor="#BDBDBD"
            value={data.period}
            onChangeText={v => onChange(prev => ({ ...prev, period: v }))}
            keyboardType="numeric"
            returnKeyType="done"
          />
          <Text style={styles.inputUnit}>년</Text>
        </View>
      </View>

      {/* ── 거치기간 (만기일시 제외) ── */}
      {selectedType.hasGrace && (
        <>
          <View style={styles.inputDivider} />
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>거치기간</Text>
            <View style={styles.inputRight}>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#BDBDBD"
                value={data.gracePeriod}
                onChangeText={v => onChange(prev => ({ ...prev, gracePeriod: v }))}
                keyboardType="numeric"
                returnKeyType="done"
              />
              <Text style={styles.inputUnit}>년</Text>
            </View>
          </View>
          <View style={styles.quickRow}>
            {GRACE_QUICK.map(({ label, value }) => {
              const isActive = (Number(data.gracePeriod || 0) === value);
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.graceBtn, isActive && styles.graceBtnActive]}
                  onPress={() => setGrace(value)}
                >
                  <Text style={[styles.graceBtnText, isActive && styles.graceBtnTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

/* ──────────────────────────────────── */
/*  스타일                               */
/* ──────────────────────────────────── */
const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#F4FAF8' },
  container: { padding: 20, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 17, fontWeight: '700', color: '#1B998B',
    marginBottom: 8, marginTop: 4,
  },

  inputCard: {
    backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
    overflow: 'hidden',
  },

  // ── 대출 방식 선택 (2×2 세그먼트) ──
  typeSection: { padding: 16, paddingBottom: 12 },
  typeSectionLabel: {
    fontSize: 17, fontWeight: '600', color: '#557668', marginBottom: 10,
  },

  typeSegmentWrap: {
    borderWidth: 1, borderColor: '#C5E8E2', borderRadius: 12, overflow: 'hidden',
  },
  typeSegmentRow: { flexDirection: 'row' },
  typeSegmentBtn: {
    flex: 1, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0FDF9',
  },
  typeSegmentBtnActive:    { backgroundColor: '#1B998B' },
  typeSegmentBorderRight:  { borderRightWidth: 1,  borderRightColor:  '#C5E8E2' },
  typeSegmentBorderBottom: { borderBottomWidth: 1, borderBottomColor: '#C5E8E2' },
  typeSegmentText:         { fontSize: 16, fontWeight: '700', color: '#557668' },
  typeSegmentTextActive:   { color: '#FFF' },

  typeDescBox:  { marginTop: 12, backgroundColor: '#F0FDF9', borderRadius: 12, padding: 14 },
  typeDescText: { fontSize: 16, color: '#557668', lineHeight: 25 },

  // ── 입력 공통 ──
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 17,
  },
  inputDivider: { height: 1, backgroundColor: '#F5F5F5' },
  inputLabel:   { flex: 1, fontSize: 17, color: '#333', fontWeight: '500' },
  inputRight:   { flexDirection: 'row', alignItems: 'center' },
  input: {
    minWidth: 120, textAlign: 'right',
    fontSize: 18, color: '#1A2E28', fontWeight: '600', paddingVertical: 0,
  },
  inputUnit: { fontSize: 16, color: '#9E9E9E', marginLeft: 8, width: 30 },

  principalHintRow: { paddingHorizontal: 18, paddingBottom: 10, marginTop: -4 },
  principalHint:    { fontSize: 15, color: '#557668', fontWeight: '600' },

  quickRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 18, paddingBottom: 16,
  },
  quickBtn: {
    backgroundColor: '#E3F7F4', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9,
  },
  quickBtnText:      { fontSize: 15, color: '#1B998B', fontWeight: '700' },
  quickBtnClear: {
    backgroundColor: '#FFF3E0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9,
  },
  quickBtnClearText: { fontSize: 15, color: '#F57C00', fontWeight: '700' },

  // ── 거치기간 빠른 선택 ──
  graceBtn: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#C5E8E2', backgroundColor: '#FFF',
  },
  graceBtnActive:    { backgroundColor: '#1B998B', borderColor: '#1B998B' },
  graceBtnText:      { fontSize: 15, color: '#557668', fontWeight: '600' },
  graceBtnTextActive:{ color: '#FFF' },

  // ── 하단 ──
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  toggleLabel: { fontSize: 18, fontWeight: '600', color: '#1A2E28' },
  toggleDesc:  { fontSize: 15, color: '#9E9E9E', marginTop: 3 },

  calcBtn: {
    backgroundColor: '#FF6B35', borderRadius: 16, padding: 20,
    alignItems: 'center', marginTop: 4,
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  calcBtnText: { color: '#FFF', fontSize: 20, fontWeight: '700', letterSpacing: 0.3 },
});
