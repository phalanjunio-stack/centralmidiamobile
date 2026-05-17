// Header com seta de voltar reutilizável.
// Use em telas que precisam de navegação de volta mas escondem o header nativo.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme';

const CHEVRON = require('../../assets/icons/chevron_direita.png');

export default function BackHeader({ title, right, transparent = false }) {
  const navigation = useNavigation();
  return (
    <SafeAreaView edges={['top']} style={[styles.safe, transparent && styles.transparent]}>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Image source={CHEVRON} style={styles.chevron} />
        </TouchableOpacity>
        {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : <View style={{ flex: 1 }} />}
        <View style={styles.rightSlot}>{right}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.bg.base },
  transparent: { backgroundColor: 'transparent' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  btn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.bg.surface,
    borderWidth: 1, borderColor: colors.border.glassHi,
    alignItems: 'center', justifyContent: 'center',
  },
  chevron: {
    width: 16, height: 16, resizeMode: 'contain',
    tintColor: colors.text.primary,
    transform: [{ rotate: '180deg' }],
  },
  title: {
    flex: 1, color: colors.text.primary,
    fontSize: 17, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.3,
    marginLeft: 4,
  },
  rightSlot: { minWidth: 38, alignItems: 'flex-end' },
});
