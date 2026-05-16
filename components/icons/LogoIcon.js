// Logo Contourline OFICIAL — usa o PNG real da identidade
import React from 'react';
import { Image, View } from 'react-native';

const LOGO_WHITE = require('../../assets/brand/contourline-icon-white.png');
const LOGO_BLUE  = require('../../assets/brand/contourline-icon-blue.png');

export default function LogoIcon({ size = 40, color = '#fff' }) {
  // Decide qual versão usar baseado na cor pedida
  const source = (color === '#fff' || color === '#FFFFFF' || color === 'white')
    ? LOGO_WHITE
    : LOGO_BLUE;

  return (
    <Image
      source={source}
      style={{ width: size, height: size, resizeMode: 'contain' }}
    />
  );
}

export function LogoIconWhite({ size = 40 }) {
  return <Image source={LOGO_WHITE} style={{ width: size, height: size, resizeMode: 'contain' }} />;
}

export function LogoIconBlue({ size = 40 }) {
  return <Image source={LOGO_BLUE} style={{ width: size, height: size, resizeMode: 'contain' }} />;
}

// Mantém o nome anterior pra não quebrar imports
export const LogoIconNavy = LogoIconBlue;
