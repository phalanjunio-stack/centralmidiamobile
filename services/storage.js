import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SERVER_CONFIG:  '@contourline/server_config',
  DEVICE_TOKEN:   '@contourline/device_token',   // NOVO: token de auth pareado
  DEVICE_ID:      '@contourline/device_id',      // NOVO: id do device no server
  ACTIVE_EVENT:   '@contourline/active_event',
  DEVICE_PROFILE: '@contourline/device_profile',
  LAST_SYNC:      '@contourline/last_sync',
  SYNC_STATS:     '@contourline/sync_stats',
  SYNC_LOG:       '@contourline/sync_log',
  UPLOAD_QUEUE:   '@contourline/upload_queue',
  SETTINGS:       '@contourline/settings',
};

// ── Device Token (substitui senha após pareamento) ──
export async function getDeviceToken() {
  return AsyncStorage.getItem(KEYS.DEVICE_TOKEN);
}
export async function setDeviceToken(token) {
  if (!token) return AsyncStorage.removeItem(KEYS.DEVICE_TOKEN);
  await AsyncStorage.setItem(KEYS.DEVICE_TOKEN, token);
}
export async function getDeviceId() {
  return AsyncStorage.getItem(KEYS.DEVICE_ID);
}
export async function setDeviceId(id) {
  if (!id) return AsyncStorage.removeItem(KEYS.DEVICE_ID);
  await AsyncStorage.setItem(KEYS.DEVICE_ID, id);
}

// ── Config do servidor (URL + senha) ──
export async function getServerConfig() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SERVER_CONFIG);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function saveServerConfig(config) {
  await AsyncStorage.setItem(KEYS.SERVER_CONFIG, JSON.stringify(config));
}

// ── Evento ativo ──
// { id, name, folder, startDate, endDate, coverUrl, location, type, owner }
export async function getActiveEvent() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ACTIVE_EVENT);
    if (!raw) return null;
    const ev = JSON.parse(raw);
    // Verifica se já expirou
    if (ev.endDate) {
      const end = new Date(ev.endDate);
      end.setHours(23, 59, 59);
      if (Date.now() > end.getTime()) {
        ev.expired = true;
      }
    }
    return ev;
  } catch { return null; }
}

export async function setActiveEvent(event) {
  if (!event) {
    await AsyncStorage.removeItem(KEYS.ACTIVE_EVENT);
    return;
  }
  await AsyncStorage.setItem(KEYS.ACTIVE_EVENT, JSON.stringify(event));
}

// Calcula qual dia do evento está rodando (1, 2, 3…)
export function getEventDay(event, date = new Date()) {
  if (!event?.startDate) return null;
  const start = new Date(event.startDate);
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffMs = target - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : null;
}

export function getTotalEventDays(event) {
  if (!event?.startDate || !event?.endDate) return null;
  const start = new Date(event.startDate);
  const end   = new Date(event.endDate);
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

// ── Perfil do dispositivo ──
// { id, name, photoUri, phoneModel, createdAt }
export async function getDeviceProfile() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.DEVICE_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function saveDeviceProfile(profile) {
  await AsyncStorage.setItem(KEYS.DEVICE_PROFILE, JSON.stringify(profile));
}

// ── Settings (preferências) ──
const DEFAULT_SETTINGS = {
  autoSync:       true,
  wifiOnly:       false,
  compressLarge:  true,
  pauseLowBattery:true,
  minBattery:     20,
  notifications:  true,
};

export async function getSettings() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

export async function saveSettings(settings) {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// ── Clear tudo (desconectar) ──
export async function clearAll() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

// ── Controle de sync ──
export async function getLastSync() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LAST_SYNC);
    return raw ? parseInt(raw, 10) : 0;
  } catch { return 0; }
}

export async function setLastSync(timestamp) {
  await AsyncStorage.setItem(KEYS.LAST_SYNC, String(timestamp));
}

// ── Estatísticas ──
export async function getSyncStats() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SYNC_STATS);
    return raw ? JSON.parse(raw) : { total: 0, today: 0, errors: 0, lastDate: null };
  } catch { return { total: 0, today: 0, errors: 0, lastDate: null }; }
}

export async function updateSyncStats(uploaded, errors = 0) {
  const stats = await getSyncStats();
  const today = new Date().toDateString();
  stats.total  += uploaded;
  stats.errors += errors;
  stats.today   = stats.lastDate === today ? stats.today + uploaded : uploaded;
  stats.lastDate = today;
  await AsyncStorage.setItem(KEYS.SYNC_STATS, JSON.stringify(stats));
  return stats;
}

// ── Log de uploads recentes ──
export async function getSyncLog() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SYNC_LOG);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function addSyncLogEntry(entry) {
  const log = await getSyncLog();
  log.unshift({ ...entry, at: Date.now() });
  const trimmed = log.slice(0, 200);
  await AsyncStorage.setItem(KEYS.SYNC_LOG, JSON.stringify(trimmed));
}

// ── Upload queue (fila local com retry) ──
// [{ assetId, filename, size, mediaType, status: 'pending'|'uploading'|'error', progress, error, eventId, attempts }]
export async function getUploadQueue() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.UPLOAD_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function setUploadQueue(queue) {
  await AsyncStorage.setItem(KEYS.UPLOAD_QUEUE, JSON.stringify(queue.slice(0, 500)));
}
