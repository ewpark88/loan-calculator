import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdBanner({ style }) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>광고 영역</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    marginVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  text: {
    color: '#aaa',
    fontSize: 12,
  },
});
