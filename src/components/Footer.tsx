import React from 'react';
import NickelText from './NickelText';
import { MapPin, Phone, MessageCircle, Mail, Clock } from 'lucide-react';

interface FooterProps {
  onOpenModal: (modalId: 'privacy' | 'contact' | 'terms' | 'cookies') => void;
}

export default function Footer({ onOpenModal }: FooterProps) {
  return (
    <footer className="bg-stone-900 text-white pt-16 pb-32 md:pb-32 px-4 md:px-8 border-t-[8px] border-[#F28B20]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        {/* Brand & Location */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="Nickel Lanches" className="h-28 md:h-32 w-auto object-contain drop-shadow-md" />
            <div className="flex flex-col justify-center -ml-2">
              <h1 className="text-4xl md:text-5xl tracking-tighter leading-none"><NickelText /></h1>
              <h2 className="text-xl md:text-2xl tracking-tighter leading-none" style={{ fontFamily: '"Russo One", sans-serif', fontStyle: 'italic', color: '#FFFFFF', WebkitTextStroke: '1px black', textShadow: '3px 3px 0px #000' }}>LANCHES</h2>
            </div>
          </div>
          <p className="text-stone-400 font-medium mb-6 text-sm leading-relaxed">
            Entregando a melhor experiência em lanches artesanais. 
            Ingredientes selecionados e muito sabor em cada mordida.
          </p>
          <div className="text-stone-500 text-xs font-bold uppercase tracking-wider space-y-1">
            <p>CNPJ: 63.024.150/0001-55</p>
            <p><NickelText /> LANCHES LTDA</p>
          </div>
        </div>

        {/* Institucional */}
        <div>
          <h3 className="text-lg font-black uppercase tracking-wider mb-6 text-stone-100">A Empresa</h3>
          <ul className="space-y-4">
            <li>
              <button onClick={() => document.getElementById('quem-somos')?.scrollIntoView({ behavior: 'smooth' })} className="text-stone-400 hover:text-[#F28B20] transition-colors text-sm font-medium flex items-center gap-2">
                Nossa História
              </button>
            </li>


          </ul>
        </div>

        {/* Atendimento / Legal */}
        <div>
          <h3 className="text-lg font-black uppercase tracking-wider mb-6 text-stone-100">Atendimento & Legal</h3>
          <ul className="space-y-4">
            <li>
              <button onClick={() => onOpenModal('privacy')} className="text-stone-400 hover:text-white transition-colors text-sm font-medium">Política de Privacidade</button>
            </li>
            <li>
              <button onClick={() => onOpenModal('cookies')} className="text-stone-400 hover:text-white transition-colors text-sm font-medium">Política de Cookies</button>
            </li>
            <li>
              <button onClick={() => onOpenModal('terms')} className="text-stone-400 hover:text-white transition-colors text-sm font-medium">Termos de Uso</button>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-black uppercase tracking-wider mb-6 text-stone-100">Fale Conosco</h3>
          <ul className="space-y-4">
            <li>
              <a href="https://wa.me/5554999598388" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-stone-400 hover:text-[#25D366] transition-colors group">
                <MessageCircle size={18} className="shrink-0" />
                <span className="font-medium text-sm">WhatsApp: (54) 99959-8388</span>
              </a>
            </li>
            
            <li className="flex items-start gap-3 text-stone-400">
              <MapPin size={18} className="shrink-0 mt-0.5" />
              <span className="font-medium text-sm leading-relaxed">R. Uruguai, 919 - Petrópolis<br/>Passo Fundo - RS, 99050-030</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Footer Bottom Centered */}
      <div className="max-w-7xl mx-auto border-t border-stone-800 pt-8 flex flex-col items-center justify-center text-center text-stone-500 text-xs font-medium space-y-2">
        <p>&copy; {new Date().getFullYear()} <NickelText /> Lanches. Todos os direitos reservados.</p>
        <p>Feito com ❤️ para quem ama lanche de verdade.</p>
      </div>
    </footer>
  );
}
