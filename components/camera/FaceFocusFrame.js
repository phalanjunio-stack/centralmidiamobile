// Frame de foco: 4 cantos em L com glow + tag opcional.
// Fiel ao SVG 05-face-focus-frame.svg
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, Filter, FeDropShadow, Path, Rect } from 'react-native-svg';

export default function FaceFocusFrame({ width = 170, height = 210, label = '' }) {
  // SVG original tem viewBox 360x440. Mantemos as proporções.
  return (
    <View style={[styles.wrap, { width, height }]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 360 440">
        <Defs>
          <Filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <FeDropShadow dx={0} dy={0} stdDeviation={8} floodColor="#2B83FF" floodOpacity={0.55} />
          </Filter>
        </Defs>

        {/* 4 cantos em L com glow azul */}
        <Path
          d="M76 110V86C76 70.536 88.536 58 104 58H128"
          stroke="#2B83FF" strokeWidth={5} strokeLinecap="round" filter="url(#glow)" fill="none"
        />
        <Path
          d="M232 58H256C271.464 58 284 70.536 284 86V110"
          stroke="#2B83FF" strokeWidth={5} strokeLinecap="round" filter="url(#glow)" fill="none"
        />
        <Path
          d="M76 330V354C76 369.464 88.536 382 104 382H128"
          stroke="#2B83FF" strokeWidth={5} strokeLinecap="round" filter="url(#glow)" fill="none"
        />
        <Path
          d="M232 382H256C271.464 382 284 369.464 284 354V330"
          stroke="#2B83FF" strokeWidth={5} strokeLinecap="round" filter="url(#glow)" fill="none"
        />
      </Svg>

      {/* Tag — só mostra se houver label */}
      {label ? (
        <View style={styles.tagWrap}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{label}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  tagWrap: {
    position: 'absolute',
    bottom: '5%',
    left: 0, right: 0,
    alignItems: 'center',
  },
  tag: {
    backgroundColor: 'rgba(6,27,52,0.86)',
    borderColor: 'rgba(30,116,232,0.55)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    color: '#4EA3FF',
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
