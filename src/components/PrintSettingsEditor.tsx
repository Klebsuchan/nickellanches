import React, { useState, useEffect } from 'react';
import { 
  Printer, Save, CheckCircle2, Sliders, FileText, Sparkles, HelpCircle, 
  ExternalLink, RefreshCw, Volume2, ShieldCheck, ChevronRight, Usb, 
  Scissors, Zap, AlertCircle, Check, Terminal
} from 'lucide-react';
import { PrinterSettings, DEFAULT_PRINTER_SETTINGS, Order } from '../lib/db';
import { 
  isWebUsbSupported, connectUsbPrinter, disconnectUsbPrinter, 
  getConnectedUsbPrinter, sendRawToUsbPrinter, buildReceiptEscPos, UsbPrinterStatus 
} from '../lib/escpos';
import { useToast } from './Toast';
import PrintableReceipt from './PrintableReceipt';

interface PrintSettingsEditorProps {
  settings: PrinterSettings;
  setSettings: (s: PrinterSettings) => void;
  onSaveSettings: (s: PrinterSettings) => Promise<void>;
  onTestPrint: () => void;
}

const SAMPLE_TEST_ORDER: Order = {
  id: 'NKL849',
  orderNumber: 1,
  createdAt: { toDate: () => new Date() },
  userName: 'Braian Kleber',
  whatsapp: '(54) 99106-4604',
  address: 'Roberto Dalla Lana, 332 - Petrópolis',
  region: 'Passo Fundo',
  paymentMethod: 'Pix',
  receiptAuthCode: 'AUT-NKL-PIX-9821',
  receiptTimestamp: 'Hoje às 19:26',
  receiptNotes: 'Tocar a campainha duas vezes, portão preto.',
  deliveryFee: 6.00,
  totalPrice: 95.00,
  totalPoints: 120,
  items: [
    {
      name: 'Cachorro Quente Tradicional',
      price: 39.00,
      quantity: 1,
      extras: [{ name: 'Uma carne a mais', price: 6.00 }, { name: 'Mussarela', price: 0 }],
      observation: 'Caprichar no molho especial'
    },
    {
      name: 'Xis Especial',
      price: 25.00,
      quantity: 2,
      extras: [],
      observation: '1 sem tomate e 1 bem prensado'
    }
  ]
};

export default function PrintSettingsEditor({ settings, setSettings, onSaveSettings, onTestPrint }: PrintSettingsEditorProps) {
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activePreviewVia, setActivePreviewVia] = useState<'cozinha' | 'entrega' | 'unica'>('unica');
  const [showGuide, setShowGuide] = useState(false);
  
  // WebUSB Direct State
  const [usbStatus, setUsbStatus] = useState<UsbPrinterStatus>(() => getConnectedUsbPrinter());
  const [isConnectingUsb, setIsConnectingUsb] = useState(false);
  const [isSendingUsb, setIsSendingUsb] = useState(false);

  useEffect(() => {
    setUsbStatus(getConnectedUsbPrinter());
  }, []);

  const handleConnectUsb = async () => {
    if (!isWebUsbSupported()) {
      addToast({
        title: 'Navegador incompatível com WebUSB',
        message: 'A conexão direta USB requer Google Chrome ou Microsoft Edge no computador.',
        type: 'warning'
      });
      return;
    }

    setIsConnectingUsb(true);
    try {
      const status = await connectUsbPrinter();
      setUsbStatus(status);
      setSettings({
        ...settings,
        printerModel: 'ps80',
        printerType: 'thermal_80',
        connectionMode: 'webusb'
      });
      addToast({
        title: 'PS-80 USB Conectada!',
        message: `Dispositivo ${status.deviceName || 'PS-80'} conectado via cabo USB com sucesso.`,
        type: 'success'
      });
    } catch (e: any) {
      if (e.name !== 'NotFoundError') {
        console.error('Erro ao parear USB:', e);
        addToast({
          title: 'Não foi possível conectar via USB',
          message: 'Verifique se o cabo está conectado ou use o modo Spooler / Driver do Windows.',
          type: 'info'
        });
      }
    } finally {
      setIsConnectingUsb(false);
    }
  };

  const handleDisconnectUsb = async () => {
    await disconnectUsbPrinter();
    setUsbStatus({ connected: false });
    setSettings({ ...settings, connectionMode: 'spooler' });
    addToast({ message: 'Impressora USB desconectada.', type: 'info' });
  };

  const handleTestDirectUsb = async () => {
    if (!usbStatus.connected) {
      addToast({
        title: 'Impressora Desconectada',
        message: 'Clique em "Conectar PS-80 via USB" primeiro ou use "Testar Impressão (Spooler)".',
        type: 'warning'
      });
      return;
    }

    setIsSendingUsb(true);
    try {
      const rawData = buildReceiptEscPos(
        SAMPLE_TEST_ORDER,
        settings,
        settings.printCopies === 2 && activePreviewVia === 'cozinha',
        settings.printCopies === 2
          ? activePreviewVia === 'cozinha'
            ? 'VIA 1 - COZINHA'
            : 'VIA 2 - ENTREGA'
          : undefined
      );

      await sendRawToUsbPrinter(rawData);
      addToast({
        title: 'Comanda Enviada!',
        message: 'Comando ESC/POS enviado diretamente para a PS-80 USB.',
        type: 'success'
      });
    } catch (e: any) {
      console.error('Erro ao enviar direto USB:', e);
      addToast({
        title: 'Falha no envio direto',
        message: 'Dica: Você também pode imprimir pelo modo padrão (Spooler do Windows).',
        type: 'warning'
      });
    } finally {
      setIsSendingUsb(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveSettings(settings);
      addToast({
        title: 'Impressora Configurada!',
        message: 'As preferências da PS-80 USB foram salvas e sincronizadas.',
        type: 'success'
      });
    } catch (e) {
      addToast({
        title: 'Erro ao salvar',
        message: 'Não foi possível salvar na nuvem, salvo no navegador.',
        type: 'warning'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Deseja restaurar as configurações padrão da impressora?')) {
      setSettings(DEFAULT_PRINTER_SETTINGS);
      addToast({ message: 'Configurações redefinidas para o padrão da PS-80.', type: 'info' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-yellow-400 text-black rounded-xl">
              <Printer size={24} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-display uppercase font-bold text-stone-900 tracking-tight leading-none">
                  Configuração da Impressora PS-80
                </h2>
                <span className="bg-stone-900 text-yellow-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Usb size={11} /> USB 80mm
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium mt-1">
                Otimizada para sua impressora térmica PS-80 / POS-80 via cabo USB (ESC/POS e Spooler).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold uppercase rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors text-stone-700"
          >
            <HelpCircle size={16} className="text-stone-500" /> Guia USB PS-80
          </button>
          
          <button
            onClick={onTestPrint}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase rounded-xl border-2 border-stone-300 bg-stone-100 hover:bg-stone-200 transition-colors text-stone-800 shadow-sm"
          >
            <Printer size={16} /> Testar Impressão
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase rounded-xl bg-stone-900 text-yellow-400 hover:bg-stone-800 transition-colors shadow-md disabled:opacity-50"
          >
            <Save size={16} /> {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Guide accordion if open */}
      {showGuide && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-black text-lg text-yellow-950 uppercase flex items-center gap-2">
              <Sparkles size={20} className="text-yellow-600" /> Guia Prático: Como Usar a Impressora PS-80 USB
            </h3>
            <button onClick={() => setShowGuide(false)} className="text-yellow-800 font-bold text-xs uppercase hover:underline">
              Fechar Guia
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-yellow-900 font-medium">
            <div className="bg-white/90 p-4 rounded-xl border border-yellow-200">
              <div className="font-bold text-sm mb-1 text-black flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-yellow-400 text-black flex items-center justify-center text-[10px] font-black">1</span>
                Conexão USB no PC
              </div>
              <p>Conecte o cabo USB da sua <strong>PS-80</strong> no computador. O Windows instala o driver padrão POS-80 / ZJ-80 automaticamente. Se precisar, selecione ela como padrão.</p>
            </div>

            <div className="bg-white/90 p-4 rounded-xl border border-yellow-200">
              <div className="font-bold text-sm mb-1 text-black flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-yellow-400 text-black flex items-center justify-center text-[10px] font-black">2</span>
                Margens e Cabeçalhos
              </div>
              <p>Na tela de impressão do navegador, defina o tamanho como <strong>80mm (ou 80 x 297mm)</strong>, em Margens marque <strong>"Nenhuma"</strong> e desmarque <strong>"Cabeçalhos e rodapés"</strong>.</p>
            </div>

            <div className="bg-white/90 p-4 rounded-xl border border-yellow-200">
              <div className="font-bold text-sm mb-1 text-black flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-yellow-400 text-black flex items-center justify-center text-[10px] font-black">3</span>
                Impressão Instantânea (Kiosk)
              </div>
              <p>Para imprimir automaticamente assim que o pedido chega no Kanban sem pedir confirmação, crie um atalho do Chrome com a flag <code className="bg-yellow-200 px-1 py-0.5 rounded font-mono">--kiosk-printing</code>.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Settings (Left) + Live Ticket Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Configuration Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* CARD PS-80 USB SPECIAL STATUS & HARDWARE CONNECTION */}
          <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white p-6 rounded-2xl border-2 border-stone-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-400 text-black rounded-xl shadow-md">
                  <Usb size={22} className="stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white uppercase text-base tracking-wide">
                      Impressora PS-80 USB
                    </h3>
                    <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      Pronta
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Bobina térmica padrão 80mm • Protocolo ESC/POS • Guilhotina automática
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-700 text-xs">
                <span className={`w-2 h-2 rounded-full ${usbStatus.connected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></span>
                <span className="font-bold text-stone-300">
                  {usbStatus.connected ? 'WebUSB Conectado' : 'Spooler USB Ativo'}
                </span>
              </div>
            </div>

            {/* Mode selection: Driver/Spooler vs Direct WebUSB */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Spooler Mode (Standard) */}
              <div 
                onClick={() => setSettings({ ...settings, connectionMode: 'spooler' })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  settings.connectionMode !== 'webusb'
                    ? 'border-yellow-400 bg-stone-800/90 shadow-md ring-2 ring-yellow-400/20'
                    : 'border-stone-800 bg-stone-900/60 hover:border-stone-700 opacity-75'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-black text-xs uppercase text-yellow-400 flex items-center gap-1.5">
                    <Printer size={15} /> Driver USB do Sistema
                  </span>
                  {settings.connectionMode !== 'webusb' && <Check size={14} className="text-yellow-400 stroke-[3]" />}
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Imprime direto pelo driver padrão da PS-80 no Windows/Mac com suporte a modo silencioso (Kiosk).
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTestPrint();
                    }}
                    className="w-full py-1.5 bg-stone-700 hover:bg-stone-600 text-white rounded-lg text-xs font-bold uppercase transition-colors"
                  >
                    Testar pelo Driver
                  </button>
                </div>
              </div>

              {/* Direct WebUSB Mode */}
              <div 
                onClick={() => setSettings({ ...settings, connectionMode: 'webusb' })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  settings.connectionMode === 'webusb'
                    ? 'border-yellow-400 bg-stone-800/90 shadow-md ring-2 ring-yellow-400/20'
                    : 'border-stone-800 bg-stone-900/60 hover:border-stone-700 opacity-75'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-black text-xs uppercase text-yellow-400 flex items-center gap-1.5">
                    <Zap size={15} /> Conexão Direta WebUSB
                  </span>
                  {settings.connectionMode === 'webusb' && <Check size={14} className="text-yellow-400 stroke-[3]" />}
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Envia comandos ESC/POS em código de máquina direto para o cabo USB da PS-80 no Chrome.
                </p>
                <div className="mt-3">
                  {usbStatus.connected ? (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestDirectUsb();
                        }}
                        disabled={isSendingUsb}
                        className="flex-1 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg text-xs font-black uppercase transition-colors"
                      >
                        {isSendingUsb ? 'Enviando...' : 'Testar USB Direto'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDisconnectUsb();
                        }}
                        className="px-2.5 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg text-xs font-bold"
                        title="Desconectar"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectUsb();
                      }}
                      disabled={isConnectingUsb}
                      className="w-full py-1.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg text-xs font-black uppercase transition-colors"
                    >
                      {isConnectingUsb ? 'Buscando USB...' : 'Conectar Cabo USB'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Hardware Features of PS-80 */}
            <div className="pt-3 border-t border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-3 p-2.5 bg-stone-850/80 rounded-xl border border-stone-800 hover:border-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.cutPaper ?? true}
                  onChange={e => setSettings({ ...settings, cutPaper: e.target.checked })}
                  className="w-4 h-4 rounded text-yellow-500 accent-yellow-400"
                />
                <div>
                  <span className="font-bold uppercase text-white flex items-center gap-1.5">
                    <Scissors size={14} className="text-yellow-400" /> Corte de Guilhotina
                  </span>
                  <p className="text-[10px] text-stone-400">Aciona a lâmina de corte automático da PS-80</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2.5 bg-stone-850/80 rounded-xl border border-stone-800 hover:border-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.beepOnPrint ?? false}
                  onChange={e => setSettings({ ...settings, beepOnPrint: e.target.checked })}
                  className="w-4 h-4 rounded text-yellow-500 accent-yellow-400"
                />
                <div>
                  <span className="font-bold uppercase text-white flex items-center gap-1.5">
                    <Volume2 size={14} className="text-yellow-400" /> Bip Sonoro (Buzzer)
                  </span>
                  <p className="text-[10px] text-stone-400">Alerta de som na impressora ao sair o pedido</p>
                </div>
              </label>
            </div>
          </div>
          
          {/* Card 1: Tipo de Impressora / Bobina */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h3 className="font-black text-stone-900 uppercase text-sm flex items-center gap-2">
                <Sliders size={18} className="text-yellow-500" /> Formato da Bobina
              </h3>
              <span className="text-xs font-bold text-stone-500">
                {settings.printerType === 'thermal_80' ? '80mm Padrão PS-80' : settings.printerType === 'thermal_58' ? '58mm Mini' : 'A4 / Normal'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* 80mm - PS80 */}
              <button
                type="button"
                onClick={() => setSettings({ ...settings, printerType: 'thermal_80', printerModel: 'ps80' })}
                className={`p-4 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
                  settings.printerType === 'thermal_80'
                    ? 'border-yellow-400 bg-yellow-50/70 shadow-sm ring-2 ring-yellow-400/20'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Printer size={28} className={settings.printerType === 'thermal_80' ? 'text-stone-900' : 'text-stone-400'} />
                    {settings.printerType === 'thermal_80' && <CheckCircle2 size={16} className="text-yellow-600" />}
                  </div>
                  <div className="font-black text-sm uppercase text-stone-900">PS-80 (80mm)</div>
                  <div className="text-[11px] text-stone-500 mt-1 font-medium">Sua impressora USB atual</div>
                </div>
                <div className="mt-3 text-[10px] font-bold text-yellow-800 bg-yellow-200/60 px-2 py-0.5 rounded w-fit uppercase">
                  Ativa
                </div>
              </button>

              {/* 58mm */}
              <button
                type="button"
                onClick={() => setSettings({ ...settings, printerType: 'thermal_58', printerModel: 'generic_58' })}
                className={`p-4 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
                  settings.printerType === 'thermal_58'
                    ? 'border-yellow-400 bg-yellow-50/70 shadow-sm ring-2 ring-yellow-400/20'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Printer size={22} className={settings.printerType === 'thermal_58' ? 'text-stone-900' : 'text-stone-400'} />
                    {settings.printerType === 'thermal_58' && <CheckCircle2 size={16} className="text-yellow-600" />}
                  </div>
                  <div className="font-black text-sm uppercase text-stone-900">Térmica 58mm</div>
                  <div className="text-[11px] text-stone-500 mt-1 font-medium">Mini bobina portátil</div>
                </div>
                <div className="mt-3 text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded w-fit uppercase">
                  Compacta
                </div>
              </button>

              {/* Normal / A4 */}
              <button
                type="button"
                onClick={() => setSettings({ ...settings, printerType: 'normal', printerModel: 'a4' })}
                className={`p-4 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
                  settings.printerType === 'normal'
                    ? 'border-yellow-400 bg-yellow-50/70 shadow-sm ring-2 ring-yellow-400/20'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <FileText size={28} className={settings.printerType === 'normal' ? 'text-stone-900' : 'text-stone-400'} />
                    {settings.printerType === 'normal' && <CheckCircle2 size={16} className="text-yellow-600" />}
                  </div>
                  <div className="font-black text-sm uppercase text-stone-900">A4 / Normal</div>
                  <div className="text-[11px] text-stone-500 mt-1 font-medium">Laser ou jato comum</div>
                </div>
                <div className="mt-3 text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded w-fit uppercase">
                  Folha Inteira
                </div>
              </button>
            </div>
          </div>

          {/* Card 2: Vias de Impressão e Tamanho de Fonte */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-black text-stone-900 uppercase text-sm border-b border-stone-100 pb-3">
              Vias de Impressão e Tipografia
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vias */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Número de Vias (Cópias)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({ ...settings, printCopies: 1 });
                      setActivePreviewVia('unica');
                    }}
                    className={`py-3 px-3 rounded-xl border-2 font-bold text-xs uppercase transition-all ${
                      settings.printCopies === 1
                        ? 'border-yellow-400 bg-yellow-50 text-stone-900'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    1 Via (Comanda única)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({ ...settings, printCopies: 2 });
                      setActivePreviewVia('cozinha');
                    }}
                    className={`py-3 px-3 rounded-xl border-2 font-bold text-xs uppercase transition-all ${
                      settings.printCopies === 2
                        ? 'border-yellow-400 bg-yellow-50 text-stone-900'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    2 Vias (Cozinha + Entrega)
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5 font-medium">
                  {settings.printCopies === 2
                    ? 'Imprime 1 via para a produção e 1 via para o entregador/cliente com corte automático.'
                    : 'Imprime uma comanda completa unificada para todo o fluxo.'}
                </p>
              </div>

              {/* Tamanho da Fonte */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Tamanho do Texto na Bobina</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, fontSize: 'small' })}
                    className={`py-3 rounded-xl border-2 font-bold text-xs uppercase transition-all ${
                      settings.fontSize === 'small'
                        ? 'border-yellow-400 bg-yellow-50 text-stone-900'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    Pequena
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, fontSize: 'medium' })}
                    className={`py-3 rounded-xl border-2 font-bold text-xs uppercase transition-all ${
                      settings.fontSize === 'medium'
                        ? 'border-yellow-400 bg-yellow-50 text-stone-900'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    Média
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, fontSize: 'large' })}
                    className={`py-3 rounded-xl border-2 font-bold text-xs uppercase transition-all ${
                      settings.fontSize === 'large'
                        ? 'border-yellow-400 bg-yellow-50 text-stone-900'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    Grande
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5 font-medium">
                  Letras maiores facilitam leitura na bancada da chapa e cozinha quente.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Dados do Cabeçalho e Rodapé */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-black text-stone-900 uppercase text-sm border-b border-stone-100 pb-3">
              Identificação do Estabelecimento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Nome Principal no Topo</label>
                <input
                  type="text"
                  value={settings.printHeader}
                  onChange={e => setSettings({ ...settings, printHeader: e.target.value })}
                  className="w-full border-2 border-stone-200 p-2.5 rounded-xl font-bold uppercase text-sm focus:border-yellow-400 outline-none"
                  placeholder="NICKEL LANCHES"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Subtítulo / Slogan</label>
                <input
                  type="text"
                  value={settings.printSubHeader}
                  onChange={e => setSettings({ ...settings, printSubHeader: e.target.value })}
                  className="w-full border-2 border-stone-200 p-2.5 rounded-xl font-medium text-sm focus:border-yellow-400 outline-none"
                  placeholder="Delivery de Verdade!"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">WhatsApp / Telefone da Loja</label>
                <input
                  type="text"
                  value={settings.printPhone}
                  onChange={e => setSettings({ ...settings, printPhone: e.target.value })}
                  className="w-full border-2 border-stone-200 p-2.5 rounded-xl font-bold text-sm focus:border-yellow-400 outline-none"
                  placeholder="(54) 99959-8389"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Endereço da Loja</label>
                <input
                  type="text"
                  value={settings.printAddress}
                  onChange={e => setSettings({ ...settings, printAddress: e.target.value })}
                  className="w-full border-2 border-stone-200 p-2.5 rounded-xl text-sm focus:border-yellow-400 outline-none"
                  placeholder="R. Uruguai, 919 - Petrópolis - Passo Fundo - RS"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Mensagem do Rodapé</label>
              <input
                type="text"
                value={settings.printFooter}
                onChange={e => setSettings({ ...settings, printFooter: e.target.value })}
                className="w-full border-2 border-stone-200 p-2.5 rounded-xl font-medium text-sm focus:border-yellow-400 outline-none"
                placeholder="Agradecemos a preferência! Bom apetite!"
              />
            </div>
          </div>

          {/* Card 4: Campos e Detalhes da Comanda */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-black text-stone-900 uppercase text-sm border-b border-stone-100 pb-3">
              Campos Visíveis na Comanda
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-3 p-3 border border-stone-200 rounded-xl hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showOrderNumber}
                  onChange={e => setSettings({ ...settings, showOrderNumber: e.target.checked })}
                  className="w-4 h-4 rounded text-yellow-500 accent-yellow-400"
                />
                <span className="font-bold uppercase text-stone-800">Número do Pedido (#1, #2)</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-stone-200 rounded-xl hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showPassword}
                  onChange={e => setSettings({ ...settings, showPassword: e.target.checked })}
                  className="w-4 h-4 rounded text-yellow-500 accent-yellow-400"
                />
                <span className="font-bold uppercase text-stone-800">Senha de Atendimento</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-stone-200 rounded-xl hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showCustomerPhone}
                  onChange={e => setSettings({ ...settings, showCustomerPhone: e.target.checked })}
                  className="w-4 h-4 rounded text-yellow-500 accent-yellow-400"
                />
                <span className="font-bold uppercase text-stone-800">WhatsApp do Cliente</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-stone-200 rounded-xl hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showDeliveryAddress}
                  onChange={e => setSettings({ ...settings, showDeliveryAddress: e.target.checked })}
                  className="w-4 h-4 rounded text-yellow-500 accent-yellow-400"
                />
                <span className="font-bold uppercase text-stone-800">Endereço de Entrega / Balcão</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-stone-200 rounded-xl hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showItemObservations}
                  onChange={e => setSettings({ ...settings, showItemObservations: e.target.checked })}
                  className="w-4 h-4 rounded text-yellow-500 accent-yellow-400"
                />
                <span className="font-bold uppercase text-stone-800">Destaque de Observações (Sem cebola, etc.)</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-stone-200 rounded-xl hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showPaymentDetails}
                  onChange={e => setSettings({ ...settings, showPaymentDetails: e.target.checked })}
                  className="w-4 h-4 rounded text-yellow-500 accent-yellow-400"
                />
                <span className="font-bold uppercase text-stone-800">Forma de Pagamento & Troco</span>
              </label>
            </div>

            {/* Guilhotina feed lines */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold uppercase text-stone-600">
                  Avanço de Linhas para Corte (Feed)
                </label>
                <span className="text-xs font-black bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                  {settings.feedLines || 4} linhas vazias
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={settings.feedLines || 4}
                onChange={e => setSettings({ ...settings, feedLines: Number(e.target.value) })}
                className="w-full accent-yellow-400 cursor-pointer"
              />
              <p className="text-[11px] text-stone-500 mt-1 font-medium">
                Espaço em branco no final para que a serra ou guilhotina corte sem encavalar na mensagem final.
              </p>
            </div>
          </div>

          {/* Card 5: Automação de Impressão */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-stone-900 uppercase text-sm">Impressão Automática ao Chegar Pedido</h3>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  Quando o cliente envia um novo pedido, a comanda é enviada automaticamente para a impressora.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, autoPrint: !settings.autoPrint })}
                className={`w-14 h-8 rounded-full transition-colors relative ${settings.autoPrint ? 'bg-green-500' : 'bg-stone-300'}`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow-md ${
                    settings.autoPrint ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Actions bottom */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-bold text-stone-500 uppercase hover:text-stone-800 transition-colors"
            >
              Restaurar Padrão
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 text-yellow-400 font-bold uppercase tracking-wider text-xs shadow-md hover:bg-stone-800 transition-all hover:scale-105"
            >
              <Save size={16} /> {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>

        {/* Right: Live Ticket Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-stone-900 text-white p-4 rounded-2xl shadow-xl border border-stone-800 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
              <span className="font-bold uppercase text-xs tracking-wider">Pré-visualização ao Vivo</span>
            </div>

            {settings.printCopies === 2 && (
              <div className="flex bg-stone-800 p-0.5 rounded-lg border border-stone-700 text-[10px] font-bold">
                <button
                  onClick={() => setActivePreviewVia('cozinha')}
                  className={`px-2 py-1 rounded transition-colors ${activePreviewVia === 'cozinha' ? 'bg-yellow-400 text-black' : 'text-stone-300'}`}
                >
                  Via 1 (Cozinha)
                </button>
                <button
                  onClick={() => setActivePreviewVia('entrega')}
                  className={`px-2 py-1 rounded transition-colors ${activePreviewVia === 'entrega' ? 'bg-yellow-400 text-black' : 'text-stone-300'}`}
                >
                  Via 2 (Entrega)
                </button>
              </div>
            )}
          </div>

          {/* The Physical Receipt Container */}
          <div className="flex justify-center bg-stone-200/80 p-4 md:p-6 rounded-3xl border-2 border-dashed border-stone-300 shadow-inner">
            <div
              className={`bg-white shadow-[0_10px_35px_rgba(0,0,0,0.15)] border border-stone-300 rounded-sm p-4 relative transition-all duration-300 overflow-hidden ${
                settings.printerType === 'thermal_58'
                  ? 'w-[230px]'
                  : settings.printerType === 'normal'
                  ? 'w-full max-w-[340px]'
                  : 'w-[285px]'
              }`}
              style={{
                backgroundImage: 'radial-gradient(#f0ede4 0.75px, transparent 0.75px)',
                backgroundSize: '12px 12px',
                backgroundColor: '#ffffff'
              }}
            >
              {/* Paper Top Serrated effect */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-stone-100 border-b border-dashed border-stone-300" />

              <div className="pt-2">
                <PrintableReceipt
                  order={SAMPLE_TEST_ORDER}
                  settings={settings}
                  viaTitle={
                    settings.printCopies === 2
                      ? activePreviewVia === 'cozinha'
                        ? 'VIA 1 - COZINHA / PREPARO'
                        : 'VIA 2 - ENTREGA / CLIENTE'
                      : undefined
                  }
                  isKitchenOnly={settings.printCopies === 2 && activePreviewVia === 'cozinha'}
                />
              </div>

              {/* Paper Bottom Cut line */}
              <div className="border-t border-dashed border-stone-400 mt-2 pt-1 text-[9px] text-center text-stone-400 font-mono">
                [ CORTE DA GUILHOTINA ]
              </div>
            </div>
          </div>

          {/* Quick Print Test Floating Bar under preview */}
          <div className="mt-4 p-4 bg-white rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-xs uppercase text-stone-800">Tudo pronto?</div>
              <div className="text-[11px] text-stone-500 font-medium">Faça um teste real na impressora</div>
            </div>
            <button
              onClick={onTestPrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase text-xs shadow transition-all hover:scale-105"
            >
              <Printer size={16} /> Imprimir Teste
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
