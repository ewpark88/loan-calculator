import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');

const METHODS = [
  {
    key: 'annuity',
    icon: '🔄',
    title: '원리금균등분할',
    titleEn: 'Equal Payment',
    color: '#3F51B5',
    lightBg: '#EEF0FB',
    borderColor: '#9FA8DA',
    tagColor: '#3F51B5',
    tagBg: '#E8EAF6',
    overview: '매달 동일한 금액을 납부하는 가장 보편적인 상환 방식입니다. 초기에는 이자 비중이 높고, 시간이 지날수록 원금 상환 비중이 늘어납니다.',
    formula: 'PMT = P × r(1+r)ⁿ ÷ ((1+r)ⁿ − 1)',
    formulaDesc: 'P: 대출원금  r: 월이자율  n: 총 납부 횟수',
    metrics: [
      { label: '월 납부액 변화', value: '매월 동일', icon: '➡️' },
      { label: '초기 부담', value: '중간', icon: '⚖️' },
      { label: '총 이자 부담', value: '중간', icon: '💰' },
      { label: '예산 계획', value: '매우 쉬움', icon: '📅' },
    ],
    pros: [
      '매월 동일한 금액으로 가계 예산 관리가 쉬움',
      '초기 상환 부담이 원금균등 대비 낮음',
      '대부분의 시중 대출에 기본 적용되는 방식',
    ],
    cons: [
      '초기 납부액 중 이자 비중이 매우 높음',
      '총 이자 부담이 원금균등분할보다 많음',
      '원금 감소 속도가 초기에 느림',
    ],
    suitableFor: ['일정한 소득이 있는 직장인', '월별 지출 관리가 중요한 분', '처음 대출을 받는 분'],
    paymentTrend: [100, 100, 100, 100, 100, 100],
    interestLevel: 2,
    example: '3억원, 연 4%, 30년 기준\n월 납부액: 약 143만원 (고정)\n총 이자: 약 2억 1,500만원',
  },
  {
    key: 'equal',
    icon: '📉',
    title: '원금균등분할',
    titleEn: 'Equal Principal',
    color: '#00897B',
    lightBg: '#E0F2F1',
    borderColor: '#80CBC4',
    tagColor: '#00695C',
    tagBg: '#E0F2F1',
    overview: '매달 일정한 원금을 상환하고, 잔여 원금에 대한 이자를 추가 납부합니다. 원금이 꾸준히 줄어드므로 납부액이 매월 감소합니다.',
    formula: '월납부액 = (P ÷ n) + (잔여원금 × r)',
    formulaDesc: 'P: 대출원금  n: 총 납부 횟수  r: 월이자율',
    metrics: [
      { label: '월 납부액 변화', value: '매월 감소', icon: '📉' },
      { label: '초기 부담', value: '높음', icon: '⚠️' },
      { label: '총 이자 부담', value: '가장 낮음', icon: '✅' },
      { label: '예산 계획', value: '보통', icon: '📅' },
    ],
    pros: [
      '4가지 방식 중 총 이자 부담이 가장 적음',
      '시간이 지날수록 월 납부액이 줄어 부담 감소',
      '원금이 빠르게 감소해 자산 관리에 유리',
    ],
    cons: [
      '초기 월 납부액이 원리금균등보다 높음',
      '초기 자금 여유가 없으면 부담될 수 있음',
      '매월 납부액이 달라 예산 관리가 다소 복잡',
    ],
    suitableFor: ['초기 여유 자금이 있는 분', '총 이자를 최소화하고 싶은 분', '시간이 지날수록 부담을 줄이고 싶은 분'],
    paymentTrend: [120, 110, 100, 90, 80, 70],
    interestLevel: 1,
    example: '3억원, 연 4%, 30년 기준\n초기 월 납부액: 약 183만원\n최종 월 납부액: 약 84만원\n총 이자: 약 1억 8,075만원',
  },
  {
    key: 'bullet',
    icon: '📅',
    title: '만기일시상환',
    titleEn: 'Bullet Repayment',
    color: '#C62828',
    lightBg: '#FFEBEE',
    borderColor: '#EF9A9A',
    tagColor: '#B71C1C',
    tagBg: '#FFEBEE',
    overview: '대출 기간 동안 이자만 납부하고, 만기일에 원금 전액을 한꺼번에 상환하는 방식입니다. 월 납부액이 가장 적지만 총 이자 부담이 가장 큽니다.',
    formula: '월납부액 = P × r  (이자만)',
    formulaDesc: 'P: 대출원금  r: 월이자율 / 만기 시 P 전액 상환',
    metrics: [
      { label: '월 납부액 변화', value: '매월 동일', icon: '➡️' },
      { label: '초기 부담', value: '가장 낮음', icon: '✅' },
      { label: '총 이자 부담', value: '가장 높음', icon: '⚠️' },
      { label: '만기 목돈 필요', value: '원금 전액', icon: '💸' },
    ],
    pros: [
      '월 납부액이 4가지 방식 중 가장 적음',
      '대출 기간 동안 현금 흐름 확보에 유리',
      '투자 수익으로 만기 상환을 계획하는 전략에 활용 가능',
    ],
    cons: [
      '총 이자 부담이 4가지 방식 중 가장 많음',
      '만기 시 원금 전액을 마련해야 하는 부담',
      '원금이 전혀 줄지 않아 자산 형성에 불리',
    ],
    suitableFor: ['단기 자금 운용 계획이 있는 분', '투자 수익으로 원금 상환을 계획하는 분', '월 현금 흐름 확보가 최우선인 경우'],
    paymentTrend: [60, 60, 60, 60, 60, 360],
    interestLevel: 3,
    example: '3억원, 연 4%, 30년 기준\n월 납부액: 약 100만원 (이자만)\n만기 상환: 3억원 (원금)\n총 이자: 약 3억 6,000만원',
  },
  {
    key: 'graduated',
    icon: '📈',
    title: '체증식분할상환',
    titleEn: 'Graduated Payment',
    color: '#6A1B9A',
    lightBg: '#F3E5F5',
    borderColor: '#CE93D8',
    tagColor: '#4A148C',
    tagBg: '#F3E5F5',
    overview: '초기에 적은 금액을 납부하고 매년 일정 비율(약 3%)씩 납부액이 증가하는 방식입니다. 한국주택금융공사의 보금자리론·디딤돌대출에 주로 적용됩니다.',
    formula: '1차연도 납부액 계산 후 매년 × 1.03',
    formulaDesc: '이진탐색(Binary Search)으로 초기 납부액 산출\n이후 매년 3% 인상 적용',
    metrics: [
      { label: '월 납부액 변화', value: '매년 증가', icon: '📈' },
      { label: '초기 부담', value: '가장 낮음', icon: '✅' },
      { label: '총 이자 부담', value: '중상', icon: '💰' },
      { label: '후반 부담', value: '높아짐', icon: '⚠️' },
    ],
    pros: [
      '초기 월 납부액이 매우 낮아 사회초년생에 적합',
      '소득 증가에 맞춰 납부액이 자연스럽게 상승',
      '보금자리론·디딤돌대출 등 정책 대출 활용 가능',
    ],
    cons: [
      '후반으로 갈수록 월 납부액 부담이 크게 증가',
      '총 이자 부담이 원리금균등보다 높을 수 있음',
      '소득 증가가 예상보다 더딜 경우 부담 가중',
    ],
    suitableFor: ['사회초년생·신혼부부', '향후 소득 증가가 예상되는 분', '보금자리론·디딤돌대출 이용자'],
    paymentTrend: [70, 80, 90, 100, 110, 120],
    interestLevel: 2,
    example: '3억원, 연 4%, 30년 기준\n1년차 월 납부액: 약 102만원\n30년차 월 납부액: 약 240만원\n총 이자: 약 2억 4,000만원 (추산)',
  },
];

const COMPARISON_ROWS = [
  { label: '월 납부액', values: ['고정', '초기 高→감소', '최저(이자만)', '초기 低→증가'] },
  { label: '총 이자', values: ['중간', '가장 적음 ✅', '가장 많음 ⚠️', '중상'] },
  { label: '초기 부담', values: ['보통', '높음', '최저', '최저'] },
  { label: '만기 목돈', values: ['없음', '없음', '원금 전액', '없음'] },
  { label: '추천 대상', values: ['직장인', '여유자금', '투자계획', '사회초년생'] },
];

const INTEREST_LABELS = ['', '낮음', '중간', '높음'];
const COLORS = ['#3F51B5', '#00897B', '#C62828', '#6A1B9A'];

export default function RepaymentGuideScreen() {
  const [expanded, setExpanded] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  function toggle(key) {
    setExpanded(prev => (prev === key ? null : key));
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* 헤더 */}
        <View style={s.introCard}>
          <Text style={s.introIcon}>📚</Text>
          <Text style={s.introTitle}>상환방식 안내</Text>
          <Text style={s.introDesc}>
            4가지 대출 상환방식의 특징과 장단점을 비교해{'\n'}나에게 맞는 방식을 선택해 보세요.
          </Text>
        </View>

        {/* 비교표 토글 */}
        <TouchableOpacity
          style={s.compareToggleBtn}
          onPress={() => setShowComparison(v => !v)}
          activeOpacity={0.82}
        >
          <Text style={s.compareToggleIcon}>{showComparison ? '▲' : '▼'}</Text>
          <Text style={s.compareToggleTxt}>4가지 방식 한눈에 비교하기</Text>
        </TouchableOpacity>

        {showComparison && (
          <View style={s.compareCard}>
            <View style={s.compareHeader}>
              <View style={s.compareLabelCol} />
              {METHODS.map(m => (
                <View key={m.key} style={[s.compareMethodCol, { backgroundColor: m.lightBg }]}>
                  <Text style={s.compareMethodIcon}>{m.icon}</Text>
                  <Text style={[s.compareMethodName, { color: m.color }]} numberOfLines={2}>
                    {m.title}
                  </Text>
                </View>
              ))}
            </View>
            {COMPARISON_ROWS.map((row, ri) => (
              <View key={ri} style={[s.compareRow, ri % 2 === 1 && s.compareRowAlt]}>
                <View style={s.compareLabelCol}>
                  <Text style={s.compareRowLabel}>{row.label}</Text>
                </View>
                {row.values.map((val, vi) => (
                  <View key={vi} style={s.compareValueCol}>
                    <Text style={[s.compareRowValue, { color: COLORS[vi] }]}>{val}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* 각 방식 카드 */}
        {METHODS.map(method => {
          const isOpen = expanded === method.key;
          return (
            <View key={method.key} style={[s.methodCard, { borderColor: method.borderColor }]}>
              <TouchableOpacity
                style={[s.methodHeader, { backgroundColor: method.lightBg }]}
                onPress={() => toggle(method.key)}
                activeOpacity={0.8}
              >
                <View style={[s.methodIconCircle, { backgroundColor: method.color }]}>
                  <Text style={s.methodIconTxt}>{method.icon}</Text>
                </View>
                <View style={s.methodHeaderTexts}>
                  <View style={s.methodTitleRow}>
                    <Text style={[s.methodTitle, { color: method.color }]}>{method.title}</Text>
                    <View style={[s.methodTag, { backgroundColor: method.tagBg }]}>
                      <Text style={[s.methodTagTxt, { color: method.tagColor }]}>{method.titleEn}</Text>
                    </View>
                  </View>
                  <Text style={s.methodOverviewShort} numberOfLines={2}>{method.overview}</Text>
                </View>
                <Text style={[s.expandArrow, { color: method.color }]}>{isOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {isOpen && (
                <View style={s.methodBody}>
                  {/* 개요 */}
                  <View style={s.section}>
                    <SectionTitle icon="📌" title="개요" />
                    <Text style={s.overviewText}>{method.overview}</Text>
                  </View>

                  {/* 계산 방식 */}
                  <View style={s.section}>
                    <SectionTitle icon="🧮" title="계산 방식" />
                    <View style={[s.formulaBox, { borderLeftColor: method.color }]}>
                      <Text style={[s.formulaTxt, { color: method.color }]}>{method.formula}</Text>
                      <Text style={s.formulaDesc}>{method.formulaDesc}</Text>
                    </View>
                  </View>

                  {/* 핵심 지표 */}
                  <View style={s.section}>
                    <SectionTitle icon="📊" title="핵심 지표" />
                    <View style={s.metricsGrid}>
                      {method.metrics.map((m, i) => (
                        <View key={i} style={[s.metricCard, { borderColor: method.borderColor }]}>
                          <Text style={s.metricIcon}>{m.icon}</Text>
                          <Text style={s.metricLabel}>{m.label}</Text>
                          <Text style={[s.metricValue, { color: method.color }]}>{m.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* 납부액 추이 — 막대와 레이블을 분리해 겹침 방지 */}
                  <View style={s.section}>
                    <SectionTitle icon="📈" title="납부액 추이 (예시)" />
                    <View style={s.trendContainer}>
                      {/* 막대 영역 */}
                      <View style={s.trendBarsRow}>
                        {method.paymentTrend.map((val, i) => {
                          const maxVal = Math.max(...method.paymentTrend);
                          const barH   = Math.max(16, (val / maxVal) * 90);
                          const isLast = i === method.paymentTrend.length - 1;
                          return (
                            <View key={i} style={s.trendBarCol}>
                              <View style={[
                                s.trendBar,
                                {
                                  height: barH,
                                  backgroundColor: isLast && method.key === 'bullet'
                                    ? '#E53935'
                                    : method.color,
                                  opacity: 0.6 + (i / method.paymentTrend.length) * 0.4,
                                },
                              ]} />
                            </View>
                          );
                        })}
                      </View>
                      {/* 레이블 영역 (막대 바깥, 겹침 없음) */}
                      <View style={s.trendLabelsRow}>
                        {method.paymentTrend.map((_, i) => (
                          <View key={i} style={s.trendLabelCol}>
                            <Text style={s.trendBarLabel}>
                              {i === 0 ? '초기' : i === method.paymentTrend.length - 1 ? '만기' : ''}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    {method.key === 'bullet' && (
                      <Text style={s.trendNote}>* 마지막 막대는 만기 시 원금 일시상환을 나타냄</Text>
                    )}
                  </View>

                  {/* 이자 부담 레벨 */}
                  <View style={s.section}>
                    <SectionTitle icon="💰" title="총 이자 부담 수준" />
                    <View style={s.interestLevelRow}>
                      {[1, 2, 3].map(lv => (
                        <View
                          key={lv}
                          style={[
                            s.interestDot,
                            { backgroundColor: lv <= method.interestLevel ? method.color : '#E0E0E0' },
                          ]}
                        />
                      ))}
                      <Text style={[s.interestLevelTxt, { color: method.color }]}>
                        {INTEREST_LABELS[method.interestLevel]}
                      </Text>
                    </View>
                  </View>

                  {/* 장단점 */}
                  <View style={s.section}>
                    <SectionTitle icon="⚖️" title="장단점" />
                    <View style={s.prosConsRow}>
                      <View style={[s.prosBox, { borderColor: '#A5D6A7' }]}>
                        <Text style={s.prosTitle}>✅ 장점</Text>
                        {method.pros.map((p, i) => (
                          <Text key={i} style={s.prosItem}>• {p}</Text>
                        ))}
                      </View>
                      <View style={[s.consBox, { borderColor: '#EF9A9A' }]}>
                        <Text style={s.consTitle}>⚠️ 단점</Text>
                        {method.cons.map((c, i) => (
                          <Text key={i} style={s.consItem}>• {c}</Text>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* 추천 대상 */}
                  <View style={s.section}>
                    <SectionTitle icon="🎯" title="이런 분께 추천" />
                    <View style={s.suitableWrap}>
                      {method.suitableFor.map((item, i) => (
                        <View key={i} style={[s.suitableTag, { backgroundColor: method.lightBg, borderColor: method.borderColor }]}>
                          <Text style={[s.suitableTagTxt, { color: method.color }]}>👤 {item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* 계산 예시 */}
                  <View style={[s.exampleBox, { borderColor: method.borderColor, backgroundColor: method.lightBg }]}>
                    <Text style={[s.exampleTitle, { color: method.color }]}>📝 계산 예시</Text>
                    <Text style={s.exampleTxt}>{method.example}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* 선택 팁 */}
        <View style={s.tipCard}>
          <Text style={s.tipTitle}>💡 상환방식 선택 팁</Text>
          {[
            { q: '월 납부액을 일정하게 유지하고 싶다면', a: '원리금균등' },
            { q: '총 이자를 최대한 줄이고 싶다면', a: '원금균등' },
            { q: '현금 흐름이 중요하고 목돈 마련 계획이 있다면', a: '만기일시상환' },
            { q: '초기 부담을 최소화하고 소득 증가가 예상된다면', a: '체증식' },
          ].map((tip, i) => (
            <View key={i} style={s.tipRow}>
              <Text style={s.tipIcon}>📌</Text>
              <Text style={s.tipText}>{tip.q} → <Text style={s.tipEmphasis}>{tip.a}</Text></Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <View style={s.sectionTitleRow}>
      <Text style={s.sectionTitleIcon}>{icon}</Text>
      <Text style={s.sectionTitleTxt}>{title}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#F4FAF8' },
  container: { padding: 16, paddingBottom: 48 },

  // 헤더
  introCard: {
    backgroundColor: '#1B998B',
    borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 16,
    shadowColor: '#1B998B', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  introIcon:  { fontSize: 50, marginBottom: 12 },
  introTitle: { fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 10 },
  introDesc:  { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 26 },

  // 비교표 토글
  compareToggleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF', borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 20, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#C5E8E2',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  compareToggleIcon: { fontSize: 15, color: '#1B998B', marginRight: 10 },
  compareToggleTxt:  { fontSize: 17, fontWeight: '700', color: '#1B998B' },

  // 비교표
  compareCard: {
    backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  compareHeader:     { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  compareLabelCol:   { width: 68, paddingVertical: 12, paddingLeft: 10 },
  compareMethodCol: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderLeftWidth: 1, borderLeftColor: '#EEE',
  },
  compareMethodIcon: { fontSize: 20, marginBottom: 5 },
  compareMethodName: { fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 17 },
  compareRow:        { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  compareRowAlt:     { backgroundColor: '#FAFBFF' },
  compareRowLabel: {
    fontSize: 13, fontWeight: '700', color: '#555',
    paddingVertical: 12, paddingLeft: 10, lineHeight: 18,
  },
  compareValueCol: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderLeftWidth: 1, borderLeftColor: '#F0F0F0',
  },
  compareRowValue: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 17 },

  // 방식 카드
  methodCard: {
    backgroundColor: '#FFF', borderRadius: 18, marginBottom: 14,
    borderWidth: 1.5, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  methodHeader:       { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  methodIconCircle: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  methodIconTxt:      { fontSize: 26 },
  methodHeaderTexts:  { flex: 1 },
  methodTitleRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  methodTitle:        { fontSize: 19, fontWeight: '800' },
  methodTag:          { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
  methodTagTxt:       { fontSize: 12, fontWeight: '700' },
  methodOverviewShort:{ fontSize: 14, color: '#555', lineHeight: 21 },
  expandArrow:        { fontSize: 16, fontWeight: '700', marginLeft: 4 },

  // 카드 본문
  methodBody:      { padding: 18, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  section:         { marginBottom: 22 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitleIcon:{ fontSize: 18, marginRight: 8 },
  sectionTitleTxt: { fontSize: 17, fontWeight: '700', color: '#157A6E' },

  overviewText: { fontSize: 16, color: '#333', lineHeight: 26 },

  // 공식
  formulaBox: {
    backgroundColor: '#F8FFFE', borderRadius: 14, padding: 16, borderLeftWidth: 4,
  },
  formulaTxt:  { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  formulaDesc: { fontSize: 14, color: '#666', lineHeight: 22 },

  // 핵심 지표
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: (SCREEN_W - 32 - 36 - 10) / 2,
    backgroundColor: '#FAFAFA', borderRadius: 14, padding: 14,
    borderWidth: 1, alignItems: 'center',
  },
  metricIcon:  { fontSize: 24, marginBottom: 6 },
  metricLabel: { fontSize: 13, color: '#666', marginBottom: 5, textAlign: 'center' },
  metricValue: { fontSize: 15, fontWeight: '800', textAlign: 'center' },

  // 납부액 추이 (막대 + 레이블 분리)
  trendContainer: {
    backgroundColor: '#F0FDF9', borderRadius: 14,
    paddingHorizontal: 14, paddingTop: 18, paddingBottom: 14,
  },
  trendBarsRow: {
    flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6,
  },
  trendBarCol:  { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  trendBar:     { width: '72%', borderRadius: 5 },
  trendLabelsRow: { flexDirection: 'row', marginTop: 10, gap: 6 },
  trendLabelCol:  { flex: 1, alignItems: 'center' },
  trendBarLabel:  { fontSize: 13, color: '#557668', fontWeight: '500' },
  trendNote:      { fontSize: 13, color: '#E53935', marginTop: 8, textAlign: 'center', lineHeight: 20 },

  // 이자 레벨
  interestLevelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  interestDot:      { width: 34, height: 34, borderRadius: 17 },
  interestLevelTxt: { fontSize: 16, fontWeight: '700', marginLeft: 6 },

  // 장단점
  prosConsRow: { flexDirection: 'row', gap: 10 },
  prosBox: {
    flex: 1, backgroundColor: '#F1F8E9', borderRadius: 14,
    padding: 14, borderWidth: 1,
  },
  consBox: {
    flex: 1, backgroundColor: '#FFF8F8', borderRadius: 14,
    padding: 14, borderWidth: 1,
  },
  prosTitle: { fontSize: 15, fontWeight: '700', color: '#2E7D32', marginBottom: 10 },
  consTitle: { fontSize: 15, fontWeight: '700', color: '#C62828', marginBottom: 10 },
  prosItem:  { fontSize: 14, color: '#33691E', lineHeight: 22, marginBottom: 5 },
  consItem:  { fontSize: 14, color: '#B71C1C', lineHeight: 22, marginBottom: 5 },

  // 추천 대상
  suitableWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  suitableTag: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 22, borderWidth: 1,
  },
  suitableTagTxt: { fontSize: 15, fontWeight: '600' },

  // 예시
  exampleBox:   { borderRadius: 14, padding: 16, borderWidth: 1.5, marginTop: 4 },
  exampleTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  exampleTxt:   { fontSize: 15, color: '#333', lineHeight: 26 },

  // 팁 카드
  tipCard: {
    backgroundColor: '#FFFBEB', borderRadius: 18, padding: 22,
    marginTop: 4, marginBottom: 8,
    borderWidth: 1.5, borderColor: '#F9A825',
    shadowColor: '#F9A825', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  tipTitle:    { fontSize: 18, fontWeight: '800', color: '#E65100', marginBottom: 16 },
  tipRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  tipIcon:     { fontSize: 16, marginRight: 10, marginTop: 2 },
  tipText:     { flex: 1, fontSize: 15, color: '#4E342E', lineHeight: 24 },
  tipEmphasis: { fontWeight: '800', color: '#E65100' },
});
