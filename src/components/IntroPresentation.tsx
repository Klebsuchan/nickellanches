import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, X, Heart } from 'lucide-react';
import { playSound } from '../lib/audio';

interface IntroPresentationProps {
  onClose: () => void;
  onGoToGame?: () => void;
}

/* ==========================================================================
   ILUSTRAÇÕES VETORIAIS (CARTOON FAST FOOD) DE ALTA FIDELIDADE
   Cada item é um elemento independente com física de flutuação e sombras
   ========================================================================== */

/** Hambúrguer Artesanal com Pão Dourado, Queijo Cheddar Derretido e Alface */
function BurgerGraphic({
  hasSpeedLines = false,
  className = '',
}: {
  hasSpeedLines?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative inline-block select-none pointer-events-none ${className}`}>
      {/* Linhas de movimento de velocidade cartoon */}
      {hasSpeedLines && (
        <svg
          className="absolute -left-12 top-1/2 -translate-y-1/2 w-14 h-12 opacity-80 pointer-events-none"
          viewBox="0 0 60 50"
          fill="none"
        >
          <path
            d="M 55 12 Q 30 14 5 18"
            stroke="#F28B20"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeOpacity="0.75"
          />
          <path
            d="M 58 25 Q 35 25 10 25"
            stroke="#FBBF24"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeOpacity="0.9"
          />
          <path
            d="M 52 38 Q 28 36 2 32"
            stroke="#F28B20"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />
        </svg>
      )}

      {/* Ilustração do Hambúrguer */}
      <svg
        viewBox="0 0 160 140"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)]"
        fill="none"
      >
        <defs>
          <linearGradient id="bunTopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F9A84D" />
            <stop offset="45%" stopColor="#EA7317" />
            <stop offset="100%" stopColor="#BF4A08" />
          </linearGradient>
          <linearGradient id="bunBottomGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="pattyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5D2615" />
            <stop offset="60%" stopColor="#3C160B" />
            <stop offset="100%" stopColor="#250C05" />
          </linearGradient>
          <linearGradient id="cheeseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>
        </defs>

        {/* Pão Superior Macio com Brilho */}
        <path
          d="M 18 64 C 18 20, 142 20, 142 64 C 142 68, 18 68, 18 64 Z"
          fill="url(#bunTopGrad)"
          stroke="#451A03"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Brilho da casca do pão */}
        <path
          d="M 34 38 C 45 28, 85 24, 115 30"
          stroke="#FED7AA"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* Gergelins */}
        <ellipse cx="46" cy="40" rx="3" ry="1.8" fill="#FEF3C7" transform="rotate(-15 46 40)" />
        <ellipse cx="78" cy="32" rx="3.2" ry="1.8" fill="#FEF3C7" transform="rotate(5 78 32)" />
        <ellipse cx="110" cy="40" rx="3" ry="1.8" fill="#FEF3C7" transform="rotate(20 110 40)" />
        <ellipse cx="62" cy="46" rx="2.8" ry="1.6" fill="#FEF3C7" transform="rotate(-5 62 46)" />
        <ellipse cx="94" cy="47" rx="3" ry="1.7" fill="#FEF3C7" transform="rotate(10 94 47)" />

        {/* Alface Fresca Ondulada */}
        <path
          d="M 12 68 C 22 62, 32 74, 44 67 C 56 60, 68 73, 80 66 C 92 59, 104 72, 116 66 C 128 60, 138 73, 148 68 C 152 75, 142 77, 130 76 C 118 75, 106 79, 94 77 C 82 75, 70 80, 58 77 C 46 74, 34 78, 22 75 C 14 74, 10 73, 12 68 Z"
          fill="#4ADE80"
          stroke="#14532D"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Tomate Vermelho Suculento */}
        <rect
          x="22"
          y="74"
          width="116"
          height="12"
          rx="5"
          fill="#DC2626"
          stroke="#7F1D1D"
          strokeWidth="3.5"
        />

        {/* Queijo Cheddar Derretendo */}
        <path
          d="M 16 84 L 144 84 L 138 96 L 124 90 L 102 108 L 84 89 L 68 104 L 50 89 L 34 102 L 22 89 Z"
          fill="url(#cheeseGrad)"
          stroke="#854D0E"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Hambúrguer Artesanal Grelhado */}
        <rect
          x="14"
          y="93"
          width="132"
          height="20"
          rx="9"
          fill="url(#pattyGrad)"
          stroke="#1C0A04"
          strokeWidth="4"
        />
        {/* Marcas de grelha */}
        <line x1="38" y1="97" x2="48" y2="108" stroke="#1C0A04" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="68" y1="97" x2="78" y2="108" stroke="#1C0A04" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="98" y1="97" x2="108" y2="108" stroke="#1C0A04" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="126" y1="97" x2="134" y2="106" stroke="#1C0A04" strokeWidth="2.5" strokeLinecap="round" />

        {/* Pão Inferior Macio */}
        <path
          d="M 22 112 C 22 110, 138 110, 138 112 C 138 126, 122 134, 80 134 C 38 134, 22 126, 22 112 Z"
          fill="url(#bunBottomGrad)"
          stroke="#451A03"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Porção Crocante de Batatas Fritas com Caixinha Listrada */
function FriesGraphic({ className = '' }: { className?: string }) {
  return (
    <div className={`relative inline-block select-none pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 140 150"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)]"
        fill="none"
      >
        <defs>
          <linearGradient id="fryGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>
          <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="50%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>
        </defs>

        {/* Palitos de Batata Frita Crocante */}
        {/* Batatas do fundo */}
        <rect x="36" y="22" width="13" height="60" rx="3" fill="#CA8A04" stroke="#713F12" strokeWidth="2.5" transform="rotate(-18 42 50)" />
        <rect x="52" y="10" width="14" height="70" rx="3" fill="url(#fryGrad)" stroke="#713F12" strokeWidth="2.5" transform="rotate(-6 59 45)" />
        <rect x="74" y="8" width="14" height="72" rx="3" fill="url(#fryGrad)" stroke="#713F12" strokeWidth="2.5" transform="rotate(8 81 44)" />
        <rect x="94" y="18" width="13" height="64" rx="3" fill="url(#fryGrad)" stroke="#713F12" strokeWidth="2.5" transform="rotate(22 100 50)" />

        {/* Batatas da frente */}
        <rect x="42" y="28" width="13" height="55" rx="3" fill="url(#fryGrad)" stroke="#713F12" strokeWidth="2.5" transform="rotate(-12 48 55)" />
        <rect x="62" y="18" width="14" height="65" rx="3" fill="url(#fryGrad)" stroke="#713F12" strokeWidth="2.5" transform="rotate(2 69 50)" />
        <rect x="84" y="24" width="13" height="60" rx="3" fill="url(#fryGrad)" stroke="#713F12" strokeWidth="2.5" transform="rotate(14 90 54)" />
        <rect x="30" y="38" width="12" height="48" rx="3" fill="url(#fryGrad)" stroke="#713F12" strokeWidth="2.5" transform="rotate(-26 36 62)" />
        <rect x="100" y="32" width="12" height="50" rx="3" fill="url(#fryGrad)" stroke="#713F12" strokeWidth="2.5" transform="rotate(28 106 57)" />

        {/* Caixinha de Batatas Vermelha com Curva Frontal */}
        <path
          d="M 24 64 L 36 138 C 36 142, 104 142, 104 138 L 116 64 C 98 78, 42 78, 24 64 Z"
          fill="url(#boxGrad)"
          stroke="#450A0A"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Listra Dourada Decorativa na Caixa */}
        <path
          d="M 28 88 C 45 98, 95 98, 112 88 L 110 102 C 93 112, 47 112, 30 102 Z"
          fill="#FBBF24"
          stroke="#B45309"
          strokeWidth="2"
        />

        {/* Gotas de ketchup no topo */}
        <ellipse cx="26" cy="24" rx="4" ry="5" fill="#EF4444" stroke="#7F1D1D" strokeWidth="1.5" />
        <circle cx="120" cy="46" r="3.5" fill="#EF4444" stroke="#7F1D1D" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

/** Copo de Refrigerante Refrescante com Canudo Listrado e Gelo */
function DrinkGraphic({ className = '' }: { className?: string }) {
  return (
    <div className={`relative inline-block select-none pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 130 160"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)]"
        fill="none"
      >
        <defs>
          <linearGradient id="colaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#78350F" />
            <stop offset="30%" stopColor="#451A03" />
            <stop offset="100%" stopColor="#1C0A04" />
          </linearGradient>
          <linearGradient id="cupGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
          </linearGradient>
        </defs>

        {/* Canudo dobrado listrado Vermelho e Branco */}
        <path
          d="M 88 12 L 102 8 L 84 62"
          stroke="#EF4444"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Listras brancas do canudo */}
        <path
          d="M 88 12 L 102 8 L 84 62"
          stroke="#FFFFFF"
          strokeWidth="9"
          strokeDasharray="7 7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Contorno fino do canudo */}
        <path
          d="M 88 12 L 102 8 L 84 62"
          stroke="#7F1D1D"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Líquido da Bebida / Refrigerante com gás */}
        <path
          d="M 28 58 L 38 142 C 40 148, 90 148, 92 142 L 102 58 Z"
          fill="url(#colaGrad)"
        />

        {/* Cubos de Gelo Flutuando */}
        <rect x="42" y="66" width="18" height="18" rx="4" fill="rgba(255,255,255,0.7)" stroke="#CBD5E1" strokeWidth="2" transform="rotate(12 51 75)" />
        <rect x="68" y="72" width="17" height="17" rx="4" fill="rgba(255,255,255,0.65)" stroke="#CBD5E1" strokeWidth="2" transform="rotate(-15 76 80)" />

        {/* Bolhas de gás */}
        <circle cx="48" cy="110" r="2.5" fill="rgba(255,255,255,0.5)" />
        <circle cx="78" cy="104" r="3" fill="rgba(255,255,255,0.4)" />
        <circle cx="62" cy="126" r="2" fill="rgba(255,255,255,0.5)" />
        <circle cx="86" cy="122" r="2.5" fill="rgba(255,255,255,0.4)" />

        {/* Copo transparente */}
        <path
          d="M 24 50 L 36 144 C 38 150, 92 150, 94 144 L 106 50 Z"
          fill="url(#cupGrad)"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Tampa do copo com relevo */}
        <ellipse cx="65" cy="50" rx="45" ry="10" fill="#F8FAFC" stroke="#64748B" strokeWidth="3" />
        <ellipse cx="65" cy="48" rx="34" ry="7" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />

        {/* Reflexo de luz na lateral do copo */}
        <path
          d="M 32 58 L 42 138"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/** Hot Dog Gourmet com Salsicha Suculenta e Mostarda em Zig-Zag */
function HotDogGraphic({ className = '' }: { className?: string }) {
  return (
    <div className={`relative inline-block select-none pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 170 110"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)]"
        fill="none"
      >
        <defs>
          <linearGradient id="bunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="60%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="sausageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F87171" />
            <stop offset="50%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>
        </defs>

        {/* Pão Traseiro */}
        <ellipse cx="85" cy="48" rx="72" ry="24" fill="#B45309" stroke="#451A03" strokeWidth="3" />

        {/* Salsicha / Frankfurter Defumada */}
        <rect
          x="12"
          y="38"
          width="146"
          height="28"
          rx="14"
          fill="url(#sausageGrad)"
          stroke="#450A0A"
          strokeWidth="3.5"
          transform="rotate(6 85 52)"
        />

        {/* Pão Frontal Macio */}
        <path
          d="M 10 56 C 14 36, 156 36, 160 56 C 160 84, 10 84, 10 56 Z"
          fill="url(#bunGrad)"
          stroke="#451A03"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Brilho da casca do pão */}
        <path
          d="M 28 64 C 55 54, 115 54, 142 64"
          stroke="#FEF3C7"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Fita de Mostarda Amarela em Zig-zag */}
        <path
          d="M 24 50 Q 36 38 48 50 Q 60 62 72 50 Q 84 38 96 50 Q 108 62 120 50 Q 132 38 144 50"
          stroke="#FACC15"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 24 50 Q 36 38 48 50 Q 60 62 72 50 Q 84 38 96 50 Q 108 62 120 50 Q 132 38 144 50"
          stroke="#713F12"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/** Raios Dourados Radiantes (Sunburst) em rotação contínua */
function AnimatedSunburst() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Halo Central Quente */}
      <div className="absolute w-[360px] sm:w-[580px] md:w-[720px] h-[360px] sm:h-[580px] md:h-[720px] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.5)_0%,rgba(242,139,32,0.3)_35%,rgba(147,51,234,0.15)_60%,transparent_75%)] filter blur-2xl animate-pulse" />

      {/* Raios Solarengos SVG Rotacionando */}
      <motion.svg
        animate={{ rotate: 360 }}
        transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
        viewBox="0 0 1000 1000"
        className="w-[700px] sm:w-[1000px] md:w-[1300px] h-[700px] sm:h-[1000px] md:h-[1300px] opacity-35"
        fill="none"
      >
        <defs>
          <radialGradient id="sunburstGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#F28B20" stopOpacity="0.4" />
            <stop offset="85%" stopColor="#7C3AED" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#1E0A38" stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          return (
            <path
              key={i}
              d="M 500 500 L 460 0 L 540 0 Z"
              fill="url(#sunburstGrad)"
              transform={`rotate(${angle} 500 500)`}
            />
          );
        })}
      </motion.svg>
    </div>
  );
}

/** Fundo com Doodles Sutis (Hambúrguer, Pizza, Fritas, Controle Gamer, Coração) */
function BackgroundDoodles() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-[0.07] overflow-hidden select-none">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="foodDoodles" width="160" height="160" patternUnits="userSpaceOnUse">
            {/* Ícone Hambúrguer */}
            <path d="M 30 40 C 30 25 70 25 70 40 Z" stroke="#ffffff" strokeWidth="2.5" fill="none" />
            <line x1="28" y1="44" x2="72" y2="44" stroke="#ffffff" strokeWidth="2.5" />
            <path d="M 30 48 C 30 55 70 55 70 48 Z" stroke="#ffffff" strokeWidth="2" fill="none" />

            {/* Ícone Batatas Fritas */}
            <path d="M 110 35 L 115 65 L 145 65 L 150 35 Z" stroke="#ffffff" strokeWidth="2.5" fill="none" />
            <line x1="120" y1="35" x2="120" y2="20" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="130" y1="35" x2="130" y2="15" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="140" y1="35" x2="140" y2="22" stroke="#ffffff" strokeWidth="2.5" />

            {/* Ícone Fatias de Pizza */}
            <path d="M 35 110 L 65 140 L 45 145 Z" stroke="#ffffff" strokeWidth="2.5" fill="none" />
            <circle cx="48" cy="130" r="2" fill="#ffffff" />

            {/* Ícone Controle Gamer */}
            <rect x="105" y="110" width="40" height="24" rx="8" stroke="#ffffff" strokeWidth="2.5" fill="none" />
            <circle cx="115" cy="122" r="2" fill="#ffffff" />
            <circle cx="135" cy="122" r="2" fill="#ffffff" />

            {/* Ícone Coração */}
            <path d="M 85 85 Q 85 75 92 75 Q 100 75 100 85 Q 100 95 85 105 Q 70 95 70 85 Q 70 75 78 75 Q 85 75 85 85 Z" stroke="#ffffff" strokeWidth="2" fill="none" transform="scale(0.6) translate(50, 40)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#foodDoodles)" />
      </svg>
    </div>
  );
}

/** Estrelas Douradas Cintilantes Flutuantes */
function SparkleStar({
  top,
  left,
  size = 20,
  delay = 0,
}: {
  top: string;
  left: string;
  size?: number;
  delay?: number;
}) {
  return (
    <motion.div
      style={{ top, left }}
      animate={{
        scale: [0.6, 1.25, 0.6],
        opacity: [0.3, 1, 0.3],
        rotate: [0, 90, 180],
      }}
      transition={{
        duration: 2.2,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
      className="absolute pointer-events-none z-25 text-amber-300 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]"
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
      </svg>
    </motion.div>
  );
}

/** Nuvem de vapor/fumacinha cartoon */
function CartoonSmokePuff({ className = '' }: { className?: string }) {
  return (
    <motion.div
      animate={{
        y: [0, -8, 0],
        opacity: [0.6, 0.9, 0.6],
        scale: [0.95, 1.08, 0.95],
      }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      className={`absolute pointer-events-none select-none z-20 ${className}`}
    >
      <svg width="34" height="26" viewBox="0 0 40 30" fill="none">
        <path
          d="M 10 24 C 6 24 4 20 6 16 C 4 12 8 8 13 9 C 16 5 24 4 27 8 C 32 7 36 10 35 15 C 38 18 36 24 30 24 Z"
          fill="rgba(255,255,255,0.75)"
          stroke="#CBD5E1"
          strokeWidth="1.5"
        />
      </svg>
    </motion.div>
  );
}

/* ==========================================================================
   COMPONENTE PRINCIPAL: INTRO PRESENTATION
   100% dinâmico, móvel, responsivo e construído com código React puro
   ========================================================================== */

export default function IntroPresentation({ onClose, onGoToGame }: IntroPresentationProps) {
  const [progress, setProgress] = useState(0);
  const [isSplitting, setIsSplitting] = useState(false);
  const hasTriggeredClose = useRef(false);

  // Duração rápida e ágil para não prender o cliente (~1.3 segundos de auto-avanço)
  const DURATION_MS = 1400;
  const SPLIT_ANIMATION_MS = 220;

  // Tocar som alegre de balcão ao abrir
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        playSound('bell');
      } catch {}
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  // Transição rápida e fechamento
  const triggerClose = (destination?: 'menu' | 'game') => {
    if (hasTriggeredClose.current) return;
    hasTriggeredClose.current = true;
    setIsSplitting(true);

    try {
      playSound('whoosh');
      if (destination === 'game') {
        setTimeout(() => {
          try {
            playSound('laser');
          } catch {}
        }, 60);
      }
    } catch {}

    setTimeout(() => {
      onClose();
      if (destination === 'game' && onGoToGame) {
        onGoToGame();
      }
    }, SPLIT_ANIMATION_MS);
  };

  // Progresso ágil
  useEffect(() => {
    if (isSplitting) return;

    const intervalTime = 20;
    const step = 100 / (DURATION_MS / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          triggerClose('menu');
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isSplitting]);

  // Teclas de atalho para avançar imediatamente (Esc, Enter, Barra de Espaço)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerClose('menu');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={
        isSplitting
          ? { opacity: 0, scale: 0.98, transition: { duration: 0.22, ease: 'easeOut' } }
          : { opacity: 1, scale: 1, transition: { duration: 0.18, ease: 'easeIn' } }
      }
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
      className="fixed inset-0 z-[99999] w-screen h-[100dvh] overflow-hidden select-none bg-gradient-to-b from-[#18052e] via-[#240a3d] to-[#120322] cursor-pointer"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        triggerClose('menu');
      }}
    >
      {/* ========================================================
          BACKGROUND: DOODLES + SUNBURST DOURADO GIRATÓRIO
          ======================================================== */}
      <BackgroundDoodles />
      <AnimatedSunburst />

      {/* Estrelas Douradas Cintilantes Espalhadas */}
      <SparkleStar top="12%" left="18%" size={18} delay={0.2} />
      <SparkleStar top="22%" left="38%" size={22} delay={0.8} />
      <SparkleStar top="14%" left="72%" size={19} delay={0.4} />
      <SparkleStar top="34%" left="76%" size={17} delay={1.1} />
      <SparkleStar top="62%" left="15%" size={24} delay={0.6} />
      <SparkleStar top="58%" left="72%" size={20} delay={0.9} />
      <SparkleStar top="40%" left="28%" size={16} delay={1.3} />

      {/* Fumacinha cartoon saindo dos lanches */}
      <CartoonSmokePuff className="top-[18%] left-[36%]" />
      <CartoonSmokePuff className="top-[45%] left-[32%]" />
      <CartoonSmokePuff className="top-[48%] right-[30%]" />

      {/* ========================================================
          ELEMENTOS FLUTUANTES MÓVEIS (Fast Food com física independente)
          ======================================================== */}

      {/* 1. Hambúrguer Top-Left com Linhas de Velocidade */}
      <motion.div
        animate={{
          y: [0, -10, 0],
          x: [0, 4, 0],
          rotate: [-4, 3, -4],
        }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[10%] sm:top-[12%] left-[3%] sm:left-[8%] md:left-[14%] w-24 sm:w-32 md:w-44 z-20 pointer-events-none"
      >
        <BurgerGraphic hasSpeedLines={true} className="w-full" />
      </motion.div>

      {/* 2. Hambúrguer Mid-Left Suculento */}
      <motion.div
        animate={{
          y: [0, 10, 0],
          rotate: [3, -4, 3],
          scale: [1, 1.03, 1],
        }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        className="absolute top-[34%] sm:top-[38%] left-[1%] sm:left-[6%] md:left-[11%] w-26 sm:w-36 md:w-48 z-20 pointer-events-none"
      >
        <BurgerGraphic className="w-full" />
      </motion.div>

      {/* 3. Refrigerante Gelado com Canudo (Esquerda) */}
      <motion.div
        animate={{
          y: [0, -8, 0],
          rotate: [-8, -2, -8],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
        className="absolute top-[50%] sm:top-[52%] left-[15%] sm:left-[18%] md:left-[24%] w-16 sm:w-22 md:w-28 z-20 pointer-events-none"
      >
        <DrinkGraphic className="w-full" />
      </motion.div>

      {/* 4. Hambúrguer Bottom-Left */}
      <motion.div
        animate={{
          y: [0, -9, 0],
          rotate: [-3, 3, -3],
        }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
        className="hidden xs:block absolute top-[66%] sm:top-[64%] left-[4%] sm:left-[9%] md:left-[15%] w-22 sm:w-32 md:w-42 z-20 pointer-events-none"
      >
        <BurgerGraphic className="w-full" />
      </motion.div>

      {/* 5. Batata Frita Crocante Top-Right */}
      <motion.div
        animate={{
          y: [0, -11, 0],
          rotate: [4, -3, 4],
          scale: [1, 1.04, 1],
        }}
        transition={{ duration: 3.3, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        className="absolute top-[8%] sm:top-[11%] right-[3%] sm:right-[8%] md:right-[15%] w-22 sm:w-32 md:w-44 z-20 pointer-events-none"
      >
        <FriesGraphic className="w-full" />
      </motion.div>

      {/* 6. Copo de Refrigerante Grande Mid-Right */}
      <motion.div
        animate={{
          y: [0, 9, 0],
          rotate: [5, -4, 5],
        }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        className="absolute top-[32%] sm:top-[34%] right-[2%] sm:right-[7%] md:right-[13%] w-20 sm:w-28 md:w-38 z-20 pointer-events-none"
      >
        <DrinkGraphic className="w-full" />
      </motion.div>

      {/* 7. Cachorro-Quente / Hot Dog Bottom-Right */}
      <motion.div
        animate={{
          y: [0, -8, 0],
          rotate: [-5, 4, -5],
        }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        className="absolute top-[58%] sm:top-[60%] right-[3%] sm:right-[9%] md:right-[16%] w-26 sm:w-38 md:w-52 z-20 pointer-events-none"
      >
        <HotDogGraphic className="w-full" />
      </motion.div>

      {/* ========================================================
          PALCO CENTRAL & CONTEÚDO (MÓVEL & RESPONSIVO)
          ======================================================== */}
      <div className="relative z-30 w-full h-full flex flex-col justify-between items-center px-3 sm:px-6 py-3 sm:py-5 max-w-5xl mx-auto">
        {/* ======================================================
            TOPO: BADGES E BOTÃO PULAR
            ====================================================== */}
        <header className="w-full flex items-center justify-between gap-2 shrink-0 z-40">
          {/* Badge Nickel Lanches Passo Fundo RS */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-black/70 border border-amber-400/80 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] text-[10px] sm:text-xs font-black uppercase tracking-wider backdrop-blur-md"
          >
            <Sparkles size={12} className="text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="truncate max-w-[200px] sm:max-w-none">
              NICKEL LANCHES • PASSO FUNDO RS
            </span>
          </motion.div>

          {/* Badge Sérgio & Fran (Centralizada no topo) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#381156]/90 border border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] text-white backdrop-blur-md"
          >
            <Heart size={12} className="text-amber-400 fill-amber-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300">
              SÉRGIO & FRAN
            </span>
          </motion.div>

          {/* Botão Pular */}
          <motion.button
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerClose('menu');
            }}
            className="flex items-center gap-1 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-stone-100 hover:text-white text-[11px] sm:text-xs font-bold border border-white/25 shadow-lg backdrop-blur-md transition-all cursor-pointer pointer-events-auto"
            title="Pular introdução"
          >
            <span>Pular</span>
            <X size={13} className="stroke-[2.5]" />
          </motion.button>
        </header>

        {/* ======================================================
            MEIO: PROPRIETÁRIOS SÉRGIO & FRAN (HERÓIS CENTRAIS)
            ====================================================== */}
        <div className="relative flex-1 w-full flex items-center justify-center my-1 sm:my-2 min-h-0 pointer-events-none">
          {/* Luz de destaque dourada atrás do casal */}
          <div className="absolute w-[280px] sm:w-[420px] md:w-[500px] h-[280px] sm:h-[420px] md:h-[500px] rounded-full bg-gradient-to-tr from-amber-400/35 via-yellow-300/25 to-purple-600/30 filter blur-3xl pointer-events-none animate-pulse" />

          {/* Personagens Sérgio e Fran com respiração sutil */}
          <motion.div
            animate={{
              y: [0, -8, 0],
              scale: [1, 1.015, 1],
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative z-30 flex items-center justify-center h-full max-h-[50vh] sm:max-h-[56vh] md:max-h-[60vh] max-w-full"
          >
            <img
              src="/sergiofra.png"
              alt="Sérgio e Fran - Proprietários da Nickel Lanches"
              className="h-full w-auto max-h-[50vh] sm:max-h-[56vh] md:max-h-[60vh] max-w-[85vw] sm:max-w-[70vw] object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] filter pointer-events-none select-none"
            />
          </motion.div>
        </div>

        {/* ======================================================
            BASE: TEXTO, BARRA COM ENTREGADOR E BOTÕES DE AÇÃO
            ====================================================== */}
        <footer className="w-full max-w-lg flex flex-col items-center gap-2 sm:gap-2.5 shrink-0 z-40 pb-1 pointer-events-auto">
          {/* Frase de Carregamento */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 text-white font-bold text-xs sm:text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          >
            <span>Carregando sabor e diversão...</span>
            <span className="animate-pulse">⏳</span>
          </motion.div>

          {/* Barra de Progresso Cápsula Dourada com Entregador de Moto */}
          <div
            className="w-full h-5 sm:h-6 rounded-full border-[1.5px] border-amber-400 bg-[#16062a] p-[2.5px] shadow-[0_0_16px_rgba(245,158,11,0.55)] cursor-pointer overflow-visible relative"
            onClick={(e) => {
              e.stopPropagation();
              triggerClose('menu');
            }}
            title="Toque para entrar imediatamente"
          >
            {/* Preenchimento dinâmico */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 relative transition-all duration-75 shadow-[0_0_12px_#f59e0b]"
              style={{ width: `${Math.max(4, Math.min(100, progress))}%` }}
            >
              {/* Motinho de entrega no topo da ponta do progresso */}
              <motion.div
                animate={{
                  y: [0, -3, 0],
                }}
                transition={{ duration: 0.45, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-[15px] sm:-top-[17px] -right-[15px] sm:-right-[17px] text-lg sm:text-xl pointer-events-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none"
                style={{ transform: 'scaleX(-1)' }}
              >
                🛵
              </motion.div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="w-full flex items-center gap-2 sm:gap-3 mt-0.5">
            {/* Botão Principal Dourado: VER CARDÁPIO & PEDIR */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerClose('menu');
              }}
              className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#F28B20] via-amber-400 to-[#F28B20] text-black font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_6px_25px_rgba(242,139,32,0.6)] flex items-center justify-center gap-2 border border-amber-300/60 relative cursor-pointer group"
            >
              <span>VER CARDÁPIO & PEDIR</span>
              <ArrowRight
                size={16}
                className="stroke-[3] text-black group-hover:translate-x-1 transition-transform"
              />

              {/* Cursor apontando / clicando */}
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  y: [0, 2, 0],
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -right-2 -bottom-2 text-base sm:text-lg pointer-events-none filter drop-shadow"
              >
                👆
              </motion.div>
            </motion.button>

            {/* Botão Secundário: JOGAR (se disponível) */}
            {onGoToGame && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerClose('game');
                }}
                className="py-2.5 sm:py-3 px-3.5 sm:px-5 rounded-xl sm:rounded-2xl bg-[#2b1442]/90 hover:bg-[#3d1b5c] text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 border border-white/20 whitespace-nowrap cursor-pointer"
                title="Jogar Nickel Dash"
              >
                <span>🐶</span>
                <span>JOGAR</span>
              </motion.button>
            )}
          </div>

          {/* Status inferior e link rápido */}
          <div className="w-full flex items-center justify-between text-[10px] sm:text-xs text-stone-300/90 font-medium px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              <span>Entrando no cardápio...</span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerClose('menu');
              }}
              className="text-amber-400 hover:text-amber-300 hover:underline font-bold transition-colors cursor-pointer"
            >
              Entrar agora →
            </button>
          </div>
        </footer>
      </div>
    </motion.div>
  );
}
