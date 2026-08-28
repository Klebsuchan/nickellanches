import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Printer, CheckSquare, Lock, X, Plus, Trash2, Edit2, Package, Tag, Clock, Save } from 'lucide-react';
import { Order, getProducts, saveProduct, deleteProduct, getPromos, savePromo, deletePromo, getAllOrders, updateOrderStatus, PromoCode, subscribeToAllOrders } from '../lib/db';
import { Product } from '../types';
import { useToast } from './Toast';
import { playSound } from '../lib/audio';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'promos'>('orders');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  
  const { addToast } = useToast();
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === (import.meta as any).env.VITE_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      loadData();
      playSound('coin');
      addToast({ message: 'Login efetuado com sucesso!', type: 'success' });
    } else {
      playSound('error');
      addToast({ message: 'Senha incorreta!', type: 'error' as any });
    }
  };
  
  const printedOrders = useRef<Set<string>>(new Set(JSON.parse(localStorage.getItem('printed_orders') || '[]')));

  const loadData = async () => {
    try {
      setProducts(await getProducts());
      setPromos(await getPromos());
    } catch (e) {
      console.error(e);
      addToast({ message: 'Erro ao carregar dados', type: 'error' as any });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      
      const unsubOrders = subscribeToAllOrders((newOrders) => {
        setOrders(newOrders);
        
        // Auto print logic and notification for new orders
        const pendingOrders = newOrders.filter(o => o.status === 'pendente' || o.status === 'preparando');
        if (pendingOrders.length > 0) {
          const toPrint = pendingOrders.filter(o => !printedOrders.current.has(o.id));
          
          if (toPrint.length > 0) {
            playSound('powerup');
            addToast({ message: 'NOVO PEDIDO RECEBIDO!', type: 'success' });
            // Print the newest unprinted order
            const orderToPrint = toPrint[0];
            handlePrint(orderToPrint);
            
            // Mark as printed
            printedOrders.current.add(orderToPrint.id);
            localStorage.setItem('printed_orders', JSON.stringify(Array.from(printedOrders.current)));
          }
        }
      });
      
      return () => unsubOrders();
    }
  }, [isAuthenticated]);
  
  const handlePrint = (order: Order) => {
    setOrderToPrint(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };
  
  const handleCompleteOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'entregue');
      playSound('powerup');
      addToast({ message: 'Pedido marcado como entregue', type: 'success' });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      playSound('coin');
      addToast({ message: `Status atualizado com sucesso`, type: 'success' });
    } catch (e) {
      console.error(e);
      addToast({ message: `Erro ao atualizar status`, type: 'error' as any });
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 z-50 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center">
      {!isAuthenticated ? (
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
          <input 
            type="password" 
            placeholder="Senha administrativa"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-stone-200 rounded-lg p-3 mb-6 outline-none focus:ring-4 focus:ring-yellow-400 font-bold text-black"
          />
          <button type="submit" className="w-full bg-black text-yellow-400 font-display uppercase tracking-widest py-3 rounded-lg border border-stone-200 hover:-translate-y-1 hover:shadow-sm transition-all">
            Entrar
          </button>
        </motion.form>
      ) : (
        <>
          <div className="w-full max-w-6xl flex-1 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col overflow-hidden admin-panel-container">
             {/* Header */}
             <div className="bg-black text-yellow-400 p-6 border-b-4 border-black flex justify-between items-center">
               <h1 className="text-3xl font-display uppercase tracking-widest flex items-center gap-3">
                 <Lock className="text-white" /> Painel Admin
               </h1>
               <button onClick={onClose} className="text-white hover:text-yellow-400 transition-colors">
                 <X size={32} />
               </button>
             </div>
             
             {/* Navigation */}
             <div className="flex border-b-4 border-black bg-zinc-100 font-display uppercase text-black font-bold">
               <button 
                 onClick={() => setActiveTab('orders')}
                 className={`flex-1 p-4 flex items-center justify-center gap-2 border-r-4 border-black hover:bg-yellow-100 ${activeTab === 'orders' ? 'bg-yellow-400' : ''}`}
               >
                 <Clock size={20} /> Pedidos
               </button>
               <button 
                 onClick={() => setActiveTab('products')}
                 className={`flex-1 p-4 flex items-center justify-center gap-2 border-r-4 border-black hover:bg-yellow-100 ${activeTab === 'products' ? 'bg-yellow-400' : ''}`}
               >
                 <Package size={20} /> Produtos
               </button>
               <button 
                 onClick={() => setActiveTab('promos')}
                 className={`flex-1 p-4 flex items-center justify-center gap-2 hover:bg-yellow-100 ${activeTab === 'promos' ? 'bg-yellow-400' : ''}`}
               >
                 <Tag size={20} /> Cupons
               </button>
             </div>
             
             {/* Content */}
             <div className="flex-1 overflow-y-auto p-6 bg-zinc-50 text-black comic-scrollbar">
               {activeTab === 'orders' && (
                 <div className="grid gap-6 md:grid-cols-2">
                   {orders.map(order => (
                      <div key={order.id} className="bg-white border border-stone-200 rounded-xl p-6 relative shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-display uppercase">Cliente: {order.userName || 'Anônimo'}</h3>
                            <span className="text-sm text-zinc-500 font-bold">
                              Data: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Recente'}
                            </span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border border-stone-200 ${order.status === 'entregue' ? 'bg-green-400' : 'bg-yellow-400'}`}>
                            {order.status || 'Pendente'}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-6 text-sm font-bold border-y-2 border-black py-4">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-start">
                              <div>
                                <span className="text-red-500">{item.quantity}x</span> {item.name}
                                {item.extras && item.extras.length > 0 && (
                                  <div className="text-xs text-zinc-500 pl-4">+ {item.extras.map((e:any)=>e.name).join(', ')}</div>
                                )}
                                {item.observation && (
                                  <div className="text-xs text-blue-600 pl-4 italic">"{item.observation}"</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between items-center text-xl font-bold font-display uppercase mb-4">
                          <span>Total:</span>
                          <span>R$ {order.totalPrice.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handlePrint(order)}
                              className="flex-1 py-2 bg-zinc-100 border border-stone-200 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-zinc-200"
                            >
                              <Printer size={18} /> Comanda
                            </button>
                            <select 
                              value={order.status || 'pendente'}
                              onChange={(e) => handleUpdateStatus(order.id!, e.target.value)}
                              className="flex-1 py-2 px-2 bg-white border border-stone-200 rounded-lg font-bold uppercase text-sm cursor-pointer"
                            >
                              <option value="pendente">Pendente</option>
                              <option value="cozinha_confirmou">Conf. Cozinha</option>
                              <option value="em_preparo">Em Preparo</option>
                              <option value="a_caminho">Saiu P/ Entrega</option>
                              <option value="entregue">Entregue</option>
                            </select>
                          </div>
                        </div>
                      </div>
                   ))}
                   {orders.length === 0 && <p className="font-bold col-span-2 text-center text-zinc-500">Nenhum pedido encontrado.</p>}
                 </div>
               )}
               
               {activeTab === 'products' && (
                 <ProductEditor products={products} onUpdate={loadData} />
               )}
               
               {activeTab === 'promos' && (
                 <PromoEditor promos={promos} onUpdate={loadData} />
               )}
             </div>
          </div>
          
          {/* Printable Command (Only visible during print) */}
          <div id="printable-command" className="hidden print:block w-[80mm] p-2 bg-white text-black font-mono text-sm leading-tight mx-auto">
            {orderToPrint && (
              <div>
                <div className="text-center mb-4">
                  <h2 className="font-bold text-xl uppercase">NICKEL LANCHES</h2>
                  <p className="text-xs">O Lanche Mais Divertido!</p>
                  <p>--------------------------------</p>
                </div>
                
                <div className="mb-4 text-xs">
                  <p><strong>Pedido:</strong> #{orderToPrint.id?.substring(0,6).toUpperCase()}</p>
                  <p><strong>Data:</strong> {orderToPrint.createdAt?.toDate ? orderToPrint.createdAt.toDate().toLocaleString() : ''}</p>
                  <p>--------------------------------</p>
                  <p><strong>Cliente:</strong> {orderToPrint.userName || 'Anônimo'}</p>
                  <p><strong>Telefone:</strong> __________________</p>
                  <p><strong>Endereço:</strong> __________________</p>
                  <p>________________________________</p>
                </div>
                
                <div className="border-t border-b border-black py-2 mb-4 text-xs">
                  <div className="font-bold mb-1">ITENS DO PEDIDO</div>
                  {orderToPrint.items.map((item, i) => (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between font-bold">
                        <span>{item.quantity}x {item.name.substring(0, 20)}</span>
                        <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      {item.extras && item.extras.length > 0 && (
                        <div className="pl-2">+ {item.extras.map((e:any)=>e.name).join(', ')}</div>
                      )}
                      {item.observation && (
                        <div className="pl-2 italic">OBS: {item.observation}</div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between font-bold text-base mb-4">
                  <span>TOTAL</span>
                  <span>R$ {orderToPrint.totalPrice.toFixed(2)}</span>
                </div>
                
                <div className="text-center text-xs mt-4">
                  <p>Obrigado pela preferência!</p>
                  <p>*** VOLTE SEMPRE ***</p>
                  <p className="mt-2">-</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Subcomponents for editing Products and Promos
function ProductEditor({ products, onUpdate }: { products: Product[], onUpdate: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const { addToast } = useToast();
  
  const handleEdit = (p: Product) => {
    setEditingId(p.id!);
    setFormData(p);
  };
  
  const handleAdd = () => {
    setEditingId('new');
    setFormData({ name: '', description: '', price: 0, points: 0, emoji: '🍔' });
  };
  
  const handleSave = async () => {
    try {
      await saveProduct(formData as Product, editingId === 'new' ? undefined : editingId!);
      addToast({ message: 'Produto salvo!', type: 'success' });
      setEditingId(null);
      onUpdate();
    } catch (e) {
      addToast({ message: 'Erro ao salvar', type: 'error' as any });
    }
  };
  
  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza?')) {
      await deleteProduct(id);
      addToast({ message: 'Produto removido', type: 'success' });
      onUpdate();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display uppercase font-bold">Gerenciar Produtos</h2>
        <button onClick={handleAdd} className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold border border-stone-200 flex items-center gap-2 hover:bg-yellow-500 shadow-sm">
          <Plus size={18} /> Novo Produto
        </button>
      </div>
      
      {editingId && (
        <div className="bg-zinc-100 p-6 rounded-xl border border-stone-200 shadow-sm mb-8">
          <h3 className="font-bold text-lg mb-4">{editingId === 'new' ? 'Novo Produto' : 'Editar Produto'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Nome" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="border border-stone-200 p-2 rounded-lg" />
            <input placeholder="Emoji" value={formData.emoji || ''} onChange={e => setFormData({...formData, emoji: e.target.value})} className="border border-stone-200 p-2 rounded-lg" />
            <input type="number" placeholder="Preço" value={formData.price || 0} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="border border-stone-200 p-2 rounded-lg" />
            <input type="number" placeholder="XP (Pontos)" value={formData.points || 0} onChange={e => setFormData({...formData, points: Number(e.target.value)})} className="border border-stone-200 p-2 rounded-lg" />
            <textarea placeholder="Descrição" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="border border-stone-200 p-2 rounded-lg col-span-2" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="bg-green-400 px-4 py-2 rounded-lg font-bold border border-stone-200 flex items-center gap-2 hover:bg-green-500"><Save size={18}/> Salvar</button>
            <button onClick={() => setEditingId(null)} className="bg-white px-4 py-2 rounded-lg font-bold border border-stone-200">Cancelar</button>
          </div>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-3xl mb-2">{p.emoji}</div>
              <h4 className="font-bold text-lg">{p.name}</h4>
              <p className="text-sm text-zinc-600 mb-2">{p.description}</p>
              <div className="flex justify-between font-bold">
                <span>R$ {p.price.toFixed(2)}</span>
                <span className="text-yellow-500">+{p.points} XP</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t-2 border-black border-dashed">
              <button onClick={() => handleEdit(p)} className="flex-1 py-1 bg-yellow-400 border border-stone-200 rounded flex items-center justify-center"><Edit2 size={16}/></button>
              <button onClick={() => handleDelete(p.id!)} className="flex-1 py-1 bg-red-400 text-white border border-stone-200 rounded flex items-center justify-center"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromoEditor({ promos, onUpdate }: { promos: PromoCode[], onUpdate: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PromoCode>>({});
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
      onUpdate();
    } catch (e) {
      addToast({ message: 'Erro ao salvar', type: 'error' as any });
    }
  };
  
  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza?')) {
      await deletePromo(id);
      addToast({ message: 'Cupom removido', type: 'success' });
      onUpdate();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display uppercase font-bold">Gerenciar Cupons</h2>
        <button onClick={handleAdd} className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold border border-stone-200 flex items-center gap-2 hover:bg-yellow-500 shadow-sm">
          <Plus size={18} /> Novo Cupom
        </button>
      </div>
      
      {editingId && (
        <div className="bg-zinc-100 p-6 rounded-xl border border-stone-200 shadow-sm mb-8">
          <h3 className="font-bold text-lg mb-4">{editingId === 'new' ? 'Novo Cupom' : 'Editar Cupom'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Código (ex: NICKEL10)" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="border border-stone-200 p-2 rounded-lg uppercase" />
            <input type="number" placeholder="Desconto (ex: 0.1 para 10% ou 15 para R$15)" value={formData.discount || 0} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} className="border border-stone-200 p-2 rounded-lg" step="0.01" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="bg-green-400 px-4 py-2 rounded-lg font-bold border border-stone-200 flex items-center gap-2 hover:bg-green-500"><Save size={18}/> Salvar</button>
            <button onClick={() => setEditingId(null)} className="bg-white px-4 py-2 rounded-lg font-bold border border-stone-200">Cancelar</button>
          </div>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-3">
        {promos.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-xl uppercase tracking-widest text-blue-600">{p.code}</h4>
              <p className="text-sm font-bold mt-2">Desconto: {p.discount < 1 ? `${p.discount * 100}%` : `R$ ${p.discount.toFixed(2)}`}</p>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t-2 border-black border-dashed">
              <button onClick={() => handleEdit(p)} className="flex-1 py-1 bg-yellow-400 border border-stone-200 rounded flex items-center justify-center"><Edit2 size={16}/></button>
              <button onClick={() => handleDelete(p.id!)} className="flex-1 py-1 bg-red-400 text-white border border-stone-200 rounded flex items-center justify-center"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
