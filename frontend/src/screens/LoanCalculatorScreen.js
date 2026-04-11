import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calculateLoan, formatNumber, formatManWon } from '../utils/loanCalculator';

const EMPTY_LOAN = { principal: '', interestRate: '', period: '' };

// 빠른 금액 버튼 (만원 단위)
const QUICK_AMOUNTS = [
  { label: '+100만', value: 100 },
  { label: '+500만', value: 500 },
  { label: '+1,000만', value: 1000 },
  { label: '+1억', value: 10000 },
];

export default function LoanCalculatorScreen({ navigation, route }) {
  const [loan1, setLoan1] = useState(EMPTY_LOAN);
  const [loan2, setLoan2] = useState(EMPTY_LOAN);
  const [compareMode, setCompareMode] = useState(false);

  // 기록 화면에서 값 복원 (원 → 만원 변환)
  useEffect(() => {
    if (route.params?.initialValues) {
      const { principal, interestRate, period } = route.params.initialValues;
      setLoan1({
        principal:    String(Math.round(Number(principal) / 10000)),
        interestRate: String(interestRate),
        period:       String(period),
      });
    }
  }, [route.params]);

  function validate(loan, label) {
    const { principal, interestRate, period } = loan;
    if (!principal || !interestRate || !period) {
      Alert.alert('입력 오류', `${label}의 모든 항목을 입력해주세요.`);
      return null;
    }
    const p = Number(String(principal).replace(/,/g, '')) * 10000; // 만원 → 원
    const r = Number(interestRate);
    const y = Number(period);

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
    return { p, r, y };
  }

  function handleCalculate() {
    const v1 = validate(loan1, '대출 조건 A');
    if (!v1) return;

    const params = {
      loanData: { principal: v1.p, interestRate: v1.r, period: v1.y },
      result:   calculateLoan(v1.p, v1.r, v1.y),
    };

    if (compareMode) {
      const v2 = validate(loan2, '대출 조건 B');
      if (!v2) return;
      params.compareData   = { principal: v2.p, interestRate: v2.r, period: v2.y };
      params.compareResult = calculateLoan(v2.p, v2.r, v2.y);
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

          <TouchableOpacity style={styles.calcBtn} onPress={handleCalculate}>
            <Text style={styles.calcBtnText}>
              {compareMode ? '비교 계산하기' : '계산하기'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.hint}>※ 원리금 균등 상환 방식 기준</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ──────────────────────────────────── */
/*  대출 입력 그룹                       */
/* ──────────────────────────────────── */
function LoanInputGroup({ data, onChange }) {
  const principalWon = Number(data.principal || 0) * 10000;
  const principalLabel = principalWon > 0 ? formatManWon(principalWon) : null;

  function addPrincipal(man) {
    const current = Number(data.principal || 0);
    onChange(prev => ({ ...prev, principal: String(current + man) }));
  }

  function clearPrincipal() {
    onChange(prev => ({ ...prev, principal: '' }));
  }

  return (
    <View style={styles.inputCard}>
      {/* 대출 금액 (만원 단위) */}
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

      {/* 억/만원 환산 힌트 */}
      {principalLabel ? (
        <View style={styles.principalHintRow}>
          <Text style={styles.principalHint}>= {principalLabel}</Text>
        </View>
      ) : null}

      {/* 빠른 금액 버튼 */}
      <View style={styles.quickRow}>
        {QUICK_AMOUNTS.map(({ label, value }) => (
          <TouchableOpacity
            key={label}
            style={styles.quickBtn}
            onPress={() => addPrincipal(value)}
          >
            <Text style={styles.quickBtnText}>{label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.quickBtnClear} onPress={clearPrincipal}>
          <Text style={styles.quickBtnClearText}>초기화</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputDivider} />

      {/* 연 이자율 */}
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

      {/* 대출 기간 */}
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
    </View>
  );
}

/* ──────────────────────────────────── */
/*  스타일                               */
/* ──────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4FF' },
  container: { padding: 20, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: '#3F51B5',
    marginBottom: 8, marginTop: 4,
  },

  inputCard: {
    backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15,
  },
  inputDivider: { height: 1, backgroundColor: '#F5F5F5', marginHorizontal: 0 },
  inputLabel: { flex: 1, fontSize: 15, color: '#424242', fontWeight: '500' },
  inputRight: { flexDirection: 'row', alignItems: 'center' },
  input: {
    minWidth: 120, textAlign: 'right',
    fontSize: 16, color: '#1A237E', fontWeight: '600', paddingVertical: 0,
  },
  inputUnit: { fontSize: 14, color: '#9E9E9E', marginLeft: 6, width: 26 },

  principalHintRow: {
    paddingHorizontal: 16, paddingBottom: 8, marginTop: -4,
  },
  principalHint: { fontSize: 12, color: '#7986CB', fontWeight: '600' },

  quickRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16, paddingBottom: 14,
  },
  quickBtn: {
    backgroundColor: '#EEF0FB', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  quickBtnText: { fontSize: 12, color: '#3F51B5', fontWeight: '700' },
  quickBtnClear: {
    backgroundColor: '#FFF3E0', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  quickBtnClearText: { fontSize: 12, color: '#F57C00', fontWeight: '700' },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: '#1A237E' },
  toggleDesc: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },

  calcBtn: {
    backgroundColor: '#3F51B5', borderRadius: 16, padding: 18,
    alignItems: 'center', marginTop: 4,
    shadowColor: '#3F51B5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  calcBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },

  hint: { fontSize: 12, color: '#BDBDBD', textAlign: 'center', marginTop: 14 },
});
