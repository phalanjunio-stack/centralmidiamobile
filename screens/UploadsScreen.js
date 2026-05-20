// Tela de Sincronização — design premium com ícones da marca Contourline
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { colors } from '../theme';
import { IC } from '../src/theme/icons';
import SyncRing from '../components/SyncRing';
import {
  getSyncLog, getSyncStats, getLastSync,
  getServerConfig, getSettings, saveSettings,
} from '../services/storage';
import { runSync } from '../services/sync';

const FILTERS = [
  { id: 'all',       label: 'Todos' },
  { id: 'uploading', label: 'Enviando' },
  { id: 'pending',   label: 'Pendentes' },
  { id: 'sent',      label: 'Enviados' },
  { id: 'errors',    label: 'Erros' },
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
            {/* HEADER */}
            <View style={styles.top}>
              <Text style={styles.title}>Sincronização</Text>
              <View style={styles.statusLine}>
                <View style={[styles.statusDot, { backgroundColor: serverOk ? colors.active : colors.error }]} />
                <Text style={styles.statusText}>{serverOk ? 'Servidor conectado' : 'Servidor desconectado'}</Text>
                <View style={styles.vDivider} />
                <Text style={styles.statusText}>Última sincronização: {formatLastSync(lastSync)}</Text>
              </View>

              <TouchableOpacity
                style={[styles.syncBtn, syncing && { opacity: 0.65 }]}
                onPress={handleSync}
                disabled={syncing}
                activeOpacity={0.85}
              >
                {syncing ? (
                  <ActivityIndicator color={colors.brand} size="small" />
                ) : (
                  <Image source={IC.sincronizando} style={styles.syncBtnIcon} />
                )}
                <Text style={styles.syncBtnText}>{syncing ? 'Sincronizando' : 'Sincronizar agora'}</Text>
              </TouchableOpacity>
            </View>

            {/* MAIN CARD */}
            <View style={styles.mainCard}>
              {/* Ring centralizado com bytes embaixo */}
              <View style={styles.ringWrap}>
                <SyncRing
                  pct={pct}
                  size={180}
                  stroke={13}
                  subLabel={formatBytesLabel(counts.bytesUploaded, counts.bytesTotal)}
                />
              </View>

              {/* Grade 2x2 de contadores */}
              <View style={styles.countsGrid}>
                <CountLine label="Enviados"  value={counts.sent}      icon={IC.enviado}    color={colors.active} />
                <CountLine label="Enviando"  value={counts.uploading} icon={IC.enviando}   color={colors.brand} />
                <CountLine label="Pendentes" value={counts.pending}   icon={IC.aguardando} color={colors.warning} />
                <CountLine label="Com erro"  value={counts.errors}    icon={IC.erro}       color={colors.error} />
              </View>


              {/* Wi-Fi section */}
              <View style={styles.networkBox}>
                <View style={styles.networkRow}>
                  <View style={styles.wifiCircle}>
                    <Image source={IC.wifi} style={styles.wifiIcon} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.networkMuted}>Sincronizando via</Text>
                    <Text style={styles.networkTitle}>Wi-Fi</Text>
                  </View>
                </View>

                <View style={styles.wifiToggleRow}>
                  <Text style={styles.wifiToggleText}>Enviar apenas no Wi-Fi</Text>
                  <Switch
                    value={wifiOnly}
                    onValueChange={toggleWifiOnly}
                    trackColor={{ false: '#1e293b', true: colors.brand }}
                    thumbColor="#fff"
                    ios_backgroundColor="#1e293b"
                  />
                </View>

                <Text style={styles.networkMuted}>
                  Economia de dados {wifiOnly ? 'ativa' : 'desativada'}
                </Text>
              </View>
            </View>

            {/* FILTERS */}
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
                  <TouchableOpacity
                    style={[styles.filterChip, filter === item.id && styles.filterChipActive]}
                    onPress={() => setFilter(item.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.filterText, filter === item.id && styles.filterTextActive]}>
                      {item.label}
                    </Text>
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
            <Image source={IC.nuvem} style={{ width: 56, height: 56, opacity: 0.4 }} />
            <Text style={styles.emptyText}>Nenhum arquivo neste filtro.</Text>
          </View>
        )}
        renderItem={({ item }) => <UploadRow entry={item} />}
        ListFooterComponent={(
          <View style={styles.actionsBar}>
            <ActionButton label="Pausar"      icon={IC.pausar}    active />
            <ActionButton label="Continuar"   icon={IC.play} />
            <ActionButton label="Retry erros" icon={IC.restaurar} color={colors.warning} />
            <ActionButton label="Filtros"     icon={IC.filtro} />
            <ActionButton label="Limpar"      icon={IC.excluir} />
            <ActionButton label="Mais"        icon={IC.maisOpcoes} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function CountLine({ label, value, icon, color }) {
  return (
    <View style={styles.countLine}>
      {/* Esquerda: número grande + label */}
      <View style={styles.countLeft}>
        <Text style={styles.countValue}>{value}</Text>
        <Text style={styles.countLabel}>{label}</Text>
      </View>
      {/* Direita: ícone colorido */}
      <Image source={icon} style={[styles.countIcon, { tintColor: color }]} />
    </View>
  );
}

function UploadRow({ entry }) {
  const video = isVideoItem(entry);
  const status = getStatus(entry);
  const progress = status.id === 'uploading' ? (entry.progress || 72) : 0;

  return (
    <View style={styles.row}>
      <View style={styles.rowThumb}>
        {entry.uri && !video ? (
          <Image source={{ uri: entry.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Image source={video ? IC.video : IC.foto} style={{ width: 24, height: 24, tintColor: video ? '#A78BFA' : '#4EA3FF' }} />
        )}
      </View>

      <View style={styles.fileCol}>
        <Text style={styles.fileName} numberOfLines={1}>{entry.name || 'Arquivo'}</Text>
        <Text style={styles.fileMeta} numberOfLines={1}>
          {formatBytes(entry.size)} · {video ? 'Vídeo' : 'Foto'}
        </Text>
        <Text style={styles.eventName} numberOfLines={1}>
          {entry.eventName || 'Sem evento vinculado'}
        </Text>
      </View>

      <View style={styles.statusCol}>
        <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        {status.id === 'uploading' ? (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        ) : (
          <Text style={styles.timeText}>{formatTime(entry.at)}</Text>
        )}
      </View>

      <TouchableOpacity style={styles.rowAction} activeOpacity={0.8}>
        <Image source={status.icon} style={{ width: 22, height: 22, tintColor: status.color }} />
      </TouchableOpacity>
    </View>
  );
}

function ActionButton({ label, icon, color = colors.textMid, active = false }) {
  return (
    <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85}>
      <View style={[styles.actionIcon, active && { borderColor: colors.brand, backgroundColor: 'rgba(31,139,255,0.08)' }]}>
        <Image source={icon} style={{ width: 18, height: 18, tintColor: active ? colors.brand : color }} />
      </View>
      <Text style={styles.actionLabel} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

function getCounts(log, stats, syncing, progress) {
  const sent = Math.max(stats.total || 0, log.filter((l) => l.ok).length);
  const errors = Math.max(stats.errors || 0, log.filter((l) => !l.ok).length);
  const uploading = syncing && progress?.total
    ? Math.max(0, progress.total - progress.uploaded)
    : log.filter((l) => l.status === 'uploading').length;
  const pending = log.filter((l) => l.status === 'pending').length;

  // Bytes — soma de tudo + enviados pra mostrar tipo "1.48 GB de 2.00 GB"
  const bytesUploaded = log.filter((l) => l.ok).reduce((acc, l) => acc + (l.size || 0), 0);
  const bytesTotal    = log.reduce((acc, l) => acc + (l.size || 0), 0);

  return {
    sent, errors, uploading, pending,
    totalWork: sent + errors + uploading + pending,
    bytesUploaded, bytesTotal,
  };
}

function formatBytesLabel(uploaded, total) {
  if (!total) return '0 B';
  const fmt = (b) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
    return `${(b / 1024 / 1024 / 1024).toFixed(2).replace('.', ',')} GB`;
  };
  return `${fmt(uploaded)} de ${fmt(total)}`;
}

function getStatus(entry) {
  if (entry?.status === 'uploading') return { id: 'uploading', label: 'Enviando',  color: colors.brand,   icon: IC.pausar };
  if (entry?.status === 'pending')   return { id: 'pending',   label: 'Pendente',  color: colors.warning, icon: IC.aguardando };
  if (!entry?.ok)                    return { id: 'error',     label: 'Erro',      color: colors.error,   icon: IC.restaurar };
  return                              { id: 'sent',      label: 'Enviado',   color: colors.active,  icon: IC.check };
}

function isVideoItem(entry) {
  return entry?.mediaType === 'video' || /\.(mp4|mov|avi|mkv|m4v|webm)$/i.test(entry?.name || '');
}

function formatLastSync(ts) {
  if (!ts) return 'Nunca';
  const d = new Date(Number(ts));
  const today = new Date();
  const day = d.toDateString() === today.toDateString()
    ? 'Hoje'
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
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

  /* HEADER */
  top: { gap: 12, marginBottom: 18 },
  title: { color: colors.text, fontSize: 27, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 7 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: colors.textMid, fontSize: 12, fontFamily: 'Inter_500Medium' },
  vDivider: { width: 1, height: 14, backgroundColor: colors.border, marginHorizontal: 4 },

  syncBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: colors.brand, borderRadius: 12,
    paddingHorizontal: 13, paddingVertical: 10, backgroundColor: 'rgba(31,139,255,0.10)',
  },
  syncBtnIcon: { width: 18, height: 18, tintColor: colors.brand },
  syncBtnText: { color: colors.brand, fontSize: 13, fontFamily: 'Inter_700Bold' },

  /* MAIN CARD */
  mainCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 18, padding: 16, marginBottom: 14,
    gap: 14,
  },
  /* Ring centralizado com bytes embaixo */
  ringWrap: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },

  /* Grade 2x2 dos contadores */
  countsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
  },
  countLine: {
    width: '47%', // 2 colunas com gap
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(8,14,26,0.6)',
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  countLeft: {
    flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 8,
  },
  countIcon: { width: 26, height: 26, resizeMode: 'contain' },
  countValue: { color: colors.text, fontSize: 22, fontFamily: 'Inter_800ExtraBold', minWidth: 28, textAlign: 'right' },
  countLabel: { color: colors.textMid, fontSize: 13.5, fontFamily: 'Inter_600SemiBold' },
  syncedLabel: {
    color: colors.brand, fontSize: 10, letterSpacing: 1.4,
    fontFamily: 'Inter_800ExtraBold', textAlign: 'center', marginTop: 4,
  },

  /* NETWORK */
  networkBox: {
    gap: 10, borderTopWidth: 1, borderTopColor: colors.border,
    paddingTop: 14,
  },
  networkRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  wifiCircle: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: 'rgba(0,193,106,0.12)',
    borderWidth: 1, borderColor: 'rgba(0,193,106,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  wifiIcon: { width: 28, height: 28, tintColor: '#00C16A' },
  networkMuted: { color: colors.muted, fontSize: 11, fontFamily: 'Inter_400Regular' },
  networkTitle: { color: colors.text, fontSize: 18, fontFamily: 'Inter_800ExtraBold' },

  wifiToggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0a1322',
    borderRadius: 12, paddingLeft: 14, paddingRight: 6, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  wifiToggleText: { color: colors.text, fontSize: 12.5, fontFamily: 'Inter_600SemiBold', flex: 1 },

  /* FILTERS */
  filters: { gap: 9, paddingVertical: 4, paddingRight: 16 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 13, paddingVertical: 9,
    backgroundColor: colors.card, borderRadius: 11,
    borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  filterText: { color: colors.textMid, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  filterTextActive: { color: '#fff' },
  filterCount: { minWidth: 24, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(148,163,184,0.25)', paddingHorizontal: 6 },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.32)' },
  filterCountText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_800ExtraBold' },

  /* ROW */
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 10, marginTop: 8,
  },
  rowThumb: {
    width: 52, height: 52, borderRadius: 9,
    backgroundColor: colors.cardElev || '#0a1322', overflow: 'hidden',
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
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },

  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyText: { color: colors.muted, fontSize: 14, fontFamily: 'Inter_500Medium' },

  /* ACTIONS BAR */
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
