// Toggle Foto / Vídeo — pill arredondada (fiel ao SVG 07)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ModeSwitchPill({ mode = 'photo', onChange, disabled = false }) {
  return (
    <View style={[styles.wrap, disabled && { opacity: 0.5 }]}>
      <TouchableOpacity
        style={[styles.option, mode === 'photo' && styles.optionActive]}
        onPress={() => !disabled && onChange?.('photo')}
        activeOpacity={0.85}
        disabled={disabled}
      >
        <Text style={[styles.text, mode === 'photo' ? styles.textActive : styles.textInactive]}>
          Foto
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, mode === 'video' && styles.optionActiveVideo]}
        onPress={() => !disabled && onChange?.('video')}
        activeOpacity={0.85}
        disabled={disabled}
      >
        <Text style={[styles.text, mode === 'video' ? styles.textActive : styles.textInactive]}>
          Vídeo
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(5,20,38,0.74)',
    borderColor: '#203B5D',
    borderWidth: 1.5,
    borderRadius: 32,
    padding: 4,
  },
  option: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 24,
    minWidth: 56,
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: '#0B56B9',
  },
  optionActiveVideo: {
    backgroundColor: '#B92020',
  },
  text: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },
  textActive:   { color: '#FFFFFF' },
  textInactive: { color: '#C8D6EA' },
});
