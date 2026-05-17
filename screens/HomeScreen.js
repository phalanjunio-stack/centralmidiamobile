import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, RefreshControl, FlatList, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle as SvgCircle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import {
  Camera, Image as ImageIcon, Wifi, WifiOff, MapPin, CalendarDays,
  ChevronRight, CheckCircle2, Upload, Clock, AlertTriangle, Sparkles,
  ArrowUpRight,
} from 'lucide-react-native';

import { colors } from '../theme';
import LogoIcon from '../components/icons/LogoIcon';
import BellIcon from '../components/icons/BellIcon';
import {
  getSyncStats, getLastSync, getActiveEvent,
  getDeviceProfile, getServerConfig,
} from '../services/storage';
import { listEvents } from '../services/api';

const { width: SCREEN_W } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState({ total: 0, errors: 0 });
  const [lastSync, setLastSyncTs] = useState(0);
  const [event, setEvent] = useState(null);
  const [profile, setProfile] = useState(null);
  const [serverUrl, setServerUrl] = useState('');
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const [s, ts, ev, pr, cfg] = await Promise.all([
      getSyncStats(), getLastSync(), getActiveEvent(), getDeviceProfile(), getServerConfig(),
    ]);
    setStats(s);
    setLastSyncTs(ts);
    setEvent(ev);
    setProfile(pr);
    setServerUrl(cfg?.serverUrl || '');

    try {
      const list = await listEvents();
      setEvents(Array.isArray(list?.events) ? list.events : Array.isArray(list) ? list : []);
    } catch {}
  }

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function openEvent(ev) {
    if (ev?.id) navigation.navigate('EventDetail', { eventId: ev.id });
  }

  const featuredEvents = events.length ? events : (event ? [event] : []);
  const activeHero = event || featuredEvents[0];
  const connected = !!serverUrl;
  const synced    = stats?.synced   ?? stats?.total ?? 0;
  const pending   = stats?.pending  ?? 0;
  const errs      = stats?.errors   ?? 0;
  const total     = synced + (stats?.uploading ?? 0) + pending + errs;
  const pct       = total > 0 ? Math.round((synced / total) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* gradient de fundo sutil */}
      <View style={styles.bgWash} pointerEvents="none">
        <LinearGradient
          colors={['rgba(31,139,255,0.10)', 'rgba(31,139,255,0)']}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        {/* ── HEADER ───────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.brandWrap}>
            <LogoIcon size={34} color={colors.text} />
            <View>
              <Text style={styles.brandText}>contourline</Text>
              <Text style={styles.brandTag}>Backup · {connected ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn}>
              <BellIcon size={18} color={colors.text} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('ProfileTab')}>
              {profile?.photoUri ? (
                <Image source={{ uri: profile.photoUri }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{(profile?.name || '?').charAt(0).toUpperCase()}</Text>
                </View>
              )}
              {connected && <View style={styles.onlineDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── GREETING ─────────────────────────────────────────── */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingHi}>Olá, {(profile?.name || 'fotógrafo').split(' ')[0]}</Text>
          <Text style={styles.greetingSub}>
            {connected
              ? `${pct}% sincronizado · pronto pra capturar`
              : 'Modo offline · suas capturas vão sincronizar quando conectar'}
          </Text>
        </View>

        {/* ── HERO PROJETO ATIVO ───────────────────────────────── */}
        <HeroProject event={activeHero} serverUrl={serverUrl} isActive={!!event} onPress={() => openEvent(activeHero)} />

        {/* ── STATS TRIO ───────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatChip
            icon={<CheckCircle2 size={16} color="#34D399" strokeWidth={2.3} />}
            value={synced}
            label="Sincronizadas"
            tint="#34D399"
          />
          <StatChip
            icon={<Clock size={16} color="#FBBF24" strokeWidth={2.3} />}
            value={pending}
            label="Pendentes"
            tint="#FBBF24"
          />
          <StatChip
            icon={<AlertTriangle size={16} color="#F87171" strokeWidth={2.3} />}
            value={errs}
            label="Com erro"
            tint="#F87171"
          />
        </View>

        {/* ── SERVIDOR STATUS ─────────────────────────────────── */}
        <ServerCard
          connected={connected}
          serverUrl={serverUrl}
          errors={errs}
          onPress={() => navigation.navigate('Uploads')}
        />

        {/* ── AÇÕES RÁPIDAS ────────────────────────────────────── */}
        <SectionHeader title="Ações rápidas" actionLabel="Ver todas" onAction={() => navigation.navigate('QuickActions')} />
        <View style={styles.actionsRow}>
          <PremiumAction
            gradient={['#1F4DCC', '#0B2A8A']}
            Icon={Camera}
            title="Câmera"
            sub="Foto / vídeo"
            onPress={() => navigation.navigate('Camera', { initialMode: 'photo' })}
            featured
          />
          <PremiumAction
            gradient={['#0E9F88', '#065F5A']}
            Icon={ImageIcon}
            title="Galeria"
            sub="Selecionar"
            onPress={() => navigation.navigate('Gallery')}
          />
        </View>

        {/* ── EVENTOS ──────────────────────────────────────────── */}
        {featuredEvents.length > 0 && (
          <>
            <SectionHeader title="Eventos em destaque" actionLabel="Ver todos" onAction={() => navigation.navigate('EventsTab')} />
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={featuredEvents.slice(0, 6)}
              keyExtractor={(item, index) => item.id || String(index)}
              contentContainerStyle={styles.eventsList}
              renderItem={({ item }) => (
                <EventCard
                  event={item}
                  serverUrl={serverUrl}
                  onPress={() => openEvent(item)}
                  isActive={event?.id === item.id}
                />
              )}
            />
          </>
        )}

        {/* ── SINCRONIZAÇÃO ────────────────────────────────────── */}
        <SectionHeader title="Sincronização" />
        <SyncCard stats={stats} pct={pct} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ────────────────────────────────────────────────────────────── */
/* COMPONENTS                                                    */
/* ────────────────────────────────────────────────────────────── */

function HeroProject({ event, serverUrl, isActive, onPress }) {
  const coverUri = getCoverUri(event, serverUrl);
  return (
    <TouchableOpacity style={styles.heroWrap} activeOpacity={0.9} onPress={onPress}>
      {/* cover ou placeholder */}
      <View style={styles.heroCover}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={['#1E3A8A', '#0F1E54', '#040A1F']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {/* glow azul cantos */}
        <LinearGradient
          colors={['rgba(31,139,255,0.45)', 'rgba(31,139,255,0)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* overlay escuro pra texto legível */}
        <LinearGradient
          colors={['rgba(4,8,18,0)', 'rgba(4,8,18,0.55)', 'rgba(4,8,18,0.92)']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      {/* badge superior */}
      <View style={styles.heroBadgeRow}>
        {isActive ? (
          <View style={styles.activePill}>
            <View style={styles.activePillDot} />
            <Text style={styles.activePillText}>ATIVO AGORA</Text>
          </View>
        ) : (
          <View style={styles.idlePill}>
            <Sparkles size={11} color="#A8C0E0" strokeWidth={2.4} />
            <Text style={styles.idlePillText}>NENHUMA ATIVIDADE</Text>
          </View>
        )}
        <View style={styles.heroArrow}>
          <ArrowUpRight size={16} color="#fff" strokeWidth={2.4} />
        </View>
      </View>

      {/* info */}
      <View style={styles.heroInfo}>
        <Text style={styles.heroTitle} numberOfLines={2}>
          {event?.name || 'Crie ou escolha uma atividade'}
        </Text>
        <View style={styles.heroMetaRow}>
          <MetaChip Icon={CalendarDays} text={formatRange(event?.startDate, event?.endDate) || '—'} />
          <MetaChip Icon={MapPin} text={event?.location || 'Sem local'} />
        </View>
      </View>

      {/* borda glass */}
      <View style={styles.heroGlassEdge} pointerEvents="none" />
    </TouchableOpacity>
  );
}

function MetaChip({ Icon, text }) {
  return (
    <View style={styles.metaChip}>
      <Icon size={11} color="#CBD5E1" strokeWidth={2} />
      <Text style={styles.metaChipText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function StatChip({ icon, value, label, tint }) {
  return (
    <View style={styles.statChip}>
      <View style={[styles.statTopBar, { backgroundColor: tint, opacity: 0.7 }]} />
      <View style={styles.statHeader}>
        {icon}
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{String(value).padStart(2, '0')}</Text>
    </View>
  );
}

function ServerCard({ connected, serverUrl, errors, onPress }) {
  const Icon = connected ? Wifi : WifiOff;
  const tint = connected ? '#34D399' : '#94A3B8';
  return (
    <TouchableOpacity style={styles.serverCard} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.serverIcon, { backgroundColor: `${tint}1F` }]}>
        <Icon size={20} color={tint} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.serverTitle}>
          {connected ? 'Servidor conectado' : 'Servidor desconectado'}
        </Text>
        <Text style={styles.serverSub} numberOfLines={1}>
          {errors > 0 ? `${errors} erro(s) para revisar` : (connected ? 'Tudo sincronizado' : 'Toque pra configurar')}
        </Text>
      </View>
      <ChevronRight size={18} color="#64748B" strokeWidth={2} />
    </TouchableOpacity>
  );
}

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function PremiumAction({ gradient, Icon, title, sub, onPress, featured }) {
  return (
    <TouchableOpacity
      style={[styles.action, featured && styles.actionFeatured]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* shine layer */}
      <LinearGradient
        colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { height: '50%' }]}
        pointerEvents="none"
      />
      <View style={styles.actionIconWrap}>
        <Icon size={26} color="#fff" strokeWidth={2.1} />
      </View>
      <View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub}>{sub}</Text>
      </View>
      <View style={styles.actionArrow}>
        <ArrowUpRight size={14} color="rgba(255,255,255,0.85)" strokeWidth={2.4} />
      </View>
    </TouchableOpacity>
  );
}

function EventCard({ event, serverUrl, onPress, isActive }) {
  const coverUri = getCoverUri(event, serverUrl);
  return (
    <TouchableOpacity style={styles.eventCard} activeOpacity={0.88} onPress={onPress}>
      <View style={styles.eventCover}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={['#1E3A8A', '#0B1B4F']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(4,8,18,0.85)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {isActive ? (
          <View style={styles.eventActiveBadge}>
            <View style={styles.activePillDot} />
            <Text style={styles.eventActiveText}>ATIVO</Text>
          </View>
        ) : null}
        <Text style={styles.eventDateOverlay}>{formatRange(event?.startDate, event?.endDate)}</Text>
      </View>
      <Text style={styles.eventName} numberOfLines={2}>{event?.name || 'Atividade'}</Text>
      {event?.location || event?.locationCity ? (
        <View style={styles.eventMeta}>
          <MapPin size={11} color="#94A3B8" strokeWidth={2} />
          <Text style={styles.eventMetaText} numberOfLines={1}>
            {event.location || event.locationCity}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function SyncCard({ stats, pct }) {
  const synced   = stats?.synced   ?? stats?.total ?? 0;
  const uploading= stats?.uploading ?? 0;
  const pending  = stats?.pending  ?? 0;
  const errors   = stats?.errors   ?? 0;

  const R = 44;
  const CIRC = 2 * Math.PI * R;
  const dash = CIRC * (pct / 100);

  return (
    <View style={styles.syncCard}>
      <View style={styles.syncRingWrap}>
        <Svg width={120} height={120} viewBox="0 0 120 120">
          <Defs>
            <SvgGrad id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#5AAEFF" />
              <Stop offset="1" stopColor="#1F8BFF" />
            </SvgGrad>
          </Defs>
          <SvgCircle cx={60} cy={60} r={R} stroke="rgba(255,255,255,0.06)" strokeWidth={8} fill="none" />
          <SvgCircle
            cx={60} cy={60} r={R}
            stroke="url(#ringGrad)"
            strokeWidth={8}
            fill="none"
            strokeDasharray={`${dash} ${CIRC}`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
        </Svg>
        <View style={styles.syncRingCenter}>
          <Text style={styles.syncPct}>{pct}%</Text>
          <Text style={styles.syncPctLabel}>Enviado</Text>
        </View>
      </View>

      <View style={styles.syncStats}>
        <SyncRow icon={<CheckCircle2 size={16} color="#34D399" strokeWidth={2.2} />} label="Enviados"  value={synced}    color="#34D399" />
        <SyncRow icon={<Upload       size={16} color="#60A5FA" strokeWidth={2.2} />} label="Enviando"  value={uploading} color="#60A5FA" />
        <SyncRow icon={<Clock        size={16} color="#FBBF24" strokeWidth={2.2} />} label="Pendentes" value={pending}   color="#FBBF24" />
        <SyncRow icon={<AlertTriangle size={16} color="#F87171" strokeWidth={2.2} />} label="Com erro"  value={errors}    color="#F87171" />
      </View>
    </View>
  );
}

function SyncRow({ icon, label, value, color }) {
  return (
    <View style={styles.syncRow}>
      <View style={styles.syncRowIcon}>{icon}</View>
      <Text style={styles.syncRowLabel}>{label}</Text>
      <Text style={[styles.syncRowValue, { color }]}>{String(value).padStart(2, '0')}</Text>
    </View>
  );
}

function getCoverUri(event, serverUrl) {
  if (!event?.coverUrl) return null;
  return event.coverUrl.startsWith('http') ? event.coverUrl : `${serverUrl}${event.coverUrl}`;
}

function formatRange(start, end) {
  if (!start) return '';
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (!e || s.toDateString() === e.toDateString()) return fmt(s);
  return `${fmt(s)} – ${fmt(e)}`;
}

/* ────────────────────────────────────────────────────────────── */
/* STYLES                                                        */
/* ────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  bgWash: { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },
  content: { paddingBottom: 130 },

  /* HEADER */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8,
  },
  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandText: { color: colors.text, fontSize: 19, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.3, lineHeight: 22 },
  brandTag: { color: '#64748B', fontSize: 10.5, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.5, marginTop: 1, textTransform: 'uppercase' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 10,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#F87171', borderWidth: 1.5, borderColor: colors.bg,
  },
  avatarBtn: { position: 'relative' },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { backgroundColor: '#1E3A8A', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 15, fontFamily: 'Inter_800ExtraBold' },
  onlineDot: {
    position: 'absolute', right: -1, bottom: -1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#10B981', borderWidth: 2, borderColor: colors.bg,
  },

  /* GREETING */
  greetingBlock: { paddingHorizontal: 18, marginTop: 6, marginBottom: 18 },
  greetingHi: { color: '#fff', fontSize: 26, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
  greetingSub: { color: '#94A3B8', fontSize: 13, marginTop: 4, fontFamily: 'Inter_500Medium' },

  /* HERO */
  heroWrap: {
    marginHorizontal: 16,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.card,
    minHeight: 190,
    position: 'relative',
  },
  heroCover: { ...StyleSheet.absoluteFillObject },
  heroGlassEdge: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  heroBadgeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 16, paddingHorizontal: 16,
  },
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(16,185,129,0.18)',
    borderColor: 'rgba(52,211,153,0.45)', borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  activePillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399' },
  activePillText: { color: '#34D399', fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1 },
  idlePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.10)', borderWidth: 1,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
  },
  idlePillText: { color: '#CBD5E1', fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1 },
  heroArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.18)', borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  heroInfo: { padding: 16, paddingTop: 80 },
  heroTitle: { color: '#fff', fontSize: 22, lineHeight: 26, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.4 },
  heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.10)', borderWidth: 1,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8,
  },
  metaChipText: { color: '#CBD5E1', fontSize: 11.5, fontFamily: 'Inter_600SemiBold' },

  /* STATS */
  statsRow: {
    flexDirection: 'row', gap: 10,
    marginHorizontal: 16, marginTop: 14,
  },
  statChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
    borderRadius: 14, padding: 12, paddingTop: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  statTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
  },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  statLabel: { color: '#94A3B8', fontSize: 10.5, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  statValue: { color: '#fff', fontSize: 24, fontFamily: 'Inter_800ExtraBold', fontVariant: ['tabular-nums'], letterSpacing: -0.8 },

  /* SERVER */
  serverCard: {
    marginHorizontal: 16, marginTop: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
  },
  serverIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  serverTitle: { color: '#F1F5F9', fontSize: 14, fontFamily: 'Inter_700Bold' },
  serverSub: { color: '#94A3B8', fontSize: 11.5, marginTop: 2, fontFamily: 'Inter_500Medium' },

  /* SECTION HEADER */
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, marginTop: 26, marginBottom: 12,
  },
  sectionTitle: { color: '#F1F5F9', fontSize: 17, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.3 },
  sectionAction: { color: '#5AAEFF', fontSize: 12.5, fontFamily: 'Inter_700Bold' },

  /* ACTIONS */
  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  action: {
    flex: 1, minHeight: 124, borderRadius: 18,
    padding: 14, justifyContent: 'space-between',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden', position: 'relative',
  },
  actionFeatured: { flex: 1.15 },
  actionIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.22)', borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  actionTitle: { color: '#fff', fontSize: 16, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.3 },
  actionSub: { color: 'rgba(255,255,255,0.78)', fontSize: 11.5, marginTop: 2, fontFamily: 'Inter_600SemiBold' },
  actionArrow: {
    position: 'absolute', top: 14, right: 14,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* EVENTS */
  eventsList: { paddingHorizontal: 16, gap: 10 },
  eventCard: {
    width: 156,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
    padding: 8,
  },
  eventCover: {
    width: '100%', aspectRatio: 1.05, borderRadius: 12,
    overflow: 'hidden', backgroundColor: colors.cardElev,
    position: 'relative',
  },
  eventActiveBadge: {
    position: 'absolute', left: 8, top: 8,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(16,185,129,0.85)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7,
  },
  eventActiveText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.8 },
  eventDateOverlay: {
    position: 'absolute', right: 8, bottom: 8,
    color: '#fff', fontSize: 10.5, fontFamily: 'Inter_700Bold',
  },
  eventName: { color: '#F1F5F9', fontSize: 13.5, lineHeight: 17, marginTop: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.2 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  eventMetaText: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter_500Medium', flex: 1 },

  /* SYNC CARD */
  syncCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  syncRingWrap: {
    width: 120, height: 120,
    alignItems: 'center', justifyContent: 'center',
  },
  syncRingCenter: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  syncPct: { color: '#fff', fontSize: 22, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.6 },
  syncPctLabel: { color: '#94A3B8', fontSize: 10.5, fontFamily: 'Inter_600SemiBold', marginTop: 1, letterSpacing: 0.3 },
  syncStats: { flex: 1 },
  syncRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  syncRowIcon: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 9,
  },
  syncRowLabel: { flex: 1, color: '#CBD5E1', fontSize: 12.5, fontFamily: 'Inter_600SemiBold' },
  syncRowValue: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', fontVariant: ['tabular-nums'] },
});
