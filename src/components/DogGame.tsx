import React, { useEffect, useRef, useState } from 'react';
import { OrderInfo } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Truck, Utensils, Rocket, Flame, Clock } from 'lucide-react';
import { useToast } from './Toast';
import { subscribeToOrder } from '../lib/db';

interface DogGameProps {
  order: OrderInfo | null;
  onFinishOrder: () => void;
  onClose?: () => void;
  onViewAbout?: () => void;
}

export default function DogGame({ order, onFinishOrder, onClose, onViewAbout }: DogGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
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
    }
  }, [orderStatus, order?.id, addToast]);

  // Handle exiting only when game over AND order is done
  useEffect(() => {
    if (gameOver && orderStatus === 'entregue') {
      const t = setTimeout(() => {
        onFinishOrder();
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [gameOver, orderStatus, onFinishOrder]);

  // Game State Ref to avoid re-renders
  
  const playBark = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.error(e);
    }
  };

  const dogImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/cochirrinho16bit.png';
    img.onload = () => {
      dogImageRef.current = img;
    };
  }, []);

  const gameState = useRef({
    dogY: 150,
    vy: 0,
    gravity: 0.8,
    jumpPower: -12,
    isJumping: false,
    obstacles: [] as { x: number, y: number, type: 'bottom' | 'top' }[],
    smokeParticles: [] as { x: number, y: number, life: number, maxLife: number, size: number }[],
    internalScore: 0,
    speed: 5,
    frame: 0,
    active: true,
    status: 'countdown' as 'countdown' | 'playing',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const state = gameState.current;
    state.active = true;
    state.status = 'countdown';
    state.smokeParticles = [];
    state.internalScore = 0;
    state.obstacles = [];
    state.dogY = 150;
    state.vy = 0;
    state.speed = 5;
    state.frame = 0;
    setScore(0);
    setGameOver(false);
    
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        setCountdown(null);
        state.status = 'playing';
        clearInterval(interval);
      }
    }, 1000);

    const jump = () => {
      if (!state.isJumping && state.active && state.status === 'playing') {
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

      // Smoke Particles
      if (state.frame % 3 === 0) {
        // Spawn smoke at the back of the motorcycle (x approx 40, y approx state.dogY + 30)
        state.smokeParticles.push({
          x: 40 + Math.random() * 10,
          y: state.dogY + 30 + Math.random() * 10,
          life: 0,
          maxLife: 20 + Math.random() * 10,
          size: 5 + Math.random() * 5
        });
      }
      
      for (let i = state.smokeParticles.length - 1; i >= 0; i--) {
        const p = state.smokeParticles[i];
        p.life++;
        p.x -= 2; // move left
        p.y -= 0.5; // drift up
        if (p.life >= p.maxLife) {
          state.smokeParticles.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size + (p.life * 0.2), 0, Math.PI * 2);
          const alpha = Math.max(0, 1 - (p.life / p.maxLife));
          ctx.fillStyle = `rgba(150, 150, 150, ${alpha * 0.5})`;
          ctx.fill();
        }
      }

      // Draw Dog (Image)
      if (dogImageRef.current) {
        ctx.save();
        ctx.translate(70, state.dogY + 30);
        ctx.scale(-1, 1); // flip horizontally
        // 70x70, posicionado para que as rodas fiquem em cima da linha (y=180 quando dogY=150)
        ctx.drawImage(dogImageRef.current, -35, -70, 70, 70);
        ctx.restore();
      } else {
        ctx.font = '40px Arial';
        ctx.fillText('🐶', 50, state.dogY + 35);
      }

      // Restaura a opacidade e a cor antes de desenhar os obstáculos
      ctx.fillStyle = '#000000';
      ctx.globalAlpha = 1.0;

      if (state.status === 'playing') {
        // Obstacles
        const spawnRate = Math.max(30, Math.floor(100 - (state.speed - 5) * 10));
        if (state.frame % spawnRate === 0) {
          const isTop = Math.random() > 0.5;
          state.obstacles.push({ 
            x: canvas.width, 
            y: isTop ? 70 : 145,
            type: isTop ? 'top' : 'bottom'
          });
        }

        for (let i = 0; i < state.obstacles.length; i++) {
          const obs = state.obstacles[i];
          obs.x -= state.speed;
          
          ctx.font = '40px Arial';
          ctx.fillText(obs.type === 'top' ? '🦅' : '🚧', obs.x, obs.y + 35);

          // Collision Check
          const dogHitX = 45;
          const dogHitW = 35;
          const dogHitY = state.dogY - 20;
          const dogHitH = 45;
          
          const obsHitX = obs.x + 5;
          const obsHitW = 30;
          const obsHitY = obs.y + 5;
          const obsHitH = 30;

          if (
            obsHitX < dogHitX + dogHitW &&
            obsHitX + obsHitW > dogHitX &&
            obsHitY < dogHitY + dogHitH &&
            obsHitY + obsHitH > dogHitY
          ) {
            state.active = false;
            setGameOver(true);
          }
        }

        // Cleanup offscreen obstacles
        if (state.obstacles.length > 0 && state.obstacles[0].x < -50) {
          state.obstacles.shift();
          state.internalScore += 1;
          
          if (state.internalScore % 2 === 0) {
             playBark();
          }
          
          setScore(state.internalScore * 10);
        }
        
        state.frame++;
      }
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
        className="w-full bg-white border border-stone-200 rounded-3xl p-8 mb-8 shadow-sm relative overflow-hidden text-black"
      >
        <h3 className="font-display font-bold uppercase text-xl mb-12 text-center">Status da Missão</h3>

        <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto px-4">
          
          {/* Animated Progress Line */}
          <div className="absolute top-1/2 left-0 w-full h-3 bg-zinc-100 border border-stone-200 -z-20 transform -translate-y-1/2 rounded-full overflow-hidden">
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
              className={`w-10 h-10 md:w-14 md:h-14 rounded-full border border-stone-200 flex items-center justify-center shadow-sm transition-colors ${progress >= 10 ? 'bg-yellow-400' : 'bg-white text-zinc-300'}`}
            >
              <Clock size={20} />
            </motion.div>
            <span className={`mt-2 text-[10px] md:text-xs text-center font-bold font-display uppercase leading-tight ${progress >= 10 ? 'text-black' : 'text-zinc-400'}`}>Recebido</span>
          </div>
          
          <div className="flex flex-col items-center relative z-10 w-16">
             <motion.div 
               animate={orderStatus === 'cozinha_confirmou' ? { scale: [1, 1.2, 1], y: [0, -5, 0] } : {}}
               transition={{ repeat: Infinity, duration: 1.5 }}
               className={`w-10 h-10 md:w-14 md:h-14 rounded-full border border-stone-200 flex items-center justify-center shadow-sm transition-colors ${progress >= 30 ? 'bg-yellow-400' : 'bg-white text-zinc-300'}`}
             >
              <CheckCircle size={20} />
            </motion.div>
            <span className={`mt-2 text-[10px] md:text-xs text-center font-bold font-display uppercase leading-tight ${progress >= 30 ? 'text-black' : 'text-zinc-400'}`}>Cozinha</span>
          </div>

          <div className="flex flex-col items-center relative z-10 w-16">
             <motion.div 
               animate={orderStatus === 'em_preparo' ? { scale: [1, 1.2, 1], y: [0, -5, 0] } : {}}
               transition={{ repeat: Infinity, duration: 1.5 }}
               className={`w-10 h-10 md:w-14 md:h-14 rounded-full border border-stone-200 flex items-center justify-center shadow-sm transition-colors ${progress >= 60 ? 'bg-yellow-400' : 'bg-white text-zinc-300'}`}
             >
              <Flame size={20} />
            </motion.div>
            <span className={`mt-2 text-[10px] md:text-xs text-center font-bold font-display uppercase leading-tight ${progress >= 60 ? 'text-black' : 'text-zinc-400'}`}>Preparo</span>
          </div>
          
          <div className="flex flex-col items-center relative z-10 w-16">
             <motion.div 
               animate={orderStatus === 'a_caminho' ? { scale: [1, 1.2, 1], x: [0, 5, 0] } : {}}
               transition={{ repeat: Infinity, duration: 1.5 }}
               className={`w-10 h-10 md:w-14 md:h-14 rounded-full border border-stone-200 flex items-center justify-center shadow-sm transition-colors ${progress >= 85 ? 'bg-yellow-400' : 'bg-white text-zinc-300'}`}
             >
              <Truck size={20} />
            </motion.div>
            <span className={`mt-2 text-[10px] md:text-xs text-center font-bold font-display uppercase leading-tight ${progress >= 85 ? 'text-black' : 'text-zinc-400'}`}>Entrega</span>
          </div>
          
          <div className="flex flex-col items-center relative z-10 w-16">
            <motion.div 
               animate={orderStatus === 'entregue' ? { scale: [1, 1.5, 1], rotate: [0, 360] } : {}}
               transition={{ duration: 0.5 }}
               className={`w-10 h-10 md:w-14 md:h-14 rounded-full border border-stone-200 flex items-center justify-center shadow-sm transition-colors ${progress >= 100 ? 'bg-green-400' : 'bg-white text-zinc-300'}`}
            >
              <CheckCircle size={20} />
            </motion.div>
            <span className={`mt-2 text-[10px] md:text-xs text-center font-bold font-display uppercase leading-tight ${progress >= 100 ? 'text-black' : 'text-zinc-400'}`}>Concluído</span>
          </div>
        </div>

        {/* Live Processing Animation */}
        <div className="mt-10 md:mt-12 text-center flex flex-col items-center justify-center min-h-[40px]">
          <AnimatePresence mode="wait">
            {orderStatus === 'pendente' && (
              <motion.div 
                key="pendente"
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 text-stone-500 bg-stone-100 px-4 py-2 rounded-full border border-stone-200"
              >
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}>
                  <Clock size={16} />
                </motion.div>
                <span className="text-xs font-bold uppercase tracking-widest">Aguardando Restaurante...</span>
              </motion.div>
            )}

            {(orderStatus === 'cozinha_confirmou' || orderStatus === 'em_preparo') && (
              <motion.div 
                key="preparo"
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-3 text-[#F28B20] bg-[#FCF5E3] px-5 py-2.5 rounded-full border border-[#F28B20]/20 shadow-sm"
              >
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  <Flame size={18} />
                </motion.div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black uppercase tracking-widest">Montando seu lanche</span>
                  <motion.span 
                    animate={{ opacity: [0, 1, 0] }} 
                    transition={{ repeat: Infinity, duration: 1.5, times: [0, 0.5, 1] }}
                    className="text-xs font-black"
                  >
                    ...
                  </motion.span>
                </div>
              </motion.div>
            )}

            {orderStatus === 'a_caminho' && (
              <motion.div 
                key="caminho"
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-3 text-[#4E2A84] bg-[#F4EBF6] px-5 py-2.5 rounded-full border border-[#4E2A84]/20 shadow-sm"
              >
                <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  <Truck size={18} />
                </motion.div>
                <span className="text-xs font-black uppercase tracking-widest">Motorista a caminho!</span>
              </motion.div>
            )}

            {orderStatus === 'entregue' && (
              <motion.div 
                key="entregue"
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="flex items-center gap-2 text-green-600 bg-green-50 px-5 py-2.5 rounded-full border border-green-200 shadow-sm"
              >
                <CheckCircle size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Entregue com Sucesso!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Game Section */}
      <div className="w-full max-w-2xl bg-white border border-stone-200 rounded-3xl flex flex-col overflow-hidden relative shadow-sm">
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

        {countdown !== null && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
             <motion.div
               key={countdown}
               initial={{ scale: 0.5, opacity: 0 }}
               animate={{ scale: 1.5, opacity: 1 }}
               exit={{ scale: 2, opacity: 0 }}
               transition={{ duration: 0.5 }}
               className="text-[120px] font-black text-[#F28B20] drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] comic-text"
               style={{ WebkitTextStroke: '3px black' }}
             >
               {countdown}
             </motion.div>
          </div>
        )}
        
        {gameOver && (
          <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm z-10 border border-stone-200 m-4">
            <h3 className="text-6xl font-display text-black comic-text-bold mb-4 rotate-[-2deg]">GAME OVER</h3>
            {orderStatus === 'entregue' ? (
              <p className="mb-8 text-center max-w-xs font-bold text-xl text-black">Seu pedido já foi entregue! Bom apetite!</p>
            ) : (
              <>
                <p className="mb-8 text-center max-w-xs font-bold text-xl text-black">Mas não se preocupe, seu pedido continua a caminho!</p>
                <div className="flex gap-4 flex-col sm:flex-row">
                  <button 
                    onClick={handleRestart}
                    className="px-8 py-3 bg-white border border-stone-200 text-black rounded-xl font-bold uppercase tracking-wider hover:bg-zinc-100 shadow-sm active:translate-y-1 active:shadow-none transition-all"
                  >
                    Tentar de Novo
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </div>
      
      {!gameOver && (
        <button 
          onClick={onFinishOrder}
          className="mt-12 px-8 py-3 bg-white border border-stone-200 text-black font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-100 transition-all shadow-sm active:translate-y-1 active:shadow-none"
        >
          (Dev: Pular para "Entregue")
        </button>
      )}

      {/* Ações Pós Jogo */}
      <div className="w-full max-w-2xl mt-8 flex flex-col sm:flex-row gap-4 mb-12">
        <button onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }} className="flex-1 bg-[#F28B20] text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-orange-500 transition-colors shadow-lg">
          Acompanhar Pedido
        </button>
        {onClose && (
          <button onClick={onClose} className="flex-1 bg-white border border-stone-200 text-stone-900 font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-stone-50 transition-colors shadow-sm">
            Voltar ao Início
          </button>
        )}
      </div>

      {/* Entretenimento: Jornada e Cozinha */}
      <div className="w-full max-w-2xl bg-white border border-stone-200 rounded-3xl p-8 mb-12 shadow-sm text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4EBF6] rounded-bl-full -z-10 opacity-50"></div>
        <h3 className="font-display font-black uppercase text-2xl mb-4 text-[#4E2A84] tracking-tight">Saiba um pouco mais sobre a nossa jornada</h3>
        <p className="text-stone-600 font-medium mb-6 leading-relaxed">Enquanto seu lanche está sendo preparado com todo carinho, que tal conhecer a história de quem faz a mágica acontecer? Nossa paixão por qualidade vem de longe.</p>
        
        {onViewAbout && (
          <button onClick={onViewAbout} className="text-[#F28B20] font-bold uppercase tracking-wider text-sm flex items-center gap-2 hover:gap-3 transition-all">
            Ler História Completa <span>&rarr;</span>
          </button>
        )}
      </div>

      <div className="w-full max-w-2xl bg-stone-900 text-white border border-stone-800 rounded-3xl p-8 mb-16 shadow-xl text-left relative overflow-hidden">
        <h3 className="font-display font-black uppercase text-2xl mb-6 text-[#F28B20] tracking-tight">Como é a nossa cozinha</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-stone-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-3">🔥</span>
            <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">Chapa a 200°C</h4>
            <p className="text-xs text-stone-400">Selando a carne no ponto certo</p>
          </div>
          <div className="bg-stone-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-3">🧼</span>
            <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">Higiene Nível Ouro</h4>
            <p className="text-xs text-stone-400">Limpeza rigorosa e industrial</p>
          </div>
          <div className="bg-stone-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-3">🥬</span>
            <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">Ingredientes Frescos</h4>
            <p className="text-xs text-stone-400">Selecionados todos os dias</p>
          </div>
          <div className="bg-stone-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-3">📦</span>
            <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">Embalagem Térmica</h4>
            <p className="text-xs text-stone-400">O lanche chega quente e crocante</p>
          </div>
        </div>

        {/* Imagens da Cozinha */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 mt-8">
          <img src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=600&auto=format&fit=crop" alt="Preparo cuidadoso" className="w-full h-32 object-cover rounded-xl shadow-md hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
          <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600&auto=format&fit=crop" alt="Chapa quente" className="w-full h-32 object-cover rounded-xl shadow-md hover:scale-105 transition-transform duration-300 hidden md:block" referrerPolicy="no-referrer" />
          <img src="https://images.unsplash.com/photo-1572656306390-40a9fc3899f7?q=80&w=600&auto=format&fit=crop" alt="Ingredientes frescos" className="w-full h-32 object-cover rounded-xl shadow-md hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
        </div>

        <div className="bg-[#F28B20] text-stone-900 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-bl-full -z-10"></div>
          <h4 className="font-display font-black uppercase text-xl mb-2">Feito com muito carinho! ❤️</h4>
          <p className="text-sm font-bold opacity-90 leading-relaxed">
            Seu lanche está sendo preparado agora mesmo, com os melhores ingredientes.
            Nossa embalagem térmica especial garante que ele chegue fresquinho, quentinho e MUITO gostoso até você!
          </p>
        </div>
      </div>

      {/* Feedbacks de Clientes */}
      <div className="w-full max-w-2xl mb-16">
        <h3 className="font-display font-black uppercase text-2xl mb-6 text-[#4E2A84] tracking-tight text-center">O que dizem sobre nós</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-[#F28B20] text-sm">⭐⭐⭐⭐⭐</div>
              <span className="text-stone-400 text-xs font-bold">Há 2 dias</span>
            </div>
            <p className="text-stone-700 text-sm italic mb-4">"Melhor lanche da cidade! Chegou super quente e o pão é incrivelmente macio. Recomendo de olhos fechados."</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-500 text-xs">M</div>
              <span className="font-bold text-stone-900 text-sm">Mariana Silva</span>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-[#F28B20] text-sm">⭐⭐⭐⭐⭐</div>
              <span className="text-stone-400 text-xs font-bold">Hoje</span>
            </div>
            <p className="text-stone-700 text-sm italic mb-4">"A batata frita chegou crocante, o que é um milagre no delivery! O molho verde é um espetáculo à parte."</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-500 text-xs">R</div>
              <span className="font-bold text-stone-900 text-sm">Rafael Costa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
