import React from 'react';
import { motion } from 'motion/react';
import { Camera } from 'lucide-react';

const PHOTOS = [
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1615719413546-198b25453f85?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1572490122747-3968b75bb811?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1629814695029-23c21a1ce09a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1559703248-dcaaec9fab78?auto=format&fit=crop&w=800&q=80"
];

export default function GallerySection() {
  return (
    <div className="mb-12 relative z-10">
      <div className="flex items-center justify-center gap-3 mb-8">
        <Camera size={32} className="text-black" />
        <h2 className="text-3xl font-display comic-text-bold tracking-widest uppercase text-black text-center">Food Porn</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {PHOTOS.map((url, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ scale: 1.05, zIndex: 20 }}
            className={`relative rounded-xl border-4 border-black overflow-hidden shadow-[4px_4px_0px_#000] cursor-pointer group ${
              idx === 0 ? 'col-span-2 row-span-2' : ''
            }`}
          >
            <div className="absolute inset-0 bg-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
            <img 
              src={url} 
              alt={`Galeria de Lanches ${idx + 1}`}
              className="w-full h-full object-cover aspect-square transition-transform duration-500 group-hover:scale-110"
            />
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/20" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
