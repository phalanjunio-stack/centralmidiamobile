// Aura Design System — Receitas de sombra (glow).
// Mistura shadowColor + opacity + radius para dar profundidade premium.
// iOS usa shadow*; Android usa elevation.

import { colors } from './colors';

export const glow = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },

  // Halo sutil para cards e icones inativos
  soft: {
    shadowColor: colors.aura.primary,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },

  // Foco intermediario: botoes ativos, cards selecionados
  medium: {
    shadowColor: colors.aura.primary,
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },

  // Foco forte: botao central de captura, status criticos
  strong: {
    shadowColor: colors.aura.primary,
    shadowOpacity: 0.7,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },

  // Gravacao ao vivo
  record: {
    shadowColor: colors.state.record,
    shadowOpacity: 0.7,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 18,
  },

  // Sincronizado/feito
  success: {
    shadowColor: colors.state.success,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },

  // Aguardando atencao
  warning: {
    shadowColor: colors.state.warning,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  // Falha
  error: {
    shadowColor: colors.state.error,
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
};
