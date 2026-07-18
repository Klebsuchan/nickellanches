import React, { useEffect, useRef, useState } from 'react';
import { OrderInfo } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Truck, Utensils, Rocket, Flame, Clock } from 'lucide-react';
import { useToast } from './Toast';
import { subscribeToOrder } from '../lib/db';

interface DogGameProps {
  order: OrderInfo | null;
  onFinishOrder: () => void;
}

export default function DogGame({ order, onFinishOrder }: DogGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const { addToast } = useToast();
  
  const [orderStatus, setOrderStatus] = useState<'pendente' | 'cozinha_confirmou' | 'em_preparo' | 'a_caminho' | 'entregue'>('pendente');
  const [progress, setProgress] = useState(0);

  const [gameId, setGameId] = useState(0);

  // Status subscription
  useEffect(() => {
    if (!order?.id) {
      // Fallback: simulate if no order ID
      let interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            return 100;
          }
          return p + 1;
        });
      }, 100);
      return () => clearInterval(interval);
    }

    const unsub = subscribeToOrder(order.id, (orderData) => {
      if (orderData.status) {
        const status = orderData.status as any;
        setOrderStatus(status);
        
        switch(status) {
          case 'pendente': setProgress(10); break;
          case 'cozinha_confirmou': setProgress(30); break;
          case 'em_preparo': setProgress(60); break;
          case 'a_caminho': setProgress(85); break;
          case 'entregue': setProgress(100); break;
        }
      }
    });

    return () => unsub();
  }, [order?.id]);

  useEffect(() => {
    if (!order?.id) {
      if (progress === 40 && orderStatus === 'pendente') {
        setOrderStatus('a_caminho');
        addToast({
          title: 'Pedido saiu!',
          message: 'Aperte os cintos, seu lanche está a caminho!',
          type: 'info'
        });
      } else if (progress >= 100 && orderStatus === 'a_caminho') {
        setOrderStatus('entregue');
        addToast({
          title: 'Entrega Concluída',
          message: 'Seu lanche chegou. Bom apetite!',
          type: 'success'
        });
        setTimeout(() => {
          onFinishOrder();
        }, 2000);
      }
    }
  }, [progress, orderStatus, addToast, onFinishOrder, order?.id]);

  // Trigger completion for real orders
  useEffect(() => {
    if (order?.id && orderStatus === 'entregue') {
      addToast({
        title: 'Entrega Concluída',
        message: 'Seu lanche chegou. Bom apetite!',
        type: 'success'
      });
      const t = setTimeout(() => {
        onFinishOrder();
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [orderStatus, order?.id, onFinishOrder, addToast]);

  // Game State Ref to avoid re-renders
  const gameState = useRef({
    dogY: 150,
    vy: 0,
    gravity: 0.8,
    jumpPower: -12,
    isJumping: false,
    obstacles: [] as { x: number, y: number, type: 'bottom' | 'top' }[],
    speed: 5,
    frame: 0,
    active: true,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const state = gameState.current;
    state.active = true;
    state.obstacles = [];
    state.dogY = 150;
    state.vy = 0;
    state.speed = 5;
    state.frame = 0;
    setScore(0);
    setGameOver(false);

    const jump = () => {
      if (!state.isJumping && state.active) {
        state.vy = state.jumpPower;
        state.isJumping = true;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    const handleTouch = () => jump();

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('mousedown', handleTouch);

    const loop = () => {
      if (!state.active) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background floor
      ctx.beginPath();
      ctx.moveTo(0, 180);
      ctx.lineTo(canvas.width, 180);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dog Physics
      state.vy += state.gravity;
      state.dogY += state.vy;

      if (state.dogY >= 150) {
        state.dogY = 150;
        state.isJumping = false;
        state.vy = 0;
      }

      // Draw Dog (Cute emoji)
      ctx.font = '40px Arial';
      ctx.fillText('🐶', 50, state.dogY + 35);

      // Obstacles
      const spawnRate = Math.max(30, Math.floor(100 - (state.speed - 5) * 10));
      if (state.frame % spawnRate === 0) {
        const isTop = Math.random() > 0.5;
        state.obstacles.push({ 
          x: canvas.width, 
          y: isTop ? 90 : 150,
          type: isTop ? 'top' : 'bottom'
        });
      }

      for (let i = 0; i < state.obstacles.length; i++) {
        const obs = state.obstacles[i];
        obs.x -= state.speed;

        ctx.font = '30px Arial';
        ctx.fillText(obs.type === 'top' ? '🦅' : '🐈', obs.x, obs.y + 30);

        // Collision Check
        if (
          obs.x < 90 &&
          obs.x + 30 > 50 &&
          state.dogY + 35 > obs.y &&
          state.dogY < obs.y + 30
        ) {
          state.active = false;
          setGameOver(true);
        }
      }

      // Cleanup offscreen obstacles
      if (state.obstacles.length > 0 && state.obstacles[0].x < -50) {
        state.obstacles.shift();
        setScore(s => s + 10);
      }

      state.frame++;
      state.speed += 0.005; // slowly increase speed faster than before

      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      state.active = false;
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('mousedown', handleTouch);
      cancelAnimationFrame(animationId);
    };
  }, [gameId]);

  const handleRestart = () => {
    gameState.current.active = false; // ensure previous loop stops
    setGameOver(false);
    setScore(0);
    setGameId(id => id + 1);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in relative z-10 w-full max-w-4xl mx-auto">
      
      {/* Animated Tracker Section */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full bg-white border-4 border-black rounded-3xl p-8 mb-8 shadow-[8px_8px_0px_#000] relative overflow-hidden text-black"
      >
        <h3 className="font-display font-bold uppercase text-xl mb-12 text-center">Status da Missão</h3>

        <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto px-4">
          
          {/* Animated Progress Line */}
          <div className="absolute top-1/2 left-0 w-full h-3 bg-zinc-100 border-2 border-black -z-20 transform -translate-y-1/2 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-yellow-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>

          {/* Rocket tracking the line */}
          <motion.div
            className="absolute top-1/2 -z-10 text-4xl transform -translate-y-1/2"
            initial={{ left: '0%', x: '-50%' }}
            animate={{ left: `${progress}%`, x: '-50%' }}
            transition={{ ease: "linear" }}
          >
            🚀
          </motion.div>
          
          <div className="flex flex-col items-center relative z-10 w-16">
            <motion.div 
              animate={orderStatus === 'pendente' ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`w-10 h-10 md:w-14 md:h-14 rounded-full border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_#000] transition-colors ${progress >= 10 ? 'bg-yellow-400' : 'bg-white text-zinc-300'}`}
            >
              <Clock size={20} />
            </motion.div>
            <span className={`mt-2 text-[10px] md:text-xs text-center font-bold font-display uppercase leading-tight ${progress >= 10 ? 'text-black' : 'text-zinc-400'}`}>Recebido</span>
          </div>
          
          <div className="flex flex-col items-center relative z-10 w-16">
             <motion.div 
               animate={orderStatus === 'cozinha_confirmou' ? { scale: [1, 1.2, 1], y: [0, -5, 0] } : {}}
               transition={{ repeat: Infinity, duration: 1.5 }}
               className={`w-10 h-10 md:w-14 md:h-14 rounded-full border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_#000] transition-colors ${progress >= 30 ? 'bg-yellow-400' : 'bg-white text-zinc-300'}`}
             >
              <CheckCircle size={20} />
            </motion.div>
            <span className={`mt-2 text-[10px] md:text-xs text-center font-bold font-display uppercase leading-tight ${progress >= 30 ? 'text-black' : 'text-zinc-400'}`}>Cozinha</span>
          </div>

          <div className="flex flex-col items-center relative z-10 w-16">
             <motion.div 
               animate={orderStatus === 'em_preparo' ? { scale: [1, 1.2, 1], y: [0, -5, 0] } : {}}
               transition={{ repeat: Infinity, duration: 1.5 }}
               className={`w-10 h-10 md:w-14 md:h-14 rounded-full border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_#000] transition-colors ${progress >= 60 ? 'bg-yellow-400' : 'bg-white text-zinc-300'}`}
             >
              <Flame size={20} />
            </motion.div>
            <span className={`mt-2 text-[10px] md:text-xs text-center font-bold font-display uppercase leading-tight ${progress >= 60 ? 'text-black' : 'text-zinc-400'}`}>Preparo</span>
          </div>
          
          <div className="flex flex-col items-center relative z-10 w-16">
             <motion.div 
               animate={orderStatus === 'a_caminho' ? { scale: [1, 1.2, 1], x: [0, 5, 0] } : {}}
               transition={{ repeat: Infinity, duration: 1.5 }}
               className={`w-10 h-10 md:w-14 md:h-14 rounded-full border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_#000] transition-colors ${progress >= 85 ? 'bg-yellow-400' : 'bg-white text-zinc-300'}`}
             >
              <Truck size={20} />
            </motion.div>
            <span className={`mt-2 text-[10px] md:text-xs text-center font-bold font-display uppercase leading-tight ${progress >= 85 ? 'text-black' : 'text-zinc-400'}`}>Entrega</span>
          </div>
          
          <div className="flex flex-col items-center relative z-10 w-16">
            <motion.div 
               animate={orderStatus === 'entregue' ? { scale: [1, 1.5, 1], rotate: [0, 360] } : {}}
               transition={{ duration: 0.5 }}
               className={`w-10 h-10 md:w-14 md:h-14 rounded-full border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_#000] transition-colors ${progress >= 100 ? 'bg-green-400' : 'bg-white text-zinc-300'}`}
            >
              <CheckCircle size={20} />
            </motion.div>
            <span className={`mt-2 text-[10px] md:text-xs text-center font-bold font-display uppercase leading-tight ${progress >= 100 ? 'text-black' : 'text-zinc-400'}`}>Concluído</span>
          </div>
        </div>
      </motion.div>

      {/* Game Section */}
      <div className="w-full max-w-2xl bg-white border-4 border-black rounded-3xl flex flex-col overflow-hidden relative shadow-[8px_8px_0px_#000]">
        <div className="bg-yellow-400 border-b-4 border-black text-black px-4 py-2 text-xs font-black uppercase text-center tracking-widest font-display">
          O entregador está chegando! Jogue para passar o tempo.
        </div>
        
        <div className="game-bg flex-grow flex flex-col items-center justify-center p-4 relative w-full h-[300px]">
          <canvas 
             ref={canvasRef} 
             width={600} 
             height={200} 
             className="max-w-full"
          />
        
        <div className="absolute top-4 right-4 text-2xl font-mono text-black font-bold comic-text">
          SCORE: {score}
        </div>

        {gameOver && (
          <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm z-10 border-4 border-black m-4">
            <h3 className="text-6xl font-display text-black comic-text-bold mb-4 rotate-[-2deg]">GAME OVER</h3>
            <p className="mb-8 text-center max-w-xs font-bold text-xl text-black">Mas não se preocupe, seu pedido continua a caminho!</p>
            <div className="flex gap-4 flex-col sm:flex-row">
              <button 
                onClick={handleRestart}
                className="px-8 py-3 bg-white border-4 border-black text-black rounded-xl font-bold uppercase tracking-wider hover:bg-zinc-100 shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none transition-all"
              >
                Tentar de Novo
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
      
      {!gameOver && (
        <button 
          onClick={onFinishOrder}
          className="mt-12 px-8 py-3 bg-white border-4 border-black text-black font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-100 transition-all shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none"
        >
          (Dev: Pular para "Entregue")
        </button>
      )}
    </div>
  );
}
