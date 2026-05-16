import React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function HomeIcon({ size = 24, color = '#94a3b8', filled = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 11l9-7 9 7v9a1.5 1.5 0 01-1.5 1.5h-3.5a1 1 0 01-1-1V15a1 1 0 00-1-1h-4a1 1 0 00-1 1v5.5a1 1 0 01-1 1H4.5A1.5 1.5 0 013 20v-9z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill={filled ? color : 'none'}
        fillOpacity={filled ? 0.18 : 0}
      />
    </Svg>
  );
}
