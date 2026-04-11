import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

/**
 * 배너 광고
 * 출시 시 AD_UNIT_ID를 실제 광고 단위 ID로 교체하세요.
 * 예) 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX'
 */
const AD_UNIT_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : 'ca-app-pub-3940256099942544/6300978111'; // TODO: 실제 ID로 교체

export default function AdBanner({ style }) {
  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={(error) =>
          console.warn('[AdBanner] 로드 실패:', error.message)
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
});
