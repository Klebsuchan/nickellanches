import React from 'react';
import { Clock, MapPin, Truck, ShieldCheck } from 'lucide-react';

export default function OpeningHours() {
  return (
    <div className="w-full bg-white py-16 border-t border-stone-100">
      <div className="max-w-5xl mx-auto px-4 md:px-8 text-center">
        <div className="w-16 h-16 bg-[#F4EBF6] text-[#4E2A84] rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock size={32} />
        </div>
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-stone-900 mb-3">
          Horários de Atendimento & Delivery
        </h2>
        <p className="text-stone-600 font-medium max-w-2xl mx-auto mb-8 text-base md:text-lg">
          O melhor <strong>xis gourmet artesanal, cachorro-quente prensado e lanches de Passo Fundo - RS</strong> entregues quentinhos na sua porta.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
          <div className="bg-[#FCF9F5] p-6 rounded-2xl border border-stone-200 flex justify-between items-center hover:border-[#F28B20] transition-colors">
            <span className="font-bold text-stone-600 uppercase tracking-wider text-sm md:text-base">Terça a Domingo</span>
            <span className="font-black text-[#F28B20] text-xl md:text-2xl">18:30 - 22:30</span>
          </div>
          <div className="bg-[#FCF9F5] p-6 rounded-2xl border border-stone-200 flex justify-between items-center hover:border-[#F28B20] transition-colors">
            <span className="font-bold text-stone-600 uppercase tracking-wider text-sm md:text-base">Segunda-feira</span>
            <span className="font-black text-stone-400 text-xl md:text-2xl">Fechado</span>
          </div>
        </div>

        {/* Local SEO Delivery Areas & Location Highlight */}
        <div className="bg-[#FCF9F5] rounded-3xl p-6 md:p-8 border border-stone-200 text-left max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-white rounded-xl text-[#F28B20] border border-stone-200 shrink-0">
                <Truck size={22} />
              </div>
              <div>
                <h4 className="font-black uppercase text-sm text-stone-900 mb-1">Delivery Rápido</h4>
                <p className="text-xs text-stone-500 font-medium">Entregamos em Petrópolis, Centro, Boqueirão, Vera Cruz, São Cristóvão e toda Passo Fundo.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-3 bg-white rounded-xl text-[#4E2A84] border border-stone-200 shrink-0">
                <MapPin size={22} />
              </div>
              <div>
                <h4 className="font-black uppercase text-sm text-stone-900 mb-1">Localização</h4>
                <p className="text-xs text-stone-500 font-medium">R. Uruguai, 919 - Bairro Petrópolis, Passo Fundo - RS.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-3 bg-white rounded-xl text-green-600 border border-stone-200 shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 className="font-black uppercase text-sm text-stone-900 mb-1">Pedido Fácil</h4>
                <p className="text-xs text-stone-500 font-medium">Faça seu pedido online direto pelo site ou pelo WhatsApp com atendimento humanizado.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-stone-400 font-medium">* Nossos horários podem sofrer pequenas alterações em feriados locais de Passo Fundo.</p>
      </div>
    </div>
  );
}
