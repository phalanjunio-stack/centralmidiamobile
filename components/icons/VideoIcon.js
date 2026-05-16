import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

export default function VideoIcon({ size = 24, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={6} width={13} height={12} rx={2} stroke={color} strokeWidth={2} />
      <Path
        d="M16 10l5-3v10l-5-3v-4z"
        stroke={color} strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
