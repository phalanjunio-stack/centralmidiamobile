import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MapPin, Calendar } from 'lucide-react-native';

import { colors } from '../theme';
import { listEvents } from '../services/api';
import { getServerConfig, getActiveEvent, setActiveEvent } from '../services/storage';

export default function EventsScreen({ navigation }) {
  const [events, setEvents]       = useState([]);
  const [active, setActive]       = useState(null);
  const [serverUrl, setServerUrl] = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery]         = useState('');

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

  useFocusEffect(useCallback(() => {
    setLoading(true); load();
  }, []));

  async function onRefresh() {
    setRefreshing(true);
    await load();
  }

  async function handleActivate(ev) {
    await setActiveEvent({
      id: ev.id, name: ev.name, folder: ev.folder,
      startDate: ev.startDate, endDate: ev.endDate,
      coverUrl: ev.coverUrl, location: ev.location,
      type: ev.type, owner: ev.owner,
    });
    setActive(ev);
  }

  const now = Date.now();
  const filtered = events.filter((e) =>
    !query || e.name?.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = {
    active:   [],
    upcoming: [],
    past:     [],
  };
  filtered.forEach((e) => {
    if (!e.startDate) { grouped.past.push(e); return; }
    const start = new Date(e.startDate).setHours(0,0,0,0);
    const end   = e.endDate ? new Date(e.endDate).setHours(23,59,59) : start;
    if (now >= start && now <= end) grouped.active.push(e);
    else if (now < start)            grouped.upcoming.push(e);
    else                             grouped.past.push(e);
  });

  const sections = [
    { title: 'ATIVOS AGORA', data: grouped.active,   color: colors.active },
    { title: 'PRÓXIMOS',     data: grouped.upcoming, color: colors.warning },
    { title: 'ENCERRADOS',   data: grouped.past,     color: colors.muted },
  ].filter((s) => s.data.length > 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => navigation.navigate('QRScanner', { mode: 'event' })}
        >
          <Text style={styles.scanBtnIcon}>⬛</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar atividade"
          placeholderTextColor={colors.faint}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>⚠ {error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); load(); }}>
            <Text style={styles.retryText}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nenhuma atividade cadastrada.</Text>
          <Text style={styles.emptySub}>Cadastre eventos, treinamentos ou visitas no painel do computador.</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.title}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
          renderItem={({ item: section }) => (
            <View>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionCount}>{section.data.length}</Text>
              </View>
              {section.data.map((ev) => (
                <EventRow
                  key={ev.id}
                  event={ev}
                  serverUrl={serverUrl}
                  isActive={active?.id === ev.id}
                  onPress={() => navigation.navigate('EventDetail', { eventId: ev.id })}
                  onActivate={() => handleActivate(ev)}
                />
              ))}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function EventRow({ event, serverUrl, isActive, onPress, onActivate }) {
  const coverUri = event.coverUrl
    ? (event.coverUrl.startsWith('http') ? event.coverUrl : `${serverUrl}${event.coverUrl}`)
    : null;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.thumb}>
        {coverUri
          ? <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} />
          : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.cardElev }]} />
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName} numberOfLines={1}>{event.name}</Text>
        <Text style={styles.rowDate}>{formatRange(event.startDate, event.endDate)}</Text>
        {event.location && (
          <View style={styles.locRow}>
            <MapPin size={11} color={colors.muted} strokeWidth={1.8} />
            <Text style={styles.rowLoc} numberOfLines={1}>{event.location}</Text>
          </View>
        )}
      </View>
      {isActive ? (
        <View style={styles.checkBadge}>
          <Text style={styles.checkBadgeText}>✓</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.useBtn} onPress={onActivate}>
          <Text style={styles.useBtnText}>Ativar</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

function formatRange(start, end) {
  if (!start) return '';
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  if (!e || s.toDateString() === e.toDateString()) return fmt(s);
  return `${fmt(s)} até ${fmt(e)}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    justifyContent: 'space-between',
  },
  title: { color: colors.text, fontSize: 24, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
  scanBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.brandFaded,
    borderWidth: 1, borderColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  scanBtnIcon: { fontSize: 18 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 16,
    paddingHorizontal: 14, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1, color: colors.text, padding: 12, fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: {
    color: colors.muted, fontSize: 11, letterSpacing: 0.8,
    fontFamily: 'Inter_700Bold', flex: 1,
  },
  sectionCount: { color: colors.faint, fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 8,
    padding: 10, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  thumb: {
    width: 60, height: 60, borderRadius: 8, overflow: 'hidden',
    backgroundColor: colors.cardElev,
  },
  rowName: { color: colors.text, fontSize: 14, fontFamily: 'Inter_700Bold' },
  rowDate: { color: colors.muted, fontSize: 11, marginTop: 2, fontFamily: 'Inter_500Medium' },
  locRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  rowLoc:  { color: colors.faint, fontSize: 11, fontFamily: 'Inter_400Regular' },

  checkBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.active,
    alignItems: 'center', justifyContent: 'center',
  },
  checkBadgeText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  useBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: colors.brandFaded, borderRadius: 8,
    borderWidth: 1, borderColor: colors.brand,
  },
  useBtnText: { color: colors.brand, fontSize: 12, fontFamily: 'Inter_700Bold' },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyText: { color: colors.text, fontSize: 15, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptySub:  { color: colors.muted, fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  retryBtn: {
    marginTop: 16, paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: colors.brand, borderRadius: 10,
  },
  retryText: { color: '#fff', fontFamily: 'Inter_700Bold' },
});
