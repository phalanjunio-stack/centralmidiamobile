// Toggle Foto / Vídeo / Segure — pill arredondada
// Segure = hold-to-record (grava enquanto segura, para quando solta)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const MODES = [
  { key: 'photo', label: 'Foto',   activeColor: '#0B56B9' },
  { key: 'video', label: 'Vídeo',  activeColor: '#B92020' },
  { key: 'hold',  label: 'Segure', activeColor: '#7C3AED' },
];

export default function ModeSwitchPill({ mode = 'photo', onChange, disabled = false }) {
  return (
    <View style={[styles.wrap, disabled && { opacity: 0.5 }]}>
      {MODES.map(m => {
        const active = mode === m.key;
        return (
          <TouchableOpacity
            key={m.key}
            style={[styles.option, active && { backgroundColor: m.activeColor }]}
            onPress={() => !disabled && onChange?.(m.key)}
            activeOpacity={0.85}
            disabled={disabled}
          >
            <Text style={[styles.text, active ? styles.textActive : styles.textInactive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        );
      })}
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
    gap: 2,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 24,
    minWidth: 52,
    alignItems: 'center',
  },
  text: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
  textActive:   { color: '#FFFFFF' },
  textInactive: { color: '#C8D6EA' },
});
