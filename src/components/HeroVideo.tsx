import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isReversing = useRef(false);
  const intervalId = useRef<any>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.loop = false;

    const startReverse = () => {
      if (isReversing.current) return;
      isReversing.current = true;
      video.pause();

      if (intervalId.current) clearInterval(intervalId.current);

      // The video is 12 fps, so each frame is ~0.083s
      // We step back 0.083s every 83ms to play smoothly backwards
      intervalId.current = setInterval(() => {
        if (video.currentTime <= 0.09) {
          clearInterval(intervalId.current);
          intervalId.current = null;
          isReversing.current = false;
          video.currentTime = 0;
          video.play().catch(() => {});
        } else {
          video.currentTime -= 0.083;
        }
      }, 83);
    };

    const handleEnded = () => {
      startReverse();
    };

    // Fallback in case ended doesn't fire correctly in some browsers
    const handleTimeUpdate = () => {
      if (!isReversing.current && video.duration && video.currentTime >= video.duration - 0.05) {
        startReverse();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      if (intervalId.current) clearInterval(intervalId.current);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full mb-12 rounded-3xl overflow-hidden p-6 sm:p-8 md:p-12 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 bg-zinc-900 border-4 border-black shadow-[8px_8px_0px_#000]"
    >
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\\"20\\" height=\\"20\\" viewBox=\\"0 0 20 20\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cg fill=\\"%23ffffff\\" fill-opacity=\\"1\\" fill-rule=\\"evenodd\\"%3E%3Ccircle cx=\\"3\\" cy=\\"3\\" r=\\"3\\"%2F%3E%3Ccircle cx=\\"13\\" cy=\\"13\\" r=\\"3\\"%2F%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '20px 20px' }} />
      
      <div className="flex-1 text-center md:text-left text-white relative z-10 w-full mt-4 md:mt-0 order-2 md:order-1">
        <div className="inline-block bg-yellow-400 text-black font-black uppercase tracking-widest px-4 py-1 rounded-full text-xs sm:text-sm mb-4 md:mb-6 border-2 border-black shadow-[2px_2px_0px_#000] rotate-[-2deg]">
          A Construção do Sabor
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display comic-text-bold uppercase leading-[1.1] md:leading-[0.9] tracking-tighter mb-4 md:mb-6 text-yellow-400 drop-shadow-[4px_4px_0px_#000]">
          Sinta a <br className="hidden md:block" /><span className="text-white">Fome!</span>
        </h2>
        <p className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-widest opacity-90 border-t-2 md:border-t-0 md:border-l-4 border-yellow-400 pt-4 md:pt-0 md:pl-4 mx-auto md:mx-0 max-w-sm md:max-w-none">
          Ingredientes frescos, montados na hora e queijo derretendo de verdade.
        </p>
      </div>
      
      <div className="w-full md:w-1/2 relative h-[250px] sm:h-[300px] md:h-[450px] flex items-center justify-center order-1 md:order-2">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-yellow-400/30 blur-3xl rounded-full w-full h-full scale-100 md:scale-110"></div>
        
        <video 
          ref={videoRef}
          src="/videosemfundo-1_seekable3.webm" 
          autoPlay 
          muted 
          playsInline
          className="relative z-10 w-full h-full object-contain scale-100 sm:scale-110 md:scale-125 origin-center transition-transform hover:scale-105 md:hover:scale-[1.4] duration-500"
        />
      </div>
    </motion.div>
  );
}
