// ======================================================================
// Thermal Receipt Printing Service for USB & Spooler Printers (POS-80 / POS-58)
// ======================================================================

import { Order, PrinterSettings, getCloudBridgeStatus, enqueueCloudPrintJob } from './db';
import { getConnectedUsbPrinter, checkAndAutoReconnectUsbPrinter, sendRawToUsbPrinter, buildReceiptEscPos } from './escpos';

/**
 * Generates plain text comanda suitable for clipboard or raw logs
 */
export function generateReceiptText(
  order: Order,
  settings: PrinterSettings,
  isKitchenOnly = false,
  viaTitle?: string
): string {
  const line = '--------------------------------';
  const dline = '================================';
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
        out.push(`${item.quantity}x ${item.name}`);
        out.push(`   Subtotal: R$ ${itemTotal.toFixed(2).replace('.', ',')}`);
      }

      if (item.extras && item.extras.length > 0) {
        out.push(`   Adicionais:`);
        item.extras.forEach((e: any) => {
          const extraPrice = !isKitchenOnly && e.price > 0 ? ` (+ R$ ${Number(e.price).toFixed(2).replace('.', ',')})` : ' (Incluso)';
          out.push(`   • ${e.name}${extraPrice}`);
        });
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
    const extras = item.extras?.reduce((s: number, e: any) => s + (e.price || 0), 0) || 0;
    return sum + ((item.price + extras) * item.quantity);
  }, 0) || order.totalPrice;

  const itemsHtml = (order.items || []).map(item => {
    const extrasTotal = item.extras?.reduce((s: number, e: any) => s + (e.price || 0), 0) || 0;
    const itemTotal = (item.price + extrasTotal) * item.quantity;

    const extrasSnippet = item.extras && item.extras.length > 0
      ? `
        <div style="padding-left: 8px; margin-top: 4px; font-size: 0.9em; border-left: 2px solid #888; margin-left: 2px; padding-bottom: 2px;">
          <div style="font-weight: 900; text-transform: uppercase; font-size: 0.82em; color: #444; margin-bottom: 2px;">Adicionais:</div>
          ${item.extras.map((e: any) => `
            <div style="padding: 1px 0; font-weight: 600;">
              <div>• ${e.name}</div>
              ${!isKitchenOnly && e.price > 0 ? `<div style="padding-left: 10px; font-size: 0.9em; color: #555;">(+ R$ ${Number(e.price).toFixed(2).replace('.', ',')})</div>` : ''}
            </div>
          `).join('')}
        </div>
      `
      : '';

    const obsSnippet = settings.showItemObservations && item.observation && item.observation.trim()
      ? `<div style="padding: 3px 6px; margin-top: 4px; font-weight: 900; background: #e5e5e5; border-left: 3px solid #000; text-transform: uppercase; font-size: 0.9em; word-break: break-word; line-height: 1.25;">⚠ OBS: ${item.observation.trim()}</div>`
      : '';

    return `
      <div style="border-bottom: 1px dashed #666; padding-bottom: 5px; margin-bottom: 5px; word-break: break-word;">
        <div style="font-weight: 900; font-size: 1.05em; line-height: 1.25; word-break: break-word;">
          ${item.quantity}x ${item.name}
        </div>
        ${!isKitchenOnly ? `
          <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 900; margin-top: 2px; font-size: 0.95em;">
            <span style="font-size: 0.82em; text-transform: uppercase; color: #555;">Subtotal:</span>
            <span style="font-family: monospace; white-space: nowrap;">R$ ${itemTotal.toFixed(2).replace('.', ',')}</span>
          </div>
        ` : ''}
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
        
        <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dotted #888; font-size: 0.95em; line-height: 1.35;">
          <div><span style="font-weight: bold; color: #444;">Cliente: </span><span style="font-weight: 900; text-transform: uppercase;">${order.userName || 'Balcão / Cliente'}</span></div>
          ${settings.showCustomerPhone && order.whatsapp ? `<div style="margin-top: 2px;"><span style="font-weight: bold; color: #444;">WhatsApp: </span><span style="font-weight: bold;">${order.whatsapp}</span></div>` : ''}
          ${settings.showDeliveryAddress ? `
            <div style="margin-top: 4px; padding: 4px 6px; background: #f8f8f8; border: 1px dashed #aaa; border-radius: 2px;">
              <div style="font-weight: 900; text-transform: uppercase; font-size: 0.82em; color: #333;">Endereço de Entrega:</div>
              <div style="font-weight: bold; word-break: break-word; margin-top: 1px;">${order.address || 'Retirada no Balcão'}${order.region ? ` (${order.region})` : ''}</div>
            </div>
          ` : ''}
          ${order.receiptNotes ? `
            <div style="margin-top: 4px; padding: 4px 6px; background: #f3f3f3; border-left: 3px solid #333; font-size: 0.9em; word-break: break-word;">
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
    'function Print-RawComanda([string]$comandaText) {',
    '  $targetPrinter = $script:selectedPrinter',
    '  $useTextOnly = ($targetPrinter -match "Generic|Text Only|Somente Texto")',
    '',
    '  if ($useTextOnly) {',
    '    try {',
    '      $comandaText | Out-Printer -Name $targetPrinter',
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
    '    $script:currentPrintLines = $comandaText -split "\\r?\\n"',
    '    $doc.add_PrintPage({',
    '      param($sender, $ev)',
    '      $is58 = ($targetPrinter -match "58|POS-58|Mini|58mm")',
    '      $fontFamily = "Consolas"',
    `      $testFont = New-Object System.Drawing.Font($fontFamily, ${fontSizePt}, [System.Drawing.FontStyle]::Bold)`,
    '      if ($testFont.Name -ne $fontFamily) {',
    `        $font = New-Object System.Drawing.Font("Courier New", ${fontSizePt}, [System.Drawing.FontStyle]::Bold)`,
    '      } else {',
    '        $font = $testFont',
    '      }',
    '      $brush = [System.Drawing.Brushes]::Black',
    '      $sf = New-Object System.Drawing.StringFormat',
    '      $sf.Trimming = [System.Drawing.StringTrimming]::Word',
    '      $sf.FormatFlags = [System.Drawing.StringFormatFlags]::LineLimit',
    '',
    '      $clipW = [int]($ev.Graphics.VisibleClipBounds.Width)',
    '      $maxPrintW = if ($clipW -gt 20 -and $clipW -lt 400) { $clipW } else { if ($is58) { 180 } else { 260 } }',
    '      $leftMargin = 12',
    '      $usableWidth = [Math]::Max(160, $maxPrintW - ($leftMargin * 2))',
    '',
    '      $y = 6',
    '      foreach ($ln in $script:currentPrintLines) {',
    '        if (-not $ln -or $ln.Trim().Length -eq 0) {',
    '          $y += [int][Math]::Ceiling($font.GetHeight($ev.Graphics) * 0.7)',
    '          continue',
    '        }',
    '        $sz = $ev.Graphics.MeasureString($ln, $font, [int]$usableWidth, $sf)',
    '        $h = [int][Math]::Ceiling($sz.Height)',
    '        $rect = New-Object System.Drawing.RectangleF($leftMargin, $y, $usableWidth, $h + 1)',
    '        $ev.Graphics.DrawString($ln, $font, $brush, $rect, $sf)',
    '        $y += $h + 1',
    '      }',
    '      $ev.HasMorePages = $false',
    '    })',
    '    $doc.Print()',
    '    $script:printedSessionCount++',
    '    return $true',
    '  } catch {',
    '    try {',
    '      if ($targetPrinter -and $targetPrinter -ne "Impressora Padrao do Windows") {',
    '        $comandaText | Out-Printer -Name $targetPrinter',
    '      } else {',
    '        $comandaText | Out-Printer',
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
    '  $userName = if ($f.userName.stringValue) { $f.userName.stringValue.ToUpper() } else { "CLIENTE / BALCAO" }',
    '  $whatsapp = if ($f.whatsapp.stringValue) { $f.whatsapp.stringValue } else { "" }',
    '  $address = if ($f.address.stringValue) { $f.address.stringValue } else { "Retirada no Balcao" }',
    '  $region = if ($f.region.stringValue) { " (" + $f.region.stringValue + ")" } else { "" }',
    '  $payment = if ($f.paymentMethod.stringValue) { $f.paymentMethod.stringValue.ToUpper() } else { "A CONFIRMAR" }',
    '  $changeFor = if ($f.changeFor.stringValue) { $f.changeFor.stringValue } else { "" }',
    '  $notes = if ($f.receiptNotes.stringValue) { $f.receiptNotes.stringValue } else { "" }',
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
    '  $out.Add($dline)',
    `  $out.Add("${headerName}")`,
    `  if ("${subHeader}") { $out.Add("${subHeader}") }`,
    `  if ("${phoneStr}") { $out.Add("Tel/WhatsApp: ${phoneStr}") }`,
    `  if ("${addressStr}") { $out.Add("${addressStr}") }`,
    '  if ($viaLabel) { $out.Add("[ " + $viaLabel + " ]") }',
    '  $out.Add($line)',
    '  $out.Add("PEDIDO #" + $orderNum)',
    '  $out.Add("Data/Hora: " + $dateStr)',
    '  $out.Add($line)',
    '  $out.Add("CLIENTE:")',
    '  $out.Add("  " + $userName)',
    '  if ($whatsapp) { $out.Add("WhatsApp: " + $whatsapp) }',
    '  $out.Add("ENTREGA:")',
    '  $out.Add("  " + $address + $region)',
    '  if ($notes) {',
    '    $out.Add("OBS. ENTREGA:")',
    '    $out.Add("  " + $notes)',
    '  }',
    '  $out.Add($line)',
    '  if ($isKitchen) {',
    '    $out.Add("--- ITENS PARA PREPARO (COZINHA) ---")',
    '  } else {',
    '    $out.Add("--- ITENS DO PEDIDO ---")',
    '  }',
    '',
    '  if ($f.items.arrayValue.values) {',
    '    foreach ($itemVal in $f.items.arrayValue.values) {',
    '      $im = $itemVal.mapValue.fields',
    '      $qty = if ($im.quantity.integerValue) { [int]$im.quantity.integerValue } elseif ($im.quantity.doubleValue) { [int]$im.quantity.doubleValue } else { 1 }',
    '      $iname = if ($im.name.stringValue) { $im.name.stringValue } else { "Item" }',
    '      $iprice = if ($im.price.doubleValue) { [double]$im.price.doubleValue } elseif ($im.price.integerValue) { [double]$im.price.integerValue } else { 0 }',
    '',
    '      $extrasSum = 0',
    '      $extrasLines = New-Object System.Collections.Generic.List[string]',
    '      if ($im.extras.arrayValue.values) {',
    '        foreach ($exVal in $im.extras.arrayValue.values) {',
    '          $em = $exVal.mapValue.fields',
    '          $ename = if ($em.name.stringValue) { $em.name.stringValue } else { "" }',
    '          $eprice = if ($em.price.doubleValue) { [double]$em.price.doubleValue } elseif ($em.price.integerValue) { [double]$em.price.integerValue } else { 0 }',
    '          $extrasSum += $eprice',
    '          if ($ename) {',
    '            if ($isKitchen) {',
    '              $extrasLines.Add("   + " + $ename)',
    '            } else {',
    '              $epStr = if ($eprice -gt 0) { " (+ R$ " + $eprice.ToString("N2") + ")" } else { " (Incluso)" }',
    '              $extrasLines.Add("   + " + $ename + $epStr)',
    '            }',
    '          }',
    '        }',
    '      }',
    '',
    '      $lineTotal = ($iprice + $extrasSum) * $qty',
    '      $out.Add([string]$qty + "x " + $iname)',
    '      if (-not $isKitchen) {',
    '        $out.Add("   Subtotal: R$ " + $lineTotal.ToString("N2"))',
    '      }',
    '      foreach ($el in $extrasLines) { $out.Add($el) }',
    '',
    '      if ($im.observation.stringValue -and $im.observation.stringValue.Trim()) {',
    '        $out.Add("   * OBS: " + $im.observation.stringValue.Trim().ToUpper())',
    '      }',
    '      $out.Add(" - - - - - - - - - - - - - - - -")',
    '    }',
    '  }',
    '',
    '  if (-not $isKitchen) {',
    '    $out.Add($line)',
    '    if ($deliveryFee -gt 0) {',
    '      $out.Add("Taxa de Entrega: R$ " + $deliveryFee.ToString("N2"))',
    '    }',
    '    $out.Add("TOTAL DO PEDIDO:")',
    '    $out.Add("  R$ " + $totalPrice.ToString("N2"))',
    '    $out.Add($line)',
    '    $out.Add("Forma de Pagamento:")',
    '    $out.Add("  " + $payment)',
    '    if ($changeFor) {',
    '      $out.Add("Troco para: R$ " + $changeFor)',
    '    }',
    '  }',
    '',
    '  $out.Add($line)',
    `  $out.Add("${footerStr}")`,
    '  $out.Add("ATE A PROXIMA!")',
    '  $out.Add($dline)',
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
    '      $dt = [DateTime]::MinValue',
    '      if ($d.fields.createdAt.timestampValue) {',
    '        try { $dt = [DateTime]::Parse($d.fields.createdAt.timestampValue).ToLocalTime() } catch {}',
    '      }',
    '      if ($st -eq "recebido" -and $dt -gt $newestTime) {',
    '        $newestTime = $dt',
    '        $newestRecebido = $d',
    '      }',
    '      Save-PrintedId $did',
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
    '            $bestDoc = $r.documents[0]',
    '            $bestDt = [DateTime]::MinValue',
    '            foreach ($d in $r.documents) {',
    '              if ($d.fields.createdAt.timestampValue) {',
    '                $dt = [DateTime]::Parse($d.fields.createdAt.timestampValue)',
    '                if ($dt -gt $bestDt) { $bestDt = $dt; $bestDoc = $d }',
    '              }',
    '            }',
    '            try { [Console]::Beep(1000, 200); [Console]::Beep(1500, 250) } catch {}',
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
    '          if ($statusVal -eq "recebido" -and (-not $printedIds.Contains($docId))) {',
    '            Save-PrintedId $docId',
    '            $orderNum = if ($docItem.fields.orderNumber.integerValue) { [string]$docItem.fields.orderNumber.integerValue } else { $docId.Substring(0, 4).ToUpper() }',
    '            $clientName = if ($docItem.fields.userName.stringValue) { $docItem.fields.userName.stringValue } else { "Cliente" }',
    '            $nowStr = (Get-Date).ToString("HH:mm:ss")',
    '',
    '            Write-Host ""',
    '            Write-Host "======================================================" -ForegroundColor Yellow',
    '            Write-Host (" [" + $nowStr + "] NOVO PEDIDO NO SITE! COMANDA #" + $orderNum + " - " + $clientName) -ForegroundColor Green',
    '            Write-Host "======================================================" -ForegroundColor Yellow',
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


