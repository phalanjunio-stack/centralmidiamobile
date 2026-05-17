// Botao Aura com glow + feedback de press (scale).
// Usa Animated padrao do RN — compativel com Expo Go.
//
// Variantes: primary | ghost | danger | success
// Tamanhos: sm | md | lg

import React, { useRef } from 'react';
import { Pressable, StyleSheet, Animated } from 'react-native';

import { colors, glow, radii, motion } from '../../theme';

export default function AuraButton({
  variant = 'primary',
  size = 'md',
  onPress,
  onLongPress,
  disabled = false,
  children,
  style,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.96,
      duration: motion.duration.fast,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: motion.duration.base,
      easing: motion.easing.smooth,
      useNativeDriver: true,
    }).start();
  };

  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const s = SIZES[size] ?? SIZES.md;

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        v.glow,
        { borderRadius: s.radius, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.pressable,
          {
            backgroundColor: v.bg,
            borderColor: v.borderColor,
            borderRadius: s.radius,
            paddingHorizontal: s.px,
            paddingVertical: s.py,
            minHeight: s.minH,
          },
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const VARIANTS = {
  primary: {
    bg: colors.aura.primary,
    borderColor: colors.aura.primary,
    glow: glow.medium,
  },
  ghost: {
    bg: colors.bg.glass,
    borderColor: colors.border.glassHi,
    glow: glow.soft,
  },
  danger: {
    bg: colors.state.record,
    borderColor: colors.state.record,
    glow: glow.record,
  },
  success: {
    bg: colors.state.success,
    borderColor: colors.state.success,
    glow: glow.success,
  },
};

const SIZES = {
  sm: { px: 12, py: 8, radius: radii.md, minH: 36 },
  md: { px: 16, py: 12, radius: radii.lg, minH: 48 },
  lg: { px: 20, py: 16, radius: radii.xl, minH: 56 },
};

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
  },
});
