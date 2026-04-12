import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveLoanHistory } from '../services/api';
import {
  formatKRW, formatManWon, generateScheduleByType,
} from '../utils/loanCalculator';
import AdBanner from '../components/AdBanner';
import AdInterstitial from '../components/AdInterstitial';

// 방식별 표시 레이블
const TYPE_LABEL = {
  annuity:        '원리금균등분할',
  equalPrincipal: '원금균등분할',
  bullet:         '만기일시상환',
  graduated:      '체증식분할상환',
};

export default function ResultScreen({ navigation, route }) {
  const { loanData, result, compareData, compareResult } = route.params;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [showAd, setShowAd] = useState(false);

  const isCompare = !!compareData;
  const loanType  = loanData.loanType || 'annuity';

  // 월별 상환 일정
  const schedule = useMemo(() => {
    if (isCompare) return [];
    return generateScheduleByType(
      loanData.principal,
      loanData.interestRate,
      loanData.period,
      loanType,
      loanData.gracePeriod || 0,
    );
  }, [loanData, isCompare]);

  useEffect(() => {
    const t = setTimeout(() => setShowAd(true), 600);
    return () => clearTimeout(t);
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

  /* ── FlatList 헤더 ── */
  const ListHeader = (
    <View>
      <SummaryCard loanData={loanData} result={result} />

      {isCompare ? (
        <CompareView
          loanData={loanData}       result={result}
          compareData={compareData} compareResult={compareResult}
        />
      ) : (
        <SummarySection loanData={loanData} result={result} />
      )}

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

      <AdBanner />

      {!isCompare && (
        <View style={styles.scheduleTitleRow}>
          <Text style={styles.scheduleTitleText}>📅 월별 상환 일정</Text>
          <View style={styles.scheduleBadge}>
            <Text style={styles.scheduleBadgeText}>
              총 {loanData.period * 12}회차
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  function renderItem({ item }) {
    if (item.type === 'yearHeader') return <YearSeparator year={item.year} />;
    return (
      <ScheduleCard item={item} initialPrincipal={loanData.principal} loanType={loanType} />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <AdInterstitial visible={showAd} onClose={() => setShowAd(false)} />
      <FlatList
        data={schedule}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={<View style={{ height: 30 }} />}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        initialNumToRender={24}
        maxToRenderPerBatch={24}
        windowSize={10}
      />
    </SafeAreaView>
  );
}

/* ══════════════════════════════════════
 *  월 상환금 요약 카드 (방식별 적응)
 * ══════════════════════════════════════ */
function SummaryCard({ loanData, result }) {
  const loanType    = loanData.loanType || 'annuity';
  const gracePeriod = loanData.gracePeriod || 0;

  let paymentLabel, paymentValue, subLabel;

  switch (loanType) {
    case 'equalPrincipal':
      paymentLabel = '첫달 상환금';
      paymentValue = formatKRW(result.firstPayment);
      subLabel     = '매월 납부액 감소 (원금균등)';
      break;
    case 'bullet':
      paymentLabel = '월 이자납부';
      paymentValue = formatKRW(result.monthlyPayment);
      subLabel     = `만기 일시 상환 원금: ${formatManWon(loanData.principal)}`;
      break;
    case 'graduated':
      paymentLabel = '첫달 상환금';
      paymentValue = formatKRW(result.firstPayment);
      subLabel     = `매년 3% 증가 · 마지막 해: ${formatKRW(result.lastYearPayment)}/월`;
      break;
    default: // annuity
      paymentLabel = gracePeriod > 0 ? '상환기간 월 상환금' : '월 상환금';
      paymentValue = formatKRW(result.monthlyPayment);
      subLabel     = gracePeriod > 0
        ? `거치기간 ${gracePeriod}년: ${formatKRW(result.gracePayment)}/월 (이자만)`
        : null;
  }

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTypeLabel}>{TYPE_LABEL[loanType] || ''}</Text>
      <Text style={styles.summaryLabel}>{paymentLabel}</Text>
      <Text style={styles.summaryAmount}>{paymentValue}</Text>
      {subLabel ? <Text style={styles.summarySubLabel}>{subLabel}</Text> : null}

      <View style={styles.condRow}>
        <CondChip label="대출금" value={formatManWon(loanData.principal)} />
        <View style={styles.condDivider} />
        <CondChip label="이율" value={`${loanData.interestRate}%`} />
        <View style={styles.condDivider} />
        <CondChip label="기간" value={`${loanData.period}년`} />
        {gracePeriod > 0 && (
          <>
            <View style={styles.condDivider} />
            <CondChip label="거치" value={`${gracePeriod}년`} />
          </>
        )}
      </View>
    </View>
  );
}

function CondChip({ label, value }) {
  return (
    <View style={styles.condChip}>
      <Text style={styles.condChipLabel}>{label}</Text>
      <Text style={styles.condChipValue}>{value}</Text>
    </View>
  );
}

/* ══════════════════════════════════════
 *  요약정보 섹션 (방식별 행 구성)
 * ══════════════════════════════════════ */
function SummarySection({ loanData, result }) {
  const loanType    = loanData.loanType || 'annuity';
  const gracePeriod = loanData.gracePeriod || 0;

  return (
    <SectionCard title="요약정보">
      <DetailRow label="대출 원금" value={formatKRW(loanData.principal)} />

      {loanType === 'annuity' && (
        <>
          {gracePeriod > 0 && (
            <DetailRow label={`거치기간 월납부 (${gracePeriod}년)`} value={formatKRW(result.gracePayment)} />
          )}
          <DetailRow label="상환기간 월 상환금" value={formatKRW(result.monthlyPayment)} highlight />
        </>
      )}

      {loanType === 'equalPrincipal' && (
        <>
          {gracePeriod > 0 && (
            <DetailRow label={`거치기간 월납부 (${gracePeriod}년)`} value={formatKRW(result.gracePayment)} />
          )}
          <DetailRow label="첫달 상환금 (최대)" value={formatKRW(result.firstPayment)} highlight />
          <DetailRow label="마지막달 상환금 (최소)" value={formatKRW(result.lastPayment)} />
        </>
      )}

      {loanType === 'bullet' && (
        <>
          <DetailRow label="월 이자납부" value={formatKRW(result.monthlyPayment)} highlight />
          <DetailRow label="만기 일시 상환" value={formatKRW(result.maturityPayment)} color="#E53935" />
        </>
      )}

      {loanType === 'graduated' && (
        <>
          {gracePeriod > 0 && (
            <DetailRow label={`거치기간 월납부 (${gracePeriod}년)`} value={formatKRW(result.gracePayment)} />
          )}
          <DetailRow label="첫달 상환금 (최소)" value={formatKRW(result.firstPayment)} highlight />
          <DetailRow label="마지막 해 월 상환금" value={formatKRW(result.lastYearPayment)} />
        </>
      )}

      <DetailRow label="총 이자"   value={formatKRW(result.totalInterest)} color="#E53935" />
      <DetailRow label="총 납부액" value={formatKRW(result.totalAmount)} isLast />
    </SectionCard>
  );
}

/* ══════════════════════════════════════
 *  섹션 카드 래퍼
 * ══════════════════════════════════════ */
function SectionCard({ title, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

/* ══════════════════════════════════════
 *  상세 행
 * ══════════════════════════════════════ */
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

/* ══════════════════════════════════════
 *  비교 뷰
 * ══════════════════════════════════════ */
function CompareView({ loanData, result, compareData, compareResult }) {
  const diff = {
    monthly:  Math.abs(result.monthlyPayment  - compareResult.monthlyPayment),
    interest: Math.abs(result.totalInterest   - compareResult.totalInterest),
    total:    Math.abs(result.totalAmount     - compareResult.totalAmount),
  };
  const ba = (a, b) => a <= b ? 'A' : 'B';

  return (
    <>
      <Text style={styles.compareHeader}>대출 조건 비교</Text>
      <View style={styles.compareRow}>
        <CompareCard label="조건 A" data={loanData}    result={result}        color="#3F51B5" />
        <CompareCard label="조건 B" data={compareData} result={compareResult} color="#7B1FA2" />
      </View>
      <SectionCard title="비교 분석">
        <DiffRow label="월 상환금 차이" value={formatKRW(diff.monthly)}  better={ba(result.monthlyPayment,  compareResult.monthlyPayment)} />
        <DiffRow label="총 이자 차이"   value={formatKRW(diff.interest)} better={ba(result.totalInterest,   compareResult.totalInterest)} />
        <DiffRow label="총 납부액 차이" value={formatKRW(diff.total)}    better={ba(result.totalAmount,     compareResult.totalAmount)} isLast />
      </SectionCard>
    </>
  );
}

function CompareCard({ label, data, result, color }) {
  const typeLabel = TYPE_LABEL[data.loanType] || '';
  return (
    <View style={[styles.compareCard, { borderTopColor: color }]}>
      <Text style={[styles.compareCardLabel, { color }]}>{label}</Text>
      <Text style={styles.compareCardAmount}>{formatKRW(result.monthlyPayment)}</Text>
      <Text style={styles.compareCardSub}>월 상환금</Text>
      <View style={{ gap: 3 }}>
        <Text style={styles.compareDetail}>원금 {formatManWon(data.principal)}</Text>
        <Text style={styles.compareDetail}>금리 {data.interestRate}%</Text>
        <Text style={styles.compareDetail}>기간 {data.period}년</Text>
        {data.gracePeriod > 0 && (
          <Text style={styles.compareDetail}>거치 {data.gracePeriod}년</Text>
        )}
        <Text style={[styles.compareDetail, { color: '#9E9E9E' }]}>{typeLabel}</Text>
        <Text style={[styles.compareDetail, { color: '#E53935' }]}>이자 {formatKRW(result.totalInterest)}</Text>
      </View>
    </View>
  );
}

function DiffRow({ label, value, better, isLast }) {
  return (
    <View style={[styles.detailRow, !isLast && styles.rowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={styles.detailValue}>{value}</Text>
        <View style={styles.betterBadge}>
          <Text style={styles.betterBadgeText}>{better} 유리</Text>
        </View>
      </View>
    </View>
  );
}

/* ══════════════════════════════════════
 *  월별 상환 일정 컴포넌트
 * ══════════════════════════════════════ */
function YearSeparator({ year }) {
  return (
    <View style={styles.yearSep}>
      <View style={styles.yearSepLine} />
      <Text style={styles.yearSepText}>{year}년차</Text>
      <View style={styles.yearSepLine} />
    </View>
  );
}

function ScheduleCard({ item, initialPrincipal, loanType }) {
  const pct    = Math.min(100, Math.max(0, item.repaidPct));
  const isLast = item.balance === 0;

  return (
    <View style={[
      styles.scheduleCard,
      isLast   && styles.scheduleCardLast,
      item.isGrace && styles.scheduleCardGrace,
    ]}>
      {/* 거치기간 배지 */}
      {item.isGrace && (
        <View style={styles.graceBadge}>
          <Text style={styles.graceBadgeText}>거치</Text>
        </View>
      )}

      {/* 회차 + 원금/이자 */}
      <View style={styles.scheduleTop}>
        <View style={[styles.scheduleMonthBadge, item.isGrace && styles.scheduleMonthBadgeGrace]}>
          <Text style={[styles.scheduleMonthText, item.isGrace && styles.scheduleMonthTextGrace]}>
            {item.month}
          </Text>
          <Text style={styles.scheduleMonthLabel}>회차</Text>
        </View>

        <View style={styles.scheduleAmounts}>
          {item.isGrace ? (
            <View style={styles.scheduleAmountRow}>
              <View style={[styles.scheduleDot, { backgroundColor: '#FFA726' }]} />
              <Text style={styles.scheduleAmountLabel}>이자납부 (거치)</Text>
              <Text style={[styles.scheduleAmountValue, { color: '#F57C00' }]}>
                {formatKRW(item.interest)}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.scheduleAmountRow}>
                <View style={styles.scheduleDot} />
                <Text style={styles.scheduleAmountLabel}>
                  {loanType === 'bullet' && isLast ? '원금상환' : '원금상환'}
                </Text>
                <Text style={styles.scheduleAmountValue}>{formatKRW(item.principal)}</Text>
              </View>
              <View style={styles.scheduleAmountRow}>
                <View style={[styles.scheduleDot, { backgroundColor: '#FF8A80' }]} />
                <Text style={styles.scheduleAmountLabel}>이자</Text>
                <Text style={[styles.scheduleAmountValue, { color: '#E53935' }]}>
                  {formatKRW(item.interest)}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* 잔여원금 + 진행 바 */}
      <View style={styles.scheduleBottom}>
        <View style={styles.progressBarBg}>
          <View style={[
            styles.progressBarFill,
            item.isGrace && styles.progressBarGrace,
            { width: `${pct}%` },
          ]} />
        </View>
        <View style={styles.scheduleBalanceRow}>
          <Text style={styles.scheduleBalanceLabel}>
            잔여원금 {isLast ? '완납' : formatKRW(item.balance)}
          </Text>
          <Text style={[styles.scheduleRepaidPct, item.isGrace && { color: '#F57C00' }]}>
            {pct.toFixed(1)}% 상환
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ══════════════════════════════════════
 *  스타일
 * ══════════════════════════════════════ */
const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#F0F4FF' },
  container: { padding: 16, paddingBottom: 16 },

  // ── 요약 카드
  summaryCard: {
    backgroundColor: '#3F51B5',
    borderRadius: 20,
    padding: 24,
    marginBottom: 14,
    shadowColor: '#3F51B5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  summaryTypeLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center',
    marginBottom: 2, letterSpacing: 0.5,
  },
  summaryLabel:    { fontSize: 13, color: '#9FA8DA', marginBottom: 6, textAlign: 'center' },
  summaryAmount:   { fontSize: 36, fontWeight: '800', color: '#FFF', textAlign: 'center', letterSpacing: -0.5, marginBottom: 8 },
  summarySubLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 14 },

  condRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 14,
  },
  condChip:      { flex: 1, alignItems: 'center' },
  condChipLabel: { fontSize: 11, color: '#9FA8DA', marginBottom: 5 },
  condChipValue: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  condDivider:   { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },

  // ── 섹션 카드
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  sectionTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  sectionAccent: { width: 3, height: 16, backgroundColor: '#3F51B5', borderRadius: 2, marginRight: 8 },
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: '#1A237E' },
  sectionContent: {},

  // ── 상세 행
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13,
  },
  rowBorder:       { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  detailLabel:     { fontSize: 14, color: '#757575' },
  detailValue:     { fontSize: 15, fontWeight: '600', color: '#1A237E' },
  detailHighlight: { fontSize: 16, fontWeight: '700', color: '#3F51B5' },

  // ── 버튼
  btnRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  saveBtn: {
    flex: 1, backgroundColor: '#3F51B5', borderRadius: 14, padding: 16, alignItems: 'center',
    shadowColor: '#3F51B5', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  savedBtn:      { backgroundColor: '#43A047' },
  saveBtnText:   { color: '#FFF', fontSize: 16, fontWeight: '700' },
  recalcBtn: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#C5CAE9',
  },
  recalcBtnText: { color: '#3F51B5', fontSize: 16, fontWeight: '700' },

  // ── 비교
  compareHeader: { fontSize: 17, fontWeight: '800', color: '#1A237E', textAlign: 'center', marginBottom: 12 },
  compareRow:    { flexDirection: 'row', gap: 12, marginBottom: 14 },
  compareCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 16, borderTopWidth: 4,
    padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  compareCardLabel:  { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  compareCardAmount: { fontSize: 17, fontWeight: '800', color: '#1A237E', marginBottom: 2 },
  compareCardSub:    { fontSize: 11, color: '#9E9E9E', marginBottom: 10 },
  compareDetail:     { fontSize: 12, color: '#616161' },
  betterBadge:     { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  betterBadgeText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },

  // ── 월별 상환 일정 타이틀
  scheduleTitleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4, paddingVertical: 12,
  },
  scheduleTitleText: { fontSize: 15, fontWeight: '700', color: '#1A237E' },
  scheduleBadge: {
    backgroundColor: '#3F51B5', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  scheduleBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  // ── 연도 구분자
  yearSep: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 8, paddingHorizontal: 4,
  },
  yearSepLine: { flex: 1, height: 1, backgroundColor: '#C5CAE9' },
  yearSepText: {
    fontSize: 12, fontWeight: '700', color: '#5C6BC0',
    marginHorizontal: 10,
    backgroundColor: '#EEF0FB',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 10,
  },

  // ── 회차 카드
  scheduleCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleCardLast:  { borderWidth: 1.5, borderColor: '#A5D6A7' },
  scheduleCardGrace: { backgroundColor: '#FFFDE7' },

  graceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFA726',
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
    marginBottom: 8,
  },
  graceBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },

  scheduleTop:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },

  scheduleMonthBadge: {
    width: 46, height: 46,
    backgroundColor: '#EEF0FB',
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  scheduleMonthBadgeGrace: { backgroundColor: '#FFF3E0' },
  scheduleMonthText:  { fontSize: 16, fontWeight: '800', color: '#3F51B5', lineHeight: 18 },
  scheduleMonthTextGrace: { color: '#F57C00' },
  scheduleMonthLabel: { fontSize: 10, color: '#7986CB' },

  scheduleAmounts:    { flex: 1, gap: 5 },
  scheduleAmountRow:  { flexDirection: 'row', alignItems: 'center' },
  scheduleDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#5C6BC0', marginRight: 6,
  },
  scheduleAmountLabel: { fontSize: 12, color: '#9E9E9E', flex: 1 },
  scheduleAmountValue: { fontSize: 13, fontWeight: '700', color: '#1A237E' },

  scheduleBottom: { gap: 6 },
  progressBarBg: {
    height: 6, backgroundColor: '#E8EAF6',
    borderRadius: 3, overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', backgroundColor: '#3F51B5', borderRadius: 3,
  },
  progressBarGrace: { backgroundColor: '#FFA726' },
  scheduleBalanceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  scheduleBalanceLabel: { fontSize: 11, color: '#757575' },
  scheduleRepaidPct:    { fontSize: 11, fontWeight: '700', color: '#3F51B5' },
});
