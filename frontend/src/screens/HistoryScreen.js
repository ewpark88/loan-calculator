import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getLocalHistory, deleteLocalHistory } from '../services/localHistory';
import { formatKRW, formatManWon } from '../utils/loanCalculator';
import AdBanner from '../components/AdBanner';

const TYPE_LABEL = {
  annuity:        '원리금균등',
  equalPrincipal: '원금균등',
  bullet:         '만기일시',
  graduated:      '체증식',
};

const TYPE_COLOR = {
  annuity:        '#3F51B5',
  equalPrincipal: '#00897B',
  bullet:         '#E53935',
  graduated:      '#7B1FA2',
};

export default function HistoryScreen({ navigation }) {
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const data = await getLocalHistory();
      setHistory(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
        loanType:     item.loanType   || 'annuity',
        gracePeriod:  item.gracePeriod || 0,
      },
    });
  }

  function handleDelete(item) {
    Alert.alert(
      '기록 삭제',
      '이 기록을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive',
          onPress: async () => {
            await deleteLocalHistory(item.id);
            loadHistory();
          },
        },
      ]
    );
  }

  function renderItem({ item, index }) {
    const showAd = index > 0 && index % 3 === 0;
    return (
      <>
        {showAd && <AdBanner style={{ marginBottom: 12 }} />}
        <HistoryCard
          item={item}
          onPress={() => handleItemPress(item)}
          onDelete={() => handleDelete(item)}
        />
      </>
    );
  }

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

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={history}
        keyExtractor={item => String(item.id)}
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
function HistoryCard({ item, onPress, onDelete }) {
  const date = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '-';

  const loanType  = item.loanType || 'annuity';
  const typeLabel = TYPE_LABEL[loanType] || loanType;
  const typeColor = TYPE_COLOR[loanType] || '#3F51B5';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* 헤더: 원금 + 날짜 + 삭제 */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardAmount}>{formatManWon(item.principal)}</Text>
          <Text style={styles.cardDate}>{date}</Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.deleteBtnText}>삭제</Text>
        </TouchableOpacity>
      </View>

      {/* 조건 칩 */}
      <View style={styles.chipRow}>
        <View style={[styles.typeChip, { backgroundColor: typeColor + '18', borderColor: typeColor + '40' }]}>
          <Text style={[styles.typeChipText, { color: typeColor }]}>{typeLabel}</Text>
        </View>
        <Chip icon="📊" label={`금리 ${item.interestRate}%`} />
        <Chip icon="📅" label={`${item.period}년`} />
        {item.gracePeriod > 0 && <Chip icon="⏳" label={`거치 ${item.gracePeriod}년`} />}
      </View>

      {/* 결과 요약 */}
      <View style={styles.statRow}>
        <StatCell label="월 상환금"  value={formatKRW(item.monthlyPayment)} />
        <View style={styles.statDivider} />
        <StatCell label="총 이자"    value={formatKRW(item.totalInterest)}  color="#E53935" />
        <View style={styles.statDivider} />
        <StatCell label="총 납부액"  value={formatKRW(item.totalAmount)} />
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardAmount: { fontSize: 18, fontWeight: '800', color: '#1A237E' },
  cardDate:   { fontSize: 12, color: '#9E9E9E', marginTop: 2 },

  deleteBtn: {
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  deleteBtnText: { fontSize: 12, color: '#E53935', fontWeight: '600' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },

  typeChip: {
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1,
  },
  typeChipText: { fontSize: 12, fontWeight: '700' },

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
