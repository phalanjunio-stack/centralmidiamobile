# Plano de Sincronização — Site (sitelocal) ↔ Mobile

> Documento para handoff ao chat/dev que está trabalhando no `C:\Users\Contourline\Documents\sitelocal`.
> O objetivo é fazer o app mobile (Contourline Backup) e a Central de Mídia (sitelocal) trabalharem em tempo real.

---

## 1. Estado atual (problema)

- Site grava eventos em JSON files no servidor.
- Mobile chama `GET /api/events` periodicamente (ou no pull-to-refresh).
- **Nada é tempo real**: se você cria um evento no site, o celular só vê depois de refresh manual.
- Quando o celular envia uma foto, o site só vê quando atualiza a página (polling 10s).
- Sem feedback bidirecional → UX ruim, parece quebrado.

## 2. Objetivo

Sincronização **em tempo real** em ambas as direções:

| Origem | Evento | Quem recebe | Ação esperada |
|---|---|---|---|
| Site | Cria evento | Todos os celulares pareados | Aparece na lista de Projetos instantaneamente |
| Site | Atualiza evento (nome, data, ativo) | Mobile | UI atualiza sem refresh |
| Site | Deleta evento | Mobile | Remove da lista; se era ativo, limpa o ativo |
| Site | Define evento ativo | Mobile | Mobile troca o evento ativo automaticamente |
| Site | Deleta foto/vídeo | Drive + outros clientes | Remove do log + Drive |
| Mobile | Envia foto/vídeo | Site (admin) | Card aparece na galeria em tempo real |
| Mobile | Deleta foto/vídeo | Site + Drive | Remove de todos os lugares |
| Site | Reorganiza pastas | — | Mantém referência válida no log |

## 3. Tecnologia recomendada

**WebSocket** (`ws` package no Node) — leve, suportado por React Native via `WebSocket` global (já existe).

Endpoint: `ws://<server>:<port>/ws/device`

Alternativa pior: SSE (Server-Sent Events) — só do servidor pro cliente, não funcionaria pro mobile mandar updates.

## 4. Protocolo proposto

### Conexão

```
Client → Server (handshake HTTP upgrade):
  GET /ws/device
  Headers:
    x-device-token: <token>   // ou x-app-password pra admin web
    x-client-type: mobile     // ou "admin"
```

Servidor valida o token (mesma função de auth dos endpoints HTTP atuais). Se inválido, fecha com código 4001.

### Heartbeat

A cada 25s o cliente envia:
```json
{ "type": "ping", "ts": 1234567890 }
```

Servidor responde:
```json
{ "type": "pong", "ts": 1234567890, "serverTime": 1234567891 }
```

Se o servidor não receber ping em 60s, fecha a conexão.

### Mensagens server → client

```json
// Evento criado no site
{ "type": "event:created", "event": { id, name, folder, startDate, endDate, location, coverUrl, active, fileCount } }

// Evento alterado
{ "type": "event:updated", "event": { ... }, "fields": ["name","active"] }

// Evento removido
{ "type": "event:deleted", "eventId": "abc123" }

// Evento ativo mudou
{ "type": "event:active_changed", "eventId": "abc123" | null }

// Captura nova foi enviada (vem de outro device)
{ "type": "capture:created", "capture": { id, name, mediaType, eventId, deviceId, size, createdAt } }

// Captura deletada
{ "type": "capture:deleted", "captureId": "x" }

// Status da Central
{ "type": "central:status", "drive": { connected: true, bytesUsed: 123 }, "queue": { pending: 4, errors: 0 } }
```

### Mensagens client → server

```json
// Mobile registra que está visualizando um evento (pra otimização)
{ "type": "view:event", "eventId": "abc123" }

// Mobile pede delete (pode ser feito via REST DELETE também)
{ "type": "capture:delete:request", "captureId": "x" }

// Mobile envia notificação de upload local concluído (caso o server ainda não saiba)
{ "type": "capture:uploaded", "captureId": "x" }
```

## 5. Endpoints REST que ainda precisam existir/funcionar

Pra o mobile poder operar mesmo sem WebSocket:

| Method | Path | Função | Existe? |
|---|---|---|---|
| GET | `/api/events` | Lista eventos | ✓ |
| GET | `/api/events/:id` | Detalhe + arquivos | verificar |
| POST | `/api/events` | Criar evento | verificar |
| PATCH | `/api/events/:id` | Renomear / mudar data | verificar |
| DELETE | `/api/events/:id` | Remover evento (+ pasta Drive) | verificar |
| POST | `/api/events/:id/activate` | Marcar ativo | verificar |
| GET | `/api/captures` | Lista capturas (filtrável por eventId, dia, deviceId) | verificar |
| DELETE | `/api/captures/:id` | Deletar foto/vídeo (remove Drive + log) | **CRIAR** |
| GET | `/api/captures/:id/thumb` | Miniatura | verificar |
| GET | `/api/captures/:id/full` | Original (pra abrir lightbox) | verificar |
| GET | `/api/server/info` | Info server pública (nome PC, versão, capacidades) | **CRIAR** (já era pra ter) |
| GET | `/api/drive-config` | Marketing base + árvore | ✓ |

## 6. Estrutura de pasta no Drive

Já existe e está padronizada em `G:\Meu Drive\1. MARKETING\00. ORGANIZADO\`:

```
00. ORGANIZADO/
├── _TEMPLATES/
│   └── EVENTO_VAZIO/
│       ├── 00. CAPA
│       ├── 01. BRUTO/Dia_1_AAAA-MM-DD/{AUDIO,FOTOS,VIDEOS}
│       ├── 02. SELECIONADOS
│       ├── 03. EDICAO/{EXPORTS_PARCIAIS,PROJETOS}
│       ├── 04. ENTREGUE/{ARTES,FOTOS,VIDEOS}
│       └── 05. INFO
├── 01. EVENTOS/{2025,2026}/{01_Janeiro..12_Dezembro}/<EVENTO>/
├── 02. EQUIPAMENTOS
├── 03. TREINAMENTOS
├── 04. ENTREGAS
├── 05..11. (outras categorias)
└── 99. ARQUIVOS_GERAIS
```

**Convenção esperada do server ao salvar upload do mobile:**

Recebe campos `eventFolder`, `eventDay`, `mediaType` no multipart →
salva em: `<eventFolder>/01. BRUTO/Dia_<N>_<DATA>/<FOTOS|VIDEOS|AUDIO>/<filename>`.

**Ao criar evento novo via site, o servidor deve:**

1. Criar pasta `<ano>/<mes>/<DATA - NOME>/` em `01. EVENTOS`
2. Copiar a substrutura do `_TEMPLATES/EVENTO_VAZIO/` pra dentro
3. Criar pastas `Dia_1_<startDate>`, `Dia_2_...`, etc. baseado em start/end
4. Emitir `event:created` via WebSocket

## 7. Inconsistências de pasta encontradas

- Evento `2026-05-27 - FULL FACE 2026` está duplicado:
  - `01. EVENTOS\2026\` (raiz do ano, errado)
  - `01. EVENTOS\2026\05_Maio\` (correto)
- Naming: `00 CAPA` (sem ponto, errado) vs `00. CAPA` (correto)
- Eventos existentes sem a substrutura completa do template:
  - `2026-05-11 - Joao`: tem só `FOTOS/` e `VIDEOS/` soltos
  - `2026-05-15 - Evento`: só capa
  - `2026-05-27 - FULL FACE 2026`: só capa

**Sugestão:** script de migração no servidor que detecta eventos sem template aplicado e copia a estrutura. Rodar uma vez.

## 8. Plano de implementação (lado servidor sitelocal)

### Fase A — REST básico (se ainda não existe)
1. CRUD completo de eventos (`POST/PATCH/DELETE /api/events`)
2. `DELETE /api/captures/:id` (remove arquivo Drive + log)
3. `GET /api/server/info` público

### Fase B — Estrutura de pastas
4. Função `applyEventTemplate(eventPath, startDate, endDate)` que clona EVENTO_VAZIO + cria dias
5. Hook `onEventCreated` chama essa função
6. Script de migração pra eventos órfãos
7. Hook `onEventDeleted` move pasta pra `_LIXEIRA/` (não deleta direto — segurança)

### Fase C — WebSocket
8. `npm i ws`
9. Anexar `WebSocketServer` ao mesmo HTTP server do Express
10. Implementar autenticação por device-token no handshake
11. Broadcaster global: `broadcast(message, filter?)` que itera nos clientes conectados
12. Em cada mutation (create event, delete capture, etc): chamar `broadcast`
13. Heartbeat 25s, timeout 60s
14. Manter mapa `clientId → ws` pra mensagens direcionadas (futuro)

### Fase D — Integração com Drive
15. Detectar `G:\` montado/desmontado, emitir `central:status drive.connected`
16. Watcher (chokidar) na pasta `00. ORGANIZADO/` pra refletir mudanças manuais (opcional, fase 2)

## 9. Plano de implementação (lado mobile)

Ver `MOBILE_FIXES_PLAN.md` (separado).

## 10. Versionamento

Sugiro versionar o protocolo: adicionar `protocolVersion: 1` no handshake. Se mudar, o mobile precisa lidar com upgrade.

## 11. Testes mínimos antes de produção

- [ ] Criar evento no site → aparece em < 1s no mobile (testar com 2 celulares)
- [ ] Tirar foto no mobile → aparece em < 2s na Galeria do site
- [ ] Desconectar Wi-Fi do mobile, tirar 3 fotos, reconectar → fila enviada e sincroniza
- [ ] Deletar foto no site → some do mobile + do Drive
- [ ] Reiniciar servidor → mobile reconecta automaticamente
- [ ] 100 fotos em 5 minutos → não trava
- [ ] Token inválido → conexão WS fechada com mensagem clara
