// Aura Design System — Specs do anel-assinatura do Contourline.
// O anel pontilhado eh o elemento visual mais identificavel da marca.
// Usado em: CaptureButton, status, focus rings, splash.

import { colors } from './colors';

export const aura = {
  ring: {
    dotCount: 60,       // pontos ao redor (mesmo padrao do logo)
    dotSize: 3,         // diametro de cada ponto
    strokeWidth: 1.5,
  },

  // Estados visuais do anel
  states: {
    idle: {
      color: colors.aura.primary,
      glow: colors.aura.primaryGlow,
      opacity: 0.85,
    },
    active: {
      color: colors.aura.primary,
      glow: colors.aura.primaryGlow,
      opacity: 1,
    },
    record: {
      color: colors.state.record,
      glow: colors.state.recordGlow,
      opacity: 1,
    },
    sync: {
      color: colors.state.success,
      glow: colors.state.successGlow,
      opacity: 1,
    },
    warning: {
      color: colors.state.warning,
      glow: colors.state.warningGlow,
      opacity: 1,
    },
    error: {
      color: colors.state.error,
      glow: colors.state.errorGlow,
      opacity: 1,
    },
  },
};
