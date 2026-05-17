import React, { createContext, useContext, useState, useCallback } from 'react';

const UploadContext = createContext({ pendingCount: 0, addPending: () => {}, removePending: () => {}, clearPending: () => {} });

export function UploadProvider({ children }) {
  const [pendingCount, setPending] = useState(0);

  const addPending = useCallback((n = 1) => setPending(c => c + n), []);
  const removePending = useCallback((n = 1) => setPending(c => Math.max(0, c - n)), []);
  const clearPending = useCallback(() => setPending(0), []);

  return (
    <UploadContext.Provider value={{ pendingCount, addPending, removePending, clearPending }}>
      {children}
    </UploadContext.Provider>
  );
}

export const useUploads = () => useContext(UploadContext);
