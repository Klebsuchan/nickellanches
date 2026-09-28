import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, ChevronDown, CheckCircle2, ThumbsUp, Sparkles, Filter } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { getFeedbacks, addFeedback, Feedback } from '../lib/db';
import { INITIAL_100_FEEDBACKS } from '../lib/feedbacksData';
import { OrderInfo, CartItem } from '../types';

interface FeedbacksSectionProps {
  user: FirebaseUser | null;
  orderHistory: OrderInfo[];
}

export default function FeedbacksSection({ user, orderHistory }: FeedbacksSectionProps) {
  // Inicializa com as 100 avaliações ricas e variadas
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(INITIAL_100_FEEDBACKS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newFeedbackText, setNewFeedbackText] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'magma_cemuche' | 'with_photo'>('all');
  const [visibleCount, setVisibleCount] = useState(6);

  const orderedItems = useMemo(() => {
    const itemsMap = new Map<string, CartItem>();
    if (orderHistory) {
      orderHistory.forEach(order => {
        order.items.forEach(item => {
          if (!itemsMap.has(item.id)) {
            itemsMap.set(item.id, item);
          }
        });
      });
    }
    return Array.from(itemsMap.values());
  }, [orderHistory]);

  useEffect(() => {
    async function loadFeedbacks() {
      try {
        const dbFeedbacks = await getFeedbacks();
        if (dbFeedbacks && dbFeedbacks.length > 0) {
          // Mescla novos do banco com os 100 feedbacks base, limitando a 100 avaliações no total
          const uniqueDbFeedbacks = dbFeedbacks.filter(
            dbItem => !INITIAL_100_FEEDBACKS.some(init => init.id === dbItem.id)
          );
          const merged = [...uniqueDbFeedbacks, ...INITIAL_100_FEEDBACKS].slice(0, 100);
          setFeedbacks(merged);
        }
      } catch (error) {
        console.error("Erro ao carregar feedbacks adicionais do Firestore", error);
      }
    }
    loadFeedbacks();
  }, []);

  const filteredFeedbacks = useMemo(() => {
    let result = feedbacks;
    if (activeFilter === 'magma_cemuche') {
      result = result.filter(fb => {
        const txt = (fb.text || '').toLowerCase();
        return txt.includes('magma') || txt.includes('cemuche');
      });
    } else if (activeFilter === 'with_photo') {
      result = result.filter(fb => !!fb.foodPhoto);
    }
    // Garante no máximo 100 avaliações
    return result.slice(0, 100);
  }, [feedbacks, activeFilter]);

  const displayedFeedbacks = useMemo(() => {
    return filteredFeedbacks.slice(0, visibleCount);
  }, [filteredFeedbacks, visibleCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFeedbackText.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedItem = orderedItems.find(item => item.id === selectedItemId);
      await addFeedback({
        userId: user.uid,
        userName: user.displayName || 'Cliente Nickel Lanches',
        userAvatar: user.photoURL || '',
        text: newFeedbackText,
        location: 'Passo Fundo, RS',
        rating: newRating,
        foodPhoto: selectedItem?.image || undefined
      });
      
      const newFeedbackItem: Feedback = {
        id: 'fb-user-' + Date.now(),
        userId: user.uid,
        userName: user.displayName || 'Cliente Nickel Lanches',
        userAvatar: user.photoURL || '',
        text: newFeedbackText,
        location: 'Passo Fundo, RS',
        rating: newRating,
        foodPhoto: selectedItem?.image || undefined,
        createdAt: new Date()
      };

      setFeedbacks(prev => [newFeedbackItem, ...prev].slice(0, 100));
      setNewFeedbackText('');
      setSelectedItemId('');
      setIsFormOpen(false);
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="comic-panel p-6 md:p-8 rounded-3xl bg-white border border-[#F2E8D5] shadow-sm mt-16 relative z-10 text-stone-900">
      {/* Header com resumo das 100 avaliações */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 pb-6 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#4E2A84] text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
              <Sparkles size={13} className="text-yellow-300" />
              100 Avaliações de Passo Fundo
            </span>
            <span className="text-stone-400 text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-500" />
              Verificadas
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-[#4E2A84] uppercase tracking-tight">
            O Que a Galera Está Falando 💬
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} fill="currentColor" />
              ))}
            </div>
            <span className="text-sm md:text-base font-black text-stone-800">4,9 de 5 estrelas</span>
            <span className="text-xs md:text-sm text-stone-500 font-medium">
              (Xis Magma e Cemuche nota 5.0 absoluta ⭐)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-[#F28B20] text-white font-black px-6 py-3.5 rounded-full shadow-md hover:bg-orange-600 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm uppercase tracking-wider w-full sm:w-auto"
          >
            <MessageSquare size={18} />
            Deixar Avaliação
          </button>
        </div>
      </div>

      {/* Filtros rápidos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
          <Filter size={13} /> Filtrar:
        </span>
        <button
          onClick={() => { setActiveFilter('all'); setVisibleCount(6); }}
          className={`px-4 py-2 rounded-full text-xs font-black transition-all shrink-0 ${
            activeFilter === 'all'
              ? 'bg-[#4E2A84] text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Todas (100)
        </button>
        <button
          onClick={() => { setActiveFilter('magma_cemuche'); setVisibleCount(6); }}
          className={`px-4 py-2 rounded-full text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
            activeFilter === 'magma_cemuche'
              ? 'bg-[#F28B20] text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          ⭐ Xis Magma & Cemuche (Nota 5.0)
        </button>
        <button
          onClick={() => { setActiveFilter('with_photo'); setVisibleCount(6); }}
          className={`px-4 py-2 rounded-full text-xs font-black transition-all shrink-0 ${
            activeFilter === 'with_photo'
              ? 'bg-[#4E2A84] text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          📸 Com Fotos dos Lanches
        </button>
      </div>

      {/* Formulário retrátil para deixar avaliação */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            {user ? (
              <form onSubmit={handleSubmit} className="bg-[#FCF9F5] border border-[#F2E8D5] rounded-2xl p-6 shadow-sm">
                <h3 className="font-black uppercase mb-4 text-xl text-[#4E2A84]">Conta pra gente a sua experiência! 🌟</h3>
                
                {/* Seleção de Nota */}
                <div className="mb-4">
                  <label className="block text-xs font-black text-stone-700 mb-2 uppercase tracking-wider">
                    Sua Nota para o Lanche:
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <button
                        type="button"
                        key={starValue}
                        onClick={() => setNewRating(starValue)}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform"
                      >
                        <Star
                          size={28}
                          fill={starValue <= newRating ? "currentColor" : "none"}
                          className={starValue <= newRating ? "text-amber-400" : "text-stone-300"}
                        />
                      </button>
                    ))}
                    <span className="text-sm font-black text-stone-700 ml-2">
                      {newRating === 5 ? '5.0 Estrelas (Perfeito!)' : `${newRating}.0 Estrelas`}
                    </span>
                  </div>
                </div>

                {orderedItems.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-xs font-black text-stone-700 mb-2 uppercase tracking-wider">
                      Qual lanche você saboreou? (Opcional)
                    </label>
                    <select 
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full border border-stone-200 rounded-xl p-3 font-medium outline-none focus:ring-2 focus:ring-[#F28B20] bg-white text-stone-800 text-sm"
                    >
                      <option value="">Escolha um item do seu pedido recente...</option>
                      {orderedItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.emoji} {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-xs font-black text-stone-700 mb-2 uppercase tracking-wider">
                    Sua Opinião:
                  </label>
                  <textarea 
                    value={newFeedbackText}
                    onChange={(e) => setNewFeedbackText(e.target.value)}
                    placeholder="O que achou do sabor, ponto da carne, maionese e entrega em Passo Fundo?"
                    className="w-full border border-stone-200 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#F28B20] resize-y min-h-[90px] bg-white"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-2.5 font-bold text-stone-600 hover:bg-stone-200/60 rounded-full transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting || !newFeedbackText.trim()}
                    className="bg-[#4E2A84] text-white px-6 py-2.5 rounded-full font-black uppercase tracking-wider shadow-md hover:bg-purple-900 transition-all text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enviando...' : 'Publicar Avaliação'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-[#FCF9F5] border border-[#F2E8D5] rounded-2xl p-6 text-center">
                <p className="font-black text-lg text-stone-800 mb-1">Deseja deixar sua avaliação?</p>
                <p className="text-stone-600 text-sm font-medium">Faça login com sua conta para avaliar e ganhar pontos no Clube Nickel!</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid de Feedbacks - Seguro contra crash de Array length e com visual refinado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedFeedbacks.map((fb, idx) => {
          const numericRating = typeof fb.rating === 'number' ? fb.rating : 5;
          const isMagmaOrCemuche = (fb.text || '').toLowerCase().includes('magma') || (fb.text || '').toLowerCase().includes('cemuche');

          return (
            <motion.div 
              key={fb.id || idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (idx % 6) * 0.05 }}
              className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative group"
            >
              {isMagmaOrCemuche && (
                <div className="absolute top-4 right-4 bg-orange-100 text-[#F28B20] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ⭐ Destaque 5.0
                </div>
              )}

              {fb.foodPhoto && (
                <div className="w-full h-36 mb-4 rounded-xl overflow-hidden bg-stone-100 relative">
                  <img 
                    src={fb.foodPhoto} 
                    alt="Foto do lanche" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <ThumbsUp size={10} /> Foto de Cliente
                  </div>
                </div>
              )}

              {/* Estrelas com exibição precisa e segura */}
              <div className="flex items-center gap-1.5 text-amber-400 mb-2.5">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={15} 
                    fill={i < Math.round(numericRating) ? "currentColor" : "none"} 
                    className={i < Math.round(numericRating) ? "text-amber-400" : "text-stone-300"}
                  />
                ))}
                <span className="text-xs font-black text-stone-700 ml-1">
                  {numericRating.toFixed(1).replace('.', ',')}
                </span>
              </div>

              <p className="text-stone-700 font-medium mb-4 flex-grow italic text-sm leading-relaxed">
                "{fb.text}"
              </p>

              <div className="flex items-center gap-3 pt-3 border-t border-stone-100 mt-auto">
                {fb.userAvatar ? (
                  <img 
                    src={fb.userAvatar} 
                    alt={fb.userName} 
                    className="w-9 h-9 rounded-full object-cover border border-stone-200" 
                    loading="lazy"
                  />
                ) : (
                  <div className="w-9 h-9 bg-orange-100 text-[#F28B20] rounded-full flex items-center justify-center font-black text-sm">
                    {fb.userName ? fb.userName.charAt(0).toUpperCase() : 'N'}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-black text-xs text-stone-900 leading-tight uppercase truncate">
                    {fb.userName}
                  </h4>
                  <p className="text-[11px] text-stone-400 font-medium truncate">
                    {fb.location || 'Passo Fundo, RS'}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Botões de Carregar Mais / Ver Todas as 100 */}
      {visibleCount < filteredFeedbacks.length && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setVisibleCount(prev => Math.min(prev + 12, filteredFeedbacks.length))}
            className="w-full sm:w-auto bg-[#4E2A84] text-white font-black px-6 py-3 rounded-full hover:bg-purple-900 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
          >
            <ChevronDown size={16} />
            Carregar Mais (+12)
          </button>
          <button
            onClick={() => setVisibleCount(filteredFeedbacks.length)}
            className="w-full sm:w-auto bg-stone-100 text-stone-700 hover:bg-stone-200 font-black px-6 py-3 rounded-full transition-all text-xs uppercase tracking-widest"
          >
            Ver Todas as {filteredFeedbacks.length} Avaliações
          </button>
        </div>
      )}

      <div className="mt-4 text-center text-xs text-stone-400 font-medium">
        Mostrando {displayedFeedbacks.length} de {filteredFeedbacks.length} avaliações selecionadas de Passo Fundo
      </div>
    </div>
  );
}
