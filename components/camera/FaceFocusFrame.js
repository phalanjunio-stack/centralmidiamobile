// Foco estilo iPhone — quadrado amarelo fino que aparece com pulso e some.
// Sem texto, sem glow exagerado — só o feedback visual.
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

export default function FaceFocusFrame({ size = 90 }) {
  const scale   = useRef(new Animated.Value(1.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale,   { toValue: 1,    duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1,    duration: 160, useNativeDriver: true }),
    ]).start(() => {
      // Mantém visível por um instante e depois fade out suave
      Animated.timing(opacity, { toValue: 0.7, duration: 600, delay: 400, useNativeDriver: true }).start();
    });
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.frame,
        { width: size, height: size, opacity, transform: [{ scale }] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1.5,
    borderColor: '#FFCC00',
    borderRadius: 3,
    shadowColor: '#FFCC00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
});
