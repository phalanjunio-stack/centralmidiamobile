import * as MediaLibrary    from 'expo-media-library';
import * as BackgroundFetch  from 'expo-background-fetch';
import * as TaskManager      from 'expo-task-manager';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Network          from 'expo-network';

import {
  getServerConfig,
  getActiveEvent, getEventDay,
  getDeviceProfile, getDeviceToken,
  getLastSync, setLastSync,
  updateSyncStats, addSyncLogEntry,
  getSettings,
} from './storage';
import { showLocalNotification } from './notify';

const TASK_NAME = 'contourline-bg-sync';

// ── Registra tarefa de background ──
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const result = await runSync({ silent: true });
    return result.uploaded > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync() {
  try {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 15 * 60, // 15 minutos
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (e) {
    console.log('Background sync já registrado ou erro:', e.message);
  }
}

export async function unregisterBackgroundSync() {
  try { await BackgroundFetch.unregisterTaskAsync(TASK_NAME); } catch {}
}

// ── Polyfill AbortSignal.timeout (Hermes não tem) ──
function _timeoutSignal(ms) {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

// ── Conexão ──
export async function testConnection(serverUrl, password) {
  const url = serverUrl.replace(/\/$/, '') + '/api/auth/status';
  const res = await fetch(url, {
    headers: { 'x-app-password': password },
    signal: _timeoutSignal(8000),
  });
  if (!res.ok) throw new Error('Senha incorreta ou servidor indisponível');
  return await res.json();
}

// ── Sync principal ──
export async function runSync({ onProgress, silent = false } = {}) {
  const config   = await getServerConfig();
  const event    = await getActiveEvent();
  const profile  = await getDeviceProfile();
  const settings = await getSettings();
  const token    = await getDeviceToken();

  if (!config?.serverUrl || (!config?.password && !token)) throw new Error('Servidor não configurado');

  // Checa conectividade
  const net = await Network.getNetworkStateAsync();
  if (!net.isConnected) throw new Error('Sem conexão');
  if (settings.wifiOnly && net.type !== Network.NetworkStateType.WIFI) {
    throw new Error('Sync configurado apenas para Wi-Fi');
  }

  // Pede permissão da galeria
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') throw new Error('Permissão negada para galeria');

  const lastSync = await getLastSync();
  const createdAfter = lastSync > 0 ? lastSync : Date.now() - 30 * 24 * 60 * 60 * 1000;

  const assets = await getNewAssets(createdAfter);
  if (!assets.length) return { uploaded: 0, errors: 0 };

  onProgress?.({ total: assets.length, uploaded: 0, current: null });

  let uploaded = 0;
  let errors   = 0;
  const newLastSync = Date.now();

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    onProgress?.({ total: assets.length, uploaded: i, current: asset.filename });

    try {
      const result = await uploadAsset(asset, config, event, profile);
      uploaded++;
      await addSyncLogEntry({
        name: result?.name || asset.filename,
        size: result?.size || asset.fileSize,
        ok: true,
        uri: asset.uri,
        mediaType: asset.mediaType === MediaLibrary.MediaType.video ? 'video' : 'photo',
        eventId: event?.id || null,
        eventName: event?.name || null,
        serverPath: result?.path || null,
      });
    } catch (e) {
      errors++;
      await addSyncLogEntry({
        name: asset.filename,
        ok: false,
        error: e.message,
        uri: asset.uri,
        mediaType: asset.mediaType === MediaLibrary.MediaType.video ? 'video' : 'photo',
        eventId: event?.id || null,
        eventName: event?.name || null,
      });
    }
  }

  await setLastSync(newLastSync);
  const stats = await updateSyncStats(uploaded, errors);

  if (!silent && uploaded > 0 && settings.notifications !== false) {
    await showLocalNotification({
      title: event ? `${event.name}` : 'Contourline Backup',
      body: `${uploaded} arquivo(s) sincronizado(s)`,
      badge: stats.total,
    });
  }

  onProgress?.({ total: assets.length, uploaded, current: null, done: true });
  return { uploaded, errors };
}

// ── Busca assets novos da galeria ──
async function getNewAssets(createdAfter) {
  const all = [];
  let after = undefined;

  while (true) {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
      sortBy:    [MediaLibrary.SortBy.creationTime],
      first:     100,
      after,
    });

    for (const asset of page.assets) {
      if (asset.creationTime > createdAfter) all.push(asset);
    }
    if (!page.hasNextPage) break;
    after = page.endCursor;
  }
  return all;
}

// ── Upload de um asset ──
async function uploadAsset(asset, config, event, profile) {
  const settings = await getSettings();
  const info = await MediaLibrary.getAssetInfoAsync(asset);
  const uri  = info.localUri || info.uri;

  // Comprime imagens grandes (> 5MB) se setting ativo
  let uploadUri = uri;
  if (settings.compressLarge !== false
      && asset.mediaType === MediaLibrary.MediaType.photo
      && asset.fileSize > 5 * 1024 * 1024) {
    try {
      const compressed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 2048 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      uploadUri = compressed.uri;
    } catch {
      uploadUri = uri;
    }
  }

  const serverUrl = config.serverUrl.replace(/\/$/, '');
  const uploadUrl = `${serverUrl}/api/upload/mobile`;

  const formData = new FormData();
  formData.append('source',       'mobile');
  formData.append('originalDate', String(asset.creationTime));
  formData.append('deviceId',     profile?.id || 'unknown');
  formData.append('deviceName',   profile?.name || 'Celular');

  // Evento ativo — se houver e não estiver expirado
  if (event && !event.expired) {
    formData.append('eventId',     event.id);
    formData.append('eventName',   event.name || '');
    formData.append('eventFolder', event.folder || '');
    const dayNum = getEventDay(event, new Date(asset.creationTime));
    if (dayNum) formData.append('eventDay', String(dayNum));
  }

  formData.append('file', {
    uri:  uploadUri,
    name: asset.filename,
    type: asset.mediaType === MediaLibrary.MediaType.video ? 'video/mp4' : 'image/jpeg',
  });

  // Auth headers — prefere device token (novo), cai pra senha (legado)
  const token = await getDeviceToken();
  const authHeaders = token
    ? { 'x-device-token': token }
    : { 'x-app-password': config.password };

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => String(res.status));
    throw new Error(text);
  }
  return await res.json();
}
