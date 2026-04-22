import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Modal,
  Animated, Dimensions, TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { formatNumber } from '../utils/loanCalculator';
import AdBanner from '../components/AdBanner';

const MAX_REFRESHES  = 3;
const REFRESH_WINDOW = 60 * 1000;
const SCREEN_WIDTH   = Dimensions.get('window').width;
const DRAWER_WIDTH   = Math.min(SCREEN_WIDTH * 0.78, 310);

// ── 따뜻한 컬러 팔레트
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

const MENU_ITEMS = [
  { icon: '📊', label: '대출 계산기',       sub: '4가지 상환방식 계산',      screen: 'LoanCalculator', color: '#1B998B', bg: '#E3F7F4' },
  { icon: '⏩', label: '조기상환 시뮬레이터', sub: '중도상환 이자 절감 계산',   screen: 'EarlyRepayment', color: '#E07A5F', bg: '#FDEEE9' },
  { icon: '🏠', label: '부동산 대출 계산',   sub: 'LTV·DSR 최대 대출 산출',  screen: 'RealEstate',     color: '#3D6B4F', bg: '#E6F2EB' },
  { icon: '📖', label: '상환방식 안내',       sub: '4가지 방식 상세 비교',     screen: 'RepaymentGuide', color: '#8B5CF6', bg: '#F3EEFF' },
];

const QUICK_ITEMS = [
  { icon: '📊', label: '대출\n계산기',     screen: 'LoanCalculator', color: '#1B998B', bg: '#E3F7F4', border: '#A8DED8' },
  { icon: '⏩', label: '조기상환\n시뮬레이터', screen: 'EarlyRepayment', color: '#E07A5F', bg: '#FDEEE9', border: '#F5C4B5' },
  { icon: '🏠', label: '부동산\n대출계산',  screen: 'RealEstate',     color: '#3D6B4F', bg: '#E6F2EB', border: '#AACFB9' },
  { icon: '📖', label: '상환방식\n안내',    screen: 'RepaymentGuide', color: '#8B5CF6', bg: '#F3EEFF', border: '#D1B8FF' },
];

export default function HomeScreen({ navigation }) {
  const { exchangeRates, fetchExchangeRates } = useApp();
  const [loadingRates, setLoadingRates]       = useState(false);
  const [rateError, setRateError]             = useState(false);
  const [refreshBlocked, setRefreshBlocked]   = useState(false);
  const [menuOpen, setMenuOpen]               = useState(false);
  const refreshTimestamps = useRef([]);
  const slideAnim   = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => { loadRates(false); }, [])
  );

  function openMenu() {
    setMenuOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  }

  function closeMenu(cb) {
    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0,             duration: 220, useNativeDriver: true }),
    ]).start(() => { setMenuOpen(false); cb?.(); });
  }

  function handleMenuNavigate(screen) {
    closeMenu(() => navigation.navigate(screen));
  }

  async function loadRates(force = false) {
    setLoadingRates(true);
    setRateError(false);
    try {
      await fetchExchangeRates(force);
    } catch {
      setRateError(true);
    } finally {
      setLoadingRates(false);
    }
  }

  function handleManualRefresh() {
    const now    = Date.now();
    const recent = refreshTimestamps.current.filter(t => now - t < REFRESH_WINDOW);
    refreshTimestamps.current = recent;
    if (recent.length >= MAX_REFRESHES) {
      const oldest  = Math.min(...recent);
      const waitSec = Math.ceil((REFRESH_WINDOW - (now - oldest)) / 1000);
      Alert.alert('잠시 후 시도해주세요', `1분에 최대 ${MAX_REFRESHES}회까지 새로고침할 수 있습니다.\n약 ${waitSec}초 후에 다시 시도해주세요.`);
      setRefreshBlocked(true);
      setTimeout(() => setRefreshBlocked(false), waitSec * 1000);
      return;
    }
    refreshTimestamps.current.push(now);
    setRefreshBlocked(false);
    loadRates(true);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />

      {/* ── 상단바 */}
      <View style={s.topBar}>
        <View>
          <Text style={s.topBarTitle}>대출 계산기</Text>
          <Text style={s.topBarSub}>스마트 대출 관리 도우미</Text>
        </View>
        <TouchableOpacity style={s.hamburgerBtn} onPress={openMenu} activeOpacity={0.7}>
          <View style={s.hLine} />
          <View style={[s.hLine, { width: 18 }]} />
          <View style={s.hLine} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: C.bg }}
      >
        {/* 실시간 환율 */}
        <ExchangeCard
          rates={exchangeRates?.rates}
          date={exchangeRates?.date}
          loading={loadingRates}
          error={rateError}
          blocked={refreshBlocked}
          onRefresh={handleManualRefresh}
        />

        {/* 대출 계산 시작 */}
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => navigation.navigate('LoanCalculator')}
          activeOpacity={0.86}
        >
          <View style={s.ctaIconWrap}>
            <Text style={s.ctaIconTxt}>📊</Text>
          </View>
          <View style={s.ctaTexts}>
            <Text style={s.ctaTitle}>대출 계산 시작</Text>
            <Text style={s.ctaSub}>4가지 상환방식 · 월 납부금 즉시 계산</Text>
          </View>
          <View style={s.ctaArrowWrap}>
            <Text style={s.ctaArrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* 광고 */}
        <AdBanner style={{ marginBottom: 14 }} />

        {/* 계산 기록 */}
        <TouchableOpacity
          style={s.historyBtn}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.85}
        >
          <Text style={s.historyIcon}>📋</Text>
          <View style={s.historyTexts}>
            <Text style={s.historyTitle}>계산 기록 보기</Text>
            <Text style={s.historySub}>저장된 이전 계산 결과 확인</Text>
          </View>
          <Text style={s.historyArrow}>›</Text>
        </TouchableOpacity>

        {/* ── 빠른 바로가기 */}
        <View style={s.quickSection}>
          <View style={s.quickSectionHeader}>
            <View style={s.quickAccent} />
            <Text style={s.quickSectionTitle}>빠른 바로가기</Text>
          </View>
          <View style={s.quickGrid}>
            {QUICK_ITEMS.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[s.quickCard, { backgroundColor: item.bg, borderColor: item.border }]}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.8}
              >
                <Text style={s.quickCardIcon}>{item.icon}</Text>
                <Text style={[s.quickCardLabel, { color: item.color }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 오늘의 금융 상식 */}
        <View style={s.tipSection}>
          <View style={s.tipSectionHeader}>
            <View style={[s.quickAccent, { backgroundColor: C.orange }]} />
            <Text style={s.quickSectionTitle}>알아두면 유용한 대출 상식</Text>
          </View>
          <TipCard
            icon="💡"
            title="DSR이란?"
            desc="총부채원리금상환비율. 연소득 대비 연간 원리금 상환액의 비율로, 현재 대출자의 DSR이 40%를 초과하면 추가 대출이 제한됩니다."
          />
          <TipCard
            icon="📌"
            title="LTV란?"
            desc="담보인정비율. 집값 대비 대출 가능 금액의 비율입니다. 투기과열지구는 최대 40%, 조정대상지역은 50%, 일반 지역은 70%까지 적용됩니다."
          />
          <TipCard
            icon="⚡"
            title="중도상환수수료"
            desc="대출 만기 전 조기상환 시 부과되는 수수료로, 일반적으로 잔여원금의 0.5~1.5% 수준입니다. 보통 3년 이후 면제되는 경우가 많습니다."
            last
          />
        </View>

      </ScrollView>

      {/* ── 햄버거 드로어 */}
      {menuOpen && (
        <Modal visible transparent animationType="none" onRequestClose={() => closeMenu()}>
          <Animated.View style={[s.overlay, { opacity: overlayAnim }]} pointerEvents="box-none">
            <TouchableWithoutFeedback onPress={() => closeMenu()}>
              <View style={StyleSheet.absoluteFill} />
            </TouchableWithoutFeedback>
          </Animated.View>

          <Animated.View style={[s.drawer, { transform: [{ translateX: slideAnim }] }]}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
              {/* 드로어 헤더 */}
              <View style={s.drawerHeader}>
                <View style={s.drawerHeaderLeft}>
                  <Text style={s.drawerAppIcon}>💰</Text>
                  <Text style={s.drawerAppName}>대출 계산기</Text>
                  <Text style={s.drawerAppSub}>스마트 대출 관리 도우미</Text>
                </View>
                <TouchableOpacity style={s.drawerCloseBtn} onPress={() => closeMenu()}>
                  <Text style={s.drawerCloseTxt}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={s.drawerDivider} />

              <View style={s.drawerMenuWrap}>
                <Text style={s.drawerMenuLabel}>메 뉴</Text>
                {MENU_ITEMS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={s.drawerItem}
                    onPress={() => handleMenuNavigate(item.screen)}
                    activeOpacity={0.75}
                  >
                    <View style={[s.drawerIconBox, { backgroundColor: item.bg }]}>
                      <Text style={s.drawerIconTxt}>{item.icon}</Text>
                    </View>
                    <View style={s.drawerItemTexts}>
                      <Text style={[s.drawerItemTitle, { color: item.color }]}>{item.label}</Text>
                      <Text style={s.drawerItemSub}>{item.sub}</Text>
                    </View>
                    <Text style={[s.drawerArrow, { color: item.color }]}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </SafeAreaView>
          </Animated.View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

/* ── 환율 카드 */
function ExchangeCard({ rates, date, loading, error, blocked, onRefresh }) {
  const krwPerUSD = rates?.USD ? Math.round(1 / rates.USD) : null;
  const krwPerJPY = rates?.JPY ? (1 / rates.JPY).toFixed(2)  : null;
  const krwPerEUR = rates?.EUR ? Math.round(1 / rates.EUR) : null;
  const disabled  = loading || blocked;

  return (
    <View style={s.rateCard}>
      <View style={s.rateCardTop}>
        <View style={s.rateTitleRow}>
          <Text style={s.rateCardTitle}>💱 실시간 환율</Text>
          {date && <Text style={s.rateDate}>{date} 기준</Text>}
        </View>
        <TouchableOpacity
          style={[s.refreshBtn, disabled && s.refreshBtnOff]}
          onPress={onRefresh}
          disabled={disabled}
        >
          {loading
            ? <ActivityIndicator size="small" color={C.primary} />
            : <Text style={[s.refreshTxt, blocked && s.refreshTxtOff]}>
                {blocked ? '⏳ 대기 중' : '↻ 새로고침'}
              </Text>
          }
        </TouchableOpacity>
      </View>

      {loading && !rates ? (
        <View style={s.rateCenter}>
          <ActivityIndicator color={C.primary} />
          <Text style={s.rateCenterTxt}>환율 불러오는 중...</Text>
        </View>
      ) : error && !rates ? (
        <View style={s.rateCenter}>
          <Text style={s.rateErrTxt}>⚠️  환율을 불러올 수 없습니다</Text>
          <Text style={s.rateErrSub}>네트워크 확인 후 새로고침 해주세요</Text>
        </View>
      ) : rates ? (
        <View style={s.rateRow}>
          <RateCell flag="🇺🇸" currency="USD" symbol="$"  krw={krwPerUSD} />
          <View style={s.rateDivider} />
          <RateCell flag="🇯🇵" currency="JPY" symbol="¥"  krw={krwPerJPY} decimal />
          <View style={s.rateDivider} />
          <RateCell flag="🇪🇺" currency="EUR" symbol="€"  krw={krwPerEUR} />
        </View>
      ) : null}
    </View>
  );
}

function RateCell({ flag, currency, symbol, krw, decimal }) {
  const display = krw != null ? (decimal ? `₩${krw}` : `₩${formatNumber(krw)}`) : '-';
  return (
    <View style={s.rateCell}>
      <Text style={s.rateCellFlag}>{flag}</Text>
      <Text style={s.rateCellCur}>{currency}</Text>
      <Text style={s.rateCellLbl}>1{symbol} =</Text>
      <Text style={s.rateCellVal}>{display}</Text>
    </View>
  );
}

/* ── 금융 상식 카드 */
function TipCard({ icon, title, desc, last }) {
  return (
    <View style={[s.tipCard, !last && s.tipCardBorder]}>
      <View style={s.tipCardLeft}>
        <View style={s.tipIconWrap}>
          <Text style={s.tipIconTxt}>{icon}</Text>
        </View>
      </View>
      <View style={s.tipCardRight}>
        <Text style={s.tipCardTitle}>{title}</Text>
        <Text style={s.tipCardDesc}>{desc}</Text>
      </View>
    </View>
  );
}

/* ── 스타일 */
const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.primaryDark },
  container: { padding: 16, paddingBottom: 48 },

  // 상단바
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.primary,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  topBarTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: 0.2 },
  topBarSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  hamburgerBtn: { padding: 8, gap: 5, alignItems: 'flex-end' },
  hLine: { width: 24, height: 2.5, backgroundColor: '#FFF', borderRadius: 2 },

  // 환율 카드
  rateCard: {
    backgroundColor: C.white, borderRadius: 20, marginBottom: 14,
    overflow: 'hidden',
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 5,
  },
  rateCardTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    backgroundColor: C.primaryLight,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  rateTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rateCardTitle:{ fontSize: 15, fontWeight: '700', color: C.primaryDark },
  rateDate:     { fontSize: 12, color: C.textLight },
  refreshBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: C.white, borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
    minWidth: 88, alignItems: 'center',
  },
  refreshBtnOff: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' },
  refreshTxt:    { fontSize: 13, fontWeight: '600', color: C.primary },
  refreshTxtOff: { color: '#BDBDBD' },
  rateCenter:    { alignItems: 'center', padding: 24, gap: 8 },
  rateCenterTxt: { fontSize: 14, color: C.textMid },
  rateErrTxt:    { fontSize: 14, color: '#E07A5F', fontWeight: '600' },
  rateErrSub:    { fontSize: 12, color: C.textLight, marginTop: 4 },
  rateRow:       { flexDirection: 'row', paddingVertical: 20, paddingHorizontal: 8 },
  rateDivider:   { width: 1, backgroundColor: C.border, marginVertical: 6 },
  rateCell:      { flex: 1, alignItems: 'center', gap: 5 },
  rateCellFlag:  { fontSize: 26 },
  rateCellCur:   { fontSize: 14, fontWeight: '700', color: C.primary },
  rateCellLbl:   { fontSize: 11, color: C.textLight },
  rateCellVal:   { fontSize: 18, fontWeight: '800', color: C.textDark },

  // CTA 버튼
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.orange,
    borderRadius: 18, padding: 18, marginBottom: 12,
    shadowColor: C.orange, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 7,
  },
  ctaIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  ctaIconTxt: { fontSize: 26 },
  ctaTexts:   { flex: 1 },
  ctaTitle:   { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  ctaSub:     { fontSize: 13, color: 'rgba(255,255,255,0.82)' },
  ctaArrowWrap: {
    width: 32, height: 32, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaArrow: { fontSize: 22, color: '#FFF', fontWeight: '700', marginTop: -1 },

  // 기록 버튼
  historyBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 18,
    padding: 18, marginBottom: 16,
    borderWidth: 1.5, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  historyIcon:   { fontSize: 28, marginRight: 14 },
  historyTexts:  { flex: 1 },
  historyTitle:  { fontSize: 17, fontWeight: '700', color: C.textDark, marginBottom: 3 },
  historySub:    { fontSize: 13, color: C.textMid },
  historyArrow:  { fontSize: 26, color: C.primary, fontWeight: '300' },

  // 빠른 바로가기
  quickSection: {
    backgroundColor: C.white, borderRadius: 20, marginBottom: 14,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  quickSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  quickAccent:        { width: 4, height: 18, backgroundColor: C.primary, borderRadius: 2, marginRight: 10 },
  quickSectionTitle:  { fontSize: 16, fontWeight: '700', color: C.textDark },
  quickGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  quickCard: {
    width: (SCREEN_WIDTH - 32 - 32 - 10) / 2,
    borderRadius: 16, borderWidth: 1.5,
    padding: 16, alignItems: 'center',
  },
  quickCardIcon:  { fontSize: 30, marginBottom: 8 },
  quickCardLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 19 },

  // 금융 상식
  tipSection: {
    backgroundColor: C.white, borderRadius: 20, marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  tipSectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  tipCard: { flexDirection: 'row', padding: 14, alignItems: 'flex-start' },
  tipCardBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  tipCardLeft:   { marginRight: 12 },
  tipIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  tipIconTxt:    { fontSize: 18 },
  tipCardRight:  { flex: 1 },
  tipCardTitle:  { fontSize: 14, fontWeight: '700', color: C.primaryDark, marginBottom: 4 },
  tipCardDesc:   { fontSize: 13, color: C.textMid, lineHeight: 20 },

  // 드로어 오버레이
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
    zIndex: 10,
  },

  // 드로어
  drawer: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: C.white,
    zIndex: 20,
    shadowColor: '#000', shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 14, elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: C.primary,
    paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24,
  },
  drawerHeaderLeft: { flex: 1 },
  drawerAppIcon: { fontSize: 34, marginBottom: 8 },
  drawerAppName: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 3 },
  drawerAppSub:  { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  drawerCloseBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, width: 34, height: 34,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  drawerCloseTxt: { fontSize: 15, color: '#FFF', fontWeight: '700' },
  drawerDivider:  { height: 1, backgroundColor: '#F0F0F0' },
  drawerMenuWrap: { paddingHorizontal: 14, paddingTop: 18 },
  drawerMenuLabel: {
    fontSize: 11, fontWeight: '700', color: '#ADADAD',
    letterSpacing: 1.8, marginBottom: 10, paddingLeft: 6,
  },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 6,
    borderRadius: 14, marginBottom: 2,
  },
  drawerIconBox: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  drawerIconTxt:    { fontSize: 22 },
  drawerItemTexts:  { flex: 1 },
  drawerItemTitle:  { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  drawerItemSub:    { fontSize: 12, color: '#ADADAD', lineHeight: 17 },
  drawerArrow:      { fontSize: 22, fontWeight: '300', marginLeft: 4 },
});
