import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getServerConfig, saveServerConfig, clearServerConfig,
} from '../services/storage';
import {
  testConnection, registerBackgroundSync, unregisterBackgroundSync,
} from '../services/sync';

export default function SettingsScreen({ navigation }) {
  const [serverUrl, setServerUrl]   = useState('');
  const [password, setPassword]     = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [bgSync, setBgSync]         = useState(true);
  const [testing, setTesting]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [status, setStatus]         = useState(''); // '' | 'ok' | 'error'
  const [statusMsg, setStatusMsg]   = useState('');

  useEffect(() => {
    (async () => {
      const config = await getServerConfig();
      if (config) {
        setServerUrl(config.serverUrl || '');
        setPassword(config.password || '');
        setDeviceName(config.deviceName || 'Celular');
        setBgSync(config.bgSync !== false);
      }
    })();
  }, []);

  async function handleTest() {
    setTesting(true);
    setStatus('');
    setStatusMsg('');
    try {
      const url = serverUrl.trim().replace(/\/$/, '');
      await testConnection(url, password.trim());
      setStatus('ok');
      setStatusMsg('Conexão bem-sucedida!');
    } catch (e) {
      setStatus('error');
      setStatusMsg(e.message || 'Falha na conexão');
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setStatus('');
    try {
      const url = serverUrl.trim().replace(/\/$/, '');
      const pwd = password.trim();
      if (!url || !pwd) {
        setStatus('error');
        setStatusMsg('URL e senha são obrigatórios');
        setSaving(false);
        return;
      }
      await testConnection(url, pwd);
      await saveServerConfig({
        serverUrl: url,
        password: pwd,
        deviceName: deviceName.trim() || 'Celular',
        bgSync,
      });
      if (bgSync) {
        await registerBackgroundSync();
      } else {
        await unregisterBackgroundSync();
      }
      setStatus('ok');
      setStatusMsg('Configurações salvas!');
    } catch (e) {
      setStatus('error');
      setStatusMsg(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  function handleDisconnect() {
    Alert.alert(
      'Desconectar',
      'Isso apagará todas as configurações do servidor. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            await unregisterBackgroundSync();
            await clearServerConfig();
            navigation.replace('Setup');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Server section */}
        <Text style={styles.sectionTitle}>Servidor</Text>
        <View style={styles.card}>
          <Text style={styles.label}>URL do servidor</Text>
          <TextInput
            style={styles.input}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="https://xxx.trycloudflare.com"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Senha do Contourline"
            placeholderTextColor="#64748b"
            secureTextEntry
          />

          <Text style={styles.label}>Nome do dispositivo</Text>
          <TextInput
            style={styles.input}
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="Meu Celular"
            placeholderTextColor="#64748b"
          />

          {/* Status message */}
          {!!statusMsg && (
            <Text style={[styles.statusMsg, status === 'ok' ? styles.statusOk : styles.statusErr]}>
              {status === 'ok' ? '✓ ' : '✕ '}{statusMsg}
            </Text>
          )}

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.testBtn, testing && styles.btnDisabled]}
              onPress={handleTest}
              disabled={testing}
            >
              {testing
                ? <ActivityIndicator color={C.brand} size="small" />
                : <Text style={styles.testBtnText}>Testar conexão</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Salvar</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Sync options */}
        <Text style={styles.sectionTitle}>Sincronização</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Sync automático</Text>
              <Text style={styles.switchDesc}>Envia fotos em segundo plano a cada 15 minutos</Text>
            </View>
            <Switch
              value={bgSync}
              onValueChange={setBgSync}
              trackColor={{ false: C.border, true: C.brand }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Danger zone */}
        <Text style={styles.sectionTitle}>Conta</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
            <Text style={styles.disconnectText}>Desconectar do servidor</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.version}>Contourline Mobile v1.0.0</Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const C = {
  bg:     '#0f172a',
  card:   '#1e293b',
  border: '#334155',
  brand:  '#6366f1',
  text:   '#f1f5f9',
  muted:  '#94a3b8',
  error:  '#f87171',
  green:  '#4ade80',
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1, padding: 16 },

  sectionTitle: {
    fontSize: 11, color: C.muted, textTransform: 'uppercase',
    letterSpacing: 0.5, marginTop: 24, marginBottom: 8, marginLeft: 4,
  },
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },

  label: { fontSize: 12, color: C.muted, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: '#0f172a', borderRadius: 10, padding: 13,
    color: C.text, fontSize: 15, borderWidth: 1, borderColor: C.border,
  },

  statusMsg: { fontSize: 13, marginTop: 10, textAlign: 'center' },
  statusOk:  { color: C.green },
  statusErr: { color: C.error },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  testBtn: {
    flex: 1, borderWidth: 1, borderColor: C.brand, borderRadius: 10,
    padding: 13, alignItems: 'center',
  },
  testBtnText: { color: C.brand, fontWeight: '600', fontSize: 14 },
  saveBtn: {
    flex: 1, backgroundColor: C.brand, borderRadius: 10,
    padding: 13, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchInfo: { flex: 1 },
  switchLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
  switchDesc:  { color: C.muted, fontSize: 12, marginTop: 2 },

  disconnectBtn: { padding: 4 },
  disconnectText: { color: C.error, fontSize: 15, fontWeight: '600', textAlign: 'center' },

  version: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 24 },
});
