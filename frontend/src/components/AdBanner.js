import React from 'react';
import { View, StyleSheet } from 'react-native';

// Expo Go에서는 네이티브 모듈 없이 동작하도록 안전하게 로드
let BannerAd = null;
let BannerAdSize = null;
let TestIds = null;

try {
  const ads = require('react-native-google-mobile-ads');
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
} catch (_) {
  // Expo Go 환경 — 광고 모듈 없이 실행
}

const BANNER_ID = TestIds
  ? (__DEV__ ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-8353634332299342/8787618325')
  : null;

export default function AdBanner({ style }) {
  if (!BannerAd || !BANNER_ID) return null;

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={BANNER_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 4,
  },
});
