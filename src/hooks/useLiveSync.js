// useLiveSync — conecta no WebSocket sitelocal quando o app monta
// e expõe eventos + status como hooks React
import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { liveSync } from '../services/liveSync';
import { configureNotifications, handleLiveEventForNotif } from '../services/notifications';
import { getDeviceId } from '../../services/storage';

/**
 * Hook que conecta no liveSync e expõe estado.
 * Uso típico: chamar dentro do <UploadProvider> ou root.
 */
export function useLiveSyncBoot() {
  const [status, setStatus] = useState('closed');
  const [lastEvent, setLastEvent] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ synced: 0, pending: 0, errors: 0 });
  const [teamCaptureCount, setTeamCaptureCount] = useState(0); // contador de novas capturas da equipe

  const deviceIdRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    // Carrega deviceId pra filtrar notif (não notifica próprias capturas)
    getDeviceId().then(id => { deviceIdRef.current = id; }).catch(() => {});
    // Configura permissões + canais de notificação
    configureNotifications().catch(() => {});

    const sub = AppState.addEventListener('change', (next) => { appStateRef.current = next; });

    const offStatus = liveSync.onStatus(setStatus);
    const offMsg = liveSync.on((msg) => {
      setLastEvent({ ...msg, _at: Date.now() });
      if (msg.type === 'SYNC_STATUS') setSyncStatus(msg.data || {});
      if (msg.type === 'CAPTURE_RECEIVED') {
        const fromOther = msg.data?.deviceId && msg.data.deviceId !== deviceIdRef.current;
        if (fromOther) setTeamCaptureCount(c => c + 1);
      }
      // Dispara notificação local quando o app está em background
      handleLiveEventForNotif(msg, {
        isForeground: appStateRef.current === 'active',
        currentDeviceId: deviceIdRef.current,
      });
    });

    liveSync.connect();

    return () => {
      offStatus();
      offMsg();
      sub?.remove?.();
      liveSync.disconnect();
    };
  }, []);

  const resetTeamBadge = useCallback(() => setTeamCaptureCount(0), []);

  return { status, lastEvent, syncStatus, teamCaptureCount, resetTeamBadge };
}

/**
 * Hook leve pra ouvir eventos sem reconnectar.
 */
export function useLiveSyncEvents(handler) {
  useEffect(() => {
    return liveSync.on(handler);
  }, [handler]);
}
