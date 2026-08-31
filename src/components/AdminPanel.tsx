import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, CheckSquare, Lock, X, Plus, Trash2, Edit2, Package, Tag, Clock, Save, Eye, EyeOff, Settings, List, Check, ArrowRight, ImagePlus, ChevronLeft, ChevronRight, RefreshCw, XCircle, Grid, Image as ImageIcon, Send } from 'lucide-react';
import { Order, getProducts, saveProduct, deleteProduct, getPromos, savePromo, deletePromo, getAllOrders, updateOrderStatus, PromoCode, subscribeToAllOrders, Banner, getBanners, saveBanner, deleteBanner, subscribeToProducts, subscribeToPromos, subscribeToBanners, deleteOrder, saveOrderAdmin } from '../lib/db';
import { Product, Extra } from '../types';
import { useToast } from './Toast';
import { playSound } from '../lib/audio';
import NickelText from './NickelText';

interface AdminPanelProps {
  onClose: () => void;
}


// ----------------------------------------------------------------------
// SAFE PRINT HELPER
// ----------------------------------------------------------------------
export const triggerSafePrint = (addToast: any) => {
  try {
    if (window.self !== window.top) {
      addToast({ message: 'A pré-visualização bloqueia impressão! Abra em NOVA ABA para imprimir.', type: 'error' });
    } else {
      triggerSafePrint(addToast);
    }
  } catch (e) {
    addToast({ message: 'Erro ao imprimir.', type: 'error' });
  }
};

export default function AdminPanel({ onClose }: AdminPanelProps) {
  // Mocado a pedido do usuario: sempre true
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'promos' | 'banners' | 'settings'>('orders');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [printSettings, setPrintSettings] = useState({
    autoPrint: localStorage.getItem('auto_print_enabled') !== 'false',
    printerType: localStorage.getItem('printer_type') || 'thermal_80', // thermal_80, thermal_58, normal
    printHeader: localStorage.getItem('print_header') || 'NICKEL LANCHES',
    printSubHeader: localStorage.getItem('print_subheader') || 'Delivery de Verdade!'
  });

  const autoPrintRef = useRef(printSettings.autoPrint);
  const printedOrders = useRef<Set<string>>(new Set(JSON.parse(localStorage.getItem('printed_orders') || '[]')));

  useEffect(() => {
    autoPrintRef.current = printSettings.autoPrint;
    localStorage.setItem('auto_print_enabled', String(printSettings.autoPrint));
    localStorage.setItem('printer_type', printSettings.printerType);
    localStorage.setItem('print_header', printSettings.printHeader);
    localStorage.setItem('print_subheader', printSettings.printSubHeader);
  }, [printSettings]);
  
  const { addToast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === (import.meta as any).env.VITE_ADMIN_PASSWORD || password === 'Nickel123Lanches?') {
      setIsAuthenticated(true);
      playSound('coin');
      addToast({ message: 'Login efetuado com sucesso!', type: 'success' });
    } else {
      playSound('error');
      addToast({ message: 'Senha incorreta!', type: 'error' as any });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const unsubOrders = subscribeToAllOrders((newOrders) => {
        setOrders(prev => {
          if (autoPrintRef.current) {
            const currentIds = new Set(prev.map(o => o.id));
            newOrders.forEach(order => {
              if (order.status === 'recebido' && order.id && !currentIds.has(order.id) && !printedOrders.current.has(order.id)) {
                setOrderToPrint(order);
                printedOrders.current.add(order.id);
                localStorage.setItem('printed_orders', JSON.stringify(Array.from(printedOrders.current)));
                triggerSafePrint(addToast);
              }
            });
          }
          return newOrders;
        });
      });
      const unsubProducts = subscribeToProducts(setProducts);
      const unsubPromos = subscribeToPromos(setPromos);
      const unsubBanners = subscribeToBanners(setBanners);

      return () => {
        unsubOrders();
        unsubProducts();
        unsubPromos();
        unsubBanners();
      };
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-stone-900 z-50 flex items-center justify-center p-4">
        <motion.form 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          onSubmit={handleLogin} 
          className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm max-w-sm w-full relative"
        >
          <button type="button" onClick={onClose} className="absolute top-4 right-4 text-black hover:bg-zinc-100 p-2 rounded-full"><X size={20}/></button>
          <div className="flex justify-center mb-6 text-yellow-500">
            <Lock size={48} />
          </div>
          <h2 className="text-2xl font-display font-bold text-center text-black mb-6 uppercase">Acesso Restrito</h2>
          <div className="relative mb-6">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Senha administrativa"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-stone-200 rounded-lg p-3 pr-12 outline-none focus:ring-4 focus:ring-yellow-400 font-bold text-black"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button type="submit" className="w-full bg-black text-yellow-400 font-display uppercase tracking-widest py-3 rounded-lg border border-stone-200 hover:-translate-y-1 hover:shadow-sm transition-all">
            Entrar
          </button>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row print:bg-white print:block">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-black text-white p-6 flex flex-col print:hidden shadow-2xl z-20">
        <div className="flex justify-between items-center mb-8">
          <div className="text-2xl font-display text-yellow-400 flex flex-col leading-none">
            <span>NICKEL</span>
            <span className="text-white text-lg">ADMIN</span>
          </div>
          <button onClick={onClose} className="text-white hover:text-yellow-400 md:hidden"><X size={24}/></button>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto">
          <TabButton icon={<CheckSquare size={20}/>} label="Pedidos" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
          <TabButton icon={<Package size={20}/>} label="Produtos" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
          <TabButton icon={<Tag size={20}/>} label="Cupons" active={activeTab === 'promos'} onClick={() => setActiveTab('promos')} />
          <TabButton icon={<ImageIcon size={20}/>} label="Banners" active={activeTab === 'banners'} onClick={() => setActiveTab('banners')} />
          <div className="my-4 border-t border-stone-800"></div>
          <TabButton icon={<Settings size={20}/>} label="Impressão" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="mt-8 pt-4 border-t border-stone-800 text-xs text-stone-500 font-bold uppercase tracking-widest text-center">
          Versão 2.0.0
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-screen overflow-y-auto p-4 md:p-8 relative print:hidden">
        {activeTab === 'orders' && <OrdersKanban orders={orders} setOrderToPrint={setOrderToPrint} printSettings={printSettings} setPrintSettings={setPrintSettings} />}
        {activeTab === 'products' && <ProductEditor products={products} />}
        {activeTab === 'promos' && <PromoEditor promos={promos} />}
        {activeTab === 'banners' && <BannerEditor banners={banners} />}
        {activeTab === 'settings' && <PrintSettingsEditor settings={printSettings} setSettings={setPrintSettings} onTestPrint={() => { setOrderToPrint({ id: 'TESTE-123', createdAt: { toDate: () => new Date() }, items: [{ name: 'Lanche Teste de Impressão', price: 0, quantity: 1, extras: [] }], totalPrice: 0, userName: 'Teste', address: 'Teste', paymentMethod: 'Teste', status: 'recebido' }); triggerSafePrint(addToast); }} />}
      </div>

      {/* Printable Area */}
      <div id="printable-command" className={`hidden print:block mx-auto text-black font-mono leading-tight bg-white ${printSettings.printerType === 'thermal_58' ? 'w-[58mm] text-[10px]' : printSettings.printerType === 'normal' ? 'w-[100mm] text-sm' : 'w-[80mm] text-xs'}`}>
        {orderToPrint && (
          <div className="p-2">
            <div className="text-center mb-4 border-b-2 border-black pb-2">
              <h2 className="font-bold text-xl uppercase font-display">{printSettings.printHeader}</h2>
              {printSettings.printSubHeader && <p className="font-bold">{printSettings.printSubHeader}</p>}
            </div>
            
            <div className="mb-4 font-bold">
              <p className="text-lg border border-black p-1 text-center mb-2">SENHA: {orderToPrint.id?.substring(0,4).toUpperCase()}</p>
              <p>ID: #{orderToPrint.id}</p>
              <p>Data: {orderToPrint.createdAt?.toDate ? orderToPrint.createdAt.toDate().toLocaleString() : new Date().toLocaleString()}</p>
              <p className="mt-2 border-t border-dashed border-black pt-2 text-lg">Cliente: {orderToPrint.userName || 'Anônimo'}</p>
              <p>Pagamento: {orderToPrint.paymentMethod || 'A Confirmar'}</p>
              <p>Entrega: {orderToPrint.address || 'Retirada no Balcão'}</p>
            </div>
            
            <div className="border-t-2 border-b-2 border-black py-2 mb-4">
              <div className="font-bold mb-2 uppercase text-center bg-black text-white">ITENS DO PEDIDO</div>
              {orderToPrint.items.map((item, i) => {
                const extrasTotal = item.extras?.reduce((s, e) => s + e.price, 0) || 0;
                const itemTotal = (item.price + extrasTotal) * item.quantity;
                return (
                <div key={i} className="mb-3 border-b border-dashed border-stone-300 pb-2">
                  <div className="flex justify-between font-bold text-base">
                    <span>{item.quantity}x {item.name}</span>
                    <span>R$ {itemTotal.toFixed(2)}</span>
                  </div>
                  {item.extras && item.extras.length > 0 && (
                    <div className="pl-4 font-bold uppercase mt-1">+ {item.extras.map(e => e.name).join(', ')}</div>
                  )}
                  {item.observation && (
                    <div className="pl-4 italic font-bold uppercase mt-1">- Obs: {item.observation}</div>
                  )}
                </div>
              )})}
            </div>
            
            <div className="text-right">
              <div className="font-black text-2xl uppercase mt-2">TOTAL: R$ {orderToPrint.totalPrice.toFixed(2)}</div>
              <p className="font-bold uppercase mt-4 text-center border-t-2 border-black pt-2">Agradecemos a preferência!</p>
              <p className="text-center font-bold">***</p>
            </div>
          </div>
        )}
      </div>

      
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
function OrdersKanban({ orders, setOrderToPrint, printSettings, setPrintSettings }: any) {
  const { addToast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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
    let delay = 0;
    selectedOrders.forEach((order: Order) => {
      setTimeout(() => {
        setOrderToPrint(order);
        triggerSafePrint(addToast);
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

  const columns = [
    { id: 'recebido', title: 'Recebidos', color: 'bg-stone-200 border-stone-300 text-stone-700' },
    { id: 'preparando', title: 'Em Preparo', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
    { id: 'a_caminho', title: 'A Caminho', color: 'bg-blue-100 border-blue-300 text-blue-800' },
    { id: 'entregue', title: 'Entregues', color: 'bg-green-100 border-green-300 text-green-800' }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-stone-200">
        <h2 className="text-2xl font-display uppercase font-bold flex items-center gap-2">
          <CheckSquare size={24} className="text-yellow-500" /> Painel de Pedidos
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
            <span className="text-xs font-bold uppercase text-stone-500">Imp. Auto</span>
            <button onClick={() => setPrintSettings({...printSettings, autoPrint: !printSettings.autoPrint})} className={`w-10 h-5 rounded-full transition-colors relative ${printSettings.autoPrint ? 'bg-green-500' : 'bg-stone-300'}`}>
              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${printSettings.autoPrint ? 'left-6' : 'left-1'}`}></div>
            </button>
          </div>
          
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

          <button onClick={printMass} className="bg-stone-900 text-yellow-400 p-2 rounded-lg hover:bg-stone-800 transition-colors tooltip" title="Imprimir selecionados">
            <Printer size={18} />
          </button>
          <button onClick={deleteSelected} className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors" title="Apagar selecionados">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto flex gap-6 pb-4">
        {columns.map(col => (
          <div key={col.id} className={`flex-none w-80 flex flex-col bg-stone-200/50 rounded-2xl border-2 border-stone-200/50 overflow-hidden`}>
            <div className={`p-3 border-b-2 flex justify-between items-center ${col.color}`}>
              <h3 className="font-bold uppercase tracking-widest text-sm">{col.title}</h3>
              <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-black">
                {orders.filter((o: Order) => (o.status || 'recebido') === col.id).length}
              </span>
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {orders.filter((o: Order) => (o.status || 'recebido') === col.id).map((order: Order) => (
                <div key={order.id} className={`bg-white p-3 rounded-xl border-2 shadow-sm relative transition-all ${selectedIds.has(order.id!) ? 'border-yellow-400 shadow-md ring-4 ring-yellow-400/20' : 'border-stone-200 hover:border-stone-300'}`}>
                  <div className="absolute top-3 right-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleSelect(order.id!); }}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedIds.has(order.id!) ? 'bg-yellow-400 border-yellow-400' : 'border-stone-300'}`}>
                      {selectedIds.has(order.id!) && <Check size={12} className="text-black stroke-[4]"/>}
                    </div>
                  </div>
                  
                  <div className="pr-8 cursor-pointer" onClick={() => setEditingOrder(order)}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-black text-lg">#{order.id?.substring(0,6).toUpperCase()}</span>
                      <span className="text-xs text-stone-500 font-bold bg-stone-100 px-2 py-1 rounded">
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </span>
                    </div>
                    <div className="font-bold text-stone-800 mb-1">{order.userName || 'Anônimo'}</div>
                    <div className="text-xs text-stone-500 font-medium mb-3 flex items-center gap-1 line-clamp-1">
                      {order.address || 'Retirada no Balcão'}
                    </div>
                    <div className="flex justify-between items-center border-t border-dashed border-stone-200 pt-2">
                      <span className="font-black text-green-600">R$ {order.totalPrice.toFixed(2)}</span>
                      <span className="text-xs font-bold uppercase bg-stone-100 px-2 py-0.5 rounded text-stone-600 border border-stone-200">{order.paymentMethod || 'Não info'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
              setOrderToPrint(editingOrder);
              triggerSafePrint(addToast);
            }}
          />
        )}
      </AnimatePresence>
      <ConfirmModal isOpen={confirmDeleteOpen} message={`Tem certeza que deseja apagar ${selectedIds.size} pedidos permanentemente?`} onConfirm={performDelete} onCancel={() => setConfirmDeleteOpen(false)} />
    </div>
  );
}

function OrderEditModal({ order, onClose, onSave, onPrint }: any) {
  const [formData, setFormData] = useState({
    userName: order.userName || '',
    address: order.address || '',
    paymentMethod: order.paymentMethod || '',
    status: order.status || 'recebido',
    adminNotes: order.adminNotes || ''
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b-2 border-stone-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-2xl font-black uppercase flex items-center gap-2">Comanda #{order.id}</h2>
          <div className="flex gap-2">
            <button onClick={onPrint} className="p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"><Printer size={20}/></button>
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
            <h3 className="font-bold uppercase mb-4 pb-2 border-b-2 border-stone-300">Resumo dos Itens</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="bg-white p-3 rounded-lg shadow-sm border border-stone-200">
                  <div className="flex justify-between font-bold">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="text-green-600">R$ {((item.price + (item.extras?.reduce((s:any,e:any)=>s+e.price,0)||0)) * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.extras && item.extras.length > 0 && (
                    <div className="text-xs font-bold text-yellow-600 mt-1 uppercase">+ {item.extras.map((e:any) => e.name).join(', ')}</div>
                  )}
                  {item.observation && (
                    <div className="text-xs italic text-red-500 font-bold mt-1 uppercase">Obs: {item.observation}</div>
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
// PRODUCT EDITOR (Enhanced)
// ----------------------------------------------------------------------
function ProductEditor({ products }: { products: Product[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [promptImage, setPromptImage] = useState(false);
  const [promptExtraName, setPromptExtraName] = useState(false);
  const [promptExtraPrice, setPromptExtraPrice] = useState(false);
  const [tempExtraName, setTempExtraName] = useState('');
  const { addToast } = useToast();
  
  const handleEdit = (p: Product) => {
    setEditingId(p.id!);
    setFormData(p);
  };
  
  const handleAdd = () => {
    setEditingId('new');
    setFormData({ name: '', description: '', price: 0, points: 0, emoji: '🍔', category: 'lanches', images: [], productExtras: [] });
  };
  
  const handleSave = async () => {
    try {
      await saveProduct(formData as Product, editingId === 'new' ? undefined : editingId!);
      addToast({ message: 'Produto salvo!', type: 'success' });
      setEditingId(null);
    } catch (e) {
      addToast({ message: 'Erro ao salvar', type: 'error' as any });
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
        productExtras: [...(prev.productExtras || []), { id: Math.random().toString(), name: tempExtraName, price }]
      }));
    }
  };

  const removeExtra = (id: string) => {
    setFormData(prev => ({
      ...prev,
      productExtras: (prev.productExtras || []).filter(e => e.id !== id)
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-stone-200">
        <h2 className="text-2xl font-display uppercase font-bold flex items-center gap-2 text-stone-800">
          <Package size={24} className="text-yellow-500" /> Gerenciar Produtos
        </h2>
        <button onClick={handleAdd} className="bg-stone-900 text-yellow-400 px-4 py-2 rounded-lg font-bold border-2 border-stone-900 flex items-center gap-2 hover:bg-stone-800 shadow-sm uppercase tracking-widest text-sm">
          <Plus size={18} /> Novo Produto
        </button>
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

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Categoria</label>
                  <select value={formData.category || 'lanches'} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full border-2 border-stone-200 p-3 rounded-lg font-bold bg-white">
                    <option value="lanches">Lanches</option>
                    <option value="porcoes">Porções</option>
                    <option value="bebidas">Bebidas</option>
                    <option value="doces">Doces</option>
                  </select>
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
                      <div key={ex.id} className="flex justify-between items-center bg-stone-50 p-2 rounded-lg border border-stone-200">
                        <span className="font-bold">{ex.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-green-600 font-bold">+R$ {ex.price.toFixed(2)}</span>
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
        {products.map(p => (
          <div key={p.id} className="bg-white p-5 rounded-2xl border-2 border-stone-200 shadow-sm flex flex-col justify-between hover:border-yellow-400 transition-colors group">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="text-4xl">{p.emoji}</div>
                <div className="bg-stone-100 px-2 py-1 rounded text-xs font-bold uppercase text-stone-500">{p.category}</div>
              </div>
              <h4 className="font-black text-xl leading-tight mb-2">{p.name}</h4>
              <p className="text-sm text-stone-500 font-medium mb-3 line-clamp-2">{p.description}</p>
              <div className="flex gap-2 flex-wrap mb-4">
                {(p.productExtras || []).map(ex => (
                  <span key={ex.id} className="text-[10px] font-bold uppercase bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded border border-yellow-200">+{ex.name}</span>
                ))}
              </div>
              <div className="flex justify-between items-center font-black">
                <span className="text-lg text-green-600">R$ {p.price.toFixed(2)}</span>
                <span className="text-yellow-500 bg-yellow-50 px-2 py-1 rounded border border-yellow-100 text-sm">+{p.points} XP</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t-2 border-stone-100">
              <button onClick={() => handleEdit(p)} className="flex-1 py-2 bg-stone-900 text-yellow-400 rounded-lg flex items-center justify-center font-bold uppercase tracking-widest text-sm gap-2 hover:bg-stone-800 transition-colors"><Edit2 size={16}/> Editar</button>
              <button onClick={() => handleDelete(p.id!)} className="w-12 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmModal isOpen={!!deleteId} message="Tem certeza? Removerá o produto para sempre." onConfirm={performDeleteProd} onCancel={() => setDeleteId(null)} />
      <PromptModal isOpen={promptImage} title="URL da Imagem" onConfirm={performAddImage} onCancel={() => setPromptImage(false)} />
      <PromptModal isOpen={promptExtraName} title="Nome do Adicional" onConfirm={performAddExtraName} onCancel={() => setPromptExtraName(false)} />
      <PromptModal isOpen={promptExtraPrice} title="Preço do Adicional" onConfirm={performAddExtraPrice} onCancel={() => setPromptExtraPrice(false)} />
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
// PRINT SETTINGS
// ----------------------------------------------------------------------
function PrintSettingsEditor({ settings, setSettings, onTestPrint }: any) {
  const { addToast } = useToast();

  const handleSave = () => {
    addToast({ message: 'Configurações de impressão salvas localmente!', type: 'success' });
  };

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-stone-200">
        <h2 className="text-2xl font-display uppercase font-bold flex items-center gap-2">
          <Settings size={24} className="text-yellow-500" /> Configurações de Impressora
        </h2>
      </div>

      <div className="bg-white p-8 rounded-2xl border-2 border-stone-200 shadow-sm space-y-8">
        <div>
          <h3 className="font-black uppercase border-b-2 border-stone-100 pb-2 mb-4">Comportamento</h3>
          <label className="flex items-center gap-3 cursor-pointer p-4 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors">
            <div className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoPrint ? 'bg-green-500' : 'bg-stone-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.autoPrint ? 'left-7' : 'left-1'}`}></div>
            </div>
            <div>
              <div className="font-bold uppercase">Impressão Automática</div>
              <div className="text-xs text-stone-500 font-medium">Imprime o pedido assim que ele entra no painel. Requer permissão de popup no navegador.</div>
            </div>
          </label>
        </div>

        <div>
          <h3 className="font-black uppercase border-b-2 border-stone-100 pb-2 mb-4">Formato da Comanda</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className={`border-2 rounded-xl p-4 cursor-pointer text-center transition-all ${settings.printerType === 'thermal_80' ? 'border-yellow-400 bg-yellow-50' : 'border-stone-200 hover:border-stone-300'}`}>
              <input type="radio" name="ptype" className="hidden" checked={settings.printerType === 'thermal_80'} onChange={() => setSettings({...settings, printerType: 'thermal_80'})} />
              <Printer size={32} className="mx-auto mb-2 text-stone-600" />
              <div className="font-bold uppercase">Térmica 80mm</div>
              <div className="text-xs text-stone-500 mt-1">Padrão Restaurantes</div>
            </label>
            <label className={`border-2 rounded-xl p-4 cursor-pointer text-center transition-all ${settings.printerType === 'thermal_58' ? 'border-yellow-400 bg-yellow-50' : 'border-stone-200 hover:border-stone-300'}`}>
              <input type="radio" name="ptype" className="hidden" checked={settings.printerType === 'thermal_58'} onChange={() => setSettings({...settings, printerType: 'thermal_58'})} />
              <Printer size={24} className="mx-auto mb-2 text-stone-600" />
              <div className="font-bold uppercase">Térmica 58mm</div>
              <div className="text-xs text-stone-500 mt-1">Bobina Menor</div>
            </label>
            <label className={`border-2 rounded-xl p-4 cursor-pointer text-center transition-all ${settings.printerType === 'normal' ? 'border-yellow-400 bg-yellow-50' : 'border-stone-200 hover:border-stone-300'}`}>
              <input type="radio" name="ptype" className="hidden" checked={settings.printerType === 'normal'} onChange={() => setSettings({...settings, printerType: 'normal'})} />
              <Printer size={40} className="mx-auto mb-2 text-stone-600" />
              <div className="font-bold uppercase">A4 / Normal</div>
              <div className="text-xs text-stone-500 mt-1">Impressora Doméstica</div>
            </label>
          </div>
        </div>

        <div>
          <h3 className="font-black uppercase border-b-2 border-stone-100 pb-2 mb-4">Cabeçalho da Impressão</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Nome Principal</label>
              <input value={settings.printHeader} onChange={e => setSettings({...settings, printHeader: e.target.value})} className="w-full border-2 border-stone-200 p-3 rounded-lg font-bold font-display uppercase tracking-widest text-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Subtítulo / Slogan</label>
              <input value={settings.printSubHeader} onChange={e => setSettings({...settings, printSubHeader: e.target.value})} className="w-full border-2 border-stone-200 p-3 rounded-lg font-bold" />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t-2 border-stone-100 flex flex-col md:flex-row gap-4">
          <button onClick={onTestPrint} className="flex-1 bg-stone-100 text-stone-700 border-2 border-stone-300 px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-stone-200 transition-colors flex items-center justify-center gap-2">
            <Printer size={20} /> Escolher Impressora / Testar
          </button>
          <button onClick={handleSave} className="flex-1 bg-stone-900 text-yellow-400 px-8 py-4 rounded-xl font-bold uppercase tracking-widest shadow-md hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">
            <Save size={20} /> Salvar Configurações
          </button>
        </div>
      </div>
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
