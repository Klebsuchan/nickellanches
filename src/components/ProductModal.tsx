import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Check } from 'lucide-react';
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
  const [selectedChoice, setSelectedChoice] = useState<{ name: string; price?: number; image?: string } | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [observation, setObservation] = useState('');

  // Determine choices (with smart fallbacks for beverages if not explicitly present in database)
  const productChoices = React.useMemo(() => {
    if (!product) return [];
    if (product.choices && product.choices.length > 0) return product.choices;

    const lowerName = (product.name || '').toLowerCase();
    const lowerCat = (product.category || '').toLowerCase();

    if (lowerCat === 'bebidas' || lowerName.includes('água') || lowerName.includes('agua')) {
      if (lowerName.includes('água') || lowerName.includes('agua')) {
        return [
          { name: "Sem Gás", image: "/images/aguasemgas-1.jpg" },
          { name: "Com Gás", image: "/images/aguagas-1.jpg" }
        ];
      }
      if (lowerName.includes('200ml')) {
        return [
          { name: "Coca Cola", image: "/images/coca200ml-1.jpg" },
          { name: "Guaraná", image: "/images/gurana200ml-1.jpg" },
          { name: "Pepsi", image: "/images/pepsi2l-1.jpg" }
        ];
      }
      if (lowerName.includes('lata')) {
        return [
          { name: "Coca Cola", image: "/images/cocalata-1.jpg" },
          { name: "Coca Cola Zero", image: "/images/cocazero-1.jpg" },
          { name: "Guaraná", image: "/images/guarana600-1.avif" },
          { name: "Pepsi", image: "/images/pepsi600ml-1.jpg" },
          { name: "Sprite", image: "/images/sprite600ml-1.jpg" }
        ];
      }
      if (lowerName.includes('600ml')) {
        return [
          { name: "Coca Cola", image: "/images/coca600ml-1.jpg" },
          { name: "Guaraná", image: "/images/guarana600-1.avif" },
          { name: "Pepsi", image: "/images/pepsi600ml-1.jpg" },
          { name: "Sprite", image: "/images/sprite600ml-1.jpg" }
        ];
      }
      if (lowerName.includes('2 litro') || lowerName.includes('2l')) {
        return [
          { name: "Coca Cola", image: "/images/cocacola2l-1.jpg" },
          { name: "Guaraná", image: "/images/guarana600-1.avif" },
          { name: "Pepsi", image: "/images/pepsi2l-1.jpg" },
          { name: "Charrua", image: "/images/charrua2l-1.jpg" }
        ];
      }
      if (lowerName.includes('refri') || lowerName.includes('refrigerante')) {
        return [
          { name: "Coca Cola" },
          { name: "Guaraná" },
          { name: "Pepsi" }
        ];
      }
    }
    return [];
  }, [product]);

  React.useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setSelectedChoice(productChoices.length > 0 ? productChoices[0] : null);
      setSelectedExtras([]);
      setObservation('');
    }
  }, [isOpen, product, productChoices]);

  if (!product) return null;

  const handleToggleExtra = (extra: Extra) => {
    const isSelected = selectedExtras.find(e => e.id === extra.id);
    if (isSelected) {
      setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const basePrice = selectedChoice?.price !== undefined ? selectedChoice.price : product.price;
  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
  const unitPrice = basePrice + extrasTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    onAddToCart({
      ...product,
      name: selectedChoice ? `${product.name} (${selectedChoice.name})` : product.name,
      price: basePrice,
      image: selectedChoice?.image || product.image || (product.images && product.images.length > 0 ? product.images[0] : undefined),
      quantity,
      extras: selectedExtras,
      observation,
      cartItemId: Math.random().toString(36).substring(2, 9),
    });
    onClose();
  };

  const isBeverage = product.category?.toLowerCase() === "bebidas" || (product.name || '').toLowerCase().includes('água') || (product.name || '').toLowerCase().includes('refri');
  const displayExtras = (product.productExtras && product.productExtras.length > 0) ? product.productExtras : (!isBeverage ? AVAILABLE_EXTRAS : []);

  const displayImage = selectedChoice?.image || product.image || (product.images && product.images.length > 0 ? product.images[0] : null);

  const choiceTitle = product.choiceName || (isBeverage ? ((product.name || '').toLowerCase().includes('água') ? 'Tipo de Água' : 'Sabor do Refrigerante') : 'Escolha uma opção');

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
                <div className="w-full h-48 md:h-64 bg-stone-100 relative flex items-center justify-center overflow-hidden">
                  <img src={displayImage} alt={product.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent"></div>
                  <button 
                    onClick={onClose}
                    className="absolute top-4 left-4 md:top-4 md:right-4 md:left-auto w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors z-20"
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
                  R$ {basePrice.toFixed(2).replace('.', ',')}
                </div>
              </div>

              {/* Choices Section (e.g. Sabor / Tipo de Água) */}
              {productChoices.length > 0 && (
                <>
                  <div className="w-full h-2 bg-stone-100"></div>
                  <div className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-black uppercase text-lg">{choiceTitle}</h3>
                      <span className="text-[11px] font-black bg-orange-100 text-[#F28B20] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        1 Obrigatório
                      </span>
                    </div>
                    <p className="text-sm text-stone-500 mb-4 font-medium">Selecione uma das opções abaixo</p>
                    
                    <div className="space-y-2.5">
                      {productChoices.map((choice, idx) => {
                        const isSelected = selectedChoice?.name === choice.name;
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedChoice(choice)}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-[#F28B20] bg-orange-50/50 shadow-sm' 
                                : 'border-stone-200 hover:border-stone-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isSelected ? 'border-[#F28B20]' : 'border-stone-300'
                              }`}>
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#F28B20]" />}
                              </div>
                              {choice.image && (
                                <img 
                                  src={choice.image} 
                                  alt={choice.name} 
                                  className="w-9 h-9 object-contain rounded-lg border border-stone-100 p-0.5 bg-stone-50"
                                  referrerPolicy="no-referrer" 
                                />
                              )}
                              <div>
                                <span className={`font-bold text-sm md:text-base ${isSelected ? 'text-stone-900' : 'text-stone-700'}`}>
                                  {choice.name}
                                </span>
                                {choice.price !== undefined && choice.price !== product.price && (
                                  <span className="block text-xs text-stone-500 font-medium">
                                    R$ {choice.price.toFixed(2).replace('.', ',')}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md ${
                              isSelected ? 'bg-orange-200 text-[#F28B20]' : 'text-stone-400'
                            }`}>
                              {isSelected ? 'Escolhido' : 'Selecionar'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Extras Section (Only for products with available extras) */}
              {displayExtras.length > 0 && (
                <>
                  <div className="w-full h-2 bg-stone-100"></div>
                  <div className="p-4 md:p-6 bg-white">
                    <h3 className="font-black uppercase mb-1 text-lg">Adicionais</h3>
                    <p className="text-sm text-stone-500 mb-4 font-medium">Turbine seu pedido</p>
                    
                    <div className="space-y-3">
                      {displayExtras.map(extra => {
                        const isSelected = selectedExtras.find(e => e.id === extra.id);
                        return (
                          <label 
                            key={extra.id} 
                            onClick={(e) => { e.preventDefault(); handleToggleExtra(extra); }} 
                            className="flex items-center justify-between p-0 cursor-pointer group"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-[#F28B20] border-[#F28B20]' : 'border-stone-300 group-hover:border-[#F28B20]'}`}>
                                {isSelected && <Check size={16} className="text-white" strokeWidth={3} />}
                              </div>
                              <span className="font-bold text-stone-700">{extra.name}</span>
                            </div>
                            <span className="font-bold text-stone-500">+ R$ {extra.price.toFixed(2).replace('.', ',')}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="w-full h-2 bg-stone-100"></div>

              {/* Observations */}
              <div className="p-4 md:p-6 bg-white">
                <h3 className="font-black uppercase mb-1 text-lg">Alguma observação?</h3>
                <p className="text-sm text-stone-500 mb-4 font-medium">
                  {isBeverage ? 'Ex: Com gelo e limão, bem gelada...' : 'Ex: Tirar cebola, maionese à parte...'}
                </p>
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

