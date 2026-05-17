// Anel pontilhado-assinatura do Contourline.
// Pulsa em "respiracao" (idle) ou pode rotacionar (sync/loading).
// Usa Animated padrao do RN — compativel com Expo Go.
//
// Props:
//   size      diametro em px (default 120)
//   state     'idle' | 'active' | 'record' | 'sync' | 'warning' | 'error'
//   spinning  rotacao continua (default false)
//   dotCount  override do numero de pontos
//   style     extra style no wrapper

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { aura, motion } from '../../theme';

export default function AuraRing({
  size = 120,
  state = 'idle',
  spinning = false,
  dotCount = aura.ring.dotCount,
  style,
}) {
  const stateSpec = aura.states[state] ?? aura.states.idle;

  const breath = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  // Respiracao continua (sobe e desce).
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: motion.duration.breath,
          easing: motion.easing.breath,
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: motion.duration.breath,
          easing: motion.easing.breath,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  // Rotacao opcional (quando spinning=true).
  useEffect(() => {
    if (!spinning) {
      rotation.setValue(0);
      return undefined;
    }
    rotation.setValue(0);
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: motion.duration.spinSlow,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spinning, rotation]);

  const opacity = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });
  const scale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.02],
  });
  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const radius = size / 2 - aura.ring.dotSize - 2;
  const cx = size / 2;
  const cy = size / 2;

  const dots = [];
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    dots.push(
      <Circle
        key={i}
        cx={x}
        cy={y}
        r={aura.ring.dotSize}
        fill={stateSpec.color}
        opacity={stateSpec.opacity}
      />,
    );
  }

  return (
    <Animated.View
      style={[
        styles.wrap,
        { width: size, height: size },
        { opacity, transform: [{ scale }, { rotate }] },
        style,
      ]}
      pointerEvents="none"
    >
      <Svg width={size} height={size}>{dots}</Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
