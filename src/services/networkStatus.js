// Wrapper sobre @react-native-community/netinfo.
// Oferece snapshot, listener e hook. Mantem um cache em memoria do
// ultimo estado conhecido (util pra evitar fetch desnecessario).

import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

let cachedState = null;

export async function fetchNetworkState() {
  const state = await NetInfo.fetch();
  cachedState = state;
  return state;
}

export function getCachedNetworkState() {
  return cachedState;
}

export function subscribeNetworkChange(callback) {
  return NetInfo.addEventListener((state) => {
    cachedState = state;
    callback(state);
  });
}

/**
 * Hook util pra exibir status de rede em UI.
 * Retorna { isConnected, type, isWifi, isCellular, raw }.
 */
export function useNetworkStatus() {
  const [state, setState] = useState(cachedState);

  useEffect(() => {
    let mounted = true;
    fetchNetworkState().then((s) => {
      if (mounted) setState(s);
    }).catch(() => {});

    const unsub = subscribeNetworkChange((s) => {
      if (mounted) setState(s);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  return {
    isConnected: state?.isConnected ?? null,
    type: state?.type ?? null,
    isWifi: state?.type === 'wifi',
    isCellular: state?.type === 'cellular',
    raw: state,
  };
}
