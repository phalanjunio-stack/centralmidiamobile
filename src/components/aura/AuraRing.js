// Anel pontilhado-assinatura do Contourline.
// Pulsa em "respiracao" (idle) ou pode rotacionar (sync/loading).
//
// Props:
//   size      diametro em px (default 120)
//   state     'idle' | 'active' | 'record' | 'sync' | 'warning' | 'error'
//   spinning  rotacao continua (default false)
//   dotCount  override do numero de pontos
//   style     extra style no wrapper

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
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

  const breath = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, {
        duration: motion.duration.breath,
        easing: motion.easing.breath,
      }),
      -1,
      true,
    );
  }, [breath]);

  useEffect(() => {
    if (spinning) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: motion.duration.spinSlow,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    } else {
      rotation.value = withTiming(0, { duration: motion.duration.fast });
    }
  }, [spinning, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + breath.value * 0.45,
    transform: [
      { scale: 0.96 + breath.value * 0.06 },
      { rotate: `${rotation.value}deg` },
    ],
  }));

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
      style={[styles.wrap, { width: size, height: size }, animatedStyle, style]}
      pointerEvents="none"
    >
      <Svg width={size} height={size}>
        {dots}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
