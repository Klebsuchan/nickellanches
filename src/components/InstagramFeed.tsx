import React from 'react';
import { Instagram, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function InstagramFeed() {
  const mockPosts = [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1572656306390-40a9fc3899f7?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?q=80&w=600&auto=format&fit=crop"
  ];

  return (
    <div className="w-full py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 xl:px-0">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <div>
            <h2 className="text-3xl md:text-5xl font-black uppercase text-stone-900 tracking-tighter mb-2">
              Siga nosso <span className="text-[#E1306C]">Instagram</span>
            </h2>
            <p className="text-stone-500 font-medium md:text-lg">Fique por dentro das novidades, promoções e bastidores da nossa cozinha.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-stone-100 text-stone-900 border border-stone-200 font-bold px-6 py-3 rounded-full flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors shrink-0">
              <Instagram size={20} className="text-[#E1306C]" />
              Ver Perfil
            </a>
            <a href="https://ig.me/m/nickellanches" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-tr from-[#FFDC80] via-[#F56040] to-[#833AB4] text-white font-bold px-6 py-3 rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shrink-0 shadow-md">
              <MessageCircle size={20} />
              Abrir Chat e Pedir
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
          {mockPosts.map((post, i) => (
            <motion.a 
              href="https://instagram.com"
              target="_blank" rel="noopener noreferrer"
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative aspect-square group rounded-2xl overflow-hidden block"
            >
              <img 
                src={post} 
                alt="Instagram post" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Instagram size={32} className="text-white" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
