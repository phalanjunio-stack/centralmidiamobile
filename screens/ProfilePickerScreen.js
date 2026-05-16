// Tela exibida após pareamento bem-sucedido.
// Mostra lista de videomakers pré-cadastrados pra usuário selecionar o seu perfil.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, UserPlus, ArrowLeft } from 'lucide-react-native';

import { colors } from '../theme';
import { claimDeviceProfile } from '../services/api';
import {
  getDeviceId, getServerConfig,
  saveDeviceProfile,
} from '../services/storage';
import { registerBackgroundSync } from '../services/sync';

export default function ProfilePickerScreen({ navigation, route }) {
  const initialUsers = route.params?.users || [];

  const [selected, setSelected] = useState(null);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName]   = useState('');
  const [newEmail, setNewEmail] = useState('');

  async function handleConfirm() {
    if (!selected && !showNewForm) {
      setError('Escolha seu perfil ou cadastre um novo');
      return;
    }
    if (showNewForm && !newName.trim()) {
      setError('Digite seu nome');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const deviceId = await getDeviceId();
      if (!deviceId) throw new Error('Device não está pareado');

      const payload = showNewForm
        ? { newUser: { name: newName.trim(), email: newEmail.trim() } }
        : { userId: selected };

      const result = await claimDeviceProfile(deviceId, payload.userId, payload.newUser);

      // Salva perfil local
      const profile = result.device || {};
      await saveDeviceProfile({
        id:         deviceId,
        name:       profile.name || newName.trim() || 'Celular',
        userId:     profile.userId || selected,
        phoneModel: profile.phoneModel || Platform.OS,
        createdAt:  new Date().toISOString(),
      });

      // Atualiza deviceName no config
      const config = await getServerConfig();
      if (config) {
        const { saveServerConfig } = await import('../services/storage');
        await saveServerConfig({ ...config, deviceName: profile.name || newName.trim() });
      }

      await registerBackgroundSync();

      // Vai pra seleção de evento → Câmera
      navigation.reset({ index: 0, routes: [{ name: 'EventPicker' }] });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#03101F' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={20} color="#94a3b8" strokeWidth={1.8} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.intro}>
              <View style={styles.successBadge}>
                <Check size={22} color="#10b981" strokeWidth={2.5} />
              </View>
              <Text style={styles.title}>Celular conectado!</Text>
              <Text style={styles.subtitle}>Agora escolha quem é o videomaker desse celular.</Text>
            </View>

            {/* Lista de perfis pré-cadastrados */}
            {!showNewForm && (
              <View style={styles.list}>
                <Text style={styles.sectionLabel}>VIDEOMAKERS CADASTRADOS</Text>

                {initialUsers.map((u) => {
                  const active = selected === u.id;
                  const initial = (u.name || '?').charAt(0).toUpperCase();
                  return (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.card, active && styles.cardActive]}
                      onPress={() => setSelected(u.id)}
                      activeOpacity={0.85}
                    >
                      {u.photoUrl
                        ? <Image source={{ uri: u.photoUrl }} style={styles.avatar} />
                        : <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarInitial}>{initial}</Text>
                          </View>
                      }
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardName}>{u.name}</Text>
                        {u.email
                          ? <Text style={styles.cardEmail}>{u.email}</Text>
                          : <Text style={styles.cardRole}>{u.role || 'videomaker'}</Text>
                        }
                      </View>
                      {active && (
                        <View style={styles.checkRound}>
                          <Check size={16} color="#fff" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Novo videomaker */}
                <TouchableOpacity
                  style={styles.cardNew}
                  onPress={() => { setShowNewForm(true); setSelected(null); }}
                  activeOpacity={0.85}
                >
                  <View style={styles.avatarPlus}>
                    <UserPlus size={20} color="#3b82f6" strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardNewTitle}>Sou novo aqui</Text>
                    <Text style={styles.cardNewSub}>Cadastrar meu perfil</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Form de cadastro */}
            {showNewForm && (
              <View style={styles.list}>
                <Text style={styles.sectionLabel}>CADASTRO</Text>
                <View style={styles.formCard}>
                  <Text style={styles.label}>SEU NOME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Carlos Silva"
                    placeholderTextColor="#64748b"
                    value={newName} onChangeText={setNewName}
                    autoCapitalize="words"
                  />
                  <Text style={[styles.label, { marginTop: 16 }]}>EMAIL (opcional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor="#64748b"
                    value={newEmail} onChangeText={setNewEmail}
                    keyboardType="email-address" autoCapitalize="none"
                  />
                  <Text style={styles.formNote}>
                    ⚠ O admin precisa aprovar seu cadastro no painel
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => { setShowNewForm(false); setError(''); }}
                  style={{ alignSelf: 'center', padding: 12 }}
                >
                  <Text style={styles.linkText}>← Voltar pra lista</Text>
                </TouchableOpacity>
              </View>
            )}

            {!!error && <Text style={styles.errorMsg}>{error}</Text>}

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (busy || (!selected && !showNewForm) || (showNewForm && !newName.trim())) && { opacity: 0.5 },
              ]}
              onPress={handleConfirm}
              disabled={busy}
            >
              {busy
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.confirmText}>Confirmar e entrar</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },

  intro: { alignItems: 'center', marginTop: 16, marginBottom: 28 },
  successBadge: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    color: '#fff', fontSize: 24, fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -0.5, marginTop: 16,
  },
  subtitle: {
    color: '#94a3b8', fontSize: 14, marginTop: 6, textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },

  list: { gap: 10 },
  sectionLabel: {
    color: '#94a3b8', fontSize: 11, letterSpacing: 0.8,
    fontFamily: 'Inter_700Bold', marginLeft: 4, marginBottom: 4,
  },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14,
  },
  cardActive: {
    backgroundColor: 'rgba(59,130,246,0.10)',
    borderColor: 'rgba(59,130,246,0.6)',
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarPlaceholder: {
    backgroundColor: '#1e3a8a',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  cardName:  { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  cardEmail: { color: '#94a3b8', fontSize: 12, marginTop: 2, fontFamily: 'Inter_400Regular' },
  cardRole:  { color: '#64748b', fontSize: 12, marginTop: 2, fontFamily: 'Inter_500Medium' },
  checkRound: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#3b82f6',
    alignItems: 'center', justifyContent: 'center',
  },

  cardNew: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(59,130,246,0.06)',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.4)',
    borderStyle: 'dashed',
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14,
    marginTop: 8,
  },
  avatarPlus: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(59,130,246,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardNewTitle: { color: '#3b82f6', fontSize: 14, fontFamily: 'Inter_700Bold' },
  cardNewSub:   { color: '#94a3b8', fontSize: 12, marginTop: 2, fontFamily: 'Inter_400Regular' },

  formCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 16, borderRadius: 14,
  },
  label: {
    color: '#94a3b8', fontSize: 11, letterSpacing: 0.6,
    fontFamily: 'Inter_700Bold', marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10,
    padding: 14, color: '#fff', fontSize: 14, fontFamily: 'Inter_500Medium',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  formNote: {
    color: '#94a3b8', fontSize: 11, marginTop: 14, fontFamily: 'Inter_400Regular',
  },
  linkText: { color: '#3b82f6', fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  errorMsg: {
    color: '#ef4444', fontSize: 13, textAlign: 'center',
    fontFamily: 'Inter_500Medium', marginTop: 16,
  },
  confirmBtn: {
    backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 24,
  },
  confirmText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
