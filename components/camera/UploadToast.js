// Toast transitório que aparece quando começa/conclui upload.
// Some sozinho após `duration` ms.
import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet, Easing, Image } from 'react-native';
import { colors } from '../../src/theme';
import { IC } from '../../src/theme/icons';

const VARIANTS = {
  info:    { color: '#1F8BFF', icon: IC.enviando, border: 'rgba(31,139,255,0.45)', bg: 'rgba(31,139,255,0.12)' },
  success: { color: '#00C16A', icon: IC.check,    border: 'rgba(0,193,106,0.45)',  bg: 'rgba(0,193,106,0.12)' },
  error:   { color: '#FF3B30', icon: IC.erro,     border: 'rgba(255,59,48,0.45)',  bg: 'rgba(255,59,48,0.12)' },
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
        <Image source={v.icon} style={{ width: 18, height: 18, tintColor: v.color, resizeMode: 'contain' }} />
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
    position: 'absolute',
    // Bem abaixo do event chip + server pill (≈ 130px do topo)
    top: 130,
    left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 14, borderWidth: 1,
    // Elevation Android + zIndex iOS pra ficar SEMPRE em cima
    elevation: 999,
    zIndex: 999,
    // Sombra azul sutil pra destacar
    shadowColor: '#1F8BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  iconBox: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title:  { color: '#fff', fontSize: 13.5, fontFamily: 'Inter_800ExtraBold' },
  sub:    { color: 'rgba(255,255,255,0.7)', fontSize: 11.5, fontFamily: 'Inter_500Medium', marginTop: 2 },
});
