const fs = require('fs');
let content = fs.readFileSync('src/components/DogGame.tsx', 'utf8');

const playBarkCode = `  const playBark = () => {
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
      console.log('Audio error:', e);
    }
  };`;

const playHowlCode = `  const howlAudio = useRef<HTMLAudioElement | null>(null);

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
      console.log('Audio error:', e);
    }
  };`;

content = content.replace(playBarkCode, playHowlCode);
fs.writeFileSync('src/components/DogGame.tsx', content);
