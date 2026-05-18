// Splash orbital — porta do orbital.html pra React Native
// 4 camadas:
//  1. ring-outermost: anel solido bem suave (estático)
//  2. ring-outer: anel tracejado girando devagar (28s)
//  3. ring-inner: anel solido azul (estático)
//  4. arc: arco 270deg girando rápido (1.6s) — efeito "loading OS"
//  5. orbit-fast: 1 ponto brilhante girando rápido (2.8s)
//  6. orbit-slow: 4 pontos girando devagar (16s) com delays
//  7. core: logo PNG pulsando (3s breath)
import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';

const LOGO = require('../assets/brand/contourline-icon-white.png');

export default function OrbitalLogo({ size = 200, logoSize = 70, spinning = true }) {
  const slowSpin    = useRef(new Animated.Value(0)).current; // 28s outer ring
  const fastSpin    = useRef(new Animated.Value(0)).current; // 1.6s arc
  const orbitFast   = useRef(new Animated.Value(0)).current; // 2.8s
  const orbitSlow1  = useRef(new Animated.Value(0)).current;
  const orbitSlow2  = useRef(new Animated.Value(0)).current;
  const orbitSlow3  = useRef(new Animated.Value(0)).current;
  const orbitSlow4  = useRef(new Animated.Value(0)).current;
  const breathe     = useRef(new Animated.Value(0)).current; // 3s

  useEffect(() => {
    const animations = [];

    const startSpin = (val, duration, delay = 0) => {
      val.setValue(0);
      const loop = Animated.loop(
        Animated.timing(val, {
          toValue: 1,
          duration,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
      animations.push(loop);
    };

    startSpin(slowSpin,   28000);
    startSpin(fastSpin,   1600);
    startSpin(orbitFast,  2800);
    startSpin(orbitSlow1, 16000, 0);
    startSpin(orbitSlow2, 16000, -4000); // adianta 4s
    startSpin(orbitSlow3, 16000, -8000);
    startSpin(orbitSlow4, 16000, -12000);

    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    breatheLoop.start();
    animations.push(breatheLoop);

    return () => animations.forEach((a) => a.stop());
  }, []);

  const rot = (val) =>
    val.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const breatheOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  // Posiciona uma view orbitando: tipo container "centrado" + filho deslocado pra cima
  const orbit = (rotate, color, dotSize, glow = true) => (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orbitContainer,
        { width: size, height: size, transform: [{ rotate }] },
      ]}
    >
      <View
        style={[
          styles.orbitDot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            top: -dotSize / 2,
            marginLeft: -dotSize / 2,
            backgroundColor: color,
            shadowColor: glow ? color : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: glow ? 0.9 : 0,
            shadowRadius: glow ? dotSize * 0.7 : 0,
            elevation: glow ? 8 : 0,
          },
        ]}
      />
    </Animated.View>
  );

  return (
    <View style={[styles.stage, { width: size, height: size }]}>
      {/* ring-outermost: anel mais fora, contínuo ultra-suave */}
      <View
        style={[
          styles.ring,
          {
            width: size + 20, height: size + 20,
            borderRadius: (size + 20) / 2,
            top: -10, left: -10,
            borderColor: 'rgba(91,164,229,0.08)',
            borderWidth: 1,
          },
        ]}
      />

      {/* ring-outer: tracejado girando devagar — usar SVG pra stroke dashed real */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { transform: [{ rotate: rot(slowSpin) }] },
        ]}
      >
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={(size / 2) - 1}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={1}
            strokeDasharray="3,6"
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* ring-inner: anel sólido azul fino */}
      <View
        style={[
          styles.ring,
          {
            width: size - 32, height: size - 32,
            borderRadius: (size - 32) / 2,
            top: 16, left: 16,
            borderColor: 'rgba(46,125,209,0.25)',
            borderWidth: 1,
          },
        ]}
      />

      {/* arc: arco azul brilhante girando rápido — só topo + direita visíveis */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.arcWrap,
          {
            width: size + 20, height: size + 20,
            top: -10, left: -10,
            transform: [{ rotate: rot(fastSpin) }],
          },
        ]}
      >
        <View
          style={{
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            borderWidth: 2,
            borderTopColor: 'rgba(91,164,229,0.85)',
            borderRightColor: 'rgba(91,164,229,0.35)',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
          }}
        />
      </Animated.View>

      {/* orbit-fast: 1 ponto brilhante girando rápido */}
      {orbit(rot(orbitFast), '#5BA4E5', 14, true)}

      {/* orbit-slow: 4 pontos girando devagar (2 brancos brilhantes + 2 azul opacos) */}
      {orbit(rot(orbitSlow1), 'rgba(255,255,255,0.85)', 8, true)}
      {orbit(rot(orbitSlow2), 'rgba(255,255,255,0.85)', 8, true)}
      {orbit(rot(orbitSlow3), 'rgba(91,164,229,0.6)',   6, false)}
      {orbit(rot(orbitSlow4), 'rgba(91,164,229,0.6)',   6, false)}

      {/* Core: logo centralizada com breathing */}
      <View style={styles.core}>
        <Animated.View
          style={{
            transform: [{ scale: breatheScale }],
            opacity: breatheOpacity,
            shadowColor: '#5BA4E5',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.85,
            shadowRadius: 22,
            elevation: 12,
          }}
        >
          {/* Glow halo atrás da logo */}
          <View style={[styles.coreHalo, { width: logoSize * 1.6, height: logoSize * 1.6 }]} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 100 100">
              <Defs>
                <SvgRadialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%"   stopColor="#5BA4E5" stopOpacity={0.55} />
                  <Stop offset="60%"  stopColor="#2E7DD1" stopOpacity={0.18} />
                  <Stop offset="100%" stopColor="#2E7DD1" stopOpacity={0} />
                </SvgRadialGradient>
              </Defs>
              <Circle cx={50} cy={50} r={50} fill="url(#coreGlow)" />
            </Svg>
          </View>

          <Image
            source={LOGO}
            style={{
              width: logoSize,
              height: logoSize,
              resizeMode: 'contain',
            }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
  },
  arcWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitContainer: {
    position: 'absolute',
    alignItems: 'center',
    // children positioned absolute relative to this
  },
  orbitDot: {
    position: 'absolute',
    left: '50%',
  },
  core: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreHalo: {
    position: 'absolute',
    alignSelf: 'center',
  },
});
