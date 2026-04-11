const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Google Mobile Ads App ID를 AndroidManifest.xml에 직접 주입하는 커스텀 플러그인
 * react-native-google-mobile-ads의 config plugin 호환성 문제를 우회합니다.
 */
const withGoogleMobileAds = (config, { androidAppId }) => {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application[0];

    if (!application['meta-data']) {
      application['meta-data'] = [];
    }

    // 기존 항목 제거 (중복 방지)
    application['meta-data'] = application['meta-data'].filter(
      (item) => item.$['android:name'] !== 'com.google.android.gms.ads.APPLICATION_ID'
    );

    // AdMob App ID 추가
    application['meta-data'].push({
      $: {
        'android:name': 'com.google.android.gms.ads.APPLICATION_ID',
        'android:value': androidAppId,
      },
    });

    return config;
  });
};

module.exports = withGoogleMobileAds;
