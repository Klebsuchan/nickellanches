import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { getFeedbacks, addFeedback, Feedback } from '../lib/db';
import { OrderInfo, CartItem } from '../types';

interface FeedbacksSectionProps {
  user: FirebaseUser | null;
  orderHistory: OrderInfo[];
}

const MOCK_FEEDBACKS: Feedback[] = [
  {
    id: '1',
    userId: 'mock1',
    userName: 'Júlia Marques',
    userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    text: 'Melhor dogão que já comi em Passo Fundo! A maionese caseira é simplesmente de outro planeta 🛸',
    location: 'Passo Fundo, RS',
    rating: 5,
    foodPhoto: 'https://images.unsplash.com/photo-1615719413546-198b25453f85?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    createdAt: new Date()
  },
  {
    id: '2',
    userId: 'mock2',
    userName: 'Rafael Silva',
    userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    text: 'Entregaram super rápido aqui no centro de Passo Fundo. O jogo do doguinho me viciou enquanto esperava.',
    location: 'Passo Fundo, RS',
    rating: 5,
    foodPhoto: 'https://images.unsplash.com/photo-1594212691516-0158b4be7284?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    createdAt: new Date()
  },
  {
    id: '3',
    userId: 'mock3',
    userName: 'Amanda Costa',
    userAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    text: 'Salsicha artesanal faz toda a diferença. Recomendo o X-Bacon Mágico pra todo mundo de Passo Fundo.',
    location: 'Passo Fundo, RS',
    rating: 5,
    foodPhoto: 'https://images.unsplash.com/photo-1629814695029-23c21a1ce09a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    createdAt: new Date()
  }
];

export default function FeedbacksSection({ user, orderHistory }: FeedbacksSectionProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(MOCK_FEEDBACKS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newFeedbackText, setNewFeedbackText] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (dbFeedbacks.length > 0) {
          setFeedbacks([...dbFeedbacks, ...MOCK_FEEDBACKS]);
        }
      } catch (error) {
        console.error("Error loading feedbacks", error);
      }
    }
    loadFeedbacks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFeedbackText.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedItem = orderedItems.find(item => item.id === selectedItemId);
      await addFeedback({
        userId: user.uid,
        userName: user.displayName || 'Astronauta Anônimo',
        userAvatar: user.photoURL || '',
        text: newFeedbackText,
        location: 'Passo Fundo, RS',
        rating: 5,
        foodPhoto: selectedItem?.image || undefined
      });
      
      setNewFeedbackText('');
      setSelectedItemId('');
      setIsFormOpen(false);
      
      // Reload feedbacks
      const dbFeedbacks = await getFeedbacks();
      setFeedbacks([...dbFeedbacks, ...MOCK_FEEDBACKS]);
    } catch (error) {
      console.error("Error adding feedback", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="comic-panel p-8 rounded-2xl bg-zinc-100 mt-16 relative z-10 text-black">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-display comic-text-bold tracking-widest uppercase">O que a galera de Passo Fundo tá achando?</h2>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-yellow-400 border-2 border-black font-display font-bold px-6 py-3 rounded-xl shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] transition-all hover:-translate-y-1 flex items-center gap-2 whitespace-nowrap"
        >
          <MessageSquare size={20} />
          Deixar Avaliação
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            {user ? (
              <form onSubmit={handleSubmit} className="bg-white border-2 border-black rounded-xl p-6 shadow-[2px_2px_0px_#000]">
                <h3 className="font-display font-bold uppercase mb-4 text-xl">Mande sua mensagem pras estrelas!</h3>
                {orderedItems.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">Qual lanche você devorou?</label>
                    <div className="relative">
                      <select 
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        className="w-full border-2 border-black rounded-lg p-3 font-bold outline-none focus:ring-4 focus:ring-yellow-400/50 appearance-none bg-zinc-50 pr-10"
                      >
                        <option value="">(Opcional) Escolha um item do seu histórico...</option>
                        {orderedItems.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.emoji} {item.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-zinc-500">
                        ▼
                      </div>
                    </div>
                  </div>
                )}
                <textarea 
                  value={newFeedbackText}
                  onChange={(e) => setNewFeedbackText(e.target.value)}
                  placeholder="Conte pra gente como foi sua experiência..."
                  className="w-full border-2 border-black rounded-lg p-3 mb-4 min-h-[100px] font-bold outline-none focus:ring-4 focus:ring-yellow-400/50 resize-y"
                  required
                />
                <div className="flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 font-bold hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting || !newFeedbackText.trim()}
                    className="bg-zinc-900 text-yellow-400 border-2 border-black px-6 py-2 rounded-lg font-display uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] transition-all hover:-translate-y-1 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[2px_2px_0px_#000] text-center">
                <p className="font-bold text-lg mb-2">Ops! Você precisa estar logado.</p>
                <p className="text-zinc-600 font-bold">Faça login ali em cima para deixar sua avaliação intergaláctica.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {feedbacks.map((fb, idx) => (
          <motion.div 
            key={fb.id || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_#000] flex flex-col h-full relative"
          >
            <div className="absolute -top-3 -right-3 text-4xl opacity-20">"</div>
            {fb.foodPhoto && (
              <div className="w-full h-32 mb-4 border-2 border-black rounded-lg overflow-hidden shadow-[2px_2px_0px_#000]">
                <img src={fb.foodPhoto} alt="Foto do lanche" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex text-yellow-400 mb-3">
              {[...Array(fb.rating)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
            <p className="text-zinc-800 font-bold mb-4 flex-grow italic text-sm">
              "{fb.text}"
            </p>
            <div className="flex items-center gap-3 pt-4 border-t-2 border-dashed border-zinc-200">
              {fb.userAvatar ? (
                <img src={fb.userAvatar} alt={fb.userName} className="w-10 h-10 rounded-full border-2 border-black" />
              ) : (
                <div className="w-10 h-10 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center font-bold text-xl">
                  {fb.userName.charAt(0)}
                </div>
              )}
              <div>
                <h4 className="font-bold font-display text-sm leading-tight uppercase">{fb.userName}</h4>
                <p className="text-xs text-zinc-500 font-bold">{fb.location}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
