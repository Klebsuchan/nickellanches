import React, { useState, useEffect } from 'react';
import { Printer, Download, CheckCircle2, Zap, Volume2, RefreshCw, ExternalLink, Monitor, ShieldCheck, Clock, FileText, Sparkles, Check } from 'lucide-react';
import { Order, PrinterSettings, savePrinterSettings, subscribeToBridgeStatus, isOrderPaid, markOrderAsPaid } from '../lib/db';
import { checkWindowsBridgeStatus, downloadWindowsAutoPrintApp, executeUniversalPrint } from '../lib/printerService';
import { playSound } from '../lib/audio';
import { useToast } from './Toast';

interface AutoPrintAppProps {
  orders: Order[];
  settings: PrinterSettings;
  onUpdateSettings: (newSettings: PrinterSettings) => void;
  onPrintOrder: (order: Order) => void;
  isStandaloneWindow?: boolean;
}

export default function AutoPrintApp({
  orders,
  settings,
  onUpdateSettings,
  onPrintOrder,
  isStandaloneWindow = false,
}: AutoPrintAppProps) {
  const { addToast } = useToast();
  const [bridgeStatus, setBridgeStatus] = useState<{
    connected: boolean;
    outdated?: boolean;
    printerName?: string;
    printedCount?: number;
  }>({ connected: false });
  const [isCheckingBridge, setIsCheckingBridge] = useState(false);
  const [printedOrderIds, setPrintedOrderIds] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('printed_orders') || '[]'));
    } catch {
      return new Set();
    }
  });

  const verifyBridge = async () => {
    setIsCheckingBridge(true);
    const st = await checkWindowsBridgeStatus();
    setBridgeStatus(st);
    setIsCheckingBridge(false);
  };

  useEffect(() => {
    verifyBridge();
    const unsubCloudBridge = subscribeToBridgeStatus((cloudSt) => {
      if (cloudSt.connected) {
        const isV5 = (cloudSt.bridgeVersion || 0) >= 5;
        setBridgeStatus({
          connected: isV5,
          outdated: !isV5,
          printerName: cloudSt.printerName,
          printedCount: cloudSt.printedCount,
        });
      }
    });
    const interval = setInterval(verifyBridge, 4000);
    return () => {
      unsubCloudBridge();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const syncPrinted = () => {
      try {
        setPrintedOrderIds(new Set(JSON.parse(localStorage.getItem('printed_orders') || '[]')));
      } catch {}
    };
    syncPrinted();
    const timer = setInterval(syncPrinted, 2000);
    return () => clearInterval(timer);
  }, [orders]);

  const handleToggleAutoPrint = async () => {
    const updated = { ...settings, autoPrint: !settings.autoPrint };
    onUpdateSettings(updated);
    try {
      await savePrinterSettings(updated);
      addToast({
        message: updated.autoPrint
          ? 'Impressão Automática ATIVADA para todas as novas comandas!'
          : 'Impressão Automática pausada.',
        type: updated.autoPrint ? 'success' : 'info',
      });
    } catch {}
  };

  const handleToggleCopies = async (copies: 1 | 2) => {
    const updated = { ...settings, printCopies: copies };
    onUpdateSettings(updated);
    try {
      await savePrinterSettings(updated);
      addToast({
        message: `Configurado para imprimir ${copies} ${copies === 1 ? 'via' : 'vias (Cozinha + Entrega)'} por comanda!`,
        type: 'success',
      });
    } catch {}
  };

  const handleDownloadApp = () => {
    downloadWindowsAutoPrintApp(settings);
    playSound('coin');
    addToast({
      title: 'Download Iniciado (Motor Visual v5)!',
      message: 'Abra o arquivo "Impressao-Automatica-Nickel.bat" no seu Windows para substituir a versão antiga e imprimir idêntico à pré-visualização.',
      type: 'success',
    });
  };

  const handleOpenCompactWindow = () => {
    const width = 500;
    const height = 760;
    const left = window.screen.width - width - 30;
    const top = 40;
    window.open(
      `${window.location.origin}/impressao-automatica`,
      'NickelImpressaoAutomatica',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
    );
  };

  const handleTestComandaPrint = async () => {
    const sampleOrder: Order = {
      id: 'TESTE-9F8A-01',
      orderNumber: 1,
      userName: 'João da Silva (Pedido Teste)',
      whatsapp: '(54) 99123-4567',
      address: 'Av. Brasil, 1500 - Apto 302 (Centro)',
      region: 'Centro',
      deliveryNotes: 'Campainha não funciona, chamar no WhatsApp ao chegar na portaria.',
      paymentMethod: 'PIX (Aprovado)',
      paymentStatus: 'pago',
      isPaid: true,
      totalPrice: 78.5,
      totalPoints: 25,
      deliveryFee: 7.0,
      createdAt: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'recebido',
      receiptAuthCode: 'MP-AUTH-9988776655',
      receiptTimestamp: new Date().toLocaleTimeString('pt-BR'),
      items: [
        {
          name: 'X-Salada Duplo Especial',
          price: 32.0,
          quantity: 1,
          observation: 'Sem cebola, maionese temperada à parte e pão bem tostado',
          extras: [
            { name: 'Bacon Crocante Extra', price: 5.0 },
            { name: 'Queijo Cheddar Inglês', price: 4.5 },
          ],
        },
        {
          name: 'Porção de Fritas com Cheddar e Bacon (G)',
          price: 24.0,
          quantity: 1,
          observation: 'Mandar bastante guardanapo e sachê de ketchup',
          extras: [],
        },
        {
          name: 'Coca-Cola Lata 350ml (Bem Gelada)',
          price: 6.0,
          quantity: 2,
          extras: [],
        },
      ],
    };
    (sampleOrder as any).isTest = true;

    playSound('coin');
    if (onPrintOrder) {
      onPrintOrder(sampleOrder);
    } else {
      await executeUniversalPrint(sampleOrder, settings, addToast, { force: true });
    }
  };

  return (
    <div className={`space-y-6 ${isStandaloneWindow ? 'p-4 bg-stone-950 min-h-screen text-white' : ''}`}>
      {/* HEADER DO APLICATIVO IMPRESSÃO AUTOMÁTICA */}
      <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 text-white p-6 rounded-2xl border-2 border-yellow-400/80 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-yellow-400 text-stone-950 flex items-center justify-center shadow-lg shrink-0 font-black">
              <Printer size={30} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-display uppercase font-black tracking-wide text-white">
                  Impressão Automática
                </h2>
                <span className="bg-emerald-500 text-stone-950 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                  <Zap size={12} className="fill-stone-950" /> Exclusivo Comandas
                </span>
              </div>
              <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl">
                Aplicativo dedicado (estilo iFood e 99) que fica aberto no Windows conectado <strong>apenas às comandas</strong>. Fez um pedido no site, a comanda cai direto na impressora padrão do computador automaticamente.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            {!isStandaloneWindow && (
              <button
                type="button"
                onClick={handleOpenCompactWindow}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                title="Abrir em uma janelinha dedicada apenas para as comandas"
              >
                <ExternalLink size={15} className="text-yellow-400" />
                Abrir Janela Dedicada
              </button>
            )}
            <button
              type="button"
              onClick={handleTestComandaPrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-yellow-400 border border-yellow-400/40 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              <Printer size={15} />
              Testar Comanda Agora
            </button>
          </div>
        </div>

        {/* BARRA DE STATUS DE CONEXÃO EM TEMPO REAL */}
        <div className="mt-5 pt-4 border-t border-stone-800 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Status 1: Conexão com as Comandas */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div>
              <div className="text-[10px] font-bold uppercase text-stone-400">Conexão com o Site</div>
              <div className="text-xs font-black text-emerald-400 uppercase">
                Conectado às Comandas em Tempo Real
              </div>
            </div>
          </div>

          {/* Status 2: Ponte Windows */}
          <div className={`rounded-xl p-3 flex items-center justify-between gap-2 border ${
            bridgeStatus.connected
              ? 'bg-emerald-950/40 border-emerald-500/40'
              : 'bg-amber-950/30 border-amber-500/30'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <span className={`w-3 h-3 rounded-full shrink-0 ${
                bridgeStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              <div className="truncate">
                <div className="text-[10px] font-bold uppercase text-stone-400">Ponte Direta no Windows</div>
                <div className={`text-xs font-black uppercase truncate ${
                  bridgeStatus.connected ? 'text-emerald-300' : 'text-amber-300'
                }`}>
                  {bridgeStatus.connected
                    ? `Ativo: ${bridgeStatus.printerName}`
                    : 'Clique em Baixar App Windows Abaixo'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={verifyBridge}
              className="p-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-300 shrink-0 cursor-pointer"
              title="Verificar conexão com o aplicativo no Windows"
            >
              <RefreshCw size={14} className={isCheckingBridge ? 'animate-spin text-yellow-400' : ''} />
            </button>
          </div>

          {/* Status 3: Chave Geral de Impressão Automática */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase text-stone-400">Disparo Automático</div>
              <div className="text-xs font-black uppercase text-white">
                {settings.autoPrint ? 'LIGADO (Imprime sozinho)' : 'PAUSADO'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleAutoPrint}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                settings.autoPrint
                  ? 'bg-emerald-500 text-stone-950 shadow-sm'
                  : 'bg-stone-700 text-stone-300'
              }`}
            >
              {settings.autoPrint ? 'ATIVADO' : 'ATIVAR'}
            </button>
          </div>
        </div>
      </div>

      {/* CARTÃO DE DOWNLOAD E INSTALAÇÃO NO WINDOWS (IGUAL IFOOD / 99) */}
      <div className="bg-amber-400 text-stone-950 p-6 rounded-2xl border-2 border-amber-500 shadow-lg">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-stone-950 text-yellow-400 px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider">
              <Monitor size={13} /> Aplicativo para Windows (Sempre Ligado • Qualquer Impressora)
            </div>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-stone-950">
              Baixe o aplicativo "Impressão Automática" já configurado para ficar sempre ligado
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-stone-900 leading-relaxed">
              Ao abrir o arquivo baixado uma única vez no seu PC, ele <strong>já se instala automaticamente na inicialização do Windows</strong>, detecta sua impressora sozinho e já puxa/imprime a comanda na hora! Sempre que cair um pedido no site (ou quando você clicar em Testar/Reimprimir aqui no painel), a comanda sai direto na impressora sem pedir confirmação.
            </p>
          </div>

          <div className="w-full lg:w-auto shrink-0 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleDownloadApp}
              className="w-full lg:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-stone-950 hover:bg-stone-900 text-yellow-400 rounded-xl font-black uppercase tracking-wider text-sm shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer border-2 border-stone-900"
            >
              <Download size={22} className="stroke-[2.5]" />
              <div className="text-left">
                <div className="leading-none">Baixar Impressão Automática (PC)</div>
                <div className="text-[10px] text-stone-400 font-bold normal-case mt-1">
                  Versão Sempre Ligado • Impressao-Automatica-Nickel.bat
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* PASSO A PASSO SIMPLES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-4 border-t border-amber-500/50">
          <div className="bg-white/95 p-3.5 rounded-xl border border-amber-500/30">
            <div className="font-black text-xs uppercase text-stone-900 flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-md bg-stone-950 text-yellow-400 flex items-center justify-center text-[11px]">1</span>
              Baixe a Nova Versão
            </div>
            <p className="text-xs text-stone-700 font-medium">
              Clique no botão preto acima para baixar o instalador automático <strong>Impressao-Automatica-Nickel.bat</strong> no seu computador.
            </p>
          </div>

          <div className="bg-white/95 p-3.5 rounded-xl border border-amber-500/30">
            <div className="font-black text-xs uppercase text-stone-900 flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-md bg-stone-950 text-yellow-400 flex items-center justify-center text-[11px]">2</span>
              Abra 1 Vez no Computador
            </div>
            <p className="text-xs text-stone-700 font-medium">
              Dê dois cliques no arquivo baixado (se o Windows perguntar, clique em <strong>"Mais informações"</strong> → <strong>"Executar assim mesmo"</strong>). Ele já imprime a confirmação na hora!
            </p>
          </div>

          <div className="bg-white/95 p-3.5 rounded-xl border border-amber-500/30">
            <div className="font-black text-xs uppercase text-stone-900 flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-md bg-stone-950 text-yellow-400 flex items-center justify-center text-[11px]">3</span>
              Sempre Ligado Automaticamente
            </div>
            <p className="text-xs text-stone-700 font-medium">
              Ele se configura para iniciar junto com o Windows e reconecta sozinho se fechar. Dentro da janela preta você também pode apertar <strong>[T]</strong> para testar ou <strong>[I]</strong> para escolher a impressora.
            </p>
          </div>
        </div>
      </div>

      {/* CONTROLES RÁPIDOS E FILA EXCLUSIVA DE COMANDAS (SOMENTE PEDIDOS PAGOS) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden text-stone-900">
        <div className="p-4 sm:p-5 bg-stone-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-400 text-stone-950 rounded-lg font-black">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-black uppercase text-base tracking-wide flex items-center gap-2 flex-wrap">
                Central Exclusiva de Comandas (Pedidos Pagos)
                <span className="bg-emerald-500 text-stone-950 text-xs px-2.5 py-0.5 rounded-md font-black">
                  {orders.filter((o) => isOrderPaid(o)).length} comandas pagas
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Somente pedidos com pagamento confirmado entram na comanda, disparam o aviso sonoro e vão para a impressora.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-stone-800 p-1 rounded-xl border border-stone-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleToggleCopies(1)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  settings.printCopies !== 2
                    ? 'bg-yellow-400 text-stone-950 font-black'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                1 Via por Pedido
              </button>
              <button
                type="button"
                onClick={() => handleToggleCopies(2)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  settings.printCopies === 2
                    ? 'bg-yellow-400 text-stone-950 font-black'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                2 Vias (Cozinha + Entrega)
              </button>
            </div>
          </div>
        </div>

        {/* LISTA DE COMANDAS PAGAS EM TEMPO REAL */}
        <div className="p-4 sm:p-5">
          {orders.filter((o) => isOrderPaid(o)).length === 0 ? (
            <div className="text-center py-12 bg-stone-50 rounded-xl border-2 border-dashed border-stone-200">
              <Printer size={40} className="mx-auto text-stone-400 mb-3" />
              <div className="font-black uppercase text-stone-700 text-base">
                Aguardando Comandas Pagas...
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Assim que um pedido tiver o pagamento aprovado, a comanda aparecerá aqui, tocará o alerta e sairá na impressora.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders
                .filter((o) => isOrderPaid(o))
                .map((order) => {
                  const isPrinted = order.id ? printedOrderIds.has(order.id) : false;
                  const orderNum = order.orderNumber
                    ? `PEDIDO #${order.orderNumber}`
                    : `#${order.id?.substring(0, 5).toUpperCase()}`;
                  const timeStr = order.createdAt?.toDate
                    ? order.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : typeof order.createdAt === 'string'
                    ? order.createdAt
                    : 'Agora';

                  return (
                    <div
                      key={order.id}
                      className="bg-stone-50 rounded-xl border-2 border-emerald-300 hover:border-yellow-400 transition-all p-4 flex flex-col justify-between shadow-xs"
                    >
                      <div>
                        {/* Cabeçalho da Comanda */}
                        <div className="flex justify-between items-start gap-2 border-b border-stone-200 pb-2.5 mb-2.5">
                          <div>
                            <span className="font-black text-sm text-black bg-yellow-400 px-2 py-0.5 rounded border border-yellow-500 shadow-xs inline-block tracking-tight mb-1">
                              {orderNum}
                            </span>
                            <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                              <Clock size={11} /> {timeStr}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <Check size={11} className="stroke-[3]" /> Pago
                            </span>

                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                isPrinted
                                  ? 'bg-stone-200 text-stone-700'
                                  : 'bg-yellow-200 text-stone-900'
                              }`}
                            >
                              {isPrinted ? 'Impressa' : 'Na Comanda'}
                            </span>
                          </div>
                        </div>

                        {/* Dados do Cliente */}
                        <div className="text-xs space-y-1 mb-3 border-b border-dashed border-stone-200 pb-2.5">
                          <div className="font-black text-stone-900 uppercase">
                            {order.userName || 'Cliente Balcão'}
                          </div>
                          {order.whatsapp && (
                            <div className="text-stone-600 font-semibold">Tel: {order.whatsapp}</div>
                          )}
                          <div className="text-stone-600 line-clamp-2">
                            <strong>Entrega:</strong> {order.address || 'Retirada no Balcão'}
                          </div>
                        </div>

                        {/* Itens da Comanda - Destaque e Negrito */}
                        <div className="space-y-1.5 mb-3 max-h-40 overflow-y-auto pr-1">
                          {(order.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="text-xs bg-white p-2 rounded-lg border-2 border-stone-300 shadow-2xs">
                              <div className="font-black text-stone-950 flex justify-between items-center text-sm">
                                <span className="flex items-center gap-1.5">
                                  <span className="bg-black text-white px-1.5 py-0.2 rounded text-[11px] font-black">{item.quantity}x</span>
                                  <span className="font-black">{item.name}</span>
                                </span>
                              </div>
                              {item.extras && item.extras.length > 0 && (
                                <div className="text-[11px] text-stone-800 font-bold pl-2 mt-1 border-l-2 border-amber-500">
                                  {item.extras.map((ex: any, i: number) => (
                                    <div key={i}>+ {ex.name}</div>
                                  ))}
                                </div>
                              )}
                              {item.observation && (
                                <div className="text-[11px] font-black text-red-600 uppercase mt-1 bg-red-50 p-1 rounded border-l-2 border-red-500">
                                  &gt;&gt; Obs: {item.observation}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rodapé da Comanda + Botão Imprimir Direto */}
                      <div className="pt-2.5 border-t border-stone-200 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-stone-500 block">
                            {order.paymentMethod || 'Pago'}
                          </span>
                          <span className="font-black text-base text-emerald-700">
                            R$ {(order.totalPrice || 0).toFixed(2).replace('.', ',')}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onPrintOrder(order)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black uppercase text-xs transition-all cursor-pointer shadow-xs bg-stone-900 hover:bg-yellow-400 text-yellow-400 hover:text-stone-950"
                        >
                          <Printer size={14} />
                          {isPrinted ? 'Reimprimir' : 'Imprimir'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* PEDIDOS RETIDOS AGUARDANDO PAGAMENTO (FORA DA COMANDA) */}
      {orders.filter((o) => !isOrderPaid(o)).length > 0 && (
        <div className="bg-amber-50 rounded-2xl border-2 border-amber-300 shadow-sm overflow-hidden text-stone-900">
          <div className="p-4 bg-amber-100 border-b border-amber-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h4 className="font-black uppercase text-sm text-amber-950 flex items-center gap-2">
                <Clock size={18} className="text-amber-700" />
                Pedidos Aguardando Confirmação de Pagamento ({orders.filter((o) => !isOrderPaid(o)).length})
              </h4>
              <p className="text-xs text-amber-900 font-medium">
                Estes pedidos (ex: PIX pendente) NÃO entraram na comanda e NÃO tocaram o alerta sonoro. Confirme o pagamento para liberar e imprimir.
              </p>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {orders
              .filter((o) => !isOrderPaid(o))
              .map((order) => {
                const orderNum = order.orderNumber
                  ? `PEDIDO #${order.orderNumber}`
                  : `#${order.id?.substring(0, 5).toUpperCase()}`;
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl border border-amber-300 p-3.5 flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-sm text-stone-900">{orderNum}</span>
                        <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                          Aguardando Pgto
                        </span>
                      </div>
                      <div className="text-xs font-bold text-stone-800">{order.userName || 'Cliente'}</div>
                      <div className="text-[11px] text-stone-500">
                        {order.paymentMethod || 'PIX'} • R$ {(order.totalPrice || 0).toFixed(2).replace('.', ',')}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!order.id) return;
                        try {
                          await markOrderAsPaid(order.id, order.orderNumber);
                          playSound('order_alert');
                          addToast({
                            message: `Pagamento confirmado! Pedido #${order.orderNumber || ''} enviado para a comanda!`,
                            type: 'success',
                          });
                          onPrintOrder({ ...order, isPaid: true, paymentStatus: 'pago' });
                        } catch {
                          addToast({ message: 'Erro ao confirmar pagamento', type: 'error' });
                        }
                      }}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black uppercase text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Check size={14} className="stroke-[3]" />
                      <span>Confirmar Pgto & Enviar p/ Comanda</span>
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
