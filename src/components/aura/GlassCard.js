// Cartao glassmorphism com blur nativo + highlight + glow opcional.
// Use pra cards de evento, painel de status, sheets.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, glow as glowTokens, radii } from '../../theme';

export default function GlassCard({
  intensity = 60,
  tint = 'dark',
  glowLevel = 'none',
  radius = radii.lg,
  bordered = true,
  children,
  style,
  contentStyle,
}) {
  const shadow = glowLevel === 'none' ? null : glowTokens[glowLevel];

  return (
    <View
      style={[
        styles.wrap,
        { borderRadius: radius, backgroundColor: colors.bg.surface },
        shadow,
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.06)',
          'rgba(255, 255, 255, 0)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <View
        style={[
          {
            borderRadius: radius,
            borderWidth: bordered ? StyleSheet.hairlineWidth : 0,
            borderColor: colors.border.glassHi,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
});
