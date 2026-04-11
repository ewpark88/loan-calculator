import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getLoanHistory } from '../services/api';
import { formatNumber, formatKRW } from '../utils/loanCalculator';
import AdBanner from '../components/AdBanner';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState(null);

  const loadHistory = useCallback(async () => {
    setError(null);
    try {
      const data = await getLoanHistory();
      setHistory(data);
    } catch (err) {
      setError(err.message || '기록을 불러올 수 없습니다. 서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 화면 포커스마다 새로 로드
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadHistory();
    }, [loadHistory])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadHistory();
  }

  function handleItemPress(item) {
    navigation.navigate('LoanCalculator', {
      initialValues: {
        principal:    item.principal,
        interestRate: item.interestRate,
        period:       item.period,
      },
    });
  }

  function renderItem({ item, index }) {
    // 3개마다 배너 광고 삽입
    const showAd = index > 0 && index % 3 === 0;
    return (
      <>
        {showAd && <AdBanner style={{ marginBottom: 12 }} />}
        <HistoryCard item={item} onPress={() => handleItemPress(item)} />
      </>
    );
  }

  // ─ 로딩 중 ─
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3F51B5" />
          <Text style={styles.loadingText}>기록 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─ 오류 ─
  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { setLoading(true); loadHistory(); }}
          >
            <Text style={styles.retryBtnText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={history}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3F51B5"
            colors={['#3F51B5']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>기록이 없습니다</Text>
            <Text style={styles.emptyDesc}>
              대출을 계산하고 결과를 저장하면{'\n'}여기에 표시됩니다.
            </Text>
            <TouchableOpacity
              style={styles.calcNavBtn}
              onPress={() => navigation.navigate('LoanCalculator')}
            >
              <Text style={styles.calcNavBtnText}>계산하러 가기</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────── */
/*  히스토리 카드                           */
/* ─────────────────────────────────────── */
function HistoryCard({ item, onPress }) {
  const rawDate = item.createdAt ? item.createdAt.replace(' ', 'T') : null;
  const date = rawDate
    ? new Date(rawDate).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '-';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* 헤더 */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardAmount}>{formatKRW(item.principal)}</Text>
        <Text style={styles.cardDate}>{date}</Text>
      </View>

      {/* 조건 칩 */}
      <View style={styles.chipRow}>
        <Chip icon="📊" label={`금리 ${item.interestRate}%`} />
        <Chip icon="📅" label={`${item.period}년`} />
      </View>

      {/* 결과 요약 */}
      <View style={styles.statRow}>
        <StatCell label="월 상환금"  value={formatKRW(item.monthlyPayment)}              />
        <View style={styles.statDivider} />
        <StatCell label="총 이자"    value={formatKRW(item.totalInterest)}  color="#E53935" />
        <View style={styles.statDivider} />
        <StatCell label="총 납부액"  value={formatKRW(item.totalAmount)}               />
      </View>

      <Text style={styles.reloadHint}>↩ 탭하여 다시 계산</Text>
    </TouchableOpacity>
  );
}

function Chip({ icon, label }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function StatCell({ label, value, color }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

/* ─────────────────────────────────────── */
/*  스타일                                 */
/* ─────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4FF' },
  list: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  loadingText: { fontSize: 14, color: '#757575', marginTop: 12 },
  errorIcon:   { fontSize: 40, marginBottom: 12 },
  errorText:   { fontSize: 15, color: '#757575', textAlign: 'center', marginBottom: 20 },
  retryBtn:    { backgroundColor: '#3F51B5', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText:{ color: '#FFF', fontWeight: '700', fontSize: 14 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardAmount: { fontSize: 18, fontWeight: '800', color: '#1A237E' },
  cardDate:   { fontSize: 12, color: '#9E9E9E' },

  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF0FB',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipIcon:  { fontSize: 11, marginRight: 4 },
  chipLabel: { fontSize: 12, color: '#3F51B5', fontWeight: '600' },

  statRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 12,
  },
  statCell:    { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#E0E0E0', marginHorizontal: 4 },
  statLabel:   { fontSize: 10, color: '#9E9E9E', marginBottom: 4 },
  statValue:   { fontSize: 12, fontWeight: '700', color: '#1A237E' },

  reloadHint: { fontSize: 11, color: '#BDBDBD', textAlign: 'right', marginTop: 10 },

  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIcon:  { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A237E', marginBottom: 8 },
  emptyDesc:  { fontSize: 14, color: '#9E9E9E', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  calcNavBtn: { backgroundColor: '#3F51B5', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  calcNavBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
