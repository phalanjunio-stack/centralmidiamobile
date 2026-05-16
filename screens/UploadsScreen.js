import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Image as ImageIcon, Video, CheckCircle2, AlertCircle, Clock3,
  RefreshCw, UploadCloud, Wifi, Pause, Play, RotateCw,
  SlidersHorizontal, Trash2, MoreHorizontal, Cloud,
} from 'lucide-react-native';

import { colors } from '../theme';
import {
  getSyncLog, getSyncStats, getLastSync,
  getServerConfig, getSettings, saveSettings,
} from '../services/storage';
import { runSync } from '../services/sync';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'uploading', label: 'Enviando' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'sent', label: 'Enviados' },
  { id: 'errors', label: 'Erros' },
];

export default function UploadsScreen() {
  const [log, setLog] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, errors: 0 });
  const [lastSync, setLastSync] = useState(null);
  const [serverOk, setServerOk] = useState(false);
  const [wifiOnly, setWifiOnly] = useState(true);
  const [filter, setFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState(null);

  async function load() {
    const [l, s, last, cfg, settings] = await Promise.all([
      getSyncLog(), getSyncStats(), getLastSync(), getServerConfig(), getSettings(),
    ]);
    setLog(l);
    setStats(s);
    setLastSync(last);
    setServerOk(!!cfg?.serverUrl);
    setWifiOnly(settings?.wifiOnly !== false);
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    setProgress(null);
    try {
      await runSync({ onProgress: setProgress });
      await load();
    } catch (e) {
      Alert.alert('Falha ao sincronizar', e?.message || 'Não foi possível sincronizar agora.');
    } finally {
      setSyncing(false);
      setProgress(null);
    }
  }

  async function toggleWifiOnly(value) {
    setWifiOnly(value);
    const settings = await getSettings();
    await saveSettings({ ...settings, wifiOnly: value });
  }

  const counts = getCounts(log, stats, syncing, progress);
  const pct = counts.totalWork > 0 ? Math.round((counts.sent / counts.totalWork) * 100) : (counts.sent > 0 ? 100 : 0);
  const filtered = log.filter((entry) => {
    const status = getStatus(entry);
    if (filter === 'all') return true;
    if (filter === 'sent') return status.id === 'sent';
    if (filter === 'errors') return status.id === 'error';
    return status.id === filter;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={(item, index) => `${item.at || index}-${item.name || index}`}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        ListHeaderComponent={(
          <>
            <View style={styles.top}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Sincronização</Text>
                <View style={styles.statusLine}>
                  <View style={[styles.statusDot, { backgroundColor: serverOk ? colors.active : colors.error }]} />
                  <Text style={styles.statusText}>{serverOk ? 'Servidor conectado' : 'Servidor desconectado'}</Text>
                  <View style={styles.vDivider} />
                  <Text style={styles.statusText}>Última sincronização: {formatLastSync(lastSync)}</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.syncBtn, syncing && { opacity: 0.65 }]} onPress={handleSync} disabled={syncing}>
                {syncing ? <ActivityIndicator color={colors.brand} size="small" /> : <RefreshCw size={17} color={colors.brand} strokeWidth={2} />}
                <Text style={styles.syncBtnText}>{syncing ? 'Sincronizando' : 'Sincronizar agora'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mainCard}>
              <View style={styles.ring}>
                <View style={[styles.ringArc, { borderColor: colors.brand }]} />
                <Text style={styles.ringValue}>{pct}%</Text>
                <Text style={styles.ringLabel}>Sincronizado</Text>
              </View>

              <View style={styles.counts}>
                <CountLine label="Enviados" value={counts.sent} color={colors.active} Icon={CheckCircle2} />
                <CountLine label="Enviando" value={counts.uploading} color={colors.uploading} Icon={UploadCloud} />
                <CountLine label="Pendentes" value={counts.pending} color={colors.warning} Icon={Clock3} />
                <CountLine label="Com erro" value={counts.errors} color={colors.error} Icon={AlertCircle} />
              </View>

              <View style={styles.networkBox}>
                <View style={styles.wifiCircle}><Wifi size={28} color={colors.active} strokeWidth={2.2} /></View>
                <Text style={styles.networkMuted}>Sincronizando via</Text>
                <Text style={styles.networkTitle}>Wi-Fi</Text>
                <View style={styles.wifiToggle}>
                  <Text style={styles.wifiToggleText}>Enviar apenas no Wi-Fi</Text>
                  <Switch value={wifiOnly} onValueChange={toggleWifiOnly} trackColor={{ false: colors.border, true: colors.brand }} thumbColor="#fff" />
                </View>
                <Text style={styles.networkMuted}>Economia de dados {wifiOnly ? 'ativa' : 'desativada'}</Text>
              </View>
            </View>

            <FlatList
              horizontal
              data={FILTERS}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
              renderItem={({ item }) => {
                const count = item.id === 'all' ? log.length
                  : item.id === 'sent' ? counts.sent
                  : item.id === 'errors' ? counts.errors
                  : item.id === 'uploading' ? counts.uploading
                  : counts.pending;
                return (
                  <TouchableOpacity style={[styles.filterChip, filter === item.id && styles.filterChipActive]} onPress={() => setFilter(item.id)}>
                    <Text style={[styles.filterText, filter === item.id && styles.filterTextActive]}>{item.label}</Text>
                    <View style={[styles.filterCount, filter === item.id && styles.filterCountActive]}>
                      <Text style={styles.filterCountText}>{count}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </>
        )}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Cloud size={50} color={colors.muted} strokeWidth={1.5} />
            <Text style={styles.emptyText}>Nenhum arquivo neste filtro.</Text>
          </View>
        )}
        renderItem={({ item }) => <UploadRow entry={item} />}
        ListFooterComponent={(
          <View style={styles.actionsBar}>
            <ActionButton label="Pausar envio" Icon={Pause} active />
            <ActionButton label="Continuar envio" Icon={Play} />
            <ActionButton label="Tentar novamente erros" Icon={RotateCw} color={colors.warning} />
            <ActionButton label="Filtros" Icon={SlidersHorizontal} />
            <ActionButton label="Limpar concluídos" Icon={Trash2} />
            <ActionButton label="Mais opções" Icon={MoreHorizontal} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function CountLine({ label, value, color, Icon }) {
  return (
    <View style={styles.countLine}>
      <Icon size={21} color={color} strokeWidth={2.1} />
      <Text style={styles.countValue}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

function UploadRow({ entry }) {
  const video = isVideoItem(entry);
  const status = getStatus(entry);
  const StatusIcon = status.Icon;
  const progress = status.id === 'uploading' ? (entry.progress || 72) : 0;

  return (
    <View style={styles.row}>
      <View style={styles.rowThumb}>
        {entry.uri && !video ? (
          <Image source={{ uri: entry.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : video ? (
          <Video size={21} color="#A78BFA" strokeWidth={1.8} />
        ) : (
          <ImageIcon size={21} color="#4EA3FF" strokeWidth={1.8} />
        )}
      </View>

      <View style={styles.fileCol}>
        <Text style={styles.fileName} numberOfLines={1}>{entry.name || 'Arquivo'}</Text>
        <Text style={styles.fileMeta} numberOfLines={1}>{formatBytes(entry.size)} · {video ? 'Vídeo' : 'Foto'}</Text>
        <Text style={styles.eventName} numberOfLines={1}>{entry.eventName || 'Sem evento vinculado'}</Text>
      </View>

      <View style={styles.statusCol}>
        <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        {status.id === 'uploading' ? (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        ) : (
          <Text style={styles.timeText}>{formatTime(entry.at)}</Text>
        )}
      </View>

      <TouchableOpacity style={styles.rowAction}>
        <StatusIcon size={21} color={status.color} strokeWidth={2.1} />
      </TouchableOpacity>
    </View>
  );
}

function ActionButton({ label, Icon, color = colors.textMid, active = false }) {
  return (
    <TouchableOpacity style={styles.actionBtn}>
      <View style={[styles.actionIcon, active && { borderColor: colors.brand }]}>
        <Icon size={19} color={active ? colors.brand : color} strokeWidth={2} />
      </View>
      <Text style={styles.actionLabel} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

function getCounts(log, stats, syncing, progress) {
  const sent = Math.max(stats.total || 0, log.filter((l) => l.ok).length);
  const errors = Math.max(stats.errors || 0, log.filter((l) => !l.ok).length);
  const uploading = syncing && progress?.total ? Math.max(0, progress.total - progress.uploaded) : log.filter((l) => l.status === 'uploading').length;
  const pending = log.filter((l) => l.status === 'pending').length;
  return { sent, errors, uploading, pending, totalWork: sent + errors + uploading + pending };
}

function getStatus(entry) {
  if (entry?.status === 'uploading') return { id: 'uploading', label: 'Enviando', color: colors.uploading, Icon: Pause };
  if (entry?.status === 'pending') return { id: 'pending', label: 'Pendente', color: colors.warning, Icon: Clock3 };
  if (!entry?.ok) return { id: 'error', label: 'Erro', color: colors.error, Icon: RotateCw };
  return { id: 'sent', label: 'Enviado', color: colors.active, Icon: CheckCircle2 };
}

function isVideoItem(entry) {
  return entry?.mediaType === 'video' || /\.(mp4|mov|avi|mkv|m4v|webm)$/i.test(entry?.name || '');
}

function formatLastSync(ts) {
  if (!ts) return 'Nunca';
  const d = new Date(Number(ts));
  const today = new Date();
  const day = d.toDateString() === today.toDateString() ? 'Hoje' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${day}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `Hoje, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatBytes(b) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 132 },
  top: { gap: 12, marginBottom: 18 },
  title: { color: colors.text, fontSize: 27, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 7 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: colors.textMid, fontSize: 12, fontFamily: 'Inter_500Medium' },
  vDivider: { width: 1, height: 14, backgroundColor: colors.border, marginHorizontal: 4 },
  syncBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: colors.brand, borderRadius: 12,
    paddingHorizontal: 13, paddingVertical: 10, backgroundColor: colors.brandFaded,
  },
  syncBtnText: { color: colors.brand, fontSize: 12, fontFamily: 'Inter_700Bold' },

  mainCard: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 18, padding: 14, marginBottom: 14,
  },
  ring: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 9, borderColor: 'rgba(59,130,246,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  ringArc: { ...StyleSheet.absoluteFillObject, borderWidth: 9, borderRadius: 48, opacity: 0.75 },
  ringValue: { color: colors.text, fontSize: 27, fontFamily: 'Inter_800ExtraBold' },
  ringLabel: { color: colors.brand, fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  counts: { flex: 1, gap: 9 },
  countLine: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  countValue: { color: colors.text, fontSize: 18, fontFamily: 'Inter_800ExtraBold', minWidth: 30 },
  countLabel: { color: colors.textMid, fontSize: 12, fontFamily: 'Inter_500Medium' },
  networkBox: {
    width: '100%', gap: 7, borderTopWidth: 1, borderTopColor: colors.border,
    paddingTop: 12, marginTop: 2,
  },
  wifiCircle: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: colors.activeBg, alignItems: 'center', justifyContent: 'center',
  },
  networkMuted: { color: colors.muted, fontSize: 11, fontFamily: 'Inter_400Regular' },
  networkTitle: { color: colors.text, fontSize: 18, fontFamily: 'Inter_800ExtraBold' },
  wifiToggle: {
    marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: 12, paddingLeft: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  wifiToggleText: { color: colors.text, fontSize: 11, fontFamily: 'Inter_600SemiBold', flex: 1 },

  filters: { gap: 9, paddingVertical: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 13, paddingVertical: 9,
    backgroundColor: colors.card, borderRadius: 11,
    borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  filterText: { color: colors.textMid, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  filterTextActive: { color: '#fff' },
  filterCount: { minWidth: 24, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(148,163,184,0.25)' },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.32)' },
  filterCountText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_800ExtraBold' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 10, marginTop: 8,
  },
  rowThumb: {
    width: 52, height: 52, borderRadius: 9,
    backgroundColor: colors.cardElev, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  fileCol: { flex: 1.25, minWidth: 0 },
  fileName: { color: colors.text, fontSize: 14, fontFamily: 'Inter_700Bold' },
  fileMeta: { color: colors.textMid, fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3 },
  eventName: { color: colors.brand, fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 3 },
  statusCol: { flex: 0.85, minWidth: 74 },
  statusLabel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  timeText: { color: colors.muted, fontSize: 12, marginTop: 5, fontFamily: 'Inter_400Regular' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  progressTrack: { flex: 1, height: 4, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.brand },
  progressText: { color: colors.textMid, fontSize: 12, fontFamily: 'Inter_600SemiBold', width: 34 },
  rowAction: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyText: { color: colors.muted, fontSize: 14, fontFamily: 'Inter_500Medium' },

  actionsBar: {
    marginTop: 18, flexDirection: 'row',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, overflow: 'hidden',
  },
  actionBtn: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 12, paddingHorizontal: 4, gap: 6 },
  actionIcon: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { color: colors.textMid, fontSize: 10, lineHeight: 13, textAlign: 'center', fontFamily: 'Inter_500Medium' },
});
