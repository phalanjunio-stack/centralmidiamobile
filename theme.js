// Paleta exata do design — usar em todos os screens
export const colors = {
  // Backgrounds
  bg:         '#0a0f1c',  // fundo principal (azul-marinho bem escuro)
  bgElevated: '#0f172a',  // header, modals
  card:       '#131b2e',  // cards
  cardElev:   '#1a2440',  // cards elevados (hover/active)
  border:     '#1e2a44',  // bordas sutis

  // Text
  text:    '#f1f5f9',
  textMid: '#cbd5e1',
  muted:   '#94a3b8',
  faint:   '#64748b',

  // Brand & accents
  brand:        '#3b82f6',   // azul principal
  brandSoft:    '#1e3a8a',   // azul escuro
  brandFaded:   'rgba(59, 130, 246, 0.12)',

  // Quick action colors
  camera:   '#1e40af',  // azul foto
  video:    '#7c3aed',  // roxo vídeo
  gallery:  '#0d9488',  // teal galeria
  docs:     '#ea580c',  // laranja docs

  // Status
  active:     '#10b981',  // verde ativo/sucesso
  activeBg:   'rgba(16, 185, 129, 0.12)',
  warning:    '#f59e0b',  // amarelo pendente
  warningBg:  'rgba(245, 158, 11, 0.12)',
  error:      '#ef4444',  // vermelho erro
  errorBg:    'rgba(239, 68, 68, 0.12)',
  uploading:  '#3b82f6',  // azul enviando
  uploadingBg:'rgba(59, 130, 246, 0.12)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const fontSize = {
  xs:   11,
  sm:   12,
  base: 14,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
  huge: 28,
};

export const fontWeight = {
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
  heavy:    '800',
};

// Sombras (subtle no dark mode)
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  fab: {
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};
