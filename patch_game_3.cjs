const fs = require('fs');
let code = fs.readFileSync('src/components/DogGame.tsx', 'utf8');

// 1. Adjust the main container class
code = code.replace(
  '<div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in relative z-10 w-full max-w-4xl mx-auto">',
  '<div className={`flex flex-col items-center justify-center px-4 animate-fade-in relative z-10 w-full mx-auto ${order ? "min-h-[80vh] max-w-4xl" : "min-h-[calc(100vh-120px)] max-w-lg pb-12"}`}>'
);

// 2. Adjust the game section container
code = code.replace(
  '<div className="w-full bg-white border border-stone-200 rounded-3xl p-8 shadow-sm text-center relative overflow-hidden mb-8">',
  '<div className={`w-full bg-white border border-stone-200 rounded-3xl p-4 sm:p-8 shadow-sm text-center relative overflow-hidden ${order ? "mb-8" : "flex-1 flex flex-col justify-center"}`}>'
);

// 3. Make canvas fill the box better if no order
code = code.replace(
  '<div className="relative inline-block border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_#000]">',
  '<div className={`relative inline-block border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_#000] ${!order && "w-full max-w-sm mx-auto"}`}>'
);
code = code.replace(
  'className="bg-sky-300 block max-w-full h-auto"',
  'className="bg-sky-300 block w-full h-auto object-cover"'
);

fs.writeFileSync('src/components/DogGame.tsx', code);
console.log('layout patched!');
