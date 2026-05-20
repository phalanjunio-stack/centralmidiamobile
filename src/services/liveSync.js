// WebSocket client com sitelocal — sync em tempo real
// Protocolo descrito em sitelocal/ESTRUTURA_MOBILE.md
//
// Mensagens server → client:
//   SYNC_STATUS       { synced, pending, errors }
//   CAPTURE_RECEIVED  { id, name, eventId, deviceId, profileName }
//   DRIVE_SYNCED      { captureId, driveUrl }
//   SERVER_INFO       { name, diskFree }
//   ERROR             { code, message }
//
// Reconnect exponential backoff, ping a cada 25s.
import { getServerConfig, getDeviceToken } from '../../services/storage';

const PING_INTERVAL_MS = 25000;
const MAX_BACKOFF_MS   = 30000;

class LiveSync {
  constructor() {
    this.ws = null;
    this.listeners = new Set();        // (event) => void
    this.statusListeners = new Set();  // (state: 'connecting'|'open'|'closed'|'error') => void
    this.connected = false;
    this.backoffMs = 1000;
    this.pingTimer = null;
    this.reconnectTimer = null;
    this.intentionalClose = false;
  }

  async connect() {
    this.intentionalClose = false;
    const [cfg, token] = await Promise.all([getServerConfig(), getDeviceToken()]);
    if (!cfg?.serverUrl || !token) {
      this._setStatus('closed');
      return;
    }

    const wsUrl = cfg.serverUrl
      .replace(/^http(s?):\/\//, (_, s) => `ws${s}://`)
      .replace(/\/+$/, '');
    const url = `${wsUrl}/ws?token=${encodeURIComponent(token)}`;

    this._setStatus('connecting');

    try {
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        this.connected = true;
        this.backoffMs = 1000;
        this._setStatus('open');
        this._startPing();
      };

      ws.onmessage = (evt) => {
        try {
          const msg = typeof evt.data === 'string' ? JSON.parse(evt.data) : evt.data;
          this._emit(msg);
        } catch (e) {
          console.log('[liveSync] parse falhou:', e?.message);
        }
      };

      ws.onerror = (err) => {
        console.log('[liveSync] ws error:', err?.message);
        this._setStatus('error');
      };

      ws.onclose = () => {
        this.connected = false;
        this._stopPing();
        this._setStatus('closed');
        if (!this.intentionalClose) this._scheduleReconnect();
      };
    } catch (e) {
      console.log('[liveSync] connect falhou:', e?.message);
      this._setStatus('error');
      this._scheduleReconnect();
    }
  }

  disconnect() {
    this.intentionalClose = true;
    this._stopPing();
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
  }

  send(msg) {
    if (!this.connected || !this.ws) return false;
    try {
      this.ws.send(JSON.stringify(msg));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Subscribe a eventos. Retorna função unsubscribe.
   * @param {(msg: any) => void} fn
   */
  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onStatus(fn) {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  // ── private ──
  _emit(msg) {
    for (const fn of this.listeners) {
      try { fn(msg); } catch (e) { console.log('[liveSync] listener err:', e?.message); }
    }
  }
  _setStatus(state) {
    for (const fn of this.statusListeners) {
      try { fn(state); } catch {}
    }
  }
  _startPing() {
    this._stopPing();
    this.pingTimer = setInterval(() => {
      this.send({ type: 'PING' });
    }, PING_INTERVAL_MS);
  }
  _stopPing() {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
  }
  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(this.backoffMs, MAX_BACKOFF_MS);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS);
      this.connect();
    }, delay);
  }
}

// Singleton
export const liveSync = new LiveSync();
