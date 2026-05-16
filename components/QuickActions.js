// QuickActions — seção de 4 cards premium com gradiente, ícones Lucide.
// Uso:
//   import QuickActions from '../components/QuickActions';
//   <QuickActions onPress={(id) => navigation.navigate(...)} />

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Video, ImageIcon, FileText } from 'lucide-react-native';

const ACTIONS = [
  {
    id: 'camera',
    title: 'Câmera',
    subtitle: 'Tirar foto',
    Icon: Camera,
    gradient: ['#1F6FD1', '#0B376D'],
  },
  {
    id: 'video',
    title: 'Vídeo',
    subtitle: 'Gravar',
    Icon: Video,
    gradient: ['#5B4BE8', '#2A1B7A'],
  },
  {
    id: 'gallery',
    title: 'Galeria',
    subtitle: 'Selecionar',
    Icon: ImageIcon,
    gradient: ['#0D8B9A', '#073E4A'],
  },
  {
    id: 'docs',
    title: 'Documentos',
    subtitle: 'Enviar',
    Icon: FileText,
    gradient: ['#E87817', '#833500'],
  },
];

export default function QuickActions({ onPress, title = 'Ações rápidas' }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.row}>
        {ACTIONS.map((a) => (
          <ActionCard key={a.id} action={a} onPress={() => onPress?.(a.id)} />
        ))}
      </View>
    </View>
  );
}

function ActionCard({ action, onPress }) {
  const { Icon, title, subtitle, gradient } = action;
  return (
    <TouchableOpacity
      style={styles.cardShadow}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.iconWrap}>
          <Icon size={29} color="#EAF3FF" strokeWidth={1.65} />
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.cardTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{title}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  cardShadow: {
    flex: 1,
    borderRadius: 20,
    // Sombra suave (Android usa elevation, iOS usa shadow*)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    height: 118,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    gap: 4,
    alignItems: 'center',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    color: 'rgba(203, 213, 225, 0.85)', // azul acinzentado claro
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    letterSpacing: 0.1,
  },
});
