import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OrderInfo } from '../types';
import { motion } from 'motion/react';
import { 
  CheckCircle, 
  MessageCircle, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Zap,
  Shield,
  Magnet,
  Keyboard
} from 'lucide-react';
import { useToast } from './Toast';
import { subscribeToOrder, addXpToUser } from '../lib/db';
import { auth } from '../lib/firebase';
import { playSound } from '../lib/audio';

interface DogGameProps {
  order: OrderInfo | null;
  onFinishOrder: () => void;
  onClose?: () => void;
  onViewAbout?: () => void;
}

// Tipos do Jogo
interface FoodItem {
  id: number;
  x: number;
  y: number;
  type: 'burger' | 'hotdog' | 'fries' | 'soda' | 'coin';
  points: number;
  emoji: string;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  type: 'cone' | 'bird' | 'hydrant';
  emoji: string;
  smashed?: boolean;
}

interface PowerUpItem {
  id: number;
  x: number;
  y: number;
  type: 'turbo' | 'magnet' | 'shield';
  emoji: string;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export default function DogGame({ order, onFinishOrder, onClose, onViewAbout }: DogGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('nickel_dog_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [foodsEaten, setFoodsEaten] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('nickel_dog_muted') === 'true';
    } catch {
      return false;
    }
  });

  // Refs estáveis para impedir qualquer reinício indesejado do loop do jogo
  const highScoreRef = useRef(highScore);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const [activePowerUp, setActivePowerUp] = useState<'turbo' | 'magnet' | 'shield' | null>(null);
  const [hasShield, setHasShield] = useState(false);
  const { addToast } = useToast();

  const [orderStatus, setOrderStatus] = useState<'pendente' | 'cozinha_confirmou' | 'em_preparo' | 'a_caminho' | 'entregue'>('pendente');
  const [progress, setProgress] = useState(0);
  const [gameId, setGameId] = useState(0);

  // Som seguro que respeita o Mudo sem recriar referências
  const safePlaySound = useCallback((type: Parameters<typeof playSound>[0]) => {
    if (isMutedRef.current) return;
    try {
      playSound(type);
    } catch {}
  }, []);

  const toggleSound = () => {
    setIsMuted(prev => {
      const next = !prev;
      isMutedRef.current = next;
      localStorage.setItem('nickel_dog_muted', String(next));
      return next;
    });
  };

  // Helper de WhatsApp
  const handleSendToWhatsApp = () => {
    if (order?.whatsappMessage) {
      const phone = '5554999598389';
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(order.whatsappMessage)}`, '_blank');
      addToast({
        title: 'Abrindo WhatsApp...',
        message: 'Pedido encaminhado com sucesso!',
        type: 'success'
      });
    }
  };

  const handleExitGame = () => {
    handleSendToWhatsApp();
    if (onClose) {
      onClose();
    }
  };

  // Status do Pedido via Firestore (jogo nunca fecha sozinho)
  useEffect(() => {
    if (!order?.id) return;
    const unsub = subscribeToOrder(order.id, (orderData) => {
      if (orderData.status) {
        const status = orderData.status as any;
        setOrderStatus(status);
        switch (status) {
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

  const deliveredToastShownRef = useRef(false);
  useEffect(() => {
    if (order?.id && orderStatus === 'entregue' && !deliveredToastShownRef.current) {
      deliveredToastShownRef.current = true;
      addToast({
        title: 'Entrega Concluída',
        message: 'Seu lanche chegou! Bom apetite! Você pode continuar jogando à vontade.',
        type: 'success'
      });
    }
  }, [orderStatus, order?.id]);

  // Cachorrinho Sprite
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

  // Latido com howl
  const howlAudio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    howlAudio.current = new Audio('/dog-howl.mp3');
    howlAudio.current.volume = 0.5;
  }, []);

  // Jingle Nickel Lanches em loop suave de fundo (som ambiente não tão alto)
  const bgJingleRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    // encodeURI para garantir leitura correta do nome com espaços e compatibilidade
    const audio = new Audio('/JINGLE%20NICKEL%20LANCHES.wav');
    audio.loop = true;
    audio.volume = 0.22; // volume ambiente baixo e agradável
    bgJingleRef.current = audio;

    const playIfAllowed = () => {
      if (!isMutedRef.current && bgJingleRef.current) {
        bgJingleRef.current.play().catch(() => {
          // Os navegadores podem exigir interação inicial antes do áudio tocar
        });
      }
    };

    // Tentar tocar
    playIfAllowed();

    // Em navegadores que bloqueiam autoplay sem interação do usuário, tocar no primeiro toque ou clique na tela
    const handleFirstInteraction = () => {
      playIfAllowed();
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  // Controlar o volume/mudo do jingle quando o jogador clicar no botão de som
  useEffect(() => {
    if (!bgJingleRef.current) return;
    if (isMuted) {
      bgJingleRef.current.pause();
    } else {
      bgJingleRef.current.play().catch(() => {});
    }
  }, [isMuted]);

  const playBark = useCallback(() => {
    if (isMutedRef.current) return;
    try {
      if (howlAudio.current) {
        howlAudio.current.currentTime = 0;
        howlAudio.current.play().catch(() => {});
      }
    } catch {
      // Ignora erro de áudio
    }
  }, []);

  // Estado da Física e Jogo Infinito
  const gameState = useRef({
    // Dog Physics
    dogY: 180,
    vy: 0,
    gravity: 0.72,
    jumpPower: -13.5,
    isJumping: false,
    groundY: 180,

    // Invulnerabilidade temporária pós-tropeço
    invulnerableTimer: 0,

    // Entidades
    obstacles: [] as Obstacle[],
    foods: [] as FoodItem[],
    powerUps: [] as PowerUpItem[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],

    // Cenário Parallax
    clouds: [
      { x: 50, y: 30, speed: 0.4, scale: 1 },
      { x: 220, y: 50, speed: 0.25, scale: 0.8 },
      { x: 380, y: 20, speed: 0.5, scale: 1.2 },
    ],
    skylineOffset: 0,
    billboardOffset: 0,
    roadMarkingOffset: 0,

    // Power-ups Ativos
    turboTimer: 0,
    magnetTimer: 0,
    hasShield: false,

    // Pontuação e Progressão Infinita
    score: 0,
    foodsEaten: 0,
    speed: 5.5,
    frame: 0,
    barkTimer: 0,
    active: true,
    status: 'countdown' as 'countdown' | 'playing',
    nextId: 1
  });

  // Jump Trigger com feedback háptico (vibração) para celular
  const triggerJump = useCallback(() => {
    const state = gameState.current;
    if (!state.isJumping && state.active && state.status === 'playing') {
      state.vy = state.jumpPower;
      state.isJumping = true;
      safePlaySound('jump');

      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(25);
        } catch {}
      }

      for (let i = 0; i < 6; i++) {
        state.particles.push({
          x: 70 + (Math.random() * 20 - 10),
          y: state.groundY + 28,
          vx: -(Math.random() * 3 + 1),
          vy: -(Math.random() * 2),
          color: '#D4C5B9',
          life: 0,
          maxLife: 15,
          size: Math.random() * 4 + 2
        });
      }
    }
  }, [safePlaySound]);

  // Loop Principal do Jogo Infinito
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const state = gameState.current;
    state.active = true;
    state.status = 'countdown';
    state.dogY = state.groundY;
    state.vy = 0;
    state.isJumping = false;
    state.obstacles = [];
    state.foods = [];
    state.powerUps = [];
    state.particles = [];
    state.floatingTexts = [];
    state.turboTimer = 0;
    state.magnetTimer = 0;
    state.hasShield = false;
    state.invulnerableTimer = 0;
    state.score = 0;
    state.foodsEaten = 0;
    state.speed = 5.5;
    state.frame = 0;
    state.barkTimer = 0;

    setScore(0);
    setFoodsEaten(0);
    setActivePowerUp(null);
    setHasShield(false);

    // Contagem Regressiva
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        safePlaySound('coin');
      } else {
        setCountdown(null);
        state.status = 'playing';
        safePlaySound('laser');
        clearInterval(interval);
      }
    }, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        triggerJump();
      }
    };

    const handleTouch = (e: Event) => {
      e.preventDefault();
      triggerJump();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('mousedown', handleTouch);

    // --- GAME LOOP INFINITO (ROBUSTO & ININTERRUPTO) ---
    const loop = () => {
      if (!state.active) return;
      animationId = requestAnimationFrame(loop);

      try {
        const W = canvas.width;
        const H = canvas.height;
        const effectiveSpeed = state.turboTimer > 0 ? state.speed * 1.5 : state.speed;

        ctx.clearRect(0, 0, W, H);

      // Função que desenha emojis 100% SÓLIDOS com a COR ORIGINAL
      const drawSolidEmoji = (emoji: string, x: number, y: number, size = 32) => {
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000000'; // Força opacidade plena
        ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", sans-serif`;
        ctx.fillText(emoji, x, y);
        ctx.restore();
      };

      // 1. CÉU EM DEGRADÊ
      const skyGradient = ctx.createLinearGradient(0, 0, 0, 200);
      skyGradient.addColorStop(0, '#5BB6E8');
      skyGradient.addColorStop(0.7, '#A8E0FF');
      skyGradient.addColorStop(1, '#E9F6FF');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, W, 200);

      // Sol brilhante
      ctx.beginPath();
      ctx.arc(W - 60, 45, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#FFE66D';
      ctx.fill();

      // Nuvens Animadas
      state.clouds.forEach(c => {
        if (state.status === 'playing') {
          c.x -= c.speed * (effectiveSpeed / 5);
          if (c.x < -80) c.x = W + 40;
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 16 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 14 * c.scale, c.y - 6 * c.scale, 20 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 32 * c.scale, c.y, 16 * c.scale, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. SILHUETA DOS PRÉDIOS DE PASSO FUNDO (Parallax Layer)
      if (state.status === 'playing') {
        state.skylineOffset = (state.skylineOffset + effectiveSpeed * 0.25) % 120;
      }
      ctx.fillStyle = '#8B9EB3';
      const bldgWidths = [45, 30, 60, 40, 50, 35, 55, 40, 65, 35];
      const bldgHeights = [70, 95, 60, 110, 80, 65, 90, 75, 105, 70];
      let bx = -state.skylineOffset;
      for (let i = 0; i < 15; i++) {
        const idx = i % bldgWidths.length;
        const bw = bldgWidths[idx];
        const bh = bldgHeights[idx];
        ctx.fillRect(bx, 195 - bh, bw, bh);

        ctx.fillStyle = 'rgba(255, 248, 200, 0.6)';
        for (let wy = 195 - bh + 10; wy < 185; wy += 14) {
          ctx.fillRect(bx + 6, wy, 5, 6);
          if (bw > 35) ctx.fillRect(bx + 18, wy, 5, 6);
          if (bw > 50) ctx.fillRect(bx + 30, wy, 5, 6);
        }
        ctx.fillStyle = '#8B9EB3';
        bx += bw + 8;
      }

      // 3. PLACAS DA NICKEL LANCHES NA ESTRADA
      if (state.status === 'playing') {
        state.billboardOffset = (state.billboardOffset + effectiveSpeed * 0.6) % 600;
      }
      const boardX = 400 - state.billboardOffset;
      if (boardX > -150 && boardX < W + 100) {
        ctx.fillStyle = '#5A5A66';
        ctx.fillRect(boardX + 40, 130, 6, 70);

        ctx.fillStyle = '#F28B20';
        ctx.strokeStyle = '#4E2A84';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(boardX, 105, 90, 32, 6);
        } else {
          ctx.rect(boardX, 105, 90, 32);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'black 10px sans-serif';
        ctx.fillText('NICKEL 🍔', boardX + 16, 122);
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('PASSO FUNDO', boardX + 13, 132);
      }

      // 4. CALÇADA & GUIA (Curb)
      ctx.fillStyle = '#C8C2BC';
      ctx.fillRect(0, 195, W, 15);

      ctx.strokeStyle = '#F28B20';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 210);
      ctx.lineTo(W, 210);
      ctx.stroke();

      // 5. ASFALTO DA PISTA
      ctx.fillStyle = '#2A2C35';
      ctx.fillRect(0, 210, W, H - 210);

      // Faixas centrais brancas tracejadas
      if (state.status === 'playing') {
        state.roadMarkingOffset = (state.roadMarkingOffset + effectiveSpeed) % 40;
      }
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -state.roadMarkingOffset;
      ctx.beginPath();
      ctx.moveTo(0, 255);
      ctx.lineTo(W, 255);
      ctx.stroke();
      ctx.setLineDash([]);

      // 6. FÍSICA DO CACHORRINHO
      state.vy += state.gravity;
      state.dogY += state.vy;

      if (state.dogY >= state.groundY) {
        state.dogY = state.groundY;
        state.isJumping = false;
        state.vy = 0;
      }

      // 7. PARTÍCULAS DE FUMAÇA & FOGO
      const isTurbo = state.turboTimer > 0;
      if (state.frame % (isTurbo ? 1 : 3) === 0) {
        state.particles.push({
          x: 40 + Math.random() * 8,
          y: state.dogY + 25 + Math.random() * 8,
          vx: -(Math.random() * 3 + (isTurbo ? 5 : 2)),
          vy: -(Math.random() * 1.5 - 0.5),
          color: isTurbo 
            ? (Math.random() > 0.5 ? '#FF4500' : '#FFD700') 
            : 'rgba(180, 180, 180, 0.6)',
          life: 0,
          maxLife: isTurbo ? 15 : 22,
          size: isTurbo ? Math.random() * 6 + 4 : Math.random() * 4 + 3
        });
      }

      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        if (p.life >= p.maxLife) {
          state.particles.splice(i, 1);
        } else {
          const alpha = 1 - (p.life / p.maxLife);
          ctx.fillStyle = p.color.startsWith('rgba') 
            ? p.color 
            : `rgba(255, 100, 0, ${alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - p.life / p.maxLife * 0.3), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 8. DESENHA O CACHORRINHO (com efeito de piscar se invulnerável)
      const isBlinking = state.invulnerableTimer > 0 && Math.floor(state.invulnerableTimer / 6) % 2 === 1;
      if (!isBlinking) {
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.translate(75, state.dogY + 30);
        ctx.scale(-1, 1);

        if (dogImageRef.current) {
          const shakeX = isTurbo ? (Math.random() * 3 - 1.5) : 0;
          const shakeY = isTurbo ? (Math.random() * 3 - 1.5) : 0;
          ctx.drawImage(dogImageRef.current, -35 + shakeX, -70 + shakeY, 70, 70);
        } else {
          drawSolidEmoji('🐶', 0, -35, 40);
        }
        ctx.restore();
      }

      // Aura do ÍMÃ DE LANCHES
      if (state.magnetTimer > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(0, 180, 255, ${0.7 + Math.sin(state.frame * 0.2) * 0.3})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(75, state.dogY + 5, 45 + Math.sin(state.frame * 0.3) * 6, 0, Math.PI * 2);
        ctx.stroke();

        drawSolidEmoji('⚡', 85, state.dogY - 30, 20);
        ctx.restore();
      }

      // Aura do ESCUDO DOURADO
      if (state.hasShield) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 + Math.sin(state.frame * 0.2) * 0.2})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(75, state.dogY + 5, 42, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 230, 100, 0.25)';
        ctx.fill();
        ctx.restore();
      }

      // Efeito de Fala / Latido
      if (state.barkTimer > 0) {
        state.barkTimer--;
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.font = 'bold 13px sans-serif';
        const barkText = 'Au au! 🐾';
        const tw = ctx.measureText(barkText).width;
        const bx = 85;
        const by = state.dogY - 45;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by - 16, tw + 14, 24, 6);
        else ctx.rect(bx, by - 16, tw + 14, 24);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#4E2A84';
        ctx.fillText(barkText, bx + 7, by);
        ctx.restore();
      }

      // 9. SPAWN E ATUALIZAÇÃO INFINITA
      if (state.status === 'playing') {
        state.frame++;

        // Timers dos Power-ups e Invulnerabilidade
        if (state.turboTimer > 0) {
          state.turboTimer--;
          if (state.turboTimer === 0) setActivePowerUp(null);
        }
        if (state.magnetTimer > 0) {
          state.magnetTimer--;
          if (state.magnetTimer === 0) setActivePowerUp(null);
        }
        if (state.invulnerableTimer > 0) {
          state.invulnerableTimer--;
        }

        // A. SPAWN DE COMIDAS DO CARDÁPIO (A cada 50 frames)
        if (state.frame % 50 === 0) {
          const foodOptions = [
            { type: 'burger', emoji: '🍔', points: 25 },
            { type: 'hotdog', emoji: '🌭', points: 20 },
            { type: 'fries', emoji: '🍟', points: 15 },
            { type: 'soda', emoji: '🥤', points: 10 },
            { type: 'coin', emoji: '⭐', points: 10 },
          ] as const;
          const chosen = foodOptions[Math.floor(Math.random() * foodOptions.length)];
          const isHigh = Math.random() > 0.45;
          state.foods.push({
            id: state.nextId++,
            x: W + 20,
            y: isHigh ? 120 : 185,
            type: chosen.type,
            points: chosen.points,
            emoji: chosen.emoji
          });
        }

        // B. SPAWN DE POWER-UPS RAROS (A cada 320 frames)
        if (state.frame % 320 === 0) {
          const powerTypes = [
            { type: 'turbo', emoji: '🚀' },
            { type: 'magnet', emoji: '⚡' },
            { type: 'shield', emoji: '⭐' },
          ] as const;
          const chosen = powerTypes[Math.floor(Math.random() * powerTypes.length)];
          state.powerUps.push({
            id: state.nextId++,
            x: W + 30,
            y: 130,
            type: chosen.type,
            emoji: chosen.emoji
          });
        }

        // C. SPAWN DE OBSTÁCULOS COM ESPAÇAMENTO SEGURO INFINITO
        const obsInterval = Math.max(90, Math.floor(140 - (state.speed - 5.5) * 10));
        if (state.frame % obsInterval === 0) {
          const isFlying = Math.random() > 0.55;
          state.obstacles.push({
            id: state.nextId++,
            x: W + 20,
            y: isFlying ? 115 : 185,
            type: isFlying ? 'bird' : 'cone',
            emoji: isFlying ? '🦇' : '⚠️'
          });
        }

        // D. PROCESSA COMIDAS COM COR ORIGINAL 100% SÓLIDA
        const dogCenter = { x: 75, y: state.dogY + 10 };
        for (let i = state.foods.length - 1; i >= 0; i--) {
          const food = state.foods[i];

          // Ímã atrai itens
          if (state.magnetTimer > 0) {
            const dx = dogCenter.x - food.x;
            const dy = dogCenter.y - food.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 260) {
              food.x += (dx / dist) * 9.5;
              food.y += (dy / dist) * 9.5;
            }
          }

          food.x -= effectiveSpeed;

          const bob = Math.sin(state.frame * 0.15 + food.id) * 3;
          drawSolidEmoji(food.emoji, food.x + 14, food.y + bob + 14, 30);

          // Coleta comida
          const distToDog = Math.hypot(food.x - dogCenter.x, food.y - dogCenter.y);
          if (distToDog < 42) {
            state.score += food.points;
            state.foodsEaten++;
            setScore(state.score);
            setFoodsEaten(state.foodsEaten);

            // Atualiza recorde em tempo real usando ref estável
            if (state.score > highScoreRef.current) {
              highScoreRef.current = state.score;
              setHighScore(state.score);
              try {
                localStorage.setItem('nickel_dog_highscore', String(state.score));
              } catch {}
            }

            safePlaySound(food.type === 'coin' ? 'coin' : 'chomp');
            state.floatingTexts.push({
              id: state.nextId++,
              x: food.x,
              y: food.y - 10,
              text: `+${food.points}`,
              color: '#FFD700',
              life: 0,
              maxLife: 30
            });

            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
              try { navigator.vibrate(20); } catch {}
            }

            for (let p = 0; p < 8; p++) {
              state.particles.push({
                x: food.x + 10,
                y: food.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: '#FFEA00',
                life: 0,
                maxLife: 20,
                size: Math.random() * 3 + 2
              });
            }

            state.foods.splice(i, 1);
            continue;
          }

          if (food.x < -40) {
            state.foods.splice(i, 1);
          }
        }

        // E. PROCESSA POWER-UPS COM COR 100% SÓLIDA
        for (let i = state.powerUps.length - 1; i >= 0; i--) {
          const pup = state.powerUps[i];
          pup.x -= effectiveSpeed;

          drawSolidEmoji(pup.emoji, pup.x + 16, pup.y + 16, 34);

          const dist = Math.hypot(pup.x - dogCenter.x, pup.y - dogCenter.y);
          if (dist < 45) {
            if (pup.type === 'turbo') {
              state.turboTimer = 300; // ~5 segundos
              setActivePowerUp('turbo');
              safePlaySound('turbo');
              state.floatingTexts.push({
                id: state.nextId++,
                x: pup.x,
                y: pup.y - 15,
                text: 'TURBO MOTOBOY! 🚀',
                color: '#FF4500',
                life: 0,
                maxLife: 40
              });
            } else if (pup.type === 'magnet') {
              state.magnetTimer = 360; // ~6 segundos
              setActivePowerUp('magnet');
              safePlaySound('powerup');
              state.floatingTexts.push({
                id: state.nextId++,
                x: pup.x,
                y: pup.y - 15,
                text: 'ÍMÃ DE LANCHES! ⚡',
                color: '#00D2FF',
                life: 0,
                maxLife: 40
              });
            } else if (pup.type === 'shield') {
              state.hasShield = true;
              setHasShield(true);
              safePlaySound('shield');
              state.floatingTexts.push({
                id: state.nextId++,
                x: pup.x,
                y: pup.y - 15,
                text: 'ESCUDO ATIVO! ⭐',
                color: '#FFD700',
                life: 0,
                maxLife: 40
              });
            }

            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
              try { navigator.vibrate([30, 40, 30]); } catch {}
            }

            state.powerUps.splice(i, 1);
            continue;
          }

          if (pup.x < -40) {
            state.powerUps.splice(i, 1);
          }
        }

        // F. PROCESSA OBSTÁCULOS (MODO INFINITO CONTÍNUO: NUNCA PARA O JOGO!)
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
          const obs = state.obstacles[i];
          obs.x -= effectiveSpeed;

          drawSolidEmoji(obs.emoji, obs.x + 16, obs.y + 20, 36);

          const dogHitBox = {
            x: 55,
            y: state.dogY - 15,
            w: 40,
            h: 45
          };

          const obsHitBox = {
            x: obs.x + 4,
            y: obs.y + 2,
            w: 26,
            h: 26
          };

          const isColliding = (
            dogHitBox.x < obsHitBox.x + obsHitBox.w &&
            dogHitBox.x + dogHitBox.w > obsHitBox.x &&
            dogHitBox.y < obsHitBox.y + obsHitBox.h &&
            dogHitBox.y + dogHitBox.h > obsHitBox.y
          );

          if (isColliding && !obs.smashed) {
            // Se estiver no período invulnerável: ignora colisão
            if (state.invulnerableTimer > 0) {
              continue;
            }

            // Se estiver no TURBO: destrói obstáculo e ganha pontos extras!
            if (state.turboTimer > 0) {
              obs.smashed = true;
              state.score += 50;
              setScore(state.score);
              safePlaySound('laser');

              state.floatingTexts.push({
                id: state.nextId++,
                x: obs.x,
                y: obs.y - 10,
                text: 'DESTRUIU! +50 💥',
                color: '#FF6600',
                life: 0,
                maxLife: 35
              });

              for (let p = 0; p < 12; p++) {
                state.particles.push({
                  x: obs.x + 10,
                  y: obs.y,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  color: '#FF4500',
                  life: 0,
                  maxLife: 25,
                  size: Math.random() * 4 + 3
                });
              }
              state.obstacles.splice(i, 1);
              continue;
            }

            // Se tiver ESCUDO: o escudo absorve o impacto
            if (state.hasShield) {
              state.hasShield = false;
              setHasShield(false);
              state.invulnerableTimer = 60; // 1s de proteção
              safePlaySound('shield');

              state.floatingTexts.push({
                id: state.nextId++,
                x: 75,
                y: state.dogY - 20,
                text: 'ESCUDO SALVOU! ⭐',
                color: '#FFD700',
                life: 0,
                maxLife: 35
              });

              state.obstacles.splice(i, 1);
              continue;
            }

            // JOGO INFINITO: Tropeça, perde uma pequena penalidade de pontos e SEGUE CORRENDO!
            state.invulnerableTimer = 90; // 1.5s invulnerável
            state.score = Math.max(0, state.score - 15);
            setScore(state.score);
            safePlaySound('crash');

            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
              try { navigator.vibrate(60); } catch {}
            }

            state.floatingTexts.push({
              id: state.nextId++,
              x: 75,
              y: state.dogY - 20,
              text: 'TROPEÇOU! -15 pts 💥',
              color: '#FF4500',
              life: 0,
              maxLife: 35
            });

            for (let p = 0; p < 8; p++) {
              state.particles.push({
                x: 75,
                y: state.dogY,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: '#FFD700',
                life: 0,
                maxLife: 20,
                size: Math.random() * 3 + 2
              });
            }

            // Remove obstáculo para seguir viagem sem travar
            state.obstacles.splice(i, 1);
            continue;
          }

          // Pontuação por desviar
          if (obs.x < -40) {
            state.obstacles.splice(i, 1);
            state.score += 10;
            setScore(state.score);

            if (state.score > highScoreRef.current) {
              highScoreRef.current = state.score;
              setHighScore(state.score);
              try {
                localStorage.setItem('nickel_dog_highscore', String(state.score));
              } catch {}
            }

            if (state.score > 0 && state.score % 100 === 0) {
              playBark();
              state.barkTimer = 35;
            }
          }
        }

        // G. PROCESSA TEXTOS FLUTUANTES
        for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
          const ft = state.floatingTexts[i];
          ft.life++;
          ft.y -= 1.2;
          if (ft.life >= ft.maxLife) {
            state.floatingTexts.splice(i, 1);
          } else {
            const alpha = 1 - (ft.life / ft.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = 'black 14px "Russo One", sans-serif';
            ctx.fillStyle = ft.color;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(ft.text, ft.x, ft.y);
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
          }
        }

        // Aceleração suave com limite máximo equilibrado (máx 6.8 para ser 100% infinito)
        if (state.speed < 6.8) {
          state.speed += 0.001;
        }
      }
    } catch (err) {
      console.error('Erro na renderização do jogo:', err);
    }
  };

    loop();

    return () => {
      state.active = false;
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('mousedown', handleTouch);
      cancelAnimationFrame(animationId);
    };
  }, [gameId]);

  // Reiniciar a corrida do zero
  const handleRestart = () => {
    gameState.current.active = false;
    setScore(0);
    setFoodsEaten(0);
    setActivePowerUp(null);
    setHasShield(false);
    setGameId(id => id + 1);
  };

  return (
    <div className={`flex flex-col items-center justify-center px-2 sm:px-4 animate-fade-in relative z-10 w-full mx-auto ${order ? "min-h-[80vh] max-w-4xl" : "min-h-[calc(100vh-120px)] max-w-lg pb-10"}`}>
      
      {/* Tracker do Pedido (quando em pedido real) */}
      {order && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full bg-white border-2 border-stone-200 rounded-3xl p-5 md:p-8 mb-4 sm:mb-6 shadow-sm relative overflow-hidden text-black flex flex-col items-center justify-center text-center"
        >
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2.5">
            <CheckCircle size={30} />
          </div>
          <h3 className="font-display font-black uppercase text-xl sm:text-2xl mb-1 text-stone-900">
            Pedido Confirmado!
          </h3>
          <p className="text-stone-600 font-medium max-w-lg mx-auto text-xs sm:text-sm leading-relaxed mb-3.5">
            Divirta-se com o minigame infinito enquanto seu lanche entra em preparo! Você pode correr o tempo que quiser.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={handleSendToWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle size={15} /> Encaminhar p/ WhatsApp
            </button>
            {onClose && (
              <button
                onClick={handleExitGame}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Sair e Voltar</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Caixa do Jogo Infinito */}
      <div className={`w-full bg-white border border-stone-200 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-md text-center relative overflow-hidden select-none ${order ? "mb-6" : "flex-1 flex flex-col justify-center"}`}>
        
        {/* Cabeçalho do Minigame */}
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <div className="text-left">
            <h3 className="font-display font-black uppercase text-lg sm:text-2xl text-[#4E2A84] tracking-tight flex items-center gap-1.5 sm:gap-2">
              <span>Nickel Entrega</span>
              <span className="text-[10px] sm:text-xs bg-[#F28B20] text-white px-1.5 sm:px-2 py-0.5 rounded-full font-sans font-bold">CORRIDA INFINITA</span>
            </h3>
            <p className="text-stone-500 font-bold text-[11px] sm:text-xs">
              Colete lanches, desvie dos obstáculos e bata seu recorde!
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Recorde */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1 text-right">
              <span className="text-[9px] sm:text-[10px] text-amber-700 font-bold uppercase block leading-none">Recorde</span>
              <span className="text-xs sm:text-sm font-black text-amber-900 leading-tight">🏆 {highScore}</span>
            </div>

            {/* Reiniciar Partida */}
            <button
              type="button"
              onClick={handleRestart}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
              title="Reiniciar Corrida"
            >
              <RotateCcw size={15} />
            </button>

            {/* Mudo / Som */}
            <button
              type="button"
              onClick={toggleSound}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
              title={isMuted ? 'Ativar Som' : 'Desativar Som'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {/* CONTAINER DO CANVAS (TOQUE NA TELA PARA PULAR) */}
        <div 
          onTouchStart={(e) => {
            if (gameState.current.status === 'playing') {
              e.preventDefault();
              triggerJump();
            }
          }}
          className="relative inline-block w-full border-3 sm:border-4 border-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-[6px_6px_0px_#000] sm:shadow-[8px_8px_0px_#000] bg-sky-300 touch-none select-none"
          style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
        >
          <canvas 
            ref={canvasRef} 
            width={480} 
            height={280} 
            className="block w-full h-auto object-cover cursor-pointer select-none touch-none aspect-[480/280]"
            style={{ touchAction: 'none' }}
          />

          {/* HUD SUPERIOR SOBREPOSTO 100% SÓLIDO */}
          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex items-center gap-1.5 sm:gap-2 pointer-events-none">
            {/* Placar Atual */}
            <div className="bg-white border-2 border-black rounded-xl px-2.5 py-0.5 sm:px-3 sm:py-1 font-display font-black text-base sm:text-lg text-black shadow-[2px_2px_0px_#000] flex items-center gap-1">
              <span>{score}</span>
              <span className="text-[10px] sm:text-xs text-stone-600 font-sans font-bold">pts</span>
            </div>

            {/* Lanches Coletados */}
            <div className="bg-white border-2 border-black rounded-xl px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold text-stone-900 shadow-[2px_2px_0px_#000] flex items-center gap-1">
              <span>🍔</span>
              <span>{foodsEaten}</span>
            </div>
          </div>

          {/* Power-Up Ativo no Topo Central (100% Sólido) */}
          {activePowerUp && (
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-stone-900 text-yellow-300 border-2 border-yellow-400 rounded-full px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg animate-pulse pointer-events-none">
              {activePowerUp === 'turbo' && <><span>🚀</span> <span>TURBO MOTOBOY</span></>}
              {activePowerUp === 'magnet' && <><Magnet size={14} className="text-cyan-400" /> <span>ÍMÃ DE LANCHES</span></>}
            </div>
          )}

          {/* Escudo Ativo (100% Sólido) */}
          {hasShield && !activePowerUp && (
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-stone-900 text-yellow-300 border-2 border-yellow-400 rounded-full px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg pointer-events-none">
              <Shield size={14} className="text-yellow-400 fill-yellow-400/40" /> <span>ESCUDO ATIVO</span>
            </div>
          )}

          {/* OVERLAY DE CONTAGEM REGRESSIVA (3, 2, 1) */}
          {countdown !== null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs z-20">
              <span className="text-6xl sm:text-7xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] animate-pulse">
                {countdown}
              </span>
              <span className="text-[11px] sm:text-xs font-black text-yellow-300 uppercase tracking-widest mt-2 px-3 py-1 bg-black rounded-full border border-yellow-400">
                Toque na tela para pular!
              </span>
            </div>
          )}
        </div>

        {/* CONTROLE TOUCH ERGONÔMICO PARA CELULAR */}
        <div className="mt-2.5 w-full">
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              triggerJump();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              triggerJump();
            }}
            className="w-full py-3.5 sm:py-3 px-6 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400 hover:from-yellow-500 hover:to-amber-500 active:scale-[0.97] text-black border-3 border-black rounded-2xl font-display font-black text-base sm:text-sm tracking-wider shadow-[4px_4px_0px_#000] active:shadow-[1px_1px_0px_#000] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer touch-none select-none"
            style={{ touchAction: 'none' }}
          >
            <Zap size={20} className="fill-black animate-pulse" />
            <span>TOQUE PARA PULAR</span>
            <span className="text-[10px] bg-black text-yellow-400 px-2 py-0.5 rounded-full font-sans font-bold">JUMP</span>
          </button>

          <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500 font-bold px-1">
            <span className="flex items-center gap-1">
              <span>👆</span> Toque em qualquer lugar da tela para pular
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-stone-400 font-medium">
              <Keyboard size={13} /> <span>Teclado: Espaço / Seta Cima</span>
            </span>
          </div>
        </div>
      </div>

      {/* Botão de Dev se houver pedido ativo */}
      {order && (
        <button 
          onClick={onFinishOrder}
          className="mt-2 mb-4 px-5 py-2 bg-white border border-stone-200 text-stone-500 font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-stone-50 transition-all shadow-xs"
        >
          (Dev: Pular para "Entregue")
        </button>
      )}

      {/* Conteúdo Institucional mantido */}
      {order ? (
        <>
          <div className="w-full max-w-2xl mt-2 flex flex-col sm:flex-row gap-4 mb-10">
            <button 
              onClick={handleSendToWhatsApp}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-wider py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <MessageCircle size={20} />
              <span>Encaminhar Pedido ao WhatsApp</span>
            </button>
            {onClose && (
              <button 
                onClick={handleExitGame} 
                className="flex-1 bg-white border border-stone-200 text-stone-900 font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-stone-50 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sair e Voltar ao Início</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>

          {/* Conheça a jornada */}
          <div className="w-full max-w-2xl bg-white border border-stone-200 rounded-3xl p-6 md:p-8 mb-10 shadow-sm text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4EBF6] rounded-bl-full -z-10 opacity-50"></div>
            <h3 className="font-display font-black uppercase text-2xl mb-3 text-[#4E2A84] tracking-tight">
              Saiba um pouco mais sobre a nossa jornada
            </h3>
            <p className="text-stone-600 font-medium mb-4 leading-relaxed text-sm">
              Enquanto seu lanche está sendo preparado com todo carinho, que tal conhecer a história de quem faz a mágica acontecer? Nossa paixão por qualidade em Passo Fundo vem de longe.
            </p>
            {onViewAbout && (
              <button onClick={onViewAbout} className="text-[#F28B20] font-bold uppercase tracking-wider text-xs flex items-center gap-2 hover:gap-3 transition-all">
                Ler História Completa <span>&rarr;</span>
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="w-full max-w-2xl flex justify-center mt-3 mb-10">
          {onClose && (
            <button onClick={onClose} className="px-8 py-3.5 bg-white border border-stone-200 text-stone-900 font-black uppercase tracking-widest rounded-2xl hover:bg-stone-50 transition-colors shadow-sm text-xs cursor-pointer">
              Voltar ao Início
            </button>
          )}
        </div>
      )}
    </div>
  );
}
