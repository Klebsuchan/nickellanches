import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Clock, Phone } from 'lucide-react';

export default function LocationSection() {
  return (
    <div className="mb-12 relative z-10">
      <h2 className="text-3xl font-display comic-text-bold tracking-widest uppercase text-black mb-6">Nossa Base de Lançamento</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        <div className="comic-panel p-6 rounded-2xl bg-zinc-100 flex flex-col justify-center space-y-6">
          
          <div className="flex items-start gap-4">
            <div className="bg-blue-400 p-3 rounded-full border-2 border-black shadow-[2px_2px_0px_#000] flex-shrink-0 mt-1">
              <MapPin size={24} className="text-black" />
            </div>
            <div>
              <h3 className="font-display font-bold uppercase text-xl text-black mb-1">Endereço</h3>
              <p className="font-bold text-zinc-700">R. Uruguai, 919 - Petrópolis</p>
              <p className="font-bold text-zinc-500 text-sm">Passo Fundo - RS, 99050-030</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-yellow-400 p-3 rounded-full border-2 border-black shadow-[2px_2px_0px_#000] flex-shrink-0 mt-1">
              <Clock size={24} className="text-black" />
            </div>
            <div>
              <h3 className="font-display font-bold uppercase text-xl text-black mb-1">Horário de Voo</h3>
              <p className="font-bold text-zinc-700">Terça a Domingo: 18:30 às 22:30</p>
              <p className="font-bold text-red-500">Segunda-feira: Fechado</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-green-400 p-3 rounded-full border-2 border-black shadow-[2px_2px_0px_#000] flex-shrink-0 mt-1">
              <Phone size={24} className="text-black" />
            </div>
            <div>
              <h3 className="font-display font-bold uppercase text-xl text-black mb-1">Contato</h3>
              <p className="font-bold text-zinc-700">(54) 99959-8389</p>
              <p className="font-bold text-zinc-500 text-sm">Também no WhatsApp!</p>
            </div>
          </div>
          
        </div>

        <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_#000] relative min-h-[300px]">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3511.082538183187!2d-52.40263882455823!3d-28.26522517586523!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x951c5b8b9db836f3%3A0x6b1b5e5b306e9b46!2sR.%20Uruguai%2C%20919%20-%20Petr%C3%B3polis%2C%20Passo%20Fundo%20-%20RS%2C%2099050-030!5e0!3m2!1spt-BR!2sbr!4v1717621458925!5m2!1spt-BR!2sbr" 
            width="100%" 
            height="100%" 
            style={{ border: 0, minHeight: '300px' }} 
            allowFullScreen={true} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0"
            title="Mapa de Localização"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
