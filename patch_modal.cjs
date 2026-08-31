const fs = require('fs');
let content = `import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { Product, Extra, CartItem } from '../types';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export default function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [observation, setObservation] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
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
  const unitPrice = product.price + extrasTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    onAddToCart({
      ...product,
      quantity,
      extras: selectedExtras,
      observation,
      cartItemId: Math.random().toString(36).substring(2, 9),
    });
    onClose();
  };

  const displayImage = product.image || (product.images && product.images.length > 0 ? product.images[0] : null);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex md:items-center justify-center md:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm hidden md:block"
          />

          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="bg-white md:border border-stone-200 md:rounded-2xl w-full h-full md:h-auto max-w-lg md:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative z-10 text-black"
          >
            {/* Header Image or Solid Bar */}
            <div className="relative shrink-0">
              {displayImage ? (
                <div className="w-full h-48 md:h-64 bg-stone-100 relative">
                  <img src={displayImage} alt={product.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent"></div>
                  <button 
                    onClick={onClose}
                    className="absolute top-4 left-4 md:top-4 md:right-4 md:left-auto w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              ) : (
                <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-white shrink-0">
                  <h2 className="text-lg font-black uppercase line-clamp-1">{product.name}</h2>
                  <button onClick={onClose} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center hover:bg-stone-200">
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-grow pb-8">
              <div className="p-4 md:p-6 bg-white">
                {displayImage && (
                  <h2 className="text-2xl font-black uppercase mb-1 leading-tight">{product.name} {product.emoji}</h2>
                )}
                <p className="text-stone-500 font-medium leading-relaxed mb-4 text-sm md:text-base">
                  {product.description}
                </p>
                <div className="text-[#F28B20] font-black text-2xl">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </div>
              </div>

              <div className="w-full h-2 bg-stone-100"></div>

              {/* Extras Section */}
              <div className="p-4 md:p-6 bg-white">
                <h3 className="font-black uppercase mb-1 text-lg">Adicionais</h3>
                <p className="text-sm text-stone-500 mb-4 font-medium">Turbine seu pedido</p>
                
                <div className="space-y-3">
                  {(product.productExtras || []).length > 0 ? (
                    product.productExtras!.map(extra => {
                      const isSelected = selectedExtras.find(e => e.id === extra.id);
                      return (
                        <label 
                          key={extra.id} 
                          className="flex items-center justify-between p-0 cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={\`w-6 h-6 border-2 rounded flex items-center justify-center transition-colors \${isSelected ? 'bg-[#F28B20] border-[#F28B20]' : 'border-stone-300 group-hover:border-[#F28B20]'}\`}>
                              {isSelected && <Check size={16} className="text-white" strokeWidth={3} />}
                            </div>
                            <span className="font-bold text-stone-700">{extra.name}</span>
                          </div>
                          <span className="font-bold text-stone-500">+ R$ {extra.price.toFixed(2).replace('.', ',')}</span>
                        </label>
                      );
                    })
                  ) : (
                    <div className="text-sm font-medium text-stone-400 py-2">Nenhum adicional disponível para este item.</div>
                  )}
                </div>
              </div>

              <div className="w-full h-2 bg-stone-100"></div>

              {/* Observations */}
              <div className="p-4 md:p-6 bg-white">
                <h3 className="font-black uppercase mb-1 text-lg">Alguma observação?</h3>
                <p className="text-sm text-stone-500 mb-4 font-medium">Ex: Tirar cebola, maionese à parte...</p>
                <textarea 
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Digite aqui..."
                  className="w-full border-2 border-stone-200 rounded-xl p-4 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 min-h-[100px] resize-y"
                />
              </div>
            </div>

            {/* Footer with Add to Cart */}
            <div className="p-4 md:p-6 border-t border-stone-200 bg-white shrink-0">
              <div className="flex gap-4">
                <div className="flex items-center justify-between bg-stone-100 rounded-xl px-4 py-2 w-1/3">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-black active:scale-95 transition-transform"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="text-xl font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-[#F28B20] hover:text-orange-600 active:scale-95 transition-transform"
                  >
                    <Plus size={20} strokeWidth={3} />
                  </button>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#F28B20] text-white rounded-xl font-bold uppercase tracking-wide flex items-center justify-between px-6 shadow-md hover:bg-orange-500 active:scale-95 transition-all"
                >
                  <span>Adicionar</span>
                  <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
`;
fs.writeFileSync('src/components/ProductModal.tsx', content);
console.log('ProductModal updated for iFood-style mobile fullscreen');
