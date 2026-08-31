import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2 } from 'lucide-react';
import { CartItem } from '../types';
import RenderWithNickel from './RenderWithNickel';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveItem: (cartItemId: string) => void;
  discountCode: string;
  setDiscountCode: (code: string) => void;
  onApplyDiscount: () => void;
  appliedDiscount: number | null;
  totalCartBase: number;
  discountAmount: number;
  totalCart: number;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen, onClose, cart, onRemoveItem, discountCode, setDiscountCode, onApplyDiscount,
  appliedDiscount, totalCartBase, discountAmount, totalCart, onCheckout
}: CartDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} 
          />
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-md bg-white h-full relative z-10 flex flex-col border-l-4 border-black shadow-[-8px_0_0_#000]"
          >
            <div className="p-6 border-b-4 border-black bg-[#F28B20] flex justify-between items-center text-white">
              <h2 className="text-2xl font-black font-display uppercase tracking-widest">Sua Sacola</h2>
              <button onClick={onClose} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-[#FCF9F5]">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <span className="text-6xl mb-4">🛒</span>
                  <p className="font-bold text-lg uppercase font-display">Sacola Vazia</p>
                  <p className="text-sm">Bora encher essa sacola?</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => {
                    const extrasTotal = item.extras?.reduce((sum, e) => sum + e.price, 0) || 0;
                    const itemTotal = (item.price + extrasTotal) * item.quantity;
                    
                    return (
                      <div key={item.cartItemId} className="bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_#000] flex justify-between relative group">
                        <div className="flex-1">
                          <h4 className="font-bold text-stone-900 leading-tight">
                            <span className="text-yellow-500">{item.quantity}x</span> <RenderWithNickel text={item.name} />
                          </h4>
                          {item.extras && item.extras.length > 0 && (
                            <div className="text-xs text-yellow-600 font-bold mt-1">
                              + {item.extras.map(e => e.name).join(', ')}
                            </div>
                          )}
                          {item.observation && (
                            <div className="text-xs text-red-500 italic font-bold mt-1">
                              "{item.observation}"
                            </div>
                          )}
                          <div className="text-sm font-bold text-stone-500 mt-2">
                            R$ {itemTotal.toFixed(2).replace('.', ',')}
                          </div>
                        </div>
                        <button 
                          onClick={() => onRemoveItem(item.cartItemId)}
                          className="w-10 h-10 bg-red-100 text-red-500 rounded-full flex items-center justify-center border-2 border-transparent hover:border-red-500 hover:bg-red-200 transition-colors ml-4"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-white border-t-4 border-black">
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    placeholder="Cupom de Desconto" 
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="flex-1 border-2 border-black rounded-lg px-4 font-bold uppercase placeholder:normal-case outline-none focus:ring-4 focus:ring-yellow-400/50"
                  />
                  <button 
                    onClick={onApplyDiscount}
                    className="px-6 py-2 bg-black text-yellow-400 font-bold uppercase rounded-lg hover:bg-stone-800 transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
                
                <div className="space-y-2 mb-6 font-bold text-sm">
                  <div className="flex justify-between text-stone-500">
                    <span>Subtotal</span>
                    <span>R$ {totalCartBase.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {appliedDiscount !== null && (
                    <div className="flex justify-between text-green-500">
                      <span>Desconto</span>
                      <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl text-black font-black uppercase pt-2 border-t-2 border-stone-100">
                    <span>Total</span>
                    <span>R$ {totalCart.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>

                <button 
                  onClick={onCheckout}
                  className="w-full py-4 bg-yellow-400 border-2 border-black text-black font-display tracking-widest uppercase rounded-xl hover:bg-yellow-500 shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg"
                >
                  Finalizar Pedido
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
