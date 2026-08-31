const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Import MoreVertical
content = content.replace(
  "import { MessageCircle, Plus, Menu, Search, SlidersHorizontal, Bell, ShoppingCart, Star, ChefHat, LogOut, ArrowRight, Dog, Tag, Heart, Utensils, BookOpen, Flame, Info, Home, ShoppingBag, User, LayoutGrid } from 'lucide-react';",
  "import { MessageCircle, Plus, Menu, Search, SlidersHorizontal, Bell, ShoppingCart, Star, ChefHat, LogOut, ArrowRight, Dog, Tag, Heart, Utensils, BookOpen, Flame, Info, Home, ShoppingBag, User, LayoutGrid, MoreVertical } from 'lucide-react';"
);

// Add state isMobileMenuOpen
content = content.replace(
  "const [isCartOpen, setIsCartOpen] = useState(false);",
  "const [isCartOpen, setIsCartOpen] = useState(false);\n  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);"
);

// Update mobile header buttons
const oldMobileButtons = `          <div className="flex items-center gap-2 md:gap-3 lg:hidden">
            <button onClick={() => setView('profile')} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-[#F28B20]">
              <User size={18} />
            </button>
            <button onClick={() => setIsCartOpen(true)} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-900 relative">
              <ShoppingBag size={18} />
              {cart.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4E2A84] rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>`;

const newMobileButtons = `          <div className="flex items-center gap-2 md:gap-3 lg:hidden relative">
            <button onClick={() => setView('profile')} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-[#F28B20]">
              <User size={18} />
            </button>
            <button onClick={() => setIsCartOpen(true)} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-900 relative">
              <ShoppingBag size={18} />
              {cart.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4E2A84] rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 ml-1">
              <MoreVertical size={20} />
            </button>

            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-12 right-0 w-48 bg-white border border-stone-200 rounded-2xl shadow-xl flex flex-col py-2 z-50 overflow-hidden"
                >
                  <button onClick={() => { setIsMobileMenuOpen(false); document.getElementById('quem-somos')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-left px-4 py-3 font-bold text-sm text-stone-700 uppercase tracking-wide hover:bg-stone-50 transition-colors">
                    Quem Somos
                  </button>
                  <button onClick={() => { setIsMobileMenuOpen(false); document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-left px-4 py-3 font-bold text-sm text-stone-700 uppercase tracking-wide hover:bg-stone-50 transition-colors">
                    Contato
                  </button>
                  <button onClick={() => { setIsMobileMenuOpen(false); setView('game'); }} className="text-left px-4 py-3 font-bold text-sm text-[#4E2A84] uppercase tracking-wide hover:bg-stone-50 transition-colors flex items-center gap-2">
                    <Dog size={16} /> Jogue nosso jogo
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>`;

content = content.replace(oldMobileButtons, newMobileButtons);
fs.writeFileSync('src/App.tsx', content);
console.log('Mobile menu patched');
