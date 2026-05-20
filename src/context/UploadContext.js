import React, { createContext, useContext, useState, useCallback } from 'react';
import { useLiveSyncBoot } from '../hooks/useLiveSync';

const UploadContext = createContext({
  pendingCount: 0,
  addPending: () => {},
  removePending: () => {},
  clearPending: () => {},
  // Live sync
  liveStatus: 'closed',
  syncStatus: { synced: 0, pending: 0, errors: 0 },
  teamCaptureCount: 0,
  resetTeamBadge: () => {},
});

export function UploadProvider({ children }) {
  const [pendingCount, setPending] = useState(0);

  const addPending    = useCallback((n = 1) => setPending(c => c + n), []);
  const removePending = useCallback((n = 1) => setPending(c => Math.max(0, c - n)), []);
  const clearPending  = useCallback(() => setPending(0), []);

  // Boot do WebSocket — conecta no sitelocal quando o app abre
  const { status: liveStatus, syncStatus, teamCaptureCount, resetTeamBadge } = useLiveSyncBoot();

  return (
    <UploadContext.Provider value={{
      pendingCount, addPending, removePending, clearPending,
      liveStatus, syncStatus, teamCaptureCount, resetTeamBadge,
    }}>
      {children}
    </UploadContext.Provider>
  );
}

export const useUploads = () => useContext(UploadContext);
