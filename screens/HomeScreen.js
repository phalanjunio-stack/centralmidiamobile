import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, RefreshControl, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Camera, Image as ImageIcon, Wifi, MapPin, CalendarDays,
  ChevronRight, GraduationCap, MapPinned,
} from 'lucide-react-native';

import { colors } from '../theme';
import LogoIcon from '../components/icons/LogoIcon';
import BellIcon from '../components/icons/BellIcon';
import {
  getSyncStats, getLastSync, getActiveEvent,
  getDeviceProfile, getServerConfig,
} from '../services/storage';
import { listEvents } from '../services/api';

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        <View style={styles.header}>
          <View style={styles.brandWrap}>
            <LogoIcon size={38} color={colors.text} />
            <Text style={styles.brandText}>contourline</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.bellBtn}>
              <BellIcon size={19} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('ProfileTab')}>
              {profile?.photoUri ? (
                <Image source={{ uri: profile.photoUri }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{(profile?.name || '?').charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.onlineDot} />
            </TouchableOpacity>
          </View>
        </View>

        <HomeHero event={activeHero} serverUrl={serverUrl} isActive={!!event} onPress={() => openEvent(activeHero)} />

        <TouchableOpacity style={styles.serverCard} activeOpacity={0.85} onPress={() => navigation.navigate('Uploads')}>
          <View style={styles.serverIcon}>
            <Wifi size={24} color={colors.active} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.serverTitle}>{serverUrl ? 'Servidor conectado' : 'Servidor desconectado'}</Text>
            <Text style={styles.serverSub}>{stats.errors ? `${stats.errors} erro(s) para revisar` : 'Tudo sincronizado'}</Text>
          </View>
          <ChevronRight size={22} color={colors.textMid} strokeWidth={1.8} />
        </TouchableOpacity>

        <SectionHeader title="Ações rápidas" actionLabel="Ver todas" onAction={() => navigation.navigate('QuickActions')} />
        <View style={styles.homeActions}>
          <HomeAction
            Icon={Camera}
            title="Câmera"
            subtitle="Tirar foto ou gravar vídeo"
            color={colors.camera}
            onPress={() => navigation.navigate('Camera', { initialMode: 'photo' })}
          />
          <HomeAction
            Icon={ImageIcon}
            title="Galeria"
            subtitle="Selecionar da sua galeria"
            color={colors.gallery}
            onPress={() => navigation.navigate('Gallery')}
          />
        </View>

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

        <SectionHeader title="Treinamentos" actionLabel="Ver todas" />
        <PromoCard
          Icon={GraduationCap}
          title="Treinamentos disponíveis"
          subtitle="Acesse os treinamentos e desenvolva suas habilidades."
          action="Acessar"
          color="#8B5CF6"
        />

        <SectionHeader title="Visitas" actionLabel="Ver todas" />
        <PromoCard
          Icon={MapPinned}
          title="Visitas programadas"
          subtitle="Veja suas visitas agendadas e em andamento."
          action="Ver visitas"
          color="#14B8A6"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function HomeHero({ event, serverUrl, isActive, onPress }) {
  const coverUri = getCoverUri(event, serverUrl);
  return (
    <TouchableOpacity style={styles.heroCard} activeOpacity={0.88} onPress={onPress}>
      <View style={styles.heroImage}>
        {coverUri ? <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
      </View>
      <View style={styles.heroInfo}>
        {isActive && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>ATIVO</Text>
          </View>
        )}
        <Text style={styles.heroTitle} numberOfLines={2}>{event?.name || 'Nenhuma atividade ativa'}</Text>
        <InfoLine Icon={CalendarDays} text={formatRange(event?.startDate, event?.endDate)} />
        <InfoLine Icon={MapPin} text={event?.location || 'Local não definido'} />
        <Text style={styles.heroDots}>••••</Text>
      </View>
    </TouchableOpacity>
  );
}

function InfoLine({ Icon, text }) {
  if (!text) return null;
  return (
    <View style={styles.infoLine}>
      <Icon size={14} color={colors.textMid} strokeWidth={1.7} />
      <Text style={styles.infoLineText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function HomeAction({ Icon, title, subtitle, color, onPress }) {
  return (
    <TouchableOpacity style={[styles.homeAction, { backgroundColor: color }]} activeOpacity={0.86} onPress={onPress}>
      <View style={styles.homeActionIcon}>
        <Icon size={34} color="#DCEBFF" strokeWidth={1.7} />
      </View>
      <View>
        <Text style={styles.homeActionTitle}>{title}</Text>
        <Text style={styles.homeActionSub}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

function EventCard({ event, serverUrl, onPress, isActive }) {
  const coverUri = getCoverUri(event, serverUrl);
  return (
    <TouchableOpacity style={styles.eventCard} activeOpacity={0.86} onPress={onPress}>
      <View style={styles.eventCover}>
        {coverUri ? <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
        {isActive ? (
          <View style={styles.eventActiveBadge}><Text style={styles.eventActiveText}>ATIVO</Text></View>
        ) : null}
        <View style={styles.eventDateBadge}><Text style={styles.eventDateText}>{formatRange(event?.startDate, event?.endDate)}</Text></View>
      </View>
      <Text style={styles.eventName} numberOfLines={2}>{event?.name || 'Atividade'}</Text>
      <InfoLine Icon={MapPin} text={event?.location || event?.locationCity || ''} />
    </TouchableOpacity>
  );
}

function PromoCard({ Icon, title, subtitle, action, color }) {
  return (
    <TouchableOpacity style={[styles.promoCard, { borderColor: color + '55' }]} activeOpacity={0.86}>
      <View style={[styles.promoIcon, { borderColor: color, backgroundColor: color + '22' }]}>
        <Icon size={42} color={color} strokeWidth={1.7} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.promoTitle}>{title}</Text>
        <Text style={styles.promoSub}>{subtitle}</Text>
        <View style={[styles.promoButton, { borderColor: color + '88' }]}>
          <Text style={styles.promoButtonText}>{action}</Text>
        </View>
      </View>
      <ChevronRight size={22} color={colors.textMid} strokeWidth={1.8} />
    </TouchableOpacity>
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
  return `${fmt(s)} até ${fmt(e)}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 112 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14,
  },
  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { color: colors.text, fontSize: 22, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBtn: { position: 'relative' },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { backgroundColor: colors.cardElev, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: colors.text, fontSize: 16, fontFamily: 'Inter_800ExtraBold' },
  onlineDot: {
    position: 'absolute', right: 0, bottom: 0,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: colors.active, borderWidth: 2, borderColor: colors.bg,
  },

  heroCard: {
    flexDirection: 'row', marginHorizontal: 16,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card,
    minHeight: 170,
  },
  heroImage: { flex: 0.95, backgroundColor: colors.cardElev },
  heroInfo: { flex: 1.2, padding: 14, justifyContent: 'center', gap: 7 },
  activeBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 11, backgroundColor: colors.activeBg,
  },
  activeText: { color: colors.active, fontSize: 11, fontFamily: 'Inter_800ExtraBold' },
  heroTitle: { color: colors.text, fontSize: 21, lineHeight: 25, fontFamily: 'Inter_800ExtraBold' },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 7, minWidth: 0 },
  infoLineText: { color: colors.textMid, fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1 },
  heroDots: { color: colors.muted, letterSpacing: 4, marginTop: 2 },

  serverCard: {
    marginHorizontal: 16, marginTop: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, padding: 14,
  },
  serverIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.activeBg,
    alignItems: 'center', justifyContent: 'center',
  },
  serverTitle: { color: colors.text, fontSize: 15, fontFamily: 'Inter_700Bold' },
  serverSub: { color: colors.textMid, fontSize: 12, marginTop: 2, fontFamily: 'Inter_400Regular' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginTop: 22, marginBottom: 12,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontFamily: 'Inter_700Bold' },
  sectionAction: { color: colors.brand, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  homeActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  homeAction: {
    flex: 1, minHeight: 110, borderRadius: 16,
    padding: 16, justifyContent: 'space-between',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  homeActionIcon: {
    width: 54, height: 54, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  homeActionTitle: { color: '#fff', fontSize: 16, fontFamily: 'Inter_800ExtraBold' },
  homeActionSub: { color: 'rgba(255,255,255,0.78)', fontSize: 12, lineHeight: 16, marginTop: 4 },

  eventsList: { paddingHorizontal: 16, gap: 10 },
  eventCard: {
    width: 146, minHeight: 210, borderRadius: 16,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    padding: 8,
  },
  eventCover: { width: '100%', aspectRatio: 1.05, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.cardElev },
  eventActiveBadge: {
    position: 'absolute', left: 7, top: 7,
    backgroundColor: colors.activeBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9,
  },
  eventActiveText: { color: colors.active, fontSize: 10, fontFamily: 'Inter_800ExtraBold' },
  eventDateBadge: {
    position: 'absolute', right: 7, top: 7,
    backgroundColor: 'rgba(0,0,0,0.68)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7,
  },
  eventDateText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  eventName: { color: colors.text, fontSize: 15, lineHeight: 19, marginTop: 10, fontFamily: 'Inter_800ExtraBold' },

  promoCard: {
    marginHorizontal: 16, minHeight: 116, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 18, backgroundColor: colors.card,
    borderWidth: 1,
  },
  promoIcon: {
    width: 70, height: 70, borderRadius: 35,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  promoTitle: { color: colors.text, fontSize: 15, fontFamily: 'Inter_800ExtraBold' },
  promoSub: { color: colors.textMid, fontSize: 12, lineHeight: 17, marginTop: 3, fontFamily: 'Inter_400Regular' },
  promoButton: {
    alignSelf: 'flex-start', marginTop: 10,
    paddingHorizontal: 18, paddingVertical: 6,
    borderRadius: 14, borderWidth: 1,
  },
  promoButtonText: { color: colors.text, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
