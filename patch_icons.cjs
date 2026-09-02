const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const mobileIconsStr = `<div className="flex items-center gap-2 md:gap-3 lg:hidden relative">
            <button onClick={() => setView('game')} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-[#4E2A84] hover:bg-stone-200 transition-colors">
              <Dog size={18} />
            </button>
            <button onClick={() => setView('profile')} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-[#F28B20]">`;

content = content.replace(
  /<div className="flex items-center gap-2 md:gap-3 lg:hidden relative">\s*<button onClick=\{\(\) => setView\('profile'\)\} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-\[#F28B20\]">/,
  mobileIconsStr
);

const desktopIconsStr = `{/* Desktop User/Cart icons */}
          <div className="hidden lg:flex items-center gap-3">
            <button onClick={() => setView('game')} className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-[#4E2A84] border border-stone-200 hover:bg-stone-100 transition-colors">
              <Dog size={20} />
            </button>
             <button onClick={() => setView('profile')} className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-\[#F28B20\] border border-stone-200 hover:bg-stone-100 transition-colors">`;

content = content.replace(
  /\{\/\* Desktop User\/Cart icons \*\/\}\s*<div className="hidden lg:flex items-center gap-3">\s*<button onClick=\{\(\) => setView\('profile'\)\} className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-\[#F28B20\] border border-stone-200 hover:bg-stone-100 transition-colors">/,
  desktopIconsStr
);

fs.writeFileSync('src/App.tsx', content);
