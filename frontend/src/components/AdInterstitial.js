import { useEffect } from 'react';

/**
 * 전면 광고 플레이스홀더
 * AdMob 연동 시 react-native-google-mobile-ads 로 교체 예정
 */
export default function AdInterstitial({ visible, onClose }) {
  useEffect(() => {
    if (visible) {
      onClose();
    }
  }, [visible]);

  return null;
}
