// Botão de captura Contourline — fiel ao design SVG
// 4 estados:
//  - 'photo'       : modo foto idle (glow azul, logo centrada)
//  - 'photo-wave'  : foto capturada (onda azul saindo, breve)
//  - 'video-hold'  : segurando p/ gravar vídeo (onda vermelha pulsante)
//  - 'video-mode'  : modo vídeo (glow vermelho, quadrado de stop)
//  - 'video-rec'   : gravando em modo vídeo (anel vermelho + quadrado pulsante)

import React from 'react';
import { View, Pressable, Animated, StyleSheet, Image } from 'react-native';
import Svg, {
  Defs, RadialGradient, Stop, Filter, FeDropShadow,
  Circle, G, Rect,
} from 'react-native-svg';

const LOGO_WHITE = require('../../assets/brand/contourline-icon-white.png');

// Logo OFICIAL Contourline — coords no viewBox 0 0 200 200, centro em 100,100.
// Vamos transladar pra cx 150,150 do SVG do botão (viewBox 300x300).
// E escalar pra caber dentro do círculo r=68 (~136 de diâmetro → escala ~0.68 do viewBox 200)
const RING_OUTER = [
  [100, 20, 6], [120.7, 22.7, 5.5], [140.7, 30.5, 5], [158.6, 43.4, 4.5],
  [172.5, 60, 5], [181.6, 80, 5.5], [184.5, 100, 6], [181.6, 120, 5.5],
  [172.5, 140, 5], [158.6, 156.6, 4.5], [140.7, 169.5, 5], [120.7, 177.3, 5.5],
  [100, 180, 6], [79.3, 177.3, 5.5], [59.3, 169.5, 5], [41.4, 156.6, 4.5],
  [27.5, 140, 5], [18.4, 120, 5.5], [15.5, 100, 6], [18.4, 80, 5.5],
  [27.5, 60, 5], [41.4, 43.4, 4.5], [59.3, 30.5, 5], [79.3, 22.7, 5.5],
];
const RING_MID = [
  [100, 42, 4], [125, 48, 3.5], [145, 62, 3], [158, 80, 3.5],
  [162, 100, 4], [158, 120, 3.5], [145, 138, 3], [125, 152, 3.5],
  [100, 158, 4], [75, 152, 3.5], [55, 138, 3], [42, 120, 3.5],
  [38, 100, 4], [42, 80, 3.5], [55, 62, 3], [75, 48, 3.5],
];
const RING_INNER = [
  [100, 65, 3], [118, 70, 2.5], [130, 85, 2.5], [135, 100, 3],
  [130, 115, 2.5], [118, 130, 2.5], [100, 135, 3], [82, 130, 2.5],
  [70, 115, 2.5], [65, 100, 3], [70, 85, 2.5], [82, 70, 2.5],
];
// Combina + centro em uma única lista
const DOTS_OFFICIAL = [...RING_OUTER, ...RING_MID, ...RING_INNER, [100, 100, 5]];

// SIZE = 300 (do SVG original com onda)
// inner circle radius = 82, outer wave radius = 132, ring radius = 106 (azul) / 111 (vermelho)

export default function CaptureButton({
  mode = 'photo',        // 'photo' | 'video'
  recording = false,
  rippleAnim,            // Animated.Value 0-1 (foto capturada)
  recordPulseAnim,       // Animated.Value 0-1 (loop quando gravando)
  onPress,
  onLongPress,
  onPressOut,
  size = 112,            // tamanho do botão visível na tela (do snippet RN)
}) {

  // O SVG é 300x300 mas o "botão visível" é o círculo central r=82 (164 de diâmetro)
  // Vamos manter a viewBox 300x300 e escalar a View pro tamanho desejado
  // proportions: button core ≈ size, wave radius reaches size * 1.6
  const stageSize = size * 1.6;

  const isVideoMode = mode === 'video';
  const showRecording = recording;
  const accentColor = (showRecording || isVideoMode) ? '#FF3B45' : '#2B83FF';
  const accentSoft  = (showRecording || isVideoMode) ? '#FF7A82' : '#73B7FF';

  // Animação da onda (foto capturada ou gravando)
  const rippleScale = rippleAnim
    ? rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1.0] })
    : 0.45;
  const rippleOpacity = rippleAnim
    ? rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] })
    : 0;

  // Pulso pra modo recording
  const recPulseScale = recordPulseAnim
    ? recordPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.10] })
    : 1.0;
  const recPulseOpacity = recordPulseAnim
    ? recordPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0.15] })
    : 0;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressOut={onPressOut}
      delayLongPress={300}
      style={[styles.touch, { width: size, height: size }]}
      hitSlop={20}
    >
      <View style={[
        styles.stage,
        { width: stageSize, height: stageSize, left: (size - stageSize) / 2, top: (size - stageSize) / 2 },
      ]}>

        {/* ── Onda pulsante (recording) — fora do botão ── */}
        {(showRecording || (rippleAnim && mode === 'photo')) && (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              showRecording
                ? { transform: [{ scale: recPulseScale }], opacity: recPulseOpacity }
                : { transform: [{ scale: rippleScale }], opacity: rippleOpacity },
            ]}
            pointerEvents="none"
          >
            <Svg width="100%" height="100%" viewBox="0 0 300 300">
              <Defs>
                <RadialGradient id="wave" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={accentColor} stopOpacity={showRecording ? 0.45 : 0.42} />
                  <Stop offset={showRecording ? '68%' : '70%'} stopColor={accentColor} stopOpacity={showRecording ? 0.09 : 0.08} />
                  <Stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={150} cy={150} r={132} fill="url(#wave)" />
              <Circle
                cx={150} cy={150} r={showRecording ? 111 : 106}
                stroke={accentColor} strokeOpacity={showRecording ? 0.34 : 0.38} strokeWidth={showRecording ? 4 : 3}
              />
            </Svg>
          </Animated.View>
        )}

        {/* ── Botão central ── */}
        <Svg
          width="100%" height="100%" viewBox="0 0 300 300"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            <RadialGradient id="btn-bg-blue" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#102A50" />
              <Stop offset="70%" stopColor="#071A33" />
              <Stop offset="100%" stopColor="#03101F" />
            </RadialGradient>
            <RadialGradient id="btn-bg-red" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#2B0D14" />
              <Stop offset="72%" stopColor="#0A111F" />
              <Stop offset="100%" stopColor="#030A12" />
            </RadialGradient>
            <Filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
              <FeDropShadow dx="0" dy="0" stdDeviation="13" floodColor={accentColor} floodOpacity={0.85} />
            </Filter>
          </Defs>

          {/* Círculo de fundo do botão (escuro com glow) */}
          <Circle
            cx={150} cy={150} r={82}
            fill={`url(#${(showRecording || isVideoMode) ? 'btn-bg-red' : 'btn-bg-blue'})`}
            stroke={accentColor} strokeWidth={4}
            filter="url(#glow)"
          />
          {/* Anel interno claro */}
          <Circle
            cx={150} cy={150} r={68}
            stroke={accentSoft} strokeOpacity={isVideoMode ? 0.32 : 0.38} strokeWidth={2}
          />

          {/* Vídeo modo + GRAVANDO: quadrado vermelho (botão STOP) */}
          {showRecording && mode === 'video' && (
            <Rect x={128} y={128} width={44} height={44} rx={9} fill="#FF4B52" />
          )}

          {/* Vídeo modo + NÃO gravando: bolinha vermelha (botão REC) */}
          {isVideoMode && !showRecording && (
            <Circle cx={150} cy={150} r={26} fill="#FF4B52" />
          )}
        </Svg>

        {/* Logo PNG real (sobreposta ao SVG do botão) — só no modo foto */}
        {mode === 'photo' && (
          <View style={styles.logoOverlay} pointerEvents="none">
            <Image
              source={LOGO_WHITE}
              style={{ width: size * 0.62, height: size * 0.62, resizeMode: 'contain' }}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: {
    alignItems: 'center', justifyContent: 'center',
  },
  stage: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  logoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
});
