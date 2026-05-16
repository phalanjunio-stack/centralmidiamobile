import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

export default function EventsIcon({ size = 24, color = '#94a3b8', filled = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3} y={5} width={18} height={16} rx={2.5}
        stroke={color} strokeWidth={1.8}
        fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 0}
      />
      <Path d="M3 10h18" stroke={color} strokeWidth={1.8} />
      <Path
        d="M8 3v4M16 3v4"
        stroke={color} strokeWidth={1.8} strokeLinecap="round"
      />
      <Circle cx={8} cy={15} r={1} fill={color} />
      <Circle cx={12} cy={15} r={1} fill={color} />
      <Circle cx={16} cy={15} r={1} fill={color} />
    </Svg>
  );
}
