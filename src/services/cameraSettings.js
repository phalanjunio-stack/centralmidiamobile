// Configurações persistentes da câmera (AsyncStorage).
// Lê/escreve toggles que sobrevivem reload do app.
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@contourline.cam.';

export const KEYS = {
  AUTO_UPLOAD:   `${PREFIX}autoUpload`,
  WIFI_ONLY:     `${PREFIX}wifiOnly`,
  SAVE_ORIGINAL: `${PREFIX}saveOriginal`,
  GRID:          `${PREFIX}grid`,
};

const DEFAULTS = {
  [KEYS.AUTO_UPLOAD]:   'true',
  [KEYS.WIFI_ONLY]:     'false',
  [KEYS.SAVE_ORIGINAL]: 'true',
  [KEYS.GRID]:          'true',
};

export async function getBool(key) {
  try {
    const v = await AsyncStorage.getItem(key);
    if (v === null) return DEFAULTS[key] === 'true';
    return v === 'true';
  } catch { return DEFAULTS[key] === 'true'; }
}

export async function setBool(key, value) {
  try { await AsyncStorage.setItem(key, value ? 'true' : 'false'); } catch {}
}

export async function loadAllSettings() {
  const [autoUpload, wifiOnly, saveOriginal, grid] = await Promise.all([
    getBool(KEYS.AUTO_UPLOAD),
    getBool(KEYS.WIFI_ONLY),
    getBool(KEYS.SAVE_ORIGINAL),
    getBool(KEYS.GRID),
  ]);
  return { autoUpload, wifiOnly, saveOriginal, grid };
}
