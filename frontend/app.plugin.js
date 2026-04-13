const { withAndroidManifest } = require('@expo/config-plugins');

const withGoogleMobileAds = (config, { androidAppId }) => {
  return withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application[0];

    if (!application['meta-data']) {
      application['meta-data'] = [];
    }

    // 중복 제거
    application['meta-data'] = application['meta-data'].filter(
      (item) => item.$['android:name'] !== 'com.google.android.gms.ads.APPLICATION_ID'
    );

    // AdMob App ID 삽입
    application['meta-data'].push({
      $: {
        'android:name': 'com.google.android.gms.ads.APPLICATION_ID',
        'android:value': androidAppId,
      },
    });

    return modConfig;
  });
};

module.exports = withGoogleMobileAds;
