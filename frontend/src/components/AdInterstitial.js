import { useEffect } from 'react';
import { useInterstitialAd, TestIds } from 'react-native-google-mobile-ads';

/**
 * 전면 광고
 * 출시 시 AD_UNIT_ID를 실제 광고 단위 ID로 교체하세요.
 * 예) 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX'
 */
const AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-3940256099942544/1033173712'; // TODO: 실제 ID로 교체

const AD_OPTIONS = { requestNonPersonalizedAdsOnly: true };

/**
 * @param {boolean} visible  - true가 되는 순간 광고 표시 시도
 * @param {Function} onClose - 광고 닫힘 or 로드 실패 시 콜백
 */
export default function AdInterstitial({ visible, onClose }) {
  const { isLoaded, isClosed, load, show, error } = useInterstitialAd(
    AD_UNIT_ID,
    AD_OPTIONS
  );

  // 컴포넌트 마운트 시 미리 로드
  useEffect(() => {
    load();
  }, [load]);

  // 광고가 닫히면 onClose 호출 + 다음을 위해 재로드
  useEffect(() => {
    if (isClosed) {
      onClose();
      load();
    }
  }, [isClosed]);

  // 로드 에러 시 onClose 호출
  useEffect(() => {
    if (error) {
      console.warn('[AdInterstitial] 로드 에러:', error.message);
      onClose();
    }
  }, [error]);

  // visible이 true가 되면 광고 표시
  useEffect(() => {
    if (!visible) return;
    if (isLoaded) {
      show();
    } else {
      // 아직 로드 안 됐으면 UX 차단 없이 그냥 넘어감
      onClose();
    }
  }, [visible]);

  // AdMob이 직접 UI를 렌더링하므로 null 반환
  return null;
}
