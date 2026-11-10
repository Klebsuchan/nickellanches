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
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
  });
}

function createHeading2(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100 },
  });
}

function createHeading3(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 60 },
  });
}

function p(text: string, options: { bold?: boolean; italic?: boolean; color?: string; spacingAfter?: number } = {}): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.BOTH,
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
                spacing: { line: 260 },
                children: [
                  new TextRun({
                    text: content,
                    color: '7C2D12',
                    font: 'Segoe UI',
                    size: 21,
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

async function buildManualDocx() {
  console.log('Gerando MANUAL_COMPLETO_NICKEL_LANCHES.docx...');

  const doc = new Document({
    creator: 'Braian Kleber Camargo',
    title: 'Manual de Operação e Uso do Sistema - Nickel Lanches',
    description: 'Guia completo de operação e troubleshooting da plataforma Nickel Lanches.',
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
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: 'MANUAL OPERACIONAL DO ECOSSISTEMA NICKEL LANCHES',
                bold: true,
                size: 32,
                color: '4E2A84',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: 'Guia Completo de Operação Diária, Impressão Térmica, PIX e Troubleshooting • Versão 2.3.0 Pro',
                italics: true,
                size: 20,
                color: '78716C',
              }),
            ],
          }),

          callout(
            'DOCUMENTO CONFIDENCIAL DE OPERAÇÃO',
            'Este manual contém as instruções técnicas e operacionais detalhadas do sistema web/ERP Nickel Lanches para o proprietário Sérgio Nickel Da Costa e sua equipe de caixa, cozinha e entregadores.'
          ),

          createHeading1('1. ARQUITETURA E FLUXO GERAL DE PEDIDOS'),
          p('O sistema Nickel Lanches é um ecossistema integrado em tempo real conectando o cliente, a equipe de chapa/cozinha e o operador do caixa através do Google Firebase e Stripe Payments.'),
          bullet('• Cardápio do Cliente:', 'Aplicativo web ultra-rápido para montagem de pedidos, seleção de adicionais, observações e checkout.'),
          bullet('• Gateway Stripe Live PIX:', 'Gera cobrança PIX com QR Code dinâmico do Banco Central e conciliação instantânea em segundos.'),
          bullet('• Painel KDS da Cozinha:', 'Kanban em tempo real com alertas sonoros e sintetização de voz alertando novos pedidos.'),
          bullet('• Impressão Térmica:', 'Bobinas de 58mm e 80mm com impressão automática de vias de chapa e vias de entrega.'),

          createHeading1('2. O CARDÁPIO DIGITAL DO CLIENTE'),
          p('O cardápio digital elimina o gargalo de atendimento no WhatsApp. O cliente navega por categorias (Xis, Hot Dogs, Porções, Bebidas, Sobremesas), escolhe adicionais pagos e digita observações personalizadas.'),
          p('O sistema calcula automaticamente o raio de entrega em km para a cidade de Passo Fundo e aplica a taxa exata de frete antes da finalização.'),
          p('O cliente pode optar por pagar via PIX (com baixa instantânea) ou pagar na entrega (cartão de crédito/débito ou dinheiro com cálculo de troco).'),

          createHeading1('3. O PAINEL ADMINISTRATIVO MASTER'),
          p('Acessado através da rota restrita /painel-admin com autenticação SHA-256. Apresenta faturamento do dia em tempo real, contagem de pedidos, ticket médio e acesso ao menu de controle de estoque e configurações.'),

          createHeading1('4. GESTÃO DE PEDIDOS (KANBAN DA COZINHA)'),
          p('O fluxo de produção é dividido em 5 colunas sequenciais:'),
          bullet('1. Pendentes (Amarelo):', 'Pedidos recém-chegados aguardando início do preparo na chapa.'),
          bullet('2. Em Preparo (Roxo):', 'O lanche está sendo montado e prensado na chapa pelo chapeiro.'),
          bullet('3. Prontos (Verde):', 'Lanche pronto, embalado e pronto para entrega ou retirada no balcão.'),
          bullet('4. Em Rota (Azul):', 'Entregador em deslocamento até o endereço do cliente.'),
          bullet('5. Concluídos (Cinza):', 'Pedido finalizado, faturado e registrado no histórico financeiro.'),
          p('Cada card possui botões de ação rápida para: Imprimir Comanda (USB/Rede), Abrir WhatsApp do Cliente com mensagem pronta e Avançar Status.'),

          createHeading1('5. SISTEMA DE ALERTAS SONOROS E SÍNTESE DE VOZ'),
          p('O sistema utiliza a tecnologia Web Audio API do navegador. Assim que um pedido entra, um toque sonoro de alta frequência dispara no computador e uma voz sintetizada anuncia: "Atenção: Novo pedido recebido!".'),
          callout(
            'REGRA CRÍTICA DO NAVEGADOR (CHROME/EDGE)',
            'Por política de segurança dos navegadores, o áudio automático só toca se a página receber ao menos um clique do operador após aberta. No início do turno, o operador deve abrir o painel e clicar em "Testar Som" para liberar o áudio.'
          ),

          createHeading1('6. AUTOMAÇÃO DA IMPRESSORA TÉRMICA'),
          p('Compatível com bobinas contínuas de 58mm e 80mm. Suporta comunicação direta via WebUSB ou através do Spooler do Windows.'),
          p('Com o modo AutoPrint habilitado, a impressora emite a comanda no exato segundo em que o cliente confirma o pedido, dispensando intervenção manual do caixa.'),

          createHeading1('7. GESTÃO DE PRODUTOS E RECURSO DE PAUSA RÁPIDA'),
          p('O proprietário pode alterar preços, fotos e descrições a qualquer momento na aba Produtos.'),
          p('Em caso de falta momentânea de ingredientes (ex: acabou o pão de xis no sábado à noite), o operador pode utilizar o botão "Pausar Produto". O produto sai do ar no cardápio dos clientes imediatamente sem ser deletado, e pode ser reativado com 1 clique no dia seguinte.'),

          createHeading1('8. HORÁRIOS DE ATENDIMENTO E TRAVA AUTOMÁTICA'),
          p('O sistema possui trava de segurança: fora do horário de funcionamento ou nas segundas-feiras (folga semanal), o cardápio exibe o aviso de fechamento e bloqueia a finalização de compras, evitando pedidos fora de hora.'),

          createHeading1('9. SUPORTE TÉCNICO E SLA'),
          p('O suporte técnico do desenvolvedor é prestado de segunda a sexta-feira, das 09h00 às 21h00.'),
          p('Aos fins de semana e madrugadas, a plataforma opera 100% autônoma em infraestrutura na nuvem (Cloud 24/7), garantindo alta disponibilidade e estabilidade.'),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 300 },
            children: [
              new TextRun({
                text: 'Desenvolvido por Braian Kleber Camargo • Engenharia de Software',
                bold: true,
                size: 20,
                color: '4E2A84',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(process.cwd(), 'public', 'docs', 'MANUAL_OPERACIONAL_NICKEL_LANCHES.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Manual Word gerado com sucesso em: ${outPath} (${buffer.length} bytes)`);
}

buildManualDocx().catch((err) => {
  console.error('Erro gerando manual docx:', err);
  process.exit(1);
});
