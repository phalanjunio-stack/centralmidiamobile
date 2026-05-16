import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export default function GalleryIcon({ size = 24, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={14} rx={2} stroke={color} strokeWidth={2} />
      <Circle cx={8.5} cy={10} r={1.5} fill={color} />
      <Path
        d="M21 16l-5-5-7 7"
        stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}
