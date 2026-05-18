// Botão de voltar premium — usa o chevron direita rotacionado.
// Variantes:
//  - 'floating' (default): círculo absoluto no canto superior esquerdo, com glow
//  - 'header': pill encaixado no header
//  - 'plain': só o círculo, posição controlada por wrap
import React from 'react';
import { TouchableOpacity, Image, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { IC } from '../src/theme/icons';

export default function BackButton({
  variant = 'floating',
  onPress,
  color = '#fff',
  bg = 'rgba(8,14,26,0.85)',
  borderColor = 'rgba(31,139,255,0.32)',
  topOffset = 56,
  size = 40,
}) {
  const navigation = useNavigation();
  const handlePress = () => {
    if (onPress) onPress();
    else if (navigation.canGoBack()) navigation.goBack();
  };

  const containerStyle =
    variant === 'floating'
      ? [styles.floating, { top: topOffset }]
      : variant === 'header'
      ? styles.header
      : null;

  return (
    <View style={containerStyle} pointerEvents="box-none">
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.btn,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, borderColor },
        ]}
        hitSlop={10}
      >
        <Image
          source={IC.chevronDir || IC.chevronBaixo}
          style={{
            width: size * 0.42,
            height: size * 0.42,
            tintColor: color,
            transform: [{ rotate: '180deg' }],
            resizeMode: 'contain',
          }}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  floating: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
  },
  header: {
    paddingLeft: 4,
  },
  btn: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F8BFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
