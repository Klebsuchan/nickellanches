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

          <div className="h-44 md:h-52 relative bg-gradient-to-r from-[#381B66] via-[#4E2A84] to-[#5C329C] flex items-center justify-center overflow-hidden">
            <div className="relative z-10 text-center px-4">
              <span className="inline-block bg-[#F28B20] text-white text-[11px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full mb-3 shadow-sm">
                Entrega Rápida & Quentinha
              </span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-2">Nosso Delivery</h2>
              <p className="text-amber-200 font-medium tracking-wide text-sm md:text-base">Preparado na hora e levado até você com todo cuidado</p>
            </div>
          </div>

          <div className="p-6 md:p-10">
            <div className="bg-[#FCF9F5] rounded-3xl p-6 md:p-8 border border-stone-200 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h3 className="text-2xl md:text-3xl font-black uppercase text-stone-900 tracking-tight">
                  Cuidado em cada detalhe ✨
                </h3>
                <div className="inline-flex self-start md:self-auto bg-amber-100 text-amber-900 px-4 py-1.5 rounded-full font-bold text-xs md:text-sm items-center gap-2 border border-amber-200">
                  <span>❤️</span> Feito com muito carinho
                </div>
              </div>
              <p className="text-stone-600 font-medium leading-relaxed text-base md:text-lg mb-6">
                A nossa cozinha é o nosso templo. Cada pedido que sai daqui é montado pensando em proporcionar a melhor experiência no conforto da sua casa. Nós sabemos que a fome não espera, por isso otimizamos cada etapa e garantimos itens frescos preparados na hora.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-stone-200 flex items-center gap-3 shadow-sm">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="font-black text-xs uppercase text-stone-900">Chapa Quente</p>
                    <p className="text-stone-500 text-xs">Ponto perfeito e suculento</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-stone-200 flex items-center gap-3 shadow-sm">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="font-black text-xs uppercase text-stone-900">Agilidade</p>
                    <p className="text-stone-500 text-xs">Preparo rápido e sem demora</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-stone-200 flex items-center gap-3 shadow-sm">
                  <span className="text-2xl">🛵</span>
                  <div>
                    <p className="font-black text-xs uppercase text-stone-900">Chega Quentinho</p>
                    <p className="text-stone-500 text-xs">Embalagens térmicas seladas</p>
                  </div>
                </div>
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
