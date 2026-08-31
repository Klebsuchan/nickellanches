const fs = require('fs');
let content = fs.readFileSync('src/components/HeroVideo.tsx', 'utf8');

// Imports
content = content.replace(
  "import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';",
  "import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';\nimport { subscribeToBanners, Banner } from '../lib/db';"
);

// State and effect
const oldPromos = `  const promos = [
    {
      id: 1,
      image: "/images/comboloucura.jpg",
      title: "Promoção Loucura",
      description: "4 X-Especiais por R$ 90 + Refri 2L Charrua"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=1200&auto=format&fit=crop",
      title: "Promoção Fim de Mês",
      description: "Batata Frita com Maionese Caseira por R$ 6!"
    },
    {
      id: 3,
      image: "/images/combinhocasal.jpg",
      title: "Combinho Casal",
      description: "O lanche perfeito para dividir com quem você ama!"
    }
  ];

  const [currentPromo, setCurrentPromo] = useState(0);
  const nextPromo = () => setCurrentPromo((prev) => (prev + 1) % promos.length);
  const prevPromo = () => setCurrentPromo((prev) => (prev - 1 + promos.length) % promos.length);

  useEffect(() => {
    const interval = setInterval(nextPromo, 5000);
    return () => clearInterval(interval);
  }, []);`;

const newPromos = `  const [promos, setPromos] = useState<Banner[]>([]);
  const [currentPromo, setCurrentPromo] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToBanners((banners) => {
      setPromos(banners);
      setCurrentPromo(0);
    });
    return () => unsubscribe();
  }, []);

  const nextPromo = () => setCurrentPromo((prev) => promos.length > 0 ? (prev + 1) % promos.length : 0);
  const prevPromo = () => setCurrentPromo((prev) => promos.length > 0 ? (prev - 1 + promos.length) % promos.length : 0);

  useEffect(() => {
    if (promos.length <= 1) return;
    const interval = setInterval(nextPromo, 5000);
    return () => clearInterval(interval);
  }, [promos.length]);`;

content = content.replace(oldPromos, newPromos);

const oldCarousel = `{/* Banner Carousel */}
        <div className="relative w-full aspect-[4/4] sm:aspect-[16/9] md:aspect-[21/9] rounded-2xl md:rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] mb-8 border border-white/10 group">
          <AnimatePresence mode="wait">
            <motion.div`;

const newCarousel = `{/* Banner Carousel */}
        {promos.length > 0 && (
        <div className="relative w-full aspect-[4/4] sm:aspect-[16/9] md:aspect-[21/9] rounded-2xl md:rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] mb-8 border border-white/10 group">
          <AnimatePresence mode="wait">
            <motion.div`;

content = content.replace(oldCarousel, newCarousel);

// Add closing brace for promos.length > 0 condition
const oldDots = `          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {promos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPromo(idx)}
                className={\`h-2 rounded-full transition-all duration-300 \${idx === currentPromo ? 'w-8 bg-[#F28B20]' : 'w-2 bg-white/50 hover:bg-white/80'}\`}
              />
            ))}
          </div>
        </div>`;

const newDots = `          {/* Dots */}
          {promos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {promos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPromo(idx)}
                  className={\`h-2 rounded-full transition-all duration-300 \${idx === currentPromo ? 'w-8 bg-[#F28B20]' : 'w-2 bg-white/50 hover:bg-white/80'}\`}
                />
              ))}
            </div>
          )}
        </div>
        )}`;

content = content.replace(oldDots, newDots);

fs.writeFileSync('src/components/HeroVideo.tsx', content);
console.log('Done modifying HeroVideo');
