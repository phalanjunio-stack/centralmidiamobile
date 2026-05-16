import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import LogoIcon from '../components/icons/LogoIcon';

const { width: SW } = Dimensions.get('window');

// ── Cores do design ──
const C = {
  bgA: '#020b18',
  bgB: '#0D2B4E',
  bgC: '#1A4A80',
  accent:  '#5BA4E5',
  accentSoft: 'rgba(91,164,229,0.85)',
  accentFaded:'rgba(91,164,229,0.35)',
  accent2: '#2E7DD1',
  white:   '#fff',
  white60: 'rgba(255,255,255,0.6)',
  white40: 'rgba(255,255,255,0.4)',
  white28: 'rgba(255,255,255,0.28)',
};

const STAGE = 200;

export default function SplashScreen() {
  // ── Animations ──
  const arcRot      = useRef(new Animated.Value(0)).current;  // 1.6s
  const orbitFast   = useRef(new Animated.Value(0)).current;  // 2.8s
  const ringSlow    = useRef(new Animated.Value(0)).current;  // 28s
  const orbit1      = useRef(new Animated.Value(0)).current;  // 16s base
  const orbit2      = useRef(new Animated.Value(0.25)).current; // 16s -4s offset (25%)
  const orbit3      = useRef(new Animated.Value(0.50)).current;
  const orbit4      = useRef(new Animated.Value(0.75)).current;
  const breathe     = useRef(new Animated.Value(0)).current;
  const dot1        = useRef(new Animated.Value(0)).current;
  const dot2        = useRef(new Animated.Value(0)).current;
  const dot3        = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (val, duration) =>
      Animated.loop(
        Animated.timing(val, {
          toValue: val.__getValue?.() === 1 ? 0 : 1, // restart from 0 each iteration
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

    // Anéis em rotação (cada um tem seu próprio ciclo)
    const spinArc      = Animated.loop(Animated.timing(arcRot,    { toValue: 1, duration: 1600, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }));
    const spinFast     = Animated.loop(Animated.timing(orbitFast, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true }));
    const spinRingSlow = Animated.loop(Animated.timing(ringSlow,  { toValue: 1, duration: 28000, easing: Easing.linear, useNativeDriver: true }));

    // Orbits lentas (4 pontos, mesma duração 16s, fases diferentes)
    const spinOrbit = (val) =>
      Animated.loop(Animated.timing(val, { toValue: val.__getValue() + 1, duration: 16000, easing: Easing.linear, useNativeDriver: true }));

    spinArc.start();
    spinFast.start();
    spinRingSlow.start();
    spinOrbit(orbit1).start();
    spinOrbit(orbit2).start();
    spinOrbit(orbit3).start();
    spinOrbit(orbit4).start();

    // Breathe (3s pulsa logo)
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Loader dots — bounce com stagger
    const bounceDot = (val, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 560, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 560, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
          Animated.delay(280),
        ])
      );
    bounceDot(dot1, 0).start();
    bounceDot(dot2, 150).start();
    bounceDot(dot3, 300).start();

    return () => {
      spinArc.stop(); spinFast.stop(); spinRingSlow.stop();
    };
  }, []);

  const toRot = (val, multi = 1) => val.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', `${360 * multi}deg`],
  });

  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const breatheOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[C.bgA, C.bgB, C.bgC]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow central radial */}
      <View style={styles.glowCenter} />

      {/* Stage com todos os anéis */}
      <View style={styles.stage}>
        {/* Anel mais externo */}
        <View style={[styles.ringSquare, { width: STAGE + 40, height: STAGE + 40, top: -20, left: -20 }]}>
          <View style={[styles.ringCircle, { borderColor: 'rgba(91,164,229,0.08)' }]} />
        </View>

        {/* Anel pontilhado lento */}
        <Animated.View style={[
          styles.ringSquare,
          { width: STAGE, height: STAGE, top: 0, left: 0, transform: [{ rotate: toRot(ringSlow) }] },
        ]}>
          <View style={[styles.ringDashed]} />
        </Animated.View>

        {/* Anel interno fixo */}
        <View style={[styles.ringSquare, { width: STAGE - 32, height: STAGE - 32, top: 16, left: 16 }]}>
          <View style={[styles.ringCircle, { borderColor: 'rgba(46,125,209,0.25)', borderWidth: 1 }]} />
        </View>

        {/* Arc rápido (efeito loading) */}
        <Animated.View style={[
          styles.ringSquare,
          { width: STAGE + 40, height: STAGE + 40, top: -20, left: -20, transform: [{ rotate: toRot(arcRot) }] },
        ]}>
          <Svg width={STAGE + 40} height={STAGE + 40} viewBox={`0 0 ${STAGE + 40} ${STAGE + 40}`}>
            <Circle
              cx={(STAGE + 40) / 2} cy={(STAGE + 40) / 2}
              r={(STAGE + 40) / 2 - 2}
              stroke={C.accentSoft}
              strokeWidth={2}
              fill="none"
              strokeDasharray={`${((STAGE + 40) * Math.PI) * 0.28} ${((STAGE + 40) * Math.PI) * 0.72}`}
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>

        {/* Orbit fast - 1 ponto grande brilhante */}
        <Animated.View style={[
          styles.ringSquare,
          { width: STAGE, height: STAGE, top: 0, left: 0, transform: [{ rotate: toRot(orbitFast) }] },
        ]}>
          <View style={[styles.orbitDot, styles.orbitDotBig]} />
        </Animated.View>

        {/* Orbits slow - 4 pontos pequenos (2 brancos + 2 azuis) */}
        <Animated.View style={[
          styles.ringSquare,
          { width: STAGE, height: STAGE, top: 0, left: 0, transform: [{ rotate: toRot(orbit1) }] },
        ]}>
          <View style={[styles.orbitDot, styles.orbitDotWhite]} />
        </Animated.View>
        <Animated.View style={[
          styles.ringSquare,
          { width: STAGE, height: STAGE, top: 0, left: 0, transform: [{ rotate: toRot(orbit2) }] },
        ]}>
          <View style={[styles.orbitDot, styles.orbitDotWhite]} />
        </Animated.View>
        <Animated.View style={[
          styles.ringSquare,
          { width: STAGE, height: STAGE, top: 0, left: 0, transform: [{ rotate: toRot(orbit3) }] },
        ]}>
          <View style={[styles.orbitDot, styles.orbitDotBlue]} />
        </Animated.View>
        <Animated.View style={[
          styles.ringSquare,
          { width: STAGE, height: STAGE, top: 0, left: 0, transform: [{ rotate: toRot(orbit4) }] },
        ]}>
          <View style={[styles.orbitDot, styles.orbitDotBlue]} />
        </Animated.View>

        {/* Core: logo central pulsando */}
        <Animated.View style={[
          styles.core,
          { transform: [{ scale: breatheScale }], opacity: breatheOpacity },
        ]}>
          <LogoIcon size={70} color={C.white} />
        </Animated.View>
      </View>

      {/* Title */}
      <Text style={styles.title}>
        Iniciando <Text style={styles.titleAccent}>galeria</Text>
      </Text>
      <Text style={styles.version}>versão 1.0.0</Text>

      {/* Bouncing dots */}
      <View style={styles.dots}>
        <BounceDot anim={dot1} />
        <BounceDot anim={dot2} />
        <BounceDot anim={dot3} />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke={C.white28} strokeWidth={2} />
        </Svg>
        <Text style={styles.footerText}>Seus dados estão protegidos</Text>
      </View>
    </View>
  );
}

function BounceDot({ anim }) {
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const opacity    = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  return (
    <Animated.View style={[
      styles.dot,
      { transform: [{ translateY }], opacity },
    ]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bgA,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },

  glowCenter: {
    position: 'absolute',
    width: 600, height: 600, borderRadius: 300,
    backgroundColor: 'rgba(46,125,209,0.12)',
    top: '32%',
    opacity: 0.6,
  },

  stage: {
    width: STAGE, height: STAGE,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },

  ringSquare: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  ringCircle: {
    width: '100%', height: '100%',
    borderRadius: 1000, borderWidth: 1,
  },
  ringDashed: {
    width: '100%', height: '100%',
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderStyle: 'dashed',
  },

  // Pontos das orbits — posicionados no topo, vão rodar com o pai
  orbitDot: {
    position: 'absolute',
    top: -7,
    left: STAGE / 2 - 7,
  },
  orbitDotBig: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.accent,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  orbitDotWhite: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    top: -6, left: STAGE / 2 - 4,
    shadowColor: '#fff',
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  orbitDotBlue: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(91,164,229,0.6)',
    top: -6, left: STAGE / 2 - 3,
  },

  core: {
    width: 90, height: 90,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 5,
  },

  title: {
    marginTop: 44,
    fontSize: 24,
    fontFamily: 'Inter_800ExtraBold',
    color: C.white,
    letterSpacing: 0.5,
  },
  titleAccent: {
    color: C.accent,
    fontStyle: 'normal',
  },
  version: {
    color: C.white40,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 6,
  },

  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 22,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: C.accent2,
    marginHorizontal: 3,
  },

  footer: {
    position: 'absolute',
    bottom: 22, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: C.white28,
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
});
