import React from 'react';
import { motion } from 'motion/react';

const FLOATING_ITEMS = [
  { emoji: '🍔', size: 'text-6xl', x: '10%', duration: 15, delay: 0 },
  { emoji: '🍟', size: 'text-7xl', x: '85%', duration: 18, delay: 2 },
  { emoji: '🥤', size: 'text-5xl', x: '25%', duration: 20, delay: 5 },
  { emoji: '🌭', size: 'text-6xl', x: '70%', duration: 16, delay: 1 },
  { emoji: '🥪', size: 'text-7xl', x: '45%', duration: 22, delay: 3 },
  { type: 'napkin', size: 'w-24 h-24', x: '15%', duration: 19, delay: 4 },
  { type: 'napkin', size: 'w-16 h-16', x: '80%', duration: 25, delay: 7 },
  { type: 'boom', text: 'POW!', size: 'text-4xl', x: '35%', duration: 14, delay: 2 },
  { type: 'boom', text: 'CRUNCH!', size: 'text-3xl', x: '65%', duration: 17, delay: 8 },
  { emoji: '🍔', size: 'text-5xl', x: '55%', duration: 16, delay: 9 },
];

export default function FloatingBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {FLOATING_ITEMS.map((item, i) => (
        <motion.div
          key={i}
          initial={{ y: '-50vh', rotate: -20 }}
          animate={{ 
            y: ['-50vh', '150vh'],
            rotate: [-20, item.type === 'boom' ? 20 : 360]
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`absolute opacity-80`}
          style={{ left: item.x, top: 0 }}
        >
          {item.emoji && (
            <div className="comic-panel p-3 rounded-2xl transform rotate-12">
              <span className={`${item.size}`}>{item.emoji}</span>
            </div>
          )}
          {item.type === 'napkin' && (
            <div className={`comic-panel-alt ${item.size} p-1 transform -rotate-12`}>
              <div className="w-full h-full checkered-red"></div>
            </div>
          )}
          {item.type === 'boom' && (
            <div className="bg-yellow-400 border-[4px] border-black px-4 py-2 rounded-full shadow-sm transform -rotate-12">
              <span className={`font-display comic-text-bold ${item.size}`}>{item.text}</span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
