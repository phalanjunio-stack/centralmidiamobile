import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Image as ImageIcon, Video, CheckCircle2, AlertCircle,
  Clock3, RefreshCw, Pause, RotateCw,
} from 'lucide-react-native';

import { colors } from '../theme';
import { getEvent } from '../services/api';
import {
  getServerConfig, setActiveEvent, getActiveEvent,
  getSyncStats, getSyncLog,
} from '../services/storage';
import QuickActions from '../components/QuickActions';

const TABS = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'media',    label: 'Mídia' },
  { id: 'team',     label: 'Equipe' },
  { id: 'info',     label: 'Informações' },
];

export default function EventDetailScreen({ navigation, route }) {
  const eventId = route.params?.eventId;
  const [event, setEvent]       = useState(null);
  const [active, setActive]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('overview');
  const [serverUrl, setServerUrl] = useState('');
  const [log, setLog]           = useState([]);

  async function load() {
    setLoading(true);
    try {
      const [cfg, ev, act, l] = await Promise.all([
        getServerConfig(), getEvent(eventId), getActiveEvent(), getSyncLog(),
      ]);
      setServerUrl(cfg?.serverUrl || '');
      setEvent(ev?.event || ev);
      setActive(act);
      setLog(l);
    } catch (e) {
      console.log('Load event error:', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [eventId]);

  async function handleActivate() {
    if (!event) return;
    await setActiveEvent({
      id: event.id,
      name: event.name,
      folder: event.folder,
      startDate: event.startDate,
      endDate: event.endDate,
      coverUrl: event.coverUrl,
      location: event.location,
      type: event.type,
      owner: event.owner,
    });
    setActive({ ...event });
  }

  async function handleShare() {
    if (!event) return;
    const url = `${serverUrl}/event/${event.id}`;
    await Share.share({ message: `${event.name}\n${url}` }).catch(() => {});
  }

  if (loading || !event) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const isActive = active?.id === event.id;
  const coverUri = event.coverUrl
    ? (event.coverUrl.startsWith('http') ? event.coverUrl : `${serverUrl}${event.coverUrl}`)
    : null;

  // logs filtrados deste evento
  const eventLogs = log.filter((l) => l.eventId === event.id);
  const uploaded  = eventLogs.filter((l) => l.ok).length;
  const errors    = eventLogs.filter((l) => !l.ok).length;
  const uploading = eventLogs.filter((l) => l.status === 'uploading').length;
  const pending   = eventLogs.filter((l) => l.status === 'pending').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.iconBtnText}>‹</Text>
          </TouchableOpacity>
          {isActive ? (
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>ATIVO</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.activateBtn} onPress={handleActivate}>
              <Text style={styles.activateText}>Ativar atividade</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Text style={styles.iconBtnText}>↗</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.coverWrap}>
            {coverUri
              ? <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} />
              : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.cardElev }]} />
            }
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.eventTitle} numberOfLines={2}>{event.name}</Text>
            <View style={styles.metaLine}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={styles.metaText}>
                {formatDate(event.startDate)} até {formatDate(event.endDate)}
              </Text>
            </View>
            {event.location && (
              <View style={styles.metaLine}>
                <Text style={styles.metaIcon}>📍</Text>
                <Text style={styles.metaText}>{event.location}</Text>
              </View>
            )}
            {event.locationCity && (
              <View style={styles.metaLine}>
                <Text style={styles.metaIcon}>🗺</Text>
                <Text style={styles.metaText}>{event.locationCity}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick info bar */}
        <View style={styles.infoBar}>
          <InfoCol label="Tipo"        value={event.type || '—'} />
          <View style={styles.infoDivider} />
          <InfoCol label="Responsável" value={event.owner || '—'} />
          <View style={styles.infoDivider} />
          <InfoCol label="Pasta"       value={event.shortFolder || '01. BRUTO'} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.tabBtn}
              onPress={() => setTab(t.id)}
            >
              <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}>
                {t.label}
              </Text>
              {tab === t.id && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'overview' && (
          <>
            {/* Quick actions — componente premium */}
            <View style={{ marginTop: 8 }}>
              <QuickActions
                onPress={(id) => {
                  if (id === 'camera') navigation.navigate('Camera', { initialMode: 'photo' });
                  if (id === 'video') navigation.navigate('Camera', { initialMode: 'video' });
                  if (id === 'gallery') navigation.navigate('Gallery');
                  if (id === 'docs') navigation.navigate('Uploads');
                }}
              />
            </View>

            {/* Queue */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Fila de envio</Text>
              <TouchableOpacity><Text style={styles.sectionAction}>Ver todos</Text></TouchableOpacity>
            </View>
            {eventLogs.slice(0, 5).map((entry, i) => (
              <QueueItem key={i} entry={entry} />
            ))}
            {eventLogs.length === 0 && (
              <Text style={styles.emptyText}>Sem uploads ainda nesta atividade.</Text>
            )}

            {/* Summary */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Resumo</Text>
              <TouchableOpacity>
                <Text style={styles.sectionAction}>🗓 Hoje ▾</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.summaryGrid}>
              <SummaryCard label="Enviados"  value={uploaded}  Icon={CheckCircle2} color={colors.active} />
              <SummaryCard label="Enviando"  value={uploading} Icon={RefreshCw}    color={colors.uploading} />
              <SummaryCard label="Pendentes" value={pending}   Icon={Clock3}       color={colors.warning} />
              <SummaryCard label="Com erro"  value={errors}    Icon={AlertCircle}  color={colors.error} />
            </View>
          </>
        )}

        {tab === 'media' && (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={styles.emptyText}>Mídia da atividade abaixo.</Text>
            <View style={styles.mediaGrid}>
              {eventLogs.map((entry, i) => (
                <MediaTile key={i} entry={entry} />
              ))}
              {eventLogs.length === 0 && (
                <Text style={styles.emptyText}>Sem mídia enviada nesta atividade.</Text>
              )}
            </View>
          </View>
        )}
        {tab === 'team' && (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={styles.emptyText}>Equipe da atividade em breve…</Text>
          </View>
        )}
        {tab === 'info' && (
          <View style={{ padding: 16, gap: 12 }}>
            <InfoRow label="ID"    value={event.id} />
            <InfoRow label="Pasta" value={event.folder || '—'} />
            <InfoRow label="Início" value={formatDate(event.startDate)} />
            <InfoRow label="Fim"    value={formatDate(event.endDate)} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Subcomponents ──
function InfoCol({ label, value }) {
  return (
    <View style={styles.infoCol}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoRowLabel}>{label}</Text>
      <Text style={styles.infoRowValue} selectable>{value}</Text>
    </View>
  );
}

function QueueItem({ entry }) {
  const isPhoto = !isVideoItem(entry);
  const status = getUploadStatus(entry);
  const StatusIcon = status.Icon;
  return (
    <View style={styles.queueCard}>
      <View style={styles.queueThumb}>
        {entry.uri && isPhoto ? (
          <Image source={{ uri: entry.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : isPhoto ? (
          <ImageIcon size={20} color="#4EA3FF" strokeWidth={1.8} />
        ) : (
          <Video size={20} color="#A78BFA" strokeWidth={1.8} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.queueName} numberOfLines={1}>{entry.name}</Text>
        <Text style={styles.queueMeta}>
          {formatBytes(entry.size)} · {isPhoto ? 'Foto' : 'Vídeo'}
        </Text>
      </View>
      <View style={styles.queueRight}>
        <Text style={[styles.queueStatusText, { color: status.color }]}>{status.label}</Text>
        <StatusIcon size={18} color={status.color} strokeWidth={2} />
      </View>
    </View>
  );
}

function MediaTile({ entry }) {
  const video = isVideoItem(entry);
  const status = getUploadStatus(entry);
  const StatusIcon = status.Icon;
  return (
    <View style={styles.mediaTile}>
      {entry.uri && !video ? (
        <Image source={{ uri: entry.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={styles.mediaPlaceholder}>
          {video
            ? <Video size={28} color="rgba(255,255,255,0.55)" strokeWidth={1.8} />
            : <ImageIcon size={28} color="rgba(255,255,255,0.55)" strokeWidth={1.8} />
          }
        </View>
      )}
      <View style={styles.mediaTypeBadge}>
        {video ? <Video size={11} color="#fff" strokeWidth={2} /> : <ImageIcon size={11} color="#fff" strokeWidth={2} />}
      </View>
      <View style={[styles.mediaStatusBadge, { borderColor: status.color + '88' }]}>
        <StatusIcon size={12} color={status.color} strokeWidth={2.2} />
      </View>
    </View>
  );
}

function SummaryCard({ label, value, Icon, color }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryValue}>{String(value).padStart(2, '0')}</Text>
        <View style={[styles.summaryIcon, { backgroundColor: color + '22', borderColor: color + '66' }]}>
          <Icon size={14} color={color} strokeWidth={2} />
        </View>
      </View>
    </View>
  );
}

function isVideoItem(item) {
  return item?.mediaType === 'video' || /\.(mp4|mov|avi|mkv|m4v|webm)$/i.test(item?.name || '');
}

function getUploadStatus(entry) {
  if (entry?.status === 'uploading') return { label: 'Enviando', color: colors.uploading, Icon: Pause };
  if (entry?.status === 'pending') return { label: 'Pendente', color: colors.warning, Icon: Clock3 };
  if (!entry?.ok) return { label: 'Erro', color: colors.error, Icon: RotateCw };
  return { label: 'Enviado', color: colors.active, Icon: CheckCircle2 };
}

function formatDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function formatBytes(b) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingTop: 4, paddingBottom: 12,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  iconBtnText: { color: colors.text, fontSize: 18, fontFamily: 'Inter_500Medium' },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.activeBg, borderColor: colors.active,
    borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  activeDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.active,
  },
  activeText: { color: colors.active, fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.6 },
  activateBtn: {
    backgroundColor: colors.brand, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  activateText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },

  headerCard: {
    flexDirection: 'row', gap: 14,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  coverWrap: {
    width: 130, height: 160, borderRadius: 14, overflow: 'hidden',
    backgroundColor: colors.cardElev,
  },
  headerInfo: { flex: 1, gap: 6, paddingTop: 4 },
  eventTitle: {
    color: colors.text, fontSize: 22, lineHeight: 26,
    fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5,
  },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  metaIcon: { fontSize: 12 },
  metaText: { color: colors.textMid, fontSize: 12, fontFamily: 'Inter_500Medium' },

  infoBar: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: colors.card, marginHorizontal: 16, marginTop: 12,
    borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  infoCol: { flex: 1, padding: 10, alignItems: 'center' },
  infoDivider: { width: 1, backgroundColor: colors.border },
  infoLabel: { color: colors.muted, fontSize: 10, letterSpacing: 0.5, fontFamily: 'Inter_500Medium' },
  infoValue: { color: colors.text, fontSize: 12, fontFamily: 'Inter_700Bold', marginTop: 4 },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 4, marginTop: 20,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', position: 'relative' },
  tabLabel: { color: colors.muted, fontSize: 13, fontFamily: 'Inter_500Medium' },
  tabLabelActive: { color: colors.brand, fontFamily: 'Inter_700Bold' },
  tabUnderline: {
    position: 'absolute', bottom: -1, left: 16, right: 16, height: 2,
    backgroundColor: colors.brand, borderRadius: 1,
  },

  sectionTitle: {
    color: colors.text, fontSize: 16, fontFamily: 'Inter_700Bold',
    paddingHorizontal: 16, marginTop: 24, marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginTop: 24, marginBottom: 12,
  },
  sectionAction: { color: colors.brand, fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  quickGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  quickItem: {
    flex: 1, backgroundColor: colors.card, borderRadius: 14,
    padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  quickIconBox: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  quickLabel: { color: colors.text, fontSize: 13, fontFamily: 'Inter_700Bold' },
  quickSub:   { color: colors.muted, fontSize: 11, marginTop: 1, fontFamily: 'Inter_400Regular' },

  queueCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 8,
    padding: 10, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  queueThumb: {
    width: 48, height: 48, borderRadius: 8,
    backgroundColor: colors.cardElev,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  queueThumbIcon: { fontSize: 22 },
  queueName: { color: colors.text, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  queueMeta: { color: colors.muted, fontSize: 11, marginTop: 2, fontFamily: 'Inter_400Regular' },
  queueRight: { alignItems: 'flex-end', justifyContent: 'center', gap: 4, minWidth: 72 },
  queueStatus: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  queueStatusText: { fontSize: 11, fontFamily: 'Inter_700Bold' },

  mediaGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  mediaTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.cardElev,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mediaPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardElev,
  },
  mediaTypeBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaStatusBadge: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    color: colors.muted, fontSize: 13, textAlign: 'center',
    fontFamily: 'Inter_400Regular', paddingHorizontal: 24,
  },

  summaryGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 8,
  },
  summaryCard: {
    flex: 1, minWidth: '47%',
    backgroundColor: colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  summaryLabel: { color: colors.muted, fontSize: 11, fontFamily: 'Inter_500Medium' },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 6,
  },
  summaryValue: { color: colors.text, fontSize: 22, fontFamily: 'Inter_800ExtraBold' },
  summaryIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryIconText: { fontSize: 14, fontFamily: 'Inter_700Bold' },

  infoRow: {
    backgroundColor: colors.card, padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  infoRowLabel: { color: colors.muted, fontSize: 11, fontFamily: 'Inter_500Medium' },
  infoRowValue: { color: colors.text, fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 4 },
});
