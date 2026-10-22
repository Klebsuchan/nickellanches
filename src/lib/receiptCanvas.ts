import { Order, PrinterSettings, isOrderPaid } from './db';

/**
 * Cleans text for thermal receipt rendering while keeping Portuguese accents (Á, É, Í, Ó, Ú, Ã, Õ, Ç, etc.)
 */
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[•●▪▸►]/g, '+')
    .replace(/[⚠⚡]/g, '!')
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u2600-\u27BF]/g, '')
    .replace(/[\uFE00-\uFE0F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Word-wraps text to fit within maxWidth pixels using the current ctx.font
 */
function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const cleaned = cleanText(text);
  if (!cleaned) return [];

  const words = cleaned.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let word of words) {
    if (!word) continue;

    // If a single word is wider than maxWidth, break it character by character
    while (ctx.measureText(word).width > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
      }
      let fitLen = 1;
      while (fitLen < word.length && ctx.measureText(word.substring(0, fitLen + 1)).width <= maxWidth) {
        fitLen++;
      }
      lines.push(word.substring(0, fitLen));
      word = word.substring(fitLen);
    }

    if (!word) continue;

    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

/**
 * Draws a filled rounded rectangle on a 2D canvas context
 */
function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws a single comanda receipt onto a canvas (or measures height if dryRun = true)
 * Matches the exact visual preview design (black inverse banners, rounded badges, dashed boxes, bold lines).
 */
function drawSingleReceiptOnContext(
  ctx: CanvasRenderingContext2D,
  order: Order,
  settings: PrinterSettings,
  isKitchenOnly: boolean,
  viaTitle: string | undefined,
  canvasWidth: number,
  startY: number,
  dryRun: boolean
): number {
  const is58 = settings.printerType === 'thermal_58';
  const S = is58 ? 384 / 576 : 1;
  const fontScale =
    settings.fontSize === 'small' ? 0.9 : settings.fontSize === 'large' ? 1.12 : 1.0;
  const f = (px: number) => Math.round(px * S * fontScale);
  const s = (px: number) => Math.max(1, Math.round(px * S));

  const FONT_FAMILY = '"Consolas", "Courier New", "Lucida Console", monospace';
  const PAD = s(10);
  const CW = canvasWidth - PAD * 2;
  let y = startY + s(10);

  const setFont = (weight: number | string, sizePx: number) => {
    ctx.font = `${weight} ${sizePx}px ${FONT_FAMILY}`;
    ctx.textBaseline = 'top';
  };

  const drawSolidLine = (thickness: number, gapTop: number, gapBottom: number) => {
    y += gapTop;
    if (!dryRun) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(PAD, y, CW, thickness);
    }
    y += thickness + gapBottom;
  };

  const drawDottedLine = (gapTop: number, gapBottom: number) => {
    y += gapTop;
    const dotSize = s(3);
    const step = s(7);
    if (!dryRun) {
      ctx.fillStyle = '#000000';
      for (let dx = PAD; dx <= canvasWidth - PAD - dotSize; dx += step) {
        ctx.fillRect(dx, y, dotSize, dotSize);
      }
    }
    y += dotSize + gapBottom;
  };

  const drawDashedLine = (thickness: number, gapTop: number, gapBottom: number) => {
    y += gapTop;
    if (!dryRun) {
      ctx.save();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = thickness;
      ctx.setLineDash([s(10), s(7)]);
      ctx.beginPath();
      ctx.moveTo(PAD, y + thickness / 2);
      ctx.lineTo(canvasWidth - PAD, y + thickness / 2);
      ctx.stroke();
      ctx.restore();
    }
    y += thickness + gapBottom;
  };

  const drawCenteredLines = (
    text: string,
    weight: number | string,
    sizePx: number,
    lineHeightPx: number,
    color = '#000000'
  ) => {
    setFont(weight, sizePx);
    const lines = wrapCanvasText(ctx, text, CW);
    for (const ln of lines) {
      if (!dryRun) {
        ctx.fillStyle = color;
        const w = ctx.measureText(ln).width;
        ctx.fillText(ln, Math.round((canvasWidth - w) / 2), y);
      }
      y += lineHeightPx;
    }
  };

  // =========================================================================
  // 1. HEADER
  // =========================================================================
  const headerTitle = (settings.printHeader || 'NICKEL LANCHES').toUpperCase();
  drawCenteredLines(headerTitle, 900, f(33), f(38));

  if (settings.printSubHeader) {
    drawCenteredLines(settings.printSubHeader.toUpperCase(), 800, f(19), f(24));
  }
  if (settings.printPhone) {
    y += s(2);
    drawCenteredLines(`Tel/WhatsApp: ${settings.printPhone}`, 700, f(18), f(23));
  }
  if (settings.printAddress) {
    y += s(2);
    drawCenteredLines(settings.printAddress, 600, f(15), f(20));
  }

  if (viaTitle) {
    y += s(6);
    setFont(900, f(18));
    const vText = cleanText(viaTitle.toUpperCase());
    const vWidth = Math.min(CW, ctx.measureText(vText).width + s(24));
    const vHeight = f(28);
    if (!dryRun) {
      ctx.fillStyle = '#000000';
      fillRoundRect(ctx, Math.round((canvasWidth - vWidth) / 2), y, vWidth, vHeight, s(4));
      ctx.fillStyle = '#ffffff';
      const tw = ctx.measureText(vText).width;
      ctx.fillText(vText, Math.round((canvasWidth - tw) / 2), y + Math.round((vHeight - f(18)) / 2));
    }
    y += vHeight + s(4);
  }

  drawSolidLine(s(4), s(10), s(10));

  // =========================================================================
  // 2. ORDER NUMBER BLACK BANNER & DATE/TIME
  // =========================================================================
  const orderNum =
    order.orderNumber || (order.id ? order.id.substring(0, 4).toUpperCase() : '1');
  const passStr =
    settings.showPassword && order.id ? order.id.substring(0, 4).toUpperCase() : '';

  if (settings.showOrderNumber) {
    const orderFontPx = f(42);
    const passFontPx = f(19);
    const boxPadY = s(14);
    const boxHeight =
      boxPadY * 2 + orderFontPx + (passStr ? passFontPx + s(8) : 0);

    if (!dryRun) {
      ctx.fillStyle = '#000000';
      fillRoundRect(ctx, PAD, y, CW, boxHeight, s(6));

      ctx.fillStyle = '#ffffff';
      setFont(900, orderFontPx);
      const oLabel = `PEDIDO #${orderNum}`;
      const ow = ctx.measureText(oLabel).width;
      ctx.fillText(oLabel, Math.round((canvasWidth - ow) / 2), y + boxPadY);

      if (passStr) {
        setFont(900, passFontPx);
        const pLabel = `SENHA: ${passStr}`;
        const pw = ctx.measureText(pLabel).width;
        ctx.fillText(
          pLabel,
          Math.round((canvasWidth - pw) / 2),
          y + boxPadY + orderFontPx + s(8)
        );
      }
    }
    y += boxHeight + s(10);
  }

  const orderTimeStr = (() => {
    if (order.createdAt?.toDate) {
      const d = order.createdAt.toDate();
      return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
    if (typeof order.createdAt === 'string') return order.createdAt;
    const now = new Date();
    return `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  })();

  drawCenteredLines(`Data/Hora: ${orderTimeStr}`, 700, f(18), f(23));
  drawDottedLine(s(8), s(10));

  // =========================================================================
  // 3. CUSTOMER DETAILS & DELIVERY ADDRESS BOX
  // =========================================================================
  const customerName = cleanText(order.userName || 'Balcão / Cliente').toUpperCase();
  setFont(900, f(21));
  const clientLines = wrapCanvasText(ctx, `Cliente: ${customerName}`, CW);
  for (const cl of clientLines) {
    if (!dryRun) {
      ctx.fillStyle = '#000000';
      ctx.fillText(cl, PAD, y);
    }
    y += f(26);
  }

  if (settings.showCustomerPhone && order.whatsapp) {
    y += s(2);
    setFont(700, f(18));
    const wLines = wrapCanvasText(ctx, `WhatsApp: ${order.whatsapp}`, CW);
    for (const wl of wLines) {
      if (!dryRun) {
        ctx.fillStyle = '#000000';
        ctx.fillText(wl, PAD, y);
      }
      y += f(23);
    }
  }

  if (settings.showDeliveryAddress) {
    y += s(8);
    const hasRegion =
      order.region &&
      order.address &&
      order.address.toLowerCase().includes(order.region.toLowerCase());
    const fullAddr = `${order.address || 'Retirada no Balcão'}${
      order.region && !hasRegion ? ` (${order.region})` : ''
    }`;

    const innerPad = s(10);
    const innerW = CW - innerPad * 2;
    const labelFont = f(15);
    const addrFont = f(19);
    const addrLineH = f(24);

    setFont(700, addrFont);
    const addrLines = wrapCanvasText(ctx, fullAddr, innerW);
    const addrBoxH =
      innerPad * 2 + labelFont + s(6) + addrLines.length * addrLineH;

    if (!dryRun) {
      ctx.save();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = s(3);
      ctx.setLineDash([s(10), s(6)]);
      ctx.strokeRect(PAD + s(1), y, CW - s(2), addrBoxH);
      ctx.restore();

      ctx.fillStyle = '#000000';
      setFont(900, labelFont);
      ctx.fillText('ENDEREÇO DE ENTREGA:', PAD + innerPad, y + innerPad);

      setFont(700, addrFont);
      let ay = y + innerPad + labelFont + s(6);
      for (const al of addrLines) {
        ctx.fillText(al, PAD + innerPad, ay);
        ay += addrLineH;
      }
    }
    y += addrBoxH + s(4);
  }

  if (order.receiptNotes && order.receiptNotes.trim()) {
    y += s(8);
    const notesText = `Obs. Entrega: ${cleanText(order.receiptNotes)}`;
    const innerPadY = s(8);
    const leftBarW = s(6);
    const innerLeft = PAD + leftBarW + s(10);
    const innerW = CW - leftBarW - s(16);
    const notesFont = f(17);
    const notesLineH = f(22);

    setFont(700, notesFont);
    const nLines = wrapCanvasText(ctx, notesText, innerW);
    const nBoxH = innerPadY * 2 + nLines.length * notesLineH;

    if (!dryRun) {
      ctx.fillStyle = '#000000';
      // Top & bottom thin border
      ctx.fillRect(PAD, y, CW, s(1.5));
      ctx.fillRect(PAD, y + nBoxH - s(1.5), CW, s(1.5));
      // Thick left bar
      ctx.fillRect(PAD, y, leftBarW, nBoxH);

      let ny = y + innerPadY;
      for (const nl of nLines) {
        ctx.fillText(nl, innerLeft, ny);
        ny += notesLineH;
      }
    }
    y += nBoxH + s(4);
  }

  drawSolidLine(s(4), s(10), s(10));

  // =========================================================================
  // 4. ITEMS SECTION BANNER ("ITENS DO PEDIDO")
  // =========================================================================
  const itemsBannerH = f(38);
  const itemsBannerTitle = isKitchenOnly ? 'PREPARO DA COZINHA' : 'ITENS DO PEDIDO';
  if (!dryRun) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(PAD, y, CW, itemsBannerH);
    ctx.fillStyle = '#ffffff';
    setFont(900, f(20));
    const tw = ctx.measureText(itemsBannerTitle).width;
    ctx.fillText(
      itemsBannerTitle,
      Math.round((canvasWidth - tw) / 2),
      y + Math.round((itemsBannerH - f(20)) / 2)
    );
  }
  y += itemsBannerH + s(14);

  // =========================================================================
  // 5. ORDER ITEMS LIST
  // =========================================================================
  const items = order.items || [];
  let subtotalCalc = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const extrasTotal =
      item.extras?.reduce((sum: number, e: any) => sum + (Number(e.price) || 0), 0) || 0;
    const itemTotal = (Number(item.price) + extrasTotal) * Number(item.quantity);
    subtotalCalc += itemTotal;

    const qtyStr = `${item.quantity}x`;
    const priceStr = !isKitchenOnly ? `R$ ${itemTotal.toFixed(2).replace('.', ',')}` : '';
    const itemName = cleanText(item.name || 'Item').toUpperCase();

    // Measure Price
    setFont(900, f(22));
    const priceW = priceStr ? ctx.measureText(priceStr).width + s(12) : 0;

    // Measure Badge
    const badgeFont = f(20);
    setFont(900, badgeFont);
    const badgeTextW = ctx.measureText(qtyStr).width;
    const badgeW = badgeTextW + s(20);
    const badgeH = f(32);

    // Wrap Item Name: Line 1 fits between badge and price; Line 2+ starts at PAD and fits up to CW - priceW (or full CW)
    const nameFont = f(23);
    const nameLineH = f(28);
    setFont(900, nameFont);

    const firstLineMaxW = Math.max(s(80), CW - badgeW - s(10) - priceW);
    const words = itemName.split(' ').filter(Boolean);
    const nameLines: { text: string; x: number }[] = [];
    let currentLine = '';
    let isFirstLine = true;

    for (const word of words) {
      const availW = isFirstLine ? firstLineMaxW : CW - s(8);
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(test).width <= availW) {
        currentLine = test;
      } else {
        if (currentLine) {
          nameLines.push({
            text: currentLine,
            x: isFirstLine ? PAD + badgeW + s(10) : PAD,
          });
          isFirstLine = false;
          currentLine = word;
        } else {
          // Single word longer than firstLineMaxW
          if (isFirstLine) {
            nameLines.push({
              text: word,
              x: PAD + badgeW + s(10),
            });
            isFirstLine = false;
            currentLine = '';
          } else {
            nameLines.push({ text: word, x: PAD });
            currentLine = '';
          }
        }
      }
    }
    if (currentLine) {
      nameLines.push({
        text: currentLine,
        x: isFirstLine ? PAD + badgeW + s(10) : PAD,
      });
    }

    // Draw Badge, Price, and Item Name Lines
    if (!dryRun) {
      // Quantity badge
      ctx.fillStyle = '#000000';
      fillRoundRect(ctx, PAD, y, badgeW, badgeH, s(6));
      ctx.fillStyle = '#ffffff';
      setFont(900, badgeFont);
      ctx.fillText(
        qtyStr,
        PAD + Math.round((badgeW - badgeTextW) / 2),
        y + Math.round((badgeH - badgeFont) / 2)
      );

      // Right-aligned Price
      if (priceStr) {
        ctx.fillStyle = '#000000';
        setFont(900, f(22));
        const pw = ctx.measureText(priceStr).width;
        ctx.fillText(priceStr, canvasWidth - PAD - pw, y + s(4));
      }

      // Item Name lines
      ctx.fillStyle = '#000000';
      setFont(900, nameFont);
      let ny = y + s(3);
      for (let lnIdx = 0; lnIdx < nameLines.length; lnIdx++) {
        ctx.fillText(nameLines[lnIdx].text, nameLines[lnIdx].x, ny);
        ny += lnIdx === 0 ? Math.max(nameLineH, badgeH + s(2)) : nameLineH;
      }
    }

    if (nameLines.length <= 1) {
      y += Math.max(badgeH, nameLineH) + s(4);
    } else {
      y += Math.max(nameLineH, badgeH + s(2)) + (nameLines.length - 1) * nameLineH + s(4);
    }

    // Extras ("ADICIONAIS:")
    if (item.extras && item.extras.length > 0) {
      y += s(6);
      const extrasStartY = y;
      const barX = PAD + s(6);
      const barW = s(5);
      const exLeftX = barX + barW + s(10);
      const exHeaderFont = f(16);
      const exRowFont = f(17);
      const exRowLineH = f(23);

      if (!dryRun) {
        ctx.fillStyle = '#000000';
        setFont(900, exHeaderFont);
        ctx.fillText('ADICIONAIS:', exLeftX, y);
      }
      y += exHeaderFont + s(6);

      for (const ex of item.extras) {
        const exName = `+ ${cleanText(ex.name || '')}`;
        const exPrice = !isKitchenOnly
          ? Number(ex.price) > 0
            ? `+R$ ${Number(ex.price).toFixed(2).replace('.', ',')}`
            : 'Incluso'
          : '';

        setFont(800, exRowFont);
        const exPriceW = exPrice ? ctx.measureText(exPrice).width + s(10) : 0;
        const exNameMaxW = canvasWidth - PAD - exLeftX - exPriceW;
        const exWrapped = wrapCanvasText(ctx, exName, exNameMaxW);

        if (!dryRun) {
          ctx.fillStyle = '#000000';
          setFont(800, exRowFont);
          if (exPrice) {
            const epw = ctx.measureText(exPrice).width;
            ctx.fillText(exPrice, canvasWidth - PAD - epw, y);
          }
          let ey = y;
          for (const eln of exWrapped) {
            ctx.fillText(eln, exLeftX, ey);
            ey += exRowLineH;
          }
        }
        y += exWrapped.length * exRowLineH + s(2);
      }

      const extrasTotalH = y - extrasStartY;
      if (!dryRun) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(barX, extrasStartY, barW, extrasTotalH);
      }
    }

    // Item Observation (">> OBS:")
    if (
      settings.showItemObservations &&
      item.observation &&
      item.observation.trim()
    ) {
      y += s(8);
      const obsText = `>> OBS: ${cleanText(item.observation.trim()).toUpperCase()}`;
      const obsPadY = s(9);
      const obsLeftBar = s(6);
      const obsInnerX = PAD + obsLeftBar + s(10);
      const obsInnerW = CW - obsLeftBar - s(20);
      const obsFont = f(17);
      const obsLineH = f(22);

      setFont(900, obsFont);
      const obsLines = wrapCanvasText(ctx, obsText, obsInnerW);
      const obsBoxH = obsPadY * 2 + obsLines.length * obsLineH;

      if (!dryRun) {
        ctx.save();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = s(3);
        ctx.setLineDash([s(10), s(6)]);
        ctx.strokeRect(PAD + s(1), y, CW - s(2), obsBoxH);
        ctx.restore();

        // Thick left bar
        ctx.fillStyle = '#000000';
        ctx.fillRect(PAD, y, obsLeftBar, obsBoxH);

        setFont(900, obsFont);
        let oy = y + obsPadY;
        for (const ol of obsLines) {
          ctx.fillText(ol, obsInnerX, oy);
          oy += obsLineH;
        }
      }
      y += obsBoxH + s(4);
    }

    drawSolidLine(s(3.5), s(10), s(12));
  }

  // =========================================================================
  // 6. FINANCIALS & PAYMENT STATUS
  // =========================================================================
  if (!isKitchenOnly) {
    const fee = Number(order.deliveryFee) || 0;
    const total = Number(order.totalPrice) || 0;
    const subtotal = subtotalCalc > 0 ? subtotalCalc : total - fee;
    const discount = Math.max(0, subtotal + fee - total);

    drawSolidLine(s(3.5), s(2), s(8));

    const drawKeyValRow = (
      leftLabel: string,
      rightVal: string,
      weight: number | string,
      leftPx: number,
      rightPx: number,
      rowH: number
    ) => {
      if (!dryRun) {
        ctx.fillStyle = '#000000';
        setFont(weight, leftPx);
        ctx.fillText(leftLabel, PAD, y + Math.round((rowH - leftPx) / 2));
        setFont(weight, rightPx);
        const rw = ctx.measureText(rightVal).width;
        ctx.fillText(rightVal, canvasWidth - PAD - rw, y + Math.round((rowH - rightPx) / 2));
      }
      y += rowH;
    };

    if (fee > 0 || discount > 0.01) {
      drawKeyValRow(
        'Subtotal Itens:',
        `R$ ${subtotal.toFixed(2).replace('.', ',')}`,
        700,
        f(18),
        f(18),
        f(25)
      );
    }
    if (discount > 0.01) {
      drawKeyValRow(
        'Desconto:',
        `-R$ ${discount.toFixed(2).replace('.', ',')}`,
        800,
        f(18),
        f(18),
        f(25)
      );
    }
    if (fee > 0) {
      drawKeyValRow(
        'Taxa de Entrega:',
        `R$ ${fee.toFixed(2).replace('.', ',')}`,
        700,
        f(18),
        f(18),
        f(25)
      );
    }

    drawSolidLine(s(4), s(6), s(8));
    drawKeyValRow(
      'TOTAL DO PEDIDO:',
      `R$ ${total.toFixed(2).replace('.', ',')}`,
      900,
      f(22),
      f(26),
      f(30)
    );
    drawSolidLine(s(4), s(8), s(10));

    if (settings.showPaymentDetails) {
      const paid = isOrderPaid(order);
      const statusBannerText = paid
        ? '>>> PEDIDO PAGO E CONFIRMADO <<<'
        : '>>> AGUARDANDO PAGAMENTO <<<';
      const statusBannerH = f(36);

      if (!dryRun) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(PAD, y, CW, statusBannerH);
        ctx.fillStyle = '#ffffff';
        setFont(900, f(17));
        const stw = ctx.measureText(statusBannerText).width;
        ctx.fillText(
          statusBannerText,
          Math.round((canvasWidth - stw) / 2),
          y + Math.round((statusBannerH - f(17)) / 2)
        );
      }
      y += statusBannerH + s(8);

      const cleanPayment = cleanText(order.paymentMethod || 'A Confirmar').toUpperCase();
      setFont(800, f(18));
      const payLines = wrapCanvasText(ctx, `Pagamento: ${cleanPayment}`, CW);
      for (const pl of payLines) {
        if (!dryRun) {
          ctx.fillStyle = '#000000';
          ctx.fillText(pl, PAD, y);
        }
        y += f(24);
      }

      const stLine = `Status: ${paid ? 'PAGO' : 'AGUARDANDO PAGAMENTO'}`;
      if (!dryRun) {
        ctx.fillStyle = '#000000';
        setFont(800, f(18));
        ctx.fillText(stLine, PAD, y);
      }
      y += f(24);

      if (order.changeFor) {
        if (!dryRun) {
          ctx.fillStyle = '#000000';
          setFont(900, f(18));
          ctx.fillText(`Troco para: R$ ${order.changeFor}`, PAD, y);
        }
        y += f(24);
      }

      if (order.receiptAuthCode) {
        y += s(6);
        const authPad = s(8);
        const authFont = f(15);
        const authLineH = f(20);
        setFont(700, authFont);
        const aLines = wrapCanvasText(
          ctx,
          `Autenticação: ${order.receiptAuthCode}`,
          CW - authPad * 2
        );
        if (order.receiptTimestamp) {
          aLines.push(`Horário: ${order.receiptTimestamp}`);
        }
        const authBoxH = authPad * 2 + aLines.length * authLineH;

        if (!dryRun) {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = s(2);
          ctx.strokeRect(PAD + s(1), y, CW - s(2), authBoxH);
          ctx.fillStyle = '#000000';
          setFont(700, authFont);
          let ay = y + authPad;
          for (const al of aLines) {
            ctx.fillText(al, PAD + authPad, ay);
            ay += authLineH;
          }
        }
        y += authBoxH + s(6);
      }
    }
  }

  // =========================================================================
  // 7. FOOTER
  // =========================================================================
  drawDashedLine(s(3.5), s(10), s(10));

  if (settings.printFooter) {
    drawCenteredLines(settings.printFooter.toUpperCase(), 800, f(17), f(22));
    y += s(4);
  }
  drawCenteredLines('*** ATÉ A PRÓXIMA! ***', 900, f(17), f(22));

  // Bottom feed padding for guillotine cutter
  const feedPx = Math.max(1, settings.feedLines || 3) * s(18);
  y += feedPx;

  return y;
}

/**
 * Applies strict 1-bit monochrome thresholding so thermal printers never print fuzzy gray anti-aliasing dots.
 */
function applyMonochromeThreshold(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    } else {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const val = lum < 185 ? 0 : 255;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

/**
 * Renders a single comanda receipt to an HTMLCanvasElement (576px for 80mm, 384px for 58mm)
 */
export function renderReceiptToCanvas(
  order: Order,
  settings: PrinterSettings,
  isKitchenOnly = false,
  viaTitle?: string
): HTMLCanvasElement {
  const is58 = settings.printerType === 'thermal_58';
  const width = is58 ? 384 : 576;

  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = width;
  measureCanvas.height = 100;
  const measureCtx = measureCanvas.getContext('2d')!;

  const totalHeight = Math.ceil(
    drawSingleReceiptOnContext(
      measureCtx,
      order,
      settings,
      isKitchenOnly,
      viaTitle,
      width,
      0,
      true
    )
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.max(100, totalHeight);
  const ctx = canvas.getContext('2d')!;

  // Pure white paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawSingleReceiptOnContext(
    ctx,
    order,
    settings,
    isKitchenOnly,
    viaTitle,
    width,
    0,
    false
  );

  applyMonochromeThreshold(ctx, canvas.width, canvas.height);
  return canvas;
}

/**
 * Renders the full order (1 or 2 copies depending on settings.printCopies) into a crisp 1-bit PNG Data URL & Base64
 */
export function renderFullOrderToImage(
  order: Order,
  settings: PrinterSettings
): {
  dataUrl: string;
  base64: string;
  viasBase64: string[];
  width: number;
  height: number;
} {
  if (settings.printCopies === 2) {
    const c1 = renderReceiptToCanvas(order, settings, true, 'VIA 1 - COZINHA / PREPARO');
    const c2 = renderReceiptToCanvas(order, settings, false, 'VIA 2 - ENTREGA / CLIENTE');

    const sepH = 36;
    const combined = document.createElement('canvas');
    combined.width = c1.width;
    combined.height = c1.height + sepH + c2.height;
    const ctx = combined.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, combined.width, combined.height);
    ctx.drawImage(c1, 0, 0);

    // Draw cut separator line between Via 1 and Via 2
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(10, c1.height + sepH / 2);
    ctx.lineTo(combined.width - 10, c1.height + sepH / 2);
    ctx.stroke();
    ctx.restore();

    ctx.drawImage(c2, 0, c1.height + sepH);

    const dataUrl = combined.toDataURL('image/png');
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    const b1 = c1.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
    const b2 = c2.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');

    return {
      dataUrl,
      base64,
      viasBase64: [b1, b2],
      width: combined.width,
      height: combined.height,
    };
  }

  const singleCanvas = renderReceiptToCanvas(order, settings, false);
  const dataUrl = singleCanvas.toDataURL('image/png');
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');

  return {
    dataUrl,
    base64,
    viasBase64: [base64],
    width: singleCanvas.width,
    height: singleCanvas.height,
  };
}

/**
 * Converts a 1-bit thresholded HTMLCanvasElement into standard ESC/POS Raster Bit Image commands (GS v 0)
 * Sliced into 120-row bands so any USB thermal printer prints the exact visual receipt without buffer overflow.
 */
export function canvasToEscPosRaster(
  canvas: HTMLCanvasElement,
  cutPaper = true,
  beepOnPrint = false
): Uint8Array {
  const width = canvas.width;
  const height = canvas.height;
  const widthBytes = Math.ceil(width / 8);
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.getImageData(0, 0, width, height).data;

  const chunks: number[] = [];

  // Initialize printer (ESC @) and center align (ESC a 1)
  chunks.push(0x1b, 0x40);
  chunks.push(0x1b, 0x61, 0x01);

  if (beepOnPrint) {
    chunks.push(0x1b, 0x42, 0x02, 0x02);
  }

  const SLICE_HEIGHT = 120;
  for (let yStart = 0; yStart < height; yStart += SLICE_HEIGHT) {
    const sliceH = Math.min(SLICE_HEIGHT, height - yStart);
    const xL = widthBytes & 0xff;
    const xH = (widthBytes >> 8) & 0xff;
    const yL = sliceH & 0xff;
    const yH = (sliceH >> 8) & 0xff;

    // GS v 0 m xL xH yL yH (m = 0 normal)
    chunks.push(0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH);

    for (let y = yStart; y < yStart + sliceH; y++) {
      for (let bx = 0; bx < widthBytes; bx++) {
        let byteVal = 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = bx * 8 + bit;
          if (x < width) {
            const idx = (y * width + x) * 4;
            // Pixel is black if red channel < 128
            if (imgData[idx] < 128) {
              byteVal |= 1 << (7 - bit);
            }
          }
        }
        chunks.push(byteVal);
      }
    }
  }

  // Feed 3 lines and partial cut (GS V 66 0)
  chunks.push(0x1b, 0x64, 0x03);
  if (cutPaper) {
    chunks.push(0x1d, 0x56, 0x42, 0x00);
  }

  return new Uint8Array(chunks);
}
