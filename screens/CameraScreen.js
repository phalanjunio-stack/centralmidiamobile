// Câmera Contourline — 100% fiel ao design do pacote SVG
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

import CaptureButton    from '../components/camera/CaptureButton';
import ModeSwitchPill   from '../components/camera/ModeSwitchPill';
import FaceFocusFrame   from '../components/camera/FaceFocusFrame';
import UploadStatusPill from '../components/camera/UploadStatusPill';
import { FlashIcon, FlipCameraIcon, SettingsIcon } from '../components/camera/CameraTopIcons';
import CameraMenu       from '../components/camera/CameraMenu';
import { Mic, ChevronDown } from 'lucide-react-native';

import {
  getActiveEvent, getDeviceProfile, addSyncLogEntry, updateSyncStats,
  setDeviceToken, setDeviceId, setActiveEvent, clearAll,
} from '../services/storage';
import { uploadCapture } from '../services/api';
import { unregisterBackgroundSync } from '../services/sync';

const LOGO_FULL_WHITE = require('../assets/brand/logotipo-contourline-branca.png');

export default function CameraScreen({ navigation, route }) {
  // ── Permissões ──
  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();

  // ── Camera state ──
  const cameraRef = useRef(null);
  const [facing, setFacing]     = useState('back');
  const [flash, setFlash]       = useState('off');
  const [mode, setMode]         = useState(route?.params?.initialMode || 'photo');

  // ── Capture state ──
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const recordTimerRef = useRef(null);
  const recordStartedAtRef = useRef(0);
  const stopRecordTimerRef = useRef(null);

  // ── UI state ──
  const [event, setEvent]       = useState(null);
  const [profile, setProfile]   = useState(null);
  const [lastThumb, setLastThumb] = useState(null);
  const [queueCount, setQueueCount] = useState(0);
  const [lastStatus, setLastStatus] = useState('idle'); // 'idle' | 'uploading' | 'sent' | 'error'
  const [menuOpen, setMenuOpen] = useState(false);
  const [micNoticeVisible, setMicNoticeVisible] = useState(false);
  const [zoom, setZoom]         = useState(0);    // 0-1 (funciona cross-platform via pinch)
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // ── Tap-to-focus state ──
  const [focusPoint, setFocusPoint] = useState(null);
  const focusTimerRef = useRef(null);

  // ── Animações ──
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const recordPulse = useRef(new Animated.Value(0)).current;
  const [showRipple, setShowRipple] = useState(false);

  // Pinch-to-zoom hooks must run before any conditional return.
  const initialPinchRef = useRef(null);
  const zoomRef = useRef(0);
  zoomRef.current = zoom;

  const pinchPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
      onPanResponderGrant: (e) => {
        const t = e.nativeEvent.touches;
        if (t.length === 2) {
          const dx = t[0].pageX - t[1].pageX;
          const dy = t[0].pageY - t[1].pageY;
          initialPinchRef.current = {
            distance: Math.sqrt(dx * dx + dy * dy),
            zoom: zoomRef.current,
          };
        }
      },
      onPanResponderMove: (e) => {
        const t = e.nativeEvent.touches;
        if (t.length === 2 && initialPinchRef.current) {
          const dx = t[0].pageX - t[1].pageX;
          const dy = t[0].pageY - t[1].pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const scale = distance / initialPinchRef.current.distance;
          const newZoom = Math.max(0, Math.min(1, initialPinchRef.current.zoom + (scale - 1) * 0.5));
          setZoom(newZoom);
        }
      },
      onPanResponderRelease: () => { initialPinchRef.current = null; },
    })
  ).current;

  // ── Load data ──
  useFocusEffect(useCallback(() => {
    (async () => {
      const [ev, p] = await Promise.all([getActiveEvent(), getDeviceProfile()]);
      setEvent(ev);
      setProfile(p);
    })();
  }, []));

  // ── Pulso pra recording ──
  useEffect(() => {
    if (recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordPulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(recordPulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      recordPulse.setValue(0);
    }
  }, [recording]);

  // ── Timer ──
  useEffect(() => {
    if (recording) {
      recordTimerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } else {
      clearInterval(recordTimerRef.current);
      setRecordSecs(0);
    }
    return () => clearInterval(recordTimerRef.current);
  }, [recording]);

  useEffect(() => {
    if (!micPerm?.granted) return;
    setMicNoticeVisible(true);
    const t = setTimeout(() => setMicNoticeVisible(false), 2200);
    return () => clearTimeout(t);
  }, [micPerm?.granted]);

  useEffect(() => {
    return () => {
      if (stopRecordTimerRef.current) clearTimeout(stopRecordTimerRef.current);
    };
  }, []);

  // ── Onda da foto ──
  function playRipple() {
    setShowRipple(true);
    rippleAnim.setValue(0);
    Animated.timing(rippleAnim, {
      toValue: 1, duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setShowRipple(false));
  }

  // ── Captura foto ──
  async function takePhoto() {
    if (!cameraRef.current || recording) return;
    playRipple();
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.92 });
      setLastThumb(photo.uri);
      enqueueUpload(photo.uri, 'photo');
    } catch (e) {
      console.log('[Camera] takePhoto:', e.message);
      setLastStatus('error');
    }
  }

  // ── Vídeo ──
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
        enqueueUpload(video.uri, 'video');
      }
    } catch (e) {
      console.log('[Camera] recordAsync:', e.message);
      setRecording(false);
    }
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

  async function handleModeChange(nextMode) {
    if (recording) return;
    setMode(nextMode);
    if (nextMode === 'video' && !micPerm?.granted) {
      const res = await requestMic();
      if (res?.granted) setMicNoticeVisible(true);
    }
  }

  // ── Upload real ──
  async function enqueueUpload(uri, type) {
    setQueueCount((c) => c + 1);
    setLastStatus('uploading');

    try {
      console.log('[Upload] Iniciando:', { uri: uri?.slice(0, 50), type, eventId: event?.id, eventFolder: event?.folder });
      const result = await uploadCapture({ uri, mediaType: type, activeEvent: event, profile });
      console.log('[Upload] OK:', result);
      setQueueCount((c) => Math.max(0, c - 1));
      setLastStatus('sent');
      await addSyncLogEntry({
        name: result?.name || `capture_${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`,
        size: result?.size || 0,
        ok: true,
        uri,                          // ← URI local pra galeria mostrar thumb
        mediaType: type,              // ← 'photo' | 'video'
        eventId: event?.id || null,
        eventName: event?.name || null,
        serverPath: result?.path || null,
      });
      await updateSyncStats(1, 0);
    } catch (e) {
      console.log('[Upload] FALHOU:', e.message);
      setQueueCount((c) => Math.max(0, c - 1));
      setLastStatus('error');
      // Mostra alert visível pro usuário
      Alert.alert('Falha no envio', `Não foi possível enviar pro servidor:\n\n${e.message}`, [{ text: 'OK' }]);
      await addSyncLogEntry({
        name: `capture_${Date.now()}`,
        ok: false, error: e.message, eventId: event?.id || null,
      }).catch(() => {});
      await updateSyncStats(0, 1).catch(() => {});
    }
  }

  // ── Menu actions ──
  function handleDisconnect() {
    Alert.alert(
      'Desconectar celular',
      'Você precisará parear de novo escaneando um QR. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar', style: 'destructive',
          onPress: async () => {
            await unregisterBackgroundSync();
            await clearAll();
            navigation.reset({ index: 0, routes: [{ name: 'Setup' }] });
          },
        },
      ]
    );
  }

  // ── Permissão ──
  if (!camPerm) {
    return <View style={styles.container}><ActivityIndicator color="#3b82f6" /></View>;
  }
  if (!camPerm.granted) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.permWrap}>
            <Text style={styles.permTitle}>📷 Câmera necessária</Text>
            <Text style={styles.permSub}>O app precisa de acesso à câmera pra capturar fotos e vídeos.</Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestCam}>
              <Text style={styles.permBtnText}>Permitir câmera</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const minutes = Math.floor(recordSecs / 60);
  const seconds = recordSecs % 60;
  const recTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const compactWidth = screenWidth < 380;
  const ui = {
    topBarHeight: Math.min(118, Math.max(104, screenHeight * 0.125)),
    modeBottom: Math.max(162, screenHeight * 0.205),
    controlsBottom: Math.max(42, screenHeight * 0.055),
    sidePadding: compactWidth ? 18 : 24,
  };

  // Toque na tela: mostra feedback visual de foco (auto-focus contínuo)
  function handleScreenTap(e) {
    const { locationX, locationY } = e.nativeEvent;
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    setFocusPoint({ x: locationX, y: locationY });
    focusTimerRef.current = setTimeout(() => setFocusPoint(null), 1500);
  }

  // ── Pinch-to-zoom ──
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {/* Camera fullscreen
          - zoom: funciona cross-platform (0 a 1, controlado por pinch)
          - autofocus: contínuo automático do sistema nativo
          Detecção real de rosto/pessoa/carro e exposição manual Android precisa de dev build nativo.
      */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        mode={mode === 'video' ? 'video' : 'picture'}
        videoQuality="2160p"
        videoBitrate={35000000}
        videoStabilizationMode="auto"
        zoom={zoom}
        autofocus="on"
      />

      {/* Tap layer pra foco + pinch-to-zoom */}
      <View
        style={StyleSheet.absoluteFill}
        {...pinchPan.panHandlers}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleScreenTap}
        />
      </View>

      {/* Indicador de zoom */}
      {zoom > 0.01 && (
        <View style={styles.zoomBadge} pointerEvents="none">
          <Text style={styles.zoomText}>{(1 + zoom * 4).toFixed(1)}x</Text>
        </View>
      )}

      {/* Focus indicator — só os 4 cantos azuis */}
      {focusPoint && (
        <View
          style={[
            styles.focusOnTap,
            { left: focusPoint.x - 60, top: focusPoint.y - 60 },
          ]}
          pointerEvents="none"
        >
          <FaceFocusFrame width={120} height={120} label="Foco automático" />
        </View>
      )}


      {/* ── Overlay UI ── */}
      {micNoticeVisible && (
        <View style={styles.micNotice} pointerEvents="none">
          <Mic size={15} color="#34d399" strokeWidth={2.2} />
          <Text style={styles.micNoticeText}>Microfone conectado</Text>
        </View>
      )}

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">

        {/* TOP — Row única: event chip à esquerda + icons à direita */}
        <View style={[styles.topBar, { height: ui.topBarHeight }]}>
          <View style={styles.logoCenter} pointerEvents="none">
            <Image source={LOGO_FULL_WHITE} style={styles.topLogo} resizeMode="contain" />
          </View>
          <View style={styles.topContent}>
          <TouchableOpacity
            style={styles.eventBlock}
            onPress={() => navigation.navigate('EventPicker')}
            activeOpacity={0.7}
          >
            <View style={styles.eventInline}>
              <Text style={styles.eventName} numberOfLines={1}>
                {event?.name || 'Sem atividade'}
              </Text>
              <ChevronDown size={13} color="#fff" strokeWidth={2.4} />
            </View>
            <View style={styles.serverStatusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.serverText}>Servidor conectado</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
              activeOpacity={0.7}
            >
              <FlashIcon size={24} active={flash !== 'off'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
              activeOpacity={0.7}
            >
              <FlipCameraIcon size={24} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setMenuOpen(true)}
              activeOpacity={0.7}
            >
              <SettingsIcon size={23} />
            </TouchableOpacity>
          </View>
          </View>
        </View>

        {/* REC indicator + Mic + VU meter — fixo no TOPO */}
        {recording && (
          <View style={[styles.recTopBlock, { top: ui.topBarHeight + 16 }]}>
            <View style={styles.recTopRow}>
              <View style={styles.recBadge}>
                <View style={styles.recDot} />
                <Text style={styles.recText}>REC {recTime}</Text>
              </View>
              {micPerm?.granted && (
                <View style={styles.micBadge}>
                  <MicIndicator />
                </View>
              )}
            </View>
            <Text style={styles.recHint}>
              {mode === 'photo' ? 'Segure para continuar gravando' : 'Toque novamente para parar'}
            </Text>
          </View>
        )}

        {!recording && mode === 'video' && micPerm?.granted && (
          <View style={[styles.videoMicBadge, { top: ui.topBarHeight + 18 }]} pointerEvents="none">
            <Mic size={14} color="#34d399" strokeWidth={2.2} />
          </View>
        )}



        {/* ── BOTTOM ── */}
        <View style={styles.bottomArea} pointerEvents="box-none">

          {/* Mode switch acima do botão */}
          <View style={[styles.modeSwitchWrap, { bottom: ui.modeBottom }]}>
            <ModeSwitchPill
              mode={mode}
              onChange={handleModeChange}
              disabled={recording}
            />
          </View>

          {/* Linha com thumbnail | botão centralizado | status — 3 colunas iguais */}
          <View style={[styles.bottomRow, { bottom: ui.controlsBottom, paddingHorizontal: ui.sidePadding }]}>
            {/* Slot esquerdo: thumbnail */}
            <View style={styles.sideSlotLeft}>
              <TouchableOpacity
                style={styles.thumbBtn}
                onPress={() => navigation.navigate('Gallery')}
                activeOpacity={0.85}
              >
                {lastThumb
                  ? <Image source={{ uri: lastThumb }} style={styles.thumbImg} />
                  : <View style={[styles.thumbImg, styles.thumbPlaceholder]} />
                }
              </TouchableOpacity>
            </View>

            {/* Slot central: botão de captura */}
            <View style={styles.centerSlot}>
              <CaptureButton
                size={112}
                mode={mode}
                recording={recording}
                rippleAnim={showRipple ? rippleAnim : null}
                recordPulseAnim={recording ? recordPulse : null}
                onPress={() => {
                  if (recording) { stopRecord(); return; }
                  if (mode === 'photo') takePhoto();
                  else                  startRecord();
                }}
                onLongPress={() => {
                  if (mode === 'photo' && !recording) startRecord();
                }}
                onPressOut={() => {
                  if (mode === 'photo' && recording) stopRecord();
                }}
              />
            </View>

            {/* Slot direito: status pill */}
            <View style={styles.sideSlotRight}>
              <UploadStatusPill
                queueCount={queueCount}
                status={lastStatus}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Menu lateral */}
      <CameraMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        event={event}
        profile={profile}
        queueCount={queueCount}
        onOpenHome={() => navigation.navigate('Main')}
        onChangeEvent={() => navigation.navigate('EventPicker')}
        onOpenGallery={() => navigation.navigate('Gallery')}
        onOpenUploads={() => navigation.navigate('Uploads')}
        onOpenProfile={() => navigation.navigate('ProfileTab')}
        onDisconnect={handleDisconnect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject },

  // ── Top bar — UMA linha: evento à esquerda + 3 icons à direita ──
  topBar: {
    position: 'absolute',
    left: 16, right: 16, top: 8,
    backgroundColor: 'rgba(3,14,26,0.92)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(174,203,235,0.26)',
    paddingHorizontal: 22,
    paddingTop: 50,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  logoCenter: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  topLogo: {
    width: 122,
    height: 30,
  },
  topContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  eventBlock: {
    flex: 1,
    paddingRight: 14,
  },
  eventInline: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  eventName: {
    color: '#fff', fontSize: 15, fontFamily: 'Inter_800ExtraBold',
    letterSpacing: 0,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
    flexShrink: 1,
  },
  serverStatusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3,
  },
  statusDot: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: '#10b981',
  },
  serverText: {
    color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: 'Inter_500Medium',
    textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },

  topActions: {
    flexDirection: 'row', gap: 14,
  },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },

  // REC bloc — top fixo
  recTopBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 6,
    zIndex: 6,
  },
  recTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  micBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)',
  },

  // REC badge
  recBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
    alignSelf: 'center', gap: 4,
  },
  recDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B45',
  },
  recText: { color: '#FF3B45', fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  recHint: { color: '#fff', fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 4 },

  // Face focus (tap-to-focus) — posição dinâmica
  focusOnTap: {
    position: 'absolute',
    width: 120, height: 120,
    zIndex: 5,
  },

  micNotice: {
    position: 'absolute',
    top: 116,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6,27,52,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.42)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    zIndex: 20,
  },
  micNoticeText: {
    color: '#D9FFF0',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  videoMicBadge: {
    position: 'absolute',
    alignSelf: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.42)',
    zIndex: 6,
  },

  // Zoom badge
  zoomBadge: {
    position: 'absolute', top: 90,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 10,
  },
  zoomText: {
    color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0.3,
  },

  // ── Bottom area ──
  bottomArea: {
    ...StyleSheet.absoluteFillObject,
  },
  modeSwitchWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideSlotLeft: { flex: 1, alignItems: 'flex-start' },
  sideSlotRight: { flex: 1, alignItems: 'flex-end' },
  centerSlot: { width: 112, alignItems: 'center', justifyContent: 'center' },

  thumbBtn: { width: 58, height: 58 },
  thumbImg: {
    width: 58, height: 58, borderRadius: 14,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  thumbPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },


  // Permissão
  permWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 16,
  },
  permTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  permSub: { color: '#94a3b8', textAlign: 'center', fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  permBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, backgroundColor: '#2B83FF' },
  permBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 },
});

// ─── MicIndicator ───
function MicIndicator() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  return (
    <Animated.View style={{ opacity }}>
      <Mic size={14} color="#10b981" strokeWidth={2} />
    </Animated.View>
  );
}
