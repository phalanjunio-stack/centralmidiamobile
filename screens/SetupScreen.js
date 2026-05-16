import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings, QrCode, ChevronRight,
  Wifi, Lock, CloudUpload, ShieldCheck,
} from 'lucide-react-native';
import LogoIcon from '../components/icons/LogoIcon';

import { colors } from '../theme';
import {
  saveServerConfig, saveDeviceProfile, getServerConfig, getDeviceProfile,
} from '../services/storage';
import { pingServer, registerDevice, uploadDevicePhoto } from '../services/api';
import { registerBackgroundSync } from '../services/sync';

export default function SetupScreen({ navigation }) {
  // Stages: 'welcome' → (QR scanner via navigate) → 'profile' → done
  const [stage, setStage] = useState('welcome');
  const [serverConfigured, setServerConfigured] = useState(false);

  // Profile state
  const [name, setName]       = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [phoneModel]          = useState(Platform.OS === 'ios' ? 'iPhone' : 'Android');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  // Manual fallback state
  const [showManual, setShowManual] = useState(false);
  const [manualUrl, setManualUrl]   = useState('');
  const [manualPwd, setManualPwd]   = useState('');
  const [testing, setTesting]       = useState(false);

  // Detecta quando o usuário volta do QRScanner — se servidor foi configurado, avança o estágio
  useFocusEffect(useCallback(() => {
    (async () => {
      const config = await getServerConfig();
      if (config?.serverUrl) {
        setServerConfigured(true);
        setStage('profile');
      }
      const profile = await getDeviceProfile();
      if (profile?.name) {
        setName(profile.name);
        if (profile.photoUri) setPhotoUri(profile.photoUri);
      }
    })();
  }, []));

  // ── Welcome → abre QR scanner ──
  function openQRScanner() {
    // Sem callback (evita warning de non-serializable). useFocusEffect detecta o retorno.
    navigation.navigate('QRScanner', { mode: 'setup' });
  }

  // ── Manual fallback (digitar URL+senha) ──
  async function handleManualConnect() {
    setError('');
    const url = manualUrl.trim().replace(/\/$/, '');
    const pwd = manualPwd.trim();
    if (!url || !pwd) { setError('Preencha URL e senha'); return; }
    setTesting(true);
    try {
      await pingServer(url, pwd);
      await saveServerConfig({ serverUrl: url, password: pwd, deviceName: '' });
      setServerConfigured(true);
      setStage('profile');
      setShowManual(false);
    } catch (e) {
      setError(e.message || 'Falha ao conectar');
    } finally {
      setTesting(false);
    }
  }

  // ── Profile: tirar/escolher foto ──
  async function handleChoosePhoto() {
    // expo-image-manipulator não escolhe foto, então usamos ImagePicker do expo-image-picker
    // ... mas pra simplificar, vamos importar dinamicamente
    try {
      const Picker = await import('expo-image-picker').catch(() => null);
      if (!Picker) {
        Alert.alert('Foto', 'Funcionalidade indisponível neste build');
        return;
      }
      const perm = await Picker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permissão negada'); return; }
      const res = await Picker.launchImageLibraryAsync({
        mediaTypes: Picker.MediaTypeOptions?.Images || 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (res.canceled || !res.assets?.[0]) return;
      // Comprime
      const compressed = await ImagePicker.manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 400 } }],
        { compress: 0.8, format: ImagePicker.SaveFormat.JPEG }
      );
      setPhotoUri(compressed.uri);
    } catch (e) {
      Alert.alert('Erro', e.message);
    }
  }

  // ── Salvar perfil e finalizar ──
  async function handleFinish() {
    setError('');
    if (!name.trim()) { setError('Informe seu nome'); return; }
    setSaving(true);
    try {
      // Gera ID se for o primeiro
      const existing = await getDeviceProfile();
      const id = existing?.id || `device_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const profile = {
        id,
        name: name.trim(),
        photoUri: photoUri || null,
        phoneModel,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };

      // Registra no servidor (best-effort, não bloqueia)
      try {
        await registerDevice({
          id: profile.id,
          name: profile.name,
          phoneModel: profile.phoneModel,
        });
        if (photoUri) {
          await uploadDevicePhoto(profile.id, photoUri).catch(() => {});
        }
      } catch (e) {
        console.log('Falha ao registrar device no servidor:', e.message);
      }

      // Atualiza deviceName no config
      const config = await getServerConfig();
      if (config) await saveServerConfig({ ...config, deviceName: profile.name });

      await saveDeviceProfile(profile);
      await registerBackgroundSync();

      navigation.replace('Main');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Render Welcome ──
  if (stage === 'welcome') {
    return (
      <View style={{ flex: 1, backgroundColor: '#03101F' }}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Top settings gear */}
          <View style={styles.topBar}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.gearBtn}
              onPress={() => setShowManual(!showManual)}
              activeOpacity={0.7}
            >
              <Settings size={20} color="#94a3b8" strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.welcomeScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero — Logo Contourline */}
            <View style={styles.hero}>
              <LogoIcon size={120} color="#fff" />
              <Text style={styles.brandName}>contourline<Text style={styles.brandReg}>®</Text></Text>
              <Text style={styles.tagline}>Backup automático do seu celular</Text>
            </View>

            {/* CTA big card — Conectar */}
            <TouchableOpacity
              style={styles.ctaCard}
              onPress={openQRScanner}
              activeOpacity={0.88}
            >
              <View style={styles.ctaIconWrap}>
                <QrCode size={32} color="#3b82f6" strokeWidth={1.8} />
              </View>
              <View style={styles.ctaTextWrap}>
                <Text style={styles.ctaTitle}>Conectar ao app do celular</Text>
                <Text style={styles.ctaSub}>Escanear QR do servidor</Text>
              </View>
              <ChevronRight size={28} color="#3b82f6" strokeWidth={2} />
            </TouchableOpacity>

            {/* Divider — O que acontece depois? */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O que acontece depois?</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Features cards */}
            <View style={styles.featList}>
              <FeatureRow
                Icon={Wifi}
                iconColor="#3b82f6"
                bgColor="rgba(59,130,246,0.12)"
                title="Não precisa estar na mesma rede Wi-Fi"
                desc="O app se conecta direto ao servidor"
              />
              <FeatureRow
                Icon={Lock}
                iconColor="#10b981"
                bgColor="rgba(16,185,129,0.12)"
                title="Seus arquivos ficam protegidos"
                desc="Conexão segura e privada"
              />
              <FeatureRow
                Icon={CloudUpload}
                iconColor="#f59e0b"
                bgColor="rgba(245,158,11,0.12)"
                title="Envie fotos e vídeos automaticamente"
                desc="Tudo organizado por data e evento"
              />
            </View>

            {/* Trust badge no rodapé */}
            <View style={styles.trustCard}>
              <ShieldCheck size={28} color="#3b82f6" strokeWidth={1.8} />
              <View style={{ flex: 1 }}>
                <Text style={styles.trustTitle}>Contorno de confiança e tecnologia</Text>
                <Text style={styles.trustBrand}>Contourline Backup</Text>
              </View>
            </View>

            {/* Manual fallback (oculto por padrão, abre pelo engrenagem) */}
            {showManual && (
              <View style={styles.manualBox}>
                <Text style={styles.manualHelp}>
                  Use isso só se não conseguir escanear o QR.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://xxx.trycloudflare.com"
                  placeholderTextColor={colors.faint}
                  value={manualUrl} onChangeText={setManualUrl}
                    autoCapitalize="none" autoCorrect={false} keyboardType="url"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Senha do servidor"
                    placeholderTextColor={colors.faint}
                    value={manualPwd} onChangeText={setManualPwd}
                    secureTextEntry
                  />
                  {!!error && <Text style={styles.errorMsg}>{error}</Text>}
                  <TouchableOpacity
                    style={[styles.connectBtn, testing && { opacity: 0.6 }]}
                    onPress={handleManualConnect}
                    disabled={testing}
                  >
                    {testing
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.connectBtnText}>Conectar</Text>
                    }
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Render Profile setup ──
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.profileScroll} keyboardShouldPersistTaps="handled">

            <View style={styles.profileHeader}>
              <Text style={styles.profileStep}>PASSO 2 DE 2</Text>
              <Text style={styles.profileTitle}>Quem é esse celular?</Text>
              <Text style={styles.profileSub}>
                Suas fotos vão aparecer com esse nome no painel.
              </Text>
            </View>

            {/* Avatar picker */}
            <TouchableOpacity style={styles.avatarWrap} onPress={handleChoosePhoto} activeOpacity={0.8}>
              {photoUri
                ? <Image source={{ uri: photoUri }} style={styles.avatar} />
                : <View style={[styles.avatar, styles.avatarEmpty]}>
                    <Text style={styles.avatarEmptyIcon}>👤</Text>
                  </View>
              }
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeIcon}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>Toque para adicionar foto</Text>

            {/* Name input */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>SEU NOME OU DO CELULAR</Text>
              <TextInput
                style={styles.bigInput}
                placeholder="Ex: Alan Junio"
                placeholderTextColor={colors.faint}
                value={name} onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleFinish}
              />
            </View>

            {!!error && <Text style={styles.errorMsg}>{error}</Text>}

            <TouchableOpacity
              style={[styles.finishBtn, saving && { opacity: 0.6 }]}
              onPress={handleFinish}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.finishBtnText}>Concluir</Text>
              }
            </TouchableOpacity>

            <Text style={styles.skipNote}>
              Você pode mudar isso depois em Perfil → Editar
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function FeatureRow({ Icon, iconColor, bgColor, title, desc }) {
  return (
    <View style={styles.featRow}>
      <View style={[styles.featIconBox, { backgroundColor: bgColor }]}>
        <Icon size={22} color={iconColor} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featTitle}>{title}</Text>
        <Text style={styles.featDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Welcome screen
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8,
  },
  gearBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },

  welcomeScroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12 },

  hero: { alignItems: 'center', gap: 4, marginTop: 32, marginBottom: 32 },
  brandName: {
    fontSize: 30, color: '#fff', marginTop: 16,
    fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5,
  },
  brandReg: {
    fontSize: 12, color: '#fff',
    fontFamily: 'Inter_500Medium', letterSpacing: 0,
  },
  tagline: {
    fontSize: 15, color: '#94a3b8', fontFamily: 'Inter_400Regular',
    textAlign: 'center', marginTop: 4,
  },

  // CTA card
  ctaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.45)',
    borderRadius: 18, paddingHorizontal: 18, paddingVertical: 18,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16,
    elevation: 4,
  },
  ctaIconWrap: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaTextWrap: { flex: 1 },
  ctaTitle: { color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold', letterSpacing: -0.2 },
  ctaSub:   { color: '#cbd5e1', fontSize: 13, marginTop: 2, fontFamily: 'Inter_400Regular' },

  // Divider
  dividerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 36, marginBottom: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { color: '#94a3b8', fontSize: 13, fontFamily: 'Inter_500Medium' },

  // Feature rows
  featList: { gap: 18 },
  featRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  featIconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  featTitle: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.1 },
  featDesc:  { color: '#94a3b8', fontSize: 12, marginTop: 2, fontFamily: 'Inter_400Regular' },

  // Trust badge
  trustCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(59,130,246,0.05)',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.20)',
    borderRadius: 14, padding: 16,
    marginTop: 36,
  },
  trustTitle: { color: '#cbd5e1', fontSize: 13, fontFamily: 'Inter_500Medium' },
  trustBrand: { color: '#3b82f6', fontSize: 15, fontFamily: 'Inter_700Bold', marginTop: 2 },

  // Manual fallback (hidden by default)
  manualBox: {
    gap: 10, marginTop: 20, padding: 16, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  manualHelp: { color: colors.faint, fontSize: 12, fontFamily: 'Inter_400Regular' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 14,
    color: '#fff', fontSize: 14, fontFamily: 'Inter_500Medium',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  errorMsg: { color: colors.error, fontSize: 13, textAlign: 'center', fontFamily: 'Inter_500Medium' },
  connectBtn: {
    backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 10,
    alignItems: 'center',
  },
  connectBtnText: { color: '#fff', fontFamily: 'Inter_700Bold' },

  // Profile screen
  profileScroll: { flexGrow: 1, padding: 24, alignItems: 'stretch' },
  profileHeader: { alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 32 },
  profileStep: {
    color: colors.brand, fontSize: 11, letterSpacing: 1,
    fontFamily: 'Inter_700Bold',
  },
  profileTitle: {
    color: colors.text, fontSize: 26, fontFamily: 'Inter_800ExtraBold',
    textAlign: 'center', letterSpacing: -0.5, marginTop: 4,
  },
  profileSub: {
    color: colors.muted, fontSize: 14, textAlign: 'center',
    fontFamily: 'Inter_400Regular', marginTop: 4, paddingHorizontal: 20,
  },

  avatarWrap: { alignSelf: 'center', marginTop: 8 },
  avatar: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 3, borderColor: colors.brand,
  },
  avatarEmpty: {
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmptyIcon: { fontSize: 56 },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.bg,
  },
  avatarBadgeIcon: { fontSize: 18 },
  avatarLabel: {
    color: colors.muted, textAlign: 'center', marginTop: 12,
    fontSize: 13, fontFamily: 'Inter_500Medium',
  },

  fieldWrap: { marginTop: 32 },
  label: {
    color: colors.muted, fontSize: 11, letterSpacing: 0.8,
    fontFamily: 'Inter_700Bold', marginBottom: 8,
  },
  bigInput: {
    backgroundColor: colors.card, borderRadius: 14, padding: 18,
    color: colors.text, fontSize: 17, fontFamily: 'Inter_600SemiBold',
    borderWidth: 1, borderColor: colors.border,
  },

  finishBtn: {
    backgroundColor: colors.brand, paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 24,
  },
  finishBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },

  skipNote: {
    color: colors.faint, fontSize: 12, textAlign: 'center',
    marginTop: 16, fontFamily: 'Inter_400Regular',
  },
});
