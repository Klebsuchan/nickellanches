import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    question: "Vocês entregam em todos os bairros de Passo Fundo?",
    answer: "Sim! Nossos foguetes de entrega cobrem toda a área urbana de Passo Fundo. O raio de entrega é calculado no momento do pedido."
  },
  {
    question: "Quais são as formas de pagamento?",
    answer: "Aceitamos Pix (compensação na velocidade da luz!), Cartões de Crédito, Débito e Dinheiro. Se for pagar em dinheiro, avise se precisa de troco para o motoboy não ficar perdido no espaço."
  },
  {
    question: "Como funciona o sistema de XP (Pontos)?",
    answer: "Cada lanche, porção ou bebida que você pede vale XP. Ao acumular XP, você sobe de nível no nosso ranking e pode desbloquear títulos exclusivos de fidelidade!"
  },
  {
    question: "A maionese caseira é cobrada à parte?",
    answer: "A primeira porção da nossa lendária maionese intergaláctica é sempre por nossa conta! Porções extras podem ser adicionadas no carrinho."
  },
  {
    question: "Qual o horário de funcionamento?",
    answer: "Nossa nave está de portas abertas de Terça a Domingo, das 18h30 às 23h30. Segundas-feiras tiramos folga para abastecer os foguetes."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mb-12 relative z-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-yellow-400 p-2 rounded-full border-2 border-black shadow-[2px_2px_0px_#000]">
          <HelpCircle size={24} className="text-black" />
        </div>
        <h2 className="text-3xl font-display comic-text-bold tracking-widest uppercase text-black">Perguntas Frequentes</h2>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, idx) => (
          <div 
            key={idx} 
            className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-[4px_4px_0px_#000] transition-all hover:shadow-[6px_6px_0px_#000]"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full p-5 text-left flex justify-between items-center bg-white hover:bg-zinc-50 transition-colors"
            >
              <span className="font-display font-bold uppercase text-lg text-black pr-4">{faq.question}</span>
              <motion.div
                animate={{ rotate: openIndex === idx ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 bg-yellow-400 border-2 border-black rounded-full p-1"
              >
                <ChevronDown size={20} className="text-black" />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {openIndex === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 pt-0 border-t-2 border-dashed border-zinc-200 text-zinc-700 font-bold">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
