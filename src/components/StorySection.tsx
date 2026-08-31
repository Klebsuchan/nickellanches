import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import NickelText from './NickelText';
import DeliveryInfoModal from './DeliveryInfoModal';

export default function StorySection() {
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

  return (
    <div className="w-full bg-[#FCF9F5] py-16 border-y border-stone-100 mt-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8 xl:px-0">
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-black text-[#4E2A84] mb-6 uppercase tracking-tighter drop-shadow-sm">Muito Prazer, <NickelText />! 🍔✨</h2>
          
          <div className="bg-gradient-to-br from-white to-[#FCF9F5] p-6 md:p-8 rounded-[32px] border border-[#F2E8D5] shadow-sm mb-10">
            <p className="text-stone-700 font-medium leading-relaxed md:text-xl mb-4">
              Sabe aquele lanche que abraça a gente por dentro? É exatamente isso que fazemos por aqui! Mais do que matar a sua fome, nossa missão é entregar uma explosão de sabor e alegria em cada mordida.
            </p>
            <p className="text-stone-600 font-medium leading-relaxed md:text-lg mb-6">
              Nossa receita? Ingredientes fresquinhos, cuidado artesanal e muuuito carinho na chapa. Preparamos tudo como se fosse para a nossa própria família — e você, claro, já faz parte dela!
            </p>
            <button 
              onClick={() => setIsDeliveryModalOpen(true)}
              className="bg-[#4E2A84] text-white px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-purple-900 transition-all flex items-center gap-3 shadow-lg w-full sm:w-auto justify-center"
            >
              Conheça Nosso Delivery <ArrowRight size={20} />
            </button>
          </div>

          {/* Videos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-[32px] overflow-hidden shadow-lg border-4 border-[#F28B20] relative aspect-[3/4] md:aspect-square bg-stone-900 group">
              <video 
                autoPlay loop muted playsInline 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              >
                <source src="/videos/producaolanches.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <span className="bg-[#F28B20] text-white text-[10px] font-bold px-3 py-1 rounded-full w-max mb-2 uppercase tracking-widest">Bastidores</span>
                <h3 className="text-white font-black text-2xl drop-shadow-md leading-none">Nossa Produção 🧑‍🍳</h3>
              </div>
            </div>
            
            <div className="rounded-[32px] overflow-hidden shadow-lg border-4 border-[#4E2A84] relative aspect-[3/4] md:aspect-square bg-stone-900 group">
              <video 
                autoPlay loop muted playsInline 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              >
                <source src="/videos/videoatrativo.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <span className="bg-[#4E2A84] text-white text-[10px] font-bold px-3 py-1 rounded-full w-max mb-2 uppercase tracking-widest">Irresistível</span>
                <h3 className="text-white font-black text-2xl drop-shadow-md leading-none">Puro Sabor 🤤</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isDeliveryModalOpen && <DeliveryInfoModal onClose={() => setIsDeliveryModalOpen(false)} />}
    </div>
  );
}
