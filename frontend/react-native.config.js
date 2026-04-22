// INCLUDE_ADS=true 일 때만 AdMob 네이티브 모듈을 오토링킹에 포함
const includeAds = process.env.INCLUDE_ADS === 'true';

module.exports = {
  dependencies: {
    'react-native-google-mobile-ads': {
      platforms: {
        android: includeAds ? undefined : null,
        ios:     includeAds ? undefined : null,
      },
    },
  },
};
