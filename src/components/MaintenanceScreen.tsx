import React from 'react';
import { motion } from 'motion/react';
import { Wrench, Clock, Hammer, ShieldAlert, Sparkles, MessageCircle, Instagram } from 'lucide-react';

interface MaintenanceScreenProps {
  onAdminAccess?: () => void;
}

export default function MaintenanceScreen({ onAdminAccess }: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Decorativo com iluminação âmbar e efeito sutil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 sm:w-[540px] sm:h-[540px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Faixa de advertência sutil de fundo estilo fita de obra */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, #f59e0b 0, #f59e0b 20px, transparent 20px, transparent 40px)`
          }}
        />
      </div>

      {/* Topo: Logo & Badge */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 pt-6 sm:pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-1.5 shadow-lg shadow-amber-500/10">
            <img 
              src="/cochirrinho16bit.png" 
              alt="Mascote Nickel Lanches" 
              className="w-full h-full object-contain [image-rendering:pixelated]" 
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black italic tracking-wider text-amber-400 font-sans uppercase">
              NICKEL LANCHES
            </h1>
            <p className="text-[11px] sm:text-xs text-stone-400 font-medium">
              Passo Fundo • RS
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
          <span>Atualização em Andamento</span>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="relative z-10 w-full max-w-xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center text-center">
        {/* Mascote Pixel Art Animado com Chave de Fenda / Construção */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="relative mb-6 sm:mb-8"
        >
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
            {/* Círculo com efeito de radar */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/30 animate-[spin_24s_linear_infinite]" />
            <div className="absolute inset-2 rounded-full bg-stone-900/80 border border-stone-800 shadow-2xl flex items-center justify-center overflow-hidden">
              <motion.img
                src="/cochirrinho16bit.png"
                alt="Cochirrinho Nickel"
                className="w-28 h-28 sm:w-32 sm:h-32 object-contain [image-rendering:pixelated] drop-shadow-[0_8px_16px_rgba(245,158,11,0.25)]"
                animate={{
                  y: [0, -6, 0],
                  rotate: [0, 1.5, -1.5, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.8,
                  ease: "easeInOut"
                }}
              />
            </div>

            {/* Ícones flutuantes de ferramentas */}
            <motion.div 
              className="absolute -top-1 -right-1 w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg font-bold"
              animate={{ rotate: [0, 15, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
            >
              <Wrench className="w-5 h-5" />
            </motion.div>

            <motion.div 
              className="absolute -bottom-1 -left-1 w-9 h-9 rounded-xl bg-stone-800 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg"
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 1.9, delay: 0.4 }}
            >
              <Hammer className="w-4 h-4" />
            </motion.div>
          </div>
        </motion.div>

        {/* Faixa Alerta */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Site Temporariamente Fora do Ar</span>
        </div>

        {/* Título Principal */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
          Estamos em <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">Manutenção</span>
        </h2>

        {/* Descrição acolhedora */}
        <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-md mb-6">
          Estamos preparando novidades, melhorias no sistema e deixando tudo no ponto certo para você fazer seus pedidos com a melhor experiência!
        </p>

        {/* Card Informativo */}
        <div className="w-full bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5 mb-8 shadow-xl text-left backdrop-blur-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
                Volveremos em breve
                <Sparkles className="w-3.5 h-3.5 text-amber-400 inline" />
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Nossa equipe está trabalhando nos bastidores. Se precisar falar conosco ou fazer um pedido urgente, entre em contato direto pelo WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação / Contato */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <a
            href="https://wa.me/5554999999999?text=Ol%C3%A1!%20Gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20pedidos%20da%20Nickel%20Lanches"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm shadow-lg shadow-green-600/25 transition active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Falar no WhatsApp</span>
          </a>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 font-semibold text-sm transition active:scale-95"
          >
            <Instagram className="w-4 h-4 text-pink-400" />
            <span>Acompanhar Instagram</span>
          </a>
        </div>
      </main>

      {/* Rodapé discreto */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 py-6 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
        <p>© {new Date().getFullYear()} Nickel Lanches. Todos os direitos reservados.</p>
        
        {/* Acesso discreto ao painel administrativo se o dono precisar gerenciar */}
        <a 
          href="/painel-admin" 
          className="text-stone-600 hover:text-amber-400 transition-colors text-[11px] underline underline-offset-4"
        >
          Acesso Administrativo
        </a>
      </footer>
    </div>
  );
}
