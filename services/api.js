import { getServerConfig, getDeviceToken } from './storage';

// ── Polyfill de AbortSignal.timeout (Hermes não tem isso) ──
function timeoutSignal(ms) {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

// ── Builds auth headers — prefere device token, cai pra senha ──
async function authHeaders() {
  const token = await getDeviceToken();
  if (token) return { 'x-device-token': token };
  const config = await getServerConfig();
  if (config?.password) return { 'x-app-password': config.password };
  return {};
}

// ── Helper genérico ──
async function apiFetch(endpoint, options = {}) {
  const config = await getServerConfig();
  if (!config?.serverUrl) {
    throw new Error('Servidor não configurado');
  }
  const url = config.serverUrl.replace(/\/$/, '') + endpoint;
  const headers = {
    ...(await authHeaders()),
    'Accept': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    ...options,
    headers,
    signal: options.signal || timeoutSignal(options.timeoutMs || 15000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let msg = text;
    try { const j = JSON.parse(text); msg = j.error || j.message || text; } catch {}
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return await res.json();
}

// ── Verifica conexão (com token ou senha) ──
export async function pingServer(serverUrl, opts = {}) {
  const url = serverUrl.replace(/\/$/, '') + '/api/auth/status';
  const headers = {};
  if (opts.token)    headers['x-device-token'] = opts.token;
  if (opts.password) headers['x-app-password'] = opts.password;
  const res = await fetch(url, {
    headers,
    signal: timeoutSignal(8000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let msg = text;
    try { msg = JSON.parse(text).error || msg; } catch {}
    throw new Error(msg || 'Servidor indisponível');
  }
  return await res.json();
}

// ── Pareamento: envia pair code, recebe deviceToken + lista de usuários ──
export async function pairDevice(serverUrl, pairCode, phoneModel) {
  const url = serverUrl.replace(/\/$/, '') + '/api/devices/pair';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pairCode, phoneModel }),
    signal: timeoutSignal(10000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao parear');
  return data;
}

// ── Claim: vincula o device a um perfil de videomaker ──
export async function claimDeviceProfile(deviceId, userId, newUser) {
  return apiFetch(`/api/devices/${encodeURIComponent(deviceId)}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, newUser }),
  });
}

// ── Lista de videomakers pré-cadastrados ──
export async function listUsers() {
  return apiFetch('/api/users');
}

// ── Upload de captura direta (foto/vídeo da câmera do app) ──
// uri: caminho local do arquivo (file://...)
// mediaType: 'photo' ou 'video'
// activeEvent: evento atual (opcional)
// profile: device profile (id, name)
export async function uploadCapture({ uri, mediaType, activeEvent, profile, onProgress }) {
  const config = await getServerConfig();
  if (!config?.serverUrl) throw new Error('Servidor não configurado');

  const ext = mediaType === 'video' ? 'mp4' : 'jpg';
  const mime = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
  const ts = Date.now();
  const filename = `${mediaType}_${ts}.${ext}`;

  // ⚠ IMPORTANTE: text fields ANTES do file
  // Multer processa o multipart em ordem, e o destination() do file
  // precisa ler eventFolder/deviceName de req.body — então precisam vir antes.
  const fd = new FormData();
  fd.append('source', 'camera-app');
  fd.append('originalDate', String(ts));
  fd.append('deviceId',   profile?.id || 'unknown');
  fd.append('deviceName', profile?.name || 'Celular');

  if (activeEvent && !activeEvent.expired) {
    fd.append('eventId',     activeEvent.id);
    fd.append('eventName',   activeEvent.name || '');
    fd.append('eventFolder', activeEvent.folder || '');
    // Calcula o dia do evento
    if (typeof activeEvent.startDate === 'string') {
      const start = new Date(activeEvent.startDate);
      start.setHours(0,0,0,0);
      const captureDate = new Date(ts);
      captureDate.setHours(0,0,0,0);
      const diffDays = Math.floor((captureDate - start) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) fd.append('eventDay', String(diffDays));
    }
  }

  // File POR ÚLTIMO
  fd.append('file', { uri, name: filename, type: mime });

  const headers = await authHeaders();
  const url = config.serverUrl.replace(/\/$/, '') + '/api/upload/mobile';

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'multipart/form-data' },
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return await res.json();
}

// ── Eventos ──
export async function listEvents() {
  // GET /api/events/mobile → lista eventos com {id, name, folder, startDate, endDate, coverUrl, location, type, owner, status}
  return apiFetch('/api/events/mobile');
}

export async function getEvent(eventId) {
  return apiFetch(`/api/events/mobile/${encodeURIComponent(eventId)}`);
}

// ── Devices ──
// Registra/atualiza perfil do device no servidor
export async function registerDevice(profile) {
  return apiFetch('/api/devices/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
}

// Faz upload da foto do perfil (multipart)
export async function uploadDevicePhoto(deviceId, photoUri) {
  const config = await getServerConfig();
  const fd = new FormData();
  fd.append('photo', {
    uri: photoUri,
    name: `device_${deviceId}.jpg`,
    type: 'image/jpeg',
  });
  fd.append('deviceId', deviceId);
  const url = config.serverUrl.replace(/\/$/, '') + '/api/devices/photo';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-app-password': config.password,
      'Content-Type': 'multipart/form-data',
    },
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
