import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FEATURES = [
  '원리금 균등 상환 방식 월 상환금 계산',
  'USD · JPY · EUR 실시간 환율 변환',
  '두 가지 대출 조건 동시 비교',
  '계산 기록 저장 및 재사용',
];

export default function HomeScreen({ navigation }) {
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
            원리금 균등 상환  ·  환율 변환  ·  조건 비교
          </Text>
        </View>

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

        {/* 기능 소개 카드 */}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4FF' },
  container: { padding: 20, paddingBottom: 40 },

  hero: { alignItems: 'center', paddingVertical: 28 },
  heroIcon: { fontSize: 56, marginBottom: 12 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#1A237E', marginBottom: 6 },
  heroSubtitle: { fontSize: 13, color: '#7986CB', textAlign: 'center' },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3F51B5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#3F51B5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#C5CAE9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  btnIcon: { fontSize: 28, marginRight: 14 },
  btnTextWrap: { flex: 1 },
  primaryBtnTitle: { fontSize: 17, fontWeight: '700', color: '#FFF', marginBottom: 3 },
  primaryBtnSub: { fontSize: 13, color: '#C5CAE9' },
  secondaryBtnTitle: { fontSize: 17, fontWeight: '700', color: '#1A237E', marginBottom: 3 },
  secondaryBtnSub: { fontSize: 13, color: '#9E9E9E' },
  arrowWhite: { fontSize: 26, color: '#FFF', fontWeight: '300' },
  arrowBlue: { fontSize: 26, color: '#3F51B5', fontWeight: '300' },

  featuresCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  featuresTitle: { fontSize: 15, fontWeight: '700', color: '#1A237E', marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  featureBullet: { fontSize: 14, color: '#3F51B5', marginRight: 10, fontWeight: '700' },
  featureText: { fontSize: 14, color: '#424242' },
});
