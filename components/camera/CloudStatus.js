// Ícone de status de upload da câmera — usa PNGs oficiais da marca.
// Estados: idle | sending | sent | error | pending
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, Image, Text } from 'react-native';
import { IC } from '../../src/theme/icons';

const STATE_ICON = {
  idle:    IC.nuvem,
  sending: IC.enviando,
  sent:    IC.enviado,
  error:   IC.erro,
  pending: IC.aguardando,
};

const STATE_GLOW = {
  idle:    'transparent',
  sending: '#1F8BFF',
  sent:    '#00C16A',
  error:   '#FF4B52',
  pending: '#FFB341',
};

export default function CloudStatus({ state = 'idle', count = 0, size = 44 }) {
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const sendingAnim = useRef(new Animated.Value(0)).current;
  const loopRef     = useRef(null);

  useEffect(() => {
    if (loopRef.current) {
      loopRef.current.stop();
      loopRef.current = null;
    }

    if (state === 'sending') {
      // Pulse suave + leve "respiração"
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.10, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.00, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loopRef.current.start();
    } else if (state === 'sent') {
      // Pulse curto de sucesso, depois para
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.00, duration: 320, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]).start();
    } else if (state === 'error') {
      // Shake leve
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.92, duration: 100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.00, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (loopRef.current) loopRef.current.stop();
    };
  }, [state]);

  const glowColor = STATE_GLOW[state] || 'transparent';
  const icon      = STATE_ICON[state] || IC.nuvem;
  const hasGlow   = state !== 'idle';

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {/* Glow behind icon */}
      {hasGlow && (
        <View
          style={[
            styles.glow,
            {
              width: size + 18,
              height: size + 18,
              borderRadius: (size + 18) / 2,
              backgroundColor: glowColor,
              opacity: 0.18,
              position: 'absolute',
            },
          ]}
        />
      )}

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Image
          source={icon}
          style={{
            width: size,
            height: size,
            resizeMode: 'contain',
            opacity: state === 'idle' ? 0.55 : 1,
          }}
        />
      </Animated.View>

      {/* Contador de fila (badge no canto) */}
      {state === 'sending' && count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
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
  glow: {
    shadowColor: '#1F8BFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1F8BFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#06090F',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Inter_800ExtraBold',
  },
});
