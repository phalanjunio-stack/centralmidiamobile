// Anel circular premium de sincronização — SVG com glow/aura
// Estilo do mockup 74% — número grande, brilhando, sem texto interno
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function SyncRing({
  pct = 0,
  size = 140,
  stroke = 11,
  color = '#1F8BFF',
  colorSoft = '#5AAEFF',
  subLabel = null, // ex: "1,48 GB de 2,00 GB"
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const progressAnim = useRef(new Animated.Value(0)).current;
  const auraPulse    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: pct / 100,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  useEffect(() => {
    // Pulse contínuo na aura
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(auraPulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(auraPulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const auraScale = auraPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const auraOpacity = auraPulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Aura pulsante atrás do anel */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { alignItems: 'center', justifyContent: 'center', transform: [{ scale: auraScale }], opacity: auraOpacity },
        ]}
      >
        <Svg width={size * 1.3} height={size * 1.3} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="auraSync" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"  stopColor={color}     stopOpacity={0.40} />
              <Stop offset="40%" stopColor={color}     stopOpacity={0.14} />
              <Stop offset="75%" stopColor={color}     stopOpacity={0.04} />
              <Stop offset="100%" stopColor={color}    stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={50} cy={50} r={50} fill="url(#auraSync)" />
        </Svg>
      </Animated.View>

      {/* SVG ring */}
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%"   stopColor={colorSoft} />
            <Stop offset="100%" stopColor={color} />
          </LinearGradient>
        </Defs>

        {/* Track de fundo */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(31,139,255,0.18)"
          strokeWidth={stroke}
          fill="none"
        />

        {/* Progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Número grande centralizado */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.center}>
          <Text style={[styles.pct, { fontSize: size * 0.30 }]}>{Math.round(pct)}%</Text>
        </View>
      </View>
    </View>

    {/* Sublabel embaixo do anel — ex: "1,48 GB de 2,00 GB" */}
    {!!subLabel && (
      <Text style={[styles.subLabel, { marginTop: 14 }]}>{subLabel}</Text>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subLabel: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  pct: {
    color: '#fff',
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -1.5,
    textShadowColor: 'rgba(31,139,255,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
