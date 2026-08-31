const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Change renderMenu background
content = content.replace(
  '<div className="w-full pb-0 bg-white">',
  '<div className="w-full pb-0 bg-transparent">'
);

// Change renderStore background
content = content.replace(
  '<div className="w-full pb-0 bg-[#FCF9F5] min-h-screen">',
  '<div className="w-full pb-0 bg-transparent min-h-screen">'
);

// In the main return, we need to restructure it so that the views are in a `relative z-10` container,
// and the parallax background is `fixed inset-0 z-0`.
// Currently it is:
//  return (
//    <div className="min-h-screen bg-[#FCF9F5] relative overflow-hidden text-stone-900">
//      {view === 'menu' && renderMenu()}
//      ...
//      <div style={{ display: view === 'about' || view === 'profile' ? 'none' : 'block' }}>
//      {/* Parallax Background */}

const returnBlockStart = `  return (
    <div className="min-h-screen bg-[#FCF9F5] relative overflow-hidden text-stone-900">`;

const newReturnBlockStart = `  return (
    <div className="min-h-screen bg-[#FCF9F5] relative overflow-hidden text-stone-900">
      <div style={{ display: view === 'about' || view === 'profile' ? 'none' : 'block' }} className="fixed inset-0 pointer-events-none z-0">
        {/* Parallax Background */}
        <div className="absolute inset-0 game-bg opacity-20" style={{ backgroundAttachment: 'fixed', backgroundPosition: 'center' }}></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 0, 0.1) 0%, transparent 70%)', backgroundAttachment: 'fixed' }}></div>
        <FloatingBackground />
      </div>
      
      <div className="relative z-10 w-full h-full">`;

content = content.replace(returnBlockStart, newReturnBlockStart);

// Now remove the old parallax block
const oldParallaxBlock = `      <div style={{ display: view === 'about' || view === 'profile' ? 'none' : 'block' }}>
      {/* Parallax Background */}
      <div className="fixed inset-0 pointer-events-none z-0 game-bg opacity-20" style={{ backgroundAttachment: 'fixed', backgroundPosition: 'center' }}></div>
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 0, 0.1) 0%, transparent 70%)', backgroundAttachment: 'fixed' }}></div>
      
      <FloatingBackground />`;

content = content.replace(oldParallaxBlock, '');

// Also close the new relative z-10 wrapper at the end of the file.
// Before:
//      <ProductModal ... />
//      </div>
//    </div>
//  );
// }

// Let's just find `</AnimatePresence>` and then the modals, and add `</div>`
content = content.replace(
  '      <ProductModal \n        product={selectedProduct}',
  '      <ProductModal \n        product={selectedProduct}'
);

// We need to add one more </div> before the last </div>
const tailRegex = /      <\/div>\n    <\/div>\n  \);\n}\n*(.*)$/;
content = content.replace(tailRegex, '      </div>\n      </div>\n    </div>\n  );\n}\n$1');

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx updated');
