import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus } from 'lucide-react';
import { Product, Extra, CartItem } from '../types';
import { AVAILABLE_EXTRAS } from '../data';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export default function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedChoice, setSelectedChoice] = useState<{name: string, price?: number, image?: string} | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [observation, setObservation] = useState('');

  // Reset state when opening a new product
  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedChoice(product?.choices?.[0] || null);
      setSelectedExtras([]);
      setObservation('');
    }
  }, [isOpen, product]);

  if (!product) return null;

  const handleToggleExtra = (extra: Extra) => {
    const isSelected = selectedExtras.find(e => e.id === extra.id);
    if (isSelected) {
      setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
  const basePrice = selectedChoice?.price !== undefined ? selectedChoice.price : product.price;
  const unitPrice = basePrice + extrasTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    onAddToCart({
      ...product,
      name: selectedChoice ? `${product.name} (${selectedChoice.name})` : product.name,
      image: selectedChoice?.image || product.image,
      price: selectedChoice?.price !== undefined ? selectedChoice.price : product.price,
      quantity,
      extras: selectedExtras,
      observation,
      cartItemId: Math.random().toString(36).substring(2, 9),
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white border border-stone-200 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-sm relative z-10 text-black"
          >
            <div className="p-6 border-b-2 border-black flex justify-between items-center bg-yellow-400">
              <h2 className="text-2xl font-display comic-text-bold uppercase tracking-wider line-clamp-1">{product.name} {product.emoji}</h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-white border border-stone-200 rounded-full flex items-center justify-center hover:bg-zinc-100 shadow-sm transition-transform active:scale-95 flex-shrink-0"
              >
                <X size={20} className="text-black" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow comic-scrollbar">
              
              {product.images && product.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-4 mb-4 comic-scrollbar snap-x">
                  {product.images.map((img, i) => (
                    <img key={i} src={img} className="w-32 h-32 object-cover rounded-xl border-2 border-stone-200 flex-shrink-0 snap-start" referrerPolicy="no-referrer" />
                  ))}
                </div>
              )}
              <p className="font-bold text-zinc-600 mb-6 uppercase text-sm">{product.description}</p>


              {/* Extras Section */}
              <div className="mb-6">
                <h3 className="font-display font-bold uppercase mb-3 text-lg">Adicionais (+XP)</h3>
                <div className="space-y-2">
                  {(product.productExtras || []).length > 0 ? (
                    product.productExtras!.map(extra => {
                      const isSelected = selectedExtras.find(e => e.id === extra.id);
                      return (
                        <label 
                          key={extra.id} 
                          className={`flex items-center justify-between p-3 border border-stone-200 rounded-xl cursor-pointer transition-colors ${
                            isSelected ? 'bg-yellow-100 shadow-sm' : 'bg-white hover:bg-zinc-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 border border-stone-200 rounded-md flex items-center justify-center ${isSelected ? 'bg-yellow-400' : 'bg-white'}`}>
                              {isSelected && <Check size={16} className="text-black" />}
                            </div>
                            <span className="font-bold uppercase text-sm">{extra.name}</span>
                          </div>
                          <span className="font-bold text-green-600">+ R$ {extra.price.toFixed(2).replace('.', ',')}</span>
                        </label>
                      );
                    })
                  ) : (
                    <div className="text-center text-sm font-bold text-stone-400 py-2">Sem adicionais para este produto.</div>
                  )}
                </div>
              </div>

              {/* Observations */}
              <div className="mb-6">
                <h3 className="font-display font-bold uppercase mb-3 text-lg">Observações</h3>
                <textarea 
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ex: Tirar cebola, maionese à parte..."
                  className="w-full border border-stone-200 rounded-xl p-3 font-bold outline-none focus:ring-4 focus:ring-yellow-400/50 min-h-[100px] resize-y"
                />
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between bg-zinc-100 p-4 border border-stone-200 rounded-xl">
                <span className="font-display font-bold uppercase">Quantidade</span>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-white border border-stone-200 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="text-2xl font-bold font-display w-8 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 bg-yellow-400 border border-stone-200 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t-2 border-black bg-white">
              <button 
                onClick={handleAddToCart}
                className="w-full py-4 bg-black text-yellow-400 border border-stone-200 rounded-xl font-display font-bold uppercase tracking-widest text-xl shadow-sm hover:shadow-sm transition-all hover:-translate-y-1 flex items-center justify-between px-6"
              >
                <span>Adicionar</span>
                <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Missing Check import, let's fix it
import { Check } from 'lucide-react';
