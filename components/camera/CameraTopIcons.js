// Ícones do topo da câmera — extraídos do SVG 09 com stroke #EAF2FF
import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';

const COLOR = '#EAF2FF';
const STROKE = 2.2;

export function FlashIcon({ size = 22, active = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <Path
        d="M42 12L22 44H42L34 68L58 32H38L42 12Z"
        stroke={active ? '#FBBF24' : COLOR}
        strokeWidth={STROKE * 1.5}
        strokeLinecap="round" strokeLinejoin="round"
        fill={active ? '#FBBF24' : 'none'}
        fillOpacity={active ? 0.25 : 0}
      />
    </Svg>
  );
}

export function FlipCameraIcon({ size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <G stroke={COLOR} strokeWidth={STROKE * 1.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Path d="M22 24A22 22 0 0 1 58 18L66 26M66 18V26H58" />
        <Path d="M58 56A22 22 0 0 1 22 62L14 54M14 62V54H22" />
      </G>
    </Svg>
  );
}

export function SettingsIcon({ size = 22 }) {
  // Engrenagem (cog) estilo Lucide — não é sol!
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        stroke={COLOR}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={12} cy={12} r={3} stroke={COLOR} strokeWidth={1.8} fill="none" />
    </Svg>
  );
}
