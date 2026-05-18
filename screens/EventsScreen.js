import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme';
import { IC } from '../src/theme/icons';
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
  const [tab, setTab]             = useState('all'); // 'all' | 'active' | 'closed'

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

  const allSections = [
    { id: 'active',   title: 'ATIVOS AGORA', data: grouped.active,   color: colors.active },
    { id: 'upcoming', title: 'PRÓXIMOS',     data: grouped.upcoming, color: colors.warning },
    { id: 'past',     title: 'ENCERRADOS',   data: grouped.past,     color: colors.muted },
  ];

  // Filtra seções pelo tab
  const sections = (
    tab === 'all'    ? allSections :
    tab === 'active' ? allSections.filter((s) => s.id === 'active' || s.id === 'upcoming') :
    tab === 'closed' ? allSections.filter((s) => s.id === 'past') :
    allSections
  ).filter((s) => s.data.length > 0);

  const tabCounts = {
    all:    grouped.active.length + grouped.upcoming.length + grouped.past.length,
    active: grouped.active.length + grouped.upcoming.length,
    closed: grouped.past.length,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Projetos</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => navigation.navigate('QRScanner', { mode: 'event' })}
            activeOpacity={0.85}
          >
            <Image source={IC.qrCode} style={{ width: 20, height: 20, tintColor: colors.brand, resizeMode: 'contain' }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreateProject')}
            activeOpacity={0.85}
          >
            <Image source={IC.adicionar} style={{ width: 22, height: 22, tintColor: '#fff', resizeMode: 'contain' }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabsRow}>
        {[
          { id: 'all',    label: 'Todos' },
          { id: 'active', label: 'Ativos' },
          { id: 'closed', label: 'Concluídos' },
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabChip, tab === t.id && styles.tabChipActive]}
            onPress={() => setTab(t.id)}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
            <Text style={[styles.tabCount, tab === t.id && styles.tabCountActive]}>{tabCounts[t.id]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchWrap}>
        <Image source={IC.buscar} style={styles.searchIconImg} />
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
            <Image source={IC.localizacao} style={{ width: 11, height: 11, tintColor: colors.muted, resizeMode: 'contain' }} />
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
  headerActions: { flexDirection: 'row', gap: 8 },
  scanBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(31,139,255,0.10)',
    borderWidth: 1, borderColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  scanBtnIcon: { fontSize: 18 },
  addBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.brand, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },

  /* TABS */
  tabsRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12,
  },
  tabChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: 'rgba(15,23,42,0.7)',
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 11,
  },
  tabChipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  tabText: { color: colors.textMid, fontSize: 13, fontFamily: 'Inter_700Bold' },
  tabTextActive: { color: '#fff' },
  tabCount: {
    color: colors.muted, fontSize: 11, fontFamily: 'Inter_800ExtraBold',
    minWidth: 18, height: 20, borderRadius: 10,
    paddingHorizontal: 6, textAlign: 'center', lineHeight: 20,
    backgroundColor: 'rgba(148,163,184,0.20)',
  },
  tabCountActive: { color: '#fff', backgroundColor: 'rgba(255,255,255,0.30)' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 16,
    paddingHorizontal: 14, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { fontSize: 14 },
  searchIconImg: { width: 16, height: 16, tintColor: colors.muted, resizeMode: 'contain' },
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
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    marginHorizontal: 16, marginBottom: 10,
    padding: 12, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(31,139,255,0.18)',
  },
  thumb: {
    width: 76, height: 76, borderRadius: 12, overflow: 'hidden',
    backgroundColor: colors.cardElev || '#0a1322',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  rowName: { color: colors.text, fontSize: 15.5, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.3 },
  rowDate: { color: colors.muted, fontSize: 12, marginTop: 3, fontFamily: 'Inter_500Medium' },
  locRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  rowLoc:  { color: colors.faint, fontSize: 11.5, fontFamily: 'Inter_400Regular' },

  checkBadge: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.active,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.active, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 4,
  },
  checkBadgeText: { color: '#fff', fontSize: 17, fontFamily: 'Inter_800ExtraBold' },
  useBtn: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: 'rgba(31,139,255,0.10)', borderRadius: 10,
    borderWidth: 1, borderColor: colors.brand,
  },
  useBtnText: { color: colors.brand, fontSize: 13, fontFamily: 'Inter_700Bold' },

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
