// Aura Design System — Curvas e duracoes de animacao.
// Usa Easing do react-native (Animated padrao) pra ser compativel com Expo Go.

import { Easing } from 'react-native';

export const motion = {
  duration: {
    instant: 100,
    fast: 200,
    base: 300,
    slow: 500,
    breath: 2200,   // ciclo "respiracao" do anel idle
    pulseRec: 800,  // pulso durante gravacao
    spinSlow: 4000, // rotacao continua
  },

  easing: {
    out: Easing.out(Easing.cubic),
    inOut: Easing.inOut(Easing.cubic),
    // Curva premium pra entradas/saidas
    smooth: Easing.bezier(0.22, 1, 0.36, 1),
    // Curva de respiracao (simetrica)
    breath: Easing.bezier(0.4, 0, 0.6, 1),
    linear: Easing.linear,
  },
};
