// ======================================================================
// Thermal Receipt Printing Service for USB & Spooler Printers (POS-80 / POS-58)
// ======================================================================

import { Order, PrinterSettings } from './db';
import { getConnectedUsbPrinter, sendRawToUsbPrinter, buildReceiptEscPos } from './escpos';

/**
 * Generates plain text comanda suitable for clipboard or raw logs
 */
export function generateReceiptText(
  order: Order,
  settings: PrinterSettings,
  isKitchenOnly = false,
  viaTitle?: string
): string {
  const line = '------------------------------------------';
  const dline = '==========================================';
  const out: string[] = [];

  out.push(dline);
  out.push((settings.printHeader || 'NICKEL LANCHES').toUpperCase());
  if (settings.printSubHeader) out.push(settings.printSubHeader.toUpperCase());
  if (settings.printPhone) out.push(`Tel/WhatsApp: ${settings.printPhone}`);
  if (settings.printAddress) out.push(settings.printAddress);
  if (viaTitle) out.push(`[ ${viaTitle.toUpperCase()} ]`);
  out.push(line);

  const orderNum = order.orderNumber || (order.id ? order.id.substring(0, 4).toUpperCase() : '1');
  out.push(`PEDIDO #${orderNum}`);
  if (settings.showPassword && order.id) {
    out.push(`SENHA: ${order.id.substring(0, 4).toUpperCase()}`);
  }

  let dateStr = '';
  if (order.createdAt?.toDate) {
    const d = order.createdAt.toDate();
    dateStr = `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (typeof order.createdAt === 'string') {
    dateStr = order.createdAt;
  } else {
    dateStr = new Date().toLocaleString('pt-BR');
  }
  out.push(`Data/Hora: ${dateStr}`);
  out.push(`Cliente: ${(order.userName || 'Balcao / Cliente').toUpperCase()}`);
  if (settings.showCustomerPhone && order.whatsapp) {
    out.push(`WhatsApp: ${order.whatsapp}`);
  }
  if (settings.showDeliveryAddress && order.address) {
    out.push(`Entrega: ${order.address}${order.region ? ` (${order.region})` : ''}`);
  }
  if (order.receiptNotes) {
    out.push(`Obs. Entrega: ${order.receiptNotes}`);
  }
  out.push(line);

  out.push(isKitchenOnly ? '--- ITENS PARA PREPARO (COZINHA) ---' : '--- ITENS DO PEDIDO ---');
  if (order.items && order.items.length > 0) {
    order.items.forEach((item, idx) => {
      const extrasTotal = item.extras?.reduce((s: number, e: any) => s + (e.price || 0), 0) || 0;
      const itemTotal = (item.price + extrasTotal) * item.quantity;
      if (isKitchenOnly) {
        out.push(`${item.quantity}x ${item.name}`);
      } else {
        out.push(`${item.quantity}x ${item.name.padEnd(24)} R$ ${itemTotal.toFixed(2).replace('.', ',')}`);
      }

      if (item.extras && item.extras.length > 0) {
        out.push(`   + Adicionais: ${item.extras.map((e: any) => e.name).join(', ')}`);
      }
      if (settings.showItemObservations && item.observation && item.observation.trim()) {
        out.push(`   * OBS: ${item.observation.trim().toUpperCase()}`);
      }
    });
  }

  if (!isKitchenOnly) {
    out.push(line);
    if (order.deliveryFee !== undefined && order.deliveryFee > 0) {
      out.push(`Taxa de Entrega: R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}`);
    }
    out.push(`TOTAL DO PEDIDO: R$ ${order.totalPrice.toFixed(2).replace('.', ',')}`);
    if (settings.showPaymentDetails) {
      out.push(`Forma de Pagamento: ${(order.paymentMethod || 'A Confirmar').toUpperCase()}`);
      if (order.changeFor) {
        out.push(`Troco para: R$ ${order.changeFor}`);
      }
      if (order.receiptAuthCode) {
        out.push(`Cod. Autenticacao: ${order.receiptAuthCode}`);
      }
    }
  }

  out.push(line);
  if (settings.printFooter) out.push(settings.printFooter.toUpperCase());
  out.push('ATE A PROXIMA!');
  out.push(dline);

  return out.join('\n');
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
  const paperWidth = is58 ? '54mm' : '78mm';
  const fontSize = 
    settings.fontSize === 'small' ? (is58 ? '10px' : '11px') :
    settings.fontSize === 'large' ? (is58 ? '13px' : '15px') :
    (is58 ? '11px' : '13px');

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
    const extras = item.extras?.reduce((s: number, e: any) => s + (e.price || 0), 0) || 0;
    return sum + ((item.price + extras) * item.quantity);
  }, 0) || order.totalPrice;

  const itemsHtml = (order.items || []).map(item => {
    const extrasTotal = item.extras?.reduce((s: number, e: any) => s + (e.price || 0), 0) || 0;
    const itemTotal = (item.price + extrasTotal) * item.quantity;

    const extrasSnippet = item.extras && item.extras.length > 0
      ? `<div style="padding-left: 10px; font-size: 0.9em; font-weight: normal; margin-top: 2px;">+ Adicionais: ${item.extras.map((e: any) => e.name).join(', ')}</div>`
      : '';

    const obsSnippet = settings.showItemObservations && item.observation && item.observation.trim()
      ? `<div style="padding: 2px 4px; margin-top: 3px; font-weight: bold; background: #eee; border-left: 3px solid #000; text-transform: uppercase; font-size: 0.9em;">⚠ OBS: ${item.observation.trim()}</div>`
      : '';

    return `
      <div style="border-bottom: 1px dashed #666; padding-bottom: 5px; margin-bottom: 5px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span style="flex: 1;">${item.quantity}x ${item.name}</span>
          ${!isKitchenOnly ? `<span style="white-space: nowrap; margin-left: 6px;">R$ ${itemTotal.toFixed(2).replace('.', ',')}</span>` : ''}
        </div>
        ${extrasSnippet}
        ${obsSnippet}
      </div>
    `;
  }).join('');

  const feedCm = (settings.feedLines || 4) * 0.35;

  return `
    <div class="comanda-receipt" style="width: 100%; max-width: ${paperWidth}; margin: 0 auto; padding: 2px 4px; font-family: 'Courier New', Courier, monospace, sans-serif; font-size: ${fontSize}; line-height: 1.25; color: #000; background: #fff; box-sizing: border-box;">
      
      <!-- CABEÇALHO -->
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 6px;">
        <div style="font-weight: 900; font-size: 1.3em; text-transform: uppercase; letter-spacing: -0.5px;">${settings.printHeader || 'NICKEL LANCHES'}</div>
        ${settings.printSubHeader ? `<div style="font-weight: bold; font-size: 0.85em; text-transform: uppercase;">${settings.printSubHeader}</div>` : ''}
        ${settings.printPhone ? `<div style="font-size: 0.85em; font-weight: bold; margin-top: 2px;">${settings.printPhone}</div>` : ''}
        ${settings.printAddress ? `<div style="font-size: 0.75em; color: #333; margin-top: 1px;">${settings.printAddress}</div>` : ''}
        ${viaTitle ? `<div style="display: inline-block; background: #000; color: #fff; font-weight: 900; font-size: 0.8em; padding: 2px 6px; margin-top: 4px; text-transform: uppercase;">${viaTitle}</div>` : ''}
      </div>

      <!-- DADOS DO PEDIDO E CLIENTE -->
      <div style="border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
          <span style="font-weight: 900; font-size: 1.15em;">PEDIDO #${orderNum}</span>
          ${settings.showPassword && order.id ? `<span style="border: 1px solid #000; padding: 1px 4px; font-weight: 900; font-size: 0.85em;">SENHA: ${order.id.substring(0, 4).toUpperCase()}</span>` : ''}
        </div>
        <div style="font-size: 0.85em; color: #333;">Horário: ${dateStr}</div>
        
        <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dotted #888;">
          <div style="font-weight: bold;">Cliente: <span style="font-weight: 900; text-transform: uppercase;">${order.userName || 'Balcão / Cliente'}</span></div>
          ${settings.showCustomerPhone && order.whatsapp ? `<div style="font-size: 0.9em; font-weight: bold;">WhatsApp: ${order.whatsapp}</div>` : ''}
          ${settings.showDeliveryAddress ? `
            <div style="font-size: 0.9em; margin-top: 2px;">
              <span style="font-weight: bold;">Entrega: </span>
              <span>${order.address || 'Retirada no Balcão'}${order.region ? ` (${order.region})` : ''}</span>
            </div>
          ` : ''}
          ${order.receiptNotes ? `
            <div style="margin-top: 4px; padding: 3px 5px; background: #f3f3f3; border: 1px solid #bbb; font-size: 0.85em;">
              <strong>Obs. Entrega: </strong>${order.receiptNotes}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- ITENS -->
      <div style="margin-bottom: 6px;">
        <div style="background: #000; color: #fff; text-align: center; font-weight: 900; font-size: 0.85em; padding: 2px 0; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px;">
          ${isKitchenOnly ? 'PREPARO DA COZINHA' : 'ITENS DO PEDIDO'}
        </div>
        <div>
          ${itemsHtml}
        </div>
      </div>

      <!-- TOTAIS E PAGAMENTO (Apenas se não for cozinha exclusiva) -->
      ${!isKitchenOnly ? `
        <div style="border-top: 2px solid #000; padding-top: 4px; margin-bottom: 6px;">
          ${order.deliveryFee !== undefined && order.deliveryFee > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 0.9em; margin-bottom: 2px;">
              <span>Subtotal:</span>
              <span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9em; margin-bottom: 3px;">
              <span>Taxa de Entrega:</span>
              <span>R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}</span>
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 900; font-size: 1.25em; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 0; margin: 4px 0;">
            <span>TOTAL:</span>
            <span>R$ ${order.totalPrice.toFixed(2).replace('.', ',')}</span>
          </div>

          ${settings.showPaymentDetails ? `
            <div style="font-size: 0.85em; margin-top: 4px;">
              <div>Forma de Pagamento: <strong style="text-transform: uppercase;">${order.paymentMethod || 'A Confirmar'}</strong></div>
              ${order.changeFor ? `<div style="font-weight: 900; margin-top: 2px;">Troco para: R$ ${order.changeFor}</div>` : ''}
              ${order.receiptAuthCode ? `
                <div style="margin-top: 3px; font-size: 0.8em; color: #444; border: 1px solid #ccc; padding: 2px 4px; background: #fafafa;">
                  Autenticação: ${order.receiptAuthCode}
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- RODAPÉ -->
      <div style="text-align: center; border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px;">
        ${settings.printFooter ? `<div style="font-weight: bold; font-size: 0.85em; text-transform: uppercase;">${settings.printFooter}</div>` : ''}
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
  const paperWidth = is58 ? '54mm' : '78mm';

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
      margin: 0;
      size: ${paperWidth} auto;
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
      font-family: 'Courier New', Courier, monospace, sans-serif;
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
        width: ${paperWidth};
      }
    }
    @media print {
      .screen-bar {
        display: none !important;
      }
      .comanda-wrapper {
        width: 100% !important;
        max-width: ${paperWidth} !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
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
 * Universal print handler that supports:
 * 1. WebUSB direct ESC/POS (if connected)
 * 2. Hidden isolated IFrame print (standard browser spooler without breaking the app UI)
 * 3. Popup window print (fallback if iframe printing is sandboxed/blocked)
 */
export async function executeUniversalPrint(
  order: Order,
  settings: PrinterSettings,
  addToast?: (t: { message: string; type: 'success' | 'error' | 'info' | 'warning' }) => void
): Promise<{ success: boolean; method: string }> {

  // 1. WebUSB direct check
  if (settings.connectionMode === 'webusb') {
    const usbStatus = getConnectedUsbPrinter();
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
          addToast({ message: 'Comanda impressa diretamente na PS-80 USB via ESC/POS!', type: 'success' });
        }
        return { success: true, method: 'webusb' };
      } catch (err) {
        console.warn('Falha no WebUSB direto, usando Spooler USB do Sistema:', err);
      }
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
            addToast({ message: 'Comanda enviada para a impressora USB!', type: 'info' });
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

  // 3. Fallback: window.print() or popup window
  try {
    window.print();
    return { success: true, method: 'window_print' };
  } catch (finalErr) {
    console.error('Falha geral no window.print():', finalErr);
    if (addToast) {
      addToast({ message: 'Não foi possível acionar a impressora automaticamente. Verifique se o cabo USB está conectado.', type: 'error' });
    }
    return { success: false, method: 'failed' };
  }
}
