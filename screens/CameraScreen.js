// Câmera Contourline — Layout dashboard premium
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Animated, Easing, ActivityIndicator, Alert,
  PanResponder, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import CaptureButton       from '../components/camera/CaptureButton';
import FaceFocusFrame      from '../components/camera/FaceFocusFrame';
import VUMeter             from '../components/camera/VUMeter';
import ExposureSlider      from '../components/camera/ExposureSlider';
import UploadToast         from '../components/camera/UploadToast';
import CameraSettingsSheet from '../components/camera/CameraSettingsSheet';

import {
  Zap, Settings, ChevronRight, ChevronDown,
  Grid3x3, Sparkles, RefreshCw, CheckCircle2, Folder,
} from 'lucide-react-native';

import { colors } from '../src/theme';
import { useUploads } from '../src/context/UploadContext';
import { useNetworkStatus } from '../src/services/networkStatus';
import { loadAllSettings, setBool, KEYS } from '../src/services/cameraSettings';
import {
  getActiveEvent, getDeviceProfile, addSyncLogEntry, updateSyncStats,
  getServerConfig, clearAll,
} from '../services/storage';
import { uploadCapture } from '../services/api';
import { unregisterBackgroundSync } from '../services/sync';

const ZOOM_LEVELS = [
  { label: '0,5', value: 0 },
  { label: '1x',  value: 0.25 },
  { label: '2',   value: 0.5 },
  { label: '3',   value: 0.75 },
];

export default function CameraScreen({ navigation, route }) {
  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();
  const cameraRef = useRef(null);

  const [facing, setFacing] = useState('back');
  const [flash, setFlash]   = useState('off');
  const [mode, setMode]     = useState(route?.params?.initialMode || 'photo');

  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const recordTimerRef = useRef(null);
  const recordStartedAtRef = useRef(0);
  const stopRecordTimerRef = useRef(null);

  const [event, setEvent]       = useState(null);
  const [profile, setProfile]   = useState(null);
  const [serverName, setServerName] = useState('Central de Mídia');
  const [lastThumb, setLastThumb] = useState(null);
  const [queueCount, setQueueCount] = useState(0);
  const [folderStats, setFolderStats] = useState({ files: 0, sizeGB: 0 });

  // Camera controls
  const [zoom, setZoom]         = useState(0.25);
  const [exposure, setExposure] = useState(0);
  const [showExposure, setShowExposure] = useState(false);
  const [focusPoint, setFocusPoint] = useState(null);
  const focusTimerRef = useRef(null);

  // Settings persistentes
  const [autoUpload, setAutoUpload]     = useState(true);
  const [wifiOnly, setWifiOnly]         = useState(false);
  const [saveOriginal, setSaveOriginal] = useState(true);
  const [gridEnabled, setGridEnabled]   = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null); // { variant, title, sub }

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { addPending, removePending, pendingCount, clearPending } = useUploads();
  const network = useNetworkStatus();

  const rippleAnim = useRef(new Animated.Value(0)).current;
  const recordPulse = useRef(new Animated.Value(0)).current;
  const [showRipple, setShowRipple] = useState(false);

  // Pinch-to-zoom
  const initialPinchRef = useRef(null);
  const zoomRef = useRef(zoom); zoomRef.current = zoom;
  const pinchPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
      onPanResponderGrant: (e) => {
        const t = e.nativeEvent.touches;
        if (t.length === 2) {
          const dx = t[0].pageX - t[1].pageX, dy = t[0].pageY - t[1].pageY;
          initialPinchRef.current = { distance: Math.sqrt(dx*dx + dy*dy), zoom: zoomRef.current };
        }
      },
      onPanResponderMove: (e) => {
        const t = e.nativeEvent.touches;
        if (t.length === 2 && initialPinchRef.current) {
          const dx = t[0].pageX - t[1].pageX, dy = t[0].pageY - t[1].pageY;
          const distance = Math.sqrt(dx*dx + dy*dy);
          const scale = distance / initialPinchRef.current.distance;
          setZoom(Math.max(0, Math.min(1, initialPinchRef.current.zoom + (scale - 1) * 0.5)));
        }
      },
      onPanResponderRelease: () => { initialPinchRef.current = null; },
    })
  ).current;

  // Load settings + data
  useFocusEffect(useCallback(() => {
    (async () => {
      const [ev, p, cfg, settings] = await Promise.all([
        getActiveEvent(), getDeviceProfile(), getServerConfig(), loadAllSettings(),
      ]);
      setEvent(ev);
      setProfile(p);
      if (cfg?.serverName || cfg?.pcName) setServerName(cfg.serverName || cfg.pcName);
      setAutoUpload(settings.autoUpload);
      setWifiOnly(settings.wifiOnly);
      setSaveOriginal(settings.saveOriginal);
      setGridEnabled(settings.grid);
    })();
  }, []));

  // Recording timer + pulse
  useEffect(() => {
    if (recording) {
      recordTimerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordPulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(recordPulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      clearInterval(recordTimerRef.current);
      setRecordSecs(0);
      recordPulse.setValue(0);
    }
    return () => clearInterval(recordTimerRef.current);
  }, [recording]);

  useEffect(() => () => { if (stopRecordTimerRef.current) clearTimeout(stopRecordTimerRef.current); }, []);

  function showToast(variant, title, sub) {
    setToast({ variant, title, sub, key: Date.now() });
  }

  function playRipple() {
    setShowRipple(true);
    rippleAnim.setValue(0);
    Animated.timing(rippleAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      .start(() => setShowRipple(false));
  }

  async function takePhoto() {
    if (!cameraRef.current || recording) return;
    playRipple();
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.92 });
      console.log('[Camera] photo captured:', photo.uri);
      setLastThumb(photo.uri);
      if (autoUpload) enqueueUpload(photo.uri, 'photo');
    } catch (e) { console.log('[Camera] takePhoto error:', e.message); }
  }

  async function startRecord() {
    if (!cameraRef.current || recording) return;
    if (!micPerm?.granted) {
      const res = await requestMic();
      if (!res?.granted) return;
    }
    recordStartedAtRef.current = Date.now();
    setRecording(true);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 60 * 5 });
      setRecording(false);
      if (video?.uri) {
        setLastThumb(video.uri);
        if (autoUpload) enqueueUpload(video.uri, 'video');
      }
    } catch (e) { console.log('[Camera] recordAsync:', e.message); setRecording(false); }
  }

  function stopRecord() {
    if (!cameraRef.current || !recording) return;
    const elapsed = Date.now() - recordStartedAtRef.current;
    const wait = Math.max(0, 900 - elapsed);
    if (stopRecordTimerRef.current) clearTimeout(stopRecordTimerRef.current);
    stopRecordTimerRef.current = setTimeout(() => {
      cameraRef.current?.stopRecording();
      stopRecordTimerRef.current = null;
    }, wait);
  }

  async function enqueueUpload(uri, type) {
    // Respeita "Apenas Wi-Fi"
    if (wifiOnly && network.type !== 'wifi') {
      showToast('info', 'Aguardando Wi-Fi', 'Arquivo ficará na fila até conectar');
      // Ainda adiciona na fila local pra retry
    }

    setQueueCount(c => c + 1);
    addPending(1);
    showToast('info', 'Enviando...', type === 'photo' ? 'Foto' : 'Vídeo');

    try {
      const result = await uploadCapture({ uri, mediaType: type, activeEvent: event, profile });
      setQueueCount(c => Math.max(0, c - 1));
      removePending(1);
      setFolderStats(s => ({ files: s.files + 1, sizeGB: s.sizeGB + (result?.size || 0) / 1e9 }));
      showToast('success', 'Enviado', result?.name || `${type} concluído`);
      await addSyncLogEntry({
        name: result?.name || `capture_${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`,
        size: result?.size || 0, ok: true, uri, mediaType: type,
        eventId: event?.id || null, eventName: event?.name || null,
        serverPath: result?.path || null,
      });
      await updateSyncStats(1, 0);
    } catch (e) {
      console.log('[Upload] FALHOU:', e.message);
      setQueueCount(c => Math.max(0, c - 1));
      removePending(1);
      showToast('error', 'Falha no envio', e.message);
      await addSyncLogEntry({ name: `capture_${Date.now()}`, ok: false, error: e.message, eventId: event?.id || null }).catch(() => {});
      await updateSyncStats(0, 1).catch(() => {});
    }
  }

  function handleScreenTap(e) {
    const { locationX, locationY } = e.nativeEvent;
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    setFocusPoint({ x: locationX, y: locationY, t: Date.now() });
    focusTimerRef.current = setTimeout(() => setFocusPoint(null), 1400);
  }

  function handleFlashToggle() {
    const next = flash === 'off' ? 'on' : 'off';
    console.log('[Camera] flash →', next);
    setFlash(next);
  }
  function handleFlipToggle() {
    const next = facing === 'back' ? 'front' : 'back';
    console.log('[Camera] facing →', next);
    setFacing(next);
  }

  // Setting toggles persistentes
  function toggleSetting(key, currentValue, setter) {
    const next = !currentValue;
    setter(next);
    setBool(key, next);
  }

  function handleClearQueue() {
    clearPending();
    setQueueCount(0);
    showToast('success', 'Fila limpa', '');
    setSettingsOpen(false);
  }

  function handleDisconnect() {
    setSettingsOpen(false);
    Alert.alert('Desconectar', 'Você precisará parear de novo. Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desconectar', style: 'destructive', onPress: async () => {
        await unregisterBackgroundSync(); await clearAll();
        navigation.reset({ index: 0, routes: [{ name: 'ConnectAura' }] });
      }},
    ]);
  }

  // Permission gate
  if (!camPerm) return <View style={styles.permWrap}><ActivityIndicator color={colors.aura.primary} /></View>;
  if (!camPerm.granted) {
    return (
      <View style={styles.permWrap}>
        <Text style={styles.permTitle}>📷 Câmera necessária</Text>
        <Text style={styles.permSub}>O app precisa de acesso à câmera pra capturar.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestCam}>
          <Text style={styles.permBtnText}>Permitir câmera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const connected = network.isConnected;
  const folderPath = event?.folder
    ? `/${event.folder.split(/[\\/]/).slice(-2).join('/')}`
    : '/Sem evento ativo';
  const totalUploaded = folderStats.files;
  const totalSize = folderStats.sizeGB.toFixed(1);
  const zoomLabel = zoom === 0 ? '0,5x' : zoom < 0.4 ? '1x' : zoom < 0.65 ? '2x' : '3x';
  const recTime = `${String(Math.floor(recordSecs / 60)).padStart(2,'0')}:${String(recordSecs % 60).padStart(2,'0')}`;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        mode={mode === 'photo' ? 'picture' : 'video'}
        videoQuality="2160p"
        videoBitrate={35000000}
        videoStabilizationMode="auto"
        zoom={zoom}
        autofocus="on"
        exposure={exposure}
      />

      <View style={StyleSheet.absoluteFill} {...pinchPan.panHandlers}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleScreenTap} />
      </View>

      {gridEnabled && <GridOverlay />}

      {focusPoint && (
        <View pointerEvents="none" style={{ position: 'absolute', left: focusPoint.x - 45, top: focusPoint.y - 45, zIndex: 5 }}>
          <FaceFocusFrame key={focusPoint.t} size={90} />
        </View>
      )}

      <SafeAreaView style={styles.overlay} pointerEvents="box-none" edges={['top','bottom']}>
        {/* ── TOAST ── */}
        {toast && (
          <UploadToast
            key={toast.key}
            visible={true}
            variant={toast.variant}
            title={toast.title}
            sub={toast.sub}
            onHide={() => setToast(null)}
          />
        )}

        {/* ── TOP BAR ── */}
        <View style={styles.topBar}>
          {/* Event chip — agora flex maior pra caber o nome */}
          <TouchableOpacity style={styles.eventChip} onPress={() => navigation.navigate('EventPicker')} activeOpacity={0.85}>
            <View style={styles.eventCover}>
              {event?.coverUrl
                ? <Image source={{ uri: event.coverUrl }} style={StyleSheet.absoluteFill} />
                : <LinearGradient colors={['#1E3A8A','#0B1B4F']} style={StyleSheet.absoluteFill} />
              }
            </View>
            <View style={styles.eventInfo}>
              <View style={styles.eventNameRow}>
                <Text style={styles.eventName} numberOfLines={1}>{event?.name || 'Sem evento'}</Text>
                <ChevronDown size={12} color="#fff" strokeWidth={2.4} />
              </View>
              <Text style={styles.eventDate} numberOfLines={1}>{formatRange(event?.startDate, event?.endDate)}</Text>
              <Text style={styles.eventLoc} numberOfLines={1}>{event?.location || '—'}</Text>
            </View>
          </TouchableOpacity>

          {/* 3 ícones de ação */}
          <View style={styles.topActions}>
            <CircleBtn onPress={handleFlashToggle} active={flash !== 'off'}>
              <Zap size={17} color={flash !== 'off' ? '#FFB341' : '#fff'} fill={flash !== 'off' ? '#FFB341' : 'none'} strokeWidth={2.2} />
            </CircleBtn>
            <CircleBtn onPress={handleFlipToggle}>
              <RefreshCw size={16} color="#fff" strokeWidth={2.2} />
            </CircleBtn>
            <CircleBtn onPress={() => setSettingsOpen(true)}>
              <Settings size={17} color="#fff" strokeWidth={2} />
            </CircleBtn>
          </View>
        </View>

        {/* Server pill compacto (linha única) */}
        <TouchableOpacity style={styles.serverPill} onPress={() => navigation.navigate('ConnectAura')} activeOpacity={0.85}>
          <View style={[styles.serverDot, { backgroundColor: connected ? colors.state.success : colors.text.muted }]} />
          <Text style={styles.serverPillText} numberOfLines={1}>
            {connected ? `Servidor conectado · ${serverName}` : 'Sem servidor — toque para parear'}
          </Text>
        </TouchableOpacity>

        {/* ── CONTROLS GRID (esquerda + direita) — só 2 cards por lado ── */}
        <View style={styles.controlsArea} pointerEvents="box-none">
          <View style={styles.controlCol}>
            <ControlCard
              Icon={({ size, color }) => (
                <View style={{ width: size*0.55, height: size*0.55, borderRadius: size*0.275, borderWidth: 1.6, borderColor: color }} />
              )}
              middle={exposure >= 0 ? `+${exposure.toFixed(1)}` : exposure.toFixed(1)}
              bottomLabel="EXPOSIÇÃO"
              onPress={() => setShowExposure(v => !v)}
              active={showExposure}
            />
            <ControlCard
              Icon={Grid3x3}
              bottomLabel="GRADE"
              onPress={() => toggleSetting(KEYS.GRID, gridEnabled, setGridEnabled)}
              active={gridEnabled}
            />
          </View>

          <View style={styles.controlCol}>
            <ControlCard middle={zoomLabel} bottomLabel="ZOOM" active />
            <ControlCard Icon={Sparkles} bottomLabel="FILTROS" />
          </View>
        </View>

        {/* ── ZOOM PILLS ── */}
        <View style={styles.zoomPillsWrap}>
          <View style={styles.zoomPills}>
            {ZOOM_LEVELS.map(z => {
              const active = Math.abs(zoom - z.value) < 0.12;
              return (
                <TouchableOpacity
                  key={z.label}
                  style={[styles.zoomPill, active && styles.zoomPillActive]}
                  onPress={() => setZoom(z.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.zoomPillText, active && styles.zoomPillTextActive]}>{z.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── MODE PILL ── */}
        <View style={styles.modePillWrap}>
          <View style={styles.modePill}>
            <TouchableOpacity
              style={[styles.modeOption, mode === 'photo' && styles.modeOptionActive]}
              onPress={() => !recording && setMode('photo')}
              activeOpacity={0.85}
            >
              <Text style={[styles.modeText, mode === 'photo' && styles.modeTextActive]}>Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeOption, mode === 'video' && styles.modeOptionActive]}
              onPress={() => !recording && setMode('video')}
              activeOpacity={0.85}
            >
              <Text style={[styles.modeText, mode === 'video' && styles.modeTextActive]}>Vídeo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {recording && (
          <View style={styles.recBlock}>
            <View style={styles.recBadge}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>REC {recTime}</Text>
            </View>
            {micPerm?.granted && <VUMeter active={recording} style={{ marginTop: 8 }} />}
          </View>
        )}

        <ExposureSlider value={exposure} onChange={setExposure} visible={showExposure} />

        {/* ── CAPTURE ROW ── */}
        <View style={styles.captureRow}>
          <TouchableOpacity style={styles.galleryWrap} onPress={() => navigation.navigate('Gallery')} activeOpacity={0.85}>
            <View style={styles.galleryThumb}>
              {lastThumb
                ? <Image source={{ uri: lastThumb }} style={StyleSheet.absoluteFill} />
                : <LinearGradient colors={['#1E3A8A','#0B1B4F']} style={StyleSheet.absoluteFill} />
              }
            </View>
            <Text style={styles.galleryLabel}>GALERIA</Text>
          </TouchableOpacity>

          <CaptureButton
            size={106}
            mode={mode}
            recording={recording}
            rippleAnim={showRipple ? rippleAnim : null}
            recordPulseAnim={recording ? recordPulse : null}
            onPress={() => {
              if (recording) { stopRecord(); return; }
              if (mode === 'photo') takePhoto();
              else startRecord();
            }}
          />

          <View style={styles.statusCard}>
            <CheckCircle2 size={22} color={colors.state.success} strokeWidth={2.2} />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>{queueCount + pendingCount > 0 ? 'Enviando' : 'Tudo certo'}</Text>
              <Text style={styles.statusSub}>{queueCount + pendingCount > 0 ? 'Em fila' : 'Enviado'}</Text>
              <Text style={styles.statusMeta}>{queueCount + pendingCount} na fila</Text>
              <View style={styles.statusBarBg}>
                <View style={[styles.statusBarFill, { width: queueCount + pendingCount > 0 ? '60%' : '100%' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* ── PASTA ATIVA ── */}
        <TouchableOpacity style={styles.pastaCard} onPress={() => navigation.navigate('Gallery')} activeOpacity={0.85}>
          <View style={styles.pastaIcon}>
            <Folder size={20} color={colors.aura.primaryBright} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pastaTitle}>Pasta ativa</Text>
            <Text style={styles.pastaSub} numberOfLines={1}>{folderPath}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.pastaMeta}>{totalUploaded} arquivos</Text>
            <Text style={styles.pastaMetaSub}>{totalSize} GB</Text>
          </View>
          <ChevronRight size={16} color={colors.text.muted} strokeWidth={2} />
        </TouchableOpacity>
      </SafeAreaView>

      <CameraSettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        autoUpload={autoUpload}
        onToggleAutoUpload={() => toggleSetting(KEYS.AUTO_UPLOAD, autoUpload, setAutoUpload)}
        wifiOnly={wifiOnly}
        onToggleWifiOnly={() => toggleSetting(KEYS.WIFI_ONLY, wifiOnly, setWifiOnly)}
        saveOriginal={saveOriginal}
        onToggleSaveOriginal={() => toggleSetting(KEYS.SAVE_ORIGINAL, saveOriginal, setSaveOriginal)}
        gridEnabled={gridEnabled}
        onToggleGrid={() => toggleSetting(KEYS.GRID, gridEnabled, setGridEnabled)}
        onClearQueue={handleClearQueue}
        onDisconnect={handleDisconnect}
      />
    </View>
  );
}

/* ── HELPERS ── */

function CircleBtn({ children, onPress, active }) {
  return (
    <TouchableOpacity
      style={[styles.circleBtn, active && styles.circleBtnActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {children}
    </TouchableOpacity>
  );
}

function ControlCard({ middle, bottomLabel, Icon, onPress, active }) {
  const Component = onPress ? TouchableOpacity : View;
  return (
    <Component
      style={[styles.controlCard, active && styles.controlCardActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {Icon && <Icon size={18} color={active ? colors.aura.primaryBright : '#B8C3D1'} strokeWidth={1.8} />}
      {middle && <Text style={[styles.controlMiddle, active && { color: colors.aura.primaryBright }]}>{middle}</Text>}
      {bottomLabel && <Text style={styles.controlBottom}>{bottomLabel}</Text>}
    </Component>
  );
}

function GridOverlay() {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
      <View style={[styles.gridLine, { top: '33.33%', left: 0, right: 0, height: 0.5 }]} />
      <View style={[styles.gridLine, { top: '66.66%', left: 0, right: 0, height: 0.5 }]} />
      <View style={[styles.gridLine, { left: '33.33%', top: 0, bottom: 0, width: 0.5 }]} />
      <View style={[styles.gridLine, { left: '66.66%', top: 0, bottom: 0, width: 0.5 }]} />
    </View>
  );
}

function formatRange(start, end) {
  if (!start) return '';
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const fmt = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(2)}`;
  if (!e || s.toDateString() === e.toDateString()) return fmt(s);
  return `${fmt(s)} até ${fmt(e)}`;
}

/* ── STYLES ── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 12 },

  permWrap: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  permTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  permSub: { color: '#94a3b8', textAlign: 'center', fontSize: 14, marginBottom: 16 },
  permBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.aura.primary },
  permBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 },

  /* TOP BAR — event chip ocupa todo espaço, 3 botões à direita */
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  eventChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(8,14,26,0.85)', borderColor: 'rgba(31,139,255,0.22)', borderWidth: 1,
    borderRadius: 14, padding: 7, flex: 1,
  },
  eventCover: { width: 44, height: 44, borderRadius: 9, overflow: 'hidden', backgroundColor: '#0a1322' },
  eventInfo: { flex: 1 },
  eventNameRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  eventName: { color: '#fff', fontSize: 13, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.2, flexShrink: 1 },
  eventDate: { color: 'rgba(255,255,255,0.55)', fontSize: 9.5, fontFamily: 'Inter_500Medium', marginTop: 1 },
  eventLoc: { color: 'rgba(255,255,255,0.45)', fontSize: 9.5, fontFamily: 'Inter_500Medium' },

  topActions: { flexDirection: 'row', gap: 5 },
  circleBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(8,14,26,0.85)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  circleBtnActive: { borderColor: 'rgba(255,179,65,0.5)', backgroundColor: 'rgba(255,179,65,0.08)' },

  /* SERVER PILL — linha única abaixo do top bar */
  serverPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    backgroundColor: 'rgba(8,14,26,0.85)', borderColor: 'rgba(0,193,106,0.3)', borderWidth: 1,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginTop: 6,
  },
  serverDot: { width: 7, height: 7, borderRadius: 4 },
  serverPillText: { color: 'rgba(255,255,255,0.85)', fontSize: 10.5, fontFamily: 'Inter_600SemiBold' },

  /* CONTROLS — só 2 cards por lado, mais respiração */
  controlsArea: {
    flex: 1, flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 18, alignItems: 'flex-start',
  },
  controlCol: { gap: 10, width: 56 },
  controlCard: {
    backgroundColor: 'rgba(8,14,26,0.78)',
    borderWidth: 1, borderColor: 'rgba(31,139,255,0.22)',
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center', gap: 2,
    minHeight: 58,
  },
  controlCardActive: { borderColor: 'rgba(31,139,255,0.6)', backgroundColor: 'rgba(31,139,255,0.08)' },
  controlMiddle: { color: '#fff', fontSize: 12, fontFamily: 'Inter_800ExtraBold' },
  controlBottom: { color: 'rgba(255,255,255,0.55)', fontSize: 7.5, fontFamily: 'Inter_700Bold', letterSpacing: 0.6, marginTop: 1 },

  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.15)' },

  /* ZOOM PILLS */
  zoomPillsWrap: { alignItems: 'center', marginBottom: 8 },
  zoomPills: {
    flexDirection: 'row', gap: 4,
    backgroundColor: 'rgba(8,14,26,0.85)', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1,
    borderRadius: 999, padding: 4,
  },
  zoomPill: { minWidth: 36, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, alignItems: 'center' },
  zoomPillActive: { backgroundColor: colors.aura.primary },
  zoomPillText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter_700Bold' },
  zoomPillTextActive: { color: '#fff' },

  /* MODE PILL */
  modePillWrap: { alignItems: 'center', marginBottom: 10 },
  modePill: {
    flexDirection: 'row', gap: 4,
    backgroundColor: 'rgba(8,14,26,0.85)', borderColor: 'rgba(31,139,255,0.3)', borderWidth: 1,
    borderRadius: 999, padding: 4,
  },
  modeOption: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 999, minWidth: 70, alignItems: 'center' },
  modeOptionActive: { backgroundColor: colors.aura.primary },
  modeText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'Inter_700Bold' },
  modeTextActive: { color: '#fff' },

  /* REC */
  recBlock: { position: 'absolute', top: 220, alignSelf: 'center', left: 0, right: 0, alignItems: 'center' },
  recBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B45' },
  recText: { color: '#FF3B45', fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1 },

  /* CAPTURE ROW */
  captureRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4, marginBottom: 10,
  },
  galleryWrap: { width: 70, alignItems: 'center', gap: 4 },
  galleryThumb: {
    width: 56, height: 56, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: '#0a1322',
  },
  galleryLabel: { color: '#fff', fontSize: 9.5, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.8 },

  statusCard: {
    width: 152, flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(8,14,26,0.85)', borderColor: 'rgba(0,193,106,0.3)', borderWidth: 1,
    borderRadius: 14, padding: 10,
  },
  statusTitle: { color: colors.state.success, fontSize: 12, fontFamily: 'Inter_800ExtraBold' },
  statusSub: { color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 1 },
  statusMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 9.5, fontFamily: 'Inter_500Medium', marginTop: 3 },
  statusBarBg: { marginTop: 4, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  statusBarFill: { height: '100%', backgroundColor: colors.state.success, borderRadius: 2 },

  /* PASTA ATIVA */
  pastaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(8,14,26,0.85)', borderColor: 'rgba(31,139,255,0.25)', borderWidth: 1,
    borderRadius: 14, padding: 12, marginBottom: 8,
  },
  pastaIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(31,139,255,0.12)', borderColor: 'rgba(31,139,255,0.3)', borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  pastaTitle: { color: '#fff', fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  pastaSub: { color: 'rgba(255,255,255,0.55)', fontSize: 10.5, fontFamily: 'Inter_500Medium', marginTop: 2 },
  pastaMeta: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  pastaMetaSub: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 1 },
});
