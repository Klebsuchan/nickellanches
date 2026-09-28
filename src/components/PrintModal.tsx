import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Printer, 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Usb, 
  FileText, 
  Info, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Order, PrinterSettings } from '../lib/db';
import { 
  generateReceiptText, 
  generateReceiptHtml, 
  executeUniversalPrint, 
  buildCompletePrintPageHtml 
} from '../lib/printerService';
import { 
  isWebUsbSupported, 
  connectUsbPrinter, 
  getConnectedUsbPrinter, 
  sendRawToUsbPrinter, 
  buildReceiptEscPos,
  UsbPrinterStatus 
} from '../lib/escpos';
import { useToast } from './Toast';
import { playSound } from '../lib/audio';

interface PrintModalProps {
  order: Order | null;
  settings: PrinterSettings;
  onClose: () => void;
}

export default function PrintModal({ order, settings, onClose }: PrintModalProps) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [usbStatus, setUsbStatus] = useState<UsbPrinterStatus>(() => getConnectedUsbPrinter());
  const [activeVia, setActiveVia] = useState<'all' | 'kitchen' | 'delivery'>('all');

  if (!order) return null;

  const is58 = settings.printerType === 'thermal_58';
  const paperLabel = is58 ? '58mm (Bobina Pequena)' : '80mm (Bobina Padrão PS-80)';

  const handlePrint = async () => {
    setIsPrinting(true);
    playSound('coin');
    try {
      await executeUniversalPrint(order, settings, addToast);
    } catch (e: any) {
      console.error(e);
      addToast({ message: 'Erro ao imprimir. Tente abrir em Nova Janela.', type: 'error' });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleOpenNewWindow = () => {
    playSound('coin');
    const pageHtml = buildCompletePrintPageHtml(order, settings);
    const win = window.open('', '_blank', 'width=440,height=700,menubar=no,toolbar=no');
    if (win) {
      win.document.open();
      win.document.write(pageHtml);
      win.document.close();
      addToast({ message: 'Janela de impressão aberta! Pressione CTRL+P ou clique no botão do topo.', type: 'success' });
    } else {
      addToast({ message: 'O navegador bloqueou a janela pop-up. Permita pop-ups para este site.', type: 'warning' });
    }
  };

  const handleConnectUsb = async () => {
    if (!isWebUsbSupported()) {
      addToast({ 
        message: 'Seu navegador não suporta WebUSB. Use o Google Chrome no Windows/Notebook.', 
        type: 'warning' 
      });
      return;
    }

    try {
      const status = await connectUsbPrinter();
      setUsbStatus(status);
      playSound('powerup');
      addToast({ 
        message: `Impressora USB Conectada: ${status.deviceName}!`, 
        type: 'success' 
      });
    } catch (err: any) {
      addToast({ 
        message: err.message || 'Falha ao conectar via USB. Verifique o cabo e selecione a impressora.', 
        type: 'error' 
      });
    }
  };

  const handleDirectWebUsbPrint = async () => {
    if (!usbStatus.connected) {
      await handleConnectUsb();
      return;
    }

    setIsPrinting(true);
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
      playSound('powerup');
      addToast({ message: 'Comanda enviada diretamente para a impressora USB!', type: 'success' });
    } catch (e: any) {
      console.error(e);
      addToast({ message: 'Erro no envio direto USB: ' + (e.message || 'Verifique o cabo'), type: 'error' });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleCopyText = () => {
    const text = generateReceiptText(order, settings, activeVia === 'kitchen', activeVia === 'kitchen' ? 'COZINHA' : undefined);
    navigator.clipboard.writeText(text);
    setCopied(true);
    playSound('coin');
    setTimeout(() => setCopied(false), 2500);
    addToast({ message: 'Texto da comanda copiado para a área de transferência!', type: 'success' });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-400 text-stone-900 rounded-xl shadow-sm">
              <Printer size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black uppercase tracking-tight">
                  Imprimir Comanda #{order.orderNumber || (order.id ? order.id.substring(0, 4) : '1')}
                </h3>
                <span className="bg-stone-800 text-yellow-400 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-yellow-400/30">
                  {paperLabel}
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium">
                Pronta para Impressoras Térmicas USB (POS-80, POS-58, Elgin, Bematech, Epson)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-stone-50/50">
          {/* Coluna Esquerda: Ações e Status USB */}
          <div className="md:col-span-6 space-y-4">
            
            {/* Cartão de Ação Primária: Imprimir */}
            <div className="bg-white p-5 rounded-2xl border-2 border-yellow-400/80 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-stone-700">
                  Impressão USB
                </span>
                <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">
                  Recomendado
                </span>
              </div>

              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-black uppercase tracking-wider py-4 px-4 rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {isPrinting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Enviando Comanda...</span>
                  </>
                ) : (
                  <>
                    <Printer size={20} />
                    <span>Imprimir Agora na USB</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleOpenNewWindow}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200"
                  title="Abre a comanda em nova aba/janela limpa"
                >
                  <ExternalLink size={14} />
                  <span>Nova Janela</span>
                </button>

                <button
                  onClick={handleCopyText}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200"
                  title="Copia a comanda em texto puro"
                >
                  {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>
            </div>

            {/* Conexão Direta WebUSB (ESC/POS) */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Usb size={16} className={usbStatus.connected ? 'text-green-600' : 'text-stone-400'} />
                  <span className="text-xs font-bold uppercase text-stone-800">
                    Modo Direto USB (Corte Automático)
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${usbStatus.connected ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-500'}`}>
                  {usbStatus.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                {usbStatus.connected ? (
                  <span className="text-stone-700 font-medium">
                    Conectado a <strong>{usbStatus.deviceName}</strong>. Envia comandos ESC/POS diretos sem abrir o diálogo do navegador.
                  </span>
                ) : (
                  <span>
                    Conecte o cabo USB da impressora no computador e clique abaixo para vincular. Funciona no Google Chrome ou Edge.
                  </span>
                )}
              </p>

              {usbStatus.connected ? (
                <button
                  onClick={handleDirectWebUsbPrint}
                  disabled={isPrinting}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-yellow-400 font-bold text-xs py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Sparkles size={14} />
                  <span>Imprimir Direto via ESC/POS (Sem Diálogo)</span>
                </button>
              ) : (
                <button
                  onClick={handleConnectUsb}
                  className="w-full bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 font-bold text-xs py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Usb size={14} />
                  <span>Localizar e Conectar Impressora USB</span>
                </button>
              )}
            </div>

            {/* Dica para Impressoras USB Térmicas */}
            <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-2xl text-xs space-y-1.5 text-stone-700">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Info size={15} className="text-amber-600 shrink-0" />
                <span>Dica de Configuração do Navegador (Chrome/Edge):</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-stone-600">
                <li>Em <strong>Destino</strong>: Selecione sua impressora USB (ex: <em>POS-80</em>, <em>POS-58</em> ou <em>Generic Text</em>).</li>
                <li>Em <strong>Mais Definições &gt; Margens</strong>: Selecione <strong>Nenhuma</strong>.</li>
                <li>Desmarque a caixa <strong>Cabeçalhos e rodapés</strong>.</li>
              </ul>
            </div>

          </div>

          {/* Coluna Direita: Prévia Visual Exata da Comanda */}
          <div className="md:col-span-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1">
                <FileText size={14} /> Prévia da Bobina ({is58 ? '58mm' : '80mm'})
              </span>
              {settings.printCopies === 2 && (
                <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  Imprime 2 Vias (Cozinha + Entrega)
                </span>
              )}
            </div>

            <div className="bg-stone-200 p-3 rounded-2xl max-h-[480px] overflow-y-auto flex justify-center shadow-inner border border-stone-300">
              <div 
                className="bg-white p-3 shadow-md rounded-sm font-mono text-black w-full"
                style={{ maxWidth: is58 ? '54mm' : '78mm' }}
                dangerouslySetInnerHTML={{
                  __html: settings.printCopies === 2 
                    ? `
                      ${generateReceiptHtml(order, settings, true, 'VIA 1 - COZINHA')}
                      <div style="border-bottom: 2px dashed #000; margin: 15px 0;"></div>
                      ${generateReceiptHtml(order, settings, false, 'VIA 2 - ENTREGA')}
                    `
                    : generateReceiptHtml(order, settings, false)
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span>Tamanho configurado: <strong>{settings.printerType === 'thermal_58' ? 'Bobina 58mm' : 'Bobina 80mm'}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-stone-700 hover:text-stone-900 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
