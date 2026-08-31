const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldGrid = `    return (
      <div className="flex overflow-x-auto gap-4 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-6 pb-6 snap-x hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {items.map((item, index) => {`;

const newGrid = `    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 pb-6">
        {items.map((item, index) => {`;

const oldCard = `              className="min-w-[260px] md:min-w-0 bg-white rounded-3xl p-5 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative cursor-pointer border border-stone-100 snap-start shrink-0"`;

const newCard = `              className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-5 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative cursor-pointer border border-stone-100"`;

const oldImg = `              <div className="h-44 w-full bg-[#FCF9F5] rounded-[24px] mb-5 flex items-center justify-center relative overflow-hidden group"> `;
const newImg = `              <div className="h-28 md:h-44 w-full bg-[#FCF9F5] rounded-xl md:rounded-[24px] mb-3 md:mb-5 flex items-center justify-center relative overflow-hidden group"> `;

const oldTitle = `                <h4 className="font-bold text-stone-900 leading-tight line-clamp-1 text-lg tracking-tight"><RenderWithNickel text={item.name} /></h4>
                <p className="text-xs text-stone-500 line-clamp-2 min-h-[2rem] leading-relaxed font-medium mb-1.5">{item.description}</p>`;
const newTitle = `                <h4 className="font-bold text-stone-900 leading-tight line-clamp-2 md:line-clamp-1 text-sm md:text-lg tracking-tight h-10 md:h-auto"><RenderWithNickel text={item.name} /></h4>
                <p className="hidden md:block text-xs text-stone-500 line-clamp-2 min-h-[2rem] leading-relaxed font-medium mb-1.5">{item.description}</p>`;

const oldPrice = `                <div className="flex items-center justify-between mt-auto">
                  <span className="text-2xl font-black text-stone-900 tracking-tighter">
                    R$ {item.price.toFixed(2).replace('.', ',')}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAddToCart({ ...item, quantity: 1, cartItemId: Math.random().toString(36).substring(2, 9) }); }}
                    className="w-10 h-10 bg-[#F28B20] text-white rounded-full flex items-center justify-center hover:bg-orange-500 transition-transform hover:scale-105 shadow-[0_4px_15px_rgba(242,139,32,0.4)]"
                  >
                    <Plus size={20} strokeWidth={3} />
                  </button>
                </div>`;
const newPrice = `                <div className="flex items-center justify-between mt-auto md:mt-4">
                  <span className="text-base md:text-2xl font-black text-stone-900 tracking-tighter">
                    R$ {item.price.toFixed(2).replace('.', ',')}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAddToCart({ ...item, quantity: 1, cartItemId: Math.random().toString(36).substring(2, 9) }); }}
                    className="w-8 h-8 md:w-10 md:h-10 bg-[#F28B20] text-white rounded-full flex items-center justify-center hover:bg-orange-500 transition-transform hover:scale-105 shadow-[0_4px_15px_rgba(242,139,32,0.4)]"
                  >
                    <Plus size={16} strokeWidth={3} className="md:w-5 md:h-5" />
                  </button>
                </div>`;

content = content.replace(oldGrid, newGrid);
content = content.replace(oldCard, newCard);
content = content.replace(oldImg, newImg);
content = content.replace(oldTitle, newTitle);
content = content.replace(oldPrice, newPrice);

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx grid patched');
