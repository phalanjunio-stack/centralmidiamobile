// Auto-discovery de Centrais Contourline na rede local.
// Faz scan HTTP da subnet do celular (192.168.X.0/24 ou 10.x.x.0/24),
// chamando /api/drive-config em cada IP — endpoint publico do sitelocal
// que retorna { marketingBase, configured, ... }. A presenca dessa chave
// eh nossa heuristica de identificacao "isso eh uma Central Contourline".
//
// Compativel com Expo Go (so usa fetch + expo-network, sem mod nativo).
// Em redes /24 com max concurrency 24, leva ~3-5 segundos.

import * as Network from 'expo-network';

const DEFAULT_PORTS = [3000, 3001];
const PROBE_TIMEOUT_MS = 700;
const MAX_CONCURRENT = 24;

function timeoutSignal(ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, clear: () => clearTimeout(t) };
}

function deriveSubnet(ip) {
  const parts = String(ip || '').split('.');
  if (parts.length !== 4) return null;
  return parts.slice(0, 3).join('.');
}

export async function getLocalIp() {
  try {
    return await Network.getIpAddressAsync();
  } catch {
    return null;
  }
}

// Validacao da heuristica: chamada GET /api/drive-config retorna JSON
// com a chave 'marketingBase'. Se sim, eh Central.
async function probeServer(ip, port, parentSignal) {
  const { signal: timeoutSig, clear } = timeoutSignal(PROBE_TIMEOUT_MS);
  const url = `http://${ip}:${port}`;

  // Combina parent + timeout: aborta se qualquer um abortar.
  const signal = parentSignal || timeoutSig;

  try {
    const res = await fetch(`${url}/api/drive-config`, { signal });
    if (!res.ok) return null;

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;

    const data = await res.json();
    if (!data || typeof data !== 'object') return null;
    if (!('marketingBase' in data)) return null;

    // Tenta enriquecer com identity (nome bonito do PC). Best-effort, nao bloqueia.
    let identity = null;
    try {
      const idRes = await fetch(`${url}/api/identity`, { signal });
      if (idRes.ok) {
        const text = await idRes.text();
        if (text) {
          try { identity = JSON.parse(text); } catch {}
        }
      }
    } catch {}

    const ownerName = identity?.name?.trim();
    const pcName = identity?.pcName?.trim();

    return {
      ip,
      port,
      url,
      name: ownerName ? `Central de ${ownerName}` : 'Central de Midia',
      pcName: pcName || null,
      ownerName: ownerName || null,
      configured: !!data.configured,
      foundAt: Date.now(),
    };
  } catch {
    return null;
  } finally {
    clear();
  }
}

/**
 * Inicia scan da subnet local.
 * @param {object} opts
 * @param {number[]} opts.ports - portas a tentar (default [3000, 3001])
 * @param {(c: Central) => void} opts.onFound - callback quando acha Central
 * @param {(p: {scanned: number, total: number}) => void} opts.onProgress
 * @returns {{ promise: Promise<Central[]>, cancel: () => void }}
 */
export function scanLocalNetwork({ ports = DEFAULT_PORTS, onFound, onProgress } = {}) {
  const ctrl = new AbortController();
  const found = [];

  const promise = (async () => {
    const localIp = await getLocalIp();
    const subnet = deriveSubnet(localIp);
    if (!subnet) return found;

    // Constroi lista de targets (ip + porta)
    const targets = [];
    for (let host = 1; host <= 254; host++) {
      const ip = `${subnet}.${host}`;
      for (const port of ports) {
        targets.push({ ip, port });
      }
    }

    let cursor = 0;
    let scanned = 0;
    const total = targets.length;

    async function worker() {
      while (cursor < targets.length && !ctrl.signal.aborted) {
        const idx = cursor++;
        if (idx >= targets.length) break;
        const { ip, port } = targets[idx];
        const result = await probeServer(ip, port, ctrl.signal);
        scanned++;
        try { onProgress?.({ scanned, total }); } catch {}
        if (result && !ctrl.signal.aborted) {
          if (!found.some((f) => f.url === result.url)) {
            found.push(result);
            try { onFound?.(result); } catch {}
          }
        }
      }
    }

    await Promise.all(
      Array.from({ length: MAX_CONCURRENT }, () => worker()),
    );

    return found;
  })();

  return {
    promise,
    cancel: () => ctrl.abort(),
  };
}
