import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdBanner from '../components/AdBanner';
import { formatNumber, formatManWon } from '../utils/loanCalculator';
import { saveAcquisitionTaxHistory } from '../services/localHistory';

const C = {
  primary:      '#1B998B',
  primaryDark:  '#157A6E',
  primaryLight: '#E3F7F4',
  orange:       '#FF6B35',
  bg:           '#F4FAF8',
  white:        '#FFFFFF',
  textDark:     '#1A2E28',
  textMid:      '#557668',
  textLight:    '#98BDB5',
  border:       '#C5E8E2',
  shadow:       '#1B998B',
  purple:       '#8B5CF6',
  purpleLight:  '#F3EEFF',
};

const ACQ_TYPES = [
  { key: 'sale',        label: '매매' },
  { key: 'gift',        label: '증여' },
  { key: 'inheritance', label: '상속' },
  { key: 'original',    label: '원시' },
];

const PROP_TYPES = [
  { key: 'house',     label: '주택' },
  { key: 'officetel', label: '오피스텔' },
  { key: 'farmland',  label: '농지' },
  { key: 'other',     label: '그 외' },
];

const AREAS = [
  { key: '40',     label: '40㎡▼' },
  { key: '60',     label: '60㎡▼' },
  { key: '85',     label: '85㎡▼' },
  { key: '85plus', label: '85㎡▲' },
];

const HOUSE_COUNTS = [
  { key: 1, label: '1주택' },
  { key: 2, label: '2주택' },
  { key: 3, label: '3주택' },
  { key: 4, label: '그 이상' },
];

/* ────────────────────────────────────────
 *  취득세 계산 로직
 * ──────────────────────────────────────── */
function calculateAcquisitionTax({
  acqType, propType, area, houseCount,
  isAdjusted, isCorporation,
  isDepopulation, isFirstHome, isFarmCultivation,
  price,
}) {
  const isHouse  = propType === 'house';
  const isOver85 = area === '85plus';
  const notes    = [];

  let acqRate  = 0;
  let ruralRate = 0;
  let eduRate  = 0;

  if (isHouse && acqType === 'sale') {
    if (isCorporation) {
      acqRate   = 0.12;
      ruralRate = isOver85 ? 0.01 : 0;
      eduRate   = 0.004;
      notes.push('법인: 주택 취득세 12% 중과 적용');
    } else {
      const count = Math.min(houseCount, 4);

      if (count === 1) {
        if (price <= 600_000_000) {
          acqRate   = 0.01;
          ruralRate = isOver85 ? 0.002 : 0;
          eduRate   = acqRate * 0.1;
        } else if (price <= 900_000_000) {
          // (취득가액 × 2/3억원 - 3) × 1/100
          acqRate   = (price * 2 / 300_000_000 - 3) / 100;
          ruralRate = isOver85 ? 0.002 : 0;
          eduRate   = acqRate * 0.1;
        } else {
          acqRate   = 0.03;
          ruralRate = isOver85 ? 0.002 : 0;
          eduRate   = acqRate * 0.1;
        }

        if (isFirstHome) {
          const rawTax    = Math.floor(price * acqRate);
          const reduction = Math.min(rawTax, 2_000_000);
          notes.push(`생애최초 감면: 최대 ${formatNumber(reduction)}원 감면 (200만원 한도, 실 납부세액 기준)`);
        }
      } else if (count === 2) {
        if (isAdjusted) {
          acqRate   = 0.08;
          ruralRate = isOver85 ? 0.006 : 0;
          eduRate   = 0.004;
        } else {
          if (price <= 600_000_000) {
            acqRate   = 0.01;
            ruralRate = isOver85 ? 0.002 : 0;
            eduRate   = acqRate * 0.1;
          } else if (price <= 900_000_000) {
            acqRate   = (price * 2 / 300_000_000 - 3) / 100;
            ruralRate = isOver85 ? 0.002 : 0;
            eduRate   = acqRate * 0.1;
          } else {
            acqRate   = 0.03;
            ruralRate = isOver85 ? 0.002 : 0;
            eduRate   = acqRate * 0.1;
          }
        }
      } else if (count === 3) {
        if (isAdjusted) {
          acqRate   = 0.12;
          ruralRate = isOver85 ? 0.01 : 0;
          eduRate   = 0.004;
        } else {
          acqRate   = 0.08;
          ruralRate = isOver85 ? 0.006 : 0;
          eduRate   = 0.004;
        }
      } else {
        // 4주택 이상
        acqRate   = 0.12;
        ruralRate = isOver85 ? 0.01 : 0;
        eduRate   = 0.004;
      }
    }

    if (isDepopulation && !isCorporation) {
      notes.push('인구감소지역 특례: 조건 충족 시 세율 특례 가능 (별도 확인 필요)');
    }

  } else if (isHouse && acqType === 'gift') {
    if (isAdjusted && price >= 300_000_000) {
      acqRate   = 0.12;
      ruralRate = isOver85 ? 0.01 : 0;
      eduRate   = 0.004;
      notes.push('조정대상지역 3억원 이상 증여: 12% 중과 적용');
    } else {
      acqRate   = 0.035;
      ruralRate = isOver85 ? 0.002 : 0;
      eduRate   = 0.003;
    }

  } else if (isHouse && (acqType === 'inheritance' || acqType === 'original')) {
    acqRate   = 0.028;
    ruralRate = isOver85 ? 0.002 : 0;
    eduRate   = 0.0016;

  } else if (propType === 'officetel') {
    switch (acqType) {
      case 'sale':
        acqRate  = 0.04; eduRate = 0.004; break;
      case 'gift':
        acqRate  = 0.035; eduRate = 0.003; break;
      default:
        acqRate  = 0.028; eduRate = 0.0016;
    }
    ruralRate = 0.002;

  } else if (propType === 'farmland') {
    switch (acqType) {
      case 'sale':
        if (isFarmCultivation) {
          acqRate   = 0.015;
          ruralRate = 0;
          eduRate   = 0.001;
          notes.push('2년 이상 자경 농지: 취득세 1.5%, 농어촌특별세 면제');
        } else {
          acqRate   = 0.03;
          ruralRate = 0.002;
          eduRate   = 0.002;
        }
        break;
      case 'inheritance':
        acqRate   = 0.023;
        ruralRate = 0.002;
        eduRate   = 0.0006;
        break;
      default:
        acqRate   = 0.035;
        ruralRate = 0.002;
        eduRate   = 0.003;
    }

  } else {
    // 그 외 (토지, 건물 등)
    switch (acqType) {
      case 'sale':
        acqRate  = 0.04;  ruralRate = 0.002; eduRate = 0.004; break;
      case 'gift':
        acqRate  = 0.035; ruralRate = 0.002; eduRate = 0.003; break;
      default:
        acqRate  = 0.028; ruralRate = 0.002; eduRate = 0.0016;
    }
  }

  const acqTax   = Math.floor(price * acqRate);
  const ruralTax = Math.floor(price * ruralRate);
  const eduTax   = Math.floor(price * eduRate);

  return {
    acqRate, ruralRate, eduRate,
    acqTax, ruralTax, eduTax,
    total: acqTax + ruralTax + eduTax,
    price,
    notes,
  };
}

function toWon(manwon) {
  const n = Number(String(manwon).replace(/,/g, ''));
  return isNaN(n) ? 0 : Math.round(n * 10000);
}

/* ────────────────────────────────────────
 *  메인 화면
 * ──────────────────────────────────────── */
export default function AcquisitionTaxScreen() {
  const [acqType, setAcqType]             = useState('sale');
  const [propType, setPropType]           = useState('house');
  const [area, setArea]                   = useState('85');
  const [houseCount, setHouseCount]       = useState(1);
  const [isAdjusted, setIsAdjusted]       = useState(false);
  const [isCorporation, setIsCorporation] = useState(false);
  const [isFirstRental, setIsFirstRental] = useState(false);
  const [isMetro, setIsMetro]             = useState(false);
  const [isDepop, setIsDepop]             = useState(false);
  const [isFirstHome, setIsFirstHome]     = useState(false);
  const [isFarmCult, setIsFarmCult]       = useState(false);
  const [price, setPrice]                 = useState('');
  const [stdPrice, setStdPrice]           = useState('');
  const [result, setResult]               = useState(null);
  const [saved, setSaved]                 = useState(false);

  const isHouse         = propType === 'house';
  const isFarmland      = propType === 'farmland';
  const showArea        = isHouse;
  const showHouseCount  = isHouse && acqType === 'sale';
  const showFarmCult    = isFarmland && acqType === 'sale';
  const showFirstHome   = isHouse && acqType === 'sale' && houseCount === 1;
  const showAdjusted    = isHouse;

  function clearResult() { setResult(null); setSaved(false); }

  function handleCalc() {
    const priceWon = toWon(price);
    if (!priceWon || priceWon <= 0) {
      Alert.alert('입력 오류', '취득가액을 입력해주세요.');
      return;
    }
    const res = calculateAcquisitionTax({
      acqType, propType, area, houseCount,
      isAdjusted, isCorporation,
      isDepopulation: isDepop,
      isFirstHome, isFarmCultivation: isFarmCult,
      price: priceWon,
    });
    setSaved(false);
    setResult(res);
  }

  async function handleSave() {
    if (!result || saved) return;
    try {
      await saveAcquisitionTaxHistory({
        acqType, propType, area, houseCount,
        isAdjusted, isCorporation, isFirstHome,
        price:     result.price,
        acqRate:   result.acqRate,
        ruralRate: result.ruralRate,
        eduRate:   result.eduRate,
        acqTax:    result.acqTax,
        ruralTax:  result.ruralTax,
        eduTax:    result.eduTax,
        total:     result.total,
      });
      setSaved(true);
      Alert.alert('저장 완료', '기록에 저장되었습니다.');
    } catch (err) {
      Alert.alert('저장 실패', err.message);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── 취득 유형 */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>취득 유형</Text>
          <View style={s.tabRow}>
            {ACQ_TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[s.tab, acqType === t.key && s.tabActive]}
                onPress={() => { setAcqType(t.key); clearResult(); }}
                activeOpacity={0.8}
              >
                <Text style={[s.tabTxt, acqType === t.key && s.tabTxtActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 주거 형태 */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>주거 형태</Text>
          <View style={s.tabRow}>
            {PROP_TYPES.map(p => (
              <TouchableOpacity
                key={p.key}
                style={[s.tab, propType === p.key && s.tabActive]}
                onPress={() => { setPropType(p.key); clearResult(); }}
                activeOpacity={0.8}
              >
                <Text style={[s.tabTxt, propType === p.key && s.tabTxtActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 전용면적 (주택만) */}
        {showArea && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>전용면적</Text>
            <View style={s.tabRow}>
              {AREAS.map(a => (
                <TouchableOpacity
                  key={a.key}
                  style={[s.tab, area === a.key && s.tabActive]}
                  onPress={() => { setArea(a.key); clearResult(); }}
                  activeOpacity={0.8}
                >
                  <Text style={[s.tabTxt, area === a.key && s.tabTxtActive]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.infoBox}>
              <Text style={s.infoTxt}>
                {area === '85plus'
                  ? '85㎡ 초과: 농어촌특별세 부과 대상'
                  : '85㎡ 이하: 농어촌특별세 면제'}
              </Text>
            </View>
          </View>
        )}

        {/* ── 보유 주택수 (주택 매매만) */}
        {showHouseCount && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>보유 주택수 <Text style={s.sectionLabelSub}>(취득 후 기준)</Text></Text>
            <View style={s.tabRow}>
              {HOUSE_COUNTS.map(h => (
                <TouchableOpacity
                  key={h.key}
                  style={[s.tab, houseCount === h.key && s.tabActive]}
                  onPress={() => { setHouseCount(h.key); clearResult(); }}
                  activeOpacity={0.8}
                >
                  <Text style={[s.tabTxt, houseCount === h.key && s.tabTxtActive]}>{h.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── 옵션 체크박스 */}
        <View style={s.card}>
          <Text style={s.cardTitle}>상세 조건</Text>
          <CheckItem
            label="법인"
            checked={isCorporation}
            onPress={() => { setIsCorporation(v => !v); clearResult(); }}
          />
          <CheckItem
            label="임대사업자 최초분양"
            checked={isFirstRental}
            onPress={() => { setIsFirstRental(v => !v); clearResult(); }}
          />
          {showAdjusted && (
            <CheckItem
              label="조정대상지역"
              checked={isAdjusted}
              onPress={() => { setIsAdjusted(v => !v); clearResult(); }}
            />
          )}
          <CheckItem
            label="수도권"
            checked={isMetro}
            onPress={() => { setIsMetro(v => !v); clearResult(); }}
          />
          <CheckItem
            label="인구감소지역"
            checked={isDepop}
            onPress={() => { setIsDepop(v => !v); clearResult(); }}
          />
          {showFirstHome && (
            <CheckItem
              label="생애최초 구입"
              checked={isFirstHome}
              onPress={() => { setIsFirstHome(v => !v); clearResult(); }}
            />
          )}
          {showFarmCult && (
            <CheckItem
              label="2년 이상 자경 농지"
              checked={isFarmCult}
              onPress={() => { setIsFarmCult(v => !v); clearResult(); }}
              last
            />
          )}
        </View>

        {/* ── 금액 입력 */}
        <View style={s.card}>
          <AmountInput
            label="취득가액"
            value={price}
            onChange={v => { setPrice(v); clearResult(); }}
          />
          <View style={s.divider} />
          <AmountInput
            label="시가표준액 (선택)"
            value={stdPrice}
            placeholder="미입력 시 취득가액 기준"
            onChange={v => { setStdPrice(v); clearResult(); }}
            last
          />
        </View>

        {/* ── 계산 버튼 */}
        <TouchableOpacity style={s.calcBtn} onPress={handleCalc} activeOpacity={0.85}>
          <Text style={s.calcBtnTxt}>🏠  취득세 계산하기</Text>
        </TouchableOpacity>

        <AdBanner style={{ marginBottom: 16 }} />

        {/* ── 결과 */}
        {result && (
          <ResultCard
            result={result}
            acqType={acqType}
            propType={propType}
            onSave={handleSave}
            saved={saved}
          />
        )}

        {/* ── 참고: 주택 취득세표 */}
        <HouseTaxTable />

        {/* ── 참고: 주택 외 취득세표 */}
        <NonHouseTaxTable />

      </ScrollView>
    </SafeAreaView>
  );
}

/* ────────────────────────────────────────
 *  체크박스 아이템
 * ──────────────────────────────────────── */
function CheckItem({ label, checked, onPress, last }) {
  return (
    <TouchableOpacity
      style={[s.checkRow, last && { marginBottom: 0 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[s.checkbox, checked && s.checkboxOn]}>
        {checked && <Text style={s.checkmark}>✓</Text>}
      </View>
      <Text style={s.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ────────────────────────────────────────
 *  금액 입력 행
 * ──────────────────────────────────────── */
function AmountInput({ label, value, onChange, last, placeholder }) {
  return (
    <View style={[s.inputRow, last && { marginBottom: 0 }]}>
      <Text style={s.inputLabel}>{label}</Text>
      <View style={s.inputWrap}>
        <TextInput
          style={s.input}
          placeholder={placeholder || '금액 입력'}
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
const ACQ_TYPE_LABEL = { sale: '매매', gift: '증여', inheritance: '상속', original: '원시취득' };
const PROP_TYPE_LABEL = { house: '주택', officetel: '오피스텔', farmland: '농지', other: '그 외' };

function ResultCard({ result, acqType, propType, onSave, saved }) {
  const { acqRate, ruralRate, eduRate, acqTax, ruralTax, eduTax, total, price, notes } = result;

  function pct(r) { return (r * 100).toFixed(2) + '%'; }

  return (
    <View style={s.resultCard}>
      {/* 헤더 */}
      <View style={s.resultHead}>
        <Text style={s.resultHeadLabel}>🏠 취득세 계산 결과</Text>
        <Text style={s.resultHeadSub}>
          {PROP_TYPE_LABEL[propType]} · {ACQ_TYPE_LABEL[acqType]} · {formatManWon(price)}
        </Text>
      </View>

      {/* 합계 하이라이트 */}
      <View style={s.resultHighlight}>
        <Text style={s.resultHighlightLabel}>총 납부 세액</Text>
        <Text style={s.resultHighlightAmt}>
          {formatNumber(total)}
          <Text style={s.resultHighlightWon}>원</Text>
        </Text>
      </View>

      {/* 세부 내역 */}
      <View style={s.resultDetail}>
        {/* 세율 뱃지 */}
        <View style={s.rateBadgeRow}>
          <View style={s.rateBadge}>
            <Text style={s.rateBadgeTxt}>취득세 {pct(acqRate)}</Text>
          </View>
          {ruralRate > 0 && (
            <View style={[s.rateBadge, s.rateBadgeGray]}>
              <Text style={s.rateBadgeGrayTxt}>농특 {pct(ruralRate)}</Text>
            </View>
          )}
          <View style={[s.rateBadge, s.rateBadgeBlue]}>
            <Text style={s.rateBadgeBlueTxt}>지교 {pct(eduRate)}</Text>
          </View>
        </View>

        <View style={s.detailDivider} />

        <DetailRow label="취득세"        value={`${formatNumber(acqTax)}원`} />
        <DetailRow label="농어촌특별세"   value={ruralRate > 0 ? `${formatNumber(ruralTax)}원` : '면제'} dim={ruralRate === 0} />
        <DetailRow label="지방교육세"     value={`${formatNumber(eduTax)}원`} />

        <View style={s.detailDivider} />

        <DetailRow label="합  계" value={`${formatNumber(total)}원`} total />
      </View>

      {/* 참고 노트 */}
      {notes.length > 0 && (
        <View style={s.notesBox}>
          {notes.map((n, i) => (
            <Text key={i} style={s.noteText}>ℹ️  {n}</Text>
          ))}
        </View>
      )}

      <Text style={s.resultNote}>
        ※ 취득세는 취득일로부터 60일(상속 6개월) 이내 신고·납부하여야 합니다.{'\n'}
        ※ 정확한 세액은 관할 시·군·구청에 문의하시기 바랍니다.
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

function DetailRow({ label, value, total, dim }) {
  return (
    <View style={s.detailRow}>
      <Text style={[s.detailLabel, total && s.detailLabelTotal]}>{label}</Text>
      <Text style={[
        s.detailValue,
        total && s.detailValueTotal,
        dim && { color: C.textLight },
      ]}>{value}</Text>
    </View>
  );
}

/* ────────────────────────────────────────
 *  참고: 주택 취득세표
 * ──────────────────────────────────────── */
function HouseTaxTable() {
  return (
    <View style={s.tableCard}>
      <View style={s.tableTitleRow}>
        <View style={s.tableAccent} />
        <Text style={s.tableTitle}>주택 취득세표</Text>
      </View>

      {/* 헤더 */}
      <View style={[s.tblRow, s.tblRowHead]}>
        <Text style={[s.tblCell, s.tblCellHead, { flex: 2 }]}>주택수</Text>
        <Text style={[s.tblCell, s.tblCellHead, { flex: 3 }]}>취득가액</Text>
        <Text style={[s.tblCell, s.tblCellHead, { flex: 2, textAlign: 'center' }]}>취득세율</Text>
        <Text style={[s.tblCell, s.tblCellHead, { flex: 2, textAlign: 'center' }]}>농특세*</Text>
        <Text style={[s.tblCell, s.tblCellHead, { flex: 2, textAlign: 'right' }]}>지방교육세</Text>
      </View>

      {HOUSE_TAX_ROWS.map((r, i) => (
        <View
          key={i}
          style={[s.tblRow, i % 2 === 1 && { backgroundColor: '#FAFFFE' }]}
        >
          <Text style={[s.tblCell, { flex: 2, color: C.primaryDark, fontWeight: '700', fontSize: 11 }]}>{r.house}</Text>
          <Text style={[s.tblCell, { flex: 3, color: C.textDark, fontSize: 11 }]}>{r.range}</Text>
          <Text style={[s.tblCell, { flex: 2, textAlign: 'center', fontWeight: '700', color: C.orange }]}>{r.acq}</Text>
          <Text style={[s.tblCell, { flex: 2, textAlign: 'center', color: C.textMid }]}>{r.rural}</Text>
          <Text style={[s.tblCell, { flex: 2, textAlign: 'right', color: C.textMid }]}>{r.edu}</Text>
        </View>
      ))}

      <View style={s.tableNoteBox}>
        <Text style={s.tableNote}>* 농어촌특별세: 전용면적 85㎡ 이하 면제, 초과 시 표 요율 적용</Text>
        <Text style={s.tableNote}>* 1~2주택 6~9억 구간: (취득가액×2/3억원-3)×1/100</Text>
      </View>
    </View>
  );
}

const HOUSE_TAX_ROWS = [
  { house: '1주택',       range: '6억 이하',            acq: '1%',   rural: '—',    edu: '0.1%' },
  { house: '',            range: '6억 초과 9억 이하',    acq: '점진적', rural: '0.2%', edu: '취득세×10%' },
  { house: '',            range: '9억 초과',            acq: '3%',   rural: '0.2%', edu: '0.3%' },
  { house: '2주택(조정)', range: '조정대상지역',          acq: '8%',   rural: '0.6%', edu: '0.4%' },
  { house: '2주택(비조정)', range: '6억 이하',           acq: '1%',   rural: '—',    edu: '0.1%' },
  { house: '',            range: '6억 초과 9억 이하',    acq: '점진적', rural: '0.2%', edu: '취득세×10%' },
  { house: '',            range: '9억 초과',            acq: '3%',   rural: '0.2%', edu: '0.3%' },
  { house: '3주택(조정)', range: '조정대상지역',          acq: '12%',  rural: '1%',   edu: '0.4%' },
  { house: '3주택(비조정)', range: '조정대상지역 외',     acq: '8%',   rural: '0.6%', edu: '0.4%' },
  { house: '4주택 이상',  range: '조정대상지역',          acq: '12%',  rural: '1%',   edu: '0.4%' },
  { house: '',            range: '조정대상지역 외',       acq: '12%',  rural: '1%',   edu: '0.4%' },
];

/* ────────────────────────────────────────
 *  참고: 주택 외 취득세표
 * ──────────────────────────────────────── */
function NonHouseTaxTable() {
  return (
    <View style={[s.tableCard, { marginBottom: 8 }]}>
      <View style={s.tableTitleRow}>
        <View style={[s.tableAccent, { backgroundColor: C.orange }]} />
        <Text style={s.tableTitle}>주택 외 취득세표</Text>
      </View>

      <View style={[s.tblRow, s.tblRowHead]}>
        <Text style={[s.tblCell, s.tblCellHead, { flex: 4 }]}>구분</Text>
        <Text style={[s.tblCell, s.tblCellHead, { flex: 2, textAlign: 'center' }]}>취득세</Text>
        <Text style={[s.tblCell, s.tblCellHead, { flex: 2, textAlign: 'center' }]}>농특세</Text>
        <Text style={[s.tblCell, s.tblCellHead, { flex: 2, textAlign: 'right' }]}>지방교육세</Text>
      </View>

      {NON_HOUSE_TAX_ROWS.map((r, i) => (
        <View
          key={i}
          style={[s.tblRow, i % 2 === 1 && { backgroundColor: '#FAFFFE' }]}
        >
          <Text style={[s.tblCell, { flex: 4, color: C.textDark, fontSize: 11 }]}>{r.label}</Text>
          <Text style={[s.tblCell, { flex: 2, textAlign: 'center', fontWeight: '700', color: C.orange }]}>{r.acq}</Text>
          <Text style={[s.tblCell, { flex: 2, textAlign: 'center', color: C.textMid }]}>{r.rural}</Text>
          <Text style={[s.tblCell, { flex: 2, textAlign: 'right', color: C.textMid }]}>{r.edu}</Text>
        </View>
      ))}

      <View style={s.tableNoteBox}>
        <Text style={s.tableNote}>(검수) 부동산세금 전문 강동균 세무사</Text>
      </View>
    </View>
  );
}

const NON_HOUSE_TAX_ROWS = [
  { label: '주택 외 매매 (토지, 건물 등)', acq: '4%',   rural: '0.2%', edu: '0.4%' },
  { label: '원시취득 (신축), 상속 (농지 외)', acq: '2.8%', rural: '0.2%', edu: '0.16%' },
  { label: '무상취득 (증여)',               acq: '3.5%', rural: '0.2%', edu: '0.3%' },
  { label: '농지 매매 (신규)',              acq: '3%',   rural: '0.2%', edu: '0.2%' },
  { label: '농지 매매 (2년 이상 자경)',      acq: '1.5%', rural: '—',    edu: '0.1%' },
  { label: '농지 상속',                    acq: '2.3%', rural: '0.2%', edu: '0.06%' },
];

/* ────────────────────────────────────────
 *  스타일
 * ──────────────────────────────────────── */
const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  container: { padding: 16, paddingBottom: 52 },

  section:         { marginBottom: 14 },
  sectionLabel:    { fontSize: 13, fontWeight: '700', color: C.textMid, marginBottom: 8, letterSpacing: 0.2 },
  sectionLabelSub: { fontSize: 11, fontWeight: '500', color: C.textLight },

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

  // 카드
  card: {
    backgroundColor: C.white, borderRadius: 20,
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16,
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
  },
  cardTitle: {
    fontSize: 13, fontWeight: '700', color: C.textMid,
    marginBottom: 12, letterSpacing: 0.2,
  },
  divider: { height: 1, backgroundColor: '#EEF5F3', marginVertical: 14 },

  // 체크박스
  checkRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: C.border,
    marginRight: 10, alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: C.primary, borderColor: C.primary },
  checkmark:  { fontSize: 13, color: '#FFF', fontWeight: '800' },
  checkLabel: { fontSize: 14, color: C.textDark, fontWeight: '500' },

  // 입력
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

  // 계산 버튼
  calcBtn: {
    backgroundColor: C.purple, borderRadius: 16,
    paddingVertical: 17, alignItems: 'center', marginBottom: 14,
    shadowColor: C.purple, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  calcBtnTxt: { fontSize: 16, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },

  // 결과 카드
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
  resultHeadSub:   { fontSize: 11, color: 'rgba(255,255,255,0.65)' },

  resultHighlight: {
    backgroundColor: C.purple,
    paddingHorizontal: 20, paddingVertical: 20, alignItems: 'center',
  },
  resultHighlightLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 6, fontWeight: '500' },
  resultHighlightAmt:   { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  resultHighlightWon:   { fontSize: 20, fontWeight: '700' },

  resultDetail: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },

  rateBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  rateBadge: {
    backgroundColor: C.primaryLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  rateBadgeTxt:     { fontSize: 13, fontWeight: '700', color: C.primaryDark },
  rateBadgeGray:    { backgroundColor: '#F5F5F5' },
  rateBadgeGrayTxt: { fontSize: 13, fontWeight: '700', color: C.textMid },
  rateBadgeBlue:    { backgroundColor: '#EFF6FF' },
  rateBadgeBlueTxt: { fontSize: 13, fontWeight: '700', color: '#3B82F6' },

  detailDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 7,
  },
  detailLabel:      { fontSize: 14, color: C.textMid, fontWeight: '500' },
  detailLabelTotal: { fontSize: 15, color: C.primaryDark, fontWeight: '700' },
  detailValue:      { fontSize: 14, fontWeight: '600', color: C.textDark },
  detailValueTotal: { fontSize: 17, fontWeight: '800', color: C.primaryDark },

  notesBox: {
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: '#FFFBEB', borderRadius: 10,
    padding: 12, gap: 6,
    borderLeftWidth: 3, borderLeftColor: C.orange,
  },
  noteText: { fontSize: 12, color: '#92400E', lineHeight: 18 },

  resultNote: {
    fontSize: 11, color: C.textLight,
    paddingHorizontal: 20, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#F5F5F5',
    lineHeight: 17,
  },
  saveBtn: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: C.purple, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  saveBtnDone: { backgroundColor: '#98BDB5' },
  saveBtnTxt:  { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // 참고 테이블
  tableCard: {
    backgroundColor: C.white, borderRadius: 20,
    padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  tableTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tableAccent:   { width: 4, height: 18, backgroundColor: C.purple, borderRadius: 2, marginRight: 10 },
  tableTitle:    { fontSize: 15, fontWeight: '700', color: C.textDark },

  tblRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: '#EEF5F3',
    paddingVertical: 8, paddingHorizontal: 4,
  },
  tblRowHead:  { backgroundColor: C.primaryLight },
  tblCell:     { fontSize: 11, color: C.textMid, lineHeight: 16 },
  tblCellHead: { fontWeight: '700', color: C.primaryDark, fontSize: 11 },

  tableNoteBox: {
    marginTop: 10, backgroundColor: '#F8FFFE',
    borderRadius: 8, padding: 10, gap: 3,
  },
  tableNote: { fontSize: 11, color: C.textMid, lineHeight: 17 },
});
