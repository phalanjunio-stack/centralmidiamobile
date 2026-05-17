// Orchestrator de boot. Roda tudo que precisa acontecer ANTES do app
// abrir: migracao de credenciais, leitura de token, snapshot de rede.
//
// Falhas individuais nao travam o boot — caem em fallback seguro pra
// que o app sempre abra. Logs ficam no console.

import {
  migrateAuthFromAsyncStorage,
  getDeviceToken,
  getDeviceId,
} from '../services/secureStore';
import { fetchNetworkState } from '../services/networkStatus';

/**
 * @returns {Promise<{
 *   token: string | null,
 *   deviceId: string | null,
 *   hasToken: boolean,
 *   network: { isConnected: boolean | null, type: string | null },
 *   migration: { migratedToken: boolean, migratedId: boolean },
 *   elapsedMs: number,
 * }>}
 */
export async function runBootSequence() {
  const startedAt = Date.now();

  // 1. Migracao idempotente de credenciais legadas.
  const migration = await migrateAuthFromAsyncStorage();
  if (migration.migratedToken || migration.migratedId) {
    console.log('[boot] credenciais migradas pra SecureStore:', migration);
  }

  // 2. Le token + deviceId atuais (apos migracao).
  const [token, deviceId] = await Promise.all([
    getDeviceToken().catch(() => null),
    getDeviceId().catch(() => null),
  ]);

  // 3. Snapshot inicial de rede (nao bloqueia se falhar).
  let network = { isConnected: null, type: null };
  try {
    const state = await fetchNetworkState();
    network = { isConnected: state?.isConnected ?? null, type: state?.type ?? null };
  } catch (e) {
    console.warn('[boot] fetchNetworkState falhou:', e?.message);
  }

  const elapsedMs = Date.now() - startedAt;

  return {
    token,
    deviceId,
    hasToken: !!token,
    network,
    migration,
    elapsedMs,
  };
}
