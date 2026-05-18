import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  TextInput, Dimensions, RefreshControl, Modal, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme';
import { IC } from '../src/theme/icons';
import LogoIcon from '../components/icons/LogoIcon';
import {
  getDeviceProfile, getActiveEvent, getSyncLog, getSyncStats,
} from '../services/storage';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = 16;
const GRID_GAP = 7;
const COLUMNS = 3;
const ITEM_W = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;
const ITEM_H = ITEM_W * 0.78;

export default function GalleryScreen() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [event, setEvent] = useState(null);
  const [log, setLog] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, errors: 0 });
  const [selected, setSelected] = useState(null);

  async function loadData() {
    const [p, ev, lg, st] = await Promise.all([
      getDeviceProfile(), getActiveEvent(), getSyncLog(), getSyncStats(),
    ]);
    setProfile(p);
    setEvent(ev);
    setLog(lg);
    setStats(st);
  }

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const items = useMemo(() => {
    let list = log;
    if (event?.id) list = list.filter((item) => item.eventId === event.id);
    if (filter === 'photo') list = list.filter((item) => !isVideoItem(item));
    if (filter === 'video') list = list.filter((item) => isVideoItem(item));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((item) =>
        [item.name, item.eventName, item.serverPath].filter(Boolean).join(' ').toLowerCase().includes(q)
      );
    }
    return list;
  }, [log, event, filter, search]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const key = dayKey(item.at);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [items]);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        >
          <View style={styles.header}>
            <View style={styles.brand}>
              <LogoIcon size={34} color="#fff" />
              <Text style={styles.brandText}>contourline</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton}>
                <Image source={IC.notificacao} style={{ width: 18, height: 18, tintColor: '#fff' }} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatar}>
                {profile?.photoUri ? (
                  <Image source={{ uri: profile.photoUri }} style={styles.avatarImg} />
                ) : (
                  <Image source={IC.perfil} style={{ width: 20, height: 20, tintColor: colors.textMid }} />
                )}
                <View style={styles.onlineDot} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <Chip label="Todas"      active={filter === 'all'}   onPress={() => setFilter('all')} />
            <Chip label="Fotos"      active={filter === 'photo'} onPress={() => setFilter('photo')} iconSrc={IC.foto} />
            <Chip label="Vídeos"     active={filter === 'video'} onPress={() => setFilter('video')} iconSrc={IC.video} />
            <Chip label="Documentos" active={false}              onPress={() => {}} iconSrc={IC.relatorio} />
            <TouchableOpacity style={styles.filterOnly}>
              <Image source={IC.filtro} style={{ width: 18, height: 18, tintColor: colors.textMid }} />
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Image source={IC.buscar} style={{ width: 16, height: 16, tintColor: colors.muted }} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar na galeria..."
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
              />
            </View>
            <TouchableOpacity style={styles.sortButton}>
              <Text style={styles.sortText}>Mais recentes</Text>
              <Image source={IC.chevronBaixo} style={{ width: 12, height: 12, tintColor: colors.textMid }} />
            </TouchableOpacity>
            <View style={styles.viewToggle}>
              <TouchableOpacity style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]} onPress={() => setViewMode('grid')}>
                <Image source={IC.galeria} style={{ width: 14, height: 14, tintColor: viewMode === 'grid' ? '#fff' : colors.muted }} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]} onPress={() => setViewMode('list')}>
                <Image source={IC.menu} style={{ width: 14, height: 14, tintColor: viewMode === 'list' ? '#fff' : colors.muted }} />
              </TouchableOpacity>
            </View>
          </View>

          {groups.length === 0 ? (
            <View style={styles.empty}>
              <Image source={IC.foto} style={{ width: 48, height: 48, tintColor: 'rgba(255,255,255,0.24)' }} />
              <Text style={styles.emptyTitle}>Nenhuma mídia ainda</Text>
              <Text style={styles.emptySub}>Fotos e vídeos da atividade ativa aparecem aqui.</Text>
            </View>
          ) : groups.map((group) => (
            <View key={group.title}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <Text style={styles.groupCount}>{group.data.length} itens</Text>
              </View>
              {viewMode === 'grid' ? (
                <View style={styles.grid}>
                  {group.data.map((item, index) => (
                    <GridItem key={`${item.name}-${index}`} item={item} onPress={() => setSelected(item)} />
                  ))}
                </View>
              ) : (
                <View style={styles.list}>
                  {group.data.map((item, index) => (
                    <ListItem key={`${item.name}-${index}`} item={item} onPress={() => setSelected(item)} />
                  ))}
                </View>
              )}
            </View>
          ))}

        </ScrollView>
      </SafeAreaView>

      <SyncFooter stats={stats} items={items} />

      <ItemDetailModal
        item={selected}
        onClose={() => setSelected(null)}
        onShare={async () => {
          if (!selected?.uri) return;
          try { await Share.share({ url: selected.uri, message: selected.name }); } catch {}
        }}
      />
    </View>
  );
}

function Chip({ label, active, onPress, iconSrc }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress} activeOpacity={0.85}>
      {iconSrc ? (
        <Image source={iconSrc} style={{ width: 13, height: 13, tintColor: active ? '#fff' : colors.textMid, resizeMode: 'contain' }} />
      ) : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function GridItem({ item, onPress }) {
  const video = isVideoItem(item);
  return (
    <TouchableOpacity style={styles.gridItem} activeOpacity={0.86} onPress={onPress}>
      {item.uri && !video ? (
        <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={styles.gridPlaceholder}>
          <Image source={video ? IC.video : IC.foto} style={{ width: 26, height: 26, tintColor: video ? '#A78BFA' : '#4EA3FF' }} />
        </View>
      )}
      <View style={styles.mediaBadge}>
        <Image source={video ? IC.video : IC.foto} style={{ width: 10, height: 10, tintColor: '#fff' }} />
      </View>
      {item.favorite ? (
        <View style={styles.starBadge}>
          <Image source={IC.favorito} style={{ width: 12, height: 12, tintColor: '#fff' }} />
        </View>
      ) : null}
      {video ? <Text style={styles.videoDuration}>0:42</Text> : null}
    </TouchableOpacity>
  );
}

function ListItem({ item, onPress }) {
  const video = isVideoItem(item);
  return (
    <TouchableOpacity style={styles.listItem} activeOpacity={0.84} onPress={onPress}>
      <View style={styles.listThumb}>
        {item.uri && !video ? (
          <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Image source={video ? IC.video : IC.foto} style={{ width: 18, height: 18, tintColor: video ? '#A78BFA' : '#4EA3FF' }} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.listName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.listMeta} numberOfLines={1}>{formatBytes(item.size)} · {video ? 'Vídeo' : 'Foto'}</Text>
      </View>
      <Image source={item.ok ? IC.check : IC.atencao} style={{ width: 18, height: 18, tintColor: item.ok ? colors.active : colors.error }} />
    </TouchableOpacity>
  );
}

function SyncFooter({ stats, items }) {
  const sent = items.filter((item) => item.ok).length || stats.total || 0;
  const errors = items.filter((item) => !item.ok).length || stats.errors || 0;
  return (
    <View style={styles.syncFooter}>
      <View style={styles.syncLeft}>
        <Image source={IC.sincronizando} style={{ width: 18, height: 18, tintColor: colors.textMid }} />
        <View>
          <Text style={styles.syncLabel}>Sincronização</Text>
          <Text style={styles.syncSub}>Última: Hoje, 09:40</Text>
        </View>
      </View>
      <SyncMetric label="Enviados"  value={sent}    color={colors.active}    iconSrc={IC.check} />
      <SyncMetric label="Enviando"  value={0}       color={colors.uploading} iconSrc={IC.enviando} />
      <SyncMetric label="Pendentes" value={0}       color={colors.warning}   iconSrc={IC.aguardando} />
      <SyncMetric label="Com erro"  value={errors}  color={colors.error}     iconSrc={IC.erro} />
    </View>
  );
}

function SyncMetric({ label, value, color, iconSrc }) {
  return (
    <View style={styles.syncMetric}>
      <Text style={styles.syncMetricLabel}>{label}</Text>
      <View style={styles.syncMetricRow}>
        <Text style={styles.syncMetricValue}>{value}</Text>
        <Image source={iconSrc} style={{ width: 13, height: 13, tintColor: color }} />
      </View>
    </View>
  );
}

function ItemDetailModal({ item, onClose, onShare }) {
  if (!item) return null;
  const video = isVideoItem(item);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={detail.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <SafeAreaView edges={['top']} style={detail.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={detail.name} numberOfLines={1}>{item.name}</Text>
            {item.eventName ? <Text style={detail.event}>{item.eventName}</Text> : null}
          </View>
          <TouchableOpacity style={detail.closeBtn} onPress={onClose}>
            <Image source={IC.fechar} style={{ width: 18, height: 18, tintColor: '#fff' }} />
          </TouchableOpacity>
        </SafeAreaView>

        <View style={detail.imageWrap}>
          {item.uri && !video ? (
            <Image source={{ uri: item.uri }} style={detail.image} resizeMode="contain" />
          ) : (
            <View style={detail.placeholder}>
              <Image source={video ? IC.video : IC.foto} style={{ width: 58, height: 58, tintColor: 'rgba(255,255,255,0.35)' }} />
              <Text style={detail.placeholderText}>{video ? 'Prévia de vídeo indisponível' : 'Pré-visualização indisponível'}</Text>
            </View>
          )}
        </View>

        <SafeAreaView edges={['bottom']} style={detail.bottomBar}>
          {item.serverPath ? (
            <View style={detail.infoRow}>
              <Image source={IC.galeria} style={{ width: 14, height: 14, tintColor: colors.brand }} />
              <Text style={detail.infoText} numberOfLines={1}>{item.serverPath}</Text>
            </View>
          ) : null}
          <View style={detail.actions}>
            <TouchableOpacity style={detail.actionBtn} onPress={onShare}>
              <Image source={IC.compartilhar} style={{ width: 20, height: 20, tintColor: '#fff' }} />
              <Text style={detail.actionLabel}>Compartilhar</Text>
            </TouchableOpacity>
            {!item.ok ? (
              <TouchableOpacity style={detail.actionBtn}>
                <Image source={IC.restaurar} style={{ width: 20, height: 20, tintColor: colors.warning }} />
                <Text style={[detail.actionLabel, { color: colors.warning }]}>Reenviar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function isVideoItem(item) {
  return item?.mediaType === 'video' || /\.(mp4|mov|avi|mkv|m4v|webm)$/i.test(item?.name || '');
}

function dayKey(ts) {
  const d = new Date(ts || Date.now());
  const today = new Date();
  const date = `${String(d.getDate()).padStart(2, '0')} de ${monthName(d)} de ${d.getFullYear()}`;
  if (d.toDateString() === today.toDateString()) return `Hoje · ${date}`;
  const y = new Date(today); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return `Ontem · ${date}`;
  return date;
}

function monthName(d) {
  return d.toLocaleDateString('pt-BR', { month: 'long' });
}

function formatBytes(b) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 230 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 18,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { color: colors.text, fontSize: 20, fontFamily: 'Inter_800ExtraBold' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.cardElev, alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { backgroundColor: colors.cardElev },
  onlineDot: {
    position: 'absolute', right: 0, bottom: 0,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: colors.active, borderWidth: 2, borderColor: colors.bg,
  },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    height: 42, paddingHorizontal: 15, borderRadius: 9,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.textMid, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  chipTextActive: { color: '#fff' },
  filterOnly: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, marginBottom: 14,
  },
  searchBox: {
    flex: 1, height: 42, borderRadius: 10,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 13, fontFamily: 'Inter_500Medium' },
  sortButton: {
    height: 42, flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, borderRadius: 10,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  sortText: { color: colors.textMid, fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  viewToggle: {
    height: 42, flexDirection: 'row', borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  viewButton: { width: 35, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  viewButtonActive: { backgroundColor: colors.brand },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginTop: 12, marginBottom: 9,
  },
  groupTitle: { color: colors.text, fontSize: 14, fontFamily: 'Inter_800ExtraBold' },
  groupCount: { color: colors.textMid, fontSize: 12, fontFamily: 'Inter_500Medium' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, paddingHorizontal: GRID_PADDING },
  gridItem: {
    width: ITEM_W, height: ITEM_H, borderRadius: 9, overflow: 'hidden',
    backgroundColor: colors.cardElev, borderWidth: 1, borderColor: colors.border,
  },
  gridPlaceholder: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  mediaBadge: {
    position: 'absolute', left: 6, bottom: 6,
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.62)', alignItems: 'center', justifyContent: 'center',
  },
  starBadge: { position: 'absolute', right: 8, top: 8 },
  videoDuration: {
    position: 'absolute', top: 7, right: 8,
    color: '#fff', fontSize: 12, fontFamily: 'Inter_800ExtraBold',
    backgroundColor: 'rgba(0,0,0,0.38)', paddingHorizontal: 5, borderRadius: 6,
  },
  list: { paddingHorizontal: 16, gap: 8 },
  listItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 10,
  },
  listThumb: {
    width: 46, height: 46, borderRadius: 8, overflow: 'hidden',
    backgroundColor: colors.cardElev, alignItems: 'center', justifyContent: 'center',
  },
  listName: { color: colors.text, fontSize: 13, fontFamily: 'Inter_700Bold' },
  listMeta: { color: colors.muted, fontSize: 11, marginTop: 2 },
  syncFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 92,
    borderWidth: 1, borderColor: colors.border, borderRadius: 16,
    backgroundColor: 'rgba(15,23,42,0.95)',
    flexDirection: 'row', alignItems: 'center',
    padding: 12, gap: 10,
  },
  syncLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1.35 },
  syncLabel: { color: colors.textMid, fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  syncSub: { color: colors.muted, fontSize: 10, marginTop: 2 },
  syncMetric: { flex: 1, gap: 3 },
  syncMetricLabel: { color: colors.muted, fontSize: 10, fontFamily: 'Inter_500Medium' },
  syncMetricRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  syncMetricValue: { color: colors.text, fontSize: 15, fontFamily: 'Inter_800ExtraBold' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 48, gap: 8 },
  emptyTitle: { color: colors.text, fontSize: 15, fontFamily: 'Inter_800ExtraBold' },
  emptySub: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});

const detail = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, gap: 12, zIndex: 10 },
  name: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  event: { color: colors.muted, fontSize: 11, marginTop: 2 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' },
  imageWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  image: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', gap: 12 },
  placeholderText: { color: colors.muted, fontSize: 13, fontFamily: 'Inter_500Medium' },
  bottomBar: { backgroundColor: 'rgba(0,0,0,0.72)', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { color: colors.textMid, fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  actionLabel: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
});
