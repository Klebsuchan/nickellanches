import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Utensils, Bike, Gamepad2, X } from 'lucide-react';
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

  // Apresentação breve e dinâmica (~2.5 segundos)
  const DURATION_MS = 2500;
  const SPLIT_ANIMATION_MS = 680;

  // Som suave de boas-vindas do mascote ao surgir
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        playSound('bell');
      } catch {}
    }, 180);
    return () => clearTimeout(timer);
  }, []);

  // Função central de fechamento com divisão em duas metades e fade out
  const triggerSplitAndClose = (destination?: 'menu' | 'game') => {
    if (hasTriggeredClose.current) return;
    hasTriggeredClose.current = true;
    setIsSplitting(true);

    try {
      playSound('whoosh');
      if (destination === 'game') {
        setTimeout(() => {
          try { playSound('laser'); } catch {}
        }, 120);
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

    const intervalTime = 25;
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

  // Teclado: Escape, Enter ou Barra de Espaço
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
        // Evita fechamento acidental nos primeiros 500ms
        if (Date.now() - mountTimeRef.current < 500) return;
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
                transition: { duration: 0.65, ease: [0.76, 0, 0.24, 1] },
              }
            : { y: 0, opacity: 1, filter: 'blur(0px)' }
        }
        className="absolute top-0 left-0 right-0 h-1/2 w-full overflow-hidden bg-gradient-to-b from-[#0e041b] via-[#190b31] to-[#251145] border-b border-amber-400/50 z-20 flex flex-col justify-center items-center"
      >
        {/* Luzes e atmosfera da metade superior */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-28 -left-28 w-80 sm:w-96 h-80 sm:h-96 bg-[#4E2A84] rounded-full filter blur-[100px] opacity-80 animate-pulse" />
          <div className="absolute -top-20 -right-20 w-80 sm:w-96 h-80 sm:h-96 bg-[#F28B20] rounded-full filter blur-[100px] opacity-60" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[650px] h-36 bg-amber-500/20 rounded-full filter blur-[80px]" />
          
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        {/* Barra do Topo Flutuante (Fixa no topo para não disputar espaço com o personagem) */}
        <div className="absolute top-2.5 sm:top-4 left-3 sm:left-8 right-3 sm:right-8 z-30 flex items-center justify-between pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#F28B20]/15 border border-[#F28B20]/40 text-[#F28B20] text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-[0_0_15px_rgba(242,139,32,0.2)]">
              <Sparkles size={12} className="text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Passo Fundo • RS</span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-[#F28B20]" />
              <span className="hidden sm:inline">Desde 2018</span>
            </div>
          </motion.div>

          {/* Botão Pular */}
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            onClick={(e) => {
              e.stopPropagation();
              triggerSplitAndClose('menu');
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-3 py-1 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-stone-200 hover:text-white text-[11px] sm:text-xs font-bold transition-all cursor-pointer border border-white/15 backdrop-blur-md shadow-md"
            title="Pular apresentação e ir direto ao site"
          >
            <span>Pular</span>
            <X size={13} />
          </motion.button>
        </div>

        {/* Centro da Metade Superior: PERSONAGEM DANDO OI BEM GRANDE NO MODO MOBILE */}
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 flex flex-col items-center justify-center text-center mt-6 sm:mt-4">
          <div className="relative inline-flex flex-col items-center justify-center">
            {/* Balão de fala estilo quadrinhos */}
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 240, delay: 0.12 }}
              className="relative mb-2 sm:mb-3 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-2xl bg-white text-stone-900 shadow-[0_12px_32px_rgba(0,0,0,0.75)] border-2 border-amber-400 flex items-center gap-1.5 sm:gap-2 z-30"
            >
              <span className="text-sm sm:text-lg font-black text-[#4E2A84] tracking-wide">Oi!</span>
              <span className="text-xs sm:text-base font-black text-stone-800">Bem-vindo à Nickel Lanches!</span>
              <motion.span
                animate={{ rotate: [0, 24, -14, 24, 0] }}
                transition={{ repeat: Infinity, duration: 0.55 }}
                className="text-lg sm:text-2xl inline-block origin-bottom-right"
              >
                👋
              </motion.span>
              {/* Rabicho do balão apontando para o cãozinho */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-amber-400 rotate-45" />
            </motion.div>

            {/* O Personagem Cãozinho animado BEM MAIOR NO MODO MOBILE (w-40 h-40 até w-60 h-60) */}
            <motion.div
              initial={{ scale: 0.8, y: 20, opacity: 0 }}
              animate={{
                scale: 1,
                y: [0, -10, 0],
                opacity: 1,
              }}
              transition={{
                scale: { type: 'spring', damping: 12, stiffness: 200, delay: 0.05 },
                y: { repeat: Infinity, duration: 0.85, ease: 'easeInOut' },
                opacity: { duration: 0.2 },
              }}
              className="relative flex items-center justify-center my-1"
            >
              {/* Brilho pulsante ampliado atrás do personagem */}
              <div className="absolute inset-0 bg-[#F28B20]/45 rounded-full filter blur-2xl scale-125 animate-pulse pointer-events-none" />
              
              {/* Imagem do mascote aumentada expressivamente no mobile (h-40 / 160px no mobile, até h-56 no desktop) */}
              <img
                src="/cochirrinho16bit.png"
                alt="Cãozinho Nickel dando Oi"
                className="w-40 h-40 xs:w-44 xs:h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 max-h-[30vh] sm:max-h-[34vh] object-contain relative z-10 drop-shadow-[0_16px_32px_rgba(0,0,0,0.9)] transform hover:scale-105 transition-transform"
              />

              {/* Emoji de aceno grande e destacado ao lado da cabeça do cãozinho */}
              <motion.div
                animate={{ rotate: [0, 28, -12, 28, 0], scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 0.55 }}
                className="absolute -top-1 -right-3 xs:-right-4 sm:-right-6 text-3xl sm:text-5xl origin-bottom-left z-20 drop-shadow-xl select-none"
              >
                👋
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-1 sm:mt-2"
          >
            <h1 className="font-display font-black text-xl sm:text-3xl md:text-4xl text-white tracking-wider uppercase drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)]">
              NICKEL <span className="text-[#F28B20]">LANCHES</span>
            </h1>
          </motion.div>
        </div>

        {/* Linha de corte da metade superior */}
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#F28B20] to-transparent opacity-90 absolute bottom-0 left-0 right-0" />
      </motion.div>


      {/* ========================================================
          FEIXE DE ENERGIA CENTRAL (Divisor horizontal no horizonte de 50%)
          Sem caixas de texto sobrepostas para não obstruir conteúdo
          ======================================================== */}
      <motion.div
        animate={
          isSplitting
            ? {
                scaleY: [1, 4, 0],
                opacity: [0.9, 1, 0],
                transition: { duration: 0.35 },
              }
            : {
                scaleY: [0.8, 1.3, 0.8],
                opacity: [0.7, 1, 0.7],
                transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
              }
        }
        className="absolute top-1/2 left-0 right-0 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-center"
      >
        <div className="w-full h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_#F28B20]" />
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
                transition: { duration: 0.65, ease: [0.76, 0, 0.24, 1] },
              }
            : { y: 0, opacity: 1, filter: 'blur(0px)' }
        }
        className="absolute top-1/2 left-0 right-0 h-1/2 w-full overflow-hidden bg-gradient-to-b from-[#251145] via-[#190b31] to-[#0c0318] border-t border-amber-400/50 z-20 flex flex-col justify-between"
      >
        {/* Luzes da metade inferior */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-32 bg-amber-500/15 rounded-full filter blur-[80px]" />
          <div className="absolute -bottom-28 -left-28 w-80 sm:w-96 h-80 sm:h-96 bg-[#4E2A84] rounded-full filter blur-[100px] opacity-60" />
          <div className="absolute -bottom-20 -right-20 w-80 sm:w-96 h-80 sm:h-96 bg-[#F28B20] rounded-full filter blur-[100px] opacity-65 animate-pulse" />
          
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        {/* Linha de corte da metade inferior */}
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#F28B20] to-transparent opacity-90" />

        {/* Centro da Metade Inferior: Slogan, Pilares e Ações */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 pt-1 sm:pt-2 flex-1 flex flex-col items-center justify-center text-center">
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-amber-300 font-bold text-[11px] sm:text-sm md:text-base tracking-wide mb-2 sm:mb-3 drop-shadow"
          >
            O Sabor Gigante & Mais Tradicional de Passo Fundo 🍔
          </motion.p>

          {/* 3 Pilares com layout otimizado tanto para mobile quanto desktop */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-3 gap-1.5 sm:gap-3 w-full max-w-lg mb-2 sm:mb-3"
          >
            {/* Card 1 */}
            <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 text-center flex flex-col items-center justify-center backdrop-blur-sm shadow-xs">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#F28B20]/20 text-[#F28B20] flex items-center justify-center mb-0.5 sm:mb-1">
                <Utensils size={13} className="sm:w-4 sm:h-4" />
              </div>
              <h4 className="text-[10px] sm:text-xs font-black text-white leading-tight">Xis Gigante</h4>
              <p className="text-[8px] sm:text-[10px] text-stone-400 font-medium hidden sm:block mt-0.5">Prensado & farto</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 text-center flex flex-col items-center justify-center backdrop-blur-sm shadow-xs">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center mb-0.5 sm:mb-1">
                <Bike size={13} className="sm:w-4 sm:h-4" />
              </div>
              <h4 className="text-[10px] sm:text-xs font-black text-white leading-tight">Entrega Ágil</h4>
              <p className="text-[8px] sm:text-[10px] text-stone-400 font-medium hidden sm:block mt-0.5">Quentinho em casa</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 text-center flex flex-col items-center justify-center backdrop-blur-sm shadow-xs">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center mb-0.5 sm:mb-1">
                <Gamepad2 size={13} className="sm:w-4 sm:h-4" />
              </div>
              <h4 className="text-[10px] sm:text-xs font-black text-white leading-tight">Minigame Cão</h4>
              <p className="text-[8px] sm:text-[10px] text-stone-400 font-medium hidden sm:block mt-0.5">Jogue e ganhe</p>
            </div>
          </motion.div>

          {/* Botões de Ação Imediata (Tamanho proporcional no mobile e desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-row gap-2 sm:gap-3 items-center justify-center w-full max-w-sm sm:max-w-md"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerSplitAndClose('menu');
              }}
              className="flex-1 py-2 sm:py-2.5 px-3 sm:px-5 bg-gradient-to-r from-[#F28B20] via-amber-400 to-[#F28B20] hover:brightness-110 active:scale-[0.98] text-black font-display font-black text-[11px] sm:text-sm tracking-wider uppercase rounded-xl sm:rounded-2xl shadow-[0_6px_20px_rgba(242,139,32,0.4)] transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
            >
              <span>Ver Cardápio & Pedir</span>
              <ArrowRight size={14} className="sm:w-4 sm:h-4" />
            </button>

            {onGoToGame && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerSplitAndClose('game');
                }}
                className="py-2 sm:py-2.5 px-2.5 sm:px-4 bg-white/10 hover:bg-white/15 active:scale-95 text-stone-200 hover:text-white font-bold text-[10px] sm:text-xs uppercase tracking-wider rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-white/15 backdrop-blur-sm whitespace-nowrap"
              >
                <span>🐶 Jogar</span>
              </button>
            )}
          </motion.div>
        </div>

        {/* Rodapé com Barra de Progresso e Auto-Abertura */}
        <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-8 pb-2 sm:pb-3">
          <div className="flex items-center justify-between text-[9px] sm:text-xs text-stone-400 font-medium mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>{isPaused ? 'Pausado' : 'Mostrando o site em instantes...'}</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerSplitAndClose('menu');
              }}
              className="text-stone-300 hover:text-amber-400 underline underline-offset-2 transition-colors cursor-pointer text-[9px] sm:text-xs"
            >
              Entrar agora
            </button>
          </div>

          {/* Barra de Progresso em Gradiente */}
          <div className="w-full bg-white/10 h-1 sm:h-1.5 rounded-full overflow-hidden shadow-inner">
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
