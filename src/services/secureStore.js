// Credenciais (deviceToken + deviceId) agora vivem no Keychain/Keystore
// nativo via expo-secure-store em vez de AsyncStorage em plaintext.
//
// API mantida igual a antiga (getDeviceToken/setDeviceToken/getDeviceId/setDeviceId)
// pra nao quebrar call sites. storage.js re-exporta daqui.
//
// Tambem oferece migracao one-time pra rodar uma vez no boot:
// le credenciais antigas no AsyncStorage e move pro SecureStore.

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SS_KEYS = {
  DEVICE_TOKEN: 'contourline.device_token',
  DEVICE_ID: 'contourline.device_id',
};

const LEGACY_AS_KEYS = {
  DEVICE_TOKEN: '@contourline/device_token',
  DEVICE_ID: '@contourline/device_id',
};

// ── Token ─────────────────────────────────────────────────────────────
export async function getDeviceToken() {
  try {
    return await SecureStore.getItemAsync(SS_KEYS.DEVICE_TOKEN);
  } catch (e) {
    console.warn('[secureStore] getDeviceToken falhou:', e?.message);
    return null;
  }
}

export async function setDeviceToken(token) {
  if (!token) {
    try { await SecureStore.deleteItemAsync(SS_KEYS.DEVICE_TOKEN); } catch {}
    return;
  }
  await SecureStore.setItemAsync(SS_KEYS.DEVICE_TOKEN, token);
}

// ── DeviceId ──────────────────────────────────────────────────────────
export async function getDeviceId() {
  try {
    return await SecureStore.getItemAsync(SS_KEYS.DEVICE_ID);
  } catch (e) {
    console.warn('[secureStore] getDeviceId falhou:', e?.message);
    return null;
  }
}

export async function setDeviceId(id) {
  if (!id) {
    try { await SecureStore.deleteItemAsync(SS_KEYS.DEVICE_ID); } catch {}
    return;
  }
  await SecureStore.setItemAsync(SS_KEYS.DEVICE_ID, id);
}

// ── Migracao idempotente ─────────────────────────────────────────────
// Le credenciais antigas no AsyncStorage. Se existirem e ainda nao
// estiverem no SecureStore, move pra la e apaga do AsyncStorage.
// Roda toda vez no boot — barata, segura.
export async function migrateAuthFromAsyncStorage() {
  const result = { migratedToken: false, migratedId: false };

  try {
    const existingToken = await SecureStore.getItemAsync(SS_KEYS.DEVICE_TOKEN);
    if (!existingToken) {
      const legacyToken = await AsyncStorage.getItem(LEGACY_AS_KEYS.DEVICE_TOKEN);
      if (legacyToken) {
        await SecureStore.setItemAsync(SS_KEYS.DEVICE_TOKEN, legacyToken);
        await AsyncStorage.removeItem(LEGACY_AS_KEYS.DEVICE_TOKEN);
        result.migratedToken = true;
      }
    }

    const existingId = await SecureStore.getItemAsync(SS_KEYS.DEVICE_ID);
    if (!existingId) {
      const legacyId = await AsyncStorage.getItem(LEGACY_AS_KEYS.DEVICE_ID);
      if (legacyId) {
        await SecureStore.setItemAsync(SS_KEYS.DEVICE_ID, legacyId);
        await AsyncStorage.removeItem(LEGACY_AS_KEYS.DEVICE_ID);
        result.migratedId = true;
      }
    }
  } catch (e) {
    console.warn('[secureStore] migration falhou:', e?.message);
  }

  return result;
}
