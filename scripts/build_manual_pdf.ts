import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// -----------------------------------------------------------------------------
// GERADOR OFICIAL DO MANUAL VISUAL DO ECOSSISTEMA NICKEL LANCHES (VERSÃO 2.3.0)
// Com fontes TrueType embutidas, paginação controlada (9 páginas exatas),
// pinos posicionados nos cantos das caixas sem cobrir textos e
// diagramas fiéis da interface real do site e do Painel Admin.
// -----------------------------------------------------------------------------

async function generatePdf() {
  console.log('Iniciando geração de alta precisão do MANUAL_OPERACIONAL_NICKEL_LANCHES.pdf...');

  const outDir = path.join(process.cwd(), 'public', 'docs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, 'MANUAL_OPERACIONAL_NICKEL_LANCHES.pdf');
  const stream = fs.createWriteStream(outPath);

  const doc = new PDFDocument({
    margin: 0,
    size: 'A4', // 595.28 x 841.89
    bufferPages: true,
    autoFirstPage: true,
  });

  doc.pipe(stream);

  // Registrar Fontes TrueType Reais do Sistema (Suporte completo a acentos e símbolos)
  const fontReg = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
  const fontBold = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  const fontOblique = '/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf';

  if (fs.existsSync(fontReg)) doc.registerFont('Regular', fontReg);
  else doc.registerFont('Regular', 'Helvetica');

  if (fs.existsSync(fontBold)) doc.registerFont('Bold', fontBold);
  else doc.registerFont('Bold', 'Helvetica-Bold');

  if (fs.existsSync(fontOblique)) doc.registerFont('Italic', fontOblique);
  else doc.registerFont('Italic', 'Helvetica-Oblique');

  // Paleta Oficial Nickel Lanches
  const C = {
    purple: '#4E2A84',
    purpleDark: '#2E1552',
    purpleLight: '#EDE9FE',
    orange: '#F28B20',
    orangeDark: '#D97706',
    orangeLight: '#FFF7ED',
    yellow: '#FACC15',
    yellowDark: '#CA8A04',
    emerald: '#10B981',
    emeraldDark: '#047857',
    emeraldLight: '#D1FAE5',
    amber: '#F59E0B',
    amberLight: '#FEF3C7',
    blue: '#2563EB',
    blueLight: '#DBEAFE',
    red: '#DC2626',
    redLight: '#FEE2E2',
    dark: '#09090B',
    stone900: '#1C1917',
    stone800: '#292524',
    stone700: '#44403C',
    stone500: '#78716C',
    stone300: '#D6D3D1',
    stone200: '#E7E5E4',
    stone100: '#F5F5F4',
    white: '#FFFFFF',
  };

  function txt(
    str: string,
    x: number,
    y: number,
    opts: {
      font?: 'Regular' | 'Bold' | 'Italic';
      size?: number;
      color?: string;
      width?: number;
      align?: 'left' | 'center' | 'right' | 'justify';
      lineGap?: number;
    } = {}
  ) {
    doc
      .font(opts.font || 'Regular')
      .fontSize(opts.size || 9)
      .fillColor(opts.color || C.dark)
      .text(str, x, y, {
        width: opts.width,
        align: opts.align || 'left',
        lineGap: opts.lineGap ?? 1.5,
        lineBreak: opts.width ? true : false,
      });
  }

  function drawPageHeader(chapterNum: string, title: string, subtitle: string, pageNum: number, totalPages = 9) {
    doc.rect(0, 0, 595.28, 8).fill(C.purple);
    doc.rect(0, 8, 595.28, 3).fill(C.orange);

    txt(chapterNum.toUpperCase(), 35, 22, { font: 'Bold', size: 8.5, color: C.orange });
    txt(title, 35, 34, { font: 'Bold', size: 15.5, color: C.dark });
    txt(subtitle, 35, 54, { font: 'Regular', size: 9, color: C.stone500, width: 525 });

    doc.strokeColor(C.stone200).lineWidth(1).moveTo(35, 72).lineTo(560, 72).stroke();

    // Rodapé Fixo da Página
    doc.strokeColor(C.stone200).lineWidth(0.8).moveTo(35, 804).lineTo(560, 804).stroke();
    txt('NICKEL LANCHES • MANUAL OPERACIONAL DO SISTEMA (VERSÃO 2.3.0 PRO)', 35, 811, {
      font: 'Bold',
      size: 7.5,
      color: C.stone500,
    });
    txt(`Página ${pageNum} de ${totalPages}`, 450, 811, {
      font: 'Bold',
      size: 8,
      color: C.purple,
      width: 110,
      align: 'right',
    });
  }

  function drawPin(x: number, y: number, num: string | number, bgColor = C.orange, textColor = C.white) {
    doc.save();
    doc.circle(x, y, 8).fill(bgColor);
    doc.circle(x, y, 8).lineWidth(1.2).stroke(C.white);
    txt(String(num), x - 8, y - 4.2, {
      font: 'Bold',
      size: 7.5,
      color: textColor,
      width: 16,
      align: 'center',
    });
    doc.restore();
  }

  function drawLegendItem(pinNum: number, title: string, desc: string, yPos: number): number {
    drawPin(45, yPos + 7, pinNum, C.orange);
    txt(title, 60, yPos, { font: 'Bold', size: 9, color: C.dark, width: 498 });
    txt(desc, 60, yPos + 13, { font: 'Regular', size: 8.3, color: C.stone700, width: 498, lineGap: 1.5 });
    const lines = Math.ceil(desc.length / 88);
    return yPos + 16 + lines * 11.5;
  }

  function drawBrowserWindow(x: number, y: number, w: number, h: number, urlText: string) {
    doc.roundedRect(x + 2, y + 3, w, h, 8).fill('#CBD5E1');
    doc.roundedRect(x, y, w, h, 8).fill(C.stone100);
    doc.roundedRect(x, y, w, h, 8).lineWidth(1).stroke(C.stone300);

    doc.roundedRect(x, y, w, 22, 8).fill(C.stone900);
    doc.rect(x, y + 12, w, 10).fill(C.stone900);

    doc.circle(x + 12, y + 11, 3.2).fill('#EF4444');
    doc.circle(x + 22, y + 11, 3.2).fill('#F59E0B');
    doc.circle(x + 32, y + 11, 3.2).fill('#10B981');

    doc.roundedRect(x + 48, y + 4, w - 60, 14, 4).fill('#292524');
    txt(`HTTPS://  ${urlText}`, x + 56, y + 7, { font: 'Bold', size: 7, color: '#A8A29E' });
  }

  // ===========================================================================
  // PÁGINA 1: CAPA EXECUTIVA DE ALTA PRECISÃO
  // ===========================================================================
  doc.rect(0, 0, 595.28, 841.89).fill('#09090B');
  doc.rect(0, 0, 595.28, 10).fill(C.purple);
  doc.rect(0, 10, 595.28, 4).fill(C.yellow);

  doc.roundedRect(35, 32, 235, 22, 11).fill('#18181B');
  doc.roundedRect(35, 32, 235, 22, 11).lineWidth(1).stroke(C.purple);
  txt('DOCUMENTAÇÃO TÉCNICA & OPERACIONAL', 40, 39, {
    font: 'Bold',
    size: 8,
    color: C.yellow,
    width: 225,
    align: 'center',
  });

  txt('VERSÃO 2.3.0 PRO • PASSO FUNDO / RS', 330, 39, {
    font: 'Bold',
    size: 8,
    color: '#A1A1AA',
    width: 230,
    align: 'right',
  });

  // Imagem Oficial da Abertura do Site (Sérgio & Fran - Nickel Lanches)
  const introImg = path.join(process.cwd(), 'public', 'assets', 'aistudio', 'image_b3a91306.png');
  if (fs.existsSync(introImg)) {
    doc.roundedRect(33, 68, 529, 224, 10).fill(C.purple);
    doc.image(introImg, 35, 70, { width: 525, height: 220 });
    doc.roundedRect(35, 70, 525, 220, 8).lineWidth(1.5).stroke(C.yellow);
  }

  txt('GUIA VISUAL COMPLETO DE OPERAÇÃO E ENGENHARIA', 35, 308, {
    font: 'Bold',
    size: 10,
    color: C.orange,
  });
  txt('MANUAL OFICIAL DO SISTEMA', 35, 324, {
    font: 'Bold',
    size: 24,
    color: C.white,
  });
  txt('NICKEL LANCHES • ERP & CARDÁPIO DIGITAL', 35, 354, {
    font: 'Bold',
    size: 18,
    color: C.yellow,
  });

  txt(
    'Manual passo a passo ilustrado com a pré-visualização fiel de cada tela, botão e ferramenta do site. Projetado para consulta rápida do proprietário Sérgio Nickel Da Costa, equipe de caixa, cozinha e atendimento.',
    35,
    385,
    { font: 'Regular', size: 9.2, color: '#D4D4D8', width: 525, lineGap: 2.5 }
  );

  const cards = [
    {
      badge: 'MÓDULO 01',
      title: 'Cardápio Digital & PIX Oficial',
      desc: 'Catálogo interativo, adicionais, taxa de entrega por bairro em Passo Fundo e QR Code PIX com baixa automática via Stripe.',
      color: C.emerald,
    },
    {
      badge: 'MÓDULO 02',
      title: 'Painel de Comandas (Kanban)',
      desc: 'Separação automática entre "Aguardando Pagamento" e "Na Comanda (Pagos)", com alerta sonoro e voz sintetizada.',
      color: C.yellow,
    },
    {
      badge: 'MÓDULO 03',
      title: 'Impressão Térmica & AutoPrint',
      desc: 'Aplicativo Windows Bridge (.bat), impressão WebUSB e Spooler em bobinas de 58mm e 80mm com 1 ou 2 vias.',
      color: C.orange,
    },
    {
      badge: 'MÓDULO 04',
      title: 'Gestão Total da Lanchonete',
      desc: 'Pausa rápida de produtos esgotados, horários automáticos, histórico de clientes VIP, cupons e relatórios.',
      color: '#A855F7',
    },
  ];

  cards.forEach((c, idx) => {
    const x = idx % 2 === 0 ? 35 : 305;
    const y = idx < 2 ? 435 : 530;
    doc.roundedRect(x, y, 255, 84, 8).fill('#18181B');
    doc.roundedRect(x, y, 255, 84, 8).lineWidth(1).stroke('#27272A');
    doc.rect(x, y + 12, 3.5, 60).fill(c.color);

    txt(c.badge, x + 14, y + 11, { font: 'Bold', size: 7.5, color: c.color });
    txt(c.title, x + 14, y + 24, { font: 'Bold', size: 10, color: C.white });
    txt(c.desc, x + 14, y + 40, { font: 'Regular', size: 8, color: '#A1A1AA', width: 230, lineGap: 1.5 });
  });

  // Sumário Executivo na Capa
  doc.roundedRect(35, 632, 525, 130, 8).fill('#121215');
  doc.roundedRect(35, 632, 525, 130, 8).lineWidth(1).stroke('#27272A');
  txt('ÍNDICE DE NAVEGAÇÃO RÁPIDA DESTE MANUAL:', 48, 645, {
    font: 'Bold',
    size: 9,
    color: C.yellow,
  });

  const tocLeft = [
    'Pág. 02 • Experiência do Cliente, Jogo & Cardápio Digital',
    'Pág. 03 • Sacola, Cálculo de Entrega e Checkout PIX Stripe',
    'Pág. 04 • Visão Geral do Painel Administrativo (/painel-admin)',
    'Pág. 05 • Operação do Kanban: Retenção vs. Comanda Paga',
  ];
  const tocRight = [
    'Pág. 06 • Impressora Térmica 58/80mm & App AutoPrint',
    'Pág. 07 • Gestão de Produtos, Preços e Botão Pausar Item',
    'Pág. 08 • Horários de Funcionamento, Cupons e Banners',
    'Pág. 09 • CRM Histórico de Clientes, Visitas e Solução Rápida',
  ];

  tocLeft.forEach((item, i) => {
    txt('• ' + item, 48, 668 + i * 21, { font: 'Regular', size: 7.6, color: '#E4E4E7' });
  });
  tocRight.forEach((item, i) => {
    txt('• ' + item, 304, 668 + i * 21, { font: 'Regular', size: 7.6, color: '#E4E4E7' });
  });

  txt(
    'Proprietário: Sérgio Nickel Da Costa  |  Engenharia de Software: Braian Kleber Camargo  |  Nickel Lanches © 2026',
    35,
    785,
    { font: 'Regular', size: 8, color: '#71717A', width: 525, align: 'center' }
  );
  doc.rect(0, 828, 595.28, 14).fill(C.orange);

  // ===========================================================================
  // PÁGINA 2: EXPERIÊNCIA DO CLIENTE, APRESENTAÇÃO E CARDÁPIO DIGITAL
  // ===========================================================================
  doc.addPage();
  drawPageHeader(
    'Capítulo 01 • Visão do Cliente',
    'Abertura Interativa, Jogo e Cardápio Digital',
    'Como o cliente navega pelo site nickellanches.com.br, joga para ganhar descontos e monta o pedido.',
    2
  );

  const bY = 82;
  drawBrowserWindow(35, bY, 525, 275, 'nickellanches.com.br');

  const sY = bY + 22;
  doc.rect(35, sY, 525, 34).fill(C.purpleDark);
  txt('NICKEL LANCHES', 48, sY + 11, { font: 'Bold', size: 10.5, color: C.yellow });

  const siteTabs = ['Cardápio', 'Nossa História', 'Cozinha', 'Comunidade'];
  siteTabs.forEach((t, i) => {
    const tx = 165 + i * 76;
    if (i === 0) {
      doc.roundedRect(tx, sY + 7, 70, 20, 10).fill(C.orange);
      txt(t, tx, sY + 12, { font: 'Bold', size: 7.5, color: C.white, width: 70, align: 'center' });
    } else {
      txt(t, tx, sY + 12, { font: 'Regular', size: 7.5, color: '#D8B4FE', width: 70, align: 'center' });
    }
  });

  doc.roundedRect(482, sY + 7, 65, 20, 10).fill(C.yellow);
  txt('Sacola (2)', 482, sY + 12, { font: 'Bold', size: 7.5, color: C.dark, width: 65, align: 'center' });

  doc.rect(35, sY + 34, 525, 20).fill('#10B981');
  txt(
    'LOJA ABERTA AGORA • ENTREGA RÁPIDA EM PASSO FUNDO • JOGUE E GANHE ATÉ 13% DE DESCONTO!',
    35,
    sY + 40,
    { font: 'Bold', size: 7.5, color: C.white, width: 525, align: 'center' }
  );

  const catY = sY + 62;
  const cats = ['Todos', 'Xis', 'Hot Dog', 'Combos', 'Porções', 'Bebidas'];
  cats.forEach((c, idx) => {
    const cx = 46 + idx * 65;
    doc.roundedRect(cx, catY, 61, 19, 6).fill(idx === 1 ? C.purple : C.white);
    if (idx !== 1) doc.roundedRect(cx, catY, 61, 19, 6).lineWidth(1).stroke(C.stone300);
    txt(c, cx, catY + 5, {
      font: 'Bold',
      size: 7.2,
      color: idx === 1 ? C.white : C.stone700,
      width: 61,
      align: 'center',
    });
  });

  doc.roundedRect(442, catY, 105, 19, 6).fill(C.white);
  doc.roundedRect(442, catY, 105, 19, 6).lineWidth(1).stroke(C.stone300);
  txt('Buscar lanche...', 450, catY + 5, { font: 'Regular', size: 7.2, color: C.stone500 });

  const prodY = catY + 27;
  const realProds = [
    {
      name: 'Xis Magma Especial',
      desc: 'Pão prensado, 2 carnes, muito queijo, calabresa e maionese da casa.',
      price: 'R$ 32,00',
      img: path.join(process.cwd(), 'public', 'images', 'magma.png'),
      tag: 'MAIS PEDIDO',
    },
    {
      name: 'Xis Bomba Gigante',
      desc: 'Recheado com batata frita crocante, bacon em cubos, cheddar e barbecue.',
      price: 'R$ 36,00',
      img: path.join(process.cwd(), 'public', 'images', 'bomba.png'),
      tag: 'DESTAQUE',
    },
    {
      name: 'Xis Olympus Catupiry',
      desc: 'Filé suculento, catupiry original, bacon crocante, ovo, alface e tomate.',
      price: 'R$ 35,00',
      img: path.join(process.cwd(), 'public', 'images', 'olympus.png'),
      tag: 'ESPECIAL',
    },
  ];

  realProds.forEach((p, idx) => {
    const px = 48 + idx * 168;
    doc.roundedRect(px, prodY, 160, 155, 8).fill(C.white);
    doc.roundedRect(px, prodY, 160, 155, 8).lineWidth(1).stroke(C.stone200);

    doc.roundedRect(px + 6, prodY + 6, 148, 74, 6).fill('#1C1917');
    if (fs.existsSync(p.img)) {
      try {
        doc.image(p.img, px + 36, prodY + 8, { width: 88, height: 70, fit: [88, 70] });
      } catch {}
    }

    doc.roundedRect(px + 10, prodY + 10, 58, 13, 4).fill(C.orange);
    txt(p.tag, px + 10, prodY + 13, { font: 'Bold', size: 6, color: C.white, width: 58, align: 'center' });

    txt(p.name, px + 8, prodY + 85, { font: 'Bold', size: 8.8, color: C.dark });
    txt(p.desc, px + 8, prodY + 98, { font: 'Regular', size: 7, color: C.stone500, width: 144 });

    txt(p.price, px + 8, prodY + 132, { font: 'Bold', size: 9.8, color: C.emeraldDark });
    doc.roundedRect(px + 88, prodY + 129, 64, 19, 6).fill(C.yellow);
    txt('+ Adicionar', px + 88, prodY + 134, { font: 'Bold', size: 7.2, color: C.dark, width: 64, align: 'center' });
  });

  // Pinos posicionados na borda superior dos botões sem cobrir os textos!
  drawPin(164, sY + 8, 1);
  drawPin(480, sY + 8, 2);
  drawPin(112, catY + 1, 3);
  drawPin(544, catY + 1, 4);
  drawPin(202, prodY + 129, 5);

  let curY = bY + 288;
  txt('Onde Clicar e O Que Faz Cada Elemento do Cardápio:', 35, curY, {
    font: 'Bold',
    size: 10.5,
    color: C.purple,
  });
  curY += 18;

  curY = drawLegendItem(
    1,
    'Abas de Navegação Superior (Cardápio, Nossa História, Cozinha, Comunidade):',
    'Permite ao cliente alternar entre o cardápio de compras, a história da família Sérgio & Fran, fotos da cozinha e avaliações de clientes.',
    curY
  );
  curY = drawLegendItem(
    2,
    'Botão da Sacola de Compras (Topo Direito):',
    'Mostra em tempo real quantos lanches foram adicionados e abre a gaveta lateral para conferência de valores e aplicação de cupom.',
    curY
  );
  curY = drawLegendItem(
    3,
    'Filtro Instantâneo por Categoria (Todos, Xis, Hot Dog, Combos, Porções, Bebidas):',
    'Ao clicar em qualquer botão, a página filtra os lanches imediatamente sem recarregar a tela.',
    curY
  );
  curY = drawLegendItem(
    4,
    'Busca Inteligente por Nome ou Ingrediente:',
    'O cliente digita "bacon", "coração" ou "coca" e o sistema exibe apenas os produtos correspondentes.',
    curY
  );
  curY = drawLegendItem(
    5,
    'Botão "+ Adicionar" e Modal de Personalização do Lanche:',
    'Abre a janela onde o cliente escolhe adicionais pagos (+1 carne, +bacon, +cheddar) e digita observações para a chapa (ex: "sem cebola, bem prensado").',
    curY
  );

  doc.roundedRect(35, curY + 6, 525, 62, 8).fill(C.purpleLight);
  doc.rect(35, curY + 6, 5, 62).fill(C.purple);
  txt('COMO FUNCIONA O JOGO INTERATIVO (NICKEL GAME):', 50, curY + 14, {
    font: 'Bold',
    size: 9.2,
    color: C.purpleDark,
  });
  txt(
    'Na tela inicial ou clicando no botão "Jogar", o cliente controla o mascote da Nickel Lanches desviando de obstáculos e coletando lanches. Ao atingir a pontuação, o sistema libera automaticamente um Cupom de Desconto (até 13% OFF) que já é aplicado direto no carrinho!',
    50,
    curY + 28,
    { font: 'Regular', size: 8.2, color: C.stone800, width: 495, lineGap: 1.8 }
  );

  // ===========================================================================
  // PÁGINA 3: SACOLA, CÁLCULO DE FRETE E CHECKOUT PIX STRIPE
  // ===========================================================================
  doc.addPage();
  drawPageHeader(
    'Capítulo 02 • Fechamento do Pedido',
    'Sacola Inteligente, Frete por Bairro e Checkout PIX',
    'Como o sistema valida os dados do cliente, calcula a taxa de entrega e recebe o PIX automático.',
    3
  );

  const cY = 82;
  drawBrowserWindow(35, cY, 525, 290, 'nickellanches.com.br/#checkout');

  const mTop = cY + 28;
  doc.roundedRect(48, mTop, 242, 252, 8).fill(C.white);
  doc.roundedRect(48, mTop, 242, 252, 8).lineWidth(1).stroke(C.stone300);

  txt('FINALIZAR PEDIDO (1/2)', 60, mTop + 10, { font: 'Bold', size: 9.8, color: C.dark });
  txt('Informe seus dados e modalidade de entrega', 60, mTop + 23, { font: 'Regular', size: 7.2, color: C.stone500 });

  doc.roundedRect(60, mTop + 38, 105, 20, 6).fill(C.orange);
  txt('Tele-Entrega', 60, mTop + 44, { font: 'Bold', size: 7.5, color: C.white, width: 105, align: 'center' });
  doc.roundedRect(172, mTop + 38, 105, 20, 6).fill(C.stone100);
  txt('Retirar no Balcão', 172, mTop + 44, { font: 'Bold', size: 7.5, color: C.stone700, width: 105, align: 'center' });

  const fields = [
    { label: 'SEU NOME COMPLETO *', val: 'João da Silva' },
    { label: 'WHATSAPP (COM DDD) *', val: '(54) 99912-3456' },
    { label: 'BAIRRO / REGIÃO (PASSO FUNDO) *', val: 'Centro / Petrópolis (Taxa: R$ 8,00)' },
    { label: 'RUA, NÚMERO E COMPLEMENTO *', val: 'Av. Brasil, Nº 1500 - Apto 302' },
  ];
  fields.forEach((f, idx) => {
    const fy = mTop + 68 + idx * 43;
    txt(f.label, 60, fy, { font: 'Bold', size: 6.8, color: C.stone500 });
    doc.roundedRect(60, fy + 10, 218, 21, 5).fill(C.stone100);
    doc.roundedRect(60, fy + 10, 218, 21, 5).lineWidth(0.8).stroke(C.stone300);
    txt(f.val, 68, fy + 16, { font: 'Bold', size: 7.5, color: C.dark });
  });

  // Card Direito: Pagamento PIX Stripe e Resumo
  doc.roundedRect(305, mTop, 242, 252, 8).fill(C.white);
  doc.roundedRect(305, mTop, 242, 252, 8).lineWidth(1).stroke(C.stone300);

  txt('FORMA DE PAGAMENTO (2/2)', 317, mTop + 10, { font: 'Bold', size: 9.8, color: C.dark });
  txt('Baixa automática oficial sem precisar de comprovante', 317, mTop + 23, { font: 'Regular', size: 7.2, color: C.stone500 });

  doc.roundedRect(317, mTop + 40, 218, 50, 8).fill(C.emeraldLight);
  doc.roundedRect(317, mTop + 40, 218, 50, 8).lineWidth(1.5).stroke(C.emerald);
  doc.circle(331, mTop + 65, 6).fill(C.emerald);
  txt('PIX Automático (QR Code / Copia e Cola)', 344, mTop + 49, { font: 'Bold', size: 8.5, color: C.emeraldDark });
  txt('Aprovação instantânea via Stripe • Vai direto p/ Cozinha', 344, mTop + 63, { font: 'Regular', size: 7, color: C.emeraldDark });

  doc.roundedRect(317, mTop + 98, 218, 34, 8).fill(C.stone100);
  doc.roundedRect(317, mTop + 98, 218, 34, 8).lineWidth(1).stroke(C.stone300);
  doc.circle(331, mTop + 115, 6).lineWidth(1).stroke(C.stone500);
  txt('Cartão de Crédito Online (Stripe)', 344, mTop + 110, { font: 'Bold', size: 8, color: C.dark });

  doc.roundedRect(317, mTop + 142, 218, 62, 6).fill('#F8FAFC');
  txt('Subtotal dos Lanches:', 325, mTop + 149, { font: 'Regular', size: 7.8, color: C.stone700 });
  txt('R$ 64,00', 465, mTop + 149, { font: 'Regular', size: 7.8, color: C.stone700, width: 60, align: 'right' });

  txt('Cupom Aplicado (PRIMEIRA10):', 325, mTop + 163, { font: 'Bold', size: 7.8, color: C.emeraldDark });
  txt('- R$ 6,40', 465, mTop + 163, { font: 'Bold', size: 7.8, color: C.emeraldDark, width: 60, align: 'right' });

  txt('Taxa de Entrega (Bairro):', 325, mTop + 177, { font: 'Bold', size: 7.8, color: C.orangeDark });
  txt('+ R$ 8,00', 465, mTop + 177, { font: 'Bold', size: 7.8, color: C.orangeDark, width: 60, align: 'right' });

  txt('TOTAL FINAL:', 325, mTop + 191, { font: 'Bold', size: 9, color: C.dark });
  txt('R$ 65,60', 455, mTop + 190, { font: 'Bold', size: 10, color: C.orange, width: 70, align: 'right' });

  doc.roundedRect(317, mTop + 212, 218, 30, 8).fill(C.emerald);
  txt('GERAR QR CODE PIX (R$ 65,60)', 317, mTop + 222, {
    font: 'Bold',
    size: 8.8,
    color: C.white,
    width: 218,
    align: 'center',
  });

  // Pinos posicionados na borda das caixas sem cobrir palavras!
  drawPin(62, mTop + 38, 1);
  drawPin(276, mTop + 174, 2);
  drawPin(532, mTop + 42, 3);
  drawPin(322, mTop + 227, 4);

  curY = cY + 305;
  txt('Funcionamento Detalhado do Checkout e Pagamento:', 35, curY, {
    font: 'Bold',
    size: 10.5,
    color: C.purple,
  });
  curY += 18;

  curY = drawLegendItem(
    1,
    'Modalidade Tele-Entrega vs. Retirada no Balcão:',
    'Se o cliente escolher "Retirar no Balcão", o sistema zera automaticamente a taxa de entrega e oculta os campos de endereço.',
    curY
  );
  curY = drawLegendItem(
    2,
    'Seletor de Bairro com Taxa Automática:',
    'O cliente seleciona seu bairro na lista oficial de Passo Fundo. O sistema aplica a taxa exata cadastrada, sem erro de digitação.',
    curY
  );
  curY = drawLegendItem(
    3,
    'Pagamento Oficial via PIX ou Cartão (Stripe):',
    'Ao escolher PIX, o sistema gera um código exclusivo conectado ao Banco Central. Assim que o cliente paga no aplicativo do banco dele, o sistema reconhece o pagamento em menos de 3 segundos.',
    curY
  );
  curY = drawLegendItem(
    4,
    'Regra Anti-Golpe (Trava de Comanda Não Paga):',
    'Se o cliente gerar o QR Code PIX mas NÃO pagar, o pedido fica retido na coluna "Aguardando Pagamento" e NÃO imprime na cozinha até o dinheiro cair de verdade.',
    curY
  );

  // ===========================================================================
  // PÁGINA 4: VISÃO GERAL DO PAINEL ADMINISTRATIVO (/painel-admin)
  // ===========================================================================
  doc.addPage();
  drawPageHeader(
    'Capítulo 03 • Retaguarda de Gestão',
    'Painel Administrativo Master (/painel-admin)',
    'Visão completa da barra lateral de navegação, indicadores de visitas e controles globais da loja.',
    4
  );

  const aY = 82;
  drawBrowserWindow(35, aY, 525, 295, 'nickellanches.com.br/painel-admin');

  const pTop = aY + 22;
  doc.rect(35, pTop, 118, 273).fill(C.dark);
  txt('NICKEL', 45, pTop + 10, { font: 'Bold', size: 10.5, color: C.yellow });
  txt('ADMIN', 45, pTop + 22, { font: 'Bold', size: 8.5, color: C.white });

  const adminMenu = [
    { name: 'Pedidos', active: true },
    { name: 'Visitas (Site)', active: false },
    { name: 'Histórico Clientes', active: false },
    { name: 'Imp. Automática', special: true },
    { name: 'Produtos', badge: '2 pausados' },
    { name: 'Horários', active: false },
    { name: 'Cupons', active: false },
    { name: 'Banners', active: false },
    { name: 'Pagamentos', active: false },
    { name: 'Impressora', active: false },
  ];

  adminMenu.forEach((m, i) => {
    const my = pTop + 38 + i * 19;
    if (m.active) {
      doc.roundedRect(42, my, 104, 16, 4).fill(C.yellow);
      txt(m.name, 48, my + 4, { font: 'Bold', size: 7.2, color: C.dark });
    } else if (m.special) {
      doc.roundedRect(42, my, 104, 16, 4).fill('#064E3B');
      doc.roundedRect(42, my, 104, 16, 4).lineWidth(0.8).stroke(C.emerald);
      txt(m.name, 48, my + 4, { font: 'Bold', size: 7, color: '#34D399' });
    } else {
      txt(m.name, 48, my + 4, { font: 'Bold', size: 7.2, color: '#A1A1AA' });
      if (m.badge) {
        doc.roundedRect(100, my + 2, 44, 12, 3).fill(C.red);
        txt(m.badge, 100, my + 4.5, { font: 'Bold', size: 5.5, color: C.white, width: 44, align: 'center' });
      }
    }
  });

  doc.roundedRect(42, pTop + 234, 104, 15, 4).fill('#065F46');
  txt('STATUS: LOJA ABERTA', 42, pTop + 238, { font: 'Bold', size: 6.2, color: '#6EE7B7', width: 104, align: 'center' });
  doc.roundedRect(42, pTop + 252, 104, 15, 4).fill('#450A0A');
  txt('Sair do Painel', 42, pTop + 256, { font: 'Bold', size: 6.2, color: '#FCA5A5', width: 104, align: 'center' });

  const mainX = 160;
  doc.roundedRect(mainX, pTop + 6, 392, 32, 6).fill(C.stone900);
  txt('ACESSOS DO SITE EM TEMPO REAL', mainX + 10, pTop + 11, { font: 'Bold', size: 7.5, color: C.yellow });
  txt('Hoje: 84 visitas   |   7 Dias: 512 visitas   |   Total: 3.490 acessos', mainX + 10, pTop + 23, {
    font: 'Bold',
    size: 7.5,
    color: C.white,
  });
  doc.roundedRect(mainX + 312, pTop + 12, 72, 19, 4).fill(C.yellow);
  txt('Ver Relatório →', mainX + 312, pTop + 17, { font: 'Bold', size: 6.8, color: C.dark, width: 72, align: 'center' });

  const barY = pTop + 44;
  doc.roundedRect(mainX, barY, 392, 50, 6).fill(C.white);
  doc.roundedRect(mainX, barY, 392, 50, 6).lineWidth(0.8).stroke(C.stone300);

  txt('PAINEL DE COMANDAS (SOMENTE PAGOS)', mainX + 10, barY + 6, { font: 'Bold', size: 8.8, color: C.dark });

  doc.roundedRect(mainX + 10, barY + 26, 78, 17, 4).fill(C.emerald);
  txt('+ Lançar Pedido', mainX + 10, barY + 30.5, { font: 'Bold', size: 6.5, color: C.white, width: 78, align: 'center' });

  doc.roundedRect(mainX + 93, barY + 26, 98, 17, 4).fill(C.dark);
  txt('App Imp. Automática', mainX + 93, barY + 30.5, { font: 'Bold', size: 6.5, color: '#34D399', width: 98, align: 'center' });

  doc.roundedRect(mainX + 196, barY + 26, 68, 17, 4).fill(C.stone100);
  txt('Imp. Auto: ON', mainX + 200, barY + 30.5, { font: 'Bold', size: 6.2, color: C.stone700 });
  doc.circle(mainX + 255, barY + 34.5, 4.5).fill(C.emerald);

  doc.roundedRect(mainX + 269, barY + 26, 68, 17, 4).fill(C.amber);
  txt('Testar Alerta', mainX + 269, barY + 30.5, { font: 'Bold', size: 6.5, color: C.dark, width: 68, align: 'center' });

  doc.roundedRect(mainX + 342, barY + 26, 22, 17, 4).fill(C.dark);
  txt('IMP', mainX + 342, barY + 30.5, { font: 'Bold', size: 6, color: C.yellow, width: 22, align: 'center' });

  doc.roundedRect(mainX + 367, barY + 26, 20, 17, 4).fill(C.redLight);
  txt('DEL', mainX + 367, barY + 30.5, { font: 'Bold', size: 6, color: C.red, width: 20, align: 'center' });

  const colY = barY + 56;
  const miniCols = [
    { name: 'Aguardando Pgto', bg: C.amberLight, border: C.amber, count: '1' },
    { name: 'Na Comanda (Pagos)', bg: C.emeraldLight, border: C.emerald, count: '3' },
    { name: 'Em Preparo', bg: '#FEF9C3', border: C.yellowDark, count: '2' },
    { name: 'A Caminho', bg: C.blueLight, border: C.blue, count: '1' },
  ];
  miniCols.forEach((mc, i) => {
    const cx = mainX + i * 99;
    doc.roundedRect(cx, colY, 95, 166, 6).fill(mc.bg);
    doc.roundedRect(cx, colY, 95, 166, 6).lineWidth(1).stroke(mc.border);
    txt(`${mc.name} (${mc.count})`, cx + 5, colY + 6, { font: 'Bold', size: 6.2, color: C.dark });

    doc.roundedRect(cx + 5, colY + 20, 85, 80, 5).fill(C.white);
    doc.roundedRect(cx + 5, colY + 20, 85, 80, 5).lineWidth(0.6).stroke(C.stone300);
    doc.roundedRect(cx + 9, colY + 24, 52, 12, 3).fill(i === 0 ? C.amber : C.yellow);
    txt(`PEDIDO #${104 + i}`, cx + 11, colY + 27, { font: 'Bold', size: 6.2, color: C.dark });
    txt('Cliente Passo Fundo', cx + 9, colY + 40, { font: 'Bold', size: 6.8, color: C.dark });
    txt('2x Xis Especial\n1x Coca-Cola 2L', cx + 9, colY + 52, { font: 'Regular', size: 6.2, color: C.stone700, width: 75 });
    txt('R$ 62,00', cx + 9, colY + 84, { font: 'Bold', size: 7.2, color: C.emeraldDark });
  });

  // Pinos posicionados sem cobrir texto
  drawPin(138, pTop + 46, 1);
  drawPin(142, pTop + 241, 2);
  drawPin(mainX + 12, barY + 24, 3);
  drawPin(mainX + 200, barY + 24, 4);
  drawPin(mainX + 273, barY + 24, 5);

  curY = aY + 308;
  txt('Guia de Todas as Ferramentas da Tela Principal do Admin:', 35, curY, {
    font: 'Bold',
    size: 10.5,
    color: C.purple,
  });
  curY += 18;

  curY = drawLegendItem(
    1,
    'Menu Lateral Esquerdo (10 Módulos do Sistema):',
    'Navegação rápida entre Pedidos, Visitas do Site, Histórico de Clientes, App Impressão Automática, Produtos (mostra aviso vermelho se houver itens pausados), Horários, Cupons, Banners, Pagamentos e Impressora.',
    curY
  );
  curY = drawLegendItem(
    2,
    'Atalho Rápido de Status da Loja (Rodapé Esquerdo):',
    'Mostra se a loja está ABERTA ou FECHADA agora. Clicando nele, você vai direto para a chave de abrir/fechar a loja.',
    curY
  );
  curY = drawLegendItem(
    3,
    'Botão Verde "+ Lançar Pedido" (Pedidos Manuais / Balcão / WhatsApp):',
    'Abre uma janela para lançar manualmente pedidos recebidos por telefone, WhatsApp ou clientes no balcão, escolhendo itens do cardápio e já imprimindo a comanda na hora.',
    curY
  );
  curY = drawLegendItem(
    4,
    'Chave "Imp. Auto" (Liga / Desliga Impressão Automática):',
    'Quando está ligada (ON), todo pedido novo pago dispara a impressora térmica sozinho, sem ninguém precisar clicar.',
    curY
  );
  curY = drawLegendItem(
    5,
    'Botão Amarelo "Testar Alerta" (Destravamento de Som do Navegador):',
    'Ao abrir o computador no início do expediente, clique uma vez em "Testar Alerta". Isso toca o alerta da Nickel Lanches e destrava o áudio do Google Chrome para a noite inteira.',
    curY
  );

  // ===========================================================================
  // PÁGINA 5: OPERAÇÃO DO KANBAN — RETENÇÃO VS. COMANDA PAGA
  // ===========================================================================
  doc.addPage();
  drawPageHeader(
    'Capítulo 04 • Operação de Caixa e Cozinha',
    'Fluxo de Comandas: Retenção vs. Pedidos Pagos',
    'Entenda a separação automática entre pedidos aguardando pagamento e pedidos prontos para a chapa.',
    5
  );

  const kY = 82;
  doc.roundedRect(35, kY, 250, 230, 10).fill(C.amberLight);
  doc.roundedRect(35, kY, 250, 230, 10).lineWidth(1.5).stroke(C.amber);
  txt('COLUNA 1: AGUARDANDO PAGAMENTO', 48, kY + 10, { font: 'Bold', size: 9, color: '#78350F' });
  txt('Fora da Comanda • Não Toca Alerta • Não Imprime Sozinho', 48, kY + 23, { font: 'Regular', size: 7.2, color: '#92400E' });

  doc.roundedRect(47, kY + 38, 226, 180, 8).fill(C.white);
  doc.roundedRect(47, kY + 38, 226, 180, 8).lineWidth(1).stroke(C.amber);

  doc.roundedRect(57, kY + 48, 78, 16, 4).fill(C.amber);
  txt('PEDIDO #108', 63, kY + 52, { font: 'Bold', size: 8, color: C.dark });
  txt('20:14', 235, kY + 52, { font: 'Bold', size: 7.8, color: C.stone500 });

  txt('Carlos Eduardo', 57, kY + 72, { font: 'Bold', size: 9.5, color: C.dark });
  txt('Rua Moron, 820 - Centro', 57, kY + 85, { font: 'Regular', size: 7.8, color: C.stone500 });

  doc.roundedRect(57, kY + 100, 206, 40, 5).fill(C.stone100);
  txt('1x  Xis Bomba Gigante', 64, kY + 106, { font: 'Bold', size: 8, color: C.dark });
  txt('1x  Coca-Cola Lata 350ml', 64, kY + 120, { font: 'Bold', size: 8, color: C.dark });

  txt('R$ 42,00', 57, kY + 150, { font: 'Bold', size: 9.5, color: '#B45309' });
  doc.roundedRect(110, kY + 148, 88, 14, 4).fill(C.amberLight);
  txt('Aguardando Pgto', 115, kY + 151, { font: 'Bold', size: 6.8, color: '#92400E' });

  doc.roundedRect(57, kY + 172, 206, 34, 6).fill(C.emerald);
  txt('MARCAR COMO PAGO\n(CONFIRMAR E IMPRIMIR COMANDA)', 57, kY + 179, {
    font: 'Bold',
    size: 7.8,
    color: C.white,
    width: 206,
    align: 'center',
  });

  // Cartão 2: NA COMANDA (PAGOS)
  doc.roundedRect(310, kY, 250, 230, 10).fill(C.emeraldLight);
  doc.roundedRect(310, kY, 250, 230, 10).lineWidth(1.5).stroke(C.emerald);
  txt('COLUNA 2: NA COMANDA (PAGOS)', 323, kY + 10, { font: 'Bold', size: 9, color: '#064E3B' });
  txt('Pagamento Confirmado • Tocou Alerta • Impresso na Cozinha', 323, kY + 23, { font: 'Regular', size: 7.2, color: '#047857' });

  doc.roundedRect(322, kY + 38, 226, 180, 8).fill(C.white);
  doc.roundedRect(322, kY + 38, 226, 180, 8).lineWidth(1).stroke(C.stone300);

  doc.roundedRect(332, kY + 48, 78, 16, 4).fill(C.yellow);
  txt('PEDIDO #109', 338, kY + 52, { font: 'Bold', size: 8, color: C.dark });
  txt('20:16', 490, kY + 52, { font: 'Bold', size: 7.8, color: C.stone500 });
  doc.circle(532, kY + 56, 7).lineWidth(1.2).stroke(C.stone300);

  txt('Fernanda Oliveira', 332, kY + 72, { font: 'Bold', size: 9.5, color: C.dark });
  txt('Rua Uruguai, 1336 - Petrópolis', 332, kY + 85, { font: 'Regular', size: 7.8, color: C.stone500 });

  doc.roundedRect(332, kY + 100, 206, 50, 5).fill(C.stone100);
  txt('2x  Xis Especial', 339, kY + 106, { font: 'Bold', size: 8, color: C.dark });
  txt('Obs: "1 sem tomate e bem prensado"', 339, kY + 119, { font: 'Italic', size: 7.2, color: C.red });
  txt('1x  Guaraná 2 Litros', 339, kY + 132, { font: 'Bold', size: 8, color: C.dark });

  txt('R$ 68,00', 332, kY + 164, { font: 'Bold', size: 10, color: C.emeraldDark });
  doc.roundedRect(385, kY + 162, 42, 14, 4).fill(C.emeraldLight);
  txt('Pago', 385, kY + 165, { font: 'Bold', size: 7.2, color: C.emeraldDark, width: 42, align: 'center' });

  doc.roundedRect(433, kY + 162, 68, 14, 4).fill(C.stone100);
  txt('PIX (Stripe)', 433, kY + 165, { font: 'Bold', size: 6.8, color: C.stone700, width: 68, align: 'center' });

  doc.roundedRect(508, kY + 159, 30, 20, 5).fill(C.yellow);
  txt('IMP', 508, kY + 165, { font: 'Bold', size: 7, color: C.dark, width: 30, align: 'center' });

  doc.roundedRect(332, kY + 188, 206, 20, 4).fill(C.stone900);
  txt('CLIQUE NO CARTÃO P/ DETALHES OU MUDAR STATUS', 332, kY + 194, {
    font: 'Bold',
    size: 6.5,
    color: C.yellow,
    width: 206,
    align: 'center',
  });

  // Pinos nos cantos sem cobrir os rótulos
  drawPin(62, kY + 174, 1);
  drawPin(538, kY + 158, 2);
  drawPin(532, kY + 56, 3);
  drawPin(336, kY + 188, 4);

  curY = kY + 245;
  txt('Como Operar os Cartões de Pedido no Dia a Dia:', 35, curY, {
    font: 'Bold',
    size: 10.5,
    color: C.purple,
  });
  curY += 18;

  curY = drawLegendItem(
    1,
    'Botão "Marcar como Pago" (Coluna Amarela - Aguardando Pagamento):',
    'Quando o cliente paga via Stripe PIX, o pedido pula sozinho para a Coluna Verde. Porém, se o cliente mandou comprovante no WhatsApp ou vai pagar na retirada, basta clicar neste botão verde: ele confirma o pagamento, toca o som e já imprime na cozinha!',
    curY
  );
  curY = drawLegendItem(
    2,
    'Botão de Impressão Rápida (Botão IMP no Canto Inferior Direito do Cartão):',
    'Precisa de uma segunda via para o motoboy ou a bobina enroscou? Clique neste botão em qualquer pedido pago para reimprimir imediatamente.',
    curY
  );
  curY = drawLegendItem(
    3,
    'Bolinha de Seleção em Lote (Canto Superior Direito do Cartão):',
    'Marque vários pedidos de uma vez e use os botões do topo ("Preparo", "Envio", "Entregue") para mudar a coluna de vários pedidos juntos ou imprimir todos de uma só vez.',
    curY
  );
  curY = drawLegendItem(
    4,
    'Clicar no Meio do Cartão (Abrir Modal Completo do Pedido):',
    'Clicando sobre o nome do cliente ou itens, abre a ficha completa para editar endereço, alterar forma de pagamento, ver o código de autenticação ou chamar o cliente no WhatsApp.',
    curY
  );

  // ===========================================================================
  // PÁGINA 6: IMPRESSORA TÉRMICA 58/80MM & APP IMPRESSÃO AUTOMÁTICA
  // ===========================================================================
  doc.addPage();
  drawPageHeader(
    'Capítulo 05 • Automação de Impressão',
    'Impressora Térmica (58/80mm) & App AutoPrint',
    'Como funciona a impressão automática sem janelas e a anatomia real da comanda impressa.',
    6
  );

  const p6Y = 82;
  doc.roundedRect(35, p6Y, 295, 245, 10).fill(C.stone900);
  doc.roundedRect(35, p6Y, 295, 245, 10).lineWidth(1.5).stroke(C.emerald);

  txt('MÓDULO DEDICADO • /impressao-automatica', 48, p6Y + 12, { font: 'Bold', size: 7.5, color: C.emerald });
  txt('CENTRAL DE IMPRESSÃO AUTOMÁTICA', 48, p6Y + 24, { font: 'Bold', size: 11, color: C.white });

  doc.roundedRect(48, p6Y + 44, 269, 42, 6).fill('#064E3B');
  doc.circle(64, p6Y + 65, 6).fill('#34D399');
  txt('Ponte Windows Ativa (Motor Visual v5)', 78, p6Y + 53, { font: 'Bold', size: 8.8, color: C.white });
  txt('Impressora Padrão Conectada • Imprimindo 100% Automático', 78, p6Y + 66, { font: 'Regular', size: 7.2, color: '#A7F3D0' });

  txt('QUANTIDADE DE VIAS POR PEDIDO:', 48, p6Y + 96, { font: 'Bold', size: 7.5, color: '#D6D3D1' });
  doc.roundedRect(48, p6Y + 108, 130, 24, 6).fill('#292524');
  txt('1 Via (Só Cozinha)', 48, p6Y + 116, { font: 'Bold', size: 7.5, color: '#A8A29E', width: 130, align: 'center' });

  doc.roundedRect(187, p6Y + 108, 130, 24, 6).fill(C.yellow);
  txt('2 Vias (Cozinha + Motoboy)', 187, p6Y + 116, { font: 'Bold', size: 7.5, color: C.dark, width: 130, align: 'center' });

  doc.roundedRect(48, p6Y + 144, 269, 34, 6).fill(C.emerald);
  txt('BAIXAR INSTALADOR WINDOWS (.BAT)\n(Imprime Direto Sem Abrir Janela do Chrome)', 48, p6Y + 151, {
    font: 'Bold',
    size: 8,
    color: C.dark,
    width: 269,
    align: 'center',
  });

  doc.roundedRect(48, p6Y + 186, 130, 24, 5).fill('#292524');
  txt('Abrir Janela Compacta', 48, p6Y + 194, { font: 'Bold', size: 7.2, color: C.yellow, width: 130, align: 'center' });

  doc.roundedRect(187, p6Y + 186, 130, 24, 5).fill('#292524');
  txt('Testar Impressão Agora', 187, p6Y + 194, { font: 'Bold', size: 7.2, color: C.white, width: 130, align: 'center' });

  txt('Compatível com bobinas 80mm, 58mm e folha A4 via USB ou Rede.', 48, p6Y + 220, {
    font: 'Regular',
    size: 7,
    color: '#A8A29E',
  });

  // Lado Direito: Foto Real da Comanda Impressa (image_52cc3ee3.png)
  const receiptImg = path.join(process.cwd(), 'public', 'assets', 'aistudio', 'image_52cc3ee3.png');
  doc.roundedRect(345, p6Y, 215, 245, 10).fill(C.stone900);
  doc.roundedRect(345, p6Y, 215, 245, 10).lineWidth(1).stroke(C.stone300);
  if (fs.existsSync(receiptImg)) {
    try {
      doc.image(receiptImg, 355, p6Y + 10, { width: 195, height: 210, fit: [195, 210], align: 'center' });
    } catch {}
  }
  txt('Foto Real: Comanda Homologada Nickel Lanches', 345, p6Y + 226, {
    font: 'Bold',
    size: 7.2,
    color: C.yellow,
    width: 215,
    align: 'center',
  });

  drawPin(312, p6Y + 108, 1);
  drawPin(54, p6Y + 148, 2);
  drawPin(54, p6Y + 188, 3);
  drawPin(360, p6Y + 20, 4);

  curY = p6Y + 260;
  txt('Como Configurar e Usar a Impressora Térmica:', 35, curY, {
    font: 'Bold',
    size: 10.5,
    color: C.purple,
  });
  curY += 18;

  curY = drawLegendItem(
    1,
    'Escolha de 1 Via ou 2 Vias Automáticas:',
    'Você define com 1 clique se quer imprimir apenas 1 papel por pedido ou 2 vias seguidas (1ª Via resumida com letras grandes para a Chapa/Cozinha + 2ª Via completa com endereço e valores para o Motoboy).',
    curY
  );
  curY = drawLegendItem(
    2,
    'Aplicativo "Impressao-Automatica-Nickel.bat" (Impressão Silenciosa no Windows):',
    'Ao baixar e clicar duas vezes nesse arquivo no computador do caixa, ele conecta o site direto na sua impressora USB/Rede. Quando o pedido pago entra, o papel já sai na hora sem abrir tela de confirmação!',
    curY
  );
  curY = drawLegendItem(
    3,
    'Botão "Abrir Janela Compacta" & Aba "Impressora":',
    'Permite deixar uma janelinha lateral aberta monitorando a fila de impressão. Na aba "Impressora" do menu lateral você também pode ajustar o tamanho da letra, margens e escolher entre 80mm e 58mm.',
    curY
  );
  curY = drawLegendItem(
    4,
    'Comanda Completa Homologada:',
    'A comanda impressa traz Número do Pedido em destaque, Data/Hora, Nome, WhatsApp, Endereço completo, Itens com Adicionais, Taxa de Entrega, Total, Status do Pagamento e Código de Autenticação.',
    curY
  );

  // ===========================================================================
  // PÁGINA 7: GESTÃO DE PRODUTOS, PREÇOS E BOTÃO PAUSAR ITEM
  // ===========================================================================
  doc.addPage();
  drawPageHeader(
    'Capítulo 06 • Controle de Cardápio e Estoque',
    'Aba "Produtos": Editar Preços, Adicionais e Pausar Itens',
    'Como pausar um lanche esgotado em 1 segundo no meio da noite e alterar preços ou fotos.',
    7
  );

  const p7Y = 82;
  drawBrowserWindow(35, p7Y, 525, 248, 'nickellanches.com.br/painel-admin -> Aba Produtos');

  const prTop = p7Y + 28;
  doc.roundedRect(48, prTop, 499, 34, 6).fill(C.white);
  doc.roundedRect(48, prTop, 499, 34, 6).lineWidth(0.8).stroke(C.stone300);
  txt('GERENCIAR PRODUTOS DO CARDÁPIO (38 ITENS)', 58, prTop + 11, { font: 'Bold', size: 9.5, color: C.dark });

  doc.roundedRect(340, prTop + 7, 95, 20, 5).fill(C.stone100);
  txt('Buscar produto...', 348, prTop + 13, { font: 'Regular', size: 7.2, color: C.stone500 });

  doc.roundedRect(442, prTop + 7, 95, 20, 5).fill(C.yellow);
  txt('+ Novo Produto', 442, prTop + 13, { font: 'Bold', size: 7.2, color: C.dark, width: 95, align: 'center' });

  const adminProds = [
    {
      name: 'Xis Filé Mignon Prime',
      cat: 'Xis',
      price: 'R$ 38,00',
      paused: false,
      extras: '8 adicionais configurados',
    },
    {
      name: 'Xis Coração Tradicional',
      cat: 'Xis',
      price: 'R$ 33,00',
      paused: true,
      extras: '8 adicionais configurados',
    },
    {
      name: 'Combo Casal (2 Xis + Fritas)',
      cat: 'Combos',
      price: 'R$ 74,90',
      paused: false,
      extras: 'Escolhas do combo ativas',
    },
  ];

  adminProds.forEach((ap, idx) => {
    const py = prTop + 44 + idx * 54;
    doc.roundedRect(48, py, 499, 46, 6).fill(ap.paused ? '#FEF2F2' : C.white);
    doc.roundedRect(48, py, 499, 46, 6).lineWidth(1).stroke(ap.paused ? C.red : C.stone300);

    doc.roundedRect(56, py + 5, 36, 36, 5).fill(C.stone900);
    txt('XIS', 56, py + 18, { font: 'Bold', size: 8, color: C.yellow, width: 36, align: 'center' });

    txt(ap.name, 100, py + 8, { font: 'Bold', size: 9, color: C.dark });
    if (ap.paused) {
      doc.roundedRect(245, py + 6, 95, 13, 3).fill(C.red);
      txt('PAUSADO (ESGOTADO)', 245, py + 9, { font: 'Bold', size: 6, color: C.white, width: 95, align: 'center' });
    } else {
      doc.roundedRect(245, py + 6, 68, 13, 3).fill(C.emeraldLight);
      txt('ATIVO NO SITE', 245, py + 9, { font: 'Bold', size: 6, color: C.emeraldDark, width: 68, align: 'center' });
    }

    txt(`Categoria: ${ap.cat}  •  ${ap.extras}`, 100, py + 25, { font: 'Regular', size: 7.2, color: C.stone500 });
    txt(ap.price, 350, py + 17, { font: 'Bold', size: 10, color: C.emeraldDark });

    if (ap.paused) {
      doc.roundedRect(412, py + 11, 70, 24, 5).fill(C.emerald);
      txt('Ativar Item', 412, py + 19, { font: 'Bold', size: 7.2, color: C.white, width: 70, align: 'center' });
    } else {
      doc.roundedRect(412, py + 11, 70, 24, 5).fill(C.amberLight);
      doc.roundedRect(412, py + 11, 70, 24, 5).lineWidth(0.8).stroke(C.amber);
      txt('Pausar', 412, py + 19, { font: 'Bold', size: 7.2, color: '#92400E', width: 70, align: 'center' });
    }

    doc.roundedRect(487, py + 11, 25, 24, 5).fill(C.stone100);
    txt('Ed', 487, py + 19, { font: 'Bold', size: 7, color: C.dark, width: 25, align: 'center' });

    doc.roundedRect(516, py + 11, 25, 24, 5).fill(C.redLight);
    txt('Ex', 516, py + 19, { font: 'Bold', size: 7, color: C.red, width: 25, align: 'center' });
  });

  drawPin(535, prTop + 7, 1);
  drawPin(414, prTop + 55, 2);
  drawPin(414, prTop + 109, 3);
  drawPin(500, prTop + 53, 4);

  curY = p7Y + 262;
  txt('Passo a Passo para Gerenciar seu Cardápio:', 35, curY, {
    font: 'Bold',
    size: 10.5,
    color: C.purple,
  });
  curY += 18;

  curY = drawLegendItem(
    1,
    'Botão "+ Novo Produto":',
    'Permite cadastrar um novo lanche, bebida ou combo a qualquer momento, escolhendo nome, categoria, valor, foto e lista de adicionais.',
    curY
  );
  curY = drawLegendItem(
    2,
    'Botão "Pausar" (Quando Acabar um Ingrediente na Cozinha):',
    'Acabou o coração de frango ou a Coca-Cola 2L no sábado às 22h? Nunca apague o produto! Clique apenas em "Pausar". O item fica marcado como "Esgotado" no site na mesma hora e ninguém consegue pedir.',
    curY
  );
  curY = drawLegendItem(
    3,
    'Botão Verde "Ativar Item" (Quando Repor o Estoque):',
    'No dia seguinte, quando a mercadoria chegar, basta clicar em "Ativar Item" e o produto volta a ficar disponível para venda em 1 segundo!',
    curY
  );
  curY = drawLegendItem(
    4,
    'Botão Editar "Ed" (Mudar Preço, Descrição, Foto ou Adicionais):',
    'Clicando em Editar, você altera o preço do lanche, muda o valor dos adicionais (ex: bacon extra, ovo, cheddar) ou troca a foto do produto e clica em Salvar.',
    curY
  );

  // ===========================================================================
  // PÁGINA 8: HORÁRIOS DE FUNCIONAMENTO, CUPONS E BANNERS
  // ===========================================================================
  doc.addPage();
  drawPageHeader(
    'Capítulo 07 • Horários e Promoções',
    'Controle de Horários, Fechamento de Emergência e Cupons',
    'Como controlar a abertura automática da loja ou pausar as vendas em dias de chuva ou feriado.',
    8
  );

  const p8Y = 82;
  drawBrowserWindow(35, p8Y, 525, 220, 'nickellanches.com.br/painel-admin -> Aba Horários');

  const hTop = p8Y + 28;
  txt('MODO DE OPERAÇÃO DA LOJA (STATUS AGORA: LOJA ABERTA)', 48, hTop, { font: 'Bold', size: 9, color: C.dark });

  const modes = [
    {
      title: '1. Seguir Tabela (Automático)',
      desc: 'Abre e fecha sozinho nos horários de cada dia da semana.',
      bg: '#FEF9C3',
      border: C.yellowDark,
    },
    {
      title: '2. Sempre Aberto (Liberado)',
      desc: 'Força a loja a ficar aberta para pedidos mesmo fora de hora.',
      bg: C.white,
      border: C.stone300,
    },
    {
      title: '3. Fechar Loja Agora (Pausa)',
      desc: 'Trava novos pedidos imediatamente e avisa que está fechado.',
      bg: '#FEF2F2',
      border: C.red,
    },
  ];

  modes.forEach((m, i) => {
    const mx = 48 + i * 168;
    doc.roundedRect(mx, hTop + 15, 162, 52, 6).fill(m.bg);
    doc.roundedRect(mx, hTop + 15, 162, 52, 6).lineWidth(1.2).stroke(m.border);
    txt(m.title, mx + 8, hTop + 22, { font: 'Bold', size: 7.5, color: C.dark });
    txt(m.desc, mx + 8, hTop + 35, { font: 'Regular', size: 6.8, color: C.stone700, width: 146 });
  });

  const gTop = hTop + 76;
  doc.roundedRect(48, gTop, 499, 102, 6).fill(C.white);
  doc.roundedRect(48, gTop, 499, 102, 6).lineWidth(0.8).stroke(C.stone300);
  txt('TABELA DE HORÁRIOS POR DIA DA SEMANA (PASSO FUNDO / RS):', 58, gTop + 8, { font: 'Bold', size: 8, color: C.dark });

  const days = [
    { d: 'Segunda-feira', open: false, hours: 'Loja Fechada (Folga Semanal)' },
    { d: 'Terça a Quinta-feira', open: true, hours: 'Abre às [ 18:30 ]   até   Fecha às [ 23:30 ]' },
    { d: 'Sexta, Sábado e Domingo', open: true, hours: 'Abre às [ 18:30 ]   até   Fecha às [ 23:59 ]' },
  ];
  days.forEach((dy, idx) => {
    const dY = gTop + 26 + idx * 24;
    doc.roundedRect(58, dY, 28, 14, 7).fill(dy.open ? C.emerald : C.stone300);
    doc.circle(dy.open ? 79 : 65, dY + 7, 5).fill(C.white);
    txt(dy.d, 95, dY + 2, { font: 'Bold', size: 7.8, color: C.dark });
    txt(dy.hours, 260, dY + 2, { font: 'Bold', size: 7.8, color: dy.open ? C.emeraldDark : C.red });
  });

  drawPin(204, hTop + 17, 1);
  drawPin(540, hTop + 17, 2);
  drawPin(56, gTop + 56, 3);

  curY = p8Y + 232;
  txt('Controle de Horários, Cupons, Banners e Pagamentos:', 35, curY, {
    font: 'Bold',
    size: 10.5,
    color: C.purple,
  });
  curY += 18;

  curY = drawLegendItem(
    1,
    'Modo "Seguir Tabela de Horários" (Recomendado):',
    'Deixe marcado nesta opção para o site abrir sozinho às 18:30 e fechar sozinho no fim da noite, respeitando a folga de segunda-feira.',
    curY
  );
  curY = drawLegendItem(
    2,
    'Botão Vermelho "Fechar Loja Agora (Pausa de Emergência)":',
    'Faltou luz na rua ou a chapa lotou de pedidos? Clique em "Fechar Loja Agora". O site bloqueia novas compras na mesma hora.',
    curY
  );
  curY = drawLegendItem(
    3,
    'Chave Liga/Desliga por Dia e Edição de Horário:',
    'Vai abrir em uma segunda-feira de feriado ou estender o horário até 00:30? Basta ativar a chave verde do dia, mudar o relógio e clicar em "Salvar Horários".',
    curY
  );

  doc.roundedRect(35, curY + 6, 525, 108, 8).fill(C.stone100);
  doc.roundedRect(35, curY + 6, 525, 108, 8).lineWidth(1).stroke(C.stone300);

  txt('ABA CUPONS, ABA BANNERS E ABA PAGAMENTOS:', 48, curY + 15, {
    font: 'Bold',
    size: 9.2,
    color: C.purpleDark,
  });
  txt(
    '• ABA CUPONS: Digite o código do cupom (ex: PRIMEIRA10, NICKEL15), escolha a porcentagem de desconto (ex: 10%) e clique em Adicionar. Você pode apagar um cupom a qualquer momento clicando na lixeira.\n' +
    '• ABA BANNERS: Permite adicionar ou trocar os avisos e imagens de destaque exibidos no cardápio.\n' +
    '• ABA PAGAMENTOS: Já está 100% configurada e homologada com sua conta oficial da Stripe (PIX Automático e Cartão) e chave PIX da lanchonete. Não é necessário mexer nas chaves técnicas.',
    48,
    curY + 32,
    { font: 'Regular', size: 8.2, color: C.stone800, width: 500, lineGap: 3 }
  );

  // ===========================================================================
  // PÁGINA 9: CRM HISTÓRICO DE CLIENTES, VISITAS E SOLUÇÃO DE DÚVIDAS
  // ===========================================================================
  doc.addPage();
  drawPageHeader(
    'Capítulo 08 • Inteligência de Vendas e FAQ',
    'Histórico de Clientes (CRM), Visitas e Solução Rápida',
    'Como consultar os clientes que mais compram na Nickel Lanches e resolver dúvidas em 1 minuto.',
    9
  );

  const p9Y = 82;
  drawBrowserWindow(35, p9Y, 525, 190, 'nickellanches.com.br/painel-admin -> Aba Histórico Clientes');

  const crmTop = p9Y + 28;
  const crmStats = [
    { label: 'TOTAL DE CLIENTES', val: '142 clientes', color: C.purple },
    { label: 'PEDIDOS REGISTRADOS', val: '318 pedidos', color: C.blue },
    { label: 'FATURAMENTO ACUMULADO', val: 'R$ 16.420,00', color: C.emeraldDark },
    { label: 'TICKET MÉDIO POR PEDIDO', val: 'R$ 51,63', color: C.orangeDark },
  ];
  crmStats.forEach((st, i) => {
    const sx = 48 + i * 126;
    doc.roundedRect(sx, crmTop, 120, 40, 6).fill(C.white);
    doc.roundedRect(sx, crmTop, 120, 40, 6).lineWidth(0.8).stroke(C.stone300);
    txt(st.label, sx + 8, crmTop + 7, { font: 'Bold', size: 6.2, color: C.stone500 });
    txt(st.val, sx + 8, crmTop + 20, { font: 'Bold', size: 10, color: st.color });
  });

  const tTop = crmTop + 48;
  doc.roundedRect(48, tTop, 499, 102, 6).fill(C.white);
  doc.roundedRect(48, tTop, 499, 102, 6).lineWidth(0.8).stroke(C.stone300);
  doc.rect(48, tTop, 499, 19).fill(C.stone900);
  txt('CLIENTE / WHATSAPP', 58, tTop + 5, { font: 'Bold', size: 7, color: C.yellow });
  txt('BAIRRO', 220, tTop + 5, { font: 'Bold', size: 7, color: C.yellow });
  txt('PEDIDOS', 315, tTop + 5, { font: 'Bold', size: 7, color: C.yellow });
  txt('TOTAL GASTO', 385, tTop + 5, { font: 'Bold', size: 7, color: C.yellow });
  txt('AÇÃO RÁPIDA', 470, tTop + 5, { font: 'Bold', size: 7, color: C.yellow });

  const vips = [
    { name: 'Marcos Vinícius • (54) 99123-4455', b: 'Petrópolis', p: '12 pedidos', tot: 'R$ 684,00' },
    { name: 'Juliana Costa • (54) 99988-7766', b: 'Centro', p: '9 pedidos', tot: 'R$ 495,00' },
    { name: 'Rafael Almeida • (54) 98112-3344', b: 'Boqueirão', p: '7 pedidos', tot: 'R$ 378,00' },
  ];
  vips.forEach((v, idx) => {
    const vy = tTop + 25 + idx * 24;
    txt(v.name, 58, vy, { font: 'Bold', size: 7.5, color: C.dark });
    txt(v.b, 220, vy, { font: 'Regular', size: 7.5, color: C.stone700 });
    txt(v.p, 315, vy, { font: 'Bold', size: 7.5, color: C.purple });
    txt(v.tot, 385, vy, { font: 'Bold', size: 8, color: C.emeraldDark });
    doc.roundedRect(468, vy - 3, 68, 16, 4).fill(C.emerald);
    txt('WhatsApp', 468, vy + 1, { font: 'Bold', size: 6.8, color: C.white, width: 68, align: 'center' });
  });

  drawPin(538, tTop + 25, 1);
  drawPin(162, crmTop + 6, 2);

  curY = p9Y + 202;
  curY = drawLegendItem(
    1,
    'Aba "Histórico Clientes" & Botão WhatsApp Direto:',
    'Mostra o ranking dos seus melhores clientes, quantas vezes compraram, qual o lanche favorito de cada um e permite abrir o WhatsApp deles ou reimprimir qualquer pedido antigo com 1 clique.',
    curY
  );
  curY = drawLegendItem(
    2,
    'Aba "Visitas (Site)":',
    'Mostra o gráfico dos horários de pico em que os clientes mais abrem o cardápio da Nickel Lanches em Passo Fundo.',
    curY
  );

  curY += 6;
  txt('GUIA DE SOLUÇÃO RÁPIDA NO BALCÃO (SEM DEPENDER DE SUPORTE):', 35, curY, {
    font: 'Bold',
    size: 10,
    color: C.purple,
  });
  curY += 16;

  const faqs = [
    {
      q: '1. O pedido entrou na coluna "Pagos", mas não saiu som no computador:',
      a: 'O navegador Chrome bloqueia som se a página for aberta sem nenhum clique. Sempre que ligar o computador às 18:30, clique uma vez no botão amarelo "Testar Alerta" no topo do painel e verifique o volume da caixa de som.',
    },
    {
      q: '2. A impressora térmica não imprimiu a comanda:',
      a: 'Verifique se a tampa da bobina está bem fechada e se o cabo USB não desconectou. Para imprimir na hora, basta clicar no botão amarelo "IMP" dentro do cartão do pedido.',
    },
    {
      q: '3. O pedido do cliente está parado na coluna amarela "Aguardando Pagamento":',
      a: 'Isso significa que o cliente gerou o QR Code PIX mas ainda não concluiu o pagamento no banco. Se ele pagar no balcão ou enviar comprovante válido, clique no botão verde "Marcar como Pago" no cartão dele.',
    },
  ];

  faqs.forEach((f) => {
    doc.roundedRect(35, curY, 525, 42, 6).fill('#FFFBEB');
    doc.rect(35, curY, 4, 42).fill(C.orange);
    txt(f.q, 47, curY + 5, { font: 'Bold', size: 8.3, color: '#92400E' });
    txt(f.a, 47, curY + 18, { font: 'Regular', size: 7.8, color: C.stone800, width: 502, lineGap: 1.5 });
    curY += 47;
  });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`✅ PDF de 9 páginas gerado com sucesso em: ${outPath} (${fs.statSync(outPath).size} bytes)`);
      resolve();
    });
    stream.on('error', reject);
  });
}

generatePdf().catch((err) => {
  console.error('Erro na geração do PDF:', err);
  process.exit(1);
});
