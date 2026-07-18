import React from 'react';
import { motion } from 'motion/react';

export default function StorySection() {
  return (
    <div className="comic-panel p-8 rounded-2xl bg-zinc-100 mb-12 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 text-[200px] opacity-5">🤘</div>
      
      <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
        <div className="w-full md:w-1/3 flex justify-center">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: -2 }}
            className="w-48 h-48 md:w-64 md:h-64 bg-yellow-400 rounded-full border-4 border-black shadow-[8px_8px_0px_#000] flex items-center justify-center text-8xl overflow-hidden relative"
          >
            <span className="relative z-10">🎸🐶</span>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CgkJPGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4xKSIvPgoJPC9zdmc+')] opacity-50" />
          </motion.div>
        </div>
        
        <div className="flex-1 text-black">
          <h2 className="text-3xl font-display comic-text-bold tracking-widest uppercase mb-4">
            Do Cachorro Louco ao Nickel
          </h2>
          <div className="space-y-4 font-bold text-zinc-800 text-lg">
            <p>
              Tudo começou ao som de guitarras distorcidas e fitas K7. Antes de ser o Nickel Lanches, nós éramos o lendário 'Cachorro Louco Lanches'. O point oficial da galera que curtia um bom rock dos anos 80 e 90!
            </p>
            <p>
              Entre um solo do Guns N' Roses e um clássico do Nirvana, nossos lanches foram ganhando a cidade de Passo Fundo. A nossa famosa maionese caseira? Dizem que a receita foi criada em um improviso após um show histórico na garagem de casa.
            </p>
            <p>
              O tempo passou, as fitas viraram playlists, e o 'Cachorro Louco' evoluiu. Hoje somos o Nickel Lanches: a mesma atitude rock 'n' roll, a mesma energia contagiante, mas agora com um cardápio ainda mais animal para matar a sua fome!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
