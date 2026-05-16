import React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function BellIcon({ size = 24, color = '#94a3b8' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9"
        stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M10 21a2 2 0 004 0" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
