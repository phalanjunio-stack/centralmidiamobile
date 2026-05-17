# Plano de Fixes — Mobile (Contourline Backup)

Lista priorizada de itens decorativos/quebrados encontrados na auditoria e como atacar.

---

## Tier 0 — Crítico (bloqueia uso real)

### 1. WebSocket sync client
- Criar `src/services/realtimeSync.js` com classe `RealtimeClient`
- Hook `useRealtime()` que retorna conexão + status
- Reconexão exponencial em falha (1s, 2s, 4s, max 30s)
- Auto-handshake com `deviceToken` do SecureStore
- Eventos vão pra um Zustand store (`src/state/syncStore.js`)
- HomeScreen, EventsScreen, GalleryScreen, EventDetail assinam o store via selectors
- Botão pra ver status da conexão no header (verdinho/amarelo/cinza)

### 2. UploadsScreen — 6 botões mortos
Implementar:
- **Pausar envio**: marca flag global `uploadsPaused`, fila para enquanto true
- **Continuar envio**: limpa flag, dispara processador
- **Tentar novamente erros**: itera no log de syncs com `ok: false`, re-enfileira
- **Limpar concluídos**: deleta entries com `ok: true` mais antigas que X dias do AsyncStorage
- **Filtros**: bottom sheet com checkboxes (Por evento, Por tipo, Período, Status)
- **Mais opções**: bottom sheet com export CSV, limpar tudo, configurações

---

## Tier 1 — Importante (funcionalidade visível)

### 3. Galeria — abrir foto em viewer + delete
- Instalar `react-native-image-viewing` (compatível Expo Go)
- Tap em foto → abre fullscreen com pinch-zoom + swipe entre fotos do mesmo dia
- Long-press → ativa modo seleção múltipla
- Botão lixeira top-right → confirma e chama `DELETE /api/captures/:id`
- Vídeo: tap → player nativo (`expo-video` ou `expo-av`)
- Pull-to-refresh real (já existe parcialmente)

### 4. EventDetailScreen — botões fantasmas
- "Ver todos" L200 → navega pra Gallery filtrada por eventId
- Filtro dropdown L212 → bottom sheet com {Todos, Fotos, Vídeos, Por dia, Por usuário}

### 5. HomeScreen — header
- **Sino** → BottomSheet de notificações (errors do upload, eventos novos)
- **Avatar** → corrigir rota: `navigation.navigate('Main', { screen: 'ProfileTab' })` ou criar tela `Profile` no stack
- **Estrela** dos cards de evento → toggle `event.favorite` (POST `/api/events/:id/favorite`)

### 6. QuickActionsScreen — 4 itens fechando sem fazer nada
- Tirar foto: navigate('Camera', { initialMode: 'photo' })
- Gravar vídeo: navigate('Camera', { initialMode: 'video' })
- Escolher galeria: navigate('Gallery')
- Enviar documento: `DocumentPicker.getDocumentAsync()` → upload via endpoint genérico

---

## Tier 2 — Polimento

### 7. GalleryScreen — dados hardcoded
- L214 duração vídeo "0:42" → pegar do metadata real do arquivo (FileSystem.getInfoAsync) ou armazenar ao salvar
- L250 "Última: Hoje, 09:40" → `getLastSync()` + formatRelative

### 8. HomeScreen — "Equipe Contourline" fixo
- Buscar do evento ativo (`event.team` ou contagem de devices pareados que enviaram nele)

### 9. ConnectAura — botão "pular por agora" em `__DEV__`
- Já é dev-only, ok. Mas garantir que não está em production build.

---

## Tier 3 — Novas features pedidas

### 10. Som em ações importantes
- `npm i expo-av` (já está instalado)
- Pasta `assets/sounds/`:
  - `tap.mp3` — interação leve (botões secundários)
  - `success.mp3` — upload concluído, evento criado
  - `error.mp3` — falha
  - `capture.mp3` — shutter da câmera
  - `swoosh.mp3` — navegação entre telas críticas
  - `notify.mp3` — chegou notificação WebSocket
- Criar `src/services/sound.js` com `playSound('tap')` e cache de Sound.loadAsync
- Hook `useSoundToggle()` lê preferência do AsyncStorage
- Toggle nas configurações: "Sons da interface" (default: on, volume 0.4)
- Em botões críticos: `onPress={() => { play('tap'); doAction(); }}`

### 11. Manter design premium consistente
Regras a respeitar em todos os novos componentes:
- Cores do `src/theme/colors.js` (nunca hardcoded)
- Border radius: 14 (cards), 18 (cards grandes), 24 (modais)
- Backgrounds: `bg.surface` + borda `border.glassHi`
- Tipografia Inter (400, 500, 600, 700, 800)
- Sombras com tint da Aura primary
- Animações: 200-300ms, easing `motion.easing.smooth`
- Estados: usar `colors.state.success / warning / error / info`

---

## Implementação sugerida — ordem

1. **WebSocket client mobile** (depende do servidor estar pronto — sincronizar com outro chat)
2. **Galeria abrir foto + delete** (independente, alto impacto visível)
3. **UploadsScreen 6 botões** (independente)
4. **Header HomeScreen** (sino, avatar, estrela)
5. **EventDetail filtros**
6. **QuickActions wiring**
7. **Dados hardcoded** (vídeo duração, last sync, equipe)
8. **Sons**

Tempo estimado: ~2 dias focado se o servidor estiver pronto.

---

## Telas verificadas e funcionando

Não precisam fix:
- ProfilePickerScreen
- EventPickerScreen
- SetupScreen
- QRScannerScreen
- ProfileScreen
- SplashScreen
- CameraScreen (camera + capture funciona — falta polimento de UI, ver MOBILE_CAMERA_REDESIGN.md futuro)
- ConnectAuraScreen
- EventsScreen
