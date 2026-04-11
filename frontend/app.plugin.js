const {
  withAndroidManifest,
  withProjectBuildGradle,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs   = require('fs');
const path = require('path');

/**
 * react-native-google-mobile-ads 가 Expo config plugin 없이도 빌드되도록
 * 필요한 파일과 Gradle 속성을 직접 주입합니다.
 *
 * 처리 항목:
 *  1. google-mobile-ads.json 파일 생성 (라이브러리 build.gradle 이 요구)
 *  2. 루트 build.gradle ext 블록에 googleMobileAdsJson + compileSdkVersion 추가
 *  3. AndroidManifest.xml 에 AdMob App ID 메타데이터 추가
 */
const withGoogleMobileAds = (config, { androidAppId }) => {

  /* ── 1. google-mobile-ads.json 생성 ─────────────────────── */
  config = withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const androidDir = modConfig.modRequest.platformProjectRoot;
      const jsonPath   = path.join(androidDir, 'google-mobile-ads.json');

      fs.writeFileSync(
        jsonPath,
        JSON.stringify(
          {
            'react-native': {
              android_app_id:             androidAppId,
              delay_app_measurement_init: false,
            },
          },
          null,
          2
        )
      );

      return modConfig;
    },
  ]);

  /* ── 2. 루트 build.gradle 에 ext 속성 주입 ──────────────── */
  config = withProjectBuildGradle(config, (modConfig) => {
    const contents = modConfig.modResults.contents;

    if (!contents.includes('googleMobileAdsJson')) {
      const extBlock = `
ext {
    compileSdkVersion    = 34
    googleMobileAdsJson  = new File(rootDir, "google-mobile-ads.json").absolutePath
}

`;
      // buildscript { 바로 앞에 삽입
      modConfig.modResults.contents = contents.replace(
        /^(buildscript\s*\{)/m,
        `${extBlock}$1`
      );
    }

    return modConfig;
  });

  /* ── 3. AndroidManifest.xml 에 App ID 메타데이터 추가 ───── */
  config = withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application[0];

    if (!application['meta-data']) {
      application['meta-data'] = [];
    }

    // 중복 제거
    application['meta-data'] = application['meta-data'].filter(
      (item) =>
        item.$['android:name'] !== 'com.google.android.gms.ads.APPLICATION_ID'
    );

    // App ID 삽입
    application['meta-data'].push({
      $: {
        'android:name':  'com.google.android.gms.ads.APPLICATION_ID',
        'android:value': androidAppId,
      },
    });

    return modConfig;
  });

  return config;
};

module.exports = withGoogleMobileAds;
