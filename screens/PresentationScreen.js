// Modo Apresentação — slideshow full-screen do evento ativo
// Pra plugar no telão durante congressos/eventos
// Auto-play com transições suaves, swipe manual, controles ocultos no tap
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, Animated, Easing,
  Dimensions, FlatList, StatusBar,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFocusEffect } from '@react-navigation/native';

import { colors } from '../theme';
import { IC } from '../src/theme/icons';
import { getSyncLog, getActiveEvent } from '../services/storage';

const { width: W, height: H } = Dimensions.get('window');
const AUTOPLAY_MS = 4500; // 4.5s por foto

export default function PresentationScreen({ navigation }) {
  const [items, setItems]     = useState([]);
  const [event, setEvent]     = useState(null);
  const [idx, setIdx]         = useState(0);
  const [playing, setPlaying] = useState(true);
  const [showHud, setShowHud] = useState(true);

  const fade = useRef(new Animated.Value(0)).current;
  const ken  = useRef(new Animated.Value(0)).current; // ken burns zoom
  const hudFade = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);
  const hudTimerRef = useRef(null);

  // Tenta deitar a tela e esconde status bar (modo TV)
  useFocusEffect(useCallback(() => {
    StatusBar.setHidden(true, 'fade');
    ScreenOrientation.unlockAsync().catch(() => {});
    return () => {
      StatusBar.setHidden(false, 'fade');
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []));

  // Carrega itens
  useEffect(() => {
    (async () => {
      const [log, ev] = await Promise.all([getSyncLog(), getActiveEvent()]);
      setEvent(ev);
      // só fotos com URI local (ou já enviadas), ordenadas por hora desc
      const photos = (log || [])
        .filter(e => e?.uri && /\.(jpg|jpeg|png|webp|heic)$/i.test(e.name || e.uri || ''))
        .sort((a, b) => (b.at || 0) - (a.at || 0));
      setItems(photos);
    })();
  }, []);

  // Auto-play
  useEffect(() => {
    if (!playing || items.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setIdx(i => (i + 1) % items.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(intervalRef.current);
  }, [playing, items.length]);

  // Fade-in + Ken Burns sempre que muda idx
  useEffect(() => {
    fade.setValue(0);
    ken.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.out(Easing.cubic) }).start();
    Animated.timing(ken,  { toValue: 1, duration: AUTOPLAY_MS, useNativeDriver: true, easing: Easing.linear }).start();
  }, [idx]);

  // Auto-hide HUD após 3s sem interação
  function bumpHud() {
    setShowHud(true);
    hudFade.setValue(1);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      Animated.timing(hudFade, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => setShowHud(false));
    }, 3000);
  }
  useEffect(() => { bumpHud(); return () => hudTimerRef.current && clearTimeout(hudTimerRef.current); }, []);

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Image source={IC.foto} style={{ width: 64, height: 64, tintColor: 'rgba(255,255,255,0.3)' }} />
        <Text style={styles.emptyTitle}>Sem fotos ainda</Text>
        <Text style={styles.emptySub}>Captura uma foto pra começar a apresentação.</Text>
        <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.exitText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const current = items[idx];

  // Ken Burns: scale 1.0 → 1.08 ao longo da exibição
  const kenScale = ken.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.08] });
  const kenTransX = ken.interpolate({ inputRange: [0, 1], outputRange: [0, idx % 2 === 0 ? -20 : 20] });

  return (
    <TouchableOpacity activeOpacity={1} style={styles.root} onPress={bumpHud}>
      {/* Fundo escuro fixo */}
      <View style={styles.bg} />

      {/* Imagem principal com fade + Ken Burns */}
      <Animated.View style={[styles.imageWrap, { opacity: fade, transform: [{ scale: kenScale }, { translateX: kenTransX }] }]}>
        <Image source={{ uri: current.uri }} style={styles.image} resizeMode="contain" />
      </Animated.View>

      {/* HUD */}
      {showHud && (
        <Animated.View style={[styles.hud, { opacity: hudFade }]} pointerEvents="box-none">
          {/* Topo: nome do evento + contador */}
          <View style={styles.topHud}>
            <View style={styles.eventTag}>
              <View style={styles.eventDot} />
              <Text style={styles.eventName} numberOfLines={1}>{event?.name || 'Apresentação'}</Text>
            </View>
            <View style={styles.counter}>
              <Text style={styles.counterText}>{idx + 1} / {items.length}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} hitSlop={10}>
              <Image source={IC.fechar} style={{ width: 16, height: 16, tintColor: '#fff' }} />
            </TouchableOpacity>
          </View>

          {/* Baixo: controles + thumbs */}
          <View style={styles.bottomHud}>
            {/* Controles */}
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.ctrlBtn}
                onPress={() => setIdx(i => (i - 1 + items.length) % items.length)}
                hitSlop={10}
              >
                <Image source={IC.chevronDir} style={{ width: 18, height: 18, tintColor: '#fff', transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playBtn}
                onPress={() => setPlaying(p => !p)}
                hitSlop={10}
              >
                <Image source={playing ? IC.pausar : IC.play} style={{ width: 22, height: 22, tintColor: '#fff' }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ctrlBtn}
                onPress={() => setIdx(i => (i + 1) % items.length)}
                hitSlop={10}
              >
                <Image source={IC.chevronDir} style={{ width: 18, height: 18, tintColor: '#fff' }} />
              </TouchableOpacity>
            </View>

            {/* Strip de thumbnails */}
            <FlatList
              horizontal
              data={items}
              keyExtractor={(item, i) => `${i}-${item.name || item.uri}`}
              contentContainerStyle={styles.thumbStrip}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => { setIdx(index); bumpHud(); }}
                  activeOpacity={0.85}
                  style={[styles.thumbWrap, index === idx && styles.thumbActive]}
                >
                  <Image source={{ uri: item.uri }} style={styles.thumb} />
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Barra de progresso do autoplay */}
          {playing && (
            <ProgressBar key={idx} duration={AUTOPLAY_MS} />
          )}
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

function ProgressBar({ duration }) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    w.setValue(0);
    Animated.timing(w, { toValue: 1, duration, useNativeDriver: false, easing: Easing.linear }).start();
  }, [duration]);
  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          { width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },

  imageWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: W, height: H },

  /* HUD */
  hud: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },

  topHud: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 50,
  },
  eventTag: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(31,139,255,0.30)',
  },
  eventDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C16A' },
  eventName: { color: '#fff', fontSize: 13, fontFamily: 'Inter_800ExtraBold', flexShrink: 1 },
  counter: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  counterText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },

  bottomHud: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },

  controls: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16,
  },
  ctrlBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  playBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(31,139,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1F8BFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 10,
  },

  thumbStrip: { gap: 8, paddingHorizontal: 4 },
  thumbWrap: {
    width: 64, height: 64, borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: '#1F8BFF',
    shadowColor: '#1F8BFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8, elevation: 8,
  },
  thumb: { width: '100%', height: '100%' },

  progressTrack: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    height: 3, backgroundColor: 'rgba(255,255,255,0.10)',
  },
  progressFill: { height: '100%', backgroundColor: '#1F8BFF' },

  /* Empty */
  empty: {
    flex: 1, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32,
  },
  emptyTitle: { color: '#fff', fontSize: 18, fontFamily: 'Inter_800ExtraBold', marginTop: 16 },
  emptySub: { color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center', fontFamily: 'Inter_500Medium' },
  exitBtn: {
    marginTop: 16, backgroundColor: '#1F8BFF',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  exitText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
