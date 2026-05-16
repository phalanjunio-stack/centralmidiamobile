import React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function DocsIcon({ size = 24, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z"
        stroke={color} strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M14 3v6h6" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M8 13h8M8 17h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
