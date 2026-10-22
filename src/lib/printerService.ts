// ======================================================================
// Thermal Receipt Printing Service for USB & Spooler Printers (POS-80 / POS-58)
// ======================================================================

import { Order, PrinterSettings, getCloudBridgeStatus, enqueueCloudPrintJob, isOrderPaid } from './db';
import { getConnectedUsbPrinter, checkAndAutoReconnectUsbPrinter, sendRawToUsbPrinter, buildReceiptEscPos } from './escpos';

const RECEIPT_MAX_COLS = 32;
const RECEIPT_LEFT_PAD = ' ';

/**
 * Strips emojis and unsupported symbols that print as [] boxes on thermal printers,
 * while preserving standard Portuguese characters and punctuation.
 */
export function sanitizeForThermal(text: string): string {
  if (!text) return '';
  return text
    .replace(/[•●▪▸►]/g, '+')
    .replace(/[⚠⚡]/g, '!')
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u2600-\u27BF]/g, '')
    .replace(/[\uFE00-\uFE0F]/g, '')
    .replace(/[^\x20-\x7E\xA0-\xFF\n\r]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Word-wraps any text so no line ever exceeds maxCols (default 32 columns).
 */
export function wrapReceiptLines(
  rawText: string,
  maxCols: number = RECEIPT_MAX_COLS,
  continuationIndent: string = ''
): string[] {
  const clean = sanitizeForThermal(rawText);
  if (!clean) return [];
  if (clean.length <= maxCols) return [clean];

  const words = clean.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let word of words) {
    if (!word) continue;
    const prefix = lines.length === 0 ? '' : continuationIndent;

    while (word.length > maxCols - prefix.length) {
      const sliceLen = maxCols - (currentLine ? currentLine.length + 1 : prefix.length);
      if (sliceLen > 4) {
        currentLine = currentLine
          ? `${currentLine} ${word.substring(0, sliceLen)}`
          : `${prefix}${word.substring(0, sliceLen)}`;
        lines.push(currentLine);
        currentLine = '';
        word = word.substring(sliceLen);
      } else {
        if (currentLine) {
          lines.push(currentLine.replace(/\s+-\s*$/, ''));
          currentLine = '';
        }
        const pfx = lines.length === 0 ? '' : continuationIndent;
        const chunkLen = maxCols - pfx.length;
        lines.push(`${pfx}${word.substring(0, chunkLen)}`);
        word = word.substring(chunkLen);
      }
    }

    if (!word) continue;

    if (!currentLine) {
      if (lines.length > 0 && (word === '-' || word === '–')) {
        continue;
      }
      currentLine = `${prefix}${word}`;
    } else if (currentLine.length + 1 + word.length <= maxCols) {
      currentLine = `${currentLine} ${word}`;
    } else {
      lines.push(currentLine.replace(/\s+-\s*$/, ''));
      if (word === '-' || word === '–') {
        currentLine = '';
      } else {
        currentLine = `${continuationIndent}${word}`;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine.replace(/\s+-\s*$/, ''));
  }

  return lines;
}

/**
 * Wraps and centers text within maxCols (default 32 columns).
 */
export function centerReceiptLines(rawText: string, maxCols: number = RECEIPT_MAX_COLS): string[] {
  const wrapped = wrapReceiptLines(rawText, maxCols, '');
  return wrapped.map(line => {
    const trimmed = line.trim();
    if (trimmed.length >= maxCols) return trimmed.substring(0, maxCols);
    const leftSpaces = Math.floor((maxCols - trimmed.length) / 2);
    return ' '.repeat(leftSpaces) + trimmed;
  });
}

/**
 * Formats a label on the left and a value on the right connected by leader dots within maxCols.
 * If the label is too long to fit on the same line, wraps the label first and aligns the value on the next line.
 */
export function formatDotRow(left: string, right: string, maxCols: number = RECEIPT_MAX_COLS): string[] {
  const cleanLeft = sanitizeForThermal(left);
  const cleanRight = sanitizeForThermal(right);
  if (!cleanRight) {
    return wrapReceiptLines(cleanLeft, maxCols, '  ');
  }
  if (cleanLeft.length + 2 + cleanRight.length <= maxCols) {
    const dotsCount = maxCols - cleanLeft.length - cleanRight.length - 2;
    const middle = dotsCount >= 1
      ? ` ${'.'.repeat(dotsCount)} `
      : ' '.repeat(maxCols - cleanLeft.length - cleanRight.length);
    return [`${cleanLeft}${middle}${cleanRight}`];
  }
  const wrappedLeft = wrapReceiptLines(cleanLeft, maxCols, '  ');
  const valLabel = '   Subtotal:';
  const dotsCount = Math.max(1, maxCols - valLabel.length - cleanRight.length - 2);
  wrappedLeft.push(`${valLabel} ${'.'.repeat(dotsCount)} ${cleanRight}`);
  return wrappedLeft;
}

/**
 * Generates a standardized, 32-column word-wrapped comanda that never cuts off on any 80mm or 58mm printer.
 */
export function generateReceiptText(
  order: Order,
  settings: PrinterSettings,
  isKitchenOnly = false,
  viaTitle?: string
): string {
  const MAX_COLS = RECEIPT_MAX_COLS;
  const PAD = RECEIPT_LEFT_PAD;
  const line = '-'.repeat(MAX_COLS);
  const dline = '='.repeat(MAX_COLS);
  const rawLines: string[] = [];

  const pushRaw = (s: string) => rawLines.push(`${PAD}${s.substring(0, MAX_COLS)}`);
  const pushWrapped = (s: string, indent = '  ') => {
    wrapReceiptLines(s, MAX_COLS, indent).forEach(l => pushRaw(l));
  };
  const pushCentered = (s: string) => {
    centerReceiptLines(s, MAX_COLS).forEach(l => pushRaw(l));
  };
  const pushDotRow = (left: string, right: string) => {
    formatDotRow(left, right, MAX_COLS).forEach(l => pushRaw(l));
  };

  // CABEÇALHO CENTRALIZADO
  pushRaw(dline);
  pushCentered((settings.printHeader || 'NICKEL LANCHES').toUpperCase());
  if (settings.printSubHeader) {
    pushCentered(settings.printSubHeader.toUpperCase());
  }
  if (settings.printPhone) {
    pushCentered(`Tel/WhatsApp: ${settings.printPhone}`);
  }
  if (settings.printAddress) {
    pushCentered(settings.printAddress);
  }
  if (viaTitle) {
    pushRaw(line);
    pushCentered(`[ ${viaTitle.toUpperCase()} ]`);
  }
  pushRaw(dline);

  // IDENTIFICAÇÃO DO PEDIDO (ALTO DESTAQUE)
  const orderNum = order.orderNumber || (order.id ? order.id.substring(0, 4).toUpperCase() : '1');
  const passStr = settings.showPassword && order.id ? order.id.substring(0, 4).toUpperCase() : '';
  pushRaw(dline);
  pushCentered(`*** PEDIDO #${orderNum} ***`);
  if (passStr) {
    pushCentered(`SENHA: ${passStr}`);
  }
  pushRaw(dline);

  let dateStr = '';
  if (order.createdAt?.toDate) {
    const d = order.createdAt.toDate();
    dateStr = `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (typeof order.createdAt === 'string') {
    dateStr = order.createdAt;
  } else {
    const now = new Date();
    dateStr = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  pushWrapped(`Data/Hora: ${dateStr}`, '  ');

  // DADOS DO CLIENTE E ENTREGA
  pushRaw(line);
  pushWrapped(`Cliente: ${(order.userName || 'Balcao / Cliente').toUpperCase()}`, '  ');
  if (settings.showCustomerPhone && order.whatsapp) {
    pushWrapped(`WhatsApp: ${order.whatsapp}`, '  ');
  }
  if (settings.showDeliveryAddress) {
    const hasRegion = order.region && order.address && order.address.toLowerCase().includes(order.region.toLowerCase());
    const fullAddr = order.address
      ? `${order.address}${order.region && !hasRegion ? ` (${order.region})` : ''}`
      : 'Retirada no Balcao';
    pushWrapped(`Entrega: ${fullAddr}`, '  ');
  }
  if (order.receiptNotes && order.receiptNotes.trim()) {
    pushWrapped(`Obs. Entrega: ${order.receiptNotes.trim()}`, '  ');
  }

  // ITENS DO PEDIDO (DESTAQUE E NEGRITO)
  pushRaw(dline);
  pushCentered(isKitchenOnly ? 'PREPARO DA COZINHA' : 'ITENS DO PEDIDO');
  pushRaw(dline);

  let subtotal = 0;
  if (order.items && order.items.length > 0) {
    order.items.forEach((item, idx) => {
      const extrasTotal = item.extras?.reduce((s: number, e: any) => s + (Number(e.price) || 0), 0) || 0;
      const itemTotal = (Number(item.price) + extrasTotal) * Number(item.quantity);
      subtotal += itemTotal;

      const itemHeader = `[ ${item.quantity}X ] ${(item.name || 'Item').toUpperCase()}`;
      if (isKitchenOnly) {
        pushWrapped(itemHeader, '   ');
      } else {
        const priceFormatted = `R$ ${itemTotal.toFixed(2).replace('.', ',')}`;
        pushDotRow(itemHeader, priceFormatted);
      }

      if (item.extras && item.extras.length > 0) {
        item.extras.forEach((e: any) => {
          const eName = sanitizeForThermal(e.name || '');
          if (!eName) return;
          if (isKitchenOnly) {
            pushWrapped(`  + ${eName}`, '    ');
          } else {
            const ePrice = Number(e.price) > 0 ? `+R$ ${Number(e.price).toFixed(2).replace('.', ',')}` : 'Incluso';
            pushDotRow(`  + ${eName}`, ePrice);
          }
        });
      }

      if (settings.showItemObservations && item.observation && item.observation.trim()) {
        pushWrapped(`  >> OBS: ${item.observation.trim().toUpperCase()}`, '     ');
      }

      if (idx < order.items.length - 1) {
        pushRaw('--------------------------------');
      }
    });
  }

  // TOTAIS E PAGAMENTO
  if (!isKitchenOnly) {
    pushRaw(dline);
    const fee = Number(order.deliveryFee) || 0;
    const total = Number(order.totalPrice) || 0;
    const calcSub = subtotal > 0 ? subtotal : total - fee;
    const discount = Math.max(0, (calcSub + fee) - total);

    if (fee > 0 || discount > 0.01) {
      pushDotRow('Subtotal Itens:', `R$ ${calcSub.toFixed(2).replace('.', ',')}`);
    }
    if (discount > 0.01) {
      pushDotRow('Desconto:', `-R$ ${discount.toFixed(2).replace('.', ',')}`);
    }
    if (fee > 0) {
      pushDotRow('Taxa de Entrega:', `R$ ${fee.toFixed(2).replace('.', ',')}`);
    }
    pushRaw(line);
    pushDotRow('TOTAL DO PEDIDO:', `R$ ${total.toFixed(2).replace('.', ',')}`);

    if (settings.showPaymentDetails) {
      pushRaw(line);
      const isPaid = isOrderPaid(order);
      if (isPaid) {
        pushCentered('>>> PEDIDO PAGO E CONFIRMADO <<<');
      } else {
        pushCentered('>>> AGUARDANDO PAGAMENTO <<<');
      }
      pushRaw(line);
      const cleanPayment = sanitizeForThermal(order.paymentMethod || 'A Confirmar').toUpperCase();
      pushWrapped(`Pagamento: ${cleanPayment}`, '  ');
      pushWrapped(`Status: ${isPaid ? 'PAGO' : 'AGUARDANDO PAGAMENTO'}`, '  ');
      if (order.changeFor) {
        pushDotRow('Troco para:', `R$ ${order.changeFor}`);
      }
      if (order.receiptAuthCode) {
        pushWrapped(`Autenticacao: ${order.receiptAuthCode}`, '  ');
      }
    }
  }

  // RODAPÉ CENTRALIZADO
  pushRaw(dline);
  if (settings.printFooter) {
    const footerParts = settings.printFooter
      .split(/(?<=!)\s+/)
      .map(p => p.trim())
      .filter(Boolean);
    footerParts.forEach(part => pushCentered(part.toUpperCase()));
  }
  pushCentered('ATE A PROXIMA!');
  pushRaw(dline);

  const feedCount = Math.max(2, settings.feedLines || 3);
  for (let i = 0; i < feedCount; i++) {
    rawLines.push(' ');
  }

  return rawLines.join('\r\n');
}

/**
 * Builds a standalone, clean HTML document designed specifically for thermal receipt rolls (80mm & 58mm)
 */
export function generateReceiptHtml(
  order: Order,
  settings: PrinterSettings,
  isKitchenOnly = false,
  viaTitle?: string
): string {
  const is58 = settings.printerType === 'thermal_58';
  const paperWidth = is58 ? '44mm' : '64mm';
  const fontSize = 
    settings.fontSize === 'small' ? (is58 ? '9.5px' : '10.5px') :
    settings.fontSize === 'large' ? (is58 ? '12px' : '14px') :
    (is58 ? '10.5px' : '12px');

  let dateStr = '';
  if (order.createdAt?.toDate) {
    const d = order.createdAt.toDate();
    dateStr = `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (typeof order.createdAt === 'string') {
    dateStr = order.createdAt;
  } else {
    dateStr = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  const orderNum = order.orderNumber || (order.id ? order.id.substring(0, 4).toUpperCase() : '1');
  const subtotal = order.items?.reduce((sum, item) => {
    const extrasTotal = item.extras?.reduce((s: number, e: any) => s + (Number(e.price) || 0), 0) || 0;
    return sum + ((Number(item.price) + extrasTotal) * Number(item.quantity));
  }, 0) || order.totalPrice;
  const fee = Number(order.deliveryFee) || 0;
  const total = Number(order.totalPrice) || 0;
  const discount = Math.max(0, (subtotal + fee) - total);
  const cleanPayment = sanitizeForThermal(order.paymentMethod || 'A Confirmar');
  const hasRegion = order.region && order.address && order.address.toLowerCase().includes(order.region.toLowerCase());

  const itemsHtml = (order.items || []).map(item => {
    const extrasTotal = item.extras?.reduce((s: number, e: any) => s + (Number(e.price) || 0), 0) || 0;
    const itemTotal = (Number(item.price) + extrasTotal) * Number(item.quantity);

    const extrasSnippet = item.extras && item.extras.length > 0
      ? `
        <div style="padding-left: 8px; margin-top: 4px; font-size: 0.92em; border-left: 3px solid #000; margin-left: 2px; padding-bottom: 2px;">
          <div style="font-weight: 900; text-transform: uppercase; font-size: 0.82em; color: #000; margin-bottom: 2px;">ADICIONAIS:</div>
          ${item.extras.map((e: any) => `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 1px 0; font-weight: 800; gap: 6px; color: #000;">
              <span style="min-width: 0; word-break: break-word; font-weight: 800;">+ ${sanitizeForThermal(e.name || '')}</span>
              ${!isKitchenOnly ? `<span style="font-family: monospace; white-space: nowrap; flex-shrink: 0; font-weight: 800;">${Number(e.price) > 0 ? `+R$ ${Number(e.price).toFixed(2).replace('.', ',')}` : 'Incluso'}</span>` : ''}
            </div>
          `).join('')}
        </div>
      `
      : '';

    const obsSnippet = settings.showItemObservations && item.observation && item.observation.trim()
      ? `<div style="padding: 4px 6px; margin-top: 5px; font-weight: 900; background: #e5e5e5; border-left: 4px solid #000; text-transform: uppercase; font-size: 0.92em; word-break: break-word; line-height: 1.25; color: #000;">>> OBS: ${sanitizeForThermal(item.observation.trim())}</div>`
      : '';

    return `
      <div style="border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 6px; word-break: break-word;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; font-weight: 900; font-size: 1.15em; gap: 6px;">
          <span style="flex: 1; min-width: 0; word-break: break-word; line-height: 1.25; text-transform: uppercase; font-weight: 900;">
            <span style="background: #000; color: #fff; padding: 1px 5px; font-size: 0.88em; font-weight: 900; border-radius: 2px; margin-right: 4px;">${item.quantity}x</span>
            ${sanitizeForThermal(item.name || 'Item')}
          </span>
          ${!isKitchenOnly ? `<span style="font-family: monospace; white-space: nowrap; flex-shrink: 0; font-weight: 900; font-size: 1.02em;">R$ ${itemTotal.toFixed(2).replace('.', ',')}</span>` : ''}
        </div>
        ${extrasSnippet}
        ${obsSnippet}
      </div>
    `;
  }).join('');

  const feedCm = (settings.feedLines || 4) * 0.35;

  return `
    <div class="comanda-receipt" style="width: 100%; max-width: ${paperWidth}; margin: 0 auto; padding: 2px 4px; font-family: 'Consolas', 'Lucida Console', 'Courier New', monospace, sans-serif; font-size: ${fontSize}; line-height: 1.25; color: #000; background: #fff; box-sizing: border-box; overflow-wrap: anywhere; word-break: break-word;">
      
      <!-- CABEÇALHO -->
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 6px;">
        <div style="font-weight: 900; font-size: 1.3em; text-transform: uppercase; letter-spacing: -0.5px;">${settings.printHeader || 'NICKEL LANCHES'}</div>
        ${settings.printSubHeader ? `<div style="font-weight: bold; font-size: 0.85em; text-transform: uppercase;">${settings.printSubHeader}</div>` : ''}
        ${settings.printPhone ? `<div style="font-size: 0.85em; font-weight: bold; margin-top: 2px;">Tel/WhatsApp: ${settings.printPhone}</div>` : ''}
        ${settings.printAddress ? `<div style="font-size: 0.8em; color: #222; margin-top: 2px; word-break: break-word;">${settings.printAddress}</div>` : ''}
        ${viaTitle ? `<div style="display: inline-block; background: #000; color: #fff; font-weight: 900; font-size: 0.8em; padding: 2px 6px; margin-top: 4px; text-transform: uppercase;">${viaTitle}</div>` : ''}
      </div>

      <!-- DADOS DO PEDIDO E NÚMERO DO PEDIDO EM ALTO DESTAQUE -->
      <div style="border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 6px;">
        <div style="background: #000; color: #fff; padding: 6px 4px; text-align: center; margin: 4px 0 6px 0; border-radius: 3px; border: 2px solid #000;">
          <div style="font-weight: 900; font-size: 1.55em; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.1;">
            PEDIDO #${orderNum}
          </div>
          ${settings.showPassword && order.id ? `<div style="font-weight: 900; font-size: 0.85em; color: #fde047; margin-top: 3px; letter-spacing: 1px;">SENHA: ${order.id.substring(0, 4).toUpperCase()}</div>` : ''}
        </div>
        <div style="font-size: 0.88em; color: #000; font-weight: bold; text-align: center;">Data/Hora: ${dateStr}</div>
        
        <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dotted #888; font-size: 0.92em; line-height: 1.35;">
          <div style="word-break: break-word;"><span style="font-weight: bold; color: #333;">Cliente: </span><span style="font-weight: 900; text-transform: uppercase;">${sanitizeForThermal(order.userName || 'Balcão / Cliente')}</span></div>
          ${settings.showCustomerPhone && order.whatsapp ? `<div style="margin-top: 2px;"><span style="font-weight: bold; color: #333;">WhatsApp: </span><span style="font-weight: bold;">${order.whatsapp}</span></div>` : ''}
          ${settings.showDeliveryAddress ? `
            <div style="margin-top: 4px; padding: 4px 6px; background: #f8f8f8; border: 1px dashed #aaa; border-radius: 2px;">
              <div style="font-weight: 900; text-transform: uppercase; font-size: 0.82em; color: #333;">Endereço de Entrega:</div>
              <div style="font-weight: bold; word-break: break-word; margin-top: 1px;">${order.address || 'Retirada no Balcão'}${order.region && !hasRegion ? ` (${order.region})` : ''}</div>
            </div>
          ` : ''}
          ${order.receiptNotes ? `
            <div style="margin-top: 4px; padding: 4px 6px; background: #f3f3f3; border-left: 3px solid #333; font-size: 0.9em; word-break: break-word;">
              <strong>Obs. Entrega: </strong>${sanitizeForThermal(order.receiptNotes)}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- ITENS DO PEDIDO EM ALTO DESTAQUE E NEGRITO -->
      <div style="margin-bottom: 6px;">
        <div style="background: #000; color: #fff; text-align: center; font-weight: 900; font-size: 0.92em; padding: 3px 0; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px;">
          ${isKitchenOnly ? 'PREPARO DA COZINHA' : 'ITENS DO PEDIDO'}
        </div>
        <div>
          ${itemsHtml}
        </div>
      </div>

      <!-- TOTAIS E PAGAMENTO (Apenas se não for cozinha exclusiva) -->
      ${!isKitchenOnly ? `
        <div style="border-top: 2px solid #000; padding-top: 4px; margin-bottom: 6px;">
          ${fee > 0 || discount > 0.01 ? `
            <div style="display: flex; justify-content: space-between; font-size: 0.9em; margin-bottom: 2px; font-weight: 600;">
              <span>Subtotal Itens:</span>
              <span style="font-family: monospace;">R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
          ` : ''}
          ${discount > 0.01 ? `
            <div style="display: flex; justify-content: space-between; font-size: 0.9em; margin-bottom: 2px; font-weight: 700;">
              <span>Desconto:</span>
              <span style="font-family: monospace;">-R$ ${discount.toFixed(2).replace('.', ',')}</span>
            </div>
          ` : ''}
          ${fee > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 0.9em; margin-bottom: 3px; font-weight: 600;">
              <span>Taxa de Entrega:</span>
              <span style="font-family: monospace;">R$ ${fee.toFixed(2).replace('.', ',')}</span>
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 900; font-size: 1.2em; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 0; margin: 4px 0;">
            <span>TOTAL DO PEDIDO:</span>
            <span style="font-family: monospace;">R$ ${total.toFixed(2).replace('.', ',')}</span>
          </div>

          ${settings.showPaymentDetails ? `
            <div style="font-size: 0.88em; margin-top: 4px; line-height: 1.35;">
              <div style="background: ${isOrderPaid(order) ? '#000' : '#d97706'}; color: #fff; text-align: center; font-weight: 900; font-size: 0.85em; padding: 2.5px 0; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${isOrderPaid(order) ? '>>> PEDIDO PAGO E CONFIRMADO <<<' : '>>> AGUARDANDO PAGAMENTO <<<'}
              </div>
              <div style="word-break: break-word;">Pagamento: <strong style="text-transform: uppercase;">${cleanPayment}</strong></div>
              <div>Status: <strong>${isOrderPaid(order) ? 'PAGO' : 'AGUARDANDO PAGAMENTO'}</strong></div>
              ${order.changeFor ? `<div style="font-weight: 900; margin-top: 2px;">Troco para: R$ ${order.changeFor}</div>` : ''}
              ${order.receiptAuthCode ? `
                <div style="margin-top: 3px; font-size: 0.85em; color: #222; border: 1px solid #bbb; padding: 2px 4px; background: #fafafa; word-break: break-word;">
                  Autenticação: <strong>${order.receiptAuthCode}</strong>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- RODAPÉ -->
      <div style="text-align: center; border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px;">
        ${settings.printFooter ? `<div style="font-weight: bold; font-size: 0.85em; text-transform: uppercase; word-break: break-word;">${settings.printFooter}</div>` : ''}
        <div style="font-size: 0.85em; margin-top: 3px; font-weight: bold;">*** ATÉ A PRÓXIMA! ***</div>
      </div>

      <!-- AVANÇO DE LINHAS PARA A GUILHOTINA / SERRILHA -->
      <div style="height: ${feedCm}cm;"></div>
    </div>
  `;
}

/**
 * Builds full HTML page with print stylesheet and instant trigger
 */
export function buildCompletePrintPageHtml(order: Order, settings: PrinterSettings): string {
  const is58 = settings.printerType === 'thermal_58';
  const paperWidth = is58 ? '44mm' : '64mm';

  let bodyContent = '';
  if (settings.printCopies === 2) {
    bodyContent = `
      ${generateReceiptHtml(order, settings, true, 'VIA 1 - COZINHA / PREPARO')}
      <div class="print-page-break" style="page-break-after: always; break-after: page; height: 10px; border-bottom: 2px dashed #000; margin: 15px 0;"></div>
      ${generateReceiptHtml(order, settings, false, 'VIA 2 - ENTREGA / CLIENTE')}
    `;
  } else {
    bodyContent = generateReceiptHtml(order, settings, false);
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Comanda Pedido #${order.orderNumber || (order.id ? order.id.substring(0, 4) : '1')}</title>
  <style>
    @page {
      margin: 0 !important;
      size: auto !important;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      width: 100%;
      font-family: 'Consolas', 'Lucida Console', 'Courier New', Courier, monospace, sans-serif;
    }
    @media screen {
      body {
        background: #f0f0f0;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .screen-bar {
        background: #1c1917;
        color: #fff;
        padding: 12px 18px;
        border-radius: 12px;
        margin-bottom: 16px;
        display: flex;
        gap: 10px;
        align-items: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: sans-serif;
        font-size: 13px;
        max-width: 480px;
        width: 100%;
        justify-content: space-between;
      }
      .screen-bar button {
        background: #f59e0b;
        color: #000;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 900;
        cursor: pointer;
        text-transform: uppercase;
        font-size: 12px;
      }
      .screen-bar button:hover {
        background: #d97706;
      }
      .screen-bar .close-btn {
        background: #444;
        color: #fff;
      }
      .screen-bar .close-btn:hover {
        background: #666;
      }
      .comanda-wrapper {
        background: #fff;
        padding: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        border: 1px solid #ddd;
        border-radius: 4px;
        width: 100%;
        max-width: ${paperWidth};
        box-sizing: border-box;
      }
    }
    @media print {
      .screen-bar {
        display: none !important;
      }
      .comanda-wrapper {
        width: 100% !important;
        max-width: ${paperWidth} !important;
        margin: 0 auto !important;
        padding: 0 1.5mm !important;
        box-shadow: none !important;
        border: none !important;
        box-sizing: border-box !important;
      }
      .print-page-break {
        page-break-after: always !important;
        break-after: page !important;
      }
    }
  </style>
</head>
<body>
  <div class="screen-bar">
    <span>🖨️ <strong>Impressora Térmica USB</strong> (${is58 ? '58mm' : '80mm'})</span>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()">IMPRIMIR AGORA</button>
      <button class="close-btn" onclick="window.close()">FECHAR</button>
    </div>
  </div>

  <div class="comanda-wrapper">
    ${bodyContent}
  </div>

  <script>
    // Tenta acionar a impressão automática assim que carregar
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.warn('Auto print error:', e);
        }
      }, 250);
    });
  </script>
</body>
</html>`;
}

/**
 * Checks if the Windows "Impressão Automática" desktop app is online
 * (Checks both local 127.0.0.1:4848 and Firestore Cloud Heartbeat so HTTPS never blocks status!)
 */
export async function checkWindowsBridgeStatus(): Promise<{
  connected: boolean;
  printerName?: string;
  printedCount?: number;
}> {
  // 1. Try local HTTP bridge first (fastest when browser allows local network)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 900);
    const res = await fetch('http://127.0.0.1:4848/status', {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return {
        connected: true,
        printerName: data.printer || 'Impressora Padrão do Windows',
        printedCount: data.printedCount || 0,
      };
    }
  } catch (_) {
    // Local fetch may be blocked by HTTPS -> HTTP mixed content; fall back to Cloud Heartbeat
  }

  // 2. Check Cloud Heartbeat in Firestore (works 100% on HTTPS!)
  try {
    const cloudSt = await getCloudBridgeStatus();
    if (cloudSt.connected) {
      return {
        connected: true,
        printerName: cloudSt.printerName || 'Impressora Padrão do Windows',
        printedCount: cloudSt.printedCount || 0,
      };
    }
  } catch (_) {}

  return { connected: false };
}

/**
 * Sends a formatted comanda directly to the Windows "Impressão Automática" app
 * via both Local Bridge (127.0.0.1:4848) AND Cloud Print Queue (Firestore settings/print_queue)
 */
export async function sendToWindowsBridge(
  order: Order,
  settings: PrinterSettings,
  force = false
): Promise<{ ok: boolean; printer?: string; skipped?: boolean }> {
  let fullText = '';
  if (settings.printCopies === 2) {
    const via1 = generateReceiptText(order, settings, true, 'VIA 1 - COZINHA / PREPARO');
    const via2 = generateReceiptText(order, settings, false, 'VIA 2 - ENTREGA / CLIENTE');
    fullText = `${via1}\r\n\r\n\r\n${via2}`;
  } else {
    fullText = generateReceiptText(order, settings, false);
  }

  const orderId = order.id || `manual-${Date.now()}`;
  const orderNumber = order.orderNumber || 1;

  // Always push to Cloud Print Queue so the Windows PC app picks it up even over HTTPS
  const cloudQueuedPromise = enqueueCloudPrintJob({
    orderId,
    orderNumber,
    text: fullText,
    force,
  });

  // Also try local 127.0.0.1:4848 in parallel
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1400);
    const res = await fetch('http://127.0.0.1:4848/print', {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        orderNumber,
        text: fullText,
        copies: 1,
        force,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      await cloudQueuedPromise;
      return { ok: true, printer: data.printer, skipped: data.skipped };
    }
  } catch (_) {
    // Local port blocked by HTTPS mixed-content; verify if Cloud Bridge is online
  }

  const [cloudQueued, cloudBridge] = await Promise.all([
    cloudQueuedPromise,
    getCloudBridgeStatus(),
  ]);

  if (cloudQueued && cloudBridge.connected) {
    return {
      ok: true,
      printer: cloudBridge.printerName || 'Impressora do Windows',
      skipped: false,
    };
  }

  return { ok: false };
}

/**
 * Universal print handler that supports:
 * 0. Windows "Impressão Automática" Desktop Bridge (Local + Cloud Queue) - 100% silent on any Windows printer!
 * 1. WebUSB direct ESC/POS (if connected)
 * 2. Hidden isolated IFrame print (standard browser spooler without breaking the app UI)
 * 3. Popup window print (fallback if iframe printing is sandboxed/blocked)
 */
export async function executeUniversalPrint(
  order: Order,
  settings: PrinterSettings,
  addToast?: (t: { message: string; type: 'success' | 'error' | 'info' | 'warning' }) => void,
  options?: { force?: boolean }
): Promise<{ success: boolean; method: string }> {
  const isTestOrder =
    String(order.id || '').startsWith('TESTE') ||
    order.userName === 'CLIENTE TESTE' ||
    order.userName === 'TESTE IMPRESSÃO AUTOMÁTICA';

  // REGRA DE OURO: Só pode ir para a comanda da impressora os pedidos que foram PAGOS!
  if (!isTestOrder && !isOrderPaid(order)) {
    if (addToast) {
      addToast({
        message: 'Atenção: Só podem ir para a comanda os pedidos que foram PAGOS! Confirme o pagamento primeiro.',
        type: 'warning',
      });
    }
    return { success: false, method: 'unpaid_blocked' };
  }

  const forcePrint = options?.force ?? true;

  // 0. Send to Windows "Impressão Automática" App (Local + Cloud Queue)
  const bridgeResult = await sendToWindowsBridge(order, settings, forcePrint);
  if (bridgeResult.ok) {
    if (addToast && !bridgeResult.skipped) {
      addToast({
        message: `Comanda enviada automaticamente para ${bridgeResult.printer || 'a impressora do Windows'}!`,
        type: 'success',
      });
    }
    return { success: true, method: 'windows_bridge' };
  }

  // 1. WebUSB direct check (auto reconnect if device was previously paired)
  let usbStatus = getConnectedUsbPrinter();
  if (!usbStatus.connected) {
    usbStatus = await checkAndAutoReconnectUsbPrinter();
  }

  if (usbStatus.connected) {
    try {
      if (settings.printCopies === 2) {
        const kitchenData = buildReceiptEscPos(order, settings, true, 'VIA 1 - COZINHA');
        await sendRawToUsbPrinter(kitchenData);
        await new Promise(r => setTimeout(r, 450));
        const deliveryData = buildReceiptEscPos(order, settings, false, 'VIA 2 - ENTREGA');
        await sendRawToUsbPrinter(deliveryData);
      } else {
        const singleData = buildReceiptEscPos(order, settings, false);
        await sendRawToUsbPrinter(singleData);
      }

      if (addToast) {
        addToast({ message: 'Comanda impressa diretamente na impressora USB via ESC/POS!', type: 'success' });
      }
      return { success: true, method: 'webusb' };
    } catch (err) {
      console.warn('Falha no WebUSB direto, usando Spooler USB do Sistema:', err);
    }
  }

  // Build complete HTML for print
  const pageHtml = buildCompletePrintPageHtml(order, settings);

  // 2. Isolated hidden Iframe print (cleanest spooler printing, never blocked by popup blockers)
  try {
    const oldIframe = document.getElementById('nickel-print-frame');
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'nickel-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(pageHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          if (addToast) {
            addToast({ message: 'Comanda enviada para a impressora!', type: 'info' });
          }
        } catch (iframePrintErr) {
          console.warn('Iframe print bloqueado pelo sandbox, tentando popup ou fallback:', iframePrintErr);
          try {
            const printWindow = window.open('', '_blank', 'width=420,height=650');
            if (printWindow) {
              printWindow.document.open();
              printWindow.document.write(pageHtml);
              printWindow.document.close();
            } else {
              window.print();
            }
          } catch (_) {
            window.print();
          }
        }
      }, 300);

      return { success: true, method: 'iframe_spooler' };
    }
  } catch (err) {
    console.error('Erro no método iframe spooler:', err);
  }

  // 3. Fallback: window.print()
  try {
    window.print();
    return { success: true, method: 'window_print' };
  } catch (finalErr) {
    console.error('Falha geral no window.print():', finalErr);
    if (addToast) {
      addToast({ message: 'Não foi possível acionar a impressora automaticamente. Instale o app Impressão Automática no painel.', type: 'error' });
    }
    return { success: false, method: 'failed' };
  }
}

/**
 * Generates the standalone Windows "Impressão Automática" application (.BAT + certutil-decoded PowerShell engine).
 * Features:
 * - Zero escaping issues: Uses Windows built-in `certutil -f -decode` to extract the UTF-8 PowerShell script to `%APPDATA%\NickelImpressaoAutomatica\NickelAutoPrint.ps1`
 * - Always On: Copies itself to the Windows Startup folder (`shell:startup`) AND wraps execution in an infinite auto-restart `:LOOP`
 * - Smart Printer Detection: Automatically finds the real physical/thermal printer in Windows (even if Windows had "Microsoft Print to PDF" selected!)
 * - Dual Cloud + Local Sync: Polls `global_orders` AND `settings/print_queue` every 2 seconds over TLS 1.2 + updates `settings/bridge_status` heartbeat
 * - Instant Confirmation: On first open, immediately prints the latest unprinted order OR a confirmation comanda so the user sees paper come out right away!
 */
export function generateWindowsBridgeBatchScript(settings: PrinterSettings): string {
  const headerName = (settings.printHeader || 'NICKEL LANCHES').replace(/["'`$\\]/g, '');
  const subHeader = (settings.printSubHeader || 'Delivery de Verdade!').replace(/["'`$\\]/g, '');
  const phoneStr = (settings.printPhone || '(54) 99959-8389').replace(/["'`$\\]/g, '');
  const addressStr = (settings.printAddress || 'R. Uruguai, 919 - Petropolis - Passo Fundo - RS').replace(/["'`$\\]/g, '');
  const footerStr = (settings.printFooter || 'Ate a proxima!').replace(/["'`$\\]/g, '');
  const copiesCount = settings.printCopies === 2 ? 2 : 1;
  const is58 = settings.printerType === 'thermal_58';
  const fontSizePt = is58
    ? (settings.fontSize === 'small' ? 7 : settings.fontSize === 'large' ? 8.5 : 7.5)
    : (settings.fontSize === 'small' ? 7.5 : settings.fontSize === 'large' ? 9.5 : 8.5);

  const psLines: string[] = [
    '$ErrorActionPreference = "SilentlyContinue"',
    '[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12',
    '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
    '$Host.UI.RawUI.WindowTitle = "Impressao Automatica - Nickel Lanches (SEMPRE LIGADO)"',
    '',
    'Add-Type -AssemblyName System.Drawing',
    '',
    '$appDir = Join-Path $env:APPDATA "NickelImpressaoAutomatica"',
    'if (-not (Test-Path $appDir)) { New-Item -ItemType Directory -Path $appDir -Force | Out-Null }',
    '$printedFile = Join-Path $appDir "printed_orders.txt"',
    '$printedJobsFile = Join-Path $appDir "printed_jobs.txt"',
    '$printerPrefFile = Join-Path $appDir "selected_printer.txt"',
    '$firstRunFile = Join-Path $appDir "first_run_v4.txt"',
    '',
    'if (-not (Test-Path $printedFile)) { New-Item -ItemType File -Path $printedFile -Force | Out-Null }',
    'if (-not (Test-Path $printedJobsFile)) { New-Item -ItemType File -Path $printedJobsFile -Force | Out-Null }',
    '',
    '$printedIds = New-Object System.Collections.Generic.HashSet[string]',
    'Get-Content $printedFile | ForEach-Object { $c = $_.Trim(); if ($c) { [void]$printedIds.Add($c) } }',
    '',
    '$printedJobs = New-Object System.Collections.Generic.HashSet[string]',
    'Get-Content $printedJobsFile | ForEach-Object { $c = $_.Trim(); if ($c) { [void]$printedJobs.Add($c) } }',
    '',
    'function Save-PrintedId([string]$id) {',
    '  if (-not $id) { return }',
    '  if (-not $printedIds.Contains($id)) {',
    '    [void]$printedIds.Add($id)',
    '    Add-Content -Path $printedFile -Value $id -Encoding UTF8',
    '  }',
    '}',
    '',
    'function Save-PrintedJob([string]$jid) {',
    '  if (-not $jid) { return }',
    '  if (-not $printedJobs.Contains($jid)) {',
    '    [void]$printedJobs.Add($jid)',
    '    Add-Content -Path $printedJobsFile -Value $jid -Encoding UTF8',
    '  }',
    '}',
    '',
    'function Get-InstalledPrintersList {',
    '  $list = New-Object System.Collections.Generic.List[string]',
    '  try {',
    '    foreach ($p in [System.Drawing.Printing.PrinterSettings]::InstalledPrinters) {',
    '      $list.Add([string]$p)',
    '    }',
    '  } catch {}',
    '  return $list',
    '}',
    '',
    'function Get-BestWindowsPrinter {',
    '  $installed = Get-InstalledPrintersList',
    '  if (Test-Path $printerPrefFile) {',
    '    $saved = (Get-Content $printerPrefFile -Raw).Trim()',
    '    if ($saved -and ($installed -contains $saved)) { return $saved }',
    '  }',
    '  $defaultName = ""',
    '  try {',
    '    $ps = New-Object System.Drawing.Printing.PrinterSettings',
    '    if ($ps.PrinterName) { $defaultName = [string]$ps.PrinterName }',
    '  } catch {}',
    '',
    '  $isVirtual = ($defaultName -match "PDF|XPS|OneNote|Fax|Documento")',
    '  if ($defaultName -and (-not $isVirtual)) {',
    '    return $defaultName',
    '  }',
    '',
    '  foreach ($p in $installed) {',
    '    if ($p -match "POS|58|80|Thermal|Termica|USB|Receipt|Elgin|Bematech|Epson|Daruma|Knup|Generic|Text") {',
    '      return $p',
    '    }',
    '  }',
    '  foreach ($p in $installed) {',
    '    if ($p -notmatch "PDF|XPS|OneNote|Fax|Documento") {',
    '      return $p',
    '    }',
    '  }',
    '  if ($defaultName) { return $defaultName }',
    '  return "Impressora Padrao do Windows"',
    '}',
    '',
    '$script:selectedPrinter = Get-BestWindowsPrinter',
    '$script:printedSessionCount = 0',
    '$script:currentPrintLines = @()',
    '',
    'function Clean-ThermalText([string]$txt) {',
    '  if (-not $txt) { return "" }',
    '  $s = $txt -replace "[\\u2022\\u25CF\\u25AA\\u25B8\\u25BA]", "+"',
    '  $s = $s -replace "[^\\x20-\\x7E\\xA0-\\xFF]", ""',
    '  $s = ($s -replace "\\s+", " ").Trim()',
    '  return $s',
    '}',
    '',
    'function Wrap-Text32([string]$rawText, [int]$maxCols = 32, [string]$indent = "") {',
    '  $res = New-Object System.Collections.Generic.List[string]',
    '  $clean = Clean-ThermalText $rawText',
    '  if (-not $clean) { return $res }',
    '  if ($clean.Length -le $maxCols) {',
    '    $res.Add($clean)',
    '    return $res',
    '  }',
    '  $words = $clean -split " "',
    '  $cur = ""',
    '  foreach ($w in $words) {',
    '    if (-not $w) { continue }',
    '    $pfx = if ($res.Count -eq 0) { "" } else { $indent }',
    '    while ($w.Length -gt ($maxCols - $pfx.Length)) {',
    '      if ($cur) {',
    '        $res.Add(($cur -replace "\\s+-\\s*$", ""))',
    '        $cur = ""',
    '      }',
    '      $pfx = if ($res.Count -eq 0) { "" } else { $indent }',
    '      $chunk = $maxCols - $pfx.Length',
    '      $res.Add($pfx + $w.Substring(0, $chunk))',
    '      $w = $w.Substring($chunk)',
    '    }',
    '    if (-not $w) { continue }',
    '    if (-not $cur) {',
    '      if ($res.Count -gt 0 -and $w -eq "-") { continue }',
    '      $cur = $pfx + $w',
    '    } elseif (($cur.Length + 1 + $w.Length) -le $maxCols) {',
    '      $cur = $cur + " " + $w',
    '    } else {',
    '      $res.Add(($cur -replace "\\s+-\\s*$", ""))',
    '      if ($w -eq "-") {',
    '        $cur = ""',
    '      } else {',
    '        $cur = $indent + $w',
    '      }',
    '    }',
    '  }',
    '  if ($cur) {',
    '    $res.Add(($cur -replace "\\s+-\\s*$", ""))',
    '  }',
    '  return $res',
    '}',
    '',
    'function Center-Text32([string]$rawText, [int]$maxCols = 32) {',
    '  $res = New-Object System.Collections.Generic.List[string]',
    '  $lines = Wrap-Text32 $rawText $maxCols ""',
    '  foreach ($ln in $lines) {',
    '    $t = $ln.Trim()',
    '    if ($t.Length -ge $maxCols) {',
    '      $res.Add($t.Substring(0, $maxCols))',
    '    } else {',
    '      $pad = [int][Math]::Floor(($maxCols - $t.Length) / 2)',
    '      $res.Add((" " * $pad) + $t)',
    '    }',
    '  }',
    '  return $res',
    '}',
    '',
    'function Format-DotRow32([string]$left, [string]$right, [int]$maxCols = 32) {',
    '  $res = New-Object System.Collections.Generic.List[string]',
    '  $cl = Clean-ThermalText $left',
    '  $cr = Clean-ThermalText $right',
    '  if (-not $cr) {',
    '    foreach ($l in (Wrap-Text32 $cl $maxCols "  ")) { $res.Add($l) }',
    '    return $res',
    '  }',
    '  if (($cl.Length + 2 + $cr.Length) -le $maxCols) {',
    '    $dots = $maxCols - $cl.Length - $cr.Length - 2',
    '    if ($dots -ge 1) {',
    '      $res.Add($cl + " " + ("." * $dots) + " " + $cr)',
    '    } else {',
    '      $spaces = $maxCols - $cl.Length - $cr.Length',
    '      $res.Add($cl + (" " * $spaces) + $cr)',
    '    }',
    '    return $res',
    '  }',
    '  foreach ($l in (Wrap-Text32 $cl $maxCols "  ")) { $res.Add($l) }',
    '  $vLabel = "   Subtotal:"',
    '  $dots = [Math]::Max(1, ($maxCols - $vLabel.Length - $cr.Length - 2))',
    '  $res.Add($vLabel + " " + ("." * $dots) + " " + $cr)',
    '  return $res',
    '}',
    '',
    'function Print-RawComanda([string]$comandaText) {',
    '  $targetPrinter = $script:selectedPrinter',
    '  $useTextOnly = ($targetPrinter -match "Generic|Text Only|Somente Texto")',
    '',
    '  $safeLines = New-Object System.Collections.Generic.List[string]',
    '  foreach ($rawLn in ($comandaText -split "\\r?\\n")) {',
    '    if (-not $rawLn -or $rawLn.Trim().Length -eq 0) {',
    '      $safeLines.Add(" ")',
    '      continue',
    '    }',
    '    $trimmed = $rawLn.TrimEnd()',
    '    if ($trimmed.Length -le 34) {',
    '      $safeLines.Add($trimmed)',
    '    } else {',
    '      foreach ($wln in (Wrap-Text32 $trimmed.Trim() 32 "  ")) {',
    '        $safeLines.Add(" " + $wln)',
    '      }',
    '    }',
    '  }',
    '  $finalText = ($safeLines -join [Environment]::NewLine)',
    '',
    '  if ($useTextOnly) {',
    '    try {',
    '      $finalText | Out-Printer -Name $targetPrinter',
    '      $script:printedSessionCount++',
    '      return $true',
    '    } catch {}',
    '  }',
    '',
    '  try {',
    '    $doc = New-Object System.Drawing.Printing.PrintDocument',
    '    if ($targetPrinter -and $targetPrinter -ne "Impressora Padrao do Windows") {',
    '      $doc.PrinterSettings.PrinterName = $targetPrinter',
    '    }',
    '    $doc.OriginAtMargins = $false',
    '    $doc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0, 0, 0, 0)',
    '    $doc.PrintController = New-Object System.Drawing.Printing.StandardPrintController',
    '',
    '    $script:currentPrintLines = $safeLines',
    '    $doc.add_PrintPage({',
    '      param($sender, $ev)',
    '      $fontFamily = "Consolas"',
    `      $testFont = New-Object System.Drawing.Font($fontFamily, ${fontSizePt}, [System.Drawing.FontStyle]::Bold)`,
    '      if ($testFont.Name -ne $fontFamily) {',
    `        $font = New-Object System.Drawing.Font("Courier New", ${fontSizePt}, [System.Drawing.FontStyle]::Bold)`,
    '      } else {',
    '        $font = $testFont',
    '      }',
    '      $brush = [System.Drawing.Brushes]::Black',
    '      $y = 6',
    '      $lineHeight = $font.GetHeight($ev.Graphics) + 1',
    '      foreach ($ln in $script:currentPrintLines) {',
    '        $ev.Graphics.DrawString($ln, $font, $brush, 4, $y)',
    '        $y += $lineHeight',
    '      }',
    '      $ev.HasMorePages = $false',
    '    })',
    '    $doc.Print()',
    '    $script:printedSessionCount++',
    '    return $true',
    '  } catch {',
    '    try {',
    '      if ($targetPrinter -and $targetPrinter -ne "Impressora Padrao do Windows") {',
    '        $finalText | Out-Printer -Name $targetPrinter',
    '      } else {',
    '        $finalText | Out-Printer',
    '      }',
    '      $script:printedSessionCount++',
    '      return $true',
    '    } catch {',
    '      Write-Host "  [X] Erro ao enviar para impressora." -ForegroundColor Red',
    '      return $false',
    '    }',
    '  }',
    '}',
    '',
    'function Format-FirestoreOrder($docObj, [bool]$isKitchen, [string]$viaLabel) {',
    '  $f = $docObj.fields',
    '  $docId = ($docObj.name -split "/")[-1]',
    '  $orderNum = if ($f.orderNumber.integerValue) { [string]$f.orderNumber.integerValue } elseif ($f.orderNumber.doubleValue) { [string]$f.orderNumber.doubleValue } else { $docId.Substring(0, [Math]::Min(4, $docId.Length)).ToUpper() }',
    '  $userName = if ($f.userName.stringValue) { (Clean-ThermalText $f.userName.stringValue).ToUpper() } else { "BALCAO / CLIENTE" }',
    '  $whatsapp = if ($f.whatsapp.stringValue) { Clean-ThermalText $f.whatsapp.stringValue } else { "" }',
    '  $address = if ($f.address.stringValue) { Clean-ThermalText $f.address.stringValue } else { "Retirada no Balcao" }',
    '  $region = if ($f.region.stringValue) { Clean-ThermalText $f.region.stringValue } else { "" }',
    '  $payment = if ($f.paymentMethod.stringValue) { (Clean-ThermalText $f.paymentMethod.stringValue).ToUpper() } else { "A CONFIRMAR" }',
    '  $changeFor = if ($f.changeFor.stringValue) { Clean-ThermalText $f.changeFor.stringValue } else { "" }',
    '  $authCode = if ($f.receiptAuthCode.stringValue) { Clean-ThermalText $f.receiptAuthCode.stringValue } else { "" }',
    '  $notes = if ($f.receiptNotes.stringValue) { Clean-ThermalText $f.receiptNotes.stringValue } else { "" }',
    '  $totalPrice = if ($f.totalPrice.doubleValue) { [double]$f.totalPrice.doubleValue } elseif ($f.totalPrice.integerValue) { [double]$f.totalPrice.integerValue } else { 0 }',
    '  $deliveryFee = if ($f.deliveryFee.doubleValue) { [double]$f.deliveryFee.doubleValue } elseif ($f.deliveryFee.integerValue) { [double]$f.deliveryFee.integerValue } else { 0 }',
    '',
    '  $dateStr = (Get-Date).ToString("dd/MM/yyyy HH:mm")',
    '  if ($f.createdAt.timestampValue) {',
    '    try {',
    '      $dt = [DateTime]::Parse($f.createdAt.timestampValue).ToLocalTime()',
    '      $dateStr = $dt.ToString("dd/MM/yyyy HH:mm")',
    '    } catch {}',
    '  }',
    '',
    '  $dline = "================================"',
    '  $line  = "--------------------------------"',
    '  $out = New-Object System.Collections.Generic.List[string]',
    '',
    '  $out.Add(" " + $dline)',
    `  foreach ($cl in (Center-Text32 "${headerName}" 32)) { $out.Add(" " + $cl) }`,
    `  if ("${subHeader}") { foreach ($cl in (Center-Text32 "${subHeader}" 32)) { $out.Add(" " + $cl) } }`,
    `  if ("${phoneStr}") { foreach ($cl in (Center-Text32 "Tel/WhatsApp: ${phoneStr}" 32)) { $out.Add(" " + $cl) } }`,
    `  if ("${addressStr}") { foreach ($cl in (Center-Text32 "${addressStr}" 32)) { $out.Add(" " + $cl) } }`,
    '  if ($viaLabel) {',
    '    $out.Add(" " + $line)',
    '    foreach ($cl in (Center-Text32 ("[ " + $viaLabel + " ]") 32)) { $out.Add(" " + $cl) }',
    '  }',
    '  $out.Add(" " + $dline)',
    '',
    '  $passStr = $docId.Substring(0, [Math]::Min(4, $docId.Length)).ToUpper()',
    '  foreach ($dl in (Format-DotRow32 ("PEDIDO #" + $orderNum) ("SENHA: " + $passStr) 32)) { $out.Add(" " + $dl) }',
    '  foreach ($wl in (Wrap-Text32 ("Data/Hora: " + $dateStr) 32 "  ")) { $out.Add(" " + $wl) }',
    '  $out.Add(" " + $line)',
    '  foreach ($wl in (Wrap-Text32 ("Cliente: " + $userName) 32 "  ")) { $out.Add(" " + $wl) }',
    '  if ($whatsapp) {',
    '    foreach ($wl in (Wrap-Text32 ("WhatsApp: " + $whatsapp) 32 "  ")) { $out.Add(" " + $wl) }',
    '  }',
    '  $fullAddr = if ($region -and ($address.ToLower() -notmatch [Regex]::Escape($region.ToLower()))) { $address + " (" + $region + ")" } else { $address }',
    '  foreach ($wl in (Wrap-Text32 ("Entrega: " + $fullAddr) 32 "  ")) { $out.Add(" " + $wl) }',
    '  if ($notes) {',
    '    foreach ($wl in (Wrap-Text32 ("Obs. Entrega: " + $notes) 32 "  ")) { $out.Add(" " + $wl) }',
    '  }',
    '',
    '  $out.Add(" " + $dline)',
    '  $secTitle = if ($isKitchen) { "PREPARO DA COZINHA" } else { "ITENS DO PEDIDO" }',
    '  foreach ($cl in (Center-Text32 $secTitle 32)) { $out.Add(" " + $cl) }',
    '  $out.Add(" " + $line)',
    '',
    '  $subtotalSum = 0',
    '  if ($f.items.arrayValue.values) {',
    '    $itemsCount = $f.items.arrayValue.values.Count',
    '    for ($idx = 0; $idx -lt $itemsCount; $idx++) {',
    '      $itemVal = $f.items.arrayValue.values[$idx]',
    '      $im = $itemVal.mapValue.fields',
    '      $qty = if ($im.quantity.integerValue) { [int]$im.quantity.integerValue } elseif ($im.quantity.doubleValue) { [int]$im.quantity.doubleValue } else { 1 }',
    '      $iname = if ($im.name.stringValue) { (Clean-ThermalText $im.name.stringValue).ToUpper() } else { "ITEM" }',
    '      $iprice = if ($im.price.doubleValue) { [double]$im.price.doubleValue } elseif ($im.price.integerValue) { [double]$im.price.integerValue } else { 0 }',
    '',
    '      $extrasSum = 0',
    '      $extrasList = New-Object System.Collections.Generic.List[string]',
    '      if ($im.extras.arrayValue.values) {',
    '        foreach ($exVal in $im.extras.arrayValue.values) {',
    '          $em = $exVal.mapValue.fields',
    '          $ename = if ($em.name.stringValue) { Clean-ThermalText $em.name.stringValue } else { "" }',
    '          $eprice = if ($em.price.doubleValue) { [double]$em.price.doubleValue } elseif ($em.price.integerValue) { [double]$em.price.integerValue } else { 0 }',
    '          $extrasSum += $eprice',
    '          if ($ename) {',
    '            if ($isKitchen) {',
    '              foreach ($wl in (Wrap-Text32 ("  + " + $ename) 32 "    ")) { $extrasList.Add(" " + $wl) }',
    '            } else {',
    '              $epStr = if ($eprice -gt 0) { "+R$ " + $eprice.ToString("N2") } else { "Incluso" }',
    '              foreach ($dl in (Format-DotRow32 ("  + " + $ename) $epStr 32)) { $extrasList.Add(" " + $dl) }',
    '            }',
    '          }',
    '        }',
    '      }',
    '',
    '      $lineTotal = ($iprice + $extrasSum) * $qty',
    '      $subtotalSum += $lineTotal',
    '      $itemHead = [string]$qty + "x " + $iname',
    '      if ($isKitchen) {',
    '        foreach ($wl in (Wrap-Text32 $itemHead 32 "   ")) { $out.Add(" " + $wl) }',
    '      } else {',
    '        foreach ($dl in (Format-DotRow32 $itemHead ("R$ " + $lineTotal.ToString("N2")) 32)) { $out.Add(" " + $dl) }',
    '      }',
    '      foreach ($el in $extrasList) { $out.Add($el) }',
    '',
    '      if ($im.observation.stringValue -and $im.observation.stringValue.Trim()) {',
    '        $obsClean = (Clean-ThermalText $im.observation.stringValue).ToUpper()',
    '        foreach ($wl in (Wrap-Text32 ("  >> OBS: " + $obsClean) 32 "     ")) { $out.Add(" " + $wl) }',
    '      }',
    '      if ($idx -lt ($itemsCount - 1)) {',
    '        $out.Add("  - - - - - - - - - - - - - - - -")',
    '      }',
    '    }',
    '  }',
    '',
    '  if (-not $isKitchen) {',
    '    $out.Add(" " + $dline)',
    '    $calcSub = if ($subtotalSum -gt 0) { $subtotalSum } else { $totalPrice - $deliveryFee }',
    '    $discount = [Math]::Max(0, ($calcSub + $deliveryFee) - $totalPrice)',
    '    if ($deliveryFee -gt 0 -or $discount -gt 0.01) {',
    '      foreach ($dl in (Format-DotRow32 "Subtotal Itens:" ("R$ " + $calcSub.ToString("N2")) 32)) { $out.Add(" " + $dl) }',
    '    }',
    '    if ($discount -gt 0.01) {',
    '      foreach ($dl in (Format-DotRow32 "Desconto:" ("-R$ " + $discount.ToString("N2")) 32)) { $out.Add(" " + $dl) }',
    '    }',
    '    if ($deliveryFee -gt 0) {',
    '      foreach ($dl in (Format-DotRow32 "Taxa de Entrega:" ("R$ " + $deliveryFee.ToString("N2")) 32)) { $out.Add(" " + $dl) }',
    '    }',
    '    $out.Add(" " + $line)',
    '    foreach ($dl in (Format-DotRow32 "TOTAL DO PEDIDO:" ("R$ " + $totalPrice.ToString("N2")) 32)) { $out.Add(" " + $dl) }',
    '    $out.Add(" " + $line)',
    '    $isDocPaid = if ($f.isPaid.booleanValue -eq $true -or $f.paymentStatus.stringValue -eq "pago" -or ($payment.Contains("APROVADO") -or $payment.Contains("STRIPE"))) { $true } else { $false }',
    '    if ($isDocPaid) {',
    '      foreach ($cl in (Center-Text32 ">>> PEDIDO PAGO E CONFIRMADO <<<" 32)) { $out.Add(" " + $cl) }',
    '      $out.Add(" " + $line)',
    '    }',
    '    foreach ($wl in (Wrap-Text32 ("Status: " + (if ($isDocPaid) { "PAGO" } else { "AGUARDANDO PAGAMENTO" })) 32 "  ")) { $out.Add(" " + $wl) }',
    '    foreach ($wl in (Wrap-Text32 ("Pagamento: " + $payment) 32 "  ")) { $out.Add(" " + $wl) }',
    '    if ($changeFor) {',
    '      foreach ($dl in (Format-DotRow32 "Troco para:" ("R$ " + $changeFor) 32)) { $out.Add(" " + $dl) }',
    '    }',
    '    if ($authCode) {',
    '      foreach ($wl in (Wrap-Text32 ("Autenticacao: " + $authCode) 32 "  ")) { $out.Add(" " + $wl) }',
    '    }',
    '  }',
    '',
    '  $out.Add(" " + $dline)',
    `  if ("${footerStr}") { foreach ($cl in (Center-Text32 "${footerStr}" 32)) { $out.Add(" " + $cl) } }`,
    '  foreach ($cl in (Center-Text32 "ATE A PROXIMA!" 32)) { $out.Add(" " + $cl) }',
    '  $out.Add(" " + $dline)',
    '  $out.Add(" ")',
    '  $out.Add(" ")',
    '  return ($out -join [Environment]::NewLine)',
    '}',
    '',
    '$baseDbUrl = "https://firestore.googleapis.com/v1/projects/gen-lang-client-0312540102/databases/ai-studio-nickellanches-8133d702-5451-4be1-a259-e8090108c42a/documents"',
    '$ordersUrl = $baseDbUrl + "/global_orders?pageSize=25"',
    '$queueUrl  = $baseDbUrl + "/settings/print_queue"',
    '$statusUrl = $baseDbUrl + "/settings/bridge_status"',
    '',
    'function Send-CloudHeartbeat {',
    '  try {',
    '    $nowMs = [string]([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())',
    '    $pName = [string]$script:selectedPrinter',
    '    $pCount = [string]$script:printedSessionCount',
    '    $bodyObj = @{',
    '      fields = @{',
    '        printerName = @{ stringValue = $pName }',
    '        printedCount = @{ integerValue = $pCount }',
    '        lastSeenMs = @{ integerValue = $nowMs }',
    '        autoStartEnabled = @{ booleanValue = $true }',
    '      }',
    '    }',
    '    $bodyJson = $bodyObj | ConvertTo-Json -Compress -Depth 6',
    '    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)',
    '    [void](Invoke-RestMethod -Uri $statusUrl -Method Patch -Body $bodyBytes -ContentType "application/json; charset=utf-8" -TimeoutSec 4)',
    '  } catch {}',
    '}',
    '',
    'function Print-SampleTestTicket {',
    '  $nowStr = (Get-Date).ToString("dd/MM/yyyy HH:mm:ss")',
    '  $t = @(',
    '    "================================",',
    `    "${headerName}",`,
    '    "IMPRESSAO AUTOMATICA - WINDOWS",',
    '    "--------------------------------",',
    '    ("Data/Hora: " + $nowStr),',
    '    ("Impressora: " + $script:selectedPrinter),',
    '    "Modo: SEMPRE LIGADO (Auto-Start)",',
    '    "--------------------------------",',
    '    "1x TESTE DE IMPRESSAO   R$ 0,00",',
    '    "   * Formatacao sem corte de bordas!",',
    '    "   * Novos pedidos do site sairao",',
    '    "     aqui automaticamente!",',
    '    "================================",',
    '    " ",',
    '    " "',
    '  ) -join [Environment]::NewLine',
    '  try { [Console]::Beep(1000, 200); [Console]::Beep(1500, 250) } catch {}',
    '  [void](Print-RawComanda $t)',
    '  Send-CloudHeartbeat',
    '}',
    '',
    'function Show-Header {',
    '  Clear-Host',
    '  Write-Host "================================================================" -ForegroundColor Yellow',
    '  Write-Host "   IMPRESSAO AUTOMATICA - NICKEL LANCHES (SEMPRE LIGADO)" -ForegroundColor Green',
    '  Write-Host "   Conectado Diretamente as Comandas do Site em Tempo Real" -ForegroundColor White',
    '  Write-Host "================================================================" -ForegroundColor Yellow',
    '  Write-Host ""',
    '  Write-Host "  Impressora Selecionada : " -NoNewline -ForegroundColor Gray',
    '  Write-Host $script:selectedPrinter -ForegroundColor Cyan',
    `  Write-Host "  Vias por Comanda       : ${copiesCount} via(s)" -ForegroundColor Gray`,
    '  Write-Host "  Inicializacao c/ PC    : ATIVADO AUTOMATICAMENTE" -ForegroundColor Green',
    '  Write-Host "  Status das Comandas    : MONITORANDO PEDIDOS 24H..." -ForegroundColor Green',
    '  Write-Host ""',
    '  Write-Host "  [TECLAS DE ATALHO NESTA JANELA]:" -ForegroundColor Yellow',
    '  Write-Host "   Pressione [T] -> Imprimir Comanda de Teste Agora" -ForegroundColor White',
    '  Write-Host "   Pressione [U] -> Imprimir o Ultimo Pedido do Site Agora" -ForegroundColor White',
    '  Write-Host "   Pressione [I] -> Trocar a Impressora do Windows" -ForegroundColor White',
    '  Write-Host "================================================================" -ForegroundColor DarkGray',
    '  Write-Host ""',
    '}',
    '',
    'Show-Header',
    '',
    '$listener = New-Object System.Net.HttpListener',
    '$listener.Prefixes.Add("http://127.0.0.1:4848/")',
    '$listener.Prefixes.Add("http://localhost:4848/")',
    '$bridgeActive = $false',
    'try {',
    '  $listener.Start()',
    '  $bridgeActive = $true',
    '} catch {}',
    '',
    'Send-CloudHeartbeat',
    'Write-Host "[OK] Conectado com o Painel Nickel Lanches na Nuvem!" -ForegroundColor Green',
    '',
    '$isFirstRun = (-not (Test-Path $firstRunFile))',
    'try {',
    '  $initResp = Invoke-RestMethod -Uri $ordersUrl -Method Get -TimeoutSec 8',
    '  $newestRecebido = $null',
    '  $newestTime = [DateTime]::MinValue',
    '  if ($initResp.documents) {',
    '    foreach ($d in $initResp.documents) {',
    '      $did = ($d.name -split "/")[-1]',
    '      $st = if ($d.fields.status.stringValue) { $d.fields.status.stringValue } else { "recebido" }',
    '      $isPaid = $false',
    '      if ($d.fields.isPaid.booleanValue -eq $true) { $isPaid = $true }',
    '      if ($d.fields.paymentStatus.stringValue -eq "pago") { $isPaid = $true }',
    '      if ($d.fields.paymentMethod.stringValue -and ($d.fields.paymentMethod.stringValue.ToLower().Contains("aprovado") -or $d.fields.paymentMethod.stringValue.ToLower().Contains("stripe"))) { $isPaid = $true }',
    '      $dt = [DateTime]::MinValue',
    '      if ($d.fields.createdAt.timestampValue) {',
    '        try { $dt = [DateTime]::Parse($d.fields.createdAt.timestampValue).ToLocalTime() } catch {}',
    '      }',
    '      if ($st -eq "recebido" -and $isPaid -and $dt -gt $newestTime) {',
    '        $newestTime = $dt',
    '        $newestRecebido = $d',
    '      }',
    '      if ($isPaid) {',
    '        Save-PrintedId $did',
    '      }',
    '    }',
    '  }',
    '  if ($isFirstRun) {',
    '    Set-Content -Path $firstRunFile -Value "ok" -Encoding UTF8',
    '    if ($newestRecebido -and (((Get-Date) - $newestTime).TotalMinutes -le 180)) {',
    '      $onum = if ($newestRecebido.fields.orderNumber.integerValue) { [string]$newestRecebido.fields.orderNumber.integerValue } else { "1" }',
    '      Write-Host ("[!] Imprimindo comanda recente encontrada - Pedido #" + $onum + "...") -ForegroundColor Cyan',
    '      try { [Console]::Beep(1000, 200); [Console]::Beep(1500, 300) } catch {}',
    `      if (${copiesCount} -eq 2) {`,
    '        [void](Print-RawComanda (Format-FirestoreOrder $newestRecebido $true "VIA 1 - COZINHA / PREPARO"))',
    '        Start-Sleep -Milliseconds 400',
    '        [void](Print-RawComanda (Format-FirestoreOrder $newestRecebido $false "VIA 2 - ENTREGA / CLIENTE"))',
    '      } else {',
    '        [void](Print-RawComanda (Format-FirestoreOrder $newestRecebido $false ""))',
    '      }',
    '      Write-Host ("[OK] Comanda #" + $onum + " enviada para " + $script:selectedPrinter + "!") -ForegroundColor Green',
    '    } else {',
    '      Write-Host ("[!] Imprimindo bilhete de confirmacao na impressora " + $script:selectedPrinter + "...") -ForegroundColor Cyan',
    '      Print-SampleTestTicket',
    '      Write-Host "[OK] Bilhete de ativacao enviado para a impressora!" -ForegroundColor Green',
    '    }',
    '  }',
    '} catch {',
    '  if ($isFirstRun) {',
    '    Set-Content -Path $firstRunFile -Value "ok" -Encoding UTF8',
    '    Print-SampleTestTicket',
    '  }',
    '}',
    '',
    'try {',
    '  $qInit = Invoke-RestMethod -Uri $queueUrl -Method Get -TimeoutSec 5',
    '  if ($qInit.fields.jobId.stringValue) {',
    '    $createdMs = if ($qInit.fields.createdAtMs.integerValue) { [double]$qInit.fields.createdAtMs.integerValue } else { 0 }',
    '    $nowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()',
    '    if (($nowMs - $createdMs) -gt 60000) {',
    '      Save-PrintedJob $qInit.fields.jobId.stringValue',
    '    }',
    '  }',
    '} catch {}',
    '',
    'Write-Host ""',
    'Write-Host "[PRONTO] Aguardando novas comandas... (Deixe esta janela aberta ou minimizada)" -ForegroundColor Yellow',
    'Write-Host ""',
    '',
    '$pendingAsync = $null',
    'if ($bridgeActive) { $pendingAsync = $listener.BeginGetContext($null, $null) }',
    '$lastCloudPoll = [DateTime]::MinValue',
    '$lastHeartbeat = [DateTime]::Now',
    '',
    'while ($true) {',
    '  try {',
    '    if ([Console]::KeyAvailable) {',
    '      $key = [Console]::ReadKey($true)',
    '      $ch = $key.KeyChar.ToString().ToUpper()',
    '      if ($ch -eq "T") {',
    '        Write-Host ("[TESTE] Enviando Comanda de Teste para " + $script:selectedPrinter + "...") -ForegroundColor Cyan',
    '        Print-SampleTestTicket',
    '        Write-Host "[OK] Comanda de Teste enviada!" -ForegroundColor Green',
    '      } elseif ($ch -eq "U") {',
    '        Write-Host "[ULTIMO PEDIDO] Buscando ultimo pedido no site..." -ForegroundColor Cyan',
    '        try {',
    '          $r = Invoke-RestMethod -Uri $ordersUrl -Method Get -TimeoutSec 6',
    '          if ($r.documents -and $r.documents.Count -gt 0) {',
    '            $bestDoc = $null',
    '            $bestDt = [DateTime]::MinValue',
    '            foreach ($d in $r.documents) {',
    '              $isPaid = $false',
    '              if ($d.fields.isPaid.booleanValue -eq $true) { $isPaid = $true }',
    '              if ($d.fields.paymentStatus.stringValue -eq "pago") { $isPaid = $true }',
    '              if ($d.fields.paymentMethod.stringValue -and ($d.fields.paymentMethod.stringValue.ToLower().Contains("aprovado") -or $d.fields.paymentMethod.stringValue.ToLower().Contains("stripe"))) { $isPaid = $true }',
    '              if ($isPaid -and $d.fields.createdAt.timestampValue) {',
    '                $dt = [DateTime]::Parse($d.fields.createdAt.timestampValue)',
    '                if ($dt -gt $bestDt) { $bestDt = $dt; $bestDoc = $d }',
    '              }',
    '            }',
    '            if ($bestDoc) {',
    '              try { [Console]::Beep(1000, 200); [Console]::Beep(1500, 250) } catch {}',
    `            if (${copiesCount} -eq 2) {`,
    '              [void](Print-RawComanda (Format-FirestoreOrder $bestDoc $true "VIA 1 - COZINHA / PREPARO"))',
    '              Start-Sleep -Milliseconds 400',
    '              [void](Print-RawComanda (Format-FirestoreOrder $bestDoc $false "VIA 2 - ENTREGA / CLIENTE"))',
    '            } else {',
    '              [void](Print-RawComanda (Format-FirestoreOrder $bestDoc $false ""))',
    '            }',
    '            Send-CloudHeartbeat',
    '            Write-Host "[OK] Ultimo pedido impresso com sucesso!" -ForegroundColor Green',
    '          } else {',
    '            Write-Host "[!] Nenhum pedido encontrado no banco." -ForegroundColor Yellow',
    '          }',
    '        } catch {',
    '          Write-Host "[X] Erro ao buscar ultimo pedido." -ForegroundColor Red',
    '        }',
    '      } elseif ($ch -eq "I") {',
    '        $plist = Get-InstalledPrintersList',
    '        Write-Host ""',
    '        Write-Host "--- IMPRESSORAS INSTALADAS NO WINDOWS ---" -ForegroundColor Yellow',
    '        for ($i = 0; $i -lt $plist.Count; $i++) {',
    '          Write-Host ("  [" + ($i + 1) + "] " + $plist[$i]) -ForegroundColor White',
    '        }',
    '        $sel = Read-Host "Digite o numero da impressora desejada (ou Enter para cancelar)"',
    '        if ($sel -match "^\\d+$") {',
    '          $idx = [int]$sel - 1',
    '          if ($idx -ge 0 -and $idx -lt $plist.Count) {',
    '            $script:selectedPrinter = $plist[$idx]',
    '            Set-Content -Path $printerPrefFile -Value $script:selectedPrinter -Encoding UTF8',
    '            Send-CloudHeartbeat',
    '            Show-Header',
    '            Write-Host ("[OK] Impressora alterada para: " + $script:selectedPrinter) -ForegroundColor Green',
    '          }',
    '        }',
    '      }',
    '    }',
    '  } catch {}',
    '',
    '  if ($bridgeActive -and $pendingAsync -and $pendingAsync.IsCompleted) {',
    '    try {',
    '      $ctx = $listener.EndGetContext($pendingAsync)',
    '      $req = $ctx.Request',
    '      $res = $ctx.Response',
    '      $res.Headers.Add("Access-Control-Allow-Origin", "*")',
    '      $res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")',
    '      $res.Headers.Add("Access-Control-Allow-Headers", "Content-Type")',
    '      $res.Headers.Add("Access-Control-Allow-Private-Network", "true")',
    '',
    '      if ($req.HttpMethod -eq "OPTIONS") {',
    '        $res.StatusCode = 200',
    '        $res.Close()',
    '      } elseif ($req.Url.AbsolutePath -eq "/status") {',
    '        $respObj = @{',
    '          ok = $true',
    '          app = "Impressao Automatica"',
    '          printer = [string]$script:selectedPrinter',
    '          printedCount = [int]$script:printedSessionCount',
    '        }',
    '        $json = $respObj | ConvertTo-Json -Compress',
    '        $buf = [System.Text.Encoding]::UTF8.GetBytes($json)',
    '        $res.ContentType = "application/json; charset=utf-8"',
    '        $res.ContentLength64 = $buf.Length',
    '        $res.OutputStream.Write($buf, 0, $buf.Length)',
    '        $res.Close()',
    '      } elseif ($req.Url.AbsolutePath -eq "/print" -and $req.HttpMethod -eq "POST") {',
    '        $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)',
    '        $bodyStr = $reader.ReadToEnd()',
    '        $reader.Close()',
    '        $payload = $bodyStr | ConvertFrom-Json',
    '        $oid = [string]$payload.orderId',
    '        $force = [bool]$payload.force',
    '        $already = ($oid -and $printedIds.Contains($oid) -and (-not $force))',
    '        if (-not $already) {',
    '          if ($oid) { Save-PrintedId $oid }',
    '          $nowStr = (Get-Date).ToString("HH:mm:ss")',
    '          Write-Host ("[" + $nowStr + "] Imprimindo Comanda #" + $payload.orderNumber + " em " + $script:selectedPrinter + "...") -ForegroundColor Cyan',
    '          try { [Console]::Beep(1200, 200); [Console]::Beep(1600, 300) } catch {}',
    '          [void](Print-RawComanda ([string]$payload.text))',
    '          Send-CloudHeartbeat',
    '          Write-Host ("[" + $nowStr + "] -> Comanda impressa com sucesso!") -ForegroundColor Green',
    '        }',
    '        $respObj = @{',
    '          ok = $true',
    '          skipped = [bool]$already',
    '          printer = [string]$script:selectedPrinter',
    '        }',
    '        $json = $respObj | ConvertTo-Json -Compress',
    '        $buf = [System.Text.Encoding]::UTF8.GetBytes($json)',
    '        $res.ContentType = "application/json; charset=utf-8"',
    '        $res.ContentLength64 = $buf.Length',
    '        $res.OutputStream.Write($buf, 0, $buf.Length)',
    '        $res.Close()',
    '      } else {',
    '        $res.StatusCode = 404',
    '        $res.Close()',
    '      }',
    '    } catch {}',
    '    $pendingAsync = $listener.BeginGetContext($null, $null)',
    '  }',
    '',
    '  if (((Get-Date) - $lastCloudPoll).TotalSeconds -ge 2) {',
    '    $lastCloudPoll = Get-Date',
    '',
    '    try {',
    '      $qDoc = Invoke-RestMethod -Uri $queueUrl -Method Get -TimeoutSec 4',
    '      if ($qDoc.fields -and $qDoc.fields.jobId.stringValue) {',
    '        $jid = $qDoc.fields.jobId.stringValue',
    '        $jtext = $qDoc.fields.text.stringValue',
    '        $jonum = if ($qDoc.fields.orderNumber.stringValue) { $qDoc.fields.orderNumber.stringValue } else { "1" }',
    '        $joid  = if ($qDoc.fields.orderId.stringValue) { $qDoc.fields.orderId.stringValue } else { "" }',
    '        if (-not $printedJobs.Contains($jid) -and $jtext) {',
    '          Save-PrintedJob $jid',
    '          if ($joid) { Save-PrintedId $joid }',
    '          $nowStr = (Get-Date).ToString("HH:mm:ss")',
    '          Write-Host ("[" + $nowStr + "] COMANDA RECEBIDA DO PAINEL - Pedido #" + $jonum + " -> Imprimindo...") -ForegroundColor Cyan',
    '          try { [Console]::Beep(1200, 200); [Console]::Beep(1600, 300) } catch {}',
    '          [void](Print-RawComanda $jtext)',
    '          Send-CloudHeartbeat',
    '          Write-Host ("[" + $nowStr + "] -> Comanda #" + $jonum + " impressa em " + $script:selectedPrinter + "!") -ForegroundColor Green',
    '        }',
    '      }',
    '    } catch {}',
    '',
    '    try {',
    '      $cloudResp = Invoke-RestMethod -Uri $ordersUrl -Method Get -TimeoutSec 5',
    '      if ($cloudResp.documents) {',
    '        foreach ($docItem in $cloudResp.documents) {',
    '          $docId = ($docItem.name -split "/")[-1]',
    '          $statusVal = $docItem.fields.status.stringValue',
    '          if (-not $statusVal) { $statusVal = "recebido" }',
    '',
    '          $isPaid = $false',
    '          if ($docItem.fields.isPaid.booleanValue -eq $true) { $isPaid = $true }',
    '          elseif ($docItem.fields.paymentStatus.stringValue -eq "pago") { $isPaid = $true }',
    '          elseif ($docItem.fields.paymentStatus.stringValue -ne "pendente" -and $docItem.fields.paymentMethod.stringValue -and $docItem.fields.paymentMethod.stringValue.ToLower().Contains("aprovado")) { $isPaid = $true }',
    '',
    '          if ($isPaid -and ($statusVal -eq "recebido" -or $statusVal -eq "preparando") -and (-not $printedIds.Contains($docId))) {',
    '            Save-PrintedId $docId',
    '            $orderNum = if ($docItem.fields.orderNumber.integerValue) { [string]$docItem.fields.orderNumber.integerValue } else { $docId.Substring(0, 4).ToUpper() }',
    '            $clientName = if ($docItem.fields.userName.stringValue) { $docItem.fields.userName.stringValue } else { "Cliente" }',
    '            $nowStr = (Get-Date).ToString("HH:mm:ss")',
    '',
    '            Write-Host ""',
    '            Write-Host "======================================================" -ForegroundColor Green',
    '            Write-Host (" [" + $nowStr + "] PEDIDO PAGO CONFIRMADO! COMANDA #" + $orderNum + " - " + $clientName) -ForegroundColor Green',
    '            Write-Host "======================================================" -ForegroundColor Green',
    '            try { [Console]::Beep(1000, 250); [Console]::Beep(1400, 250); [Console]::Beep(1800, 400) } catch {}',
    '',
    `            if (${copiesCount} -eq 2) {`,
    '              $via1 = Format-FirestoreOrder $docItem $true "VIA 1 - COZINHA / PREPARO"',
    '              $via2 = Format-FirestoreOrder $docItem $false "VIA 2 - ENTREGA / CLIENTE"',
    '              [void](Print-RawComanda $via1)',
    '              Start-Sleep -Milliseconds 450',
    '              [void](Print-RawComanda $via2)',
    '            } else {',
    '              $singleTicket = Format-FirestoreOrder $docItem $false ""',
    '              [void](Print-RawComanda $singleTicket)',
    '            }',
    '',
    '            Send-CloudHeartbeat',
    '            Write-Host (" [" + $nowStr + "] -> Comanda #" + $orderNum + " impressa automaticamente em: " + $script:selectedPrinter) -ForegroundColor Cyan',
    '            Write-Host ""',
    '          }',
    '        }',
    '      }',
    '    } catch {}',
    '  }',
    '',
    '  if (((Get-Date) - $lastHeartbeat).TotalSeconds -ge 15) {',
    '    $lastHeartbeat = Get-Date',
    '    Send-CloudHeartbeat',
    '  }',
    '',
    '  Start-Sleep -Milliseconds 200',
    '}',
  ];

  const psScript = psLines.join('\r\n');

  // Prepend UTF-8 BOM (0xEF, 0xBB, 0xBF) so Windows PowerShell 5.1 reads UTF-8 characters properly
  const rawBytes = new TextEncoder().encode(psScript);
  const bomAndBytes = new Uint8Array(rawBytes.length + 3);
  bomAndBytes[0] = 0xef;
  bomAndBytes[1] = 0xbb;
  bomAndBytes[2] = 0xbf;
  bomAndBytes.set(rawBytes, 3);

  let binary = '';
  for (let i = 0; i < bomAndBytes.length; i++) {
    binary += String.fromCharCode(bomAndBytes[i]);
  }
  const base64Full = btoa(binary);

  // Split Base64 into clean 64-character lines for Windows `certutil -decode`
  const b64Chunks: string[] = [];
  for (let i = 0; i < base64Full.length; i += 64) {
    b64Chunks.push(base64Full.substring(i, i + 64));
  }

  const batLines = [
    '@echo off',
    'chcp 65001 >nul 2>&1',
    'title Impressao Automatica - Nickel Lanches (Sempre Ligado)',
    'color 0A',
    'set "APP_DIR=%APPDATA%\\NickelImpressaoAutomatica"',
    'if not exist "%APP_DIR%" mkdir "%APP_DIR%"',
    'set "PS1_FILE=%APP_DIR%\\NickelAutoPrint.ps1"',
    'set "STARTUP_DIR=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"',
    'copy /y "%~f0" "%APP_DIR%\\Impressao-Automatica-Nickel.bat" >nul 2>&1',
    'if exist "%STARTUP_DIR%" copy /y "%~f0" "%STARTUP_DIR%\\Impressao-Automatica-Nickel.bat" >nul 2>&1',
    'if exist "%USERPROFILE%\\Desktop" copy /y "%~f0" "%USERPROFILE%\\Desktop\\Impressao Automatica - Nickel.bat" >nul 2>&1',
    'del /f /q "%PS1_FILE%" >nul 2>&1',
    'certutil -f -decode "%~f0" "%PS1_FILE%" >nul 2>&1',
    ':LOOP',
    'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PS1_FILE%"',
    'echo.',
    'echo [!] Reconectando Impressao Automatica em 3 segundos...',
    'timeout /t 3 >nul',
    'goto LOOP',
    'exit /b',
    '-----BEGIN CERTIFICATE-----',
    ...b64Chunks,
    '-----END CERTIFICATE-----',
  ];

  return batLines.join('\r\n');
}

/**
 * Triggers download of the Windows "Impressão Automática" application (.bat)
 */
export function downloadWindowsAutoPrintApp(settings: PrinterSettings) {
  const batContent = generateWindowsBridgeBatchScript(settings);
  const blob = new Blob([batContent], { type: 'application/x-bat;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Impressao-Automatica-Nickel.bat';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}


