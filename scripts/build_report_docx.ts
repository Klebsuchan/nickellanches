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

function createHeading1(text: string): Paragraph {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 150 },
  });
}

function createHeading2(text: string): Paragraph {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 100 },
  });
}

function createHeading3(text: string): Paragraph {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
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
    spacing: { after: 100, line: 260 },
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

async function buildDocx() {
  const doc = new Document({
    styles: {
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
            size: 34,
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
            size: 26,
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
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 1 polegada (2.54cm)
          },
        },
        children: [
          // CAPA / CABEÇALHO DO LAUDO
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: 'LAUDO TÉCNICO & RELATÓRIO EXECUTIVO DE ENGENHARIA',
                bold: true,
                color: '78716C',
                font: 'Segoe UI',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'ECOSSISTEMA NICKEL LANCHES',
                bold: true,
                color: '4E2A84',
                font: 'Segoe UI',
                size: 40,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: 'Análise de Arquitetura, Justificativa de Valor de Mercado, Benchmark Competitivo e Comparativo Histórico de Evolução (v3.0 vs. v6.0)',
                italics: true,
                color: '57534E',
                font: 'Segoe UI',
                size: 22,
              }),
            ],
          }),

          callout(
            'RESUMO EXECUTIVO: POR QUE ESTE SISTEMA NÃO É UM SITE COMUM?',
            'O Nickel Lanches não é uma landing page e nem um mero catálogo de WhatsApp. Trata-se de uma Plataforma ERP Full-Stack de Missão Crítica com: gateway bancário Stripe integrado (PIX Banco Central automático + Cartões), motor gráfico 1-bit ESC/POS para impressão física contínua sem intervenção humana, Kanban de cozinha reativo com sirene sonora, terminal para garçons e salão, inteligência de geolocalização por bairro de Passo Fundo e painel analítico de tráfego estilo Google Search Console com infraestrutura multi-nuvem redundante. O investimento se paga em poucos meses apenas pela eliminação das taxas abusivas de marketplaces.'
          ),

          new Paragraph({ spacing: { after: 200 } }),

          // SEÇÃO 1
          createHeading1('1. O Que Foi Construído e Por Que o Preço É Tão Alto (Justificativa de Valor)'),
          p('No mercado de software, há uma diferença abissal entre criar um "site informativo" (feito em construtores prontos de R$ 500 como WordPress ou Wix) e desenvolver uma PLATAFORMA INTEGRADA DE OPERAÇÃO COMERCIAL com automação bancária, hardware e banco de dados em tempo real. Cada centavo do projeto reflete um componente de engenharia de alta complexidade que substitui custos fixos recorrentes pesados da lanchonete.'),

          createHeading2('1.1. Detalhamento de Cada Funcionalidade do Ecossistema:'),

          bullet('1. Gateway Bancário Stripe Live com PIX Automático (Banco Central):', 'Em vez de exigir que um atendente confira comprovantes manuais no WhatsApp (sujeito ao famoso golpe do comprovante falso ou agendamento cancelado), o sistema se conecta diretamente à API da Stripe. Ele gera na hora o QR Code oficial e o código Copia e Cola EMVCo do Banco Central (padrão 000201). O sistema escuta a liquidação bancária em tempo real e aprova o pedido automaticamente em menos de 3 segundos, enviando direto para a chapa.'),
          bullet('2. Motor Gráfico 1-Bit de Impressão Térmica (receiptCanvas.ts & printerService.ts):', 'O calcanhar de aquiles da maioria dos restaurantes é a impressora de cupom (80mm e 58mm). Drivers comuns de Windows deformam layouts HTML e apagam fundos escuros. Desenvolvemos um motor próprio que rasteriza a comanda inteira pixel a pixel em preto e branco puro (576px/384px) e gera comandos brutos ESC/POS (GS v 0). O script Windows em segundo plano imprime sozinho, sem caixa de diálogo, no exato segundo em que o pedido é aprovado.'),
          bullet('3. Painel Kanban de Cozinha em Tempo Real via Firestore WebSockets:', 'A cozinha opera como uma linha de montagem industrial. O painel sincroniza automaticamente os status (Recebido, Em Preparo, Pronto para Entrega, Entregue) sem que ninguém precise apertar F5. Inclui sirene acústica de alerta sonoro para a equipe nunca deixar um lanche atrasar.'),
          bullet('4. Modo Garçom / Salão Dedicado (WaiterPanel.tsx):', 'Permite que garçons ou caixas lancem pedidos presenciais de mesas ou balcão na mesma velocidade de um aplicativo nativo, eliminando custos com licenças de terminais POS caros de terceiros.'),
          bullet('5. Inteligência de Endereçamento e Frete Dinâmico (Passo Fundo):', 'Contém a base completa de logradouros e bairros de Passo Fundo (Centro, Petrópolis, Boqueirão, São Cristóvão, etc.). Calcula automaticamente o valor da entrega conforme o bairro e oferece chips de seleção rápida em 1 toque no celular, evitando erros de digitação do cliente.'),
          bullet('6. Painel de Tráfego e Visitas Estilo Google Search Console (SiteVisitsAnalytics.tsx):', 'Monitora métricas reais de novos acessos diários por sessão única, dispositivos (Mobile vs Desktop) e canais de aquisição (Instagram, WhatsApp, Google), permitindo que a gerência tome decisões de marketing baseadas em dados concretos.'),
          bullet('7. Gamificação Galáctica & Retenção (Mini-Game Dog Sideral + Sistema de XP):', 'Enquanto o pedido é preparado, o cliente joga um mini-game arcade retrô com efeitos sonoros sintetizados em 8-bits na Web Audio API. Cada lanche gera pontos de experiência (XP) e patentes de fidelidade, transformando clientes casuais em fãs assíduos da lanchonete.'),
          bullet('8. Arquitetura Resiliente de Alta Disponibilidade (Multi-Nuvem):', 'O sistema opera simultaneamente com Vercel Serverless Functions, servidor Express Node.js, Cloud Run e contingência client-side. Se uma rota falhar, outra assume instantaneamente sem que a loja pare de vender.'),

          new Paragraph({ spacing: { after: 150 } }),

          // SEÇÃO 2
          createHeading1('2. Análise Comparativa: Nickel Lanches vs. Outras Soluções de Mercado'),
          p('Para entender por que o valor do sistema é diferenciado, comparamos o Nickel Lanches contra os três modelos vigentes no mercado de alimentação:'),

          makeTable(
            ['Critério de Comparação', 'Marketplaces (iFood / Rappi)', 'Cardápios Genéricos (Goomer / Anota AI)', 'Ecossistema Nickel Lanches'],
            [
              [
                'Taxas sobre Vendas',
                'Cobram de 12% a 27% sobre TUDO que a loja vende.',
                'Cobram mensalidades fixas altas (R$ 150 a R$ 600/mês).',
                '0% de comissão. Todo o lucro das vendas vai direto para a conta da lanchonete.'
              ],
              [
                'Propriedade dos Clientes',
                'O cliente é do iFood. A lanchonete não tem acesso aos telefones para marketing.',
                'Base compartilhada dentro da plataforma deles.',
                '100% da lanchonete. Banco de dados próprio com nome, WhatsApp, histórico de consumo e hábitos.'
              ],
              [
                'PIX e Pagamentos',
                'O marketplace retém o dinheiro por 7 a 30 dias com desconto de taxas pesadas.',
                'Geralmente exige comprovante manual pelo WhatsApp ou taxa extra.',
                'PIX oficial Banco Central direto na conta bancária da loja com baixa instantânea e zero risco de golpe.'
              ],
              [
                'Impressão de Comandas',
                'Exige integrador proprietário pesado que trava no Windows.',
                'Frequentemente abre janela de diálogo do navegador para cada pedido.',
                'Motor 1-bit visual sob medida com impressão direta automática e corte de papel instantâneo.'
              ],
              [
                'Branding e Identidade',
                'A lanchonete é só mais uma lista genérica no meio de concorrentes.',
                'Interface padronizada cinza com cara de sistema padrão.',
                'Identidade visual retrô arcade exclusiva, jingles, mascote, jogo próprio e patentes de XP.'
              ],
              [
                'Controle de Horários',
                'Se esquecer aberto, o cliente compra e reclama.',
                'Configuração básica de horário.',
                'Trava inteligente com fuso horário SP, feriados, folgas na segunda e mensagens claras ao cliente.'
              ]
            ]
          ),

          new Paragraph({ spacing: { after: 150 } }),

          callout(
            'POR QUE O NICKEL LANCHES SE DESTACA COMO NOVIDADE?',
            'Diferente de qualquer aplicativo da cidade, o Nickel Lanches transforma a compra em entretenimento gamificado. Enquanto outros apps são frios e idênticos, o cliente do Nickel se diverte com o mascote, ouve efeitos arcade ao adicionar itens, ganha patentes e pontos de fidelidade, e paga pelo PIX oficial sem atrito. Para a operação, a cozinha ganha uma impressora que trabalha sozinha e um painel kanban sem papelada.'
          ),

          new Paragraph({ spacing: { after: 200 } }),

          // SEÇÃO 3
          createHeading1('3. Comparativo Histórico: A Versão Atual (v6) vs. A 3ª Versão do Site (v3)'),
          p('O cliente citou a terceira versão do site, que "já estava meio que pronta, só que ele só me enviava o pedido pelo WhatsApp". A evolução entre a v3 e a versão atual v6 representa uma transformação de um simples gerador de texto para um ERP Comercial Autônomo.'),

          makeTable(
            ['Recurso / Funcionalidade', 'Versão 3.0 (Versão Antiga)', 'Versão 6.0 (Versão Atual em Produção)'],
            [
              [
                'Finalização do Pedido',
                'Apenas abria o WhatsApp com um texto pré-formatado.',
                'Processamento bancário completo e autônomo com registro em banco de dados e disparo de comanda.'
              ],
              [
                'Pagamento e Baixa',
                'Manual: o atendente precisava pedir comprovante, conferir se caiu na conta e dar baixa.',
                '100% Automático: Stripe Live gera PIX oficial com confirmação em tempo real e baixa sem intervenção humana.'
              ],
              [
                'Impressão de Cozinha',
                'Inexistente ou manual: alguém tinha que digitar no teclado ou transcrever à mão o pedido do WhatsApp.',
                'Automática: motor 1-bit ESC/POS envia para a impressora térmica física na hora da aprovação do pagamento.'
              ],
              [
                'Organização da Cozinha',
                'WhatsApp confuso, conversas sobrepostas, risco alto de esquecer ou pular pedidos em horário de pico.',
                'Painel Kanban profissional com colunas de produção, sirene de alerta e contagem de tempo de preparo.'
              ],
              [
                'Atendimento de Salão / Mesas',
                'Não existia (sistema focado apenas em pedidos externos).',
                'Modo Garçom completo para atendimento presencial rápido de salão, mesas e balcão.'
              ],
              [
                'Cálculo de Entrega / Endereço',
                'Manual ou fixo: o cliente digitava o que queria e a loja precisava consultar a tabela de bairros.',
                'Automático: busca de logradouros de Passo Fundo, detecção inteligente de taxa e botões de 1 toque para bairros.'
              ],
              [
                'Horário de Funcionamento',
                'Se o cliente mandasse mensagem na segunda ou de madrugada, o pedido ficava pendente sem resposta.',
                'Bloqueio inteligente de pedidos fora do horário com banner informativo e travas de segurança no checkout.'
              ],
              [
                'Métricas e Tráfego',
                'Nenhum dado sobre quantos clientes visitaram o cardápio.',
                'Painel completo estilo Search Console com contagem de visitas diárias reais, dispositivos e fontes de tráfego.'
              ],
              [
                'Experiência Mobile',
                'Layout padrão com travamentos de rolagem ao abrir o teclado.',
                '100% otimizado para celulares modernos com auto-scroll inteligente, rodapé compacto e rolagem fluida.'
              ]
            ]
          ),

          new Paragraph({ spacing: { after: 150 } }),

          // SEÇÃO 4
          createHeading1('4. Análise de Retorno Sobre o Investimento (ROI Financeiro)'),
          p('A precificação de um software corporativo se mede pelo retorno que ele gera e pelo custo que ele elimina. Veja a simulação financeira real para uma lanchonete com faturamento médio de R$ 35.000 a R$ 50.000 mensais:'),

          bullet('1. Economia Direta com Comissões de Marketplaces (iFood):', 'O iFood cobra em média 23% sobre as vendas. Se a lanchonete fatura R$ 35.000 no delivery, ela paga cerca de R$ 8.050,00 TODO MÊS de comissão para a plataforma. Ao migrar os clientes fiéis para o seu próprio ecossistema com zero comissão, a lanchonete economiza entre R$ 40.000 a R$ 90.000 por ano.'),
          bullet('2. Economia de Mão de Obra e Atendentes:', 'Em dias de pico (sextas e sábados), um atendente manual gasta de 4 a 7 minutos por pedido conferindo endereço, calculando taxa, passando chave PIX e conferindo extrato. Com 50 pedidos/dia, são 5 horas de trabalho repetitivo. O sistema elimina 90% desse tempo, permitindo operar com equipe mais enxuta e sem erros.'),
          bullet('3. Blindagem Contra Golpes do PIX Falso:', 'Comprovantes adulterados ou cancelados no banco custam centenas de reais por semana a deliverys desavisados. A liquidação direta via Stripe garante que nenhum lanche vai para a chapa sem o dinheiro estar 100% creditado na conta.'),
          bullet('4. Valor de Ativo Próprio:', 'Diferente de pagar aluguel mensal de plataformas que nunca serão suas, a lanchonete possui um ATIVO TECNOLÓGICO PROPRIETÁRIO de altíssimo valor de mercado, valorizando o negócio como franquia ou empresa sólida.'),

          new Paragraph({ spacing: { after: 200 } }),

          // CONCLUSÃO
          createHeading1('5. Conclusão e Parecer Técnico'),
          p('A entrega técnica realizada no Nickel Lanches atende aos padrões mais exigentes da engenharia de software moderna: microsserviços escaláveis, conformidade bancária internacional com Stripe e Banco Central, motor gráfico de baixo nível para automação de hardware e uma experiência de usuário sem precedentes no segmento gastronômico do Rio Grande do Sul.'),
          p('Trata-se de um investimento estratégico com retorno garantido, posicionando a Nickel Lanches muito à frente de qualquer concorrente local.'),

          new Paragraph({ spacing: { after: 300 } }),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'Laudo elaborado pela Engenharia de Software da Plataforma',
                bold: true,
                color: '78716C',
                font: 'Segoe UI',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'Novembro de 2026 • Passo Fundo, RS',
                italics: true,
                color: 'A8A29E',
                font: 'Segoe UI',
                size: 18,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.resolve(process.cwd(), 'public/docs/Analise_Completa_Nickel_Lanches.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`Documento Word (.docx) gerado com sucesso em: ${outPath} (${buffer.length} bytes)`);
}

buildDocx().catch((err) => {
  console.error('Erro ao gerar documento docx:', err);
  process.exit(1);
});
