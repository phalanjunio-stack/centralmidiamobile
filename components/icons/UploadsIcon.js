import React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function UploadsIcon({ size = 24, color = '#94a3b8', filled = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4v13M12 4l-5 5M12 4l5 5"
        stroke={color} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M4 17v2.5A1.5 1.5 0 005.5 21h13a1.5 1.5 0 001.5-1.5V17"
        stroke={color} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round"
        fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 0}
      />
    </Svg>
  );
}
