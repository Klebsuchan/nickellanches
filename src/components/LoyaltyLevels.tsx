import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, Shield, Rocket } from 'lucide-react';

const RANKS = [
  {
    title: "Novato Faminto",
    minXp: 0,
    icon: <Star size={32} className="text-zinc-400" />,
    color: "bg-zinc-100",
    description: "Acabou de chegar na nave. Começa devagar explorando o cardápio."
  },
  {
    title: "Caçador de Bacon",
    minXp: 150,
    icon: <Shield size={32} className="text-orange-400" />,
    color: "bg-orange-100",
    description: "Já domina os lanches básicos e sempre pede bacon extra."
  },
  {
    title: "Mestre da Maionese",
    minXp: 500,
    icon: <Trophy size={32} className="text-yellow-400" />,
    color: "bg-yellow-100",
    description: "Não vive sem a nossa maionese secreta. Cliente de honra!"
  },
  {
    title: "Lenda Galáctica",
    minXp: 1200,
    icon: <Rocket size={32} className="text-purple-500" />,
    color: "bg-purple-100",
    description: "Um verdadeiro astronauta! Conhece todo o menu de trás pra frente."
  }
];

export default function LoyaltyLevels() {
  return (
    <div className="mb-12 relative z-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display comic-text-bold tracking-widest uppercase text-black mb-2">Títulos Intergalácticos</h2>
        <p className="text-zinc-700 font-bold">Acumule XP pedindo seus lanches favoritos e suba de patente!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {RANKS.map((rank, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -5 }}
            className={`border-4 border-black rounded-2xl p-6 ${rank.color} shadow-[4px_4px_0px_#000] flex flex-col items-center text-center`}
          >
            <div className="bg-white p-4 rounded-full border-2 border-black shadow-[2px_2px_0px_#000] mb-4">
              {rank.icon}
            </div>
            <h3 className="font-display font-bold uppercase text-xl text-black mb-1">{rank.title}</h3>
            <div className="inline-block bg-black text-white font-bold px-3 py-1 rounded-full text-xs mb-3">
              {rank.minXp} XP+
            </div>
            <p className="text-sm font-bold text-zinc-700">{rank.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
