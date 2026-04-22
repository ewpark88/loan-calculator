// android/ 디렉토리가 이미 존재(bare workflow)하므로 플러그인 불필요
const includeAds = false;

module.exports = {
  expo: {
    name: '대출 계산기',
    slug: 'loan-calculator',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#1A237E',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.example.loancalculator',
      icon: './assets/icon.png',
    },
    android: {
      package: 'com.example.loancalculator',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1A237E',
      },
    },
    // 프로덕션 빌드(INCLUDE_ADS=true)일 때만 AdMob 플러그인 포함
    plugins: includeAds
      ? [
          [
            'react-native-google-mobile-ads',
            { androidAppId: 'ca-app-pub-8353634332299342~9237376168' },
          ],
        ]
      : [],
    extra: {
      eas: {
        projectId: '74411a45-cfb3-4301-b7a7-1c297df84e33',
      },
    },
  },
};
