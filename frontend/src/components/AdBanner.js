import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * 배너 광고 Placeholder
 * 실제 광고 SDK (Google AdMob 등) 연동 시 이 컴포넌트를 교체하세요.
 */
export default function AdBanner({ style }) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.adTag}>AD</Text>
      <Text style={styles.adText}>배너 광고 영역</Text>
      <Text style={styles.adSize}>320 × 50</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  adTag: {
    position: 'absolute',
    top: 4,
    left: 8,
    fontSize: 9,
    fontWeight: '700',
    color: '#BDBDBD',
    letterSpacing: 1,
  },
  adText: { fontSize: 13, color: '#BDBDBD', fontWeight: '500' },
  adSize: { fontSize: 10, color: '#D0D0D0', marginTop: 2 },
});
