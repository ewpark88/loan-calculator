import { useEffect, useRef } from 'react';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

// 개발 중: 테스트 ID / 릴리즈: 실제 ID
const INTERSTITIAL_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-8353634332299342/8592786017';

// 앱 전역 싱글톤 — 미리 로드해 두고 필요할 때 즉시 표시
const interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
  requestNonPersonalizedAdsOnly: false,
});

export default function AdInterstitial({ visible, onClose }) {
  const isLoaded = useRef(false);

  useEffect(() => {
    const unsubLoad = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => { isLoaded.current = true; }
    );

    const unsubClose = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        isLoaded.current = false;
        onClose();
        // 다음 전면 광고 미리 로드
        interstitial.load();
      }
    );

    const unsubError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      () => {
        isLoaded.current = false;
        onClose(); // 광고 로드 실패 시 그냥 닫기
      }
    );

    // 첫 번째 로드
    interstitial.load();

    return () => {
      unsubLoad();
      unsubClose();
      unsubError();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    if (isLoaded.current) {
      interstitial.show();
    } else {
      // 아직 로드 안 됐으면 스킵
      onClose();
    }
  }, [visible]);

  return null; // AdMob이 자체적으로 오버레이 표시
}
