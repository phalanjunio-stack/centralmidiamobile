import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, RefreshControl, FlatList, Dimensions, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Circle as SvgCircle } from 'react-native-svg';

// Ícones oficiais Contourline
const IC = {
  acaoCamera:     require('../assets/icons/acao_camera.png'),
  acaoGaleria:    require('../assets/icons/acao_galeria.png'),
  acaoQR:         require('../assets/icons/acao_qr_evento.png'),
  acaoProjeto:    require('../assets/icons/acao_novo_projeto.png'),
  acaoSeta:       require('../assets/icons/acao_seta.png'),
  central:        require('../assets/icons/central_midia_conectada.png'),
  sinalForte:     require('../assets/icons/sinal_forte.png'),
  statusFila:     require('../assets/icons/status_fila.png'),
  statusEnviados: require('../assets/icons/status_enviados.png'),
  statusSync:     require('../assets/icons/status_sincronizado.png'),
  notificacao:    require('../assets/icons/notificacao.png'),
  notificacaoAtiva: require('../assets/icons/notificacao_ativa.png'),
  calendario:     require('../assets/icons/calendario.png'),
  localizacao:    require('../assets/icons/localizacao.png'),
  equipe:         require('../assets/icons/equipe.png'),
  chevronDir:     require('../assets/icons/chevron_direita.png'),
  chevronBaixo:   require('../assets/icons/chevron_baixo.png'),
  favOutline:     require('../assets/icons/favorito_outline.png'),
  favAtivo:       require('../assets/icons/favorito_ativo.png'),
  arquivo:        require('../assets/icons/arquivo_imagem.png'),
  personalizar:   require('../assets/icons/personalizar_sliders.png'),
};

import { colors } from '../src/theme';
import { useNetworkStatus } from '../src/services/networkStatus';
import { useUploads } from '../src/context/UploadContext';
import LogoIcon from '../components/icons/LogoIcon';
import BellIcon from '../components/icons/BellIcon';
import {
  getSyncStats, getActiveEvent, getDeviceProfile, getServerConfig,
} from '../services/storage';
import { listEvents } from '../services/api';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - 48) / 4; // 4 ações em linha

export default function HomeScreen({ navigation }) {
  const [stats, setStats]     = useState({ synced: 0, uploading: 0, pending: 0, errors: 0 });
  const [event, setEvent]     = useState(null);
  const [profile, setProfile] = useState(null);
  const [serverUrl, setServerUrl] = useState('');
  const [serverName, setServerName] = useState('');
  const [events, setEvents]   = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const network = useNetworkStatus();
  const { pendingCount } = useUploads();

  async function loadData() {
    const [s, ev, pr, cfg] = await Promise.all([
      getSyncStats(), getActiveEvent(), getDeviceProfile(), getServerConfig(),
    ]);
    setStats(s || {});
    setEvent(ev);
    setProfile(pr);
    setServerUrl(cfg?.serverUrl || '');
    setServerName(cfg?.serverName || cfg?.pcName || '');
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

  const connected  = !!serverUrl && network.isConnected;
  const synced     = stats?.synced   ?? 0;
  const uploading  = stats?.uploading ?? 0;
  const pending    = pendingCount || stats?.pending || 0;
  const errs       = stats?.errors   ?? 0;
  const sentToday  = synced;
  const syncPct    = (synced + uploading + pending + errs) > 0
    ? Math.round((synced / (synced + uploading + pending + errs)) * 100) : 0;

  const featuredEvents = events.length ? events : (event ? [event] : []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.aura.primary} />}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          {/* Logo esquerda */}
          <View style={styles.brandWrap}>
            <LogoIcon size={30} color={colors.text.primary} />
            <View>
              <Text style={styles.brandName}>contourline</Text>
              <Text style={styles.brandSub}>BACKUP</Text>
            </View>
          </View>

          {/* Pill central: status do servidor */}
          <TouchableOpacity
            style={[styles.serverPill, connected && styles.serverPillActive]}
            onPress={() => navigation.navigate('ConnectAura')}
            activeOpacity={0.85}
          >
            <View style={[styles.serverPillDot, { backgroundColor: connected ? colors.state.success : colors.state.warning }]} />
            <Text style={styles.serverPillText} numberOfLines={1}>
              {connected ? 'Servidor conectado' : 'Sem servidor'}
            </Text>
            <Image source={IC.chevronBaixo} style={{ width: 12, height: 12, tintColor: colors.text.secondary, resizeMode: 'contain' }} />
          </TouchableOpacity>

          {/* Direita: sino + avatar */}
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.bellBtn}>
              <BellIcon size={18} color={colors.text.secondary} />
              {errs > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{errs > 9 ? '9+' : errs}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('ProfileTab')}>
              {profile?.photoUri
                ? <Image source={{ uri: profile.photoUri }} style={styles.avatar} />
                : <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>{(profile?.name || '?')[0].toUpperCase()}</Text>
                  </View>
              }
              <View style={[styles.onlineDot, { backgroundColor: connected ? colors.state.success : colors.text.muted }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── HERO: PROJETO ATIVO ── */}
        <HeroCard
          event={event || featuredEvents[0]}
          serverUrl={serverUrl}
          isActive={!!event}
          onPress={() => {
            const ev = event || featuredEvents[0];
            if (ev?.id) navigation.navigate('EventDetail', { eventId: ev.id });
          }}
        />

        {/* ── CENTRAL DE MÍDIA ── */}
        <CentralCard
          connected={connected}
          serverUrl={serverUrl}
          serverName={serverName}
          networkType={network.type}
          onPress={() => connected ? navigation.navigate('Uploads') : navigation.navigate('ConnectAura')}
        />

        {/* ── AÇÕES RÁPIDAS ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Ações rápidas</Text>
          <TouchableOpacity style={styles.sectionActionBtn} onPress={() => navigation.navigate('QuickActions')}>
            <Text style={styles.sectionActionText}>Personalizar</Text>
            <Image source={IC.personalizar} style={styles.sectionActionIcon} />
          </TouchableOpacity>
        </View>
        <View style={styles.actionsRow}>
          <QuickCard img={IC.acaoCamera}   label="Câmera"          sub="Tirar foto ou gravar vídeo"       tint="#1F8BFF" onPress={() => navigation.navigate('Camera')} />
          <QuickCard img={IC.acaoGaleria}  label="Galeria"         sub="Ver e gerenciar arquivos"          tint="#1F8BFF" onPress={() => navigation.navigate('Gallery')} />
          <QuickCard img={IC.acaoQR}       label={'Ler QR\ndo evento'} sub="Selecionar evento via QR Code" tint="#7C3AED" onPress={() => navigation.navigate('QRScanner')} />
          <QuickCard img={IC.acaoProjeto}  label={'Novo\nprojeto'} sub="Criar ou adicionar um projeto"     tint="#7C3AED" onPress={() => navigation.navigate('ProjectsTab')} />
        </View>

        {/* ── EVENTOS EM DESTAQUE ── */}
        {featuredEvents.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Eventos em destaque</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProjectsTab')}>
                <Text style={styles.sectionActionText}>Ver todos</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={featuredEvents.slice(0, 8)}
              keyExtractor={(item, i) => item.id || String(i)}
              contentContainerStyle={styles.eventsList}
              renderItem={({ item }) => (
                <EventCard
                  event={item}
                  serverUrl={serverUrl}
                  isActive={event?.id === item.id}
                  onPress={() => item?.id && navigation.navigate('EventDetail', { eventId: item.id })}
                />
              )}
            />
          </>
        )}

        {/* ── STATUS DO DIA ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Status do dia</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Uploads')}>
            <Text style={styles.sectionActionText}>Ver detalhes</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <DayStatCard img={IC.statusFila}     value={pending}        label="Arquivos na fila" sub="Aguardando envio" />
          <DayStatCard img={IC.statusEnviados} value={sentToday}       label="Enviados hoje"    sub="Fotos e vídeos" />
          <DayStatCard img={IC.statusSync}     value={`${syncPct}%`}   label="Sincronizados"   sub="Com Google Drive" />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── COMPONENTS ── */

function HeroCard({ event, serverUrl, isActive, onPress }) {
  const coverUri = getCoverUri(event, serverUrl);
  return (
    <TouchableOpacity style={styles.heroCard} activeOpacity={0.9} onPress={onPress}>
      {/* Borda azul quando ativo */}
      {isActive && <View style={styles.heroBorderActive} pointerEvents="none" />}
      {!isActive && <View style={styles.heroBorderIdle} pointerEvents="none" />}

      {/* Conteúdo split: texto esquerda, imagem direita */}
      <View style={styles.heroInner}>
        {/* Coluna de texto */}
        <View style={styles.heroLeft}>
          <Text style={styles.heroEyebrow}>PROJETO ATIVO</Text>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {event?.name || 'Nenhum projeto ativo'}
          </Text>

          <View style={styles.heroMeta}>
            <Image source={IC.calendario} style={styles.heroMetaIcon} />
            <Text style={styles.heroMetaText}>
              {formatDateFull(event?.startDate, event?.endDate) || '—'}
            </Text>
          </View>
          {event?.location && (
            <View style={styles.heroMeta}>
              <Image source={IC.localizacao} style={styles.heroMetaIcon} />
              <Text style={styles.heroMetaText} numberOfLines={1}>{event.location}</Text>
            </View>
          )}
          <View style={styles.heroMeta}>
            <Image source={IC.equipe} style={styles.heroMetaIcon} />
            <Text style={styles.heroMetaText}>Equipe Contourline</Text>
          </View>

          {isActive && (
            <View style={styles.activeBadge}>
              <View style={styles.activeBadgeDot} />
              <Text style={styles.activeBadgeText}>ATIVO</Text>
            </View>
          )}
        </View>

        {/* Imagem direita */}
        <View style={styles.heroRight}>
          <TouchableOpacity style={styles.heroArrowBtn} activeOpacity={0.8} onPress={onPress}>
            <Image source={IC.chevronDir} style={styles.heroArrowImg} />
          </TouchableOpacity>
          <View style={styles.heroCoverWrap}>
            {coverUri
              ? <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              : <LinearGradient colors={['#1E3A8A', '#0B1B4F']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            }
            {/* Máscara esquerda — fade pra escuro pra integrar com o texto */}
            <LinearGradient
              colors={['rgba(12,17,27,1)', 'rgba(12,17,27,0.6)', 'rgba(12,17,27,0)']}
              start={{ x: 0, y: 0.5 }} end={{ x: 0.7, y: 0.5 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            {/* Vinheta inferior */}
            <LinearGradient
              colors={['rgba(12,17,27,0)', 'rgba(12,17,27,0.5)']}
              start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            {/* Vinheta topo */}
            <LinearGradient
              colors={['rgba(12,17,27,0.4)', 'rgba(12,17,27,0)']}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CentralCard({ connected, serverUrl, serverName, networkType, onPress }) {
  const signalBars = networkType === 'wifi' ? 4 : networkType === 'cellular' ? 2 : 0;
  const signalLabel = signalBars >= 4 ? 'Sinal forte' : signalBars >= 2 ? 'Sinal médio' : 'Sem sinal';

  return (
    <TouchableOpacity style={styles.centralCard} activeOpacity={0.88} onPress={onPress}>
      {/* Ícone esquerdo com aura verde animada */}
      <CentralIcon connected={connected} />

      {/* Texto centro */}
      <View style={styles.centralInfo}>
        <Text style={styles.centralTitle}>
          {connected ? 'Central de Mídia conectada' : 'Central não pareada'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.centralSub} numberOfLines={1}>
            {serverName || (serverUrl ? serverUrl.replace(/^https?:\/\//, '').split(':')[0] : 'Toque para conectar')}
          </Text>
          {connected && (
            <TouchableOpacity onPress={onPress}>
              <Text style={styles.centralDetalhes}>Ver detalhes</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Divisor */}
      <View style={styles.centralDivider} />

      {/* Sinal direita */}
      <View style={styles.centralSignal}>
        <Image source={IC.sinalForte} style={[styles.centralSignalImg, signalBars < 3 && { opacity: 0.4 }]} />
        <Text style={styles.centralSignalText}>{signalLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}


function CentralIcon({ connected }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!connected) { pulse.setValue(0); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [connected]);

  const haloScale   = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });
  const ringScale   = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <View style={styles.centralIconStage}>
      {connected && (
        <Animated.View
          style={[styles.centralHaloWrap, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]}
          pointerEvents="none"
        >
          <Svg width={84} height={84} viewBox="0 0 100 100">
            <Defs>
              <SvgRadialGradient id="ghalo" cx="50%" cy="50%" r="50%">
                <Stop offset="0%"   stopColor="#00C16A" stopOpacity={0.55} />
                <Stop offset="40%"  stopColor="#00C16A" stopOpacity={0.22} />
                <Stop offset="75%"  stopColor="#00C16A" stopOpacity={0.05} />
                <Stop offset="100%" stopColor="#00C16A" stopOpacity={0} />
              </SvgRadialGradient>
            </Defs>
            <SvgCircle cx={50} cy={50} r={48} fill="url(#ghalo)" />
          </Svg>
        </Animated.View>
      )}
      {connected && (
        <Animated.View style={[styles.centralRingPulse, { transform: [{ scale: ringScale }] }]} pointerEvents="none" />
      )}
      <View style={[styles.centralIconWrap, { borderColor: connected ? colors.state.success : colors.border.glassHi }]}>
        <Image source={IC.central} style={[styles.centralIconImg, !connected && { opacity: 0.4 }]} />
      </View>
    </View>
  );
}

function QuickCard({ img, label, sub, onPress, tint = '#1F8BFF' }) {
  return (
    <TouchableOpacity style={styles.qaCard} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.qaIconWrap, { backgroundColor: `${tint}18`, borderColor: `${tint}33` }]}>
        <Image source={img} style={styles.qaIconImg} />
      </View>
      <Text style={styles.qaLabel}>{label}</Text>
      <Text style={styles.qaSub}>{sub}</Text>
      <View style={[styles.qaArrow, { backgroundColor: `${tint}18`, borderColor: `${tint}33` }]}>
        <Image source={IC.acaoSeta} style={[styles.qaArrowImg, { tintColor: tint }]} />
      </View>
    </TouchableOpacity>
  );
}

function EventCard({ event, serverUrl, isActive, onPress }) {
  const coverUri = getCoverUri(event, serverUrl);
  return (
    <TouchableOpacity
      style={[styles.eventCard, isActive && styles.eventCardActive]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      {/* Cover */}
      <View style={styles.eventCover}>
        {coverUri
          ? <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <LinearGradient colors={['#1E3A8A', '#0B1B4F']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        }
        <LinearGradient colors={['transparent', 'rgba(4,8,18,0.85)']} style={StyleSheet.absoluteFill} pointerEvents="none" />

        {/* Badges topo */}
        <View style={styles.eventBadgeRow}>
          {isActive && (
            <View style={styles.eventActivePill}>
              <Text style={styles.eventActivePillText}>ATIVO</Text>
            </View>
          )}
          <TouchableOpacity style={styles.starBtn}>
            <Image source={isActive ? IC.favAtivo : IC.favOutline} style={styles.starImg} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info */}
      <View style={styles.eventInfo}>
        <Text style={styles.eventName} numberOfLines={2}>{event?.name || 'Atividade'}</Text>
        <Text style={styles.eventDate}>{formatRange(event?.startDate, event?.endDate)}</Text>
        {event?.location && (
          <Text style={styles.eventLoc} numberOfLines={1}>{event.location}</Text>
        )}
        {event?.fileCount != null && (
          <View style={styles.eventFileRow}>
            <Image source={IC.arquivo} style={styles.eventFileIcon} />
            <Text style={styles.eventFileCount}>{event.fileCount} arquivos</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function DayStatCard({ img, value, label, sub }) {
  return (
    <View style={styles.statCard}>
      <Image source={img} style={styles.statImg} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

/* ── UTILS ── */

function getCoverUri(event, serverUrl) {
  if (!event?.coverUrl) return null;
  return event.coverUrl.startsWith('http') ? event.coverUrl : `${serverUrl}${event.coverUrl}`;
}

function formatRange(start, end) {
  if (!start) return '';
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const fmt = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  if (!e || s.toDateString() === e.toDateString()) return fmt(s);
  return `${fmt(s)} – ${fmt(e)}`;
}

function formatDateFull(start, end) {
  if (!start) return '';
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const m = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const fmt = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  if (!e || s.toDateString() === e.toDateString()) return fmt(s);
  return `${fmt(s)} até ${fmt(e)}`;
}

/* ── STYLES ── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.base },
  content: { paddingBottom: 120 },

  /* HEADER */
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14,
    gap: 8,
  },
  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { color: colors.text.primary, fontSize: 16, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.3 },
  brandSub: { color: colors.text.muted, fontSize: 8.5, fontFamily: 'Inter_700Bold', letterSpacing: 2 },

  serverPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.bg.surface,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: colors.border.glass,
  },
  serverPillActive: { borderColor: 'rgba(0,193,106,0.3)' },
  serverPillDot: { width: 7, height: 7, borderRadius: 4 },
  serverPillText: { color: colors.text.secondary, fontSize: 12, fontFamily: 'Inter_600SemiBold', flex: 1 },

  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bellBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.border.glass, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bellBadge: { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.aura.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: colors.bg.base },
  bellBadgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  avatarBtn: { position: 'relative' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: { backgroundColor: colors.aura.primaryDim, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 14, fontFamily: 'Inter_800ExtraBold' },
  onlineDot: { position: 'absolute', right: -1, bottom: -1, width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: colors.bg.base },

  /* HERO */
  heroCard: {
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 18,
    backgroundColor: colors.bg.surface,
    overflow: 'hidden',
  },
  heroBorderActive: {
    ...StyleSheet.absoluteFillObject, borderRadius: 18,
    borderWidth: 1.5, borderColor: 'rgba(0,193,106,0.5)',
  },
  heroBorderIdle: {
    ...StyleSheet.absoluteFillObject, borderRadius: 18,
    borderWidth: 1, borderColor: colors.border.glassHi,
  },
  heroInner: { flexDirection: 'row', minHeight: 180 },

  heroLeft: { flex: 1, padding: 18, justifyContent: 'center', gap: 6 },
  heroEyebrow: { color: colors.text.muted, fontSize: 9.5, fontFamily: 'Inter_700Bold', letterSpacing: 2, textTransform: 'uppercase' },
  heroTitle: { color: colors.text.primary, fontSize: 22, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5, lineHeight: 26, marginTop: 2 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMetaText: { color: colors.text.tertiary, fontSize: 11.5, fontFamily: 'Inter_500Medium', flex: 1 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,193,106,0.15)', borderColor: 'rgba(0,193,106,0.4)', borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8,
  },
  activeBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.state.success },
  activeBadgeText: { color: colors.state.success, fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.8 },

  heroRight: { width: 140, position: 'relative' },
  heroArrowBtn: {
    position: 'absolute', top: 12, right: 12, zIndex: 2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  heroCoverWrap: { flex: 1, overflow: 'hidden' },

  /* CENTRAL */
  centralCard: {
    marginHorizontal: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.bg.surface,
    borderRadius: 16, borderWidth: 1, borderColor: colors.border.glassHi,
    padding: 14,
  },
  centralIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 1.5, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  centralInfo: { flex: 1 },
  centralTitle: { color: colors.text.primary, fontSize: 13.5, fontFamily: 'Inter_700Bold' },
  centralSub: { color: colors.text.tertiary, fontSize: 11.5, fontFamily: 'Inter_500Medium' },
  centralDetalhes: { color: colors.aura.primary, fontSize: 11.5, fontFamily: 'Inter_700Bold' },
  centralDivider: { width: 1, height: 36, backgroundColor: colors.border.glass },
  centralSignal: { alignItems: 'center', gap: 5, paddingLeft: 4 },
  centralSignalText: { color: colors.text.tertiary, fontSize: 10, fontFamily: 'Inter_600SemiBold' },

  /* SECTION */
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginTop: 22, marginBottom: 12,
  },
  sectionTitle: { color: colors.text.primary, fontSize: 17, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.3 },
  sectionActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sectionActionText: { color: colors.aura.primary, fontSize: 12.5, fontFamily: 'Inter_700Bold' },

  /* QUICK ACTIONS */
  actionsRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 6 },
  qaCard: {
    flex: 1, backgroundColor: colors.bg.surface,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border.glass,
    padding: 12, alignItems: 'center', gap: 6,
  },
  qaIconWrap: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: 'rgba(31,139,255,0.08)', borderColor: 'rgba(31,139,255,0.2)', borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  qaLabel: { color: colors.text.primary, fontSize: 11, fontFamily: 'Inter_800ExtraBold', textAlign: 'center', letterSpacing: -0.2 },
  qaSub: { color: colors.text.muted, fontSize: 9, fontFamily: 'Inter_500Medium', textAlign: 'center', lineHeight: 12 },
  qaArrow: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(31,139,255,0.12)', borderColor: 'rgba(31,139,255,0.2)', borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },

  /* EVENTOS */
  eventsList: { paddingHorizontal: 16, gap: 10 },
  eventCard: {
    width: 172, borderRadius: 16,
    backgroundColor: colors.bg.surface,
    borderColor: colors.border.glass, borderWidth: 1,
    overflow: 'hidden',
  },
  eventCardActive: { borderColor: colors.aura.primary, borderWidth: 1.5 },
  eventCover: { height: 116, position: 'relative' },
  eventBadgeRow: {
    position: 'absolute', top: 8, left: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  eventActivePill: {
    backgroundColor: colors.state.success, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  eventActivePillText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.8 },
  starBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  eventInfo: { padding: 10, gap: 3 },
  eventName: { color: colors.text.primary, fontSize: 13, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.2, lineHeight: 16 },
  eventDate: { color: colors.text.tertiary, fontSize: 10.5, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  eventLoc: { color: colors.text.muted, fontSize: 10, fontFamily: 'Inter_500Medium' },
  eventFileRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  eventFileCount: { color: colors.text.muted, fontSize: 10, fontFamily: 'Inter_500Medium' },

  /* STATS DO DIA */
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  statCard: {
    flex: 1, backgroundColor: colors.bg.surface,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border.glass,
    padding: 12, alignItems: 'center', gap: 4,
  },
  statImg: { width: 36, height: 36, resizeMode: 'contain', marginBottom: 4 },
  statValue: { color: colors.text.primary, fontSize: 22, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  statLabel: { color: colors.text.secondary, fontSize: 11, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  statSub: { color: colors.text.muted, fontSize: 10, fontFamily: 'Inter_500Medium', textAlign: 'center' },

  // Hero meta
  heroMetaIcon: { width: 13, height: 13, resizeMode: 'contain', opacity: 0.6 },
  heroArrowImg: { width: 14, height: 14, resizeMode: 'contain', tintColor: '#fff' },

  // Central
  centralIconImg: { width: 32, height: 32, resizeMode: 'contain' },
  centralIconStage: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  centralHaloWrap: { position: 'absolute', width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  centralRingPulse: {
    position: 'absolute',
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 1.2, borderColor: 'rgba(0,193,106,0.45)',
  },
  centralSignalImg: { width: 32, height: 26, resizeMode: 'contain' },

  // Quick actions
  qaIconImg: { width: 28, height: 28, resizeMode: 'contain' },
  qaArrowImg: { width: 14, height: 14, resizeMode: 'contain' },

  // Section icon
  sectionActionIcon: { width: 14, height: 14, resizeMode: 'contain', tintColor: colors.aura.primary },

  // Event
  starImg: { width: 14, height: 14, resizeMode: 'contain' },
  eventFileIcon: { width: 11, height: 11, resizeMode: 'contain', opacity: 0.5 },
});
