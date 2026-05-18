// Slider vertical de exposição com sol/lua
// Fix: usa useRef pra evitar closure bug do PanResponder
import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Platform } from 'react-native';
import Svg, {
  Defs, Filter, FeDropShadow, Circle, Path, Rect, G,
} from 'react-native-svg';

const TRACK_TOP = 88;
const TRACK_BOTTOM = 328;
const TRACK_HEIGHT = TRACK_BOTTOM - TRACK_TOP;

export default function ExposureSlider({ width = 30, height = 220, value = 0, onChange, visible = true }) {
  if (!visible) return null;
  const [v, setV] = useState(value);
  const vRef = useRef(v);

  // Mantém o ref sincronizado com state
  vRef.current = v;

  const startVRef = useRef(0);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startVRef.current = vRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        // calcula valor baseado no START + delta (não no v atual — evita closure stale)
        const newV = Math.max(-1, Math.min(1, startVRef.current - gesture.dy / 80));
        setV(newV);
        onChange?.(newV);
      },
    })
  ).current;

  const center = TRACK_TOP + TRACK_HEIGHT / 2;
  const handleY = center - (v * TRACK_HEIGHT / 2);
  const activeStart = Math.min(center, handleY);
  const activeEnd   = Math.max(center, handleY);

  // Nota: o prop `exposure` do expo-camera CameraView só funciona no iOS.
  // No Android o slider muda visualmente mas o efeito real é nulo.
  const supportedNote = Platform.OS === 'ios' ? null : '(iOS)';

  return (
    <View style={[styles.wrap, { width, height }]} {...pan.panHandlers}>
      <Svg width="100%" height="100%" viewBox="0 0 90 420">
        <Defs>
          <Filter id="g" x="-60%" y="-20%" width="220%" height="140%">
            <FeDropShadow dx={0} dy={0} stdDeviation={7} floodColor="#2B83FF" floodOpacity={0.65} />
          </Filter>
        </Defs>

        <G stroke="#E7F1FF" strokeWidth={3} strokeLinecap="round" fill="none">
          <Circle cx={45} cy={34} r={10} />
          <Path d="M45 7V16M45 52V61M18 34H27M63 34H72M26 15L32 21M58 47L64 53M64 15L58 21M32 47L26 53" />
        </G>

        <Rect x={42} y={TRACK_TOP} width={6} height={TRACK_HEIGHT} rx={3} fill="#173050" />

        <Rect
          x={42}
          y={activeStart}
          width={6}
          height={Math.max(2, activeEnd - activeStart)}
          rx={3}
          fill="#2B83FF"
          filter="url(#g)"
        />

        <Circle
          cx={45} cy={handleY}
          r={14} fill="#2B83FF"
          stroke="#88BDFF" strokeWidth={3}
        />

        <Path
          d="M34 377C44 401 72 393 75 367C61 384 40 384 34 377Z"
          stroke="#C8D6EA" strokeWidth={4} strokeLinejoin="round" fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
});
