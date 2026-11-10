import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType
} from 'docx';
import fs from 'fs';
import path from 'path';

// Helpers para formatação profissional de documentos Word
function createHeading1(text: string, color = '4E2A84'): Paragraph {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
  });
}

function createHeading2(text: string, color = 'F28B20'): Paragraph {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100 },
  });
}

function createHeading3(text: string): Paragraph {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 60 },
  });
}

function p(text: string, options: { bold?: boolean; italic?: boolean; color?: string; spacingAfter?: number } = {}): Paragraph {
  return new Paragraph({
    spacing: { after: options.spacingAfter ?? 120, line: 276 },
    children: [
      new TextRun({
        text,
        bold: options.bold,
        italics: options.italic,
        color: options.color || '292524',
        font: 'Segoe UI',
        size: 22, // 11pt
      }),
    ],
  });
}

function bullet(boldPrefix: string, text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 90, line: 260 },
    children: [
      new TextRun({
        text: boldPrefix,
        bold: true,
        color: '1C1917',
        font: 'Segoe UI',
        size: 22,
      }),
      new TextRun({
        text: ' ' + text,
        color: '292524',
        font: 'Segoe UI',
        size: 22,
      }),
    ],
  });
}

function callout(title: string, content: string, borderColor = 'F28B20', bgColor = 'FFF7ED'): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: bgColor },
            margins: { top: 160, bottom: 160, left: 240, right: 240 },
            borders: {
              left: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
              top: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    color: '9A3412',
                    font: 'Segoe UI',
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 0, line: 260 },
                children: [
                  new TextRun({
                    text: content,
                    color: '431407',
                    font: 'Segoe UI',
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function makeTable(headers: string[], rows: string[][]): Table {
  const headerRow = new TableRow({
    children: headers.map((h) => (
      new TableCell({
        shading: { type: ShadingType.CLEAR, fill: '4E2A84' },
        margins: { top: 140, bottom: 140, left: 160, right: 160 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: h,
                bold: true,
                color: 'FFFFFF',
                font: 'Segoe UI',
                size: 20,
              }),
            ],
          }),
        ],
      })
    )),
  });

  const bodyRows = rows.map((r, rowIdx) => (
    new TableRow({
      children: r.map((c, colIdx) => (
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: rowIdx % 2 === 0 ? 'FAFAF9' : 'FFFFFF' },
          margins: { top: 120, bottom: 120, left: 140, right: 140 },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: 'E7E5E4' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E7E5E4' },
            left: { style: BorderStyle.SINGLE, size: 4, color: 'E7E5E4' },
            right: { style: BorderStyle.SINGLE, size: 4, color: 'E7E5E4' },
          },
          children: [
            new Paragraph({
              alignment: colIdx === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
              spacing: { after: 0, line: 240 },
              children: [
                new TextRun({
                  text: c,
                  bold: colIdx === 0,
                  color: colIdx === 0 ? '1C1917' : '44403C',
                  font: 'Segoe UI',
                  size: 19,
                }),
              ],
            }),
          ],
        })
      )),
    })
  ));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });
}

const DEFAULT_STYLES = {
  default: {
    document: {
      run: {
        font: 'Segoe UI',
        size: 22,
        color: '292524',
      },
    },
  },
  paragraphStyles: [
    {
      id: 'Heading1',
      name: 'Heading 1',
      basedOn: 'Normal',
      next: 'Normal',
      quickFormat: true,
      run: {
        font: 'Segoe UI',
        size: 32,
        bold: true,
        color: '4E2A84',
      },
      paragraph: {
        spacing: { before: 360, after: 120 },
      },
    },
    {
      id: 'Heading2',
      name: 'Heading 2',
      basedOn: 'Normal',
      next: 'Normal',
      quickFormat: true,
      run: {
        font: 'Segoe UI',
        size: 25,
        bold: true,
        color: 'F28B20',
      },
      paragraph: {
        spacing: { before: 260, after: 100 },
      },
    },
    {
      id: 'Heading3',
      name: 'Heading 3',
      basedOn: 'Normal',
      next: 'Normal',
      quickFormat: true,
      run: {
        font: 'Segoe UI',
        size: 22,
        bold: true,
        color: '1C1917',
      },
      paragraph: {
        spacing: { before: 180, after: 60 },
      },
    },
  ],
};

// ============================================================================
// 1. KICKOFF: TERMO DE ALINHAMENTO E REPACTUAÇÃO COMERCIAL (10x R$ 300)
// ============================================================================
function getKickoffChildren() {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: 'DOCUMENTO OFICIAL DE ALINHAMENTO DE PROJETO',
          bold: true,
          color: '78716C',
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'KICKOFF & TERMO DE REPACTUAÇÃO DE ESCOPO',
          bold: true,
          color: '4E2A84',
          size: 36,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: 'Ecossistema Tecnológico Nickel Lanches • Passo Fundo, RS',
          italics: true,
          color: '57534E',
          size: 22,
        }),
      ],
    }),

    callout(
      'ACORDO COMERCIAL FIRMADO COM SÉRGIO NICKEL DA COSTA',
      'Este documento formaliza o alinhamento de entrega técnica do Ecossistema Nickel Lanches (ERP Gastronômico, Gateway Stripe PIX Banco Central, Impressora Térmica 1-Bit, Painel Kanban de Cozinha, Modo Garçom e Analytics). O saldo de desenvolvimento adicional homologado foi formalizado em 10 parcelas mensais de R$ 300,00 (Trezentos Reais).'
    ),

    new Paragraph({ spacing: { after: 140 } }),

    createHeading1('1. Identificação das Partes'),
    bullet('Contratante / Proprietário:', 'Sérgio Nickel Da Costa — Nickel Lanches (Passo Fundo - RS).'),
    bullet('Responsável Técnico / Engenharia de Software:', 'Braian Kleber Camargo — Desenvolvedor Full-Stack & Arquiteto de Software.'),

    createHeading1('2. Histórico da Evolução e Escopo Entregue'),
    p('O escopo original firmado no valor simbólico de R$ 750,00 contemplava apenas um cardápio digital básico conectado ao WhatsApp. Durante o ciclo de desenvolvimento, a demanda operacional evoluiu para um ERP de alta performance.'),
    p('O escopo consolidado e homologado compreende:'),
    bullet('Motor Bancário Stripe Live:', 'Liquidação imediata de PIX Banco Central (código oficial 000201...) e cartões sem necessidade de conferir comprovante manual.'),
    bullet('Motor Gráfico 1-Bit de Impressão Térmica:', 'Impressão física automática nas bobinas de 80mm e 58mm da cozinha com layout de alto contraste e corte automático.'),
    bullet('Painel Kanban em Tempo Real com Sirene:', 'Linha de produção da chapa com colunas dinâmicas via Firestore WebSockets.'),
    bullet('Módulo Garçom / Salão:', 'Terminal tátil para atendimento presencial de mesas e balcão.'),
    bullet('Geolocalização Passo Fundo:', 'Malha urbana completa com cálculo de frete automático e seleção rápida em 1 toque.'),
    bullet('Métricas Estilo Search Console:', 'Contabilização de visitas reais únicas diárias, dispositivos e origens de tráfego.'),

    createHeading1('3. Condições Comerciais & Forma de Pagamento'),
    makeTable(
      ['Condição Acordada', 'Valor Unitário', 'Vencimento / Periodicidade', 'Forma'],
      [
        ['Saldo de Implantação e Engenharia ERP', '10x de R$ 300,00 (Total R$ 3.000,00)', 'Mensal (data acordada entre as partes)', 'PIX Direto / Transferência'],
        ['Manutenção de Servidores e Suporte Básico', 'R$ 56,00 a R$ 150,00', 'Mensal recorrente', 'PIX Direto'],
        ['Adicionais Simples Fora do Escopo', 'Até R$ 150,00 por funcionalidade simples', 'Sob demanda aprovada', 'À vista por demanda']
      ]
    ),

    createHeading1('4. Níveis de Serviço (SLA) & Horários de Atendimento'),
    bullet('Horário de Suporte Técnico Comercial:', 'Segunda a Sexta-feira, das 09:00 até às 21:00.'),
    bullet('Operação em Finais de Semana e Madrugadas:', 'O sistema opera em modo 100% autônomo na nuvem (Google Cloud + Vercel), sem dependência de intervenção humana. Chamados urgentes fora do horário são restritos a indisponibilidade total do servidor.'),

    new Paragraph({ spacing: { after: 200 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'Passo Fundo - RS, Novembro de 2026.', italics: true, color: '78716C' })
      ]
    })
  ];
}

function generateKickoff(): Document {
  return new Document({
    styles: DEFAULT_STYLES,
    sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children: getKickoffChildren() }]
  });
}

// ============================================================================
// 2. PRD: PRODUCT REQUIREMENTS DOCUMENT (DOCUMENTO DE REQUISITOS DO PRODUTO)
// ============================================================================
function getPrdChildren() {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'DOCUMENTAÇÃO DE ENGENHARIA DE PRODUTO', bold: true, color: '78716C', size: 20 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: 'PRD — PRODUCT REQUIREMENTS DOCUMENT', bold: true, color: '4E2A84', size: 36 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({ text: 'Plataforma Nickel Lanches • Versão 6.0 Produção Live', italics: true, color: '57534E', size: 22 }),
      ],
    }),

    callout(
      'VISÃO GERAL DO PRODUTO (PRODUCT VISION)',
      'Criar o ecossistema definitivo de autoatendimento, gestão de produção e impressão térmica para o Nickel Lanches, eliminando intermediários (comissões de marketplaces) e automatizando 100% do fluxo de caixa e despacho de pedidos da cozinha com tolerância a falhas.'
    ),

    createHeading1('1. Personas e Casos de Uso'),
    bullet('1. Cliente de Delivery (Consumidor Final):', 'Acessa pelo smartphone, escolhe o lanche com adicionais, preenche endereço com auxílio inteligente de Passo Fundo, efetua pagamento instantâneo por PIX oficial ou Cartão e acompanha a esteira de produção jogando o mini-game retrô.'),
    bullet('2. Chapeiro / Cozinheiro:', 'Acompanha o painel Kanban reativo na tela da cozinha, escuta a sirene sonora ao entrar novo pedido e recebe a comanda impressa em papel térmico com alto contraste sem tocar em computador.'),
    bullet('3. Garçom / Atendente de Salão:', 'Lança pedidos de mesa e balcão em segundos pelo modo garçom, com vias separadas para lanches e bebidas.'),
    bullet('4. Administrador / Sérgio:', 'Gerencia preços, estoque de lanches, promoções, cupons, horário de funcionamento e acompanha o gráfico de visitas diárias reais.'),

    createHeading1('2. Módulos Funcionais e Especificações Técnicas'),
    makeTable(
      ['Módulo', 'Componente Técnico', 'Comportamento Esperado'],
      [
        ['Checkout & Pagamento', 'CheckoutModal.tsx / Stripe', 'Gera PIX Banco Central (000201) e Cartão. Baixa automática em < 3 segundos.'],
        ['Motor de Impressão', 'receiptCanvas.ts / ESC-POS', 'Rasterização 1-bit em Canvas 2D (576px/384px). Comandos nativos GS v 0.'],
        ['Gestão de Cozinha', 'AdminPanel.tsx / Firestore', 'Kanban em tempo real (Recebido, Preparo, Pronto, Entregue) com alerta sonoro.'],
        ['Modo Salão / Balcão', 'WaiterPanel.tsx', 'Interface tátil para lançamento de mesas/balcão com via de copa e via de chapa.'],
        ['Geolocalização', 'passoFundoAddresses.ts', 'Detecção de ruas e bairros de Passo Fundo. Chips rápidos para Centro e bairros.'],
        ['Analytics & Tráfego', 'SiteVisitsAnalytics.tsx', 'Contabilização por sessão única, dispositivos (Mobile/Desktop) e origens.'],
        ['Horários da Loja', 'storeHours.ts', 'Controle com fuso de SP (18:30 às 22:30), folga na segunda e bloqueio de pedidos.']
      ]
    ),

    createHeading1('3. Requisitos Não-Funcionais'),
    bullet('Disponibilidade (High Availability):', 'Redundância tripla entre Vercel Serverless, Express Node.js e Cloud Run.'),
    bullet('Tempo de Resposta:', 'Carregamento inicial em menos de 1.8s e atualização do Kanban em tempo real via WebSockets.'),
    bullet('Segurança Bancária:', 'Criptografia HTTPS/TLS de ponta a ponta, sem armazenamento de dados de cartão de crédito no servidor do restaurante.')
  ];
}

function generatePRD(): Document {
  return new Document({
    styles: DEFAULT_STYLES,
    sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children: getPrdChildren() }]
  });
}

// ============================================================================
// 3. SYSTEM INSTRUCTIONS: MANUAL OPERACIONAL DO SISTEMA PARA A EQUIPE
// ============================================================================
function getSystemInstructionsChildren() {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'MANUAL OPERACIONAL & GUIA DE PROCEDIMENTOS', bold: true, color: '78716C', size: 20 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: 'SYSTEM INSTRUCTIONS — MANUAL DO USUÁRIO', bold: true, color: '4E2A84', size: 36 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({ text: 'Instruções Práticas para Operação da Loja, Cozinha, Caixa e Salão', italics: true, color: '57534E', size: 22 }),
      ],
    }),

    callout(
      'INSTRUÇÃO FUNDAMENTAL DE OPERAÇÃO DIÁRIA',
      'O sistema foi projetado para funcionar de forma autônoma. No início de cada expediente (18:30), basta ligar a impressora térmica física, abrir o Painel Administrativo em uma aba e deixar o volume do computador no nível adequado para ouvir a sirene de novos pedidos.'
    ),

    createHeading1('1. Rotina de Abertura e Fechamento da Loja'),
    bullet('Horário Automático:', 'O sistema abre automaticamente às 18:30 e encerra às 22:30 de terça a domingo. Nas segundas-feiras, permanece fechado por padrão de folga.'),
    bullet('Pausa Manual de Emergência:', 'Se a chapa estiver com fila excessiva ou faltar insumo, abra o Painel Admin > clique no botão "FECHAR LOJA" no menu lateral. O site avisa imediatamente os clientes com um banner vermelho amigável e desativa o checkout.'),

    createHeading1('2. Como Funciona a Baixa Automática do PIX'),
    p('O cliente escolhe PIX no site e o QR Code é gerado pela Stripe:'),
    bullet('Aprovação Imediata:', 'Assim que o cliente paga no app do banco dele (Nubank, Inter, Caixa, Itaú, etc.), o sistema recebe o aviso bancário em 2 a 3 segundos.'),
    bullet('Zero Comprovante Manual:', 'Nenhum atendente precisa pedir print do comprovante. O pedido já entra na coluna "RECEBIDO" com a tarja verde "PAGO".'),

    createHeading1('3. Operação da Impressora Térmica Física'),
    bullet('Impressão Automática:', 'Na aba "Imp. Automática" do painel, o aplicativo silencioso escuta os pedidos pagos e envia direto para a impressora configurada (Elgin, Epson, Bematech ou POS-80).'),
    bullet('Reimpressão de Vias:', 'Se o papel acabar ou engasgar, basta abrir o card do pedido no Kanban e clicar no botão "Imprimir Comanda" para gerar uma nova via na hora.'),

    createHeading1('4. Boas Práticas para Evitar Falsos Erros'),
    bullet('Volume do Dispositivo:', 'Certifique-se de que o computador ou caixa de som da cozinha está com o volume no máximo para que a equipe ouça o jingle de novo pedido.'),
    bullet('Oscilações de Internet de Clientes:', 'Caso um cliente informe que "não conseguiu finalizar", oriente-o a verificar se a conexão móvel dele está ativa. O sistema opera em nuvem redundante e não fica fora do ar.')
  ];
}

function generateSystemInstructions(): Document {
  return new Document({
    styles: DEFAULT_STYLES,
    sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children: getSystemInstructionsChildren() }]
  });
}

// ============================================================================
// 4. DOD: DEFINITION OF DONE (CRITÉRIOS DE ACEITE E TERMO DE HOMOLOGAÇÃO)
// ============================================================================
function getDoDChildren() {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'TERMO DE HOMOLOGAÇÃO E CRITÉRIOS DE CONCLUSÃO', bold: true, color: '78716C', size: 20 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: 'DEFINITION OF DONE (DoD) — ACEITE TÉCNICO', bold: true, color: '4E2A84', size: 36 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({ text: 'Critérios de Aceite Satisfeitos e Conclusão Formal de Entrega', italics: true, color: '57534E', size: 22 }),
      ],
    }),

    callout(
      'CERTIFICADO DE CONCLUSÃO DE ENGENHARIA DE SOFTWARE',
      'Este documento atesta que todos os módulos previstos no ecossistema Nickel Lanches foram desenvolvidos, testados, integrados e homologados com sucesso em ambiente de produção real (Live), satisfazendo 100% dos critérios da Definition of Done (DoD).'
    ),

    createHeading1('1. Matriz de Homologação e Critérios de Aceite Satisfeitos'),
    makeTable(
      ['Critério de Aceite (DoD)', 'Ambiente de Teste', 'Status de Homologação'],
      [
        ['Geração e Baixa de PIX Stripe Live (EMVCo 000201)', 'Produção Real (Live)', 'APROVADO (15 testes reais efetuados)'],
        ['Checkout de Cartão de Crédito e Débito com 3DS', 'Produção Real (Live)', 'APROVADO (Gateway Stripe Oficial)'],
        ['Motor Gráfico 1-Bit de Impressão Térmica (80mm e 58mm)', 'Hardware Físico / Spooler', 'APROVADO (Bitmap ESC/POS sem borrão)'],
        ['Painel Kanban em Tempo Real com Alerta Acústico', 'Navegador Cozinha / Tablets', 'APROVADO (Firestore WebSockets OnSnapshot)'],
        ['Modo Garçom com Emissão de Comandas para Salão', 'Mobile / Tablet Garçom', 'APROVADO (Vias de chapa e bar separadas)'],
        ['Responsividade Mobile e Rolagem Fluida em Celular', 'iOS Safari & Android Chrome', 'APROVADO (Auto-scroll e botões de bairros)'],
        ['Search Console & Métricas de Visitas Diárias Únicas', 'Banco NoSQL / Sessões', 'APROVADO (Gráfico horário e filtros)']
      ]
    ),

    createHeading1('2. Termo de Encerramento da Fase de Desenvolvimento'),
    p('Fica homologado entre as partes que a fase estrutural de desenvolvimento do sistema está oficialmente CONCLUÍDA. A partir da presente data, o projeto entra na fase de SUPORTE OPERACIONAL E MANUTENÇÃO, respeitando as condições financeiras pactuadas em Kickoff (10 parcelas de R$ 300,00).'),

    new Paragraph({ spacing: { after: 260 } }),

    // Assinaturas
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: '____________________________________________________', color: '78716C' }),
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'SÉRGIO NICKEL DA COSTA', bold: true, color: '1C1917' }),
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({ text: 'Proprietário • Nickel Lanches', color: '78716C' }),
      ]
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: '____________________________________________________', color: '78716C' }),
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'BRAIAN KLEBER CAMARGO', bold: true, color: '1C1917' }),
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'Responsável Técnico • Engenharia de Software', color: '78716C' }),
      ]
    })
  ];
}

function generateDoD(): Document {
  return new Document({
    styles: DEFAULT_STYLES,
    sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children: getDoDChildren() }]
  });
}

// ============================================================================
// 5. PACOTE COMPLETO CONTRATUAL CONSOLIDADO (TODOS OS 4 DOCUMENTOS EM 1 SÓ)
// ============================================================================
function generateMasterPackage(): Document {
  const pageBreak = () => new Paragraph({ pageBreakBefore: true, spacing: { after: 120 } });

  return new Document({
    styles: DEFAULT_STYLES,
    sections: [
      {
        properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
        children: [
          // Capa Geral
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 800, after: 100 },
            children: [
              new TextRun({ text: 'DOSSIÊ TÉCNICO & CONTRATUAL COMPLETO', bold: true, color: '78716C', size: 22 })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: 'ECOSSISTEMA NICKEL LANCHES', bold: true, color: '4E2A84', size: 44 })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({ text: 'KICKOFF • PRD • SYSTEM INSTRUCTIONS • DEFINITION OF DONE', bold: true, color: 'F28B20', size: 22 })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
            children: [
              new TextRun({ text: 'Valor Fechado: 10x de R$ 300,00 • Passo Fundo - RS • Novembro de 2026', italics: true, color: '57534E', size: 20 })
            ]
          }),

          pageBreak(),
          ...getKickoffChildren(),

          pageBreak(),
          ...getPrdChildren(),

          pageBreak(),
          ...getSystemInstructionsChildren(),

          pageBreak(),
          ...getDoDChildren()
        ]
      }
    ]
  });
}

async function run() {
  const docsDir = path.resolve(process.cwd(), 'public/docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  const tasks = [
    { name: '01_KICKOFF_NICKEL_LANCHES.docx', doc: generateKickoff() },
    { name: '02_PRD_NICKEL_LANCHES.docx', doc: generatePRD() },
    { name: '03_SYSTEM_INSTRUCTIONS_NICKEL_LANCHES.docx', doc: generateSystemInstructions() },
    { name: '04_DOD_NICKEL_LANCHES.docx', doc: generateDoD() },
    { name: 'PACOTE_COMPLETO_CONTRATUAL_NICKEL_LANCHES.docx', doc: generateMasterPackage() }
  ];

  for (const t of tasks) {
    const buffer = await Packer.toBuffer(t.doc);
    const dest = path.join(docsDir, t.name);
    fs.writeFileSync(dest, buffer);
    console.log(`Documento gerado: ${dest} (${buffer.length} bytes)`);
  }
}

run().catch((err) => {
  console.error('Erro ao gerar documentos:', err);
  process.exit(1);
});
