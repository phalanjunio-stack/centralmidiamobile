// Tela "Conectar Central" — Fase 2 do redesign Aura.
// Faz auto-discovery de Centrais na rede + oferece QR scan + conexao manual.
// Substitui a SetupScreen como tela inicial quando nao ha token.

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Monitor, RefreshCw, QrCode, Settings, ChevronRight,
} from 'lucide-react-native';

import { AuraRing, AuraButton, GlassCard } from '../src/components/aura';
import {
  colors as auraColors, typography, spacing, radii, glow,
} from '../src/theme';
import { scanLocalNetwork, getLocalIp } from '../src/services/discovery';
import { saveServerConfig } from '../services/storage';
import { pingServer } from '../services/api';
import LogoIcon from '../components/icons/LogoIcon';

export default function ConnectAuraScreen({ navigation }) {
  const [scanning, setScanning] = useState(true);
  const [centrals, setCentrals] = useState([]);
  const [localIp, setLocalIp] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const scanCtrl = useRef(null);

  useEffect(() => {
    getLocalIp().then((ip) => setLocalIp(ip));
    startScan();
    return () => {
      scanCtrl.current?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startScan() {
    scanCtrl.current?.cancel();
    setCentrals([]);
    setScanning(true);

    const ctrl = scanLocalNetwork({
      onFound: (central) => {
        setCentrals((prev) => {
          if (prev.some((p) => p.url === central.url)) return prev;
          return [...prev, central];
        });
      },
    });
    scanCtrl.current = ctrl;
    ctrl.promise.then(() => setScanning(false)).catch(() => setScanning(false));
  }

  function handleSelectCentral(central) {
    Alert.alert(
      central.name,
      `${central.ip}\n\nPra completar o pareamento:\n1. Abra a Central no computador\n2. Clique em "Conectar celular"\n3. Aponte o celular pro QR que aparecer`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abrir scanner',
          onPress: () => navigation.navigate('QRScanner', { mode: 'setup' }),
        },
      ],
    );
  }

  function handleSkipForNow() {
    Alert.alert(
      'Continuar sem conectar?',
      'Voce pode usar o app, mas nao vai conseguir enviar fotos/videos ate parear com uma Central.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar mesmo assim',
          onPress: () => navigation.replace('Main'),
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[auraColors.bg.base, '#0A1428', auraColors.bg.base]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header: aura + logo + titulo */}
          <View style={styles.header}>
            <View style={styles.auraWrap}>
              <AuraRing
                size={150}
                state={scanning ? 'sync' : 'idle'}
                spinning={scanning}
              />
              <View style={styles.auraCore}>
                <LogoIcon size={42} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.brand}>
              contourline <Text style={styles.brandSub}>BACKUP</Text>
            </Text>
            <Text style={styles.title}>Conectar Central</Text>
            <Text style={styles.subtitle}>
              {scanning
                ? 'Procurando Centrais na sua rede...'
                : centrals.length > 0
                  ? `${centrals.length} ${centrals.length > 1 ? 'Centrais encontradas' : 'Central encontrada'}`
                  : 'Nenhuma Central encontrada na rede'}
            </Text>
          </View>

          {/* Lista de Centrais descobertas */}
          {centrals.length > 0 && (
            <View style={styles.list}>
              {centrals.map((c) => (
                <Pressable
                  key={c.url}
                  onPress={() => handleSelectCentral(c)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <GlassCard glowLevel="soft" style={styles.item}>
                    <View style={styles.itemRow}>
                      <View style={styles.itemIconWrap}>
                        <Monitor
                          size={22}
                          color={auraColors.aura.primary}
                          strokeWidth={1.8}
                        />
                      </View>
                      <View style={styles.itemText}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {c.name}
                        </Text>
                        <Text style={styles.itemSub}>
                          {c.ip}
                          {c.port !== 3000 ? `:${c.port}` : ''} · Online
                        </Text>
                      </View>
                      <ChevronRight
                        size={22}
                        color={auraColors.text.tertiary}
                        strokeWidth={2}
                      />
                    </View>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
          )}

          {/* Empty state */}
          {!scanning && centrals.length === 0 && (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                Verifique se voce esta na mesma Wi-Fi do computador com a Central rodando.
              </Text>
              {!!localIp && (
                <Text style={styles.emptyMeta}>Seu IP: {localIp}</Text>
              )}
            </View>
          )}

          {/* Acoes */}
          <View style={styles.actions}>
            <AuraButton
              variant="ghost"
              size="md"
              onPress={startScan}
              disabled={scanning}
            >
              <RefreshCw
                size={18}
                color={auraColors.text.primary}
                strokeWidth={2}
              />
              <Text style={styles.btnText}>
                {scanning ? 'Procurando...' : 'Procurar novamente'}
              </Text>
            </AuraButton>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <AuraButton
              variant="primary"
              size="lg"
              onPress={() => navigation.navigate('QRScanner', { mode: 'setup' })}
            >
              <QrCode size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.btnTextPrimary}>Escanear QR diretamente</Text>
            </AuraButton>

            <Pressable
              onPress={() => setShowManual(true)}
              style={styles.linkBtn}
            >
              <Settings
                size={16}
                color={auraColors.text.tertiary}
                strokeWidth={1.8}
              />
              <Text style={styles.linkText}>Conexao manual</Text>
            </Pressable>

            {__DEV__ && (
              <Pressable
                onPress={handleSkipForNow}
                style={[styles.linkBtn, { marginTop: 4 }]}
              >
                <Text style={styles.skipText}>(dev) pular por agora</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <ManualConnectModal
        visible={showManual}
        onClose={() => setShowManual(false)}
        onConnected={() => {
          setShowManual(false);
          navigation.replace('Main');
        }}
      />
    </View>
  );
}

function ManualConnectModal({ visible, onClose, onConnected }) {
  const [url, setUrl] = useState('');
  const [pwd, setPwd] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    const cleanUrl = url.trim().replace(/\/$/, '');
    if (!cleanUrl) { setError('Informe a URL'); return; }
    if (!pwd.trim()) { setError('Informe a senha'); return; }
    setTesting(true);
    try {
      await pingServer(cleanUrl, { password: pwd.trim() });
      await saveServerConfig({
        serverUrl: cleanUrl,
        password: pwd.trim(),
        deviceName: '',
      });
      onConnected();
    } catch (e) {
      setError(e?.message || 'Falha ao conectar');
    } finally {
      setTesting(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>Conexao manual</Text>
          <Text style={styles.modalSub}>
            Use apenas se nao conseguir escanear o QR.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="URL do servidor"
            placeholderTextColor={auraColors.text.muted}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TextInput
            style={styles.input}
            placeholder="Senha do servidor"
            placeholderTextColor={auraColors.text.muted}
            value={pwd}
            onChangeText={setPwd}
            secureTextEntry
          />
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.modalCancelBtn}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={testing}
              style={[styles.modalSubmitBtn, testing && { opacity: 0.6 }]}
            >
              {testing
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.modalSubmitText}>Conectar</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: auraColors.bg.base },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
  },

  // Header
  header: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  auraWrap: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  auraCore: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: auraColors.aura.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...glow.strong,
  },
  brand: {
    fontSize: typography.size.lg,
    fontFamily: typography.family.bold,
    color: auraColors.text.primary,
    letterSpacing: 0.4,
  },
  brandSub: {
    color: auraColors.aura.primary,
    fontFamily: typography.family.medium,
    letterSpacing: 2,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontFamily: typography.family.bold,
    color: auraColors.text.primary,
    marginTop: spacing.lg,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.regular,
    color: auraColors.text.tertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },

  // Lista
  list: {
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  item: {
    // GlassCard ja tem padding via wrapping
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  itemIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: auraColors.aura.primaryHalo,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: auraColors.border.aura,
  },
  itemText: { flex: 1 },
  itemTitle: {
    fontSize: typography.size.md,
    fontFamily: typography.family.semibold,
    color: auraColors.text.primary,
  },
  itemSub: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.regular,
    color: auraColors.text.tertiary,
    marginTop: 2,
  },

  // Empty
  emptyWrap: {
    marginVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: typography.size.sm,
    color: auraColors.text.tertiary,
    fontFamily: typography.family.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyMeta: {
    fontSize: typography.size.xs,
    color: auraColors.text.muted,
    fontFamily: typography.family.regular,
  },

  // Acoes
  actions: { gap: spacing.md, marginTop: spacing.lg },
  btnText: {
    fontSize: typography.size.base,
    fontFamily: typography.family.medium,
    color: auraColors.text.primary,
  },
  btnTextPrimary: {
    fontSize: typography.size.base,
    fontFamily: typography.family.semibold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: auraColors.border.glass,
  },
  dividerText: {
    fontSize: typography.size.xs,
    color: auraColors.text.muted,
    fontFamily: typography.family.medium,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  linkText: {
    fontSize: typography.size.sm,
    color: auraColors.text.tertiary,
    fontFamily: typography.family.medium,
  },
  skipText: {
    fontSize: typography.size.xs,
    color: auraColors.text.muted,
    fontFamily: typography.family.regular,
    textDecorationLine: 'underline',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: auraColors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: auraColors.border.glassHi,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontFamily: typography.family.bold,
    color: auraColors.text.primary,
  },
  modalSub: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.regular,
    color: auraColors.text.tertiary,
    marginTop: -spacing.sm,
  },
  input: {
    backgroundColor: auraColors.bg.surfaceHi,
    borderWidth: 1,
    borderColor: auraColors.border.glass,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.size.base,
    fontFamily: typography.family.medium,
    color: auraColors.text.primary,
  },
  errorText: {
    fontSize: typography.size.sm,
    color: auraColors.state.error,
    fontFamily: typography.family.medium,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radii.lg,
    backgroundColor: auraColors.bg.surfaceHi,
  },
  modalCancelText: {
    color: auraColors.text.secondary,
    fontFamily: typography.family.semibold,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radii.lg,
    backgroundColor: auraColors.aura.primary,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontFamily: typography.family.semibold,
  },
});
