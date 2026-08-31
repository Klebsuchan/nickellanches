const fs = require('fs');
let content = fs.readFileSync('src/components/CartDrawer.tsx', 'utf8');

const oldButtons = `                <button 
                  onClick={onCheckout}
                  className="w-full py-4 bg-yellow-400 border-2 border-black text-black font-display tracking-widest uppercase rounded-xl hover:bg-yellow-500 shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg"
                >
                  Finalizar Pedido
                </button>
              </div>`;

const newButtons = `                <button 
                  onClick={onCheckout}
                  className="w-full py-4 bg-yellow-400 border-2 border-black text-black font-display tracking-widest uppercase rounded-xl hover:bg-yellow-500 shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg"
                >
                  Finalizar Pedido
                </button>
                <button 
                  onClick={onClose}
                  className="w-full py-3 mt-3 bg-white border-2 border-stone-200 text-stone-600 font-bold tracking-wide uppercase rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-center text-sm"
                >
                  Continuar Comprando
                </button>
              </div>`;

content = content.replace(oldButtons, newButtons);
fs.writeFileSync('src/components/CartDrawer.tsx', content);
console.log('CartDrawer updated');
