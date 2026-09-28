// ======================================================================
// ESC/POS & WebUSB Driver for PS-80 / POS-80 Thermal Receipt Printers
// ======================================================================

import { Order, PrinterSettings } from './db';

// WebUSB Type declarations for TypeScript without @types/w3c-web-usb
export interface USBEndpointDef {
  endpointNumber: number;
  direction: 'in' | 'out';
  type: 'bulk' | 'interrupt' | 'isochronous';
}

export interface USBAlternateInterfaceDef {
  endpoints: USBEndpointDef[];
}

export interface USBInterfaceDef {
  interfaceNumber: number;
  alternates: USBAlternateInterfaceDef[];
}

export interface USBConfigurationDef {
  interfaces: USBInterfaceDef[];
}

export interface USBDeviceDef {
  opened: boolean;
  productName?: string;
  vendorId: number;
  productId: number;
  configurations: USBConfigurationDef[];
  configuration: USBConfigurationDef | null;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<{ status: string; bytesWritten: number }>;
}

// Normalizes Portuguese text to ASCII characters suitable for thermal printer code tables
export function normalizeEscPosText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\n\r\t]/g, '');
}

export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  // ESC @: Initialize printer
  init(): this {
    this.buffer.push(0x1B, 0x40);
    return this;
  }

  // Alignment: 0 = Left, 1 = Center, 2 = Right
  align(alignment: 'left' | 'center' | 'right'): this {
    const code = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0;
    this.buffer.push(0x1B, 0x61, code);
    return this;
  }

  bold(enable: boolean): this {
    this.buffer.push(0x1B, 0x45, enable ? 1 : 0);
    return this;
  }

  // Size: normal, double-height, double-width, double-both
  textSize(size: 'normal' | 'large' | 'title'): this {
    if (size === 'title') {
      // Double height & double width
      this.buffer.push(0x1D, 0x21, 0x11);
    } else if (size === 'large') {
      // Double height
      this.buffer.push(0x1D, 0x21, 0x01);
    } else {
      // Normal
      this.buffer.push(0x1D, 0x21, 0x00);
    }
    return this;
  }

  text(str: string): this {
    const clean = normalizeEscPosText(str);
    for (let i = 0; i < clean.length; i++) {
      this.buffer.push(clean.charCodeAt(i));
    }
    return this;
  }

  textLine(str: string): this {
    this.text(str);
    this.buffer.push(0x0A);
    return this;
  }

  emptyLine(count: number = 1): this {
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0A);
    }
    return this;
  }

  divider(char: string = '-', length: number = 48): this {
    const line = char.repeat(length);
    this.align('left');
    this.bold(false);
    this.textSize('normal');
    this.textLine(line);
    return this;
  }

  // Two columns: Left aligned and Right aligned text on same line (e.g. Item & Price)
  twoColumns(left: string, right: string, totalWidth: number = 48): this {
    const cleanLeft = normalizeEscPosText(left);
    const cleanRight = normalizeEscPosText(right);
    const spacesNeeded = totalWidth - (cleanLeft.length + cleanRight.length);
    if (spacesNeeded <= 0) {
      this.textLine(cleanLeft);
      this.align('right');
      this.textLine(cleanRight);
      this.align('left');
    } else {
      this.textLine(cleanLeft + ' '.repeat(spacesNeeded) + cleanRight);
    }
    return this;
  }

  // Buzzer beep for alert
  beep(): this {
    this.buffer.push(0x1B, 0x42, 0x02, 0x02);
    return this;
  }

  // Cut paper: partial or full
  cut(feedLines: number = 4): this {
    // Feed lines before cutting
    for (let i = 0; i < feedLines; i++) {
      this.buffer.push(0x0A);
    }
    // GS V 66 0 (feed and cut) or GS V 1 (partial cut)
    this.buffer.push(0x1D, 0x56, 0x42, 0x00);
    return this;
  }

  // Open cash drawer (RJ11 connected to POS-80)
  openCashDrawer(): this {
    this.buffer.push(0x1B, 0x70, 0x00, 0x19, 0xFA);
    return this;
  }

  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

// Builds the full receipt bytes for PS-80 USB printing
export function buildReceiptEscPos(
  order: Order,
  settings: PrinterSettings,
  isKitchenOnly: boolean = false,
  viaTitle?: string
): Uint8Array {
  const b = new EscPosBuilder();
  const width = settings.printerType === 'thermal_58' ? 32 : 48;

  // Header
  b.align('center').bold(true).textSize('title').textLine(settings.printHeader || 'NICKEL LANCHES');
  b.textSize('normal').bold(false);
  if (settings.printSubHeader) b.textLine(settings.printSubHeader);
  if (settings.printPhone) b.textLine(`Tel/WhatsApp: ${settings.printPhone}`);
  if (settings.printAddress) b.textLine(settings.printAddress);

  if (viaTitle) {
    b.emptyLine(1);
    b.bold(true).textSize('large').textLine(`[ ${viaTitle} ]`).textSize('normal').bold(false);
  }

  b.divider('=', width);

  // Order identification
  b.align('left');
  if (settings.showOrderNumber) {
    const num = order.orderNumber ? `#${order.orderNumber}` : `#${order.id ? order.id.substring(0, 4).toUpperCase() : '1'}`;
    b.bold(true).textSize('large').twoColumns(`PEDIDO ${num}`, order.id ? `SENHA: ${order.id.substring(0, 4).toUpperCase()}` : '', width);
    b.textSize('normal').bold(false);
  }

  const timeStr = (() => {
    if (order.createdAt?.toDate) {
      const d = order.createdAt.toDate();
      return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  })();
  b.textLine(`Data/Hora: ${timeStr}`);

  // Customer Details
  b.divider('-', width);
  b.bold(true).textLine(`Cliente: ${order.userName || 'Cliente'}`);
  b.bold(false);
  if (settings.showCustomerPhone && order.whatsapp) {
    b.textLine(`WhatsApp: ${order.whatsapp}`);
  }
  if (settings.showDeliveryAddress) {
    b.textLine(`Entrega: ${order.address || 'Retirada no Balcao'}`);
    if (order.region && !order.address?.includes(order.region)) {
      b.textLine(`Bairro/Regiao: ${order.region}`);
    }
  }
  if (order.receiptNotes) {
    b.textLine(`Obs. Entrega: ${order.receiptNotes}`);
  }

  // Items
  b.divider('=', width);
  b.align('center').bold(true).textLine(isKitchenOnly ? '--- PREPARO COZINHA ---' : '--- ITENS DO PEDIDO ---').align('left').bold(false);
  b.divider('-', width);

  let subtotal = 0;
  order.items?.forEach(item => {
    const extrasTotal = item.extras?.reduce((s: number, e: any) => s + (e.price || 0), 0) || 0;
    const itemTotal = (item.price + extrasTotal) * item.quantity;
    subtotal += itemTotal;

    const itemLabel = `${item.quantity}x ${item.name}`;
    const priceLabel = !isKitchenOnly ? `R$ ${itemTotal.toFixed(2).replace('.', ',')}` : '';

    b.bold(true).twoColumns(itemLabel, priceLabel, width).bold(false);

    if (item.extras && item.extras.length > 0) {
      const extrasStr = '+ ' + item.extras.map((e: any) => e.name).join(', ');
      b.textLine(`   ${extrasStr}`);
    }

    if (settings.showItemObservations && item.observation && item.observation.trim()) {
      b.bold(true).textLine(`   ** OBS: ${item.observation.trim()} **`).bold(false);
    }
    b.emptyLine(1);
  });

  // Financials if not kitchen only
  if (!isKitchenOnly) {
    b.divider('-', width);
    if (order.deliveryFee && order.deliveryFee > 0) {
      b.twoColumns('Subtotal:', `R$ ${subtotal.toFixed(2).replace('.', ',')}`, width);
      b.twoColumns('Taxa de Entrega:', `R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}`, width);
    }
    b.bold(true).textSize('large').twoColumns('TOTAL:', `R$ ${order.totalPrice.toFixed(2).replace('.', ',')}`, width).textSize('normal').bold(false);

    if (settings.showPaymentDetails) {
      b.divider('-', width);
      b.textLine(`Forma de Pagamento: ${order.paymentMethod || 'A Confirmar'}`);
      if (order.changeFor) {
        b.bold(true).textLine(`Troco para: R$ ${order.changeFor}`).bold(false);
      }
      if (order.receiptAuthCode) {
        b.textLine(`Cod. Autenticacao: ${order.receiptAuthCode}`);
      }
    }
  }

  // Footer
  b.divider('=', width);
  b.align('center');
  if (settings.printFooter) {
    b.textLine(settings.printFooter);
  }
  b.textLine('*** SISTEMA NICKEL LANCHES ***');

  // Cut paper and feed
  b.cut(settings.feedLines || 4);

  return b.build();
}

// ======================================================================
// WebUSB Device Manager for POS-80 / PS-80
// ======================================================================

export interface UsbPrinterStatus {
  connected: boolean;
  deviceName?: string;
  vendorId?: number;
  productId?: number;
  error?: string;
}

let activeUsbDevice: USBDeviceDef | null = null;
let activeOutEndpoint: number | null = null;

export const isWebUsbSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'usb' in (navigator as any);
};

export const getConnectedUsbPrinter = (): UsbPrinterStatus => {
  if (activeUsbDevice && activeUsbDevice.opened) {
    return {
      connected: true,
      deviceName: activeUsbDevice.productName || 'Impressora Térmica PS-80 USB',
      vendorId: activeUsbDevice.vendorId,
      productId: activeUsbDevice.productId
    };
  }
  return { connected: false };
};

export const connectUsbPrinter = async (): Promise<UsbPrinterStatus> => {
  if (!isWebUsbSupported()) {
    throw new Error('WebUSB não é suportado neste navegador. Use Google Chrome ou Microsoft Edge no PC/Notebook.');
  }

  try {
    // Request any USB device or filter by common thermal printer vendors
    const device: USBDeviceDef = await (navigator as any).usb.requestDevice({
      filters: [] // Empty allows the user to select the PS-80 USB device from browser prompt
    });

    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    // Find the printer interface with an OUT bulk endpoint
    let foundInterface = -1;
    let foundEndpoint = -1;

    for (const conf of device.configurations) {
      for (const iface of conf.interfaces) {
        for (const alt of iface.alternates) {
          for (const ep of alt.endpoints) {
            if (ep.direction === 'out' && (ep.type === 'bulk' || ep.type === 'interrupt')) {
              foundInterface = iface.interfaceNumber;
              foundEndpoint = ep.endpointNumber;
              break;
            }
          }
          if (foundEndpoint !== -1) break;
        }
        if (foundEndpoint !== -1) break;
      }
      if (foundEndpoint !== -1) break;
    }

    if (foundInterface === -1 || foundEndpoint === -1) {
      // Fallback default
      foundInterface = 0;
      foundEndpoint = 1;
    }

    try {
      await device.claimInterface(foundInterface);
    } catch (e) {
      console.warn('Interface claim notice:', e);
    }

    activeUsbDevice = device;
    activeOutEndpoint = foundEndpoint;

    return {
      connected: true,
      deviceName: device.productName || 'Impressora PS-80 USB',
      vendorId: device.vendorId,
      productId: device.productId
    };
  } catch (err: any) {
    console.error('Erro ao conectar via WebUSB:', err);
    throw err;
  }
};

export const disconnectUsbPrinter = async () => {
  if (activeUsbDevice) {
    try {
      await activeUsbDevice.close();
    } catch (_) {}
    activeUsbDevice = null;
    activeOutEndpoint = null;
  }
};

export const sendRawToUsbPrinter = async (data: Uint8Array): Promise<boolean> => {
  if (!activeUsbDevice || !activeUsbDevice.opened) {
    throw new Error('Impressora USB não conectada. Conecte a PS-80 antes de imprimir.');
  }
  const ep = activeOutEndpoint || 1;
  const result = await activeUsbDevice.transferOut(ep, data);
  return result.status === 'ok';
};
