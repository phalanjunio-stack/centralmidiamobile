// Aura Design System — Paleta de cores.
// Premium dark com base azul Contourline.
// Use SEMPRE via import { colors } from 'src/theme'.

export const colors = {
  // Superficies (do mais escuro pro mais elevado)
  bg: {
    base: '#06090F',        // fundo do app
    surface: '#0C111B',     // cards/sheets
    surfaceHi: '#131A28',   // hover/active
    glass: 'rgba(15, 22, 34, 0.6)', // fill de glassmorphism
    overlay: 'rgba(6, 9, 15, 0.85)', // overlay modais
  },

  // Aura primaria (azul-assinatura Contourline)
  aura: {
    primary: '#1F8BFF',
    primaryDim: '#0F5BB5',
    primaryBright: '#5BA9FF',
    primaryGlow: 'rgba(31, 139, 255, 0.35)',
    primaryHalo: 'rgba(31, 139, 255, 0.12)',
    primaryWisp: 'rgba(31, 139, 255, 0.04)',
  },

  // Estados de acao
  state: {
    record: '#FF3B30',
    recordGlow: 'rgba(255, 59, 48, 0.4)',
    success: '#00C16A',
    successGlow: 'rgba(0, 193, 106, 0.35)',
    warning: '#FFB341',
    warningGlow: 'rgba(255, 179, 65, 0.35)',
    error: '#FF453A',
    errorGlow: 'rgba(255, 69, 58, 0.35)',
    info: '#5BA9FF',
  },

  // Tipografia
  text: {
    primary: '#FFFFFF',
    secondary: '#B8C3D1',
    tertiary: '#8FA1B8',
    muted: '#5D6B7F',
    disabled: '#3A4555',
    inverse: '#06090F',
  },

  // Bordas e divisores
  border: {
    glass: 'rgba(255, 255, 255, 0.06)',
    glassHi: 'rgba(255, 255, 255, 0.12)',
    aura: 'rgba(31, 139, 255, 0.3)',
    auraStrong: 'rgba(31, 139, 255, 0.55)',
  },
};
