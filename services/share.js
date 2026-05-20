// Quick Share — gera link público no Drive (via sitelocal) e abre share sheet
// Estratégia:
//   1. Pede pro sitelocal um link público da captura (sitelocal já tem token Drive)
//   2. Cai pra Share.share() do arquivo local se não tiver server
import { Share, Linking, Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { getServerConfig, getDeviceToken } from './storage';

const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url, opts = {}, ms = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Pede pro sitelocal um link público da captura (cria sharing no Drive).
 * Retorna { url, expiresAt } ou null em caso de falha.
 */
export async function getDriveShareUrl(captureId) {
  try {
    const [cfg, token] = await Promise.all([getServerConfig(), getDeviceToken()]);
    if (!cfg?.serverUrl || !token) return null;

    const res = await fetchWithTimeout(`${cfg.serverUrl}/api/captures/${captureId}/share`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access: 'public' }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.url ? data : null;
  } catch (e) {
    console.log('[share] getDriveShareUrl falhou:', e?.message);
    return null;
  }
}

/**
 * Abre share sheet do sistema. Estratégia:
 *  1. Tenta gerar link público no Drive (via sitelocal)
 *  2. Se conseguir, compartilha o link (deeplink WhatsApp/Instagram funciona)
 *  3. Se falhar, faz fallback compartilhando o arquivo local
 */
export async function quickShare({ captureId, localUri, name, eventName }) {
  const title = name || 'Captura Contourline';
  const eventTag = eventName ? ` · ${eventName}` : '';

  // Tenta gerar link público no Drive
  if (captureId) {
    const link = await getDriveShareUrl(captureId);
    if (link?.url) {
      try {
        await Share.share({
          title,
          message: `${title}${eventTag}\n${link.url}`,
          url: link.url,
        });
        return { ok: true, via: 'drive', url: link.url };
      } catch (e) {
        console.log('[share] Share.share falhou:', e?.message);
      }
    }
  }

  // Fallback: compartilha arquivo local
  if (localUri) {
    try {
      const info = await FileSystem.getInfoAsync(localUri);
      if (info.exists) {
        await Share.share({
          title,
          message: `${title}${eventTag}`,
          url: localUri, // iOS aceita file URI; Android tenta abrir o app picker
        });
        return { ok: true, via: 'local', url: localUri };
      }
    } catch (e) {
      console.log('[share] fallback local falhou:', e?.message);
    }
  }

  Alert.alert('Compartilhar', 'Não foi possível gerar o link agora.');
  return { ok: false };
}

/**
 * Abre WhatsApp direto com mensagem + url (deeplink).
 * Se não tiver WhatsApp instalado, cai pro share normal.
 */
export async function shareToWhatsApp({ captureId, localUri, name, eventName, phone }) {
  const link = captureId ? await getDriveShareUrl(captureId) : null;
  const url  = link?.url || localUri;
  if (!url) {
    Alert.alert('WhatsApp', 'Sem link disponível pra compartilhar.');
    return;
  }

  const eventTag = eventName ? ` · ${eventName}` : '';
  const text = encodeURIComponent(`${name || 'Captura Contourline'}${eventTag}\n${url}`);
  const deepLink = phone
    ? `whatsapp://send?phone=${phone}&text=${text}`
    : `whatsapp://send?text=${text}`;

  try {
    const can = await Linking.canOpenURL(deepLink);
    if (can) {
      await Linking.openURL(deepLink);
      return;
    }
  } catch {}

  // Fallback web
  const webUrl = phone
    ? `https://wa.me/${phone}?text=${text}`
    : `https://wa.me/?text=${text}`;
  Linking.openURL(webUrl).catch(() => Alert.alert('WhatsApp', 'Não foi possível abrir o WhatsApp.'));
}
