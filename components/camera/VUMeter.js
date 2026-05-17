// VU meter L/R — barras animadas exibidas durante gravação.
// Aceita `levels` opcionalmente ([left, right] 0-1 de metering real).
// Sem levels: simula movimento orgânico via Animated.
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

const BARS = 12;
const BAR_H_MAX = 36;
const BAR_W = 3;
const BAR_GAP = 2;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function BarColumn({ anim, color }) {
  const h = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, BAR_H_MAX],
  });
  return (
    <Animated.View style={[styles.bar, { height: h, backgroundColor: color }]} />
  );
}

export default function VUMeter({ active = false, levels = null, style }) {
  // 12 animações independentes por canal
  const leftAnims  = useRef(Array.from({ length: BARS }, () => new Animated.Value(0.08))).current;
  const rightAnims = useRef(Array.from({ length: BARS }, () => new Animated.Value(0.08))).current;
  const timersRef  = useRef([]);

  function startSimulation(anims) {
    anims.forEach((anim, i) => {
      function cycle() {
        const target = randomBetween(0.05, 0.95);
        const dur    = randomBetween(80, 260);
        Animated.timing(anim, {
          toValue: target, duration: dur,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }).start(() => {
          const t = setTimeout(cycle, randomBetween(20, 80));
          timersRef.current.push(t);
        });
      }
      // Stagger inicial
      const t = setTimeout(cycle, i * 30);
      timersRef.current.push(t);
    });
  }

  function stopSimulation(anims) {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    anims.forEach(a => {
      Animated.timing(a, { toValue: 0.04, duration: 300, useNativeDriver: false }).start();
    });
  }

  useEffect(() => {
    if (active && !levels) {
      startSimulation(leftAnims);
      startSimulation(rightAnims);
    } else if (!active) {
      stopSimulation(leftAnims);
      stopSimulation(rightAnims);
    }
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [active]);

  // Quando recebe levels reais (array [l, r] 0-1)
  useEffect(() => {
    if (!levels || !active) return;
    const [l, r] = levels;
    // Distribui o nível entre as barras com variação por posição
    leftAnims.forEach((a, i) => {
      const pos = i / (BARS - 1); // 0=baixo, 1=topo
      const v = Math.max(0, Math.min(1, l - pos * 0.4 + randomBetween(-0.05, 0.05)));
      Animated.timing(a, { toValue: v, duration: 60, useNativeDriver: false }).start();
    });
    rightAnims.forEach((a, i) => {
      const pos = i / (BARS - 1);
      const v = Math.max(0, Math.min(1, r - pos * 0.4 + randomBetween(-0.05, 0.05)));
      Animated.timing(a, { toValue: v, duration: 60, useNativeDriver: false }).start();
    });
  }, [levels]);

  function getBarColor(i) {
    const pos = i / (BARS - 1);
    if (pos > 0.85) return '#FF3B30'; // vermelho no topo (clipping)
    if (pos > 0.65) return '#FFB341'; // amarelo na zona quente
    return '#00C16A';                  // verde normal
  }

  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      {/* Canal L */}
      <View style={styles.channel}>
        {leftAnims.map((a, i) => (
          <BarColumn key={i} anim={a} color={getBarColor(i)} />
        ))}
      </View>
      {/* Divisor central */}
      <View style={styles.divider} />
      {/* Canal R */}
      <View style={styles.channel}>
        {rightAnims.map((a, i) => (
          <BarColumn key={i} anim={a} color={getBarColor(i)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    backgroundColor: 'rgba(3,10,20,0.72)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,193,106,0.2)',
  },
  channel: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: BAR_GAP,
    height: BAR_H_MAX,
  },
  bar: {
    width: BAR_W,
    borderRadius: 2,
    alignSelf: 'flex-end',
  },
  divider: {
    width: 1,
    height: BAR_H_MAX,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
});
