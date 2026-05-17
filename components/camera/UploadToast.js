// Toast transitório que aparece quando começa/conclui upload.
// Some sozinho após `duration` ms.
import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet, Easing } from 'react-native';
import { CloudUpload, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { colors } from '../../src/theme';

const VARIANTS = {
  info:    { color: '#1F8BFF', Icon: CloudUpload, border: 'rgba(31,139,255,0.4)', bg: 'rgba(31,139,255,0.10)' },
  success: { color: '#00C16A', Icon: CheckCircle2, border: 'rgba(0,193,106,0.4)', bg: 'rgba(0,193,106,0.10)' },
  error:   { color: '#FF3B30', Icon: AlertTriangle, border: 'rgba(255,59,48,0.4)', bg: 'rgba(255,59,48,0.10)' },
};

export default function UploadToast({ visible, variant = 'info', title, sub, duration = 3000, onHide }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const v = VARIANTS[variant] || VARIANTS.info;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();

      const t = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
        ]).start(() => onHide?.());
      }, duration);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { opacity, transform: [{ translateY }], borderColor: v.border, backgroundColor: 'rgba(8,14,26,0.92)' }]}
    >
      <View style={[styles.iconBox, { backgroundColor: v.bg, borderColor: v.border }]}>
        <v.Icon size={18} color={v.color} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {sub ? <Text style={styles.sub} numberOfLines={1}>{sub}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', top: 12, left: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10, borderRadius: 14, borderWidth: 1,
    zIndex: 100,
  },
  iconBox: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title:  { color: '#fff', fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  sub:    { color: 'rgba(255,255,255,0.6)', fontSize: 10.5, fontFamily: 'Inter_500Medium', marginTop: 2 },
});
