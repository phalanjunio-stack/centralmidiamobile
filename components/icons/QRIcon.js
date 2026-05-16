import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';

export default function QRIcon({ size = 24, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={2} />
      <Rect x={14} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={2} />
      <Rect x={3} y={14} width={7} height={7} rx={1} stroke={color} strokeWidth={2} />
      <Path d="M14 14h3v3M21 14v7M14 21h3M17 17h.01M21 17h.01M17 21h.01M21 21h.01"
        stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
