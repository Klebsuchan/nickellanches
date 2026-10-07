import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Utensils, Bike, Gamepad2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { playSound } from '../lib/audio';

interface IntroPresentationProps {
  onClose: () => void;
  onGoToGame?: () => void;
}

export default function IntroPresentation({ onClose, onGoToGame }: IntroPresentationProps) {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const hasTriggeredClose = useRef(false);
  const mountTimeRef = useRef(Date.now());

  // Apresentação breve e nítida (~2.4 segundos para dar oi e dividir)
  const DURATION_MS = 2400;
  const SPLIT_ANIMATION_MS = 700;

  // Som amigável de boas-vindas do cãozinho ao surgir
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        playSound('bell');
      } catch {}
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Função central de fechamento com divisão em 2 e fade out
  const triggerSplitAndClose = (destination?: 'menu' | 'game') => {
    if (hasTriggeredClose.current) return;
    hasTriggeredClose.current = true;
    setIsSplitting(true);

    try {
      playSound('whoosh');
      if (destination === 'game') {
        setTimeout(() => {
          try { playSound('laser'); } catch {}
        }, 150);
      }
    } catch {}

    // Aguarda a animação cinematográfica das duas metades se dissiparem em fade out
    setTimeout(() => {
      onClose();
      if (destination === 'game' && onGoToGame) {
        onGoToGame();
      }
    }, SPLIT_ANIMATION_MS);
  };

  // Temporizador para auto-avanço breve
  useEffect(() => {
    if (isPaused || isSplitting) return;

    const intervalTime = 30;
    const step = 100 / (DURATION_MS / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          triggerSplitAndClose('menu');
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPaused, isSplitting]);

  // Teclado: Escape, Enter ou Barra de Espaço ativam a divisão
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerSplitAndClose('menu');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[99999] w-screen h-screen overflow-hidden select-none bg-black pointer-events-auto cursor-pointer"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={(e) => {
        // Evita fechamento acidental no primeiro instante
        if (Date.now() - mountTimeRef.current < 600) return;
        if ((e.target as HTMLElement).tagName !== 'BUTTON') {
          triggerSplitAndClose('menu');
        }
      }}
    >
      {/* ========================================================
          METADE SUPERIOR (0% até 50% da altura da tela)
          Dissipa e sobe para o topo: translateY(-105%) em Fade Out
          ======================================================== */}
      <motion.div
        initial={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        animate={
          isSplitting
            ? {
                y: '-105%',
                opacity: 0,
                filter: 'blur(10px)',
                transition: { duration: 0.68, ease: [0.76, 0, 0.24, 1] },
              }
            : { y: 0, opacity: 1, filter: 'blur(0px)' }
        }
        className="absolute top-0 left-0 right-0 h-1/2 w-full overflow-hidden bg-gradient-to-b from-[#10061e] via-[#1a0c33] to-[#251247] border-b border-amber-400/40 z-20 flex flex-col justify-between"
      >
        {/* Luzes e partículas de fundo da metade superior */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#4E2A84] rounded-full filter blur-[100px] opacity-70 animate-pulse" />
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#F28B20] rounded-full filter blur-[100px] opacity-50" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-32 bg-amber-500/15 rounded-full filter blur-[80px]" />
          
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        {/* Barra do Topo da Apresentação */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-3 sm:pt-5 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F28B20]/15 border border-[#F28B20]/40 text-[#F28B20] text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-[0_0_15px_rgba(242,139,32,0.2)]">
              <Sparkles size={13} className="text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Passo Fundo • RS</span>
              <span className="w-1 h-1 rounded-full bg-[#F28B20]" />
              <span>Desde 2018</span>
            </div>
          </motion.div>

          {/* Botão de Pular Apresentação */}
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            onClick={(e) => {
              e.stopPropagation();
              triggerSplitAndClose('menu');
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-stone-200 hover:text-white text-xs font-bold transition-all cursor-pointer border border-white/15 backdrop-blur-md"
            title="Pular apresentação e ir direto ao site"
          >
            <span>Pular</span>
            <X size={14} />
          </motion.button>
        </div>

        {/* Centro da Metade Superior: PERSONAGEM DANDO OI BEM RÁPIDINHO */}
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 pb-2 sm:pb-4 flex flex-col items-center justify-end text-center">
          <div className="relative inline-flex flex-col items-center justify-center">
            {/* Balão de fala de quadrinhos dando "Oi!" */}
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 240, delay: 0.15 }}
              className="relative mb-2 px-4 py-1.5 rounded-2xl bg-white text-stone-900 shadow-[0_10px_30px_rgba(0,0,0,0.6)] border-2 border-amber-400 flex items-center gap-2 z-30"
            >
              <span className="text-sm sm:text-base font-black text-[#4E2A84] tracking-wide">Oi!</span>
              <span className="text-xs sm:text-sm font-black text-stone-800">Bem-vindo à Nickel Lanches!</span>
              <motion.span
                animate={{ rotate: [0, 24, -14, 24, 0] }}
                transition={{ repeat: Infinity, duration: 0.55 }}
                className="text-base sm:text-xl inline-block origin-bottom-right"
              >
                👋
              </motion.span>
              {/* Rabicho do balão apontando para o cãozinho */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-amber-400 rotate-45" />
            </motion.div>

            {/* O Personagem Cãozinho animado com patinha acenando */}
            <motion.div
              initial={{ scale: 0.7, y: 25, opacity: 0 }}
              animate={{
                scale: 1,
                y: [0, -8, 0],
                opacity: 1,
              }}
              transition={{
                scale: { type: 'spring', damping: 12, stiffness: 200, delay: 0.05 },
                y: { repeat: Infinity, duration: 0.8, ease: 'easeInOut' },
                opacity: { duration: 0.2 },
              }}
              className="relative"
            >
              {/* Brilho pulsante atrás do personagem */}
              <div className="absolute inset-0 bg-amber-400/40 rounded-full filter blur-xl scale-110 animate-pulse pointer-events-none" />
              
              <img
                src="/cochirrinho16bit.png"
                alt="Cãozinho Nickel dando Oi"
                className="h-20 sm:h-28 md:h-32 w-auto object-contain relative z-10 drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)]"
              />

              {/* Emoji de aceno reforçando o "Oi" bem pertinho do cãozinho */}
              <motion.div
                animate={{ rotate: [0, 28, -12, 28, 0], scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 0.55 }}
                className="absolute -top-1 -right-3 text-2xl sm:text-3xl origin-bottom-left z-20 drop-shadow-md select-none"
              >
                👋
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-1"
          >
            <h1 className="font-display font-black text-xl sm:text-3xl md:text-4xl text-white tracking-wider uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              NICKEL <span className="text-[#F28B20]">LANCHES</span>
            </h1>
          </motion.div>
        </div>

        {/* Efeito de corte na linha central */}
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#F28B20] to-transparent opacity-80" />
      </motion.div>


      {/* ========================================================
          LINHA DE ENERGIA CENTRAL (Divisor horizontal no meio da tela)
          Emite brilho e se expande antes da dissipação
          ======================================================== */}
      <motion.div
        animate={
          isSplitting
            ? {
                scaleY: [1, 3, 0],
                opacity: [0.9, 1, 0],
                transition: { duration: 0.35 },
              }
            : {
                scaleY: [0.9, 1.2, 0.9],
                opacity: [0.7, 1, 0.7],
                transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
              }
        }
        className="absolute top-1/2 left-0 right-0 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-center"
      >
        <div className="w-full h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_#F28B20]" />
        <div className="absolute px-3 py-0.5 rounded-full bg-[#1A0C33] border border-amber-400 text-amber-300 text-[9px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(242,139,32,0.8)] flex items-center gap-1.5">
          <ChevronUp size={10} className="text-amber-400 animate-bounce" />
          <span>ENTRANDO NO SITE</span>
          <ChevronDown size={10} className="text-amber-400 animate-bounce" />
        </div>
      </motion.div>


      {/* ========================================================
          METADE INFERIOR (50% até 100% da altura da tela)
          Dissipa e desce para a base: translateY(105%) em Fade Out
          ======================================================== */}
      <motion.div
        initial={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        animate={
          isSplitting
            ? {
                y: '105%',
                opacity: 0,
                filter: 'blur(10px)',
                transition: { duration: 0.68, ease: [0.76, 0, 0.24, 1] },
              }
            : { y: 0, opacity: 1, filter: 'blur(0px)' }
        }
        className="absolute top-1/2 left-0 right-0 h-1/2 w-full overflow-hidden bg-gradient-to-b from-[#251247] via-[#1a0c33] to-[#0d041a] border-t border-amber-400/40 z-20 flex flex-col justify-between"
      >
        {/* Luzes de fundo da metade inferior */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-32 bg-amber-500/15 rounded-full filter blur-[80px]" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#4E2A84] rounded-full filter blur-[100px] opacity-50" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#F28B20] rounded-full filter blur-[100px] opacity-60 animate-pulse" />
          
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        {/* Efeito de borda na linha de corte inferior */}
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#F28B20] to-transparent opacity-80" />

        {/* Centro da Metade Inferior: Slogan, Destaques e Ações */}
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 pt-2 sm:pt-4 flex flex-col items-center justify-center text-center">
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="text-amber-300 font-bold text-xs sm:text-sm md:text-base tracking-wide mb-3 drop-shadow"
          >
            O Sabor Gigante & Mais Tradicional de Passo Fundo
          </motion.p>

          {/* 3 Pilares Rápidos */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-xl mb-3 sm:mb-4"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center backdrop-blur-sm shadow-md">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#F28B20]/20 text-[#F28B20] flex items-center justify-center mb-1">
                <Utensils size={14} />
              </div>
              <h4 className="text-[11px] sm:text-xs font-black text-white leading-tight">Xis Gigante</h4>
              <p className="text-[9px] text-stone-400 font-medium hidden sm:block mt-0.5">Prensado & farto</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center backdrop-blur-sm shadow-md">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center mb-1">
                <Bike size={14} />
              </div>
              <h4 className="text-[11px] sm:text-xs font-black text-white leading-tight">Delivery Ágil</h4>
              <p className="text-[9px] text-stone-400 font-medium hidden sm:block mt-0.5">Quentinho em casa</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center backdrop-blur-sm shadow-md">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center mb-1">
                <Gamepad2 size={14} />
              </div>
              <h4 className="text-[11px] sm:text-xs font-black text-white leading-tight">Minigame Cão</h4>
              <p className="text-[9px] text-stone-400 font-medium hidden sm:block mt-0.5">Jogue e ganhe</p>
            </div>
          </motion.div>

          {/* Botões de Ação Imediata */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center justify-center w-full max-w-md"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerSplitAndClose('menu');
              }}
              className="w-full sm:flex-1 py-2.5 sm:py-3 px-5 bg-gradient-to-r from-[#F28B20] via-amber-400 to-[#F28B20] hover:brightness-110 active:scale-[0.98] text-black font-display font-black text-xs sm:text-sm tracking-wider uppercase rounded-2xl shadow-[0_8px_20px_rgba(242,139,32,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ver Cardápio & Pedir</span>
              <ArrowRight size={15} />
            </button>

            {onGoToGame && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerSplitAndClose('game');
                }}
                className="w-full sm:w-auto py-2 sm:py-3 px-4 bg-white/10 hover:bg-white/15 active:scale-95 text-stone-200 hover:text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/15 backdrop-blur-sm"
              >
                <span>🐶 Jogar Minigame</span>
              </button>
            )}
          </motion.div>
        </div>

        {/* Rodapé com Barra de Progresso Rápida e Auto-Abertura */}
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-8 pb-3 sm:pb-4">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-stone-400 font-medium mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>{isPaused ? 'Pausado (toque para continuar)' : 'Mostrando o site em instantes...'}</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerSplitAndClose('menu');
              }}
              className="text-stone-300 hover:text-amber-400 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Entrar agora
            </button>
          </div>

          {/* Barra de Progresso em Gradiente */}
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-[#4E2A84] via-[#F28B20] to-yellow-400 h-full transition-all ease-linear duration-75 rounded-full shadow-[0_0_10px_rgba(242,139,32,0.8)]"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
