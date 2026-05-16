import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { colors } from '../theme';
import {
  getDeviceProfile, saveDeviceProfile,
  getServerConfig, getSyncStats, getSettings, saveSettings,
  clearAll,
} from '../services/storage';
import { unregisterBackgroundSync, registerBackgroundSync } from '../services/sync';
import { uploadDevicePhoto, registerDevice } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile]   = useState(null);
  const [server, setServer]     = useState(null);
  const [stats, setStats]       = useState({ total: 0, today: 0, errors: 0 });
  const [settings, setSettings] = useState(null);
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState('');

  async function load() {
    const [p, s, st, set] = await Promise.all([
      getDeviceProfile(), getServerConfig(), getSyncStats(), getSettings(),
    ]);
    setProfile(p);
    setServer(s);
    setStats(st);
    setSettings(set);
    setName(p?.name || '');
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function handleChangePhoto() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permissão negada'); return; }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || 'images',
        allowsEditing: true, aspect: [1,1], quality: 0.8,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const compressed = await ImageManipulator.manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 400 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      const updated = { ...profile, photoUri: compressed.uri };
      await saveDeviceProfile(updated);
      setProfile(updated);
      // Upload em background
      uploadDevicePhoto(profile.id, compressed.uri).catch(() => {});
    } catch (e) {
      Alert.alert('Erro', e.message);
    }
  }

  async function handleSaveName() {
    const updated = { ...profile, name: name.trim() || profile.name };
    await saveDeviceProfile(updated);
    setProfile(updated);
    setEditing(false);
    registerDevice({ id: updated.id, name: updated.name, phoneModel: updated.phoneModel }).catch(() => {});
  }

  async function toggleSetting(key, value) {
    const updated = { ...settings, [key]: value };
    await saveSettings(updated);
    setSettings(updated);
    if (key === 'autoSync') {
      if (value) await registerBackgroundSync();
      else       await unregisterBackgroundSync();
    }
  }

  function handleDisconnect() {
    Alert.alert(
      'Desconectar',
      'Isso apagará todas as configurações do app. Você precisará escanear o QR de novo. Continuar?',
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

  if (!profile || !settings) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}><ActivityIndicator color={colors.brand} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handleChangePhoto} style={styles.avatarWrap}>
            {profile.photoUri
              ? <Image source={{ uri: profile.photoUri }} style={styles.avatar} />
              : <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{profile.name?.charAt(0).toUpperCase() || '?'}</Text>
                </View>
            }
            <View style={styles.avatarBadge}><Text style={styles.avatarBadgeIcon}>📷</Text></View>
          </TouchableOpacity>

          {editing ? (
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={styles.editLabel}>NOME</Text>
              <View style={styles.editRow}>
                <TouchableOpacity style={styles.editCancel} onPress={() => { setEditing(false); setName(profile.name); }}>
                  <Text style={styles.editCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editSave} onPress={handleSaveName}>
                  <Text style={styles.editSaveText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileModel}>{profile.phoneModel}</Text>
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={styles.editLink}>Editar perfil</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <StatBig label="Total enviado" value={stats.total} />
          <View style={styles.statSep} />
          <StatBig label="Hoje"          value={stats.today} />
          <View style={styles.statSep} />
          <StatBig label="Erros"         value={stats.errors} color={stats.errors > 0 ? colors.error : null} />
        </View>

        {/* Settings */}
        <SectionTitle>Sincronização</SectionTitle>
        <View style={styles.card}>
          <SettingRow
            label="Sync automático"
            sub="Envia fotos novas a cada 15 min em background"
            value={settings.autoSync}
            onChange={(v) => toggleSetting('autoSync', v)}
          />
          <Divider />
          <SettingRow
            label="Somente Wi-Fi"
            sub="Não usa dados móveis pra subir arquivos"
            value={settings.wifiOnly}
            onChange={(v) => toggleSetting('wifiOnly', v)}
          />
          <Divider />
          <SettingRow
            label="Comprimir fotos grandes"
            sub="Reduz fotos > 5 MB para 2048px"
            value={settings.compressLarge}
            onChange={(v) => toggleSetting('compressLarge', v)}
          />
          <Divider />
          <SettingRow
            label="Pausar com bateria baixa"
            sub="Não sincroniza com menos de 20%"
            value={settings.pauseLowBattery}
            onChange={(v) => toggleSetting('pauseLowBattery', v)}
          />
          <Divider />
          <SettingRow
            label="Notificações"
            sub="Avisa quando upload termina"
            value={settings.notifications}
            onChange={(v) => toggleSetting('notifications', v)}
          />
        </View>

        {/* Server */}
        <SectionTitle>Servidor</SectionTitle>
        <View style={styles.card}>
          <InfoLine label="URL" value={server?.serverUrl || '—'} />
          <Divider />
          <InfoLine label="Status" value="✓ Conectado" valueColor={colors.active} />
          <Divider />
          <TouchableOpacity
            style={styles.serverAction}
            onPress={() => navigation.navigate('QRScanner', { mode: 'setup' })}
          >
            <Text style={styles.serverActionText}>Trocar servidor (escanear novo QR)</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Danger */}
        <SectionTitle>Conta</SectionTitle>
        <View style={styles.card}>
          <TouchableOpacity onPress={handleDisconnect} style={{ padding: 14 }}>
            <Text style={styles.dangerText}>Desconectar do servidor</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Contourline Mobile · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Subcomponents ──
function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function StatBig({ label, value, color }) {
  return (
    <View style={styles.statBig}>
      <Text style={[styles.statBigValue, color && { color }]}>{value.toLocaleString('pt-BR')}</Text>
      <Text style={styles.statBigLabel}>{label}</Text>
    </View>
  );
}

function SettingRow({ label, sub, value, onChange }) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sub && <Text style={styles.settingSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.brand }}
        thumbColor="#fff"
      />
    </View>
  );
}

function InfoLine({ label, value, valueColor }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLineLabel}>{label}</Text>
      <Text style={[styles.infoLineValue, valueColor && { color: valueColor }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 14 }} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { color: colors.text, fontSize: 24, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: colors.card, marginHorizontal: 16,
    padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, borderColor: colors.brand,
  },
  avatarPlaceholder: {
    backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 32, fontFamily: 'Inter_700Bold' },
  avatarBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.card,
  },
  avatarBadgeIcon: { fontSize: 13 },
  profileName: { color: colors.text, fontSize: 18, fontFamily: 'Inter_700Bold' },
  profileModel: { color: colors.muted, fontSize: 12, marginTop: 2, fontFamily: 'Inter_400Regular' },
  editLink: { color: colors.brand, fontSize: 12, marginTop: 8, fontFamily: 'Inter_600SemiBold' },

  editLabel: { color: colors.muted, fontSize: 10, letterSpacing: 0.5, fontFamily: 'Inter_700Bold' },
  editRow: { flexDirection: 'row', gap: 8 },
  editCancel: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
  },
  editCancelText: { color: colors.muted, fontFamily: 'Inter_600SemiBold' },
  editSave: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    backgroundColor: colors.brand, borderRadius: 8,
  },
  editSaveText: { color: '#fff', fontFamily: 'Inter_700Bold' },

  statsCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, marginHorizontal: 16, marginTop: 12,
    padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  statBig: { flex: 1, alignItems: 'center' },
  statBigValue: { color: colors.text, fontSize: 22, fontFamily: 'Inter_800ExtraBold' },
  statBigLabel: { color: colors.muted, fontSize: 11, marginTop: 2, fontFamily: 'Inter_500Medium' },
  statSep: { width: 1, height: 30, backgroundColor: colors.border },

  sectionTitle: {
    color: colors.muted, fontSize: 11, letterSpacing: 0.8,
    fontFamily: 'Inter_700Bold', textTransform: 'uppercase',
    paddingHorizontal: 20, marginTop: 24, marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card, marginHorizontal: 16, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
  },

  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14,
  },
  settingLabel: { color: colors.text, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  settingSub: { color: colors.muted, fontSize: 11, marginTop: 2, fontFamily: 'Inter_400Regular' },

  infoLine: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14,
  },
  infoLineLabel: { color: colors.muted, fontSize: 13, fontFamily: 'Inter_500Medium' },
  infoLineValue: { color: colors.text, fontSize: 13, fontFamily: 'Inter_600SemiBold', maxWidth: '60%' },

  serverAction: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14,
  },
  serverActionText: { color: colors.brand, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  chevron: { color: colors.muted, fontSize: 20 },

  dangerText: { color: colors.error, fontSize: 14, fontFamily: 'Inter_700Bold', textAlign: 'center' },

  version: { color: colors.faint, fontSize: 11, textAlign: 'center', marginTop: 24, fontFamily: 'Inter_400Regular' },
});
