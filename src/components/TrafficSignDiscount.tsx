import React, { useState } from 'react';
import { Tag, Check, Copy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

interface TrafficSignDiscountProps {
  variant?: 'banner' | 'floating';
  onApplyCoupon?: (code: string) => void;
}

export default function TrafficSignDiscount({ variant = 'banner', onApplyCoupon }: TrafficSignDiscountProps) {
  const [copied, setCopied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { addToast } = useToast();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText('PRIMEIRA10');
    setCopied(true);
    if (onApplyCoupon) {
      onApplyCoupon('PRIMEIRA10');
    }
    addToast({
      message: 'Cupom PRIMEIRA10 copiado! Aproveite seus 10% de desconto.',
      type: 'success',
      title: '10% OFF Aplicado'
    });
    setTimeout(() => setCopied(false), 3000);
  };

  if (isDismissed) return null;

  // 1. Placa de trânsito flutuante (canto da tela)
  if (variant === 'floating') {
    if (isMinimized) {
      return (
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-5 left-5 z-40 bg-[#FFCC00] hover:bg-[#FFD633] text-black border-[3px] border-black shadow-[4px_4px_0px_#000] px-3.5 py-2 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer active:translate-y-1 transition-all group"
          title="Ver desconto de primeira compra"
        >
          <span className="text-base group-hover:rotate-12 transition-transform">⚠️</span>
          <span>10% OFF</span>
        </button>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.9 }}
        className="fixed bottom-5 left-5 z-40 max-w-[290px] sm:max-w-xs select-none"
      >
        <div className="relative group cursor-pointer" onClick={handleCopy}>
          {/* Botão de Fechar / Minimizar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-black hover:bg-stone-800 text-yellow-400 rounded-full flex items-center justify-center border-2 border-yellow-400 shadow-md z-20 cursor-pointer"
            title="Minimizar placa"
          >
            <X size={13} strokeWidth={3} />
          </button>

          {/* Placa Amarela de Trânsito (Estilo Sinalização Viária de Advertência) */}
          <div className="bg-[#FFCC00] border-[4px] border-black rounded-3xl p-1.5 shadow-[6px_6px_0px_#000] transform -rotate-1 hover:rotate-0 hover:scale-[1.02] transition-all">
            {/* Filete preto interno característico de placas de trânsito */}
            <div className="border-[2px] border-black rounded-[20px] p-3.5 relative bg-[#FFD000]">
              {/* 4 Parafusos metálicos nos cantos */}
              <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-stone-300 border border-stone-700 shadow-inner flex items-center justify-center">
                <div className="w-1.5 h-[1.5px] bg-stone-600 rotate-45" />
              </div>
              <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-stone-300 border border-stone-700 shadow-inner flex items-center justify-center">
                <div className="w-1.5 h-[1.5px] bg-stone-600 -rotate-45" />
              </div>
              <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-stone-300 border border-stone-700 shadow-inner flex items-center justify-center">
                <div className="w-1.5 h-[1.5px] bg-stone-600 -rotate-45" />
              </div>
              <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-stone-300 border border-stone-700 shadow-inner flex items-center justify-center">
                <div className="w-1.5 h-[1.5px] bg-stone-600 rotate-45" />
              </div>

              {/* Cabeçalho de Alerta de Trânsito */}
              <div className="flex items-center justify-center gap-1.5 mb-1 text-black">
                <span className="text-base">⚠️</span>
                <span className="font-black text-[10px] tracking-widest uppercase">
                  ATENÇÃO LANCHEIRO
                </span>
                <span className="text-base">⚠️</span>
              </div>

              {/* Mensagem Principal */}
              <div className="text-center text-black my-1">
                <div className="font-display font-black text-xl sm:text-2xl leading-none tracking-tight">
                  10% DE DESCONTO
                </div>
                <div className="font-black text-[11px] sm:text-xs tracking-wider uppercase mt-0.5">
                  PARA A PRIMEIRA COMPRA
                </div>
              </div>

              {/* Botão de Cupom tipo placa de regulamentação */}
              <div className="mt-2.5 pt-2 border-t-2 border-black flex items-center justify-between gap-2">
                <div className="bg-black text-[#FFCC00] px-2.5 py-1 rounded-lg font-mono font-black text-xs tracking-wider border border-black flex items-center gap-1">
                  <Tag size={12} />
                  <span>PRIMEIRA10</span>
                </div>
                <span className="text-[10px] font-black uppercase text-black bg-white/90 border border-black px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-white shadow-2xs">
                  {copied ? (
                    <>
                      <Check size={12} className="text-green-700" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copiar</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Haste/Poste de metal de trânsito fincado */}
          <div className="w-3 h-5 bg-gradient-to-r from-stone-400 via-stone-200 to-stone-500 border-x-2 border-b-2 border-black mx-auto shadow-xs" />
        </div>
      </motion.div>
    );
  }

  // 2. Placa de trânsito em destaque na página (Banner de Trânsito)
  return (
    <div className="w-full my-6 flex flex-col items-center select-none">
      <div 
        onClick={handleCopy}
        className="w-full max-w-3xl bg-[#FFCC00] border-[4px] md:border-[5px] border-black rounded-3xl md:rounded-[32px] p-2 shadow-[8px_8px_0px_#000] hover:shadow-[10px_10px_0px_#000] transform -rotate-1 hover:rotate-0 hover:scale-[1.01] transition-all cursor-pointer group"
      >
        {/* Filete interno preto das placas de trânsito */}
        <div className="border-[3px] border-black rounded-[22px] md:rounded-[24px] p-4 md:p-6 bg-[#FFD000] relative">
          {/* Parafusos nos cantos */}
          <div className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full bg-stone-300 border border-stone-800 shadow-inner flex items-center justify-center">
            <div className="w-2 h-[1.5px] bg-stone-600 rotate-45" />
          </div>
          <div className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full bg-stone-300 border border-stone-800 shadow-inner flex items-center justify-center">
            <div className="w-2 h-[1.5px] bg-stone-600 -rotate-45" />
          </div>
          <div className="absolute bottom-2.5 left-2.5 w-3 h-3 rounded-full bg-stone-300 border border-stone-800 shadow-inner flex items-center justify-center">
            <div className="w-2 h-[1.5px] bg-stone-600 -rotate-45" />
          </div>
          <div className="absolute bottom-2.5 right-2.5 w-3 h-3 rounded-full bg-stone-300 border border-stone-800 shadow-inner flex items-center justify-center">
            <div className="w-2 h-[1.5px] bg-stone-600 rotate-45" />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
            {/* Ícone de Placa de Advertência */}
            <div className="flex items-center gap-3.5 text-black text-center md:text-left">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-black rounded-2xl flex items-center justify-center shrink-0 border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.3)]">
                <span className="text-3xl md:text-4xl">⚠️</span>
              </div>
              <div>
                <div className="flex items-center justify-center md:justify-start gap-1.5 text-black">
                  <span className="font-black text-xs md:text-sm tracking-widest uppercase">
                    SINALIZAÇÃO NICKEL DELIVERY
                  </span>
                </div>
                <div className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-black uppercase leading-tight tracking-tight">
                  10% DE DESCONTO
                </div>
                <div className="font-black text-xs sm:text-sm text-stone-900 uppercase tracking-wide">
                  PARA A PRIMEIRA COMPRA NO SITE
                </div>
              </div>
            </div>

            {/* Ação: Cupom e Copiar */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <div className="bg-black text-[#FFCC00] px-4 py-2.5 rounded-xl font-mono font-black text-sm md:text-base tracking-widest border-2 border-black flex items-center justify-center gap-2 w-full sm:w-auto shadow-xs">
                <Tag size={16} />
                <span>PRIMEIRA10</span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="w-full sm:w-auto bg-white hover:bg-stone-100 text-black border-2 border-black px-4 py-2.5 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-green-700" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copiar Cupom</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Poste duplo metálico de suporte da placa de trânsito */}
      <div className="flex justify-between w-48 md:w-64 px-8">
        <div className="w-3.5 h-6 bg-gradient-to-r from-stone-400 via-stone-200 to-stone-500 border-x-2 border-b-2 border-black shadow-xs" />
        <div className="w-3.5 h-6 bg-gradient-to-r from-stone-400 via-stone-200 to-stone-500 border-x-2 border-b-2 border-black shadow-xs" />
      </div>
    </div>
  );
}
