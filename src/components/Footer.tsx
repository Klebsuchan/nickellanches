import React from 'react';
import NickelText from './NickelText';
import { MapPin, Phone, MessageCircle, Mail, Clock, Share2, CreditCard, QrCode, Banknote, ShieldCheck, Landmark, Lock } from 'lucide-react';

interface FooterProps {
  onOpenModal: (modalId: 'privacy' | 'contact' | 'terms' | 'cookies' | 'payments') => void;
  onOpenAdmin?: () => void;
}

export default function Footer({ onOpenModal, onOpenAdmin }: FooterProps) {
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
              <p className="text-[11px] font-black uppercase text-[#F28B20] mt-1 tracking-tight">
                “MUITO AMOR ENVOLVIDO, E O PRAZER DE COMER BEM É GARANTIDO PRA VOCÊ!”
              </p>
            </div>
          </div>
          <p className="text-stone-400 font-medium mb-6 text-sm leading-relaxed">
            O autêntico xis gourmet e cachorro-quente de Passo Fundo - RS. 
            Ingredientes nobres, receitas exclusivas e muito sabor em cada mordida.
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
            <li>
              <button onClick={() => onOpenModal('payments')} className="text-stone-400 hover:text-[#F28B20] transition-colors text-sm font-medium flex items-center gap-2">
                Formas de Pagamento
              </button>
            </li>
          </ul>
        </div>

        {/* Atendimento / Legal */}
        <div>
          <h3 className="text-lg font-black uppercase tracking-wider mb-6 text-stone-100">Atendimento & Legal</h3>
          <ul className="space-y-4">
            <li>
              <button onClick={() => onOpenModal('payments')} className="text-stone-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5">
                <CreditCard size={15} className="text-[#F28B20]" />
                <span>Como Pagar seu Pedido</span>
              </button>
            </li>
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
              <a href="https://wa.me/5554999598389" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-stone-400 hover:text-[#25D366] transition-colors group">
                <MessageCircle size={18} className="shrink-0" />
                <span className="font-medium text-sm">WhatsApp: (54) 99959-8389</span>
              </a>
            </li>
            
            <li className="flex items-start gap-3 text-stone-400">
              <MapPin size={18} className="shrink-0 mt-0.5" />
              <span className="font-medium text-sm leading-relaxed">R. Uruguai, 919 - Petrópolis<br/>Passo Fundo - RS, 99050-030</span>
            </li>

            <li className="pt-2">
              <button 
                type="button"
                onClick={() => {
                  const destaques = ['magma', 'cemuche', 'bomba', 'olympus'];
                  const randomDestaque = destaques[Math.floor(Math.random() * destaques.length)];
                  const url = `${window.location.origin}/?destaque=${randomDestaque}`;
                  const text = `Dá uma olhada no cardápio da Nickel Lanches em Passo Fundo! 🍔🔥\n${url}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Share2 size={16} /> Compartilhar no WhatsApp
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* SEÇÃO DEDICADA: FORMAS DE PAGAMENTO ACEITAS */}
      <div className="max-w-7xl mx-auto border-t border-stone-800 pt-8 pb-8">
        <div className="bg-stone-800/60 rounded-3xl p-6 border border-stone-700/60 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left space-y-1">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <ShieldCheck className="text-[#F28B20]" size={18} />
              <h4 className="text-sm md:text-base font-black uppercase tracking-wider text-white">
                Formas de Pagamento Aceitas
              </h4>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                100% Seguro
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Pague na entrega com o motoboy ou antecipado online com total segurança e comodidade.
            </p>
          </div>

          {/* Badges de Métodos */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {/* PIX */}
            <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-700 px-3 py-2 rounded-xl">
              <QrCode size={16} className="text-emerald-400" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block leading-none">PIX</span>
                <span className="text-[9px] text-stone-400">Na hora ou entrega</span>
              </div>
            </div>

            {/* Cartões de Crédito */}
            <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-700 px-3 py-2 rounded-xl">
              <CreditCard size={16} className="text-purple-400" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block leading-none">Cartão de Crédito</span>
                <span className="text-[9px] text-stone-400">Visa, Master, Elo, Hiper</span>
              </div>
            </div>

            {/* Cartões de Débito */}
            <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-700 px-3 py-2 rounded-xl">
              <CreditCard size={16} className="text-blue-400" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block leading-none">Cartão de Débito</span>
                <span className="text-[9px] text-stone-400">Maquininha na entrega</span>
              </div>
            </div>

            {/* Dinheiro */}
            <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-700 px-3 py-2 rounded-xl">
              <Banknote size={16} className="text-amber-400" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block leading-none">Dinheiro em Espécie</span>
                <span className="text-[9px] text-stone-400">Levamos troco</span>
              </div>
            </div>

            {/* Botão de Ver Detalhes */}
            <button
              type="button"
              onClick={() => onOpenModal('payments')}
              className="bg-[#F28B20] hover:bg-[#d97a1c] text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              Ver Detalhes
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer Bottom Centered com Botão do Painel ADM */}
      <div className="max-w-7xl mx-auto border-t border-stone-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-stone-500 text-xs font-medium gap-4">
        <p>&copy; {new Date().getFullYear()} <NickelText /> Lanches. Todos os direitos reservados.</p>
        
        {onOpenAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 text-stone-300 hover:text-yellow-400 transition-colors font-bold uppercase tracking-wider text-[11px] cursor-pointer bg-stone-800 hover:bg-stone-700 px-3.5 py-2 rounded-xl border border-stone-700 shadow-sm"
          >
            <Lock size={13} className="text-yellow-400" /> Área Restrita / Painel ADM
          </button>
        )}
      </div>
    </footer>
  );
}
