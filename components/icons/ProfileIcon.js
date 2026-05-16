import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export default function ProfileIcon({ size = 24, color = '#94a3b8', filled = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12} cy={8} r={4}
        stroke={color} strokeWidth={1.8}
        fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 0}
      />
      <Path
        d="M4.5 21c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5"
        stroke={color} strokeWidth={1.8}
        strokeLinecap="round"
        fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 0}
      />
    </Svg>
  );
}
