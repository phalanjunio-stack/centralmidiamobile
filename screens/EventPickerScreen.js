// Tela de seleção do evento ativo — aparece após o ProfilePicker
// Permite escolher evento da lista OU escanear QR específico do evento
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme';
import { IC } from '../src/theme/icons';
import { listEvents } from '../services/api';
import {
  getServerConfig, getActiveEvent, setActiveEvent,
} from '../services/storage';

export default function EventPickerScreen({ navigation }) {
  const [events, setEvents]       = useState([]);
  const [active, setActive]       = useState(null);
  const [serverUrl, setServerUrl] = useState('');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState('');

  async function load() {
    setError('');
    try {
      const [cfg, list, act] = await Promise.all([
        getServerConfig(), listEvents(), getActiveEvent(),
      ]);
      setServerUrl(cfg?.serverUrl || '');
      const arr = Array.isArray(list?.events) ? list.events : Array.isArray(list) ? list : [];
      setEvents(arr);
      setActive(act);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  async function handleSelect(ev) {
    await setActiveEvent({
      id: ev.id, name: ev.name, folder: ev.folder,
      startDate: ev.startDate, endDate: ev.endDate,
      coverUrl: ev.coverUrl, location: ev.location,
      type: ev.type, owner: ev.owner,
    });
    // Vai direto pra câmera
    navigation.reset({ index: 0, routes: [{ name: 'Camera' }] });
  }

  function handleQRScan() {
    navigation.navigate('QRScanner', { mode: 'event' });
  }

  function handleSkip() {
    // Banco geral — sem evento ativo
    setActiveEvent(null);
    navigation.reset({ index: 0, routes: [{ name: 'Camera' }] });
  }

  const now = Date.now();
  const grouped = { active: [], upcoming: [], past: [] };
  events.forEach((e) => {
    if (!e.startDate) { grouped.past.push(e); return; }
    const start = new Date(e.startDate).setHours(0, 0, 0, 0);
    const end   = e.endDate ? new Date(e.endDate).setHours(23, 59, 59) : start;
    if (now >= start && now <= end) grouped.active.push(e);
    else if (now < start)            grouped.upcoming.push(e);
    else                             grouped.past.push(e);
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header com voltar */}
        <View style={styles.header}>
          {navigation.canGoBack() && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.8}
              hitSlop={10}
            >
              <Image source={IC.chevronDir} style={{ width: 18, height: 18, tintColor: '#fff', transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Qual atividade?</Text>
            <Text style={styles.subtitle}>Eventos, treinamentos e visitas</Text>
          </View>
          <TouchableOpacity onPress={load} style={styles.refreshBtn} activeOpacity={0.8}>
            <Image source={IC.sincronizando} style={{ width: 18, height: 18, tintColor: '#94a3b8' }} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#3b82f6" />}
        >
          {/* QR Card destaque */}
          <TouchableOpacity style={styles.qrCard} onPress={handleQRScan} activeOpacity={0.85}>
            <View style={styles.qrIconBox}>
              <Image source={IC.qrCode} style={{ width: 28, height: 28, tintColor: '#fff' }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.qrTitle}>Escanear QR da atividade</Text>
              <Text style={styles.qrSub}>Configura tudo de uma vez no local</Text>
            </View>
            <Image source={IC.chevronDir} style={{ width: 18, height: 18, tintColor: 'rgba(255,255,255,0.5)' }} />
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loading}><ActivityIndicator color="#3b82f6" /></View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
              <TouchableOpacity onPress={() => { setLoading(true); load(); }} style={styles.retryBtn}>
                <Text style={styles.retryText}>Tentar de novo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Eventos ativos */}
              {grouped.active.length > 0 && (
                <Section title="ATIVOS AGORA" color="#10b981" count={grouped.active.length}>
                  {grouped.active.map((ev) => (
                    <EventRow
                      key={ev.id}
                      event={ev}
                      serverUrl={serverUrl}
                      isActive={active?.id === ev.id}
                      onPress={() => handleSelect(ev)}
                    />
                  ))}
                </Section>
              )}

              {/* Eventos próximos */}
              {grouped.upcoming.length > 0 && (
                <Section title="PRÓXIMOS" color="#f59e0b" count={grouped.upcoming.length}>
                  {grouped.upcoming.map((ev) => (
                    <EventRow
                      key={ev.id}
                      event={ev}
                      serverUrl={serverUrl}
                      isActive={active?.id === ev.id}
                      onPress={() => handleSelect(ev)}
                    />
                  ))}
                </Section>
              )}

              {/* Sem eventos */}
              {grouped.active.length === 0 && grouped.upcoming.length === 0 && (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>Nenhuma atividade disponível</Text>
                  <Text style={styles.emptySub}>Cadastre eventos, treinamentos ou visitas no painel do computador</Text>
                </View>
              )}

              {/* Skip / Banco geral */}
              <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                <Text style={styles.skipText}>Pular — mandar pro Banco geral</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Sub-components ──
function Section({ title, color, count, children }) {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: color }]} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{count}</Text>
      </View>
      {children}
    </View>
  );
}

function EventRow({ event, serverUrl, isActive, onPress }) {
  const coverUri = event.coverUrl
    ? (event.coverUrl.startsWith('http') ? event.coverUrl : `${serverUrl}${event.coverUrl}`)
    : null;
  const range = formatRange(event.startDate, event.endDate);

  return (
    <TouchableOpacity style={[styles.row, isActive && styles.rowActive]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cover}>
        {coverUri
          ? <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} />
          : <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a2440' }]} />
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName} numberOfLines={1}>{event.name}</Text>
        <View style={styles.metaRow}>
          <Image source={IC.calendario} style={{ width: 11, height: 11, tintColor: '#94a3b8' }} />
          <Text style={styles.rowMeta}>{range}</Text>
        </View>
        {event.location && (
          <View style={styles.metaRow}>
            <Image source={IC.localizacao} style={{ width: 11, height: 11, tintColor: '#94a3b8' }} />
            <Text style={styles.rowMeta} numberOfLines={1}>{event.location}</Text>
          </View>
        )}
      </View>
      {isActive
        ? <View style={styles.checkRound}><Image source={IC.check} style={{ width: 14, height: 14, tintColor: '#fff' }} /></View>
        : <Image source={IC.chevronDir} style={{ width: 14, height: 14, tintColor: '#94a3b8' }} />
      }
    </TouchableOpacity>
  );
}

function formatRange(start, end) {
  if (!start) return '';
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  if (!e || s.toDateString() === e.toDateString()) return fmt(s);
  return `${fmt(s)} - ${fmt(e)}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#03101F' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(8,14,26,0.85)',
    borderWidth: 1, borderColor: 'rgba(31,139,255,0.32)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    color: '#fff', fontSize: 26, fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#94a3b8', fontSize: 13, marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },

  qrCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 20, marginBottom: 24,
    padding: 18, borderRadius: 18,
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16,
    elevation: 6,
  },
  qrIconBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  qrTitle: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  qrSub:   { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 3, fontFamily: 'Inter_400Regular' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: {
    color: '#94a3b8', fontSize: 11, letterSpacing: 0.8,
    fontFamily: 'Inter_700Bold', flex: 1,
  },
  sectionCount: { color: '#64748b', fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginBottom: 8,
    padding: 10, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  rowActive: {
    backgroundColor: 'rgba(59,130,246,0.10)',
    borderColor: 'rgba(59,130,246,0.6)',
  },
  cover: {
    width: 56, height: 56, borderRadius: 10, overflow: 'hidden',
    backgroundColor: '#1a2440',
  },
  rowName: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rowMeta: { color: '#94a3b8', fontSize: 11, fontFamily: 'Inter_500Medium' },

  checkRound: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#3b82f6',
    alignItems: 'center', justifyContent: 'center',
  },

  loading: { padding: 32, alignItems: 'center' },
  errorBox: { padding: 32, alignItems: 'center', gap: 12 },
  errorText: { color: '#ef4444', fontSize: 14, fontFamily: 'Inter_500Medium' },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#3b82f6',
  },
  retryText: { color: '#fff', fontFamily: 'Inter_700Bold' },

  empty: { padding: 32, alignItems: 'center', gap: 4 },
  emptyText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  emptySub:  { color: '#94a3b8', fontSize: 12, fontFamily: 'Inter_400Regular' },

  skipBtn: {
    alignSelf: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    marginTop: 16,
  },
  skipText: { color: '#94a3b8', fontSize: 13, fontFamily: 'Inter_500Medium' },
});
