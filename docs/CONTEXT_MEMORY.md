# Contourline Mobile — Context Memory
> Atualizado: 2026-05-18 | Usar como briefing em novos chats

---

## Produto
App React Native/Expo chamado **Contourline Backup** / **Central Mídia Mobile**.
Captura fotos/vídeos em eventos (estética, médico, boat parties) e faz sync automático pro servidor local (sitelocal) + Google Drive.

**Repositório**: https://github.com/phalanjunio-stack/centralmidiamobile.git
**Branch ativa**: `feat/aura-redesign`
**Último commit relevante**: `2e144b0` — migração expo-camera → react-native-vision-camera

---

## Stack Técnica
- **Expo SDK 55** + React Native 0.83.6
- **EAS Development Build** (não Expo Go) — APK buildado via EAS
- **EAS Project ID**: `175861ef-a538-47ec-9ccb-2417f89fce74`
- **Owner EAS**: `mpa-do-maroto`
- **Slug**: `central-midia-mobile`
- **Bundle ID**: `com.contourline.mobile`
- **react-native-vision-camera 5.0.9** — câmera principal (substituiu expo-camera)
- **react-native-worklets 0.7.4** — peer dep do Reanimated 4 (necessário pro EAS build)
- **expo-dev-client ~55.0.34** — APK de dev customizado
- **Standard Animated API** (NÃO Reanimated) para AuraRing/AuraButton
- **AsyncStorage** — camera settings (autoUpload, wifiOnly, saveOriginal, grid)
- **SecureStore** — device token

---

## Design System — Aura
Localização: `src/theme/`
- Cores: dark navy `#0f172a`, azul primário `#1F8BFF`, purple `#7C3AED`
- Efeitos: smoke (2 SVG layers counter-rotating), aura pulse (SVG radial gradient), spark particles (4 em órbita)
- Tab bar: pill `rgba(8,14,26,0.92)` + border `rgba(31,139,255,0.18)`
- PNG icons em `assets/icons/` — 31 ícones brand Contourline

---

## Arquitetura de Arquivos Importantes
```
screens/
  HomeScreen.js        — Hero split card, QuickCards, CentralIcon pulse, DayStatCards
  CameraScreen.js      — vision-camera, exposure, tap-focus, dashboard layout
App.js                 — Tab bar com smoke/aura animations, CenterTabButton
src/
  context/UploadContext.js   — pendingCount badge global
  services/cameraSettings.js — AsyncStorage toggles
  components/BackHeader.js   — back arrow reusável
components/camera/
  UploadToast.js             — toast 3s (info/success/error)
  CameraSettingsSheet.js     — bottom drawer de configurações
  FaceFocusFrame.js          — frame foco estilo iPhone (amarelo)
  VUMeter.js                 — 12 barras L/R simuladas
docs/
  SYNC_PLAN_SITELOCAL.md     — protocolo WebSocket mobile ↔ sitelocal
  MOBILE_FIXES_PLAN.md       — plano de correções em tiers
  CONTEXT_MEMORY.md          — este arquivo
```

---

## CameraScreen — Estado Atual (pós-migração)
```js
// react-native-vision-camera
import { Camera, useCameraDevice, useCameraFormat, useCameraPermission, useMicrophonePermission }

const device = useCameraDevice(facing);
const format = useCameraFormat(device, [
  { videoResolution: { width: 3840, height: 2160 } },
  { photoResolution: { width: 4032, height: 3024 } },
  { fps: 30 },
]);

// Exposure real no Android
exposure={exposure * (format?.maxExposure || 1)}

// Zoom mapeado pro range nativo do device
zoom={Math.max(device.minZoom, Math.min(device.maxZoom, 1 + zoom * (device.maxZoom - 1)))}

// Foto
const result = await camera.current.takePhoto({ flash });
const uri = result.path.startsWith('file://') ? result.path : `file://${result.path}`;

// Vídeo — callback-based (não await)
camera.current.startRecording({ onRecordingFinished, onRecordingError });
await camera.current.stopRecording();

// Foco nativo
camera.current.focus({ x, y });
```

Layout: event chip (topo) + server pill + 3 botões círculo (flash/flip/settings)
Cards laterais: Exposure (☀ slider) | Grid | Zoom | Filtros
Pills de zoom: 0.5 / 1x / 2 / 3
UploadToast: 3s transiente (substituiu banner permanente)
CameraSettingsSheet: qualidade, auto-upload, wifi-only, salvar original, grid, limpar fila, desconectar

---

## Google Drive — Estrutura
```
G:\Meu Drive\1. MARKETING\00. ORGANIZADO\
  EVENTO_VAZIO\          ← template
    01_Fotos\
    02_Videos\
    03_Reels\
    04_Exports\
  FULL FACE 2026\        ← DUPLICADO (também existe em 05_Maio\) — precisa corrigir
  BOAT ON BOAT ORLANDO\
```
Toda foto/vídeo capturado vai pra pasta do evento ativo dentro de `00. ORGANIZADO`.

---

## sitelocal (Central de Mídia)
- Server Node.js local na rede Wi-Fi
- Descoberto por HTTP subnet scan
- Plano de sync: WebSocket bidirecional (ver `docs/SYNC_PLAN_SITELOCAL.md`)
- REST endpoints necessários: `DELETE /api/captures/:id`, `GET /api/server/info`
- Repo sitelocal: `C:\Users\Contourline\Documents\contourline-backup-premium` (site) / `sitelocal` (server)

---

## Pendências (por prioridade)
### Tier 0 — Crítico
- [ ] Trigger novo EAS development build (commit `2e144b0`) → instalar APK → testar exposure
- [ ] WebSocket sync client no mobile (ver SYNC_PLAN_SITELOCAL.md)
- [ ] UploadsScreen: 6 botões estão decorativos, sem função

### Tier 1 — Importante
- [ ] Gallery: viewer de foto/vídeo + botão deletar
- [ ] EventDetail: filtros por tipo de mídia
- [ ] HomeScreen: bell (notificações), avatar, star (favoritar)
- [ ] QuickActions: 4 ações rápidas funcionais

### Tier 2 — Dados Hardcoded
- [ ] Duração de vídeo (atualmente fixo)
- [ ] "Último sync" (atualmente fixo)
- [ ] Team info

### Tier 3 — Polish
- [ ] Efeitos sonoros (expo-av) em ações importantes
- [ ] Corrigir pasta FULL FACE 2026 duplicada no Drive

---

## EAS Build — Como Buildar
```bash
# Na pasta do projeto
cd C:\Users\Contourline\Documents\contourline-mobile

# Development build (APK p/ testar)
eas build --profile development --platform android

# Preview build (APK interno)
eas build --profile preview --platform android

# Ver builds
eas build:list
```
Instalar APK via QR no dashboard: https://expo.dev/accounts/mpa-do-maroto/projects/central-midia-mobile/builds

---

## Histórico de Bugs Resolvidos
1. **slug mismatch** → `app.json` slug era `contourline-mobile`, mudado pra `central-midia-mobile` + `owner: mpa-do-maroto`
2. **worklets build fail** → `npx expo install react-native-worklets` + plugin no babel.config.js
3. **ChevronRight undefined** → substituído por `<Image source={IC.chevronDir} />`
4. **EventsTab não existe** → era `ProjectsTab`, corrigido global replace
5. **Upload Content-Type** → remover header manual, deixar RN setar automaticamente
6. **Tab bar artifact** → chassisGlow circle removido
7. **Android exposure** → migração pra react-native-vision-camera (motivo principal)
