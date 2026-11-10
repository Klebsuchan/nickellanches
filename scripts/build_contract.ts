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

function createTitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 30, // 15pt
        color: '1E1B4B',
        font: 'Segoe UI',
      }),
    ],
  });
}

function createSubtitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 280 },
    children: [
      new TextRun({
        text,
        italics: true,
        size: 20, // 10pt
        color: '6B7280',
        font: 'Segoe UI',
      }),
    ],
  });
}

function createClauseHeader(number: string, title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    children: [
      new TextRun({
        text: `CLÁUSULA ${number}ª – ${title}`,
        bold: true,
        size: 22, // 11pt
        color: '312E81',
        font: 'Segoe UI',
      }),
    ],
  });
}

function p(text: string, options: { bold?: boolean; italic?: boolean; spacingAfter?: number } = {}): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: { after: options.spacingAfter ?? 100, line: 260 },
    children: [
      new TextRun({
        text,
        bold: options.bold,
        italics: options.italic,
        color: '1F2937',
        font: 'Segoe UI',
        size: 21, // 10.5pt
      }),
    ],
  });
}

function bullet(prefix: string, text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60, line: 250 },
    children: [
      new TextRun({
        text: prefix,
        bold: true,
        color: '111827',
        font: 'Segoe UI',
        size: 21,
      }),
      new TextRun({
        text: ' ' + text,
        color: '374151',
        font: 'Segoe UI',
        size: 21,
      }),
    ],
  });
}

function signatureLine(role: string, name: string, docLabel: string): TableCell {
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    margins: { top: 200, bottom: 100, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: '________________________________________________',
            color: '6B7280',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60 },
        children: [
          new TextRun({
            text: name,
            bold: true,
            size: 20,
            font: 'Segoe UI',
            color: '111827',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: role,
            size: 19,
            font: 'Segoe UI',
            color: '4B5563',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: docLabel,
            size: 18,
            font: 'Segoe UI',
            color: '9CA3AF',
          }),
        ],
      }),
    ],
  });
}

async function buildContract() {
  console.log('Gerando CONTRATO_NICKEL_LANCHES.docx...');

  const doc = new Document({
    creator: 'Braian Kleber Camargo',
    title: 'Contrato de Cessão de Uso de Software e Suporte Tecnológico - Nickel Lanches',
    description: 'Instrumento particular de prestação de serviços tecnológicos e cessão de software.',
    styles: {
      default: {
        document: {
          run: {
            font: 'Segoe UI',
            size: 21,
            color: '1F2937',
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
          createTitle('CONTRATO DE CESSÃO DE USO DE SOFTWARE E SUPORTE TÉCNICO'),
          createSubtitle('Instrumento Particular de Prestação de Serviços de Engenharia de Software e Suporte Operacional'),

          p('Por este instrumento particular, de um lado:'),
          p('CONTRATADA: BRAIAN KLEBER CAMARGO, Desenvolvedor de Software e Engenheiro Responsável pela plataforma, doravante denominado simplesmente DESENVOLVEDOR; e, de outro lado:', { bold: false }),
          p('CONTRATANTE: SÉRGIO NICKEL DA COSTA, titular do estabelecimento comercial NICKEL LANCHES, doravante denominado simplesmente CLIENTE;', { bold: false }),
          p('Têm, entre si, justo e acordado o presente Contrato, que se regerá pelas seguintes cláusulas e condições:'),

          createClauseHeader('PRIMEIRA', 'DO OBJETO E DA ENTREGA DO SISTEMA ("AS-IS")'),
          p('1.1. O presente instrumento tem por objeto a cessão de direito de uso e a entrega técnica da plataforma tecnológica web/ERP "Nickel Lanches" no exato estado em que se encontra nesta data (versão 2.3.0), totalmente funcional e homologada.'),
          p('1.2. O CLIENTE declara ter testado e aprovado o ecossistema ora recebido, compreendendo expressamente as seguintes funcionalidades já ativas:'),
          bullet('a) Cardápio Digital Interativo:', 'Catálogo dinâmico de produtos, gerenciador de opcionais/adicionais, carrinho de compras, cálculo automático de taxa de entrega por raio de distância e checkout transparente.'),
          bullet('b) Painel Administrativo e Gestão de Cozinha (KDS):', 'Kanban de pedidos em tempo real, controle de comandas, mesas, relatórios de faturamento e controle de estoque de insumos.'),
          bullet('c) Pagamento via PIX Automático:', 'Integração oficial via Gateway Stripe com geração de QR Code/Copia e Cola e baixa automática em segundos diretamente no banco.'),
          bullet('d) Automação de Impressão Térmica:', 'Módulo de impressão direta para comandas e vias de entrega em bobinas de 58mm e 80mm (USB e Rede).'),
          bullet('e) Sistema de Alertas Sonoros e Sintetização de Voz:', 'Notificação por áudio e voz em tempo real avisando a chegada de novos pedidos no painel.'),
          bullet('f) Módulo de Gamificação:', 'Jogo integrado para engajamento e fidelização de clientes.'),

          createClauseHeader('SEGUNDA', 'DO VALOR E DAS CONDIÇÕES DE PAGAMENTO'),
          p('2.1. Pela totalidade dos serviços de engenharia de software, customizações já executadas, integrações e entrega da plataforma completa descrita na Cláusula Primeira, o CLIENTE pagará ao DESENVOLVEDOR o valor total de R$ 3.000,00 (três mil reais).'),
          p('2.2. O pagamento do montante acordado será realizado de forma parcelada, em exatamente 10 (dez) parcelas mensais, fixas e sucessivas de R$ 300,00 (trezentos reais) cada.'),
          p('2.3. As parcelas serão pagas via transferência bancária ou PIX até o dia 10 de cada mês subsequente ao início da vigência deste contrato.'),

          createClauseHeader('TERCEIRA', 'DA MENSALIDADE DE SUPORTE BÁSICO PÓS-PARCELAS'),
          p('2.1. Após a quitação integral das 10 (dez) parcelas de R$ 300,00 previstas na Cláusula Segunda, a relação passará a vigorar sob regime de Suporte Básico Mensal, no valor fixo de R$ 56,00 (cinquenta e seis reais) por mês.'),
          p('3.2. A taxa de R$ 56,00 mensais destina-se exclusivamente a:'),
          bullet('• Monitoramento da estabilidade:', 'Garantir que a aplicação permaneça acessível e operando na infraestrutura em nuvem (Cloud).'),
          bullet('• Manutenção preventiva e corretiva básica:', 'Correção de eventuais instabilidades nas integrações nativas existentes (Stripe PIX, banco de dados ou impressão).'),
          bullet('• Backups periódicos:', 'Preservação da base de dados de clientes, pedidos e produtos.'),

          createClauseHeader('QUARTA', 'DO ESCOPO, ALTERAÇÕES E DESENVOLVIMENTOS FUTUROS'),
          p('4.1. O CLIENTE declara ciência expressa de que o valor contratado e a mensalidade de R$ 56,00 cobrem estritamente a manutenção da estrutura existente e entregue.'),
          p('4.2. Quaisquer solicitações de alterações fora do que foi construído — tais como: desenvolvimento de novas funcionalidades, criação de novas telas, adição de novas colunas no banco de dados, novos tipos de relatórios ou novas integrações de terceiros — NÃO estão contempladas na mensalidade básica e serão cobradas à parte.'),
          p('4.3. Para cada nova demanda solicitada, o DESENVOLVEDOR avaliará a viabilidade técnica e apresentará orçamento prévio de valor e prazo para aprovação formal do CLIENTE antes do início de qualquer codificação.'),

          createClauseHeader('QUINTA', 'DOS HORÁRIOS DE SUPORTE E ATENDIMENTO TÉCNICO (SLA)'),
          p('5.1. O atendimento e suporte técnico prestado pelo DESENVOLVEDOR ocorrerão exclusivamente:'),
          bullet('• Dias e Horários de Suporte:', 'De segunda-feira a sexta-feira, das 09h00 até às 21h00.'),
          p('5.2. Aos sábados, domingos e feriados NÃO haverá plantão de suporte técnico manual. O sistema de pedidos e o painel administrativo permanecerão rodando 100% de forma autônoma na infraestrutura em nuvem de alta disponibilidade (Cloud 24/7), dispensando intervenção técnica diária.'),
          p('5.3. Solicitações enviadas fora do horário comercial estipulado serão registradas e atendidas a partir do primeiro dia útil subsequente.'),

          createClauseHeader('SEXTA', 'DAS DISPOSIÇÕES GERAIS E FORO'),
          p('6.1. O presente contrato passa a vigorar a partir da data de sua assinatura por ambas as partes.'),
          p('6.2. O descumprimento injustificado do pagamento das parcelas autoriza a suspensão temporária dos serviços de hospedagem e suporte até a regularização financeira.'),
          p('6.3. As partes elegem a via eletrônica e digital (WhatsApp, e-mail com aceite ou assinatura digital) como plenamente válida e com força executiva para a celebração deste instrumento.'),
          p('E, por estarem assim justos e contratados, assinam o presente instrumento em duas vias de igual teor e forma.'),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200, after: 200 },
            children: [
              new TextRun({
                text: 'Data: ______ de ______________________ de 2026.',
                bold: true,
                color: '374151',
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  signatureLine('CONTRATANTE', 'SÉRGIO NICKEL DA COSTA', 'CPF: ___________________ • Nickel Lanches'),
                  signatureLine('CONTRATADA', 'BRAIAN KLEBER CAMARGO', 'Desenvolvedor & Engenheiro de Software'),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 180, after: 80 } }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  signatureLine('TESTEMUNHA 1', 'Nome: ___________________________', 'CPF: ___________________________'),
                  signatureLine('TESTEMUNHA 2', 'Nome: ___________________________', 'CPF: ___________________________'),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(process.cwd(), 'public', 'docs', 'CONTRATO_NICKEL_LANCHES.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Contrato gerado com sucesso em: ${outPath} (${buffer.length} bytes)`);
}

buildContract().catch((err) => {
  console.error('Erro gerando contrato:', err);
  process.exit(1);
});
