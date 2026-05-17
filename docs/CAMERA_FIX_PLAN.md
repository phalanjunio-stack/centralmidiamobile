# Plano de Fix da Câmera — Real, sem enrolação

## Estado atual

### O que funciona de verdade
- Zoom (pinch + pills 0,5/1/2/3)
- Toggle Foto/Vídeo
- Captura de foto e vídeo
- Upload automático pro servidor (quando servidor está ok)
- Foco visual no toque (estilo iPhone, amarelo)
- Pinch-to-zoom

### O que está enfeite
- 🔆 Card **Exposição** — funciona iOS apenas. Android precisa de dev build (não Expo Go)
- 📐 Card **16:9 WIDESCREEN** — só display, não muda aspect ratio real
- 🎬 Card **4K 60 FPS** — só display, Expo Go entrega `2160p` fixo
- 🎯 Card **Focus mode** (direito) — só display, foco real funciona pelo toque
- ✨ Card **Filtros** — placeholder, sem implementação
- ⚡ **Flash** — deveria funcionar, vou validar
- 🔃 **Flip câmera** — deveria funcionar, vou validar
- ⚙ **Settings** — abre o `CameraMenu` antigo, talvez precise atualizar

### O que está bagunçando o layout
- Top bar muito apertado → "FULL F..." truncado
- Banner "Envio automático ativado" sempre visível → deveria ser toast
- Muitos cards laterais → poluição visual
- Server pill com texto quebrando em 2 linhas

---

## Plano de ação

### 1. Top bar — Event chip com nome inteiro
- Aumentar largura do event chip
- Server pill compacto (1 linha)
- 3 ícones: ⚡ Flash, 🔃 Flip, ⚙ Settings

### 2. Banner Envio automático → Toast
- Aparece por 3s quando upload começa
- Aparece por 3s quando upload conclui
- Desaparece sozinho
- NÃO fica fixo na tela

### 3. Cards laterais — só essencial
**Manter visível na tela:**
- ☀ Exposição (toggle slider) — ESQUERDA
- 🔲 Grade (toggle) — ESQUERDA  
- 🔍 Zoom (info do nível atual) — DIREITA
- ✨ Filtros (chama bottom sheet futuro) — DIREITA

**Mover pra Settings (⚙ menu):**
- 4K · 60 FPS (será cyclável quando dev build)
- 16:9 Widescreen
- Focus mode (auto/manual)

### 4. Botão Settings → BottomSheet completo
Abre um drawer com TUDO que não cabe na tela:
- Qualidade de gravação (4K/1080p/720p) — info por enquanto
- Aspect ratio (16:9 / 4:3 / 1:1) — info por enquanto
- Modo de foco (auto/manual)
- Estabilização (on/off)
- Auto-upload (on/off real)
- Salvar original no celular (toggle)
- Wi-Fi only para upload (toggle)
- Limpar fila de upload
- Desconectar dispositivo

### 5. Funções a destravar AGORA (Expo Go)
- Flash on/off — confirmar e logar
- Flip câmera — confirmar e logar
- Grade toggle (já funciona)
- Auto-upload toggle (criar flag global persistente)
- Wi-Fi only (verificar `network.type === 'wifi'` antes de enviar)

### 6. Funções que precisam Dev Build (depois)
- 4K real / FPS variável
- Aspect ratio nativo
- Exposure Android
- ISO manual
- White balance
- Detecção de rosto (face tracking iPhone-style)

---

## Implementação agora (esta sessão)

Vou fazer nesta ordem:
1. ✅ Top bar reorganizado (event chip mais largo, 3 ícones)
2. ✅ Toast de envio automático (substitui banner fixo)
3. ✅ Cards laterais reduzidos (só 4 essenciais)
4. ✅ Settings BottomSheet com controles secundários
5. ✅ Logar flash/flip pra confirmar que funcionam
6. ✅ Toggle auto-upload persistente (AsyncStorage)
7. ✅ Toggle Wi-Fi only persistente
