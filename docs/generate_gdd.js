// Gerador do GDD do projeto Contourline Backup.
// Roda: node generate_gdd.js  → produz GDD_Contourline_Backup.docx

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, PageOrientation, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign,
  PageNumber, PageBreak,
} = require('docx');

// ── Paleta de cores ──────────────────────────────────────────────────
const C = {
  primary: '1F8BFF',
  primaryDark: '0F5BB5',
  primaryBright: '5BA9FF',
  surface: 'F3F7FC',
  surfaceDark: 'E5EDF7',
  text: '1A1F2E',
  muted: '5D6B7F',
  border: 'D5E1F0',
  borderLight: 'EBF1F8',
  white: 'FFFFFF',
  accent: '00C16A',
  warn: 'FFB341',
  error: 'FF453A',
};

// ── Helpers ──────────────────────────────────────────────────────────
function h1(text, opts = {}) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, color: C.primaryDark, size: 36, font: 'Arial' })],
    spacing: { before: 360, after: 200 },
    ...opts,
  });
}

function h2(text, opts = {}) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, color: C.primary, size: 28, font: 'Arial' })],
    spacing: { before: 280, after: 140 },
    ...opts,
  });
}

function h3(text, opts = {}) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, color: C.text, size: 22, font: 'Arial' })],
    spacing: { before: 200, after: 100 },
    ...opts,
  });
}

function p(textOrRuns, opts = {}) {
  const children = Array.isArray(textOrRuns)
    ? textOrRuns
    : [new TextRun({ text: textOrRuns, color: C.text, size: 22, font: 'Arial' })];
  return new Paragraph({
    children,
    spacing: { before: 80, after: 80, line: 320 },
    ...opts,
  });
}

function pMuted(text) {
  return new Paragraph({
    children: [new TextRun({ text, color: C.muted, size: 20, font: 'Arial', italics: true })],
    spacing: { before: 60, after: 100, line: 300 },
  });
}

function pQuote(text) {
  return new Paragraph({
    children: [new TextRun({ text, color: C.primaryDark, size: 24, font: 'Arial', italics: true })],
    spacing: { before: 200, after: 200, line: 320 },
    alignment: AlignmentType.CENTER,
    indent: { left: 720, right: 720 },
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    children: [new TextRun({ text, color: C.text, size: 22, font: 'Arial' })],
    spacing: { before: 40, after: 40, line: 300 },
  });
}

function bulletBold(label, rest) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    children: [
      new TextRun({ text: label, bold: true, color: C.text, size: 22, font: 'Arial' }),
      new TextRun({ text: rest, color: C.text, size: 22, font: 'Arial' }),
    ],
    spacing: { before: 40, after: 40, line: 300 },
  });
}

function br() {
  return new Paragraph({ children: [new TextRun({ text: '' })], spacing: { before: 80, after: 80 } });
}

// Tabela com cabeçalho azul + zebra
const borderAll = (color = C.border) => {
  const b = { style: BorderStyle.SINGLE, size: 2, color };
  return { top: b, bottom: b, left: b, right: b };
};

function tableCell(text, opts = {}) {
  const {
    bold = false,
    color = C.text,
    fill = null,
    width = 4680,
    align = AlignmentType.LEFT,
    fontSize = 20,
  } = opts;
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: borderAll(),
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    children: [
      new Paragraph({
        alignment: align,
        children: [new TextRun({ text: String(text), bold, color, size: fontSize, font: 'Arial' })],
      }),
    ],
  });
}

function tableHeader(cols, widths) {
  return new TableRow({
    tableHeader: true,
    children: cols.map((text, i) =>
      tableCell(text, { bold: true, color: C.white, fill: C.primary, width: widths[i], fontSize: 20 })
    ),
  });
}

function tableRow(cells, widths, zebra = false) {
  return new TableRow({
    children: cells.map((c, i) => {
      if (c && typeof c === 'object' && 'text' in c) {
        return tableCell(c.text, { ...c, width: widths[i], fill: zebra ? C.surface : null });
      }
      return tableCell(c, { width: widths[i], fill: zebra ? C.surface : null });
    }),
  });
}

function makeTable(headers, rows, columnWidths) {
  const total = columnWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths,
    rows: [
      tableHeader(headers, columnWidths),
      ...rows.map((r, i) => tableRow(r, columnWidths, i % 2 === 1)),
    ],
  });
}

// "Callout" box (parágrafo com fundo + borda lateral)
function callout(text, opts = {}) {
  const { fill = C.surface, accent = C.primary } = opts;
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9360, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              left: { style: BorderStyle.SINGLE, size: 24, color: accent },
            },
            shading: { fill, type: ShadingType.CLEAR },
            margins: { top: 200, bottom: 200, left: 280, right: 200 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text, color: C.text, size: 22, font: 'Arial' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ── Conteúdo ─────────────────────────────────────────────────────────

const TODAY = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

// ===== CAPA =====
const capa = [
  new Paragraph({ children: [new TextRun({ text: '' })], spacing: { before: 1200 } }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'CONTOURLINE', bold: true, color: C.primaryDark, size: 96, font: 'Arial' })],
    spacing: { after: 0 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'BACKUP', bold: true, color: C.primary, size: 56, font: 'Arial', characterSpacing: 200 })],
    spacing: { before: 100, after: 400 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Product Design Document', color: C.muted, size: 32, font: 'Arial' })],
    spacing: { after: 600 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Central de Midia Inteligente para a fabrica de autoestima', color: C.text, size: 24, font: 'Arial', italics: true })],
    spacing: { after: 1200 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `Versao 1.0  ·  ${TODAY}`, color: C.muted, size: 20, font: 'Arial' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Mobile + Central + Google Drive', color: C.primary, size: 20, font: 'Arial', bold: true })],
    spacing: { before: 100 },
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ===== SUMARIO EXECUTIVO =====
const sumario = [
  h1('1. Sumario Executivo'),
  pQuote('Nao e um app de backup. E o estudio em campo da Contourline.'),

  h3('O que e'),
  p('Contourline Backup e um sistema integrado de tres pecas — app mobile, Central de Midia (desktop/web) e Google Drive — desenhado especificamente pra fabricar conteudo, gerar leads e construir autoridade a partir de tudo que acontece em eventos, treinamentos, visitas e congressos da Contourline.'),

  h3('Para quem'),
  bullet('Videomakers da Contourline em campo (FULL FACE, Boat on Boat Orlando, visitas)'),
  bullet('Gestores de marketing organizando o pipeline de conteudo'),
  bullet('Equipe comercial precisando de material rapido pra leads pos-evento'),
  bullet('Medicos e clientes recebendo dossies personalizados pos-treinamento'),

  h3('O que entrega'),
  bullet('Captura profissional com metadados ricos (equipamento, evento, medico, GPS, audio)'),
  bullet('Backup automatico durante a captura (nao depois)'),
  bullet('Organizacao instantanea por evento, equipamento e tipo de projeto'),
  bullet('Pipeline marketing/lead com integracao RD Station'),
  bullet('Galeria com busca semantica via reconhecimento visual'),
  bullet('Director\'s monitor — cliente ve viewfinder remoto durante demos'),

  h3('Diferencial competitivo'),
  callout('Enquanto Google Fotos faz backup passivo e Frame.io oferece proxy pos-evento, a Contourline faz as duas coisas durante o evento — e ainda transforma cada captura em lead qualificado no CRM. E o que nenhuma fabrica de equipamentos estetico no Brasil tem.'),

  new Paragraph({ children: [new PageBreak()] }),
];

// ===== VISAO DE PRODUTO =====
const visao = [
  h1('2. Visao de Produto'),

  h2('2.1 O problema'),
  p('A Contourline produz quantidade massiva de midia de alto valor — demos no FULL FACE, treinamentos com cirurgioes, lives no Boat on Boat, visitas de prospects na fabrica. Hoje essa midia se perde em:'),
  bullet('Celulares espalhados sem organizacao'),
  bullet('Pastas sem nomeacao consistente no Drive'),
  bullet('Arquivos esquecidos de eventos passados'),
  bullet('Conteudo gravado e nunca postado'),
  bullet('Leads que nao chegam no CRM apos eventos'),

  h2('2.2 A solucao'),
  p('Um sistema que transforma o ato de capturar em pipeline de marketing. Cada foto ou video que sai do celular ja nasce com:'),
  bullet('Evento atrelado (FULL FACE 2026, Dia 2, Stand Contourline)'),
  bullet('Equipamento detectado (Ultrapulse, Lumenis, FULL FACE)'),
  bullet('Medico ou pessoa no frame (via face recognition)'),
  bullet('Pasta de destino correta no Drive (segue a arvore ORGANIZADO)'),
  bullet('Consentimento digital LGPD quando aplicavel'),
  bullet('Lead criado no RD Station se for visitante'),

  h2('2.3 A historia que isso conta'),
  callout(
    'Medico passou no FULL FACE -> recebeu dossie personalizado -> ' +
    'comprou equipamento -> veio visitar a fabrica -> recebeu album da visita -> ' +
    'virou case -> apareceu no Boat on Boat -> ciclo completo, tudo no mesmo app.'
  ),
  pMuted('Esse e o tipo de funil que vende equipamento de R$ 200 mil sozinho.'),

  h2('2.4 Tres pilares de identidade'),
  ...[
    { name: 'AURA', desc: 'O anel pontilhado-assinatura do logo Contourline pulsa em todos os elementos vivos do app — botoes de captura, status, focus rings. E o elemento mais identificavel da marca, agora animado.' },
    { name: 'SMOKE', desc: 'Fundos com radial blooms azuis flutuando atras do conteudo. Da sensacao de "camara escura premium". Glassmorphism nos cards com blur nativo + highlight gradient.' },
    { name: 'GLOW', desc: 'Sistema de sombras multi-camada em tudo que e interativo. Foco = ganha glow; passivo = fica plano. Cores variam por estado: azul (idle), vermelho (REC), verde (synced).' },
  ].flatMap(({ name, desc }) => [
    new Paragraph({
      children: [
        new TextRun({ text: name, bold: true, color: C.primary, size: 24, font: 'Arial' }),
        new TextRun({ text: '  —  ', color: C.muted, size: 22, font: 'Arial' }),
        new TextRun({ text: desc, color: C.text, size: 22, font: 'Arial' }),
      ],
      spacing: { before: 120, after: 120, line: 320 },
    }),
  ]),

  new Paragraph({ children: [new PageBreak()] }),
];

// ===== CASOS DE USO =====
const casosUso = [
  h1('3. Casos de Uso Reais'),
  p('Cada caso abaixo veio de demanda real da Contourline. O sistema foi desenhado pra atender todos eles.'),

  h2('3.1 FULL FACE 2026 (evento ativo)'),
  p('Congresso anual da Contourline em Sao Paulo (15-29 de maio de 2026), Distrito Anhembi. Equipe completa de videomakers cobrindo palestras, demos no stand, treinamentos paralelos.'),
  h3('Como o sistema atua'),
  bulletBold('Antes do evento: ', 'gestor cria projeto "FULL FACE 2026" na Central. Todos os celulares pareados entram automaticamente no modo do evento.'),
  bulletBold('Durante: ', 'cada arquivo nasce taggeado FULL FACE 2026 > Dia X > Stand. Live no stand espelha viewfinder do videomaker em TV gigante.'),
  bulletBold('Pos-demo: ', 'IA detecta equipamento (Ultrapulse) e medico (face recognition) — dossie automatico nasce. Medico recebe link personalizado em 24h.'),
  bulletBold('Fim do dia: ', 'highlight reel de 60s gerado automaticamente, pronto pra Instagram. Equipe vai jantar.'),

  h2('3.2 Boat on Boat (Orlando, internacional)'),
  p('Evento internacional. Time pequeno cobrindo, Wi-Fi questionavel, idiomas mistos (PT/EN/ES), HIPAA aplicavel.'),
  h3('Como o sistema atua'),
  bulletBold('Offline-first robusto: ', 'celular grava em 4K local + proxy compacto guardado. Sincroniza quando volta pro hotel.'),
  bulletBold('Consentimento digital: ', 'modelo escaneia QR do videomaker, assina via touch. Foto + consentimento salvos juntos (compliance HIPAA).'),
  bulletBold('i18n: ', 'app em ingles automaticamente quando GPS detecta US.'),
  bulletBold('Caixa-preta: ', 'mesmo se celular cair na agua, ultimo segundo gravado ja foi backup parcial.'),

  h2('3.3 Treinamento medico na fabrica'),
  p('Medico vem aprender a operar Ultrapulse Pro ou outro equipamento. Sessao dura 2-4h. Quer levar material de referencia pra praticar depois.'),
  h3('Como o sistema atua'),
  bulletBold('Setup: ', 'videomaker abre app -> "Modo Treinamento" -> escolhe medico (lista vem do RD Station) + equipamento + area tratada.'),
  bulletBold('Captura: ', 'cada clip vai pro dossie unico daquele medico naquele equipamento. Estrutura: intro, procedimento 1, procedimento 2, duvidas.'),
  bulletBold('Entrega: ', 'medico recebe link privado contourline.app/dr-silva/treinamento-fullface-mar2026 — assistir, fazer download, voltar quando quiser.'),
  bulletBold('Bonus comercial: ', 'esse link e remarketing premium. Quando medico re-acessa, equipe sabe. Vira gatilho de venda.'),

  h2('3.4 Visita de prospect na fabrica'),
  p('Cliente em potencial vem conhecer a producao. Quer ver de perto a qualidade, fazer perguntas, sentir a marca.'),
  h3('Como o sistema atua'),
  bulletBold('Check-in: ', 'visitante escaneia QR do videomaker -> vira lead automatico no RD Station + entra no "Modo Visita".'),
  bulletBold('Durante: ', 'fotos do tour ficam organizadas no projeto da visita dele.'),
  bulletBold('Pos-visita: ', 'mesmo dia, recebe SMS/WhatsApp com link das fotos da experiencia. Material proprio de remarketing.'),
  bulletBold('Para o time: ', 'aparece no dashboard da Central como lead novo, ja taggeado por interesse (equipamento que mais fotografou).'),

  h2('3.5 Eventos internos e congressos'),
  p('Lancamentos, retrospectivas, parcerias. Cobertura interna pra historico + marketing institucional.'),
  bulletBold('Tipos de projeto suportados: ', 'eventos, treinamentos, visitas, demandas, conteudo interno (5 categorias visiveis na navegacao).'),
  bulletBold('Organizacao: ', 'cada tipo tem template proprio de pastas no Drive, alinhado com a arvore ORGANIZADO.'),

  new Paragraph({ children: [new PageBreak()] }),
];

// ===== ARQUITETURA =====
const arquitetura = [
  h1('4. Arquitetura do Sistema'),

  h2('4.1 Visao macro'),
  p('Tres camadas trabalhando em sincronia:'),

  makeTable(
    ['Camada', 'Responsabilidade', 'Tecnologia'],
    [
      ['CELULAR', 'Captura, fila local, ate primeira sincronia', 'Expo SDK 55 + React Native 0.83'],
      ['CENTRAL', 'Recebe, organiza, da nomes, expoe galeria', 'Node + Express + Drive Stream'],
      ['DRIVE', 'Sincronizacao final, backup, acesso seguro', 'Google Drive Stream (G:\\Meu Drive)'],
    ],
    [2200, 4400, 2760]
  ),

  br(),
  h2('4.2 Fluxo de uma captura'),
  callout(
    '1. Videomaker fotografa/grava no celular\n' +
    '2. Arquivo entra na fila local (galeria do app)\n' +
    '3. Envia via REST (POST /api/upload/mobile) pra Central\n' +
    '4. Central salva em G:\\Meu Drive\\1. MARKETING\\00. ORGANIZADO\\01. EVENTOS\\<evento>\\01. BRUTO\\Dia_N\\{FOTOS|VIDEOS}\\\n' +
    '5. Drive Stream sincroniza pra nuvem em background\n' +
    '6. Status atualizado no celular: "sincronizado"'
  ),

  h2('4.3 Pareamento'),
  p('Protocolo simples baseado em pair-code de uso unico:'),
  bulletBold('No PC: ', 'admin clica "Conectar celular" -> Central gera codigo de 6 caracteres (3 letras + 3 digitos) com TTL 30 min.'),
  bulletBold('No celular: ', 'app descobre Centrais via scan HTTP da subnet (sem mDNS nativo, compativel com Expo Go) -> usuario toca na Central -> abre QR scanner.'),
  bulletBold('Troca de token: ', 'celular envia pair code via POST /api/devices/pair -> recebe deviceToken permanente (24 bytes hex).'),
  bulletBold('Armazenamento seguro: ', 'token vai pro Keychain (iOS) / Keystore (Android) via expo-secure-store. Nunca em plaintext.'),

  h2('4.4 Auth pos-pareamento'),
  p('Todo request do mobile pra Central manda header x-device-token. Server consulta devices.json (futuramente SQLite) e valida. Auth limpa, sem OAuth desnecessario.'),

  h2('4.5 Estrutura de pastas no Drive'),
  p('Localizacao: G:\\Meu Drive\\1. MARKETING\\00. ORGANIZADO\\'),
  p('11 categorias principais, numeradas para forcar ordenacao alfabetica:'),

  makeTable(
    ['Pasta', 'Conteudo'],
    [
      ['01. EVENTOS', 'Por evento (AAAA-MM-DD_NomeEvento) com Dia_1, Dia_2... e BRUTO/SELECIONADOS/EDICAO/ENTREGUE'],
      ['02. EQUIPAMENTOS', 'Por marca (CONTOURLINE, LUMENIS) -> por modelo+codigo (UNYQUE_PRO_UNQPRO)'],
      ['03. TREINAMENTOS', 'Dossies dos medicos, sessoes de capacitacao'],
      ['04. ENTREGAS', 'Material final entregue ao cliente'],
      ['05. CONTEUDO_SOCIAL', 'Pronto pra postar (Instagram, YouTube)'],
      ['06. ARTES_E_DESIGN', 'Designs, motion, identidade'],
      ['07. BANCO_IMAGENS', 'Biblioteca reutilizavel'],
      ['08+', 'Demanda, institucional, referencias, templates...'],
    ],
    [2700, 6660]
  ),

  br(),
  pMuted('Convencao: pastas numeradas (01., 02., ...) sao ordenacao forcada. _ATALHOS_ para cross-referencias. _TEMPLATES_ com modelos vazios prontos.'),

  new Paragraph({ children: [new PageBreak()] }),
];

// ===== DESIGN SYSTEM =====
const designSystem = [
  h1('5. Design System Aura'),

  h2('5.1 Filosofia visual'),
  p('Premium dark + glassmorphism + glow em camadas. Inspirado em apps de pro-grade (cameras, audio interfaces, editores de video) que comunicam "ferramenta seria, nao toy".'),

  h2('5.2 Paleta de cores'),
  makeTable(
    ['Token', 'Hex', 'Uso'],
    [
      ['bg.base', '#06090F', 'Fundo do app'],
      ['bg.surface', '#0C111B', 'Cards e sheets'],
      ['bg.surfaceHi', '#131A28', 'Hover / active'],
      ['aura.primary', '#1F8BFF', 'Azul Contourline (estado idle)'],
      ['aura.primaryDim', '#0F5BB5', 'Azul escuro (titulos, accents)'],
      ['state.record', '#FF3B30', 'Gravando (REC)'],
      ['state.success', '#00C16A', 'Sincronizado / OK'],
      ['state.warning', '#FFB341', 'Aguardando'],
      ['state.error', '#FF453A', 'Falha de envio'],
      ['text.primary', '#FFFFFF', 'Texto principal'],
      ['text.tertiary', '#8FA1B8', 'Texto secundario'],
      ['text.muted', '#5D6B7F', 'Texto fraco'],
    ],
    [2400, 1700, 5260]
  ),

  br(),
  h2('5.3 Sistema de glow (sombras multi-camada)'),
  p('Cada nivel combina shadowColor + shadowOpacity + shadowRadius (iOS) e elevation (Android):'),

  makeTable(
    ['Nivel', 'Quando usar'],
    [
      ['none', 'Sem destaque'],
      ['soft', 'Cards e icones inativos'],
      ['medium', 'Botoes em foco, cards ativos'],
      ['strong', 'Botao central de captura, status criticos'],
      ['record', 'Estado gravacao (vermelho)'],
      ['success', 'Estado sincronizado (verde)'],
    ],
    [2000, 7360]
  ),

  br(),
  h2('5.4 O anel-assinatura (Aura Ring)'),
  p('Elemento visual mais identificavel da marca: 60 pontos posicionados em circulo, animados em "respiracao" continua (opacity 0.55 -> 1.0, scale 0.96 -> 1.02, ciclo 2.2s).'),
  h3('Estados visuais'),
  bullet('idle — azul respiranto (app aberto, esperando)'),
  bullet('active — azul brilhante (botao tocado)'),
  bullet('record — vermelho pulsando no ritmo do audio captado'),
  bullet('sync — verde girando (upload em progresso)'),
  bullet('warning — laranja (precisa atencao)'),
  bullet('error — vermelho intenso (falha)'),

  h2('5.5 Componentes-chave'),
  makeTable(
    ['Componente', 'Funcao'],
    [
      ['AuraRing', 'Anel pontilhado animado, usado em splash, captura, status'],
      ['AuraButton', 'Botao com glow + scale-press, 4 variantes x 3 tamanhos'],
      ['GlassCard', 'Cartao glassmorphism (BlurView + highlight gradient + borda)'],
      ['CaptureButton (Fase 5)', 'Botao central da camera: anel pulsa com audio, 3 modos foto/video/segure'],
      ['VuMeter (Fase 5)', 'Barras L/R animadas em 60fps refletindo nivel de audio'],
      ['StatusBadge', 'Badge de upload (enviado/enviando/pendente/erro) com glow apropriado'],
    ],
    [3000, 6360]
  ),

  br(),
  h2('5.6 Tipografia'),
  p('Familia: Inter (carregada via @expo-google-fonts/inter). Escala base 4:'),
  makeTable(
    ['Token', 'Tamanho', 'Uso'],
    [
      ['xs', '11pt', 'Tags, badges'],
      ['sm', '13pt', 'Captions'],
      ['base', '15pt', 'Body'],
      ['md', '17pt', 'Body destacado'],
      ['lg', '20pt', 'Subtitulos'],
      ['xl', '24pt', 'Titulos de tela'],
      ['2xl', '32pt', 'Titulos hero'],
      ['3xl', '42pt', 'Display'],
    ],
    [1800, 1800, 5760]
  ),

  new Paragraph({ children: [new PageBreak()] }),
];

// ===== PIPELINE MARKETING =====
const pipelineMkt = [
  h1('6. Pipeline de Marketing & Leads'),

  h2('6.1 A jornada completa'),
  p('Cada interacao captada pelo sistema vira insumo de marketing e/ou lead qualificado:'),

  callout(
    'CAPTURA (mobile) -> ORGANIZACAO (Central) -> DISTRIBUICAO (Drive) -> NUTRICAO (RD Station) -> CONVERSAO (vendas) -> CASE (de volta pra captura)'
  ),

  h2('6.2 Como cada captura vira lead'),
  h3('Visitante curioso no stand do FULL FACE'),
  bullet('Videomaker tira foto do visitante segurando equipamento'),
  bullet('Escaneia QR do cracha -> dados do visitante puxados do registro do evento'),
  bullet('Cria lead no RD Station automaticamente com tag "FULL FACE 2026 / Stand"'),
  bullet('Visitante recebe SMS com link das fotos: contourline.app/visitor/abc123'),
  bullet('Quando ele clica, e tracking: vira lead "Quente" no RD'),
  bullet('Equipe comercial recebe alerta de novo lead quente do FULL FACE'),

  h3('Medico em treinamento'),
  bullet('Captura sessao inteira atrelada ao perfil do medico'),
  bullet('IA detecta equipamentos usados (Ultrapulse, Lumenis)'),
  bullet('Dossie privado gerado: intro + procedimentos + duvidas'),
  bullet('Medico recebe link personalizado'),
  bullet('Cada re-visita ao link e tracked -> sinal forte de interesse de compra'),
  bullet('Apos 3 visitas, lead vira "Pronto pra abordar" no RD'),

  h2('6.3 Integracao com RD Station'),
  bullet('Leads criados via API do RD com tags apropriadas'),
  bullet('Equipamentos visualizados sao adicionados como interesse'),
  bullet('Eventos viram campanhas no RD Marketing'),
  bullet('Open rate dos dossies entra no score de lead'),
  bullet('Equipe comercial ja recebe leads com contexto rico'),

  h2('6.4 Marketing institucional automatico'),
  p('Highlight Reel automatico: ao final de cada dia de evento, IA monta corte de 60 segundos com os melhores momentos baseado em:'),
  bullet('Estabilidade do enquadramento (sem tremor)'),
  bullet('Qualidade do audio captado (sem clipping)'),
  bullet('Detecccao de rostos sorrindo'),
  bullet('Equipamentos Contourline em foco'),
  bullet('Diversidade visual (locais e angulos diferentes)'),
  pMuted('Pronto pra postar no Instagram da Contourline antes da equipe ir jantar.'),

  new Paragraph({ children: [new PageBreak()] }),
];

// ===== FUNCIONALIDADES =====
const funcionalidades = [
  h1('7. Funcionalidades-chave'),

  h2('7.1 Auto-discovery de Central'),
  p('Sem precisar instalar modulo nativo (mDNS/Bonjour). Faz scan HTTP da subnet do celular procurando endpoints que respondem como Central Contourline. Funciona em Expo Go, leva ~3-5s em rede /24.'),

  h2('7.2 Camera propria com metadados ricos'),
  p('Cada arquivo nasce com:'),
  bullet('GPS + altitude + bussola (direcao da camera)'),
  bullet('Nivel de audio (waveform embutido)'),
  bullet('Acelerometro (detecta handheld / tripe / gimbal)'),
  bullet('Deteccao de rostos no frame'),
  bullet('Condicoes de luz'),
  bullet('Tag do evento (auto pelo calendario + GPS)'),

  h2('7.3 VU meter circular ao redor do mic'),
  p('Quando grava video, anel verde-amarelo-vermelho ao redor do icone do microfone reage ao audio em tempo real. Detecta clipping e avisa. Quando mic externo USB-C conecta, badge "MIC EXTERNO" aparece.'),

  h2('7.4 Antes/Depois com overlay fantasma'),
  p('Feature dedicada pra procedimento estetico. Ao tirar a foto "antes", app salva angulo + luz. Na hora do "depois", mostra overlay translucido do antes pra alinhar identico. Par perfeito pra Instagram da Contourline e portfolio do medico.'),

  h2('7.5 Reconhecimento de equipamento por IA'),
  p('Camera identifica visualmente Ultrapulse Pro, Lumenis, FULL FACE, etc. quando aparecem no frame. Tag automatica + link pro produto no Central. Modelo treinado com fotos dos equipamentos que ja existem.'),

  h2('7.6 Consentimento digital LGPD'),
  p('Paciente/modelo escaneia QR do videomaker, assina via touch. Foto do rosto vinculada ao consentimento. Antes da camera abrir, ja esta tudo salvo. Critico pra HIPAA em Boat on Boat.'),

  h2('7.7 Director\'s Monitor (proxy ao vivo)'),
  p('Killer feature: enquanto videomaker filma em 4K local, envia proxy de baixa resolucao via Wi-Fi/hotspot pra Central. Editor ja corta no Central enquanto videomaker ainda filma. Em demos, cliente sentado em frente ao PC ve viewfinder remoto em tempo real e aprova enquadramento.'),

  h2('7.8 Multi-phone mesh'),
  p('Dois ou mais videomakers no mesmo evento -> celulares formam mesh local. IA sugere coordenacao ("Marina pega a noiva, voce o noivo"). Quando termina, vira multi-cam timeline automatica no Central.'),

  h2('7.9 Drag-and-drop sem fio'),
  p('Na Central, com celular pareado, arrasta video da galeria do celular direto pra pasta no Drive. Sem cabo, sem importar. Tipo AirDrop, mas com a hierarquia de pastas ORGANIZADO ja embutida.'),

  h2('7.10 Caixa-preta do evento'),
  p('Tudo versionado e backupeado em tempo real. Se celular cair na agua durante o evento, ate o ultimo segundo antes do tombo ta salvo. Nao existe mais "perdi a filmagem".'),

  new Paragraph({ children: [new PageBreak()] }),
];

// ===== STACK TECNICA =====
const stackTec = [
  h1('8. Stack Tecnica'),

  h2('8.1 Mobile'),
  makeTable(
    ['Camada', 'Tecnologia', 'Versao'],
    [
      ['Framework', 'Expo SDK', '55.0.0'],
      ['Runtime', 'React Native', '0.83.6'],
      ['Linguagem', 'JavaScript + TypeScript progressivo', 'ES2023'],
      ['Navegacao', '@react-navigation (stack + bottom tabs)', '7.x'],
      ['Animacoes', 'Animated (RN) + Reanimated 4 (dev build)', '4.2.1'],
      ['Camera', 'expo-camera', '55.x'],
      ['Audio (VU)', 'expo-av (metering)', '55.x'],
      ['Blur', 'expo-blur (glassmorphism)', '55.x'],
      ['SVG', 'react-native-svg (anel)', '15.15.3'],
      ['Skia (Fase 5)', '@shopify/react-native-skia (dev build)', '2.x'],
      ['Storage seguro', 'expo-secure-store (token, deviceId)', '15.x'],
      ['Storage simples', '@react-native-async-storage/async-storage', '2.x'],
      ['Network', '@react-native-community/netinfo', '11.x'],
      ['Galeria', '@shopify/flash-list (Fase 6)', '2.x'],
      ['UI icons', 'lucide-react-native', '1.16.0'],
      ['Tipografia', 'Inter via @expo-google-fonts', '0.4.0'],
    ],
    [2400, 4900, 2060]
  ),

  br(),
  h2('8.2 Central (sitelocal)'),
  makeTable(
    ['Camada', 'Tecnologia'],
    [
      ['Backend', 'Node.js v20+ / Express 4.x (monolitico, 6700 linhas — alvo de refactor)'],
      ['Frontend V1 (legado)', 'Vanilla JS + CSS'],
      ['Frontend V2 (em migracao)', 'Vanilla JS modular (public/v2/js/pages/*) + CSS tokens'],
      ['Desktop wrapper', 'Electron (launcher/)'],
      ['Banco', 'JSON no Drive com fallback local (alvo migrar pra SQLite)'],
      ['Auth', 'Google OAuth 2.0 + senha local + device token'],
      ['Upload', 'Multer com diskStorage customizado'],
      ['Visao computacional', 'CLIP + face-recognition (busca semantica)'],
      ['Sync com Drive', 'Google Drive Stream (automatico, zero-ops)'],
    ],
    [2800, 6560]
  ),

  br(),
  h2('8.3 Drive (armazenamento)'),
  p('Google Drive Stream sincroniza automaticamente o conteudo da Central (G:\\Meu Drive\\1. MARKETING\\00. ORGANIZADO) pra nuvem. Custo zero de banda extra, sem S3, sem worker de upload. Solucao "low-ops" perfeita pra escala atual.'),

  new Paragraph({ children: [new PageBreak()] }),
];

// ===== PLANO MOBILE =====
const planoMobile = [
  h1('9. Plano de 8 Fases — Mobile'),
  p('Cada fase entrega valor sozinha. Cada uma vira commit isolado em branch feat/aura-redesign no repositorio contourline-mobile.'),

  makeTable(
    ['#', 'Fase', 'Tempo', 'Status'],
    [
      [{ text: '0' }, { text: 'Setup + Design tokens Aura' }, { text: '1/2 dia' }, { text: 'OK', color: C.accent, bold: true }],
      [{ text: '1' }, { text: 'Splash dismiss-on-ready + SecureStore + NetInfo' }, { text: '1 dia' }, { text: 'OK', color: C.accent, bold: true }],
      [{ text: '2' }, { text: 'Pareamento Aura (discovery + QR + manual)' }, { text: '2-3 dias' }, { text: 'OK', color: C.accent, bold: true }],
      [{ text: '3' }, { text: 'Tab Bar Aura (5 tabs + camera flutuante 76px)' }, { text: '1 dia' }, { text: 'Proxima', color: C.primary, bold: true }],
      [{ text: '4' }, { text: 'Tela Inicio (dashboard, evento ativo, status)' }, { text: '1-2 dias' }, { text: '—' }],
      [{ text: '5' }, { text: 'Camera Aura (anel Skia + VU + foco + mic externo)' }, { text: '3-5 dias' }, { text: '—' }],
      [{ text: '6' }, { text: 'Galeria + Upload (FlashList + retry exponencial)' }, { text: '2-3 dias' }, { text: '—' }],
      [{ text: '7' }, { text: 'WebSocket bidirecional (compartilhada com site)' }, { text: '3-5 dias' }, { text: '—' }],
    ],
    [600, 5260, 1700, 1800]
  ),

  br(),
  h2('9.1 Detalhamento das fases mobile'),

  h3('Fase 0 — Setup + Tokens (concluida)'),
  bullet('Branch feat/aura-redesign criada no contourline-mobile'),
  bullet('Dependencias: react-native-reanimated 4.2.1 instalada (revertida pra Animated padrao por incompat com Expo Go)'),
  bullet('src/theme/ com 8 arquivos (colors, glow, motion, aura, smoke, spacing, radii, typography)'),
  bullet('src/components/aura/ com AuraRing, AuraButton, GlassCard'),

  h3('Fase 1 — Splash + Boot (concluida)'),
  bullet('Splash dismiss-on-ready: nao espera mais 1.5s, dismissa quando boot real termina'),
  bullet('Token e deviceId migrados pra SecureStore (Keychain/Keystore nativo)'),
  bullet('NetInfo listener pronto pra usar'),
  bullet('expo-splash-screen previne flash branco entre splashes'),
  bullet('src/boot/bootSequence.js orchestra tudo'),

  h3('Fase 2 — Pareamento (concluida)'),
  bullet('Tela ConnectAuraScreen com auto-discovery via scan HTTP'),
  bullet('Lista Centrais encontradas com nome do PC + IP + status Online'),
  bullet('Botoes Aura: "Procurar novamente", "Escanear QR diretamente", "Conexao manual"'),
  bullet('Modal de conexao manual com validacao via pingServer'),
  bullet('BYPASS removido: hasToken=true vai pra Main, sem token vai pra ConnectAura'),
  bullet('Botao dev "(dev) pular por agora" pra continuar trabalhando outras fases'),

  h3('Fase 3 — Tab Bar (proxima)'),
  bullet('5 tabs: Inicio / Projetos / Camera (central flutuante 76px) / Galeria / Upload'),
  bullet('Glassmorphism no fundo da tab bar'),
  bullet('Botao central com glow forte + anel decorativo'),
  bullet('Badge de upload pendente na tab Upload'),
  bullet('Long-press no botao central abre QuickActions'),

  h3('Fase 4 — Tela Inicio'),
  bullet('Card EVENTO ATIVO full-bleed com cover + status'),
  bullet('Connection badge "Servidor conectado" / "Sem conexao"'),
  bullet('Acoes rapidas em grid 2x2 (Camera, Galeria, QR Evento, Pasta rapida)'),
  bullet('Carrossel horizontal de eventos em destaque'),
  bullet('Status do dia (fila, enviados, sincronizados)'),

  h3('Fase 5 — Camera Aura (a estrela)'),
  bullet('CaptureButton com Skia (anel pontilhado 60 pontos, renderizado em GPU)'),
  bullet('3 modos: Foto / Video segure (hold-to-record) / Video lock (tap-to-toggle)'),
  bullet('VU meter L/R em barras verticais animadas a 60fps'),
  bullet('Slider de exposicao lateral (sol/lua)'),
  bullet('Frame de foco no rosto ("Rosto focado", "Foco travado")'),
  bullet('Badge mic externo USB-C: anel VU muda de cor quando plugado'),
  bullet('Header com nome do projeto ativo + flash + flip + settings'),
  bullet('Requer development build (Skia + Reanimated)'),

  h3('Fase 6 — Galeria + Upload'),
  bullet('FlashList agrupada por dia (timeline visual)'),
  bullet('Multi-select com badge "X selecionados · Y MB"'),
  bullet('Status visual por item (check verde / circulo azul / relogio / X vermelho)'),
  bullet('Tela Upload com progresso por destino (Central + Drive)'),
  bullet('Retry exponencial backoff (1s -> 2s -> 4s -> 8s -> 30s -> 2min)'),
  bullet('NetInfo listener retoma fila quando Wi-Fi volta'),

  h3('Fase 7 — WebSocket bidirecional'),
  bullet('Endpoint /ws/device no server, /ws/admin pro web'),
  bullet('Heartbeat ping/pong a cada 30s'),
  bullet('Eventos: device.connected, device.disconnected, upload.progress, file.uploaded, drive.synced'),
  bullet('Substitui o polling 10s da Central'),
  bullet('Base pra Director\'s Monitor (proxy ao vivo)'),

  new Paragraph({ children: [new PageBreak()] }),
];

// ===== PLANO SITE =====
const planoSite = [
  h1('10. Plano de 8 Fases — Site (sitelocal V2)'),
  p('Espelha o plano mobile. Site = gemeo desktop do mobile. Branch feat/aura-redesign-web no sitelocal.'),

  makeTable(
    ['#', 'Fase', 'Tempo', 'Foco'],
    [
      [{ text: 'S0' }, 'Setup web + organizar wip atual', '1/2 dia', 'Limpeza'],
      [{ text: 'S1' }, 'Tokens Aura no CSS (porta do mobile)', '1/2 dia', 'Foundation'],
      [{ text: 'S2' }, 'Tela Dispositivos completa (celulares ao vivo)', '2-3 dias', 'UI'],
      [{ text: 'S3' }, 'Refactor server.js em rotas modulares', '1-2 dias', 'Arquitetura'],
      [{ text: 'S4' }, 'Tela Galeria por evento', '2-3 dias', 'UI'],
      [{ text: 'S5' }, 'Tela Upload/Sync ao vivo (3 colunas)', '1-2 dias', 'UI + state'],
      [{ text: 'S6' }, 'Dashboard Inicio (numeros reais)', '1-2 dias', 'UI'],
      [{ text: 'S7' }, 'WebSocket (compartilhada com mobile)', '3-5 dias', 'Infra'],
      [{ text: 'S8' }, 'Migracao JSONs -> SQLite', '2-3 dias', 'Arquitetura'],
    ],
    [800, 4760, 1900, 1900]
  ),

  br(),
  h2('10.1 Detalhamento das fases site'),

  h3('S0 — Setup web'),
  bullet('Organizar 180+ arquivos modificados (V1 -> V2 migration)'),
  bullet('Criar branch feat/aura-redesign-web no sitelocal'),
  bullet('Commitar wip atual em commit limpo'),
  bullet('Adicionar .claude/ ao .gitignore se necessario'),

  h3('S1 — Tokens Aura no CSS'),
  bullet('Portar src/theme/ do mobile pra public/v2/css/tokens.css'),
  bullet('Variaveis CSS: --aura-primary, --bg-base, --glow-medium, etc'),
  bullet('Componentes web reutilizaveis: AuraButton, GlassCard, AuraRing (SVG)'),
  bullet('Diferentes temas (light/dark) configurados via class no html'),

  h3('S2 — Tela Dispositivos completa'),
  bullet('Pegar o print que voce me mandou ("Nenhum celular conectado") e tornar vivo'),
  bullet('Lista lateral: avatar, nome, modelo, sinal, bateria, storage'),
  bullet('Painel direito: detalhes + galeria recebida do celular selecionado + acoes'),
  bullet('Botao "Conectar celular" abre QR fullscreen com pair-code'),
  bullet('Real-time quando S7 (WS) estiver pronto; antes disso polling 5s'),
  bullet('Ordenar por: ultimo visto / nome / arquivos enviados hoje'),

  h3('S3 — Refactor server.js'),
  bullet('server.js de 6700 linhas vira ~200 linhas (boot + middleware)'),
  bullet('routes/devices.js — todos os endpoints /api/devices/*'),
  bullet('routes/events.js — todos /api/events/*'),
  bullet('routes/upload.js — POST /api/upload/mobile e companhia'),
  bullet('routes/users.js — videomakers/admins'),
  bullet('routes/drive.js — config + sync'),
  bullet('Zero mudanca de comportamento — so faxina'),
  bullet('Adicionar testes basicos por rota'),

  h3('S4 — Galeria por evento'),
  bullet('Grid agrupado por evento, depois por dia'),
  bullet('Filtros: tipo (foto/video), device (videomaker), dia'),
  bullet('Multi-select com acoes em lote (mover, copiar, deletar, marcar favorito)'),
  bullet('Lightbox com preview de alta qualidade + EXIF visivel'),
  bullet('Botao "abrir no Drive" pra contexto fora do app'),
  bullet('Drag-and-drop pra mover entre pastas'),

  h3('S5 — Upload/Sync ao vivo'),
  bullet('3 colunas tipo Kanban: Recebendo -> Salvo na Central -> Sincronizado no Drive'),
  bullet('Cada arquivo e um card que migra entre colunas'),
  bullet('Progress bar por arquivo'),
  bullet('Botoes: retry, prioridade, cancelar'),
  bullet('Filtro: todos / pendentes / com erro'),

  h3('S6 — Dashboard Inicio'),
  bullet('Cards principais: 3 conectados / 124 hoje / 256GB usado / 98% sync'),
  bullet('Carrossel de eventos ativos (com cover bonito)'),
  bullet('Atividade recente: ultimos uploads, alertas, novos leads'),
  bullet('Proximos eventos no calendario'),

  h3('S7 — WebSocket bidirecional'),
  bullet('Mesma fase compartilhada com Fase 7 mobile'),
  bullet('Server expoe /ws/device (auth via x-device-token) e /ws/admin (auth via sessao)'),
  bullet('Eventos broadcasted: device.connected, upload.progress, file.synced'),
  bullet('Central deixa de fazer polling 10s'),

  h3('S8 — Migracao SQLite'),
  bullet('events.json + devices.json + outros viram tabelas no .db'),
  bullet('better-sqlite3 (sincrono, simples, performatico)'),
  bullet('Migration script que copia JSONs existentes pro DB'),
  bullet('Backup periodico do .db pro Drive (~5min)'),
  bullet('Resolve dor de escalabilidade quando passar de 5k eventos'),

  new Paragraph({ children: [new PageBreak()] }),
];

// ===== INTEGRACAO =====
const integracao = [
  h1('11. Como Mobile e Site Se Integram'),

  h2('11.1 Sequencia recomendada'),
  p('Recomendacao tecnica: terminar mobile ate Fase 6 antes de iniciar pesado no site. Razao: a Fase 7 (WebSocket) muda a arquitetura de comunicacao dos dois lados — fazer site antes de definir essa camada gera retrabalho.'),

  h2('11.2 Cronograma sugerido'),
  makeTable(
    ['Semana', 'Mobile', 'Site'],
    [
      ['1', 'Fase 3 + Fase 4', '—'],
      ['2', 'Fase 5 (parte 1)', '—'],
      ['3', 'Fase 5 (parte 2)', 'S0 (cleanup)'],
      ['4', 'Fase 6', 'S1 (tokens)'],
      ['5-6', 'Fase 7 (WebSocket)', 'S2 + S3 + S7 em paralelo'],
      ['7', '— (validacao)', 'S4'],
      ['8', '— (validacao)', 'S5 + S6'],
      ['9', '—', 'S8'],
    ],
    [1500, 3930, 3930]
  ),

  br(),
  pMuted('Total: ~9 semanas pra ter tudo pronto. FULL FACE 2026 (15-29 de maio) eh marco importante — mobile precisa estar nas Fases 3-6 ate la.'),

  h2('11.3 Pontos de contrato entre mobile e site'),
  bullet('REST API atual: POST /api/devices/pair, POST /api/upload/mobile, GET /api/events/mobile (ja existe, nao quebra)'),
  bullet('Pair code TTL: aumentar de 5min pra 30min no server (pendente)'),
  bullet('Endpoint /api/server/info publico pra discovery enriquecer (pendente)'),
  bullet('WebSocket /ws/device com heartbeat (Fase 7)'),
  bullet('Estrutura de pastas no Drive: convencao mantida (numeradas, dias separados)'),

  new Paragraph({ children: [new PageBreak()] }),
];

// ===== ROADMAP =====
const roadmap = [
  h1('12. Roadmap'),

  h2('12.1 Curto prazo (1-2 meses)'),
  bullet('Concluir Fases 3-7 do mobile (tudo que e UI core)'),
  bullet('Concluir S0-S3 do site (foundation + Dispositivos + refactor)'),
  bullet('Pareamento funcional ponta-a-ponta em desenvolvimento'),
  bullet('Pronto pro FULL FACE 2026'),

  h2('12.2 Medio prazo (3-4 meses)'),
  bullet('Fase 7 (WebSocket) completa nos dois lados'),
  bullet('S4-S6 do site (galeria + upload + dashboard)'),
  bullet('Reconhecimento de equipamento (Fase 9: IA)'),
  bullet('Integracao RD Station (Fase 9: marketing)'),
  bullet('Boat on Boat Orlando: deploy internacional'),

  h2('12.3 Longo prazo (6+ meses) — Features que diferenciam'),
  bullet('Director\'s Monitor com proxy ao vivo (WebRTC)'),
  bullet('Multi-phone mesh em evento'),
  bullet('Highlight reel automatico (IA visual)'),
  bullet('Dossie personalizado de medico com link unico'),
  bullet('Lead capture com QR de cracha'),
  bullet('Consentimento digital LGPD/HIPAA'),
  bullet('S8 (SQLite) — escala'),

  h2('12.4 Mercado potencial'),
  callout(
    'Se essa solucao for empacotada como produto B2B, e vendavel pra: outras fabricas de equipamentos medicos, clinicas de estetica com multiplos profissionais, ' +
    'agencias de marketing especializadas em saude, organizadores de congressos medicos. ' +
    'Estimativa: zero solucao integrada equivalente no mercado brasileiro hoje.'
  ),

  new Paragraph({ children: [new PageBreak()] }),
];

// ===== APENDICE =====
const apendice = [
  h1('13. Apendice'),

  h2('13.1 Glossario'),
  bulletBold('Aura: ', 'design system do projeto + anel pontilhado-assinatura'),
  bulletBold('Aura Ring: ', 'componente animado (60 pontos em circulo) presente em captura, splash, status'),
  bulletBold('Central: ', 'aplicacao desktop/web (sitelocal) que recebe e organiza midia'),
  bulletBold('Drive Stream: ', 'aplicativo Google que sincroniza pasta local com Google Drive transparentemente'),
  bulletBold('GlassCard: ', 'componente glassmorphism com BlurView + gradient highlight'),
  bulletBold('Pair Code: ', 'codigo de 6 chars (TTL 30min) gerado pelo desktop pra parear celular'),
  bulletBold('Device Token: ', '24 bytes hex no SecureStore que autentica todas as chamadas pos-pareamento'),
  bulletBold('Heartbeat: ', 'ping/pong WebSocket de 30s pra manter conexao viva'),
  bulletBold('Dossie: ', 'colecao de videos+fotos organizada por medico/evento, com link unico'),
  bulletBold('VU Meter: ', 'medidor visual de nivel de audio em tempo real'),
  bulletBold('Highlight Reel: ', 'corte automatico de 60s dos melhores momentos de um dia de evento'),
  bulletBold('Discovery: ', 'auto-localizacao da Central na rede sem precisar de QR (scan HTTP da subnet)'),
  bulletBold('Director\'s Monitor: ', 'recurso onde cliente/diretor ve viewfinder do celular em tempo real no PC'),
  bulletBold('Mesh: ', 'rede peer-to-peer entre celulares no mesmo evento pra coordenar capturas'),

  h2('13.2 Decisoes arquiteturais ja tomadas'),
  bulletBold('Animated padrao (RN) em vez de Reanimated: ', 'pra compatibilidade com Expo Go SDK 55 (Reanimated 4 + worklets quebram). Reanimated/Skia voltam na Fase 5 com development build.'),
  bulletBold('SecureStore em vez de AsyncStorage pra token: ', 'hardware-backed em iOS/Android modernos.'),
  bulletBold('Scan HTTP em vez de mDNS pra discovery: ', 'evita dependencia nativa, funciona em Expo Go, perda de elegancia minima.'),
  bulletBold('JSON-no-Drive em vez de banco dedicado (por enquanto): ', 'decisao pragmatica low-ops. Migrar pra SQLite quando passar de 5k eventos.'),
  bulletBold('Drive Stream em vez de S3: ', 'elimina worker de upload, custo de banda extra, e ja tem Drive corporativo da Contourline.'),
  bulletBold('Pair code de 6 chars + TTL 30min: ', 'balanco entre seguranca e UX (5min era muito apertado em evento com Wi-Fi ruim).'),

  h2('13.3 Riscos conhecidos'),
  bulletBold('Server.js monolitico (6700 linhas): ', 'dificil de manter, alvo de refactor na S3.'),
  bulletBold('JSONs como banco: ', 'nao escala alem de uns 5k registros — S8 resolve.'),
  bulletBold('Sem testes automatizados na Central: ', 'risco em producao, sera coberto nos refactors.'),
  bulletBold('Polling 10s pra dispositivos: ', 'latencia ruim — Fase 7 (WebSocket) resolve.'),

  h2('13.4 Status atual (snapshot)'),
  pMuted(`Documento gerado em ${TODAY}. Status das fases ja entregues:`),
  bullet('Fase 0 mobile: design system Aura + 3 componentes base (OK)'),
  bullet('Fase 1 mobile: splash dismiss-on-ready + SecureStore + NetInfo (OK)'),
  bullet('Fase 2 mobile: ConnectAura com discovery (OK)'),
  bullet('Site: aguardando S0 (organizar wip)'),
];

// ===== TOC (Sumario) — gera manualmente =====
const toc = [
  h1('Sumario'),
  ...[
    ['1', 'Sumario Executivo'],
    ['2', 'Visao de Produto'],
    ['3', 'Casos de Uso Reais'],
    ['4', 'Arquitetura do Sistema'],
    ['5', 'Design System Aura'],
    ['6', 'Pipeline de Marketing & Leads'],
    ['7', 'Funcionalidades-chave'],
    ['8', 'Stack Tecnica'],
    ['9', 'Plano de 8 Fases — Mobile'],
    ['10', 'Plano de 8 Fases — Site'],
    ['11', 'Como Mobile e Site Se Integram'],
    ['12', 'Roadmap'],
    ['13', 'Apendice'],
  ].map(([num, title]) =>
    new Paragraph({
      spacing: { before: 80, after: 80, line: 320 },
      children: [
        new TextRun({ text: `${num}.  `, color: C.primary, bold: true, size: 22, font: 'Arial' }),
        new TextRun({ text: title, color: C.text, size: 22, font: 'Arial' }),
      ],
    })
  ),
  new Paragraph({ children: [new PageBreak()] }),
];

// ===== Monta documento =====

const doc = new Document({
  creator: 'Contourline',
  title: 'Contourline Backup — Product Design Document',
  description: 'GDD/PDD do projeto Contourline Backup (mobile + Central + Drive).',
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 22 } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: C.primaryDark },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: C.primary },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, font: 'Arial', color: C.text },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'Contourline Backup · Product Design Document · ', color: C.muted, size: 18, font: 'Arial' }),
                new TextRun({ children: ['Pagina ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES], color: C.muted, size: 18, font: 'Arial' }),
              ],
            }),
          ],
        }),
      },
      children: [
        ...capa,
        ...toc,
        ...sumario,
        ...visao,
        ...casosUso,
        ...arquitetura,
        ...designSystem,
        ...pipelineMkt,
        ...funcionalidades,
        ...stackTec,
        ...planoMobile,
        ...planoSite,
        ...integracao,
        ...roadmap,
        ...apendice,
      ],
    },
  ],
});

const outDir = path.dirname(process.argv[2] || './GDD_Contourline_Backup.docx');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

Packer.toBuffer(doc).then((buffer) => {
  const outPath = process.argv[2] || './GDD_Contourline_Backup.docx';
  fs.writeFileSync(outPath, buffer);
  console.log(`OK: ${outPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
});
