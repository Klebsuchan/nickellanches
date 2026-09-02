import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, ShieldCheck, Leaf, Package } from 'lucide-react';

export default function DeliveryInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto py-12" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-[32px] w-full max-w-4xl overflow-hidden relative shadow-2xl my-auto"
        >
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white z-20 transition-colors">
            <X size={24} />
          </button>

          <div className="h-48 md:h-64 relative bg-[#4E2A84] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center"></div>
            <div className="relative z-10 text-center">
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-2">Nosso Delivery</h2>
              <p className="text-[#F28B20] font-black tracking-widest uppercase text-sm md:text-base">Feito com carinho para você</p>
            </div>
          </div>

          <div className="p-6 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div>
                <h3 className="text-2xl font-black uppercase text-stone-900 mb-4 tracking-tight">Cuidado em cada detalhe</h3>
                <p className="text-stone-600 font-medium leading-relaxed">
                  A nossa cozinha é o nosso templo. Cada pedido que sai daqui é montado pensando em proporcionar a melhor experiência no conforto da sua casa. Nós sabemos que a fome não espera, por isso otimizamos cada etapa e garantimos itens frescos.
                </p>
                <div className="mt-6 inline-flex bg-stone-100 text-stone-700 px-4 py-2 rounded-full font-bold text-sm items-center gap-2">
                  <span className="text-xl">❤️</span> Fazemos os lanches com muito carinho
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1572656306390-40a9fc3899f7?q=80&w=400&auto=format&fit=crop" className="w-full h-32 md:h-48 object-cover rounded-2xl" alt="Ingredientes frescos" referrerPolicy="no-referrer" />
                <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400&auto=format&fit=crop" className="w-full h-32 md:h-48 object-cover rounded-2xl" alt="Chapa de lanches" referrerPolicy="no-referrer" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#FCF9F5] p-5 rounded-2xl border border-stone-200">
                <Flame className="text-[#F28B20] mb-3" size={32} />
                <h4 className="font-black uppercase text-stone-900 text-sm mb-2">Chapa Quente</h4>
                <p className="text-stone-500 text-xs font-medium leading-relaxed">Carne selada no ponto certo, mantendo a suculência e o sabor.</p>
              </div>
              <div className="bg-[#FCF9F5] p-5 rounded-2xl border border-stone-200">
                <ShieldCheck className="text-green-600 mb-3" size={32} />
                <h4 className="font-black uppercase text-stone-900 text-sm mb-2">Higiene Ouro</h4>
                <p className="text-stone-500 text-xs font-medium leading-relaxed">Limpeza rigorosa em todas as etapas do nosso preparo diário.</p>
              </div>
              <div className="bg-[#FCF9F5] p-5 rounded-2xl border border-stone-200">
                <Leaf className="text-green-500 mb-3" size={32} />
                <h4 className="font-black uppercase text-stone-900 text-sm mb-2">Frescor</h4>
                <p className="text-stone-500 text-xs font-medium leading-relaxed">Pães e vegetais selecionados e entregues fresquinhos todo dia.</p>
              </div>
              <div className="bg-[#FCF9F5] p-5 rounded-2xl border border-stone-200">
                <Package className="text-[#4E2A84] mb-3" size={32} />
                <h4 className="font-black uppercase text-stone-900 text-sm mb-2">Embalagem</h4>
                <p className="text-stone-500 text-xs font-medium leading-relaxed">Caixas térmicas para o lanche chegar quentinho e crocante.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
