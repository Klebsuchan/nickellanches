import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, CheckSquare, Lock, LogOut, X, Plus, Trash2, Edit2, Package, Tag, Clock, Save, Eye, EyeOff, Settings, List, Check, ArrowRight, ImagePlus, ChevronLeft, ChevronRight, RefreshCw, XCircle, Grid, Image as ImageIcon, Send, CreditCard, QrCode, ExternalLink, Volume2, Zap, Download, Users, PauseCircle, PlayCircle, Search, Calendar, Phone, MapPin, ShoppingBag } from 'lucide-react';
import { Order, getProducts, saveProduct, toggleProductPause, deleteProduct, getPromos, savePromo, deletePromo, getAllOrders, updateOrderStatus, PromoCode, subscribeToAllOrders, Banner, getBanners, saveBanner, deleteBanner, subscribeToProducts, subscribeToPromos, subscribeToBanners, deleteOrder, saveOrderAdmin, saveOrder, subscribeToPaymentSettings, PaymentSettings, PrinterSettings, DEFAULT_PRINTER_SETTINGS, savePrinterSettings, subscribeToPrinterSettings, subscribeToStoreHours, saveStoreHoursSettings, isOrderPaid, markOrderAsPaid } from '../lib/db';
import { Product, Extra } from '../types';
import { useToast } from './Toast';
import { playSound } from '../lib/audio';
import NickelText from './NickelText';
import PaymentSettingsEditor from './PaymentSettingsEditor';
import PrintSettingsEditor from './PrintSettingsEditor';
import PrintableReceipt from './PrintableReceipt';
import PrintModal from './PrintModal';
import AutoPrintApp from './AutoPrintApp';
import { getConnectedUsbPrinter, sendRawToUsbPrinter, buildReceiptEscPos } from '../lib/escpos';
import { executeUniversalPrint } from '../lib/printerService';
import { isStoreClosedMonday, getStoreStatus, StoreHoursSettings, DEFAULT_STORE_HOURS, getSaoPauloNow } from '../lib/storeHours';

type AdminTab = 'orders' | 'history' | 'autoprint' | 'products' | 'hours' | 'promos' | 'banners' | 'payments' | 'settings';

interface AdminPanelProps {
  onClose: () => void;
  initialTab?: AdminTab;
  standaloneAutoPrint?: boolean;
}


// ----------------------------------------------------------------------
// SAFE PRINT HELPER (WINDOWS BRIDGE, WEBUSB & SPOOLER DIRECT)
// ----------------------------------------------------------------------
export const executePrintOrder = async (
  order: Order,
  settings: PrinterSettings,
  setOrderToPrint: (o: Order | null) => void,
  addToast: any,
  options?: { force?: boolean }
) => {
  setOrderToPrint(order);
  await executeUniversalPrint(order, settings, addToast, options);
};

// Acesso protegido do painel administrativo
async function computePasswordHash(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function AdminPanel({ onClose, initialTab = 'orders', standaloneAutoPrint = false }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('nickel_admin_session_auth') === 'authenticated';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | undefined>(undefined);
  const [storeHours, setStoreHours] = useState<StoreHoursSettings>(DEFAULT_STORE_HOURS);
  
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [modalOrderToPrint, setModalOrderToPrint] = useState<Order | null>(null);
  const [printSettings, setPrintSettings] = useState<PrinterSettings>(() => {
    const cached = localStorage.getItem('nickel_printer_settings');
    if (cached) {
      try {
        return { ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(cached) };
      } catch (_) {}
    }
    return DEFAULT_PRINTER_SETTINGS;
  });

  const autoPrintRef = useRef(printSettings.autoPrint);
  const printSettingsRef = useRef(printSettings);
  const printedOrders = useRef<Set<string>>(new Set(JSON.parse(localStorage.getItem('printed_orders') || '[]')));
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const knownPaidOrderIdsRef = useRef<Set<string>>(new Set());
  const [confirmPrintUnpaidOrder, setConfirmPrintUnpaidOrder] = useState<Order | null>(null);

  const handleMarkAsPaidAndPrint = async (order: Order) => {
    if (!order.id) return;
    try {
      await markOrderAsPaid(order.id, order.orderNumber);
      knownPaidOrderIdsRef.current.add(order.id);
      playSound('order_alert');
      const updatedOrder = { ...order, isPaid: true, paymentStatus: 'pago' as const };
      await executePrintOrder(updatedOrder, printSettingsRef.current, setOrderToPrint, addToast, { force: true });
      addToast({
        title: 'Pagamento Confirmado!',
        message: `Pedido #${order.orderNumber || order.id.substring(0, 4)} marcado como PAGO e comanda enviada!`,
        type: 'success'
      });
    } catch (err: any) {
      addToast({
        message: 'Erro ao confirmar pagamento: ' + err.message,
        type: 'error'
      });
    }
  };

  useEffect(() => {
    autoPrintRef.current = printSettings.autoPrint;
    printSettingsRef.current = printSettings;
  }, [printSettings]);

  useEffect(() => {
    const unsubPrinter = subscribeToPrinterSettings((s) => {
      setPrintSettings(s);
      autoPrintRef.current = s.autoPrint;
      printSettingsRef.current = s;
    });
    return () => unsubPrinter();
  }, []);
  
  const { addToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = password.trim();
    if (!cleanPass) {
      playSound('error');
      addToast({ message: 'Digite a senha de administrador.', type: 'error' as any });
      return;
    }

    const envAdminPass = (import.meta as any).env?.VITE_ADMIN_PASSWORD;
    let isAuthorized = false;

    if (envAdminPass && cleanPass === envAdminPass) {
      isAuthorized = true;
    } else {
      try {
        const hashed = await computePasswordHash(cleanPass);
        // Master hash de autorização administrativa (sem expor a senha em texto plano)
        if (hashed === 'd3b8aca45e911548eaeb548af01a2fff7000b73eda85c5d4c6d43a86e60ad775') {
          isAuthorized = true;
        }
      } catch (err) {
        console.error('Erro de validação criptográfica:', err);
      }
    }

    if (isAuthorized) {
      sessionStorage.setItem('nickel_admin_session_auth', 'authenticated');
      setIsAuthenticated(true);
      playSound('coin');
      addToast({ message: 'Login efetuado com sucesso!', type: 'success' });
    } else {
      playSound('error');
      addToast({ message: 'Senha incorreta! Digite a senha de administrador.', type: 'error' as any });
    }
  };

  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (isAuthenticated) {
      const unsubOrders = subscribeToAllOrders((newOrders) => {
        const freshPrinted = new Set<string>(JSON.parse(localStorage.getItem('printed_orders') || '[]'));

        if (isInitialLoadRef.current) {
          // Na primeira carga da página, registra os IDs existentes como conhecidos para evitar disparar impressão em massa de pedidos antigos
          newOrders.forEach(o => {
            if (o.id) {
              knownOrderIdsRef.current.add(o.id);
              if (isOrderPaid(o)) {
                knownPaidOrderIdsRef.current.add(o.id);
                freshPrinted.add(o.id);
              }
            }
          });
          localStorage.setItem('printed_orders', JSON.stringify(Array.from(freshPrinted)));
          isInitialLoadRef.current = false;
          setOrders(newOrders);
          return;
        }

        const newlyPaidOrders: Order[] = [];
        newOrders.forEach(order => {
          if (!order.id) return;
          knownOrderIdsRef.current.add(order.id);

          const paid = isOrderPaid(order);
          // REGRA: Só dispara alerta sonoro e comanda se o pedido estiver PAGO!
          if (paid && !knownPaidOrderIdsRef.current.has(order.id)) {
            knownPaidOrderIdsRef.current.add(order.id);
            if (!order.status || order.status === 'recebido' || order.status === 'preparando') {
              newlyPaidOrders.push(order);
            }
          }
        });

        setOrders(newOrders);

        // REGRA DE OURO: AVISA E IMPRIME APENAS OS PEDIDOS QUE FORAM PAGOS!
        if (newlyPaidOrders.length > 0) {
          playSound('order_alert');
          newlyPaidOrders.forEach(order => {
            if (autoPrintRef.current && order.id && !freshPrinted.has(order.id)) {
              freshPrinted.add(order.id);
              printedOrders.current.add(order.id);
              localStorage.setItem('printed_orders', JSON.stringify(Array.from(freshPrinted)));
              executePrintOrder(order, printSettingsRef.current, setOrderToPrint, addToast, { force: false });
            }
          });
        }
      });
      const unsubProducts = subscribeToProducts(setProducts);
      const unsubPromos = subscribeToPromos(setPromos);
      const unsubBanners = subscribeToBanners(setBanners);
      const unsubPaymentSettings = subscribeToPaymentSettings(setPaymentSettings);
      const unsubStoreHours = subscribeToStoreHours(setStoreHours);

      return () => {
        unsubOrders();
        unsubProducts();
        unsubPromos();
        unsubBanners();
        unsubPaymentSettings();
        unsubStoreHours();
      };
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-stone-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.form 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          onSubmit={handleLogin} 
          className="bg-white p-8 rounded-2xl border border-stone-200 shadow-2xl max-w-sm w-full relative"
        >
          <button 
            type="button" 
            onClick={onClose} 
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 hover:bg-stone-100 p-2 rounded-full transition-colors"
          >
            <X size={20}/>
          </button>
          
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-yellow-400/20 flex items-center justify-center border-2 border-yellow-400 text-yellow-600 shadow-inner">
              <Lock size={32} />
            </div>
          </div>
          
          <h2 className="text-2xl font-display font-bold text-center text-stone-900 mb-1 uppercase tracking-wide">
            {standaloneAutoPrint ? 'Impressão Automática' : 'Acesso Restrito'}
          </h2>
          <p className="text-center text-stone-500 text-xs mb-6 font-medium">
            {standaloneAutoPrint
              ? 'Digite a senha de administrador para abrir o aplicativo Impressão Automática de Comandas.'
              : 'Digite a senha de administrador para gerenciar pedidos, cardápio e impressora.'}
          </p>
          
          <div className="relative mb-5">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Senha de administrador"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full border border-stone-300 rounded-xl p-3.5 pr-12 outline-none focus:ring-4 focus:ring-yellow-400/50 focus:border-yellow-500 font-bold text-stone-900 placeholder:font-normal placeholder:text-stone-400"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-stone-900 hover:bg-black text-yellow-400 font-display uppercase tracking-widest py-3.5 rounded-xl border border-stone-800 hover:-translate-y-0.5 shadow-md hover:shadow-lg transition-all font-bold cursor-pointer"
          >
            Entrar no Painel
          </button>
        </motion.form>
      </div>
    );
  }

  if (standaloneAutoPrint) {
    return (
      <div className="min-h-screen bg-stone-950 text-white print:bg-white print:text-black">
        <div className="print:hidden">
          <AutoPrintApp
            orders={orders}
            settings={printSettings}
            onUpdateSettings={setPrintSettings}
            onPrintOrder={(order) => executePrintOrder(order, printSettings, setOrderToPrint, addToast, { force: true })}
            isStandaloneWindow={true}
          />
        </div>
        <div
          id="printable-command"
          className={`hidden print:block mx-auto text-black font-mono leading-tight bg-white ${
            printSettings.printerType === 'thermal_58'
              ? 'thermal-58'
              : printSettings.printerType === 'normal'
              ? 'normal-a4'
              : 'thermal-80'
          }`}
        >
          {orderToPrint && (
            <PrintableReceipt
              order={orderToPrint}
              settings={printSettings}
              viaTitle={undefined}
              isKitchenOnly={false}
            />
          )}
        </div>
      </div>
    );
  }

  const currentStoreStatus = getStoreStatus(storeHours);
  const pausedProductsCount = products.filter(p => p.paused).length;

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row print:bg-white print:block">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-black text-white p-6 flex flex-col print:hidden shadow-2xl z-20">
        <div className="flex justify-between items-center mb-6">
          <div className="text-2xl font-display text-yellow-400 flex flex-col leading-none">
            <span>NICKEL</span>
            <span className="text-white text-lg">ADMIN</span>
          </div>
          <button onClick={onClose} className="text-white hover:text-yellow-400 md:hidden"><X size={24}/></button>
        </div>
        
        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
          <TabButton icon={<CheckSquare size={20}/>} label="Pedidos" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
          <TabButton icon={<Users size={20}/>} label="Histórico Clientes" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <button
            type="button"
            onClick={() => setActiveTab('autoprint')}
            className={`flex items-center justify-between gap-2 px-4 py-3 font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === 'autoprint'
                ? 'bg-emerald-400 text-stone-950 shadow-lg translate-x-2'
                : 'bg-stone-900/90 text-emerald-400 border border-emerald-500/30 hover:bg-stone-800'
            }`}
          >
            <span className="flex items-center gap-2.5 text-xs">
              <Zap size={18} className={activeTab === 'autoprint' ? 'fill-stone-950' : 'fill-emerald-400'} />
              Imp. Automática
            </span>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
              activeTab === 'autoprint' ? 'bg-stone-950 text-emerald-400' : 'bg-emerald-500 text-stone-950'
            }`}>
              APP
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex items-center justify-between gap-2 px-4 py-3 font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-yellow-400 text-black shadow-lg translate-x-2'
                : 'text-zinc-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <span className="flex items-center gap-3">
              <Package size={20}/> Produtos
            </span>
            {pausedProductsCount > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                activeTab === 'products' ? 'bg-red-600 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {pausedProductsCount} pausado{pausedProductsCount > 1 ? 's' : ''}
              </span>
            )}
          </button>
          <TabButton icon={<Clock size={20}/>} label="Horários" active={activeTab === 'hours'} onClick={() => setActiveTab('hours')} />
          <TabButton icon={<Tag size={20}/>} label="Cupons" active={activeTab === 'promos'} onClick={() => setActiveTab('promos')} />
          <TabButton icon={<ImageIcon size={20}/>} label="Banners" active={activeTab === 'banners'} onClick={() => setActiveTab('banners')} />
          <TabButton icon={<CreditCard size={20}/>} label="Pagamentos" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
          <div className="my-2 border-t border-stone-800"></div>
          <TabButton icon={<Printer size={20}/>} label="Impressora" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="mt-6 pt-4 border-t border-stone-800 flex flex-col items-center gap-2 text-xs text-stone-500 font-bold uppercase tracking-widest text-center">
          <a
            href="/painel-admin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-yellow-400 hover:text-yellow-300 normal-case font-bold tracking-normal transition-colors"
          >
            Abrir em Nova Aba <ExternalLink size={13} />
          </a>
          <span>Versão 2.3.0</span>

          <div className="pt-2 w-full space-y-1.5">
            <button
              type="button"
              onClick={async () => {
                const nextMode = currentStoreStatus.isOpen ? 'closed' : 'open';
                const updated: StoreHoursSettings = {
                  ...storeHours,
                  mode: nextMode,
                };
                setStoreHours(updated);
                try {
                  await saveStoreHoursSettings(updated);
                  addToast({
                    message: nextMode === 'open' ? 'Loja aberta para pedidos!' : 'Loja fechada temporariamente!',
                    type: nextMode === 'open' ? 'success' : 'warning',
                  });
                } catch {}
              }}
              className={`w-full text-[10px] py-2 px-2 rounded-lg font-bold uppercase tracking-normal transition-all shadow-xs cursor-pointer ${
                !currentStoreStatus.isOpen
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600/90 hover:bg-red-700 text-white'
              }`}
            >
              {!currentStoreStatus.isOpen
                ? 'Abrir Loja Agora'
                : 'Fechar Loja Temporariamente'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hours')}
              className="w-full text-[10px] py-1.5 px-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 font-bold uppercase tracking-normal transition-colors cursor-pointer"
            >
              Status: {currentStoreStatus.badgeText}
            </button>

            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('nickel_admin_session_auth');
                setIsAuthenticated(false);
                setPassword('');
                onClose();
              }}
              className="w-full mt-2 py-2 px-3 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 hover:text-red-100 rounded-lg font-bold uppercase tracking-wider text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut size={13} /> Sair do Painel
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-screen overflow-y-auto p-4 md:p-8 relative print:hidden">
        {activeTab === 'orders' && (
          <OrdersKanban
            orders={orders}
            setOrderToPrint={setOrderToPrint}
            printSettings={printSettings}
            setPrintSettings={setPrintSettings}
            onOpenAutoPrintApp={() => setActiveTab('autoprint')}
            products={products}
          />
        )}
        {activeTab === 'history' && (
          <CustomerOrderHistory
            orders={orders}
            printSettings={printSettings}
            setOrderToPrint={setOrderToPrint}
          />
        )}
        {activeTab === 'autoprint' && (
          <AutoPrintApp
            orders={orders}
            settings={printSettings}
            onUpdateSettings={setPrintSettings}
            onPrintOrder={(order) => executePrintOrder(order, printSettings, setOrderToPrint, addToast, { force: true })}
          />
        )}
        {activeTab === 'products' && <ProductEditor products={products} />}
        {activeTab === 'hours' && (
          <StoreHoursEditor
            settings={storeHours}
            onSave={async (updated) => {
              await saveStoreHoursSettings(updated);
              setStoreHours(updated);
            }}
          />
        )}
        {activeTab === 'promos' && <PromoEditor promos={promos} />}
        {activeTab === 'banners' && <BannerEditor banners={banners} />}
        {activeTab === 'payments' && <PaymentSettingsEditor initialSettings={paymentSettings} />}
        {activeTab === 'settings' && (
          <PrintSettingsEditor
            settings={printSettings}
            setSettings={setPrintSettings}
            onSaveSettings={async (updated) => {
              await savePrinterSettings(updated);
              setPrintSettings(updated);
            }}
            onOpenAutoPrintApp={() => setActiveTab('autoprint')}
            onTestPrint={() => {
              const testOrder: Order = {
                id: 'TESTE-101',
                orderNumber: 1,
                createdAt: { toDate: () => new Date() },
                userName: 'Braian Kleber (Teste)',
                whatsapp: '(54) 99106-4604',
                address: 'Roberto Dalla Lana, 332 - Petrópolis',
                region: 'Passo Fundo',
                paymentMethod: 'Pix (Aprovado)',
                paymentStatus: 'pago',
                isPaid: true,
                receiptAuthCode: 'AUT-NKL-PIX-9821',
                receiptTimestamp: 'Hoje às 19:26',
                receiptNotes: 'Tocar o interfone.',
                deliveryFee: 6.00,
                totalPrice: 95.00,
                totalPoints: 120,
                status: 'recebido',
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
              (testOrder as any).isTest = true;
              setOrderToPrint(testOrder);
              setModalOrderToPrint(testOrder);
              executePrintOrder(testOrder, printSettings, setOrderToPrint, addToast, { force: true });
            }}
          />
        )}
      </div>

      {/* Printable Area for Thermal / Standard Printers */}
      <div 
        id="printable-command" 
        className={`hidden print:block mx-auto text-black font-mono leading-tight bg-white ${
          printSettings.printerType === 'thermal_58'
            ? 'thermal-58'
            : printSettings.printerType === 'normal'
            ? 'normal-a4'
            : 'thermal-80'
        }`}
      >
        {orderToPrint && (
          <>
            {printSettings.printCopies === 2 ? (
              <>
                <PrintableReceipt
                  order={orderToPrint}
                  settings={printSettings}
                  viaTitle="VIA 1 - COZINHA / PREPARO"
                  isKitchenOnly={true}
                />
                <div className="print-page-break my-4 border-b-2 border-dashed border-black"></div>
                <PrintableReceipt
                  order={orderToPrint}
                  settings={printSettings}
                  viaTitle="VIA 2 - ENTREGA / CLIENTE"
                  isKitchenOnly={false}
                />
              </>
            ) : (
              <PrintableReceipt
                order={orderToPrint}
                settings={printSettings}
                viaTitle={undefined}
                isKitchenOnly={false}
              />
            )}
          </>
        )}
      </div>

      {/* Print Modal only when explicitly requested */}
      {modalOrderToPrint && (
        <PrintModal
          order={modalOrderToPrint}
          settings={printSettings}
          onClose={() => setModalOrderToPrint(null)}
        />
      )}
      
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-3 px-4 py-3 font-bold uppercase tracking-widest rounded-lg transition-all ${active ? 'bg-yellow-400 text-black shadow-lg translate-x-2' : 'text-zinc-400 hover:text-white hover:bg-stone-900'}`}
    >
      {icon} {label}
    </button>
  );
}

// ----------------------------------------------------------------------
// ORDERS KANBAN
// ----------------------------------------------------------------------
function OrdersKanban({ orders, setOrderToPrint, printSettings, setPrintSettings, onOpenAutoPrintApp, products = [] }: any) {
  const { addToast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmPrintUnpaidOrder, setConfirmPrintUnpaidOrder] = useState<Order | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  const handleMarkAsPaidAndPrint = async (order: Order) => {
    if (!order.id) return;
    try {
      playSound('order_alert');
      await markOrderAsPaid(order.id, order.orderNumber);
      addToast({
        title: 'Pedido Confirmado!',
        message: `Pedido #${order.orderNumber || ''} marcado como PAGO! Comanda impressa na cozinha.`,
        type: 'success'
      });
      const paidOrder = { ...order, isPaid: true, paymentStatus: 'pago' as const };
      await executePrintOrder(paidOrder, printSettings, setOrderToPrint, addToast, { force: true });
    } catch (err) {
      console.error('Erro ao marcar pedido como pago:', err);
      addToast({ message: 'Erro ao marcar pedido como pago', type: 'error' });
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === orders.length) setSelectedIds(newSet => new Set());
    else setSelectedIds(new Set(orders.map((o: Order) => o.id!)));
  };

  const bulkChangeStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    for (const id of Array.from(selectedIds) as string[]) {
      await updateOrderStatus(id, status);
    }
    addToast({ message: `${selectedIds.size} pedidos movidos para ${status.toUpperCase()}`, type: 'success' });
    setSelectedIds(new Set());
  };

  const printMass = () => {
    if (selectedIds.size === 0) return;
    const selectedOrders = orders.filter((o: Order) => selectedIds.has(o.id!));
    const paidSelected = selectedOrders.filter((o: Order) => isOrderPaid(o));
    if (paidSelected.length === 0) {
      addToast({
        message: 'Atenção: Só podem ir para a comanda os pedidos que foram PAGOS! Confirme o pagamento primeiro.',
        type: 'warning'
      });
      return;
    }
    if (paidSelected.length < selectedOrders.length) {
      addToast({
        message: `Imprimindo apenas os ${paidSelected.length} pedidos PAGOS. Pedidos pendentes foram ignorados.`,
        type: 'info'
      });
    }
    let delay = 0;
    paidSelected.forEach((order: Order) => {
      setTimeout(() => {
        executePrintOrder(order, printSettings, setOrderToPrint, addToast, { force: true });
      }, delay);
      delay += 2500;
    });
    setSelectedIds(new Set());
  };

  const deleteSelected = () => {
    if (selectedIds.size > 0) setConfirmDeleteOpen(true);
  };
  
  const performDelete = async () => {
    for (const id of Array.from(selectedIds) as string[]) {
      await deleteOrder(id);
    }
    addToast({ message: 'Pedidos apagados', type: 'success' });
    setSelectedIds(new Set());
  };

  const formatOrderTime = (createdAt: any): string => {
    if (!createdAt) return '';
    if (typeof createdAt?.toDate === 'function') {
      return createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return '';
  };

  const unpaidOrders = orders.filter((o: Order) => !isOrderPaid(o));

  const columns = [
    { id: 'recebido', title: 'Na Comanda (Pagos)', color: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
    { id: 'preparando', title: 'Em Preparo', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
    { id: 'a_caminho', title: 'A Caminho', color: 'bg-blue-100 border-blue-300 text-blue-800' },
    { id: 'entregue', title: 'Entregues', color: 'bg-green-100 border-green-300 text-green-800' }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-stone-200">
        <div>
          <h2 className="text-2xl font-display uppercase font-bold flex items-center gap-2">
            <CheckSquare size={24} className="text-yellow-500" /> Painel de Comandas (Somente Pagos)
          </h2>
          <p className="text-xs text-stone-500 font-medium">
            Apenas pedidos com pagamento confirmado entram nas colunas da comanda, disparam o alerta sonoro e imprimem.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowNewOrderModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
            title="Lançar novo pedido manualmente (Balcão, WhatsApp, Telefone)"
          >
            <Plus size={15} className="stroke-[3]" />
            Lançar Pedido
          </button>

          <button
            type="button"
            onClick={onOpenAutoPrintApp}
            className="flex items-center gap-2 bg-stone-950 hover:bg-stone-800 text-emerald-400 border border-emerald-500/40 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
            title="Abrir e instalar o aplicativo Impressão Automática no Windows"
          >
            <Zap size={14} className="fill-emerald-400" />
            App Impressão Automática
          </button>

          <div className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
            <span className="text-xs font-bold uppercase text-stone-500">Imp. Auto</span>
            <button
              onClick={async () => {
                const updated = { ...printSettings, autoPrint: !printSettings.autoPrint };
                setPrintSettings(updated);
                try { await savePrinterSettings(updated); } catch {}
              }}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${printSettings.autoPrint ? 'bg-green-500' : 'bg-stone-300'}`}
            >
              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${printSettings.autoPrint ? 'left-6' : 'left-1'}`}></div>
            </button>
          </div>

          <button
            type="button"
            onClick={() => playSound('order_alert')}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-900 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer"
            title="Testar áudio de alerta de novo pedido"
          >
            <Volume2 size={15} /> Testar Alerta
          </button>
          
          <button onClick={selectAll} className="text-sm font-bold uppercase text-stone-600 hover:text-black">
            {selectedIds.size === orders.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </button>
          <span className="font-bold text-sm bg-stone-900 text-white px-2 py-1 rounded">{selectedIds.size} selecionados</span>
          
          <div className="flex gap-1 bg-stone-100 p-1 rounded-lg">
            <button onClick={() => bulkChangeStatus('recebido')} className="px-2 py-1 bg-white border border-stone-200 rounded text-xs font-bold shadow-sm hover:bg-stone-50">Recebido</button>
            <button onClick={() => bulkChangeStatus('preparando')} className="px-2 py-1 bg-yellow-100 border border-yellow-200 text-yellow-800 rounded text-xs font-bold shadow-sm hover:bg-yellow-200">Preparo</button>
            <button onClick={() => bulkChangeStatus('a_caminho')} className="px-2 py-1 bg-blue-100 border border-blue-200 text-blue-800 rounded text-xs font-bold shadow-sm hover:bg-blue-200">Envio</button>
            <button onClick={() => bulkChangeStatus('entregue')} className="px-2 py-1 bg-green-100 border border-green-200 text-green-800 rounded text-xs font-bold shadow-sm hover:bg-green-200">Entregue</button>
          </div>

          <button onClick={printMass} className="bg-stone-900 text-yellow-400 p-2 rounded-lg hover:bg-stone-800 transition-colors tooltip" title="Imprimir comandas pagas selecionadas">
            <Printer size={18} />
          </button>
          <button onClick={deleteSelected} className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors" title="Apagar selecionados">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto flex gap-6 pb-4">
        {/* COLUNA DE RETENÇÃO: PEDIDOS AGUARDANDO PAGAMENTO (FORA DA COMANDA) */}
        <div className="flex-none w-80 flex flex-col bg-amber-50/80 rounded-2xl border-2 border-amber-300 overflow-hidden">
          <div className="p-3 border-b-2 flex justify-between items-center bg-amber-200/90 border-amber-300 text-amber-950">
            <div>
              <h3 className="font-black uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Clock size={14} /> Aguardando Pagamento
              </h3>
              <span className="text-[10px] font-bold text-amber-800 block">
                Fora da Comanda • Sem Alerta
              </span>
            </div>
            <span className="bg-white/80 px-2.5 py-0.5 rounded-full text-xs font-black text-amber-950">
              {unpaidOrders.length}
            </span>
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {unpaidOrders.length === 0 ? (
              <div className="text-center py-8 px-3 text-xs text-amber-800/70 font-medium">
                Nenhum pedido pendente de pagamento no momento.
              </div>
            ) : (
              unpaidOrders.map((order: Order) => (
                <div key={order.id} className={`bg-white p-3 rounded-xl border-2 shadow-sm relative transition-all ${selectedIds.has(order.id!) ? 'border-yellow-400 shadow-md ring-4 ring-yellow-400/20' : 'border-amber-300 hover:border-amber-400'}`}>
                  <div className="absolute top-3 right-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleSelect(order.id!); }}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedIds.has(order.id!) ? 'bg-yellow-400 border-yellow-400' : 'border-stone-300'}`}>
                      {selectedIds.has(order.id!) && <Check size={12} className="text-black stroke-[4]"/>}
                    </div>
                  </div>
                  
                  <div className="pr-8 cursor-pointer" onClick={() => setEditingOrder(order)}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-black text-base text-black bg-amber-400 px-2 py-0.5 rounded border border-amber-500 shadow-xs tracking-tight">
                        {order.orderNumber ? `PEDIDO #${order.orderNumber}` : `#${order.id?.substring(0,6).toUpperCase()}`}
                      </span>
                      <span className="text-xs text-stone-500 font-bold bg-stone-100 px-2 py-1 rounded">
                        {formatOrderTime(order.createdAt)}
                      </span>
                    </div>
                    <div className="font-bold text-stone-800 mb-1">{order.userName || 'Anônimo'}</div>
                    <div className="text-xs text-stone-500 font-medium mb-2 flex items-center gap-1 line-clamp-1">
                      {order.address || 'Retirada no Balcão'}
                    </div>

                    {/* Itens do Pedido em Destaque e Negrito no Cartão */}
                    {order.items && order.items.length > 0 && (
                      <div className="my-2 p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1">
                        {order.items.map((it: any, itIdx: number) => (
                          <div key={itIdx} className="font-black text-stone-900 leading-tight flex items-start gap-1">
                            <span className="font-black bg-black text-white px-1.5 py-0.2 rounded text-[11px] shrink-0">{it.quantity}x</span>
                            <span className="break-words font-black">{it.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center border-t border-dashed border-stone-200 pt-2 flex-wrap gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-amber-700">R$ {order.totalPrice.toFixed(2)}</span>
                        <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                          <Clock size={10} /> Aguardando Pgto
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-stone-100 px-2 py-0.5 rounded text-stone-600 border border-stone-200 max-w-[110px] truncate" title={order.paymentMethod || 'PIX'}>
                        {order.paymentMethod || 'PIX'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await handleMarkAsPaidAndPrint(order);
                      }}
                      className="w-full mt-2.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      title="Confirmar pagamento do PIX, disparar alerta sonoro e enviar para a comanda"
                    >
                      <Check size={15} className="stroke-[3]" />
                      <span>Marcar como Pago (Confirmar Pedido)</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUNAS OFICIAIS DA COMANDA (SOMENTE PEDIDOS PAGOS!) */}
        {columns.map(col => {
          const colPaidOrders = orders.filter((o: Order) => {
            if (!isOrderPaid(o)) return false;
            const s = (o.status || 'recebido').toLowerCase();
            if (col.id === 'recebido') {
              return s === 'recebido' || s === 'pendente' || s === 'novo' || s === 'aguardando' || (s !== 'preparando' && s !== 'a_caminho' && s !== 'entregue');
            }
            return s === col.id;
          });
          return (
            <div key={col.id} className={`flex-none w-80 flex flex-col bg-stone-200/50 rounded-2xl border-2 border-stone-200/50 overflow-hidden`}>
              <div className={`p-3 border-b-2 flex justify-between items-center ${col.color}`}>
                <h3 className="font-bold uppercase tracking-widest text-sm">{col.title}</h3>
                <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-black">
                  {colPaidOrders.length}
                </span>
              </div>
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {colPaidOrders.map((order: Order) => (
                  <div key={order.id} className={`bg-white p-3 rounded-xl border-2 shadow-sm relative transition-all ${selectedIds.has(order.id!) ? 'border-yellow-400 shadow-md ring-4 ring-yellow-400/20' : 'border-stone-200 hover:border-stone-300'}`}>
                    <div className="absolute top-3 right-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleSelect(order.id!); }}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedIds.has(order.id!) ? 'bg-yellow-400 border-yellow-400' : 'border-stone-300'}`}>
                        {selectedIds.has(order.id!) && <Check size={12} className="text-black stroke-[4]"/>}
                      </div>
                    </div>
                    
                    <div className="pr-8 cursor-pointer" onClick={() => setEditingOrder(order)}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-black text-base text-black bg-yellow-400 px-2 py-0.5 rounded border border-yellow-500 shadow-xs tracking-tight">
                          {order.orderNumber ? `PEDIDO #${order.orderNumber}` : `#${order.id?.substring(0,6).toUpperCase()}`}
                        </span>
                        <span className="text-xs text-stone-500 font-bold bg-stone-100 px-2 py-1 rounded">
                          {formatOrderTime(order.createdAt)}
                        </span>
                      </div>
                      <div className="font-bold text-stone-800 mb-1">{order.userName || 'Anônimo'}</div>
                      <div className="text-xs text-stone-500 font-medium mb-2 flex items-center gap-1 line-clamp-1">
                        {order.address || 'Retirada no Balcão'}
                      </div>

                      {/* Itens do Pedido em Destaque e Negrito no Cartão */}
                      {order.items && order.items.length > 0 && (
                        <div className="my-2 p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1">
                          {order.items.map((it: any, itIdx: number) => (
                            <div key={itIdx} className="font-black text-stone-900 leading-tight flex items-start gap-1">
                              <span className="font-black bg-black text-white px-1.5 py-0.2 rounded text-[11px] shrink-0">{it.quantity}x</span>
                              <span className="break-words font-black">{it.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between items-center border-t border-dashed border-stone-200 pt-2 flex-wrap gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-green-600">R$ {order.totalPrice.toFixed(2)}</span>
                          <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                            <Check size={10} className="stroke-[3]" /> Pago
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold uppercase bg-stone-100 px-2 py-0.5 rounded text-stone-600 border border-stone-200 max-w-[110px] truncate" title={order.paymentMethod || 'Pago'}>{order.paymentMethod || 'Pago'}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              executePrintOrder(order, printSettings, setOrderToPrint, addToast, { force: true });
                            }}
                            className="p-1.5 rounded-lg transition-colors cursor-pointer bg-stone-100 hover:bg-yellow-400 hover:text-black text-stone-700"
                            title="Imprimir Comanda"
                          >
                            <Printer size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Modal */}
      <AnimatePresence>
        {editingOrder && (
          <OrderEditModal 
            order={editingOrder} 
            onClose={() => setEditingOrder(null)} 
            onSave={async (updates: any) => {
              await saveOrderAdmin(editingOrder.id!, updates);
              addToast({ message: 'Comanda atualizada', type: 'success' });
              setEditingOrder(null);
            }}
            onPrint={() => {
              executePrintOrder(editingOrder, printSettings, setOrderToPrint, addToast);
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal de Lançar Novo Pedido Manualmente */}
      <AnimatePresence>
        {showNewOrderModal && (
          <NewOrderModal
            isOpen={showNewOrderModal}
            onClose={() => setShowNewOrderModal(false)}
            orders={orders}
            products={products}
            setOrderToPrint={setOrderToPrint}
            printSettings={printSettings}
          />
        )}
      </AnimatePresence>
      <ConfirmModal isOpen={confirmDeleteOpen} message={`Tem certeza que deseja apagar ${selectedIds.size} pedidos permanentemente?`} onConfirm={performDelete} onCancel={() => setConfirmDeleteOpen(false)} />

      {/* Modal de Confirmação para Imprimir Pedido Não Pago */}
      <AnimatePresence>
        {confirmPrintUnpaidOrder && (
          <div className="fixed inset-0 bg-black/70 z-[140] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-amber-400 text-stone-900 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase tracking-tight">Pedido Não Pago</h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Pedido #{confirmPrintUnpaidOrder.orderNumber || confirmPrintUnpaidOrder.id?.substring(0, 4)} está como "Aguardando Pagamento".
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed font-medium">
                Pela regra da loja, <strong>somente pedidos pagos devem ir para a comanda da cozinha</strong>. Você deseja confirmar o pagamento agora e imprimir?
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    const ord = confirmPrintUnpaidOrder;
                    setConfirmPrintUnpaidOrder(null);
                    await handleMarkAsPaidAndPrint(ord);
                  }}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black uppercase text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check size={16} className="stroke-[3]" />
                  <span>Confirmar Pagamento & Imprimir Comanda</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const ord = confirmPrintUnpaidOrder;
                    setConfirmPrintUnpaidOrder(null);
                    executePrintOrder(ord, printSettings, setOrderToPrint, addToast, { force: true });
                  }}
                  className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase text-xs rounded-xl transition-all cursor-pointer"
                >
                  Imprimir Mesmo Sem Pagamento
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmPrintUnpaidOrder(null)}
                  className="w-full py-2 text-stone-500 hover:text-stone-800 font-bold uppercase text-xs text-center cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NewOrderModal({ isOpen, onClose, orders, products = [], setOrderToPrint, printSettings }: any) {
  const { addToast } = useToast();
  const [userName, setUserName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [orderType, setOrderType] = useState<'entrega' | 'balcao'>('entrega');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('Passo Fundo');
  const [paymentMethod, setPaymentMethod] = useState('PIX Imediato');
  const [isPaid, setIsPaid] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [adminNotes, setAdminNotes] = useState('');
  
  // Lista de itens do pedido
  const [items, setItems] = useState<Array<{ name: string; quantity: number; price: number; observation?: string }>>([]);
  
  // Adicionar item do cardápio
  const [selectedProdId, setSelectedProdId] = useState('');
  
  // Adicionar item customizado/livre
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemQty, setCustomItemQty] = useState(1);
  const [customItemObs, setCustomItemObs] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddProductFromCatalog = () => {
    if (!selectedProdId) return;
    const prod = products.find((p: any) => p.id === selectedProdId);
    if (!prod) return;
    setItems(prev => [...prev, {
      name: prod.name,
      quantity: 1,
      price: Number(prod.price) || 0,
      observation: ''
    }]);
    setSelectedProdId('');
  };

  const handleAddCustomItem = () => {
    if (!customItemName.trim()) return;
    const p = parseFloat(customItemPrice.replace(',', '.')) || 0;
    setItems(prev => [...prev, {
      name: customItemName.trim(),
      quantity: customItemQty > 0 ? customItemQty : 1,
      price: p,
      observation: customItemObs.trim() || undefined
    }]);
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemQty(1);
    setCustomItemObs('');
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const itemsSubtotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  const finalTotal = itemsSubtotal + (orderType === 'entrega' ? deliveryFee : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      addToast({ title: 'Atenção', message: 'Informe o nome do cliente', type: 'warning' });
      return;
    }
    if (items.length === 0 && finalTotal <= 0) {
      addToast({ title: 'Atenção', message: 'Adicione pelo menos um item ou informe o valor', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const nextNum = Math.max(0, ...orders.map((o: any) => o.orderNumber || 0)) + 1;
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const authCode = `AUT-MANUAL-${Date.now().toString(36).substring(2, 7).toUpperCase()}`;

      const finalItems = items.length > 0 ? items : [{
        name: 'Pedido Manual / Balcão',
        quantity: 1,
        price: finalTotal,
        observation: adminNotes || ''
      }];

      const orderPayload: Omit<Order, 'createdAt' | 'id'> = {
        orderNumber: nextNum,
        userName: userName.trim(),
        whatsapp: whatsapp.trim() || undefined,
        address: orderType === 'entrega' ? (address.trim() || 'Entrega Passo Fundo') : 'Retirada no Balcão',
        region: orderType === 'entrega' ? region : 'Balcão',
        paymentMethod,
        paymentStatus: isPaid ? 'pago' : 'pendente',
        isPaid,
        items: finalItems,
        totalPrice: finalTotal,
        totalPoints: Math.floor(finalTotal),
        deliveryFee: orderType === 'entrega' ? deliveryFee : 0,
        receiptAuthCode: authCode,
        receiptTimestamp: `${dateStr} às ${timeStr}`,
        receiptSummary: `R$ ${finalTotal.toFixed(2).replace('.', ',')} via ${paymentMethod}`,
        adminNotes: adminNotes.trim() || undefined,
        status: 'recebido'
      };

      const newId = await saveOrder('admin_manual', orderPayload);
      const fullSavedOrder: Order = {
        ...orderPayload,
        id: newId,
        createdAt: now.toISOString()
      };

      if (isPaid) {
        playSound('order_alert');
        try {
          await executePrintOrder(fullSavedOrder, printSettings, setOrderToPrint, addToast, { force: true });
        } catch (_) {}
      }

      addToast({
        title: 'Pedido Lançado!',
        message: `Pedido #${nextNum} (${userName}) lançado e enviado para a comanda!`,
        type: 'success'
      });

      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar pedido manual:', err);
      addToast({ title: 'Erro', message: 'Erro ao cadastrar pedido: ' + err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-stone-900"
      >
        <div className="p-5 border-b-2 border-stone-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Plus size={20} className="stroke-[3]" />
            </span>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Lançar Novo Pedido</h2>
              <p className="text-xs text-stone-500 font-medium">Balcão, WhatsApp, Telefone ou Recuperação de Pedido</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
          {/* Informações do Cliente */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                Nome do Cliente <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="Ex: Carlos Eduardo"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                className="w-full border-2 border-stone-200 rounded-lg p-2.5 font-bold focus:border-emerald-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                WhatsApp / Telefone
              </label>
              <input
                type="text"
                placeholder="(54) 99999-9999"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full border-2 border-stone-200 rounded-lg p-2.5 font-bold focus:border-emerald-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Tipo e Endereço */}
          <div>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setOrderType('entrega')}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                  orderType === 'entrega'
                    ? 'bg-amber-500 text-stone-900 shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                🛵 Entrega / Delivery
              </button>
              <button
                type="button"
                onClick={() => setOrderType('balcao')}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                  orderType === 'balcao'
                    ? 'bg-amber-500 text-stone-900 shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                🏪 Retirada no Balcão
              </button>
            </div>

            {orderType === 'entrega' && (
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Rua, Número, Bairro, Complemento"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full border-2 border-stone-200 rounded-lg p-2.5 font-bold focus:border-emerald-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 border-2 border-stone-200 rounded-lg p-2 focus-within:border-emerald-500 bg-white">
                    <span className="text-xs font-bold text-stone-400">Taxa R$</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={deliveryFee || ''}
                      onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full font-bold outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pagamento */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full border-2 border-stone-200 rounded-lg p-2.5 font-bold focus:border-emerald-500 outline-none text-sm bg-white"
              >
                <option value="PIX Imediato">PIX Imediato</option>
                <option value="Cartão de Crédito na Entrega">Cartão de Crédito na Entrega</option>
                <option value="Cartão de Débito na Entrega">Cartão de Débito na Entrega</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão Online (Aprovado)">Cartão Online (Aprovado)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                Status do Pagamento
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaid(true)}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                    isPaid
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-emerald-300'
                  }`}
                >
                  <Check size={14} className="stroke-[3]" />
                  <span>Pago (Vai p/ Comanda)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaid(false)}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                    !isPaid
                      ? 'bg-amber-500 border-amber-500 text-stone-900 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-amber-300'
                  }`}
                >
                  <Clock size={14} />
                  <span>Pendente</span>
                </button>
              </div>
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="border-2 border-stone-200 rounded-xl p-4 bg-stone-50/60 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black uppercase tracking-wider text-stone-700">
                Itens do Pedido ({items.length})
              </label>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Subtotal: R$ {itemsSubtotal.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* Adicionar a partir do Cardápio */}
            {products.length > 0 && (
              <div className="flex gap-2">
                <select
                  value={selectedProdId}
                  onChange={e => setSelectedProdId(e.target.value)}
                  className="flex-1 border border-stone-300 rounded-lg p-2 text-xs font-bold bg-white"
                >
                  <option value="">➕ Selecionar produto do cardápio...</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - R$ {Number(p.price || 0).toFixed(2).replace('.', ',')}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddProductFromCatalog}
                  disabled={!selectedProdId}
                  className="bg-stone-900 text-yellow-400 px-3 py-1.5 rounded-lg text-xs font-black uppercase hover:bg-stone-800 disabled:opacity-40"
                >
                  Adicionar
                </button>
              </div>
            )}

            {/* Adicionar Item Livre / Manual */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-stone-200">
              <input
                type="text"
                placeholder="Nome do lanche/bebida ou item avulso"
                value={customItemName}
                onChange={e => setCustomItemName(e.target.value)}
                className="sm:col-span-5 border border-stone-300 rounded-lg p-2 text-xs font-bold bg-white outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                min="1"
                value={customItemQty}
                onChange={e => setCustomItemQty(parseInt(e.target.value) || 1)}
                placeholder="Qtd"
                className="sm:col-span-2 border border-stone-300 rounded-lg p-2 text-xs font-bold bg-white text-center"
              />
              <input
                type="text"
                placeholder="Preço (ex: 28,00)"
                value={customItemPrice}
                onChange={e => setCustomItemPrice(e.target.value)}
                className="sm:col-span-3 border border-stone-300 rounded-lg p-2 text-xs font-bold bg-white"
              />
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="sm:col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-lg p-2 transition-colors cursor-pointer"
              >
                Inserir
              </button>
            </div>
            {customItemName && (
              <input
                type="text"
                placeholder="Observação do item (opcional, ex: sem cebola)"
                value={customItemObs}
                onChange={e => setCustomItemObs(e.target.value)}
                className="w-full border border-stone-300 rounded-lg p-1.5 text-xs bg-white"
              />
            )}

            {/* Lista dos Itens inseridos */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1">
              {items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white border border-stone-200 rounded-lg p-2 text-xs">
                  <div className="flex-1">
                    <span className="font-bold text-stone-900">{it.quantity}x {it.name}</span>
                    {it.observation && <p className="text-[11px] text-amber-600 font-medium italic">Obs: {it.observation}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-stone-900">R$ {(it.price * it.quantity).toFixed(2).replace('.', ',')}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-center py-2 text-xs text-stone-400 font-medium">Nenhum item adicionado ainda. Escolha do cardápio ou digite acima.</p>
              )}
            </div>
          </div>

          {/* Observações / Notas do Pedido */}
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
              Observações Gerais (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Ponto de referência, observações da cozinha, etc."
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              className="w-full border-2 border-stone-200 rounded-lg p-2.5 font-medium text-xs focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Resumo e Botão de Ação */}
          <div className="border-t-2 border-stone-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-stone-500 block uppercase font-bold">Valor Total a Cobrar</span>
              <span className="text-2xl font-black text-stone-900 font-display">
                R$ {finalTotal.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 border-2 border-stone-200 rounded-xl font-bold text-stone-600 text-xs uppercase hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Plus size={16} className="stroke-[3]" />
                <span>{isSubmitting ? 'Salvando...' : 'Criar e Enviar p/ Comanda'}</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function OrderEditModal({ order, onClose, onSave, onPrint }: any) {
  const isInitiallyPaid = isOrderPaid(order);
  const [formData, setFormData] = useState({
    userName: order.userName || '',
    address: order.address || '',
    paymentMethod: order.paymentMethod || '',
    status: order.status || 'recebido',
    isPaid: isInitiallyPaid,
    paymentStatus: isInitiallyPaid ? 'pago' : (order.paymentStatus || 'pendente'),
    adminNotes: order.adminNotes || ''
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b-2 border-stone-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-2xl font-black uppercase flex items-center gap-2">
            <span className="bg-yellow-400 text-black px-3 py-1 rounded-xl border border-yellow-500 shadow-sm font-black tracking-tight">
              PEDIDO #{order.orderNumber || order.id?.substring(0, 6).toUpperCase()}
            </span>
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (!formData.isPaid) {
                  onPrint();
                } else {
                  onPrint();
                }
              }} 
              className="p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"
              title="Imprimir comanda"
            >
              <Printer size={20}/>
            </button>
            <button onClick={onClose} className="p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"><X size={20}/></button>
          </div>
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-6 flex-1">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Cliente</label>
              <input value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg p-2 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Endereço / Retirada</label>
              <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg p-2 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Método de Pagamento</label>
              <input value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg p-2 font-bold" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Status do Pagamento</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPaid: true, paymentStatus: 'pago' })}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                    formData.isPaid
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-emerald-300'
                  }`}
                >
                  <Check size={14} className="stroke-[3]" />
                  <span>Pago (Liberado)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPaid: false, paymentStatus: 'pendente' })}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                    !formData.isPaid
                      ? 'bg-amber-500 border-amber-500 text-stone-950 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-amber-300'
                  }`}
                >
                  <Clock size={14} />
                  <span>Aguardando Pgto</span>
                </button>
              </div>
              <p className="text-[10px] text-stone-500 mt-1">
                {formData.isPaid
                  ? '✅ Comanda autorizada para impressão na cozinha.'
                  : '⚠️ Pedido bloqueado para a comanda até confirmação do pagamento.'}
              </p>
            </div>

            {!formData.isPaid && (
              <button
                type="button"
                onClick={async () => {
                  const updatedData = { ...formData, isPaid: true, paymentStatus: 'pago' };
                  setFormData(updatedData);
                  await onSave(updatedData);
                  onPrint();
                }}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <CreditCard size={15} />
                <span>Confirmar Pagamento & Imprimir Comanda</span>
              </button>
            )}

            {order.receiptAuthCode && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1 text-xs">
                <div className="font-bold text-amber-900 flex items-center justify-between">
                  <span>Comprovante de Pagamento</span>
                  <span className="font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[11px]">{order.receiptAuthCode}</span>
                </div>
                {order.receiptTimestamp && (
                  <p className="text-stone-600"><span className="font-semibold">Horário:</span> {order.receiptTimestamp}</p>
                )}
                {order.receiptNotes && (
                  <p className="text-stone-600"><span className="font-semibold">Obs:</span> {order.receiptNotes}</p>
                )}
                {order.receiptFileName && (
                  <p className="text-stone-600"><span className="font-semibold">Comprovante Anexo:</span> {order.receiptFileName}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg p-2 font-bold bg-white">
                <option value="recebido">Recebido</option>
                <option value="preparando">Em Preparo</option>
                <option value="a_caminho">A Caminho</option>
                <option value="entregue">Entregue</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Notas Internas (Não imprime)</label>
              <textarea value={formData.adminNotes} onChange={e => setFormData({...formData, adminNotes: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg p-2 font-bold" rows={3}></textarea>
            </div>
          </div>
          <div className="bg-stone-100 p-4 rounded-xl border border-stone-200">
            <h3 className="font-black uppercase mb-4 pb-2 border-b-2 border-stone-300 tracking-wider text-sm flex items-center justify-between">
              <span>ITENS DO PEDIDO</span>
              <span className="text-xs bg-stone-200 text-stone-800 px-2 py-0.5 rounded-full font-black">
                {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'itens'}
              </span>
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="bg-white p-3.5 rounded-xl shadow-sm border-2 border-stone-300">
                  <div className="flex justify-between items-center font-black text-base">
                    <span className="flex items-center gap-2 text-stone-950 font-black">
                      <span className="bg-black text-white px-2 py-0.5 rounded text-sm font-black">{item.quantity}x</span>
                      <span>{item.name}</span>
                    </span>
                    <span className="font-mono text-emerald-700 font-black text-base whitespace-nowrap">
                      R$ {((item.price + (item.extras?.reduce((s:any,e:any)=>s+e.price,0)||0)) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  {item.extras && item.extras.length > 0 && (
                    <div className="mt-2 pl-2.5 text-xs space-y-1 bg-yellow-50/90 p-2 rounded-lg border-l-4 border-amber-500">
                      <span className="font-black text-amber-950 uppercase text-[11px] block">ADICIONAIS:</span>
                      {item.extras.map((e: any, exIdx: number) => (
                        <div key={exIdx} className="flex justify-between font-bold text-stone-900">
                          <span>• {e.name}</span>
                          <span className="font-mono text-amber-950 font-black">
                            {e.price > 0 ? `+ R$ ${Number(e.price).toFixed(2).replace('.', ',')}` : '(Incluso)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.observation && (
                    <div className="text-xs bg-red-50 border-l-4 border-red-500 text-red-900 p-2 font-black mt-2 uppercase rounded-r leading-tight">
                      &gt;&gt; OBS: {item.observation}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t-2 border-stone-300 flex justify-between items-center">
              <span className="font-bold uppercase text-stone-600">Total do Pedido</span>
              <span className="font-black text-2xl text-black">R$ {order.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="p-6 border-t-2 border-stone-100 flex justify-end gap-3 bg-stone-50 rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-3 font-bold uppercase tracking-widest text-stone-500 hover:bg-stone-200 rounded-lg transition-colors">Cancelar</button>
          <button onClick={() => onSave(formData)} className="px-6 py-3 font-bold uppercase tracking-widest bg-yellow-400 text-black hover:bg-yellow-500 rounded-lg transition-colors flex items-center gap-2 shadow-md"><Save size={18}/> Salvar Alterações</button>
        </div>
      </motion.div>
    </div>
  );
}

// ----------------------------------------------------------------------
// PRODUCT EDITOR (Enhanced with Pause / Resume Controls)
// ----------------------------------------------------------------------
function ProductEditor({ products }: { products: Product[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [promptImage, setPromptImage] = useState(false);
  const [promptExtraName, setPromptExtraName] = useState(false);
  const [promptExtraPrice, setPromptExtraPrice] = useState(false);
  const [tempExtraName, setTempExtraName] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { addToast } = useToast();
  
  const handleEdit = (p: Product) => {
    setEditingId(p.id!);
    setFormData(p);
  };
  
  const handleAdd = () => {
    setEditingId('new');
    setFormData({ name: '', description: '', price: 0, points: 0, emoji: '🍔', category: 'lanches', images: [], productExtras: [], paused: false });
  };
  
  const handleSave = async () => {
    try {
      await saveProduct(formData as Product, editingId === 'new' ? undefined : editingId!);
      addToast({ message: 'Produto salvo com sucesso!', type: 'success' });
      setEditingId(null);
    } catch (e) {
      addToast({ message: 'Erro ao salvar produto', type: 'error' as any });
    }
  };

  const handleQuickTogglePause = async (p: Product) => {
    if (!p.id) return;
    setTogglingId(p.id);
    const nextPaused = !p.paused;
    try {
      await toggleProductPause(p, nextPaused);
      addToast({
        message: nextPaused
          ? `"${p.name}" foi PAUSADO no cardápio.`
          : `"${p.name}" está ATIVO novamente no cardápio!`,
        type: nextPaused ? 'warning' : 'success',
      });
    } catch (e) {
      addToast({ message: 'Erro ao alterar status do item', type: 'error' as any });
    } finally {
      setTogglingId(null);
    }
  };
  
  const handleDelete = (id: string) => setDeleteId(id);
  const performDeleteProd = async () => {
    if (deleteId) {
      await deleteProduct(deleteId);
      addToast({ message: 'Produto removido', type: 'success' });
      setDeleteId(null);
    }
  };

  const addImage = () => setPromptImage(true);
  const performAddImage = (url: string) => {
    if (url) setFormData(prev => ({...prev, images: [...(prev.images || []), url]}));
  };

  const removeImage = (idx: number) => {
    setFormData(prev => {
      const arr = [...(prev.images || [])];
      arr.splice(idx, 1);
      return {...prev, images: arr};
    });
  };

  const addExtra = () => setPromptExtraName(true);
  const performAddExtraName = (name: string) => {
    if (name) { setTempExtraName(name); setPromptExtraPrice(true); }
  };
  const performAddExtraPrice = (priceStr: string) => {
    if (priceStr) {
      const price = parseFloat(priceStr.replace(',', '.'));
      setFormData(prev => ({
        ...prev, 
        productExtras: [...(prev.productExtras || []), { id: Math.random().toString(), name: tempExtraName, price, paused: false }]
      }));
    }
  };

  const toggleExtraPaused = (extraId: string) => {
    setFormData(prev => ({
      ...prev,
      productExtras: (prev.productExtras || []).map(e =>
        e.id === extraId ? { ...e, paused: !e.paused } : e
      )
    }));
  };

  const removeExtra = (id: string) => {
    setFormData(prev => ({
      ...prev,
      productExtras: (prev.productExtras || []).filter(e => e.id !== id)
    }));
  };

  const activeCount = products.filter(p => !p.paused).length;
  const pausedCount = products.filter(p => p.paused).length;

  const filteredProducts = products.filter(p => {
    if (statusFilter === 'active' && p.paused) return false;
    if (statusFilter === 'paused' && !p.paused) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6 bg-white p-5 rounded-xl shadow-sm border border-stone-200">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-display uppercase font-bold flex items-center gap-2 text-stone-800">
              <Package size={24} className="text-yellow-500" /> Gerenciar Produtos & Pausar Itens
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Pause qualquer lanche, porção ou bebida com 1 clique quando faltar ingrediente na cozinha.
            </p>
          </div>
          <button onClick={handleAdd} className="bg-stone-900 text-yellow-400 px-4 py-2.5 rounded-lg font-bold border-2 border-stone-900 flex items-center gap-2 hover:bg-stone-800 shadow-sm uppercase tracking-widest text-xs cursor-pointer">
            <Plus size={18} /> Novo Produto
          </button>
        </div>

        {/* Filtros de Status, Categoria e Busca */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer ${
                statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Ativos ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paused')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer ${
                statusFilter === 'paused' ? 'bg-red-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Pausados ({pausedCount})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold uppercase text-stone-700 bg-stone-50 outline-none focus:border-stone-400"
            >
              <option value="all">Todas Categorias</option>
              <option value="lanches">Lanches</option>
              <option value="combos">Combos</option>
              <option value="porcoes">Porções</option>
              <option value="bebidas">Bebidas</option>
              <option value="doces">Doces</option>
            </select>

            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produto por nome ou ingrediente..."
                className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 bg-stone-50 outline-none focus:border-stone-400"
              />
            </div>
          </div>
        </div>
      </div>
      
      {editingId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex justify-between items-center border-b-2 border-stone-100 pb-4 mb-6 sticky top-0 bg-white z-10">
              <h3 className="font-black text-2xl uppercase tracking-widest">{editingId === 'new' ? 'Novo Produto' : 'Editar Produto'}</h3>
              <button onClick={() => setEditingId(null)} className="p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold uppercase text-stone-500 border-b-2 border-stone-100 pb-2">Informações Principais</h4>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Nome do Produto</label>
                    <input placeholder="Ex: X-Salada" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-stone-200 p-3 rounded-lg font-bold" />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Emoji</label>
                    <input placeholder="🍔" value={formData.emoji || ''} onChange={e => setFormData({...formData, emoji: e.target.value})} className="w-full border-2 border-stone-200 p-3 rounded-lg text-center font-bold text-xl" />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Preço (R$)</label>
                    <input type="number" placeholder="25.90" value={formData.price || 0} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full border-2 border-stone-200 p-3 rounded-lg font-bold" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">XP (Pontos)</label>
                    <input type="number" placeholder="50" value={formData.points || 0} onChange={e => setFormData({...formData, points: Number(e.target.value)})} className="w-full border-2 border-stone-200 p-3 rounded-lg font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Categoria</label>
                    <select value={formData.category || 'lanches'} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full border-2 border-stone-200 p-3 rounded-lg font-bold bg-white">
                      <option value="lanches">Lanches</option>
                      <option value="combos">Combos</option>
                      <option value="porcoes">Porções</option>
                      <option value="bebidas">Bebidas</option>
                      <option value="doces">Doces</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Disponibilidade</label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paused: !prev.paused }))}
                      className={`w-full p-3 rounded-lg font-bold uppercase text-xs flex items-center justify-center gap-2 border-2 transition-colors cursor-pointer ${
                        formData.paused
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      }`}
                    >
                      {formData.paused ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                      {formData.paused ? 'Item Pausado (Indisponível)' : 'Item Ativo no Cardápio'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Descrição</label>
                  <textarea placeholder="Ingredientes..." value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border-2 border-stone-200 p-3 rounded-lg font-bold min-h-[100px]" />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center border-b-2 border-stone-100 pb-2 mb-4">
                    <h4 className="font-bold uppercase text-stone-500">Galeria de Fotos</h4>
                    <button onClick={addImage} className="bg-stone-100 p-1.5 rounded-lg hover:bg-stone-200 flex items-center gap-1 text-xs font-bold"><ImagePlus size={14}/> Add Foto</button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(formData.images || []).map((img, i) => (
                      <div key={i} className="relative group w-24 h-24 rounded-lg overflow-hidden border-2 border-stone-200">
                        <img src={img} className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                      </div>
                    ))}
                    {(!formData.images || formData.images.length === 0) && (
                      <div className="w-full p-4 border-2 border-dashed border-stone-300 rounded-lg text-center text-stone-500 text-sm font-bold flex flex-col items-center">
                        <ImageIcon size={24} className="mb-2 opacity-50" />
                        Sem fotos adicionadas
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center border-b-2 border-stone-100 pb-2 mb-4">
                    <h4 className="font-bold uppercase text-stone-500">Adicionais (Extras)</h4>
                    <button onClick={addExtra} className="bg-stone-100 p-1.5 rounded-lg hover:bg-stone-200 flex items-center gap-1 text-xs font-bold"><Plus size={14}/> Add Extra</button>
                  </div>
                  <div className="space-y-2">
                    {(formData.productExtras || []).map((ex) => (
                      <div key={ex.id} className={`flex justify-between items-center p-2 rounded-lg border ${ex.paused ? 'bg-red-50/60 border-red-200 opacity-75' : 'bg-stone-50 border-stone-200'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${ex.paused ? 'line-through text-stone-400' : 'text-stone-800'}`}>{ex.name}</span>
                          {ex.paused && <span className="text-[9px] font-black uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Pausado</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-bold text-xs">+R$ {ex.price.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => toggleExtraPaused(ex.id)}
                            className={`text-[10px] font-bold uppercase px-2 py-1 rounded transition-colors cursor-pointer ${
                              ex.paused ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                          >
                            {ex.paused ? 'Ativar' : 'Pausar'}
                          </button>
                          <button onClick={() => removeExtra(ex.id)} className="text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                    {(!formData.productExtras || formData.productExtras.length === 0) && (
                      <div className="text-center p-2 text-stone-400 text-sm font-bold">Nenhum adicional</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t-2 border-stone-100">
              <button onClick={() => setEditingId(null)} className="px-6 py-3 bg-stone-100 rounded-lg font-bold uppercase tracking-widest hover:bg-stone-200 text-stone-600">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-3 bg-yellow-400 rounded-lg font-bold uppercase tracking-widest hover:bg-yellow-500 flex items-center gap-2 shadow-md"><Save size={18}/> Salvar Produto</button>
            </div>
          </motion.div>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map(p => {
          const isPaused = Boolean(p.paused);
          return (
            <div
              key={p.id}
              className={`bg-white p-5 rounded-2xl border-2 shadow-sm flex flex-col justify-between transition-all group ${
                isPaused
                  ? 'border-red-300 bg-red-50/20'
                  : 'border-stone-200 hover:border-yellow-400'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className={`w-12 h-12 rounded-xl object-cover border border-stone-200 ${isPaused ? 'grayscale opacity-60' : ''}`} />
                    ) : (
                      <div className={`text-4xl ${isPaused ? 'grayscale opacity-60' : ''}`}>{p.emoji}</div>
                    )}
                    <div>
                      <span className="bg-stone-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase text-stone-500 block w-fit">
                        {p.category}
                      </span>
                      <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        isPaused
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isPaused ? 'Pausado no Cardápio' : 'Ativo no Cardápio'}
                      </span>
                    </div>
                  </div>
                </div>
                <h4 className={`font-black text-xl leading-tight mb-2 ${isPaused ? 'text-stone-500 line-through' : 'text-stone-900'}`}>{p.name}</h4>
                <p className="text-sm text-stone-500 font-medium mb-3 line-clamp-2">{p.description}</p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {(p.productExtras || []).map(ex => (
                    <span key={ex.id} className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${ex.paused ? 'bg-red-50 text-red-600 border-red-200 line-through' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>+{ex.name}</span>
                  ))}
                </div>
                <div className="flex justify-between items-center font-black tabular-nums">
                  <span className="text-lg text-green-600">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                  <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-100 text-xs">+{p.points} XP</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t-2 border-stone-100">
                <button
                  type="button"
                  disabled={togglingId === p.id}
                  onClick={() => handleQuickTogglePause(p)}
                  className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center font-bold uppercase tracking-wider text-xs gap-1.5 transition-colors cursor-pointer ${
                    isPaused
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  }`}
                >
                  {isPaused ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
                  {isPaused ? 'Ativar Item' : 'Pausar Item'}
                </button>
                <button onClick={() => handleEdit(p)} className="px-3.5 py-2.5 bg-stone-900 text-yellow-400 rounded-lg flex items-center justify-center font-bold uppercase tracking-wider text-xs gap-1.5 hover:bg-stone-800 transition-colors cursor-pointer"><Edit2 size={14}/> Editar</button>
                <button onClick={() => handleDelete(p.id!)} className="w-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors cursor-pointer"><Trash2 size={16}/></button>
              </div>
            </div>
          );
        })}
      </div>
      <ConfirmModal isOpen={!!deleteId} message="Tem certeza? Removerá o produto para sempre." onConfirm={performDeleteProd} onCancel={() => setDeleteId(null)} />
      <PromptModal isOpen={promptImage} title="URL da Imagem" onConfirm={performAddImage} onCancel={() => setPromptImage(false)} />
      <PromptModal isOpen={promptExtraName} title="Nome do Adicional" onConfirm={performAddExtraName} onCancel={() => setPromptExtraName(false)} />
      <PromptModal isOpen={promptExtraPrice} title="Preço do Adicional" onConfirm={performAddExtraPrice} onCancel={() => setPromptExtraPrice(false)} />
    </div>
  );
}

// ----------------------------------------------------------------------
// STORE HOURS EDITOR (Horário de Funcionamento Alterável)
// ----------------------------------------------------------------------
function StoreHoursEditor({
  settings,
  onSave,
}: {
  settings: StoreHoursSettings;
  onSave: (updated: StoreHoursSettings) => Promise<void>;
}) {
  const [formData, setFormData] = useState<StoreHoursSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [spClock, setSpClock] = useState(() => getSaoPauloNow());
  const { addToast } = useToast();

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSpClock(getSaoPauloNow());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const liveStatus = getStoreStatus(formData);

  const handleDayChange = (dayOfWeek: number, field: 'enabled' | 'openTime' | 'closeTime', value: any) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d
      ),
    }));
  };

  const applyTimeToAllEnabledDays = (openTime: string, closeTime: string) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule.map((d) => (d.enabled ? { ...d, openTime, closeTime } : d)),
    }));
    addToast({
      message: `Horário ${openTime} às ${closeTime} copiado para todos os dias ativos! Clique em Salvar para confirmar.`,
      type: 'info',
    });
  };

  const handleSaveHours = async (customSettings?: StoreHoursSettings) => {
    const toSave = customSettings || formData;
    setIsSaving(true);
    try {
      await onSave(toSave);
      addToast({
        title: 'Horário Atualizado!',
        message: 'As configurações de horário de funcionamento foram salvas em tempo real.',
        type: 'success',
      });
    } catch {
      addToast({ message: 'Erro ao salvar horário de funcionamento', type: 'error' as any });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-stone-200">
        <div>
          <h2 className="text-2xl font-display uppercase font-bold flex items-center gap-2 text-stone-900">
            <Clock size={24} className="text-yellow-500" /> Horário de Funcionamento
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Defina os dias e horários de abertura do delivery ou abra/feche a loja manualmente a qualquer momento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-stone-100 border border-stone-200 px-3.5 py-2 rounded-xl text-right">
            <span className="text-[10px] font-bold uppercase text-stone-500 block">Horário Passo Fundo / RS</span>
            <span className="font-mono font-black text-sm text-stone-900 tabular-nums">{spClock.timeString}</span>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveHours()}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold uppercase tracking-wider text-xs px-5 py-3 rounded-xl shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Save size={16} />
            {isSaving ? 'Salvando...' : 'Salvar Horários'}
          </button>
        </div>
      </div>

      {/* Modo de Operação e Status Atual */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h3 className="font-black uppercase text-base text-stone-900">Modo de Operação da Loja</h3>
            <p className="text-xs text-stone-500 font-medium">
              Escolha se o site deve seguir a tabela de horários automaticamente ou ficar aberto/fechado manualmente.
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider border ${
            liveStatus.isOpen
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            Status no Site Agora: {liveStatus.badgeText}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              const updated = { ...formData, mode: 'auto' as const };
              setFormData(updated);
              handleSaveHours(updated);
            }}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              formData.mode === 'auto'
                ? 'border-yellow-400 bg-yellow-50/50 shadow-sm'
                : 'border-stone-200 hover:border-stone-300 bg-white'
            }`}
          >
            <div className="font-black uppercase text-sm text-stone-900 mb-1 flex items-center justify-between">
              <span>Seguir Tabela de Horários</span>
              {formData.mode === 'auto' && <Check size={16} className="text-yellow-600 stroke-[3]" />}
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Abre e fecha automaticamente conforme os dias e horários configurados na tabela abaixo.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              const updated = { ...formData, mode: 'open' as const };
              setFormData(updated);
              handleSaveHours(updated);
            }}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              formData.mode === 'open'
                ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                : 'border-stone-200 hover:border-stone-300 bg-white'
            }`}
          >
            <div className="font-black uppercase text-sm text-emerald-800 mb-1 flex items-center justify-between">
              <span>Sempre Aberto (Liberado)</span>
              {formData.mode === 'open' && <Check size={16} className="text-emerald-600 stroke-[3]" />}
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Mantém as vendas liberadas 24h no site independente do dia ou horário.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              const updated = { ...formData, mode: 'closed' as const };
              setFormData(updated);
              handleSaveHours(updated);
            }}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              formData.mode === 'closed'
                ? 'border-red-500 bg-red-50/50 shadow-sm'
                : 'border-stone-200 hover:border-stone-300 bg-white'
            }`}
          >
            <div className="font-black uppercase text-sm text-red-700 mb-1 flex items-center justify-between">
              <span>Fechar Loja Agora (Pausa)</span>
              {formData.mode === 'closed' && <Check size={16} className="text-red-600 stroke-[3]" />}
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Pausa imediatamente novos pedidos e exibe o aviso de loja fechada no cardápio.
            </p>
          </button>
        </div>
      </div>

      {/* Tabela de Horários por Dia da Semana */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-black uppercase text-base text-stone-900">Horários por Dia da Semana</h3>
            <p className="text-xs text-stone-500 font-medium">
              Ative os dias de atendimento e ajuste o horário de início e término (suporta virada de meia-noite, ex: 18:30 às 00:30).
            </p>
          </div>
          {formData.schedule.find((d) => d.enabled) && (
            <button
              type="button"
              onClick={() => {
                const firstEnabled = formData.schedule.find((d) => d.enabled);
                if (firstEnabled) {
                  applyTimeToAllEnabledDays(firstEnabled.openTime, firstEnabled.closeTime);
                }
              }}
              className="text-xs font-bold uppercase px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer shrink-0"
            >
              Repetir 1º horário em todos os dias ativos
            </button>
          )}
        </div>

        <div className="divide-y divide-stone-100">
          {formData.schedule.map((day) => {
            const isToday = day.dayOfWeek === spClock.dayOfWeek;
            return (
              <div
                key={day.dayOfWeek}
                className={`py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl transition-colors ${
                  isToday ? 'bg-amber-50/50' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-[200px]">
                  <button
                    type="button"
                    onClick={() => handleDayChange(day.dayOfWeek, 'enabled', !day.enabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      day.enabled ? 'bg-emerald-500' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                        day.enabled ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                  <div>
                    <span className="font-bold text-sm text-stone-900 flex items-center gap-2">
                      {day.label}
                      {isToday && (
                        <span className="text-[10px] font-black uppercase bg-yellow-400 text-black px-2 py-0.5 rounded">
                          Hoje
                        </span>
                      )}
                    </span>
                    <span className={`text-xs font-bold ${day.enabled ? 'text-emerald-600' : 'text-red-500'}`}>
                      {day.enabled ? 'Aberto para pedidos' : 'Fechado / Folga'}
                    </span>
                  </div>
                </div>

                {day.enabled ? (
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-400 mb-0.5">Abre às</label>
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => handleDayChange(day.dayOfWeek, 'openTime', e.target.value)}
                        className="border-2 border-stone-200 rounded-lg px-3 py-1.5 font-mono font-bold text-sm text-stone-900 bg-white focus:border-yellow-400 outline-none tabular-nums"
                      />
                    </div>
                    <span className="text-stone-400 font-bold mt-4">até</span>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-stone-400 mb-0.5">Fecha às</label>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => handleDayChange(day.dayOfWeek, 'closeTime', e.target.value)}
                        className="border-2 border-stone-200 rounded-lg px-3 py-1.5 font-mono font-bold text-sm text-stone-900 bg-white focus:border-yellow-400 outline-none tabular-nums"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs font-bold uppercase text-stone-400 italic">
                    Loja fechada neste dia
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mensagens de Loja Fechada */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-4">
        <h3 className="font-black uppercase text-base text-stone-900 pb-2 border-b border-stone-100">
          Mensagens Exibidas Quando a Loja Estiver Fechada
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Título do Aviso</label>
            <input
              type="text"
              value={formData.closedTitle || ''}
              onChange={(e) => setFormData({ ...formData, closedTitle: e.target.value })}
              placeholder="Ex: Loja Fechada no Momento"
              className="w-full border-2 border-stone-200 rounded-xl p-3 font-bold text-sm text-stone-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Texto da Faixa no Topo do Site</label>
            <input
              type="text"
              value={formData.bannerText || ''}
              onChange={(e) => setFormData({ ...formData, bannerText: e.target.value })}
              placeholder="Ex: ⏰ LOJA FECHADA NO MOMENTO • ABRE ÀS 18:30"
              className="w-full border-2 border-stone-200 rounded-xl p-3 font-bold text-sm text-stone-900"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Mensagem Explicativa na Sacola / Checkout</label>
          <textarea
            rows={2}
            value={formData.closedDescription || ''}
            onChange={(e) => setFormData({ ...formData, closedDescription: e.target.value })}
            placeholder="Ex: Nosso delivery atende de Terça a Domingo das 18:30 às 23:45."
            className="w-full border-2 border-stone-200 rounded-xl p-3 font-bold text-sm text-stone-900"
          />
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveHours()}
            className="bg-stone-900 hover:bg-black text-yellow-400 font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-xl shadow-md flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Save size={16} />
            {isSaving ? 'Salvando...' : 'Salvar Todas as Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// CUSTOMER ORDER HISTORY (Histórico de Pedidos dos Clientes)
// ----------------------------------------------------------------------
interface CustomerSummary {
  key: string;
  name: string;
  whatsapp: string;
  address: string;
  region: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: Date;
  favoriteItem: string;
  orders: Order[];
}

function CustomerOrderHistory({
  orders,
  printSettings,
  setOrderToPrint,
}: {
  orders: Order[];
  printSettings: PrinterSettings;
  setOrderToPrint: (o: Order | null) => void;
}) {
  const { addToast } = useToast();
  const [subView, setSubView] = useState<'customers' | 'all_orders'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);

  const getOrderDate = (o: Order): Date => {
    if (o.createdAt?.toDate) return o.createdAt.toDate();
    if (o.createdAt?.seconds) return new Date(o.createdAt.seconds * 1000);
    if (o.createdAt) return new Date(o.createdAt);
    return new Date(0);
  };

  // Filtra pedidos por período e status
  const periodFilteredOrders = React.useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return orders.filter((o) => {
      const d = getOrderDate(o);
      if (periodFilter === 'today' && d.getTime() < startOfToday.getTime()) return false;
      if (periodFilter === '7d' && now - d.getTime() > 7 * 24 * 60 * 60 * 1000) return false;
      if (periodFilter === '30d' && now - d.getTime() > 30 * 24 * 60 * 60 * 1000) return false;
      if (statusFilter !== 'all' && (o.status || 'recebido') !== statusFilter) return false;
      return true;
    });
  }, [orders, periodFilter, statusFilter]);

  // Agrupa pedidos por cliente
  const customers = React.useMemo(() => {
    const map = new Map<string, CustomerSummary>();

    periodFilteredOrders.forEach((order) => {
      const rawPhone = (order.whatsapp || '').replace(/\D/g, '');
      const rawName = (order.userName || 'Cliente Anônimo').trim();
      const key = rawPhone.length >= 8 ? `phone_${rawPhone}` : `name_${rawName.toLowerCase()}`;

      const existing = map.get(key);
      const orderDate = getOrderDate(order);

      if (!existing) {
        map.set(key, {
          key,
          name: rawName,
          whatsapp: order.whatsapp || '',
          address: order.address || '',
          region: order.region || '',
          ordersCount: 1,
          totalSpent: Number(order.totalPrice || 0),
          lastOrderDate: orderDate,
          favoriteItem: order.items?.[0]?.name || '-',
          orders: [order],
        });
      } else {
        existing.ordersCount += 1;
        existing.totalSpent += Number(order.totalPrice || 0);
        if (orderDate > existing.lastOrderDate) {
          existing.lastOrderDate = orderDate;
          if (rawName && rawName !== 'Anônimo') existing.name = rawName;
          if (order.address) existing.address = order.address;
          if (order.whatsapp) existing.whatsapp = order.whatsapp;
        }
        existing.orders.push(order);
      }
    });

    // Calcula o lanche mais pedido de cada cliente
    const list = Array.from(map.values()).map((c) => {
      const itemCounts = new Map<string, number>();
      c.orders.forEach((o) => {
        (o.items || []).forEach((it: any) => {
          const name = it.name || 'Item';
          itemCounts.set(name, (itemCounts.get(name) || 0) + Number(it.quantity || 1));
        });
      });
      let fav = '-';
      let max = 0;
      itemCounts.forEach((qty, name) => {
        if (qty > max) {
          max = qty;
          fav = `${name} (${qty}x)`;
        }
      });
      c.favoriteItem = fav;
      c.orders.sort((a, b) => getOrderDate(b).getTime() - getOrderDate(a).getTime());
      return c;
    });

    return list.sort((a, b) => b.lastOrderDate.getTime() - a.lastOrderDate.getTime());
  }, [periodFilteredOrders]);

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.whatsapp.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.orders.some((o) => String(o.orderNumber || '').includes(q) || (o.id || '').toLowerCase().includes(q))
    );
  });

  const filteredOrdersList = periodFilteredOrders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (o.userName || '').toLowerCase().includes(q) ||
      (o.whatsapp || '').toLowerCase().includes(q) ||
      (o.address || '').toLowerCase().includes(q) ||
      String(o.orderNumber || '').includes(q) ||
      (o.id || '').toLowerCase().includes(q) ||
      (o.items || []).some((it: any) => (it.name || '').toLowerCase().includes(q))
    );
  });

  const totalRevenue = periodFilteredOrders.reduce((acc, o) => acc + Number(o.totalPrice || 0), 0);
  const avgTicket = periodFilteredOrders.length > 0 ? totalRevenue / periodFilteredOrders.length : 0;

  return (
    <div className="space-y-6">
      {/* Header + Resumo */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display uppercase font-bold flex items-center gap-2 text-stone-900">
              <Users size={24} className="text-yellow-500" /> Histórico de Pedidos dos Clientes
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Consulte todos os clientes, veja quantos pedidos cada um já fez, o que pediu e reimprima qualquer comanda antiga.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSubView('customers')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer ${
                subView === 'customers' ? 'bg-stone-900 text-yellow-400 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Por Cliente ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setSubView('all_orders')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer ${
                subView === 'all_orders' ? 'bg-stone-900 text-yellow-400 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Todos os Pedidos ({periodFilteredOrders.length})
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5">
            <span className="text-[10px] font-bold uppercase text-stone-500 block">Clientes Únicos</span>
            <span className="text-2xl font-black text-stone-900 tabular-nums">{customers.length}</span>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5">
            <span className="text-[10px] font-bold uppercase text-stone-500 block">Total de Pedidos</span>
            <span className="text-2xl font-black text-stone-900 tabular-nums">{periodFilteredOrders.length}</span>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5">
            <span className="text-[10px] font-bold uppercase text-stone-500 block">Volume em Pedidos</span>
            <span className="text-2xl font-black text-emerald-600 tabular-nums">
              R$ {totalRevenue.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5">
            <span className="text-[10px] font-bold uppercase text-stone-500 block">Ticket Médio</span>
            <span className="text-2xl font-black text-stone-900 tabular-nums">
              R$ {avgTicket.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {/* Filtros de Busca e Período */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
            {[
              { id: 'all', label: 'Todo Período' },
              { id: 'today', label: 'Hoje' },
              { id: '7d', label: 'Últimos 7 Dias' },
              { id: '30d', label: 'Últimos 30 Dias' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodFilter(p.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer ${
                  periodFilter === p.id ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold uppercase text-stone-700 bg-stone-50 outline-none"
            >
              <option value="all">Todos Status</option>
              <option value="recebido">Recebidos</option>
              <option value="preparando">Em Preparo</option>
              <option value="a_caminho">A Caminho</option>
              <option value="entregue">Entregues</option>
            </select>

            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome do cliente, WhatsApp, endereço ou Nº pedido..."
                className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 bg-stone-50 outline-none focus:border-stone-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visão 1: Carteira de Clientes */}
      {subView === 'customers' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-stone-400 font-bold">
              Nenhum cliente encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-black uppercase text-stone-500 tracking-wider">
                    <th className="py-3.5 px-4">Cliente</th>
                    <th className="py-3.5 px-4">WhatsApp</th>
                    <th className="py-3.5 px-4">Endereço Principal</th>
                    <th className="py-3.5 px-4">Item Mais Pedido</th>
                    <th className="py-3.5 px-4 text-center">Pedidos</th>
                    <th className="py-3.5 px-4 text-right">Total Gasto</th>
                    <th className="py-3.5 px-4 text-right">Último Pedido</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {filteredCustomers.map((c) => {
                    const cleanDigits = c.whatsapp.replace(/\D/g, '');
                    const waUrl = cleanDigits
                      ? `https://wa.me/${cleanDigits.startsWith('55') ? cleanDigits : `55${cleanDigits}`}`
                      : null;
                    return (
                      <tr key={c.key} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-black text-stone-900">{c.name}</td>
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-stone-600 tabular-nums">
                          {waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                            >
                              <Phone size={12} /> {c.whatsapp}
                            </a>
                          ) : (
                            c.whatsapp || '-'
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-stone-600 font-medium max-w-[220px] truncate" title={c.address}>
                          {c.address || 'Retirada no Balcão'}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold text-stone-700 max-w-[180px] truncate">
                          {c.favoriteItem}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-black text-stone-900 tabular-nums">
                          {c.ordersCount}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 tabular-nums">
                          R$ {c.totalSpent.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs text-stone-500 tabular-nums">
                          {c.lastOrderDate.getTime() > 0
                            ? `${c.lastOrderDate.toLocaleDateString('pt-BR')} ${c.lastOrderDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                            : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(c)}
                            className="px-3 py-1.5 bg-stone-900 hover:bg-black text-yellow-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Ver Histórico ({c.ordersCount})
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Visão 2: Lista Completa de Todos os Pedidos */
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          {filteredOrdersList.length === 0 ? (
            <div className="p-12 text-center text-stone-400 font-bold">
              Nenhum pedido encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-black uppercase text-stone-500 tracking-wider">
                    <th className="py-3.5 px-4">Pedido</th>
                    <th className="py-3.5 px-4">Data / Hora</th>
                    <th className="py-3.5 px-4">Cliente</th>
                    <th className="py-3.5 px-4">Itens do Pedido</th>
                    <th className="py-3.5 px-4">Pagamento</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Total</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {filteredOrdersList.map((order) => {
                    const d = getOrderDate(order);
                    const itemsText = (order.items || [])
                      .map((it: any) => `${it.quantity}x ${it.name}`)
                      .join(', ');
                    return (
                      <tr key={order.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-black text-stone-900 tabular-nums">
                          {order.orderNumber ? `#${order.orderNumber}` : `#${(order.id || '').substring(0, 6).toUpperCase()}`}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-stone-600 tabular-nums whitespace-nowrap">
                          {d.getTime() > 0
                            ? `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                            : '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-stone-900">{order.userName || 'Anônimo'}</div>
                          <div className="text-xs text-stone-500 font-mono">{order.whatsapp || ''}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-stone-700 font-medium max-w-[260px] truncate" title={itemsText}>
                          {itemsText}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold text-stone-600">
                          <div>{order.paymentMethod || '-'}</div>
                          {isOrderPaid(order) ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 mt-1">
                              <Check size={10} className="stroke-[3]" /> Pago
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 mt-1">
                              <Clock size={10} /> Aguardando Pgto
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-black uppercase text-stone-700">
                          {order.status || 'recebido'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 tabular-nums whitespace-nowrap">
                          R$ {Number(order.totalPrice || 0).toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isOrderPaid(order) && (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await markOrderAsPaid(order.id!, order.orderNumber);
                                    addToast({ message: `Pedido #${order.orderNumber || ''} marcado como PAGO! Comanda enviada.`, type: 'success' });
                                    executePrintOrder({ ...order, isPaid: true, paymentStatus: 'pago' }, printSettings, setOrderToPrint, addToast, { force: true });
                                  } catch {
                                    addToast({ message: 'Erro ao confirmar pagamento', type: 'error' });
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                title="Confirmar Pagamento e Imprimir Comanda"
                              >
                                <CreditCard size={13} />
                                <span>Confirmar Pgto</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setInspectingOrder(order)}
                              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer"
                            >
                              Detalhes
                            </button>
                            <button
                              type="button"
                              onClick={() => executePrintOrder(order, printSettings, setOrderToPrint, addToast, { force: true })}
                              className="p-1.5 bg-stone-900 hover:bg-black text-yellow-400 rounded-lg transition-colors cursor-pointer"
                              title="Reimprimir Comanda"
                            >
                              <Printer size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Histórico Individual de um Cliente */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-stone-200 flex justify-between items-start bg-stone-900 text-white">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 block mb-1">
                    Ficha & Histórico do Cliente
                  </span>
                  <h3 className="text-2xl font-black uppercase">{selectedCustomer.name}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-stone-300 font-medium">
                    {selectedCustomer.whatsapp && (
                      <span className="flex items-center gap-1">
                        <Phone size={13} className="text-yellow-400" /> {selectedCustomer.whatsapp}
                      </span>
                    )}
                    {selectedCustomer.address && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-yellow-400" /> {selectedCustomer.address}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-stone-50 border-b border-stone-200 text-center">
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">Pedidos Realizados</span>
                  <span className="text-xl font-black text-stone-900 tabular-nums">{selectedCustomer.ordersCount}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">Total Acumulado</span>
                  <span className="text-xl font-black text-emerald-600 tabular-nums">
                    R$ {selectedCustomer.totalSpent.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">Preferido</span>
                  <span className="text-sm font-black text-stone-800 truncate block">{selectedCustomer.favoriteItem}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedCustomer.orders.map((order) => {
                  const d = getOrderDate(order);
                  return (
                    <div
                      key={order.id}
                      className="border border-stone-200 rounded-xl p-4 hover:border-stone-300 transition-all bg-white shadow-2xs"
                    >
                      <div className="flex flex-wrap justify-between items-center gap-2 pb-3 mb-3 border-b border-stone-100">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-base text-stone-900">
                            {order.orderNumber ? `PEDIDO #${order.orderNumber}` : `#${(order.id || '').substring(0, 6).toUpperCase()}`}
                          </span>
                          <span className="text-xs font-mono text-stone-500 tabular-nums">
                            {d.getTime() > 0
                              ? `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                              : ''}
                          </span>
                          <span className="text-xs font-bold uppercase text-stone-600">
                            · {order.status || 'recebido'}
                          </span>
                          {isOrderPaid(order) ? (
                            <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                              <Check size={10} className="stroke-[3]" /> Pago
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                              <Clock size={10} /> Aguardando Pgto
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-base text-emerald-600 tabular-nums">
                            R$ {Number(order.totalPrice || 0).toFixed(2).replace('.', ',')}
                          </span>
                          {!isOrderPaid(order) ? (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await markOrderAsPaid(order.id!, order.orderNumber);
                                  addToast({ message: `Pedido #${order.orderNumber || ''} marcado como PAGO! Comanda enviada.`, type: 'success' });
                                  executePrintOrder({ ...order, isPaid: true, paymentStatus: 'pago' }, printSettings, setOrderToPrint, addToast, { force: true });
                                } catch {
                                  addToast({ message: 'Erro ao confirmar pagamento', type: 'error' });
                                }
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                              title="Confirmar pagamento e imprimir comanda"
                            >
                              <CreditCard size={14} /> Confirmar & Imprimir
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => executePrintOrder(order, printSettings, setOrderToPrint, addToast, { force: true })}
                              className="px-3 py-1.5 bg-stone-900 hover:bg-black text-yellow-400 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Printer size={14} /> Reimprimir
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {(order.items || []).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-start text-stone-700">
                            <div>
                              <span className="font-bold text-stone-900">{item.quantity}x {item.name}</span>
                              {item.extras && item.extras.length > 0 && (
                                <span className="text-stone-500 ml-1">
                                  (+ {item.extras.map((e: any) => e.name).join(', ')})
                                </span>
                              )}
                              {item.observation && (
                                <span className="text-red-600 font-semibold italic ml-2">
                                  Obs: {item.observation}
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-semibold text-stone-600 tabular-nums">
                              R$ {((item.price + (item.extras?.reduce((s: number, e: any) => s + (e.price || 0), 0) || 0)) * item.quantity).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 pt-2 border-t border-dashed border-stone-200 flex flex-wrap justify-between gap-2 text-[11px] text-stone-500 font-medium">
                        <span>Pagamento: <strong className="text-stone-700">{order.paymentMethod || 'Não informado'}</strong></span>
                        <span>Entrega: <strong className="text-stone-700">{order.address || 'Retirada no Balcão'}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Edição / Detalhes de um Pedido Individual */}
      <AnimatePresence>
        {inspectingOrder && (
          <OrderEditModal
            order={inspectingOrder}
            onClose={() => setInspectingOrder(null)}
            onSave={async (updates: any) => {
              await saveOrderAdmin(inspectingOrder.id!, updates);
              addToast({ message: 'Pedido atualizado com sucesso!', type: 'success' });
              setInspectingOrder(null);
            }}
            onPrint={() => {
              executePrintOrder(inspectingOrder, printSettings, setOrderToPrint, addToast, { force: true });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------------------
// PROMO EDITOR
// ----------------------------------------------------------------------
function PromoEditor({ promos }: { promos: PromoCode[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PromoCode>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { addToast } = useToast();
  
  const handleEdit = (p: PromoCode) => {
    setEditingId(p.id!);
    setFormData(p);
  };
  const handleAdd = () => {
    setEditingId('new');
    setFormData({ code: '', discount: 0 });
  };
  const handleSave = async () => {
    try {
      await savePromo(formData as PromoCode, editingId === 'new' ? undefined : editingId!);
      addToast({ message: 'Cupom salvo!', type: 'success' });
      setEditingId(null);
    } catch (e) {
      addToast({ message: 'Erro ao salvar', type: 'error' as any });
    }
  };
  const handleDelete = (id: string) => setDeleteId(id);
  const performDeletePromo = async () => {
    if (deleteId) {
      await deletePromo(deleteId);
      addToast({ message: 'Cupom removido', type: 'success' });
      setDeleteId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-stone-200">
        <h2 className="text-2xl font-display uppercase font-bold flex items-center gap-2">
          <Tag size={24} className="text-yellow-500" /> Cupons de Desconto
        </h2>
        <button onClick={handleAdd} className="bg-stone-900 text-yellow-400 px-4 py-2 rounded-lg font-bold border-2 border-stone-900 flex items-center gap-2 hover:bg-stone-800 shadow-sm uppercase tracking-widest text-sm">
          <Plus size={18} /> Novo Cupom
        </button>
      </div>
      
      {editingId && (
        <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 shadow-lg mb-8 max-w-2xl">
          <h3 className="font-black text-xl mb-4 uppercase">{editingId === 'new' ? 'Novo Cupom' : 'Editar Cupom'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Código (sem espaços)</label>
              <input placeholder="Ex: NICKEL10" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase().replace(/s/g,'')})} className="w-full border-2 border-stone-200 p-3 rounded-lg font-bold uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Valor do Desconto</label>
              <input type="number" placeholder="Ex: 0.1 para 10% ou 15 para R$15" value={formData.discount || 0} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} className="w-full border-2 border-stone-200 p-3 rounded-lg font-bold" step="0.01" />
              <p className="text-xs text-stone-400 font-medium mt-1">Se menor que 1, será porcentagem (0.1 = 10%). Se maior, será valor em Reais.</p>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button onClick={handleSave} className="flex-1 bg-yellow-400 px-4 py-3 rounded-lg font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-yellow-500"><Save size={18}/> Salvar Cupom</button>
            <button onClick={() => setEditingId(null)} className="px-6 bg-stone-100 rounded-lg font-bold uppercase text-stone-500 hover:bg-stone-200">Cancelar</button>
          </div>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        {promos.map(p => (
          <div key={p.id} className="bg-white p-6 rounded-2xl border-2 border-stone-200 shadow-sm flex flex-col justify-between text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400"></div>
            <div>
              <h4 className="font-black text-2xl uppercase tracking-widest text-stone-800">{p.code}</h4>
              <p className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block mt-3 border border-green-200">
                {p.discount < 1 ? `${(p.discount * 100).toFixed(0)}% OFF` : `R$ ${p.discount.toFixed(2)} OFF`}
              </p>
            </div>
            <div className="flex gap-2 mt-6 pt-4 border-t-2 border-stone-100">
              <button onClick={() => handleEdit(p)} className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center justify-center text-stone-600 transition-colors"><Edit2 size={16}/></button>
              <button onClick={() => handleDelete(p.id!)} className="flex-1 py-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg flex items-center justify-center transition-colors"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmModal isOpen={!!deleteId} message="Tem certeza que deseja apagar o cupom?" onConfirm={performDeletePromo} onCancel={() => setDeleteId(null)} />
    </div>
  );
}

// ----------------------------------------------------------------------
// BANNER EDITOR
// ----------------------------------------------------------------------
function BannerEditor({ banners }: { banners: Banner[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Banner>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { addToast } = useToast();
  
  const handleEdit = (p: Banner) => {
    setEditingId(p.id!);
    setFormData(p);
  };
  const handleAdd = () => {
    setEditingId('new');
    setFormData({ image: '', title: '', description: '' });
  };
  const handleSave = async () => {
    try {
      await saveBanner(formData as Banner, editingId === 'new' ? undefined : editingId!);
      addToast({ message: 'Banner salvo!', type: 'success' });
      setEditingId(null);
    } catch (e) {
      addToast({ message: 'Erro ao salvar', type: 'error' as any });
    }
  };
  const handleDelete = (id: string) => setDeleteId(id);
  const performDeleteBanner = async () => {
    if (deleteId) {
      await deleteBanner(deleteId);
      addToast({ message: 'Banner removido', type: 'success' });
      setDeleteId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-stone-200">
        <h2 className="text-2xl font-display uppercase font-bold flex items-center gap-2">
          <ImageIcon size={24} className="text-yellow-500" /> Banners Destaque
        </h2>
        <button onClick={handleAdd} className="bg-stone-900 text-yellow-400 px-4 py-2 rounded-lg font-bold border-2 border-stone-900 flex items-center gap-2 hover:bg-stone-800 shadow-sm uppercase tracking-widest text-sm">
          <Plus size={18} /> Novo Banner
        </button>
      </div>
      
      {editingId && (
        <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 shadow-lg mb-8 max-w-4xl">
          <h3 className="font-black text-xl mb-4 uppercase">{editingId === 'new' ? 'Novo Banner' : 'Editar Banner'}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Título da Promoção</label>
                <input placeholder="Ex: Promoção Loucura" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border-2 border-stone-200 p-3 rounded-lg font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Descrição</label>
                <textarea placeholder="Detalhes do combo..." value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border-2 border-stone-200 p-3 rounded-lg font-bold min-h-[100px]" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">URL da Imagem</label>
                <input placeholder="https://..." value={formData.image || ''} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full border-2 border-stone-200 p-3 rounded-lg font-bold" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center bg-stone-100 rounded-xl border-2 border-dashed border-stone-300 p-4">
              {formData.image ? (
                <img src={formData.image} alt="Preview" className="w-full h-48 object-cover rounded-lg shadow-md" referrerPolicy="no-referrer" />
              ) : (
                <div className="text-center text-stone-400 font-bold flex flex-col items-center">
                  <ImageIcon size={48} className="mb-2 opacity-30" />
                  Preview da Imagem
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-6 border-t-2 border-stone-100 pt-4">
            <button onClick={handleSave} className="bg-yellow-400 px-6 py-3 rounded-lg font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-yellow-500 shadow-md"><Save size={18}/> Salvar Banner</button>
            <button onClick={() => setEditingId(null)} className="px-6 py-3 bg-stone-100 rounded-lg font-bold uppercase text-stone-500 hover:bg-stone-200">Cancelar</button>
          </div>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {banners.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border-2 border-stone-200 shadow-sm overflow-hidden flex flex-col group hover:border-yellow-400 transition-colors">
            <div className="h-48 relative overflow-hidden bg-stone-900">
              <img src={p.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                <h4 className="font-black text-xl text-white uppercase tracking-wide leading-tight drop-shadow-md">{p.title}</h4>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <p className="text-sm font-medium text-stone-600 mb-4">{p.description}</p>
              <div className="flex gap-2 pt-4 border-t-2 border-stone-100">
                <button onClick={() => handleEdit(p)} className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center justify-center text-stone-600 font-bold uppercase text-xs gap-1 transition-colors"><Edit2 size={14}/> Editar</button>
                <button onClick={() => handleDelete(p.id!)} className="w-12 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg flex items-center justify-center transition-colors"><Trash2 size={16}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ConfirmModal isOpen={!!deleteId} message="Tem certeza? O banner será removido do site." onConfirm={performDeleteBanner} onCancel={() => setDeleteId(null)} />
    </div>
  );
}

// ----------------------------------------------------------------------
// MODALS FOR IFRAME COMPATIBILITY
// ----------------------------------------------------------------------
export function ConfirmModal({ isOpen, message, onConfirm, onCancel }: { isOpen: boolean, message: string, onConfirm: () => void, onCancel: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
        <h3 className="font-black text-xl mb-4 text-black uppercase">Confirmação</h3>
        <p className="font-bold text-stone-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="px-6 py-2 bg-stone-200 text-stone-600 font-bold uppercase rounded-lg hover:bg-stone-300">Cancelar</button>
          <button onClick={() => { onConfirm(); onCancel(); }} className="px-6 py-2 bg-red-500 text-white font-bold uppercase rounded-lg hover:bg-red-600">Confirmar</button>
        </div>
      </div>
    </div>
  );
}

export function PromptModal({ isOpen, title, onConfirm, onCancel }: { isOpen: boolean, title: string, onConfirm: (val: string) => void, onCancel: () => void }) {
  const [val, setVal] = React.useState('');
  React.useEffect(() => { if (isOpen) setVal(''); }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl">
        <h3 className="font-black text-xl mb-4 text-black uppercase">{title}</h3>
        <input autoFocus value={val} onChange={e => setVal(e.target.value)} className="w-full border-2 border-stone-200 rounded-lg p-3 font-bold mb-6" />
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 bg-stone-200 text-stone-600 font-bold uppercase rounded-lg hover:bg-stone-300">Cancelar</button>
          <button onClick={() => { onConfirm(val); onCancel(); }} className="px-4 py-2 bg-yellow-400 text-black font-bold uppercase rounded-lg hover:bg-yellow-500">OK</button>
        </div>
      </div>
    </div>
  );
}
