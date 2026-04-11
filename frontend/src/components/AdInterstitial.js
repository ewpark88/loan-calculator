import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';

/**
 * 전면 광고 Placeholder
 * 실제 광고 SDK (Google AdMob Interstitial 등) 연동 시 이 컴포넌트를 교체하세요.
 * 5초 후 자동으로 닫힙니다.
 */
export default function AdInterstitial({ visible, onClose }) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.adTag}>전면 광고 (Placeholder)</Text>

          <View style={styles.adBox}>
            <Text style={styles.adIcon}>📢</Text>
            <Text style={styles.adTitle}>광고 영역</Text>
            <Text style={styles.adDesc}>전체 화면 광고가 여기에 표시됩니다</Text>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>닫기 (5초 후 자동 닫힘)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  adTag:   { fontSize: 11, color: '#BDBDBD', marginBottom: 16, fontWeight: '600', letterSpacing: 0.5 },
  adBox: {
    width: '100%',
    height: 180,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  adIcon:  { fontSize: 40, marginBottom: 8 },
  adTitle: { fontSize: 16, fontWeight: '700', color: '#9E9E9E' },
  adDesc:  { fontSize: 12, color: '#BDBDBD', marginTop: 6 },
  closeBtn: {
    backgroundColor: '#3F51B5',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  closeBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
