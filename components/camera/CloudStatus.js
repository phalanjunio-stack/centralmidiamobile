// Ícone de status de upload da câmera
// Estados: idle | sending | sent | error
// Anima suavemente entre os estados
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, Filter, FeDropShadow } from 'react-native-svg';

const SIZE = 44;

// Nuvem SVG simples (viewBox 0 0 24 24)
function CloudShape({ color = '#fff', opacity = 1 }) {
  return (
    <Path
      d="M4 14.5A4.5 4.5 0 0 1 8.5 10H9a5 5 0 0 1 9.9-1H19a3 3 0 0 1 0 6H8.5A4.5 4.5 0 0 1 4 14.5z"
      fill={color}
      opacity={opacity}
    />
  );
}

// Seta pra cima (enviando)
function ArrowUp({ color = '#fff' }) {
  return (
    <Path
      d="M12 17v-6M9 14l3-3 3 3"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
}

// Check (enviado)
function Check({ color = '#00C16A' }) {
  return (
    <Path
      d="M9 12l2 2 4-4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
}

// X (erro)
function XMark({ color = '#FF4B52' }) {
  return (
    <Path
      d="M10 10l4 4M14 10l-4 4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
}

export default function CloudStatus({ state = 'idle', count = 0, size = SIZE }) {
  // states: 'idle' | 'sending' | 'sent' | 'error'
  const sendingAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const loopRef     = useRef(null);

  useEffect(() => {
    if (loopRef.current) {
      loopRef.current.stop();
      loopRef.current = null;
    }

    if (state === 'sending') {
      // Seta sobe e repete
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(sendingAnim, {
            toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true,
          }),
          Animated.timing(sendingAnim, {
            toValue: 0, duration: 0, useNativeDriver: true,
          }),
        ])
      );
      loopRef.current.start();
    } else {
      sendingAnim.setValue(0);
    }

    if (state === 'sent') {
      // Pulso suave no check
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0,  duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loopRef.current.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (loopRef.current) loopRef.current.stop();
    };
  }, [state]);

  const arrowY = sendingAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, -5],
  });
  const arrowOpacity = sendingAnim.interpolate({
    inputRange: [0, 0.3, 0.8, 1], outputRange: [0.4, 1, 0.7, 0.4],
  });

  const cloudColor =
    state === 'sent'    ? '#00C16A' :
    state === 'error'   ? '#FF4B52' :
    state === 'sending' ? '#1F8BFF' :
    'rgba(255,255,255,0.55)';

  const glowColor =
    state === 'sent'    ? '#00C16A' :
    state === 'error'   ? '#FF4B52' :
    state === 'sending' ? '#1F8BFF' :
    'transparent';

  const scale = size / SIZE;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Defs>
            <Filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
              <FeDropShadow dx={0} dy={0} stdDeviation={2} floodColor={glowColor} floodOpacity={0.9} />
            </Filter>
          </Defs>

          {/* Nuvem */}
          <CloudShape color={cloudColor} />

          {/* Estado: enviando — seta animada */}
          {state === 'sending' && (
            <Animated.View
              style={{
                position: 'absolute', top: 0, left: 0, width: size, height: size,
                transform: [{ translateY: arrowY }],
                opacity: arrowOpacity,
              }}
            >
              <Svg width={size} height={size} viewBox="0 0 24 24">
                <ArrowUp color="#fff" />
              </Svg>
            </Animated.View>
          )}

          {/* Estado: enviado — check */}
          {state === 'sent' && <Check color="#fff" />}

          {/* Estado: erro — X */}
          {state === 'error' && <XMark color="#fff" />}
        </Svg>
      </Animated.View>

      {/* Contador de fila (só se sending e count > 0) */}
      {state === 'sending' && count > 0 && (
        <View style={styles.badge}>
          <Animated.Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Animated.Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF4B52',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: 'Inter_800ExtraBold',
  },
});
