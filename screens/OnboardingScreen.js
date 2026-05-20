// Onboarding — 4 slides na primeira vez que abre o app
// Flag em AsyncStorage (@contourline.onboarding.v1.done) controla
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  Dimensions, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '../theme';
import { IC } from '../src/theme/icons';

const { width: W } = Dimensions.get('window');
export const ONBOARDING_KEY = '@contourline.onboarding.v1.done';

const SLIDES = [
  {
    icon: IC.camera,
    title: 'Capture qualquer momento',
    sub: 'Câmera profissional com exposição, foco e zoom 4K — pronta pra qualquer evento da Contourline.',
    color: '#1F8BFF',
  },
  {
    icon: IC.backup,
    title: 'Sincroniza sozinho',
    sub: 'Cada foto vai direto pra Central de Mídia no notebook e pro Google Drive — sem você fazer nada.',
    color: '#00C16A',
  },
  {
    icon: IC.evento,
    title: 'Organizado por evento',
    sub: 'Tudo cai na pasta certa: FULL FACE, treinamentos, visitas. Encontra qualquer foto em segundos.',
    color: '#7C3AED',
  },
  {
    icon: IC.equipe,
    title: 'Trabalho em equipe',
    sub: 'Cinco fotógrafos no mesmo evento? Todo mundo vê tudo em tempo real, no app.',
    color: '#FFB341',
  },
];

// Os icons IC.camera/backup/evento/equipe podem não existir — fallback
const FALLBACK = {
  camera:  require('../assets/icons/camera.png'),
  backup:  require('../assets/icons/backup.png'),
  evento:  require('../assets/icons/evento_principal.png'),
  equipe:  require('../assets/icons/perfil.png'),
};

export default function OnboardingScreen({ navigation }) {
  const scrollRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  async function finish() {
    try { await AsyncStorage.setItem(ONBOARDING_KEY, '1'); } catch {}
    // navigation pode ser usado pra ir pro ConnectAura ou Main dependendo do estado
    navigation.replace('ConnectAura');
  }

  function nextSlide() {
    if (idx < SLIDES.length - 1) {
      const next = idx + 1;
      scrollRef.current?.scrollTo({ x: next * W, animated: true });
      setIdx(next);
    } else {
      finish();
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Skip */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={finish} hitSlop={10}>
            <Text style={styles.skip}>Pular</Text>
          </TouchableOpacity>
        </View>

        {/* Slides */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false, listener: (e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / W)) }
          )}
          scrollEventThrottle={16}
        >
          {SLIDES.map((slide, i) => {
            const icon = slide.icon || FALLBACK[Object.keys(FALLBACK)[i]] || IC.camera;
            return (
              <View key={i} style={[styles.slide, { width: W }]}>
                {/* Big icon com glow */}
                <View style={[styles.iconWrap, { shadowColor: slide.color }]}>
                  <View style={[styles.iconBg, { backgroundColor: slide.color + '22', borderColor: slide.color + '55' }]}>
                    <Image source={icon} style={[styles.iconImg, { tintColor: slide.color }]} />
                  </View>
                </View>

                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.sub}>{slide.sub}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Dots + CTA */}
        <View style={styles.bottom}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === idx && styles.dotActive,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.cta} onPress={nextSlide} activeOpacity={0.85}>
            <Text style={styles.ctaText}>
              {idx === SLIDES.length - 1 ? 'Começar' : 'Próximo'}
            </Text>
            <Image
              source={IC.chevronDir}
              style={{ width: 16, height: 16, tintColor: '#fff', marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#040B17' },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8,
  },
  skip: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  slide: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    marginBottom: 48,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  iconBg: {
    width: 130, height: 130, borderRadius: 65,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  iconImg: { width: 64, height: 64, resizeMode: 'contain' },

  title: {
    color: '#fff', fontSize: 26, textAlign: 'center',
    fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5,
    marginBottom: 14,
  },
  sub: {
    color: 'rgba(255,255,255,0.65)', fontSize: 15, textAlign: 'center',
    fontFamily: 'Inter_500Medium', lineHeight: 22,
  },

  bottom: { paddingHorizontal: 24, paddingBottom: 16, gap: 22 },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    width: 24, backgroundColor: '#1F8BFF',
  },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1F8BFF',
    paddingVertical: 16, borderRadius: 14,
    shadowColor: '#1F8BFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 14, elevation: 10,
  },
  ctaText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_800ExtraBold' },
});
