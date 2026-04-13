import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// 개발 중: 테스트 ID / 릴리즈: 실제 ID
const BANNER_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : 'ca-app-pub-8353634332299342/8787618325';

export default function AdBanner({ style }) {
  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={BANNER_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
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
