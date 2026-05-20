// Galeria remota — busca mídias do evento ativo via sitelocal (que tem token Drive).
// Endpoints esperados no sitelocal (a serem implementados lá):
//   GET /api/events/:eventId/captures?cursor=...&limit=50
//     → { items: [{id, name, mediaType, sizeBytes, capturedAt, thumbUrl, fullUrl, deviceId, profileName, status}], nextCursor }
//   GET /api/captures/:id/thumb  → binary thumb
//   GET /api/captures/:id/full   → binary full
import { getServerConfig, getDeviceToken } from './storage';

const PAGE_SIZE = 50;
const TIMEOUT_MS = 10000;

async function fetchWithTimeout(url, opts = {}, ms = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Lista capturas remotas de um evento (paginado).
 * @param {string} eventId
 * @param {string|null} cursor
 * @returns {Promise<{items: array, nextCursor: string|null}>}
 */
export async function listRemoteCaptures(eventId, cursor = null) {
  const [cfg, token] = await Promise.all([getServerConfig(), getDeviceToken()]);
  if (!cfg?.serverUrl || !token || !eventId) {
    return { items: [], nextCursor: null };
  }

  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (cursor) params.set('cursor', cursor);

  const url = `${cfg.serverUrl}/api/events/${encodeURIComponent(eventId)}/captures?${params}`;
  try {
    const res = await fetchWithTimeout(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) {
      console.log('[galleryRemote] listRemoteCaptures status', res.status);
      return { items: [], nextCursor: null };
    }
    const data = await res.json();
    const items = (data?.items || []).map(item => normalizeRemoteItem(item, cfg.serverUrl));
    return { items, nextCursor: data?.nextCursor || null };
  } catch (e) {
    console.log('[galleryRemote] listRemoteCaptures falhou:', e?.message);
    return { items: [], nextCursor: null };
  }
}

function normalizeRemoteItem(raw, serverUrl) {
  // Normaliza pro mesmo shape do log local (services/storage.getSyncLog)
  const fullUrl  = raw.fullUrl  ? abs(raw.fullUrl, serverUrl)  : null;
  const thumbUrl = raw.thumbUrl ? abs(raw.thumbUrl, serverUrl) : fullUrl;
  return {
    id:         raw.id,
    name:       raw.name,
    mediaType:  raw.mediaType || 'photo',
    size:       raw.sizeBytes || raw.size || 0,
    at:         raw.capturedAt ? new Date(raw.capturedAt).getTime() : Date.now(),
    uri:        fullUrl,
    thumbUri:   thumbUrl,
    ok:         raw.status === 'sent' || raw.status === 'synced',
    eventId:    raw.eventId,
    eventName:  raw.eventName,
    deviceId:   raw.deviceId,
    profileName:raw.profileName,
    serverPath: raw.serverPath,
    remote:     true, // marca pra UI saber que é remoto
  };
}

function abs(url, base) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Mescla itens locais + remotos, deduplicando por id ou nome.
 */
export function mergeLocalAndRemote(local, remote) {
  const byKey = new Map();
  for (const item of remote) {
    const key = item.id || item.name;
    if (key) byKey.set(key, item);
  }
  for (const item of local) {
    const key = item.id || item.name;
    if (!key) continue;
    const existing = byKey.get(key);
    if (existing) {
      // Item já está no remoto — mantém remoto mas preserva uri local pra preview rápida
      byKey.set(key, { ...existing, localUri: item.uri });
    } else {
      byKey.set(key, item);
    }
  }
  return Array.from(byKey.values()).sort((a, b) => (b.at || 0) - (a.at || 0));
}
