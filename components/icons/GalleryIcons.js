// Conjunto de ícones usados na tela de Galeria
import React from 'react';
import Svg, { Path, Rect, Circle, Polygon } from 'react-native-svg';

export function FilterIcon({ size = 20, color = '#94a3b8' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 5h18l-7 9v6l-4-2v-4L3 5z"
        stroke={color} strokeWidth={1.8}
        strokeLinejoin="round" strokeLinecap="round"
      />
    </Svg>
  );
}

export function SearchIcon({ size = 20, color = '#94a3b8' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={2} />
      <Path d="M21 21l-4.5-4.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 16, color = '#94a3b8' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GridViewIcon({ size = 20, color = '#94a3b8' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={8} height={8} rx={1.5} stroke={color} strokeWidth={1.8} />
      <Rect x={13} y={3} width={8} height={8} rx={1.5} stroke={color} strokeWidth={1.8} />
      <Rect x={3} y={13} width={8} height={8} rx={1.5} stroke={color} strokeWidth={1.8} />
      <Rect x={13} y={13} width={8} height={8} rx={1.5} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function ListViewIcon({ size = 20, color = '#94a3b8' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M3 12h18M3 18h18"
        stroke={color} strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function StarIcon({ size = 18, color = '#fff', filled = true }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlayCircleIcon({ size = 22, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={11} fill="rgba(0,0,0,0.55)" />
      <Polygon points="10,8 17,12 10,16" fill={color} />
    </Svg>
  );
}

export function PhotoBadgeIcon({ size = 14, color = '#fff' }) {
  // pequeno ícone de foto (rectângulo com montanha) usado no canto inferior esquerdo
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={14} rx={2} stroke={color} strokeWidth={1.8} fill="rgba(0,0,0,0.5)" />
      <Circle cx={8} cy={10} r={1.3} fill={color} />
      <Path d="M21 16l-5-5-7 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function VideoBadgeIcon({ size = 14, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={6} width={13} height={12} rx={2} stroke={color} strokeWidth={1.8} fill="rgba(0,0,0,0.5)" />
      <Path d="M16 10l5-3v10l-5-3v-4z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" fill="rgba(0,0,0,0.5)" />
    </Svg>
  );
}

export function PhotoTypeChipIcon({ size = 16, color = '#94a3b8' }) {
  // Versão estilo "chip" — usada nos filtros Fotos/Vídeos/Documentos
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={14} rx={2} stroke={color} strokeWidth={1.8} />
      <Circle cx={8.5} cy={10} r={1.3} fill={color} />
      <Path d="M21 16l-5-5-7 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function VideoTypeChipIcon({ size = 16, color = '#94a3b8' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={6} width={13} height={12} rx={2} stroke={color} strokeWidth={1.8} />
      <Path d="M16 10l5-3v10l-5-3v-4z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Circle cx={9.5} cy={12} r={0.8} fill={color} />
    </Svg>
  );
}

export function DocsChipIcon({ size = 16, color = '#94a3b8' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z"
        stroke={color} strokeWidth={1.8} strokeLinejoin="round"
      />
      <Path d="M14 3v6h6" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M14 3v6h6M9 14h7M9 17h5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function AllTypeChipIcon({ size = 16, color = '#fff' }) {
  // ícone genérico "todos" — pode ser uma estrela ou apenas omitido na chip Todas
  return null;
}
