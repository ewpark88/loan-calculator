import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdBanner from '../components/AdBanner';
import { calculateBrokerage, formatNumber, formatManWon } from '../utils/loanCalculator';
import { saveBrokerageHistory } from '../services/localHistory';

const C = {
  primary:      '#1B998B',
  primaryDark:  '#157A6E',
  primaryLight: '#E3F7F4',
  orange:       '#FF6B35',
  orangeLight:  '#FFF0EA',
  bg:           '#F4FAF8',
  white:        '#FFFFFF',
  textDark:     '#1A2E28',
  textMid:      '#557668',
  textLight:    '#98BDB5',
  border:       '#C5E8E2',
  shadow:       '#1B998B',
};

const TX_TYPES = [
  { key: 'sale',    label: '매매계약' },
  { key: 'jeonse',  label: '전세계약' },
  { key: 'monthly', label: '월세계약' },
];

const PROP_TYPES = [
  { key: 'house',     label: '주택' },
  { key: 'officetel', label: '오피스텔' },
  { key: 'presale',   label: '분양권' },
  { key: 'other',     label: '그 외' },
];

export default function BrokerageScreen() {
  const [txType, setTxType]               = useState('sale');
  const [propType, setPropType]           = useState('house');
  const [price, setPrice]                 = useState('');
  const [deposit, setDeposit]             = useState('');
  const [monthly, setMonthly]             = useState('');
  const [prepaid, setPrepaid]             = useState('');
  const [premium, setPremium]             = useState('');
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [customRate, setCustomRate]       = useState('');
  const [useCustomVat, setUseCustomVat]   = useState(false);
  const [customVatAmt, setCustomVatAmt]   = useState('');
  const [result, setResult]               = useState(null);
  const [saved, setSaved]                 = useState(false);

  const isPresale       = propType === 'presale';
  const isOther         = propType === 'other';
  const showCustomRate  = useCustomRate || isOther;
  const effectiveTxType = isPresale ? 'sale' : txType;

  function toWon(manwon) {
    const n = Number(String(manwon).replace(/,/g, ''));
    return isNaN(n) ? 0 : Math.round(n * 10000);
  }

  function clearResult() { setResult(null); setSaved(false); }

  function handleCalc() {
    const res = calculateBrokerage({
      transactionType: effectiveTxType,
      propertyType:    propType,
      price:           toWon(price),
      deposit:         toWon(deposit),
      monthlyRent:     toWon(monthly),
      prepaid:         toWon(prepaid),
      premium:         toWon(premium),
      customRate:      showCustomRate && customRate !== '' ? customRate : null,
    });

    if (res.error) { Alert.alert('입력 오류', res.error); return; }

    let finalVat = res.vat;
    if (useCustomVat && customVatAmt !== '') finalVat = toWon(customVatAmt);

    setSaved(false);
    setResult({ ...res, vat: finalVat, total: res.commission + finalVat });
  }

  async function handleSave() {
    if (!result || saved) return;
    try {
      await saveBrokerageHistory({
        txType:      effectiveTxType,
        propType,
        tradeAmount: result.tradeAmount,
        commission:  result.commission,
        vat:         result.vat,
        total:       result.total,
        rate:        result.rate,
        isLimited:   result.isLimited,
      });
      setSaved(true);
      Alert.alert('저장 완료', '기록에 저장되었습니다.');
    } catch (err) {
      Alert.alert('저장 실패', err.message);
    }
  }

  function renderInputs() {
    if (isPresale) return (
      <>
        <AmountInput label="불입금액 (융자포함)" value={prepaid} onChange={v => { setPrepaid(v); clearResult(); }} />
        <AmountInput label="프리미엄"            value={premium} onChange={v => { setPremium(v); clearResult(); }} last />
      </>
    );
    if (effectiveTxType === 'monthly') return (
      <>
        <AmountInput label="보증금" value={deposit} onChange={v => { setDeposit(v); clearResult(); }} />
        <AmountInput label="월세"   value={monthly} onChange={v => { setMonthly(v); clearResult(); }} last />
      </>
    );
    return (
      <AmountInput
        label={effectiveTxType === 'sale' ? '매매가' : '전세가'}
        value={price}
        onChange={v => { setPrice(v); clearResult(); }}
        last
      />
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── 거래 유형 탭 */}
        {!isPresale && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>거래 유형</Text>
            <View style={s.tabRow}>
              {TX_TYPES.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[s.tab, txType === t.key && s.tabActive]}
                  onPress={() => { setTxType(t.key); clearResult(); }}
                  activeOpacity={0.8}
                >
                  <Text style={[s.tabTxt, txType === t.key && s.tabTxtActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── 주거 형태 탭 */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>주거 형태</Text>
          <View style={s.tabRow}>
            {PROP_TYPES.map(p => (
              <TouchableOpacity
                key={p.key}
                style={[s.tab, propType === p.key && s.tabActive]}
                onPress={() => {
                  setPropType(p.key);
                  setPrice(''); setDeposit(''); setMonthly('');
                  setPrepaid(''); setPremium(''); clearResult();
                }}
                activeOpacity={0.8}
              >
                <Text style={[s.tabTxt, propType === p.key && s.tabTxtActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {isPresale && (
            <View style={s.infoBox}>
              <Text style={s.infoTxt}>거래금액 = 불입금액(융자포함) + 프리미엄</Text>
            </View>
          )}
          {isOther && (
            <View style={s.infoBox}>
              <Text style={s.infoTxt}>최대 9/1000 이내에서 중개업자와 협의</Text>
            </View>
          )}
        </View>

        {/* ── 입력 카드 */}
        <View style={s.card}>
          {renderInputs()}

          <View style={s.divider} />

          {/* 요율 직접 입력 */}
          <TouchableOpacity
            style={s.checkRow}
            onPress={() => { if (!isOther) setUseCustomRate(v => !v); }}
            activeOpacity={0.7}
          >
            <View style={[s.checkbox, showCustomRate && s.checkboxOn]}>
              {showCustomRate && <Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={s.checkLabel}>요율 직접 입력{isOther ? '  (최대 0.9%)' : ''}</Text>
          </TouchableOpacity>

          {showCustomRate && (
            <View style={s.customRateWrap}>
              <View style={s.customRateInput}>
                <TextInput
                  style={s.customRateField}
                  placeholder={isOther ? '0.9' : '요율'}
                  keyboardType="decimal-pad"
                  value={customRate}
                  onChangeText={v => { setCustomRate(v); clearResult(); }}
                />
                <Text style={s.customRateUnit}>%</Text>
              </View>
              {customRate !== '' && !isNaN(Number(customRate)) && (
                <View style={s.customRateHintBox}>
                  <Text style={s.customRateHint}>{Math.round(Number(customRate) * 10)} / 1000</Text>
                </View>
              )}
            </View>
          )}

          {/* 부가세 직접 입력 */}
          <TouchableOpacity
            style={[s.checkRow, { marginTop: 4 }]}
            onPress={() => setUseCustomVat(v => !v)}
            activeOpacity={0.7}
          >
            <View style={[s.checkbox, useCustomVat && s.checkboxOn]}>
              {useCustomVat && <Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={s.checkLabel}>부가세 직접 입력</Text>
          </TouchableOpacity>

          {useCustomVat && (
            <AmountInput
              label="부가세 금액"
              value={customVatAmt}
              onChange={v => { setCustomVatAmt(v); clearResult(); }}
              last
            />
          )}
        </View>

        {/* ── 계산 버튼 */}
        <TouchableOpacity style={s.calcBtn} onPress={handleCalc} activeOpacity={0.85}>
          <Text style={s.calcBtnTxt}>🏢  중개보수 계산하기</Text>
        </TouchableOpacity>

        <AdBanner style={{ marginBottom: 16 }} />

        {/* ── 결과 */}
        {result && <ResultCard result={result} onSave={handleSave} saved={saved} />}

        {/* ── 요율표 */}
        <RateTable />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ────────────────────────────────────────
 *  금액 입력 행
 * ──────────────────────────────────────── */
function AmountInput({ label, value, onChange, last }) {
  return (
    <View style={[s.inputRow, last && { marginBottom: 0 }]}>
      <Text style={s.inputLabel}>{label}</Text>
      <View style={s.inputWrap}>
        <TextInput
          style={s.input}
          placeholder="금액 입력"
          keyboardType="numeric"
          value={value}
          onChangeText={onChange}
          placeholderTextColor={C.textLight}
        />
        <View style={s.inputUnit}>
          <Text style={s.inputUnitTxt}>만원</Text>
        </View>
      </View>
    </View>
  );
}

/* ────────────────────────────────────────
 *  결과 카드
 * ──────────────────────────────────────── */
function ResultCard({ result, onSave, saved }) {
  const rateFrac = Math.round(result.rate * 1000);
  const ratePct  = (result.rate * 100).toFixed(2);

  return (
    <View style={s.resultCard}>
      {/* 헤더 */}
      <View style={s.resultHead}>
        <Text style={s.resultHeadLabel}>💰 중개보수 계산 결과</Text>
        <Text style={s.resultHeadSub}>{formatManWon(result.tradeAmount)} 거래</Text>
      </View>

      {/* 최종 금액 하이라이트 */}
      <View style={s.resultHighlight}>
        <Text style={s.resultHighlightLabel}>최대 납부액 (부가세 포함)</Text>
        <Text style={s.resultHighlightAmt}>
          {formatNumber(result.total)}
          <Text style={s.resultHighlightWon}>원</Text>
        </Text>
      </View>

      {/* 상세 내역 */}
      <View style={s.resultDetail}>
        {/* 요율 뱃지 */}
        <View style={s.rateBadgeRow}>
          <View style={s.rateBadge}>
            <Text style={s.rateBadgeTxt}>상한 요율  {rateFrac}/1000</Text>
          </View>
          <Text style={s.ratePct}>{ratePct}%</Text>
          {result.isLimited && (
            <View style={s.limitBadge}>
              <Text style={s.limitBadgeTxt}>한도 적용</Text>
            </View>
          )}
        </View>

        <View style={s.detailDivider} />

        <DetailRow label="중개보수 (상한)" value={`${formatNumber(result.commission)}원`} />
        <DetailRow label="부가세 (10%)"    value={`${formatNumber(result.vat)}원`} />

        <View style={s.detailDivider} />

        <DetailRow
          label="합  계"
          value={`${formatNumber(result.total)}원`}
          total
        />
      </View>

      <Text style={s.resultNote}>
        ※ 중개보수는 상한 요율 이하에서 협의 가능합니다.
      </Text>

      {/* 저장 버튼 */}
      <TouchableOpacity
        style={[s.saveBtn, saved && s.saveBtnDone]}
        onPress={onSave}
        activeOpacity={0.8}
        disabled={saved}
      >
        <Text style={s.saveBtnTxt}>{saved ? '✓  저장됨' : '🗂  기록에 저장'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function DetailRow({ label, value, total }) {
  return (
    <View style={s.detailRow}>
      <Text style={[s.detailLabel, total && s.detailLabelTotal]}>{label}</Text>
      <Text style={[s.detailValue, total && s.detailValueTotal]}>{value}</Text>
    </View>
  );
}

/* ────────────────────────────────────────
 *  요율표 — 섹션별 카드
 * ──────────────────────────────────────── */
const RATE_SECTIONS = [
  {
    title: '🏠 주택 — 매매교환',
    rows: [
      { range: '5천만원 미만',       rate: '6/1000', limit: '한도 25만원' },
      { range: '5천만~2억원 미만',   rate: '5/1000', limit: '한도 80만원' },
      { range: '2억~9억원 미만',     rate: '4/1000', limit: '—' },
      { range: '9억~12억원 미만',    rate: '5/1000', limit: '—' },
      { range: '12억~15억원 미만',   rate: '6/1000', limit: '—' },
      { range: '15억원 이상',         rate: '7/1000', limit: '—' },
    ],
  },
  {
    title: '🏠 주택 — 임대차 (전세·월세)',
    rows: [
      { range: '5천만원 미만',       rate: '5/1000', limit: '한도 20만원' },
      { range: '5천만~1억원 미만',   rate: '4/1000', limit: '한도 30만원' },
      { range: '1억~6억원 미만',     rate: '3/1000', limit: '—' },
      { range: '6억~12억원 미만',    rate: '4/1000', limit: '—' },
      { range: '12억~15억원 미만',   rate: '5/1000', limit: '—' },
      { range: '15억원 이상',         rate: '6/1000', limit: '—' },
    ],
  },
  {
    title: '🏢 오피스텔',
    rows: [
      { range: '매매교환', rate: '5/1000', limit: '—' },
      { range: '임대차 등', rate: '4/1000', limit: '—' },
    ],
  },
  {
    title: '🗂 그 외 (토지·상가 등)',
    rows: [
      { range: '매매·임대차 모두', rate: '9/1000 이내', limit: '협의' },
    ],
  },
];

function RateTable() {
  return (
    <View style={s.tableCard}>
      <View style={s.tableTitleRow}>
        <View style={s.tableAccent} />
        <Text style={s.tableTitle}>중개보수 요율표 (서울 기준)</Text>
      </View>

      {RATE_SECTIONS.map((sec, si) => (
        <View key={si} style={[s.tableSection, si < RATE_SECTIONS.length - 1 && { marginBottom: 14 }]}>
          <Text style={s.tableSectionTitle}>{sec.title}</Text>
          <View style={s.tableSectionBody}>
            {/* 헤더 */}
            <View style={[s.tableRow, s.tableRowHead]}>
              <Text style={[s.tCell, s.tCellHead, { flex: 3 }]}>거래금액</Text>
              <Text style={[s.tCell, s.tCellHead, { flex: 2, textAlign: 'center' }]}>상한요율</Text>
              <Text style={[s.tCell, s.tCellHead, { flex: 2, textAlign: 'right' }]}>한도액</Text>
            </View>
            {sec.rows.map((r, ri) => (
              <View
                key={ri}
                style={[
                  s.tableRow,
                  ri % 2 === 1 && { backgroundColor: '#FAFFFE' },
                  ri === sec.rows.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={[s.tCell, { flex: 3, color: C.textDark }]}>{r.range}</Text>
                <Text style={[s.tCell, { flex: 2, textAlign: 'center', fontWeight: '700', color: C.primaryDark }]}>
                  {r.rate}
                </Text>
                <Text style={[s.tCell, { flex: 2, textAlign: 'right', color: r.limit === '—' ? C.textLight : '#E07A5F' }]}>
                  {r.limit}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={s.tableNoteBox}>
        <Text style={s.tableNote}>※ 분양권: 거래금액 = 불입금액(융자포함) + 프리미엄</Text>
        <Text style={s.tableNote}>※ 월세 환산: 보증금 + (월세 × 100), 환산액 5천만원 미만 시 보증금 + (월세 × 70)</Text>
      </View>
    </View>
  );
}

/* ────────────────────────────────────────
 *  스타일
 * ──────────────────────────────────────── */
const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  container: { padding: 16, paddingBottom: 52 },

  section:      { marginBottom: 14 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: C.textMid, marginBottom: 8, letterSpacing: 0.2 },

  infoBox: {
    marginTop: 8, backgroundColor: C.primaryLight,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderLeftWidth: 3, borderLeftColor: C.primary,
  },
  infoTxt: { fontSize: 12, color: C.primaryDark, fontWeight: '500' },

  // 탭
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1, paddingVertical: 11, borderRadius: 12,
    backgroundColor: C.white,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center',
  },
  tabActive:    { backgroundColor: C.primary, borderColor: C.primary },
  tabTxt:       { fontSize: 13, fontWeight: '600', color: C.textMid },
  tabTxtActive: { fontSize: 13, fontWeight: '700', color: C.white },

  // 입력 카드
  card: {
    backgroundColor: C.white, borderRadius: 20,
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16,
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
  },
  divider: { height: 1, backgroundColor: '#EEF5F3', marginVertical: 14 },

  inputRow:   { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: C.textMid, marginBottom: 7 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'stretch',
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, overflow: 'hidden',
  },
  input: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 16, color: C.textDark,
  },
  inputUnit: {
    justifyContent: 'center', paddingHorizontal: 14,
    backgroundColor: C.primaryLight,
  },
  inputUnitTxt: { fontSize: 13, fontWeight: '700', color: C.primary },

  // 체크박스
  checkRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: C.border,
    marginRight: 10, alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: C.primary, borderColor: C.primary },
  checkmark:  { fontSize: 13, color: '#FFF', fontWeight: '800' },
  checkLabel: { fontSize: 13, color: C.textDark, fontWeight: '500' },

  // 요율 직접 입력
  customRateWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, paddingLeft: 32, gap: 10,
  },
  customRateInput: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    overflow: 'hidden',
  },
  customRateField: {
    paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 15, color: C.textDark, width: 80, textAlign: 'right',
  },
  customRateUnit: {
    paddingHorizontal: 10, paddingVertical: 9,
    fontSize: 13, fontWeight: '700', color: C.primary,
    backgroundColor: C.primaryLight,
  },
  customRateHintBox: {
    backgroundColor: '#F0F0F0', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  customRateHint: { fontSize: 12, color: C.textMid, fontWeight: '600' },

  // 계산 버튼
  calcBtn: {
    backgroundColor: C.primary, borderRadius: 16,
    paddingVertical: 17, alignItems: 'center', marginBottom: 14,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  calcBtnTxt: { fontSize: 16, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },

  // ── 결과 카드
  resultCard: {
    borderRadius: 22, marginBottom: 16, overflow: 'hidden',
    backgroundColor: C.white,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14, shadowRadius: 14, elevation: 6,
  },
  resultHead: {
    backgroundColor: C.primaryDark,
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  resultHeadLabel: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  resultHeadSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)' },

  resultHighlight: {
    backgroundColor: C.primary,
    paddingHorizontal: 20, paddingVertical: 20,
    alignItems: 'center',
  },
  resultHighlightLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 6, fontWeight: '500' },
  resultHighlightAmt: {
    fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: -0.5,
  },
  resultHighlightWon: { fontSize: 20, fontWeight: '700' },

  resultDetail: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },

  rateBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  rateBadge: {
    backgroundColor: C.primaryLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  rateBadgeTxt: { fontSize: 13, fontWeight: '700', color: C.primaryDark },
  ratePct:      { fontSize: 13, color: C.textMid, fontWeight: '500' },
  limitBadge: {
    backgroundColor: '#FDEEE9', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 5,
  },
  limitBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#E07A5F' },

  detailDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 7,
  },
  detailLabel:      { fontSize: 14, color: C.textMid, fontWeight: '500' },
  detailLabelTotal: { fontSize: 15, color: C.primaryDark, fontWeight: '700' },
  detailValue:      { fontSize: 14, fontWeight: '600', color: C.textDark },
  detailValueTotal: { fontSize: 17, fontWeight: '800', color: C.primaryDark },

  resultNote: {
    fontSize: 11, color: C.textLight,
    paddingHorizontal: 20, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#F5F5F5',
  },
  saveBtn: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: C.primary, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  saveBtnDone: { backgroundColor: '#98BDB5' },
  saveBtnTxt:  { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // ── 요율표
  tableCard: {
    backgroundColor: C.white, borderRadius: 20,
    padding: 18, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  tableTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  tableAccent:   { width: 4, height: 18, backgroundColor: C.primary, borderRadius: 2, marginRight: 10 },
  tableTitle:    { fontSize: 15, fontWeight: '700', color: C.textDark },

  tableSection:     {},
  tableSectionTitle: {
    fontSize: 13, fontWeight: '700', color: C.textMid,
    marginBottom: 6,
  },
  tableSectionBody: {
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
  },
  tableRowHead: { backgroundColor: C.primaryLight },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: '#EEF5F3',
    paddingVertical: 9, paddingHorizontal: 12,
  },
  tCell:     { fontSize: 12, color: C.textMid, lineHeight: 17 },
  tCellHead: { fontWeight: '700', color: C.primaryDark, fontSize: 12 },

  tableNoteBox: {
    marginTop: 14, backgroundColor: '#F8FFFE',
    borderRadius: 10, padding: 12, gap: 4,
  },
  tableNote: { fontSize: 11, color: C.textMid, lineHeight: 18 },
});
