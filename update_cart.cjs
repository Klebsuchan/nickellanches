const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

if (!appContent.includes('const removeDiscount = () => {')) {
  const insertIndex = appContent.indexOf('const applyDiscount = () => {');
  appContent = appContent.slice(0, insertIndex) + `const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
  };

  ` + appContent.slice(insertIndex);
}

appContent = appContent.replace(
  'onApplyDiscount={applyDiscount}',
  'onApplyDiscount={applyDiscount}\n        onRemoveDiscount={removeDiscount}'
);
fs.writeFileSync('src/App.tsx', appContent);

let drawerContent = fs.readFileSync('src/components/CartDrawer.tsx', 'utf8');
if (!drawerContent.includes('onRemoveDiscount: () => void;')) {
  drawerContent = drawerContent.replace(
    'onApplyDiscount: () => void;',
    'onApplyDiscount: () => void;\n  onRemoveDiscount: () => void;'
  );
  drawerContent = drawerContent.replace(
    'appliedDiscount, totalCartBase, discountAmount, totalCart, onCheckout',
    'appliedDiscount, totalCartBase, discountAmount, totalCart, onCheckout, onRemoveDiscount'
  );
}

// Modify the discount input field to show the applied state
const inputArea = `                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    placeholder="Cupom de Desconto" 
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    disabled={appliedDiscount !== null}
                    className="flex-1 border-2 border-black rounded-lg px-4 font-bold uppercase placeholder:normal-case outline-none focus:ring-4 focus:ring-yellow-400/50 disabled:bg-stone-100 disabled:text-stone-500"
                  />
                  {appliedDiscount !== null ? (
                    <button 
                      onClick={onRemoveDiscount}
                      className="px-4 py-2 bg-red-100 text-red-600 font-bold uppercase rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Remover
                    </button>
                  ) : (
                    <button 
                      onClick={onApplyDiscount}
                      className="px-6 py-2 bg-black text-yellow-400 font-bold uppercase rounded-lg hover:bg-stone-800 transition-colors"
                    >
                      Aplicar
                    </button>
                  )}
                </div>`;

const targetInputAreaRegex = /<div className="flex gap-2 mb-4">[\s\S]*?<\/button>\s*<\/div>/;
drawerContent = drawerContent.replace(targetInputAreaRegex, inputArea);

fs.writeFileSync('src/components/CartDrawer.tsx', drawerContent);
