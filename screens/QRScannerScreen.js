import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

import {
  saveServerConfig, setActiveEvent, getServerConfig,
  setDeviceToken, setDeviceId,
} from '../services/storage';
import { pingServer, pairDevice } from '../services/api';

// Parse de payloads aceitos:
// - JSON: { type: "contourline-pair", server: {...}, pairCode: "ABC123" }  ← NOVO formato preferido
// - JSON: { type: "contourline-event", server: {...}, event: {...} }
// - JSON: { type: "contourline-server", server: {...} }
// - URL: https://...trycloudflare.com
// - String legada: contourline://...
function parseQR(raw) {
  if (!raw) return null;
  const s = String(raw).trim();

  // JSON puro
  if (s.startsWith('{')) {
    try {
      const obj = JSON.parse(s);
      if (obj.type === 'contourline-pair'
          || obj.type === 'contourline-event'
          || obj.type === 'contourline-server') return obj;
    } catch {}
  }

  // URL direta
  if (s.startsWith('http://') || s.startsWith('https://')) {
    return { type: 'contourline-server', server: { url: s } };
  }

  // Legado contourline://
  if (s.startsWith('contourline://')) {
    try {
      const u = new URL(s.replace('contourline://', 'https://placeholder/'));
      return {
        type: 'contourline-server',
        server: {
          url:      u.searchParams.get('url') || '',
          password: u.searchParams.get('password') || '',
        },
      };
    } catch {}
  }
  return null;
}

export default function QRScannerScreen({ navigation, route }) {
  // mode: 'setup' (precisa configurar servidor+evento), 'event' (já tem servidor, só troca evento)
  const mode = route.params?.mode || 'event';

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned]   = useState(false);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator color={colors.brand} /></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permOverlay}>
          <Text style={styles.permTitle}>📷 Câmera necessária</Text>
          <Text style={styles.permSub}>
            Para escanear o QR code do servidor e dos eventos.
          </Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={requestPermission}>
            <Text style={styles.btnPrimaryText}>Permitir câmera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnGhost} onPress={() => navigation.goBack()}>
            <Text style={styles.btnGhostText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  async function handleBarcode(result) {
    const data = result?.data || result?.raw;
    if (scanned || busy || !data) return;
    setScanned(true);
    setBusy(true);
    setError('');

    // DEBUG visível — mostra o que o scanner pegou
    console.log('[QR] Lido:', String(data).slice(0, 100));

    const parsed = parseQR(data);
    if (!parsed) {
      // Mostra o conteúdo bruto pra facilitar diagnóstico
      const preview = data ? `"${data.slice(0, 80)}${data.length > 80 ? '…' : ''}"` : '(vazio)';
      setError(`QR não reconhecido: ${preview}`);
      setTimeout(() => { setScanned(false); setBusy(false); setError(''); }, 4000);
      return;
    }

    try {
      // ── NOVO: QR de pareamento (sem senha) ──
      if (parsed.type === 'contourline-pair') {
        if (!parsed.server?.url || !parsed.pairCode) {
          throw new Error('QR de pareamento inválido');
        }
        const url = parsed.server.url.replace(/\/$/, '');

        // Chama servidor pra trocar o pair code por device token
        const result = await pairDevice(url, parsed.pairCode, Platform.OS);

        // Salva tudo
        await saveServerConfig({
          serverUrl: url,
          password: '',  // não usamos mais
          deviceName: '',
        });
        await setDeviceToken(result.deviceToken);
        await setDeviceId(result.deviceId);

        // Navega pra escolha de perfil, passando a lista de usuários disponíveis
        navigation.replace('ProfilePicker', { users: result.users || [] });
        return;
      }

      // ── Legado: QR com servidor + senha ──
      if (parsed.server?.url) {
        const url = parsed.server.url.replace(/\/$/, '');
        const password = parsed.server.password;
        if (!password) {
          // Tenta usar a senha já salva
          const existing = await getServerConfig();
          if (!existing?.password) {
            throw new Error('QR antigo. Peça pra gerar um novo no painel.');
          }
          await pingServer(url, { password: existing.password });
          await saveServerConfig({ ...existing, serverUrl: url });
        } else {
          await pingServer(url, { password });
          const existing = await getServerConfig();
          await saveServerConfig({
            serverUrl: url,
            password,
            deviceName: existing?.deviceName || '',
          });
        }
      }

      // Tem evento no QR? Define como ativo.
      if (parsed.event) {
        await setActiveEvent({
          id:        parsed.event.id,
          name:      parsed.event.name,
          folder:    parsed.event.folder,
          startDate: parsed.event.startDate,
          endDate:   parsed.event.endDate,
          coverUrl:  parsed.event.coverUrl || null,
          location:  parsed.event.location || null,
          type:      parsed.event.type || null,
          owner:     parsed.event.owner || null,
        });
      }

      // Volta — quem chamou (SetupScreen ou Main) detecta a mudança via useFocusEffect
      navigation.goBack();
    } catch (e) {
      setError(e.message || 'Não foi possível conectar');
      setTimeout(() => { setScanned(false); setBusy(false); setError(''); }, 2500);
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcode}
      />

      {/* overlay com janela centralizada */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.frame}>
            {/* cantos */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          {busy
            ? <View style={styles.busyBox}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.busyText}>Conectando…</Text>
              </View>
            : <>
                <Text style={styles.title}>
                  {mode === 'setup' ? 'Aponte para o QR do Contourline' : 'Aponte para o QR da atividade'}
                </Text>
                <Text style={styles.subtitle}>
                  No computador: Conectar celular → Apontar aqui
                </Text>
              </>
          }
          {!!error && <Text style={styles.error}>{error}</Text>}

          {/* Fallback — colar JSON manualmente */}
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => {
              navigation.goBack();
              navigation.navigate('Setup');
            }}
          >
            <Text style={styles.manualBtnText}>Não consegue escanear? Digite manualmente ↗</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* botão fechar */}
      <SafeAreaView style={styles.closeWrap}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const FRAME = 260;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', position: 'relative' },

  overlay: { ...StyleSheet.absoluteFillObject, pointerEvents: 'box-none' },
  overlayTop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  overlayMiddle: { flexDirection: 'row', height: FRAME },
  overlaySide:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  overlayBottom: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', paddingTop: 32, paddingHorizontal: 32,
  },

  frame: {
    width: FRAME, height: FRAME, position: 'relative',
  },
  corner: {
    position: 'absolute', width: 32, height: 32,
    borderColor: colors.brand, borderWidth: 4,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },

  title:    { color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8, textAlign: 'center', fontFamily: 'Inter_400Regular', lineHeight: 18 },
  error:    { color: '#fca5a5', fontSize: 14, marginTop: 16, textAlign: 'center', fontFamily: 'Inter_500Medium' },

  busyBox:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  busyText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },

  manualBtn: {
    marginTop: 24, paddingVertical: 10, paddingHorizontal: 18,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  manualBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_500Medium' },

  closeWrap: { position: 'absolute', top: 0, right: 0 },
  closeBtn:  {
    width: 40, height: 40, borderRadius: 20, margin: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 22, fontFamily: 'Inter_400Regular' },

  permOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  permTitle:   { color: colors.text, fontSize: 22, fontFamily: 'Inter_700Bold' },
  permSub:     { color: colors.muted, textAlign: 'center', fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  btnPrimary:  { backgroundColor: colors.brand, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  btnPrimaryText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 },
  btnGhost:    { padding: 12 },
  btnGhostText:{ color: colors.muted, fontFamily: 'Inter_500Medium' },
});
