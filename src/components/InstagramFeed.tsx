import React from 'react';
import { Instagram, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function InstagramFeed() {
  const mockPosts = [
    "/images/nickeldog-1.avif",
    "/images/xisbacon-1.avif",
    "/images/xisnickelmix-1.jpg",
    "/images/bomba-1.png",
    "/images/fritascheddarbacon-1.jpg",
    "/images/xiscoração-1.jpg"
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
            <a href="https://www.instagram.com/nickellanches?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="bg-stone-100 text-stone-900 border border-stone-200 font-bold px-6 py-3 rounded-full flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors shrink-0">
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
              href="https://www.instagram.com/nickellanches?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw=="
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
