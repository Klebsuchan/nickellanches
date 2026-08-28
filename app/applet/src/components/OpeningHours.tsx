import React from 'react';
import { Clock } from 'lucide-react';

export default function OpeningHours() {
  return (
    <div className="w-full bg-white py-16 border-t border-stone-100">
      <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
        <div className="w-16 h-16 bg-[#F4EBF6] text-[#4E2A84] rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock size={32} />
        </div>
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-stone-900 mb-8">Horários de Atendimento</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="bg-[#FCF9F5] p-6 rounded-2xl border border-stone-200 flex justify-between items-center hover:border-[#F28B20] transition-colors">
            <span className="font-bold text-stone-600 uppercase tracking-wider text-sm md:text-base">Segunda a Sexta</span>
            <span className="font-black text-[#F28B20] text-xl md:text-2xl">18:00 - 23:30</span>
          </div>
          <div className="bg-[#FCF9F5] p-6 rounded-2xl border border-stone-200 flex justify-between items-center hover:border-[#F28B20] transition-colors">
            <span className="font-bold text-stone-600 uppercase tracking-wider text-sm md:text-base">Sábado e Domingo</span>
            <span className="font-black text-[#F28B20] text-xl md:text-2xl">19:00 - 00:30</span>
          </div>
        </div>
        <p className="mt-8 text-sm text-stone-500 font-medium">* Nossos horários podem sofrer pequenas alterações em feriados locais.</p>
      </div>
    </div>
  );
}
