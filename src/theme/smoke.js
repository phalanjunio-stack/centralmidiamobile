// Aura Design System — Gradient blooms (efeito "fumaca azul").
// Use em LinearGradient/RadialGradient como background sutil de telas e cards.

import { colors } from './colors';

export const smoke = {
  // Halo padrao da marca, sutil
  blue: {
    colors: [colors.aura.primaryHalo, 'transparent'],
    locations: [0, 1],
  },

  // Bloom intenso (hero sections, splash)
  blueIntense: {
    colors: ['rgba(31, 139, 255, 0.22)', 'transparent'],
    locations: [0, 0.7],
  },

  // Toque de roxo (acento esporadico, eventos)
  purpleHint: {
    colors: ['rgba(120, 70, 255, 0.12)', 'transparent'],
    locations: [0, 0.7],
  },

  // Vinheta vertical do fundo
  vignette: {
    colors: ['transparent', colors.bg.base],
    locations: [0, 1],
  },
};
