// Modal full-screen de progresso de upload — design premium do mockup 3
// Aparece durante batch sync grande. Mostra:
//  - Anel circular com % global
//  - Tamanho total / velocidade
//  - Lista de arquivos com thumb + nome + status (check / spinner / aguardando)
//  - Botão cancelar envio
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  Image, Animated, Easing, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { colors } from '../theme';
import { IC } from '../src/theme/icons';

const RING_SIZE = 180;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function UploadProgressModal({
  visible,
  totalFiles = 0,
  totalBytes = 0,
  uploadedBytes = 0,
  speedMBs = 0,
  files = [],          // [{ name, thumbUri, sizeBytes, progress, status }]
  onCancel,
}) {
  const pct = totalBytes > 0 ? Math.min(100, Math.round((uploadedBytes / totalBytes) * 100)) : 0;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: pct / 100,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <SafeAreaView style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Enviando...</Text>
            <Text style={styles.subtitle}>{totalFiles} arquivos</Text>
          </View>

          {/* Anel de progresso */}
          <View style={styles.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Defs>
                <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%"  stopColor="#5AAEFF" />
                  <Stop offset="100%" stopColor="#1F8BFF" />
                </LinearGradient>
              </Defs>
              {/* Track */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke="rgba(31,139,255,0.18)"
                strokeWidth={RING_STROKE}
                fill="none"
              />
              {/* Progress */}
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke="url(#ringGrad)"
                strokeWidth={RING_STROKE}
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={styles.ringPct}>{pct}%</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <Text style={styles.statsMain}>
              {formatBytes(uploadedBytes)} de {formatBytes(totalBytes)}
            </Text>
            <Text style={styles.statsSub}>
              Velocidade: {speedMBs.toFixed(1)} MB/s
            </Text>
          </View>

          {/* Lista de arquivos */}
          <ScrollView style={styles.list} contentContainerStyle={{ paddingVertical: 8 }}>
            {files.map((file, i) => (
              <FileRow key={`${file.name}-${i}`} file={file} />
            ))}
          </ScrollView>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.85}>
            <Text style={styles.cancelText}>Cancelar envio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function FileRow({ file }) {
  const { name, thumbUri, sizeBytes, progress = 0, status = 'pending' } = file;
  // status: 'done' | 'uploading' | 'pending' | 'error'
  return (
    <View style={styles.fileRow}>
      <View style={styles.fileThumb}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={StyleSheet.absoluteFill} />
        ) : (
          <Image source={IC.foto} style={{ width: 22, height: 22, tintColor: '#4EA3FF' }} />
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.fileName} numberOfLines={1}>{name}</Text>
        <Text style={styles.fileMeta}>
          {formatBytes(sizeBytes)} · {
            status === 'done'      ? '100%' :
            status === 'uploading' ? `${progress}%` :
            status === 'pending'   ? 'Aguardando' : 'Erro'
          }
        </Text>
      </View>

      <View style={styles.fileStatus}>
        {status === 'done' && (
          <View style={[styles.statusCircle, { borderColor: '#00C16A', backgroundColor: 'rgba(0,193,106,0.15)' }]}>
            <Image source={IC.check} style={{ width: 14, height: 14, tintColor: '#00C16A' }} />
          </View>
        )}
        {status === 'uploading' && (
          <View style={[styles.statusCircle, { borderColor: '#1F8BFF' }]}>
            <ActivityIndicator size="small" color="#1F8BFF" />
          </View>
        )}
        {status === 'pending' && (
          <View style={[styles.statusCircle, { borderColor: 'rgba(255,255,255,0.25)' }]} />
        )}
        {status === 'error' && (
          <View style={[styles.statusCircle, { borderColor: '#FF4B52', backgroundColor: 'rgba(255,75,82,0.15)' }]}>
            <Image source={IC.erro} style={{ width: 14, height: 14, tintColor: '#FF4B52' }} />
          </View>
        )}
      </View>
    </View>
  );
}

function formatBytes(b) {
  if (!b) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 8, 18, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    backgroundColor: '#06090F',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(31,139,255,0.22)',
    padding: 20,
    gap: 14,
  },

  /* Header */
  header: { alignItems: 'center', gap: 4 },
  title: { color: '#fff', fontSize: 22, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.4 },
  subtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'Inter_500Medium' },

  /* Ring */
  ringWrap: { alignSelf: 'center', width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringPct: { color: '#fff', fontSize: 44, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1.5 },

  /* Stats */
  stats: { alignItems: 'center', gap: 4 },
  statsMain: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  statsSub:  { color: 'rgba(255,255,255,0.5)', fontSize: 11.5, fontFamily: 'Inter_500Medium' },

  /* List */
  list: { maxHeight: 240, marginTop: 4 },
  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, paddingHorizontal: 4,
  },
  fileThumb: {
    width: 42, height: 42, borderRadius: 8, overflow: 'hidden',
    backgroundColor: '#0a1322',
    alignItems: 'center', justifyContent: 'center',
  },
  fileName: { color: '#fff', fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  fileMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  fileStatus: { width: 28, alignItems: 'center', justifyContent: 'center' },
  statusCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Cancel */
  cancelBtn: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,75,82,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,75,82,0.35)',
    alignItems: 'center',
  },
  cancelText: { color: '#FF6B70', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
