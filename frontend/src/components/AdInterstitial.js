import { useEffect, useRef } from 'react';

// Expo Go에서는 네이티브 모듈 없이 동작하도록 안전하게 로드
let InterstitialAd = null;
let AdEventType = null;
let TestIds = null;
let interstitial = null;

try {
  const ads = require('react-native-google-mobile-ads');
  InterstitialAd = ads.InterstitialAd;
  AdEventType = ads.AdEventType;
  TestIds = ads.TestIds;

  const INTERSTITIAL_ID = __DEV__
    ? TestIds.INTERSTITIAL
    : 'ca-app-pub-8353634332299342/8592786017';

  interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
    requestNonPersonalizedAdsOnly: false,
  });
} catch (_) {
  // Expo Go 환경 — 광고 모듈 없이 실행
}

export default function AdInterstitial({ visible, onClose }) {
  const isLoaded = useRef(false);

  useEffect(() => {
    if (!interstitial) return;

    const unsubLoad = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => { isLoaded.current = true; }
    );
    const unsubClose = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        isLoaded.current = false;
        onClose();
        interstitial.load();
      }
    );
    const unsubError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      () => {
        isLoaded.current = false;
        onClose();
      }
    );

    interstitial.load();

    return () => {
      unsubLoad();
      unsubClose();
      unsubError();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (!interstitial) { onClose(); return; }

    if (isLoaded.current) {
      interstitial.show();
    } else {
      onClose();
    }
  }, [visible]);

  return null;
}
