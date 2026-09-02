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
    if (!order?.id) return;

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
  
  const howlAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    howlAudio.current = new Audio('/dog-howl.mp3');
    howlAudio.current.volume = 0.5;
  }, []);

  const playBark = () => {
    try {
      if (howlAudio.current) {
        howlAudio.current.currentTime = 0;
        howlAudio.current.play().catch(e => console.log('Howl error:', e));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const dogImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      dogImageRef.current = img;
    };
    img.src = '/cochirrinho16bit.png';
    if (img.complete) {
      dogImageRef.current = img;
    }
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
        const spawnRate = Math.max(60, Math.floor(120 - (state.speed - 5) * 12));
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
      if (state.speed < 12) { state.speed += 0.003; }

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
    <div className={`flex flex-col items-center justify-center px-4 animate-fade-in relative z-10 w-full mx-auto ${order ? "min-h-[80vh] max-w-4xl" : "min-h-[calc(100vh-120px)] max-w-lg pb-12"}`}>
      
      {/* Animated Tracker Section */}
      {order && (
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

            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm border ${progress >= 10 ? 'bg-yellow-400 border-black' : 'bg-zinc-100 border-stone-200 text-stone-400'}`}>
                <Clock size={24} className={progress >= 10 ? 'text-black' : ''} />
              </div>
              <span className={`text-xs font-bold uppercase ${progress >= 10 ? 'text-black' : 'text-stone-400'}`}>Pendente</span>
            </div>

            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm border ${progress >= 60 ? 'bg-yellow-400 border-black' : 'bg-zinc-100 border-stone-200 text-stone-400'}`}>
                <Flame size={24} className={progress >= 60 ? 'text-black' : ''} />
              </div>
              <span className={`text-xs font-bold uppercase ${progress >= 60 ? 'text-black' : 'text-stone-400'}`}>Preparo</span>
            </div>

            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm border ${progress >= 85 ? 'bg-yellow-400 border-black' : 'bg-zinc-100 border-stone-200 text-stone-400'}`}>
                <Truck size={24} className={progress >= 85 ? 'text-black' : ''} />
              </div>
              <span className={`text-xs font-bold uppercase ${progress >= 85 ? 'text-black' : 'text-stone-400'}`}>A Caminho</span>
            </div>
            
            <div className="flex flex-col items-center gap-2 bg-white px-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm border ${progress >= 100 ? 'bg-green-400 border-black' : 'bg-zinc-100 border-stone-200 text-stone-400'}`}>
                <CheckCircle size={24} className={progress >= 100 ? 'text-black' : ''} />
              </div>
              <span className={`text-xs font-bold uppercase ${progress >= 100 ? 'text-black' : 'text-stone-400'}`}>Entregue</span>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm font-bold text-stone-500 bg-zinc-50 py-3 px-6 rounded-full inline-block border border-stone-200 shadow-inner">
            {orderStatus === 'pendente' && 'Recebemos seu pedido. Aguardando cozinha...'}
            {orderStatus === 'cozinha_confirmou' && 'A cozinha confirmou! Logo começa o preparo.'}
            {orderStatus === 'em_preparo' && 'Seu lanche está na chapa! 🍔🔥'}
            {orderStatus === 'a_caminho' && 'O entregador está a caminho. Prepare a campainha! 🛵'}
            {orderStatus === 'entregue' && 'Pedido Entregue! Bom apetite! 🎉'}
          </div>
        </motion.div>
      )}

      {/* Game Section (Always render) */}
      <div className={`w-full bg-white border border-stone-200 rounded-3xl p-4 sm:p-8 shadow-sm text-center relative overflow-hidden ${order ? "mb-8" : "flex-1 flex flex-col justify-center"}`}>
        <h3 className="font-display font-black uppercase text-2xl mb-2 text-[#4E2A84] tracking-tight">Nickel entrega</h3>
        <p className="text-stone-500 font-bold mb-8">{order ? 'Passe o tempo até seu pedido chegar!' : 'Divirta-se e bata seu recorde!'}</p>
        
        <div className={`relative inline-block border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_#000] ${!order && "w-full max-w-sm mx-auto"}`}>
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={600} 
            className="bg-sky-300 block w-full h-auto object-cover"
            style={{ touchAction: 'none' }}
          />
          
          <div className="absolute top-4 left-4 bg-white border-2 border-black rounded-xl px-4 py-2 font-display font-black text-2xl text-black shadow-[2px_2px_0px_#000]">
            {score}
          </div>

          {countdown !== null && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
              <span className="text-8xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] animate-pulse">
                {countdown}
              </span>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-30 animate-fade-in">
              <h3 className="text-4xl font-display font-black uppercase text-yellow-400 mb-2 drop-shadow-lg tracking-widest">Game Over!</h3>
              <p className="text-white text-xl font-bold mb-6">Você fez {score} pontos!</p>
              
              {order && progress >= 100 ? (
                <p className="text-green-400 font-bold text-xl uppercase mb-8">Pedido Entregue! Bom apetite!</p>
              ) : (
                <>
                  {order && <p className="mb-8 text-center max-w-xs font-bold text-xl text-white">Mas não se preocupe, seu pedido continua a caminho!</p>}
                  <div className="flex gap-4 flex-col sm:flex-row">
                    <button 
                      onClick={handleRestart}
                      className="px-8 py-3 bg-white border-2 border-black text-black rounded-xl font-bold uppercase tracking-wider hover:bg-yellow-400 shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-[0px_0px_0px_#000] transition-all"
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
      
      {/* Conditionally render Dev Button */}
      {order && !gameOver && (
        <button 
          onClick={onFinishOrder}
          className="mt-4 mb-8 px-8 py-3 bg-white border border-stone-200 text-black font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-100 transition-all shadow-sm active:translate-y-1 active:shadow-none"
        >
          (Dev: Pular para "Entregue")
        </button>
      )}

      {/* Conditionally render Post Game Actions & Sections */}
      {order ? (
        <>
          {/* Ações Pós Jogo */}
          <div className="w-full max-w-2xl mt-4 flex flex-col sm:flex-row gap-4 mb-12">
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
        </>
      ) : (
        <div className="w-full max-w-2xl flex justify-center mt-4 mb-16">
          {onClose && (
            <button onClick={onClose} className="px-8 py-4 bg-white border border-stone-200 text-stone-900 font-black uppercase tracking-widest rounded-2xl hover:bg-stone-50 transition-colors shadow-sm">
              Voltar ao Início
            </button>
          )}
        </div>
      )}
    </div>
  );
}