import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import DeliveryInfoModal from './DeliveryInfoModal';

export default function StorySection() {
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

  return (
    <div className="w-full bg-[#FCF9F5] py-16 border-y border-stone-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1">
          <h2 className="text-3xl md:text-5xl font-black text-stone-900 mb-6 uppercase tracking-tighter">
            A HISTÓRIA DA <span className="text-[#4E2A84]">NICKEL LANCHES</span>
          </h2>
          <p className="text-stone-600 font-medium leading-relaxed md:text-lg mb-6">
            Tudo começou com uma paixão gigante por lanches de verdade. Na Nickel Lanches, nós não fazemos apenas comida, nós construímos momentos. Acreditamos que um xis bem feito e um cachorro-quente no capricho podem transformar o seu dia.
          </p>
          <p className="text-stone-600 font-medium leading-relaxed md:text-lg mb-8">
            Nossa missão é entregar sabor épico direto na sua casa, com uma qualidade que você sente em cada mordida.
          </p>
          
          <button 
            onClick={() => setIsDeliveryModalOpen(true)}
            className="bg-[#4E2A84] text-white px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-purple-900 transition-all flex items-center gap-3 shadow-lg"
          >
            Conheça Nosso Delivery <ArrowRight size={20} />
          </button>
        </div>
        <div className="flex-1 w-full relative">
          <div className="absolute inset-0 bg-[#F28B20] rounded-[40px] rotate-3 opacity-20"></div>
          <img 
            src="/historia.jpg" 
            alt="Nossa história" 
            className="w-full h-[400px] object-cover rounded-[40px] shadow-2xl relative z-10"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {isDeliveryModalOpen && <DeliveryInfoModal onClose={() => setIsDeliveryModalOpen(false)} />}
    </div>
  );
}
