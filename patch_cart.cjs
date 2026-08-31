const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
if (!code.includes("import CartDrawer")) {
  code = code.replace(
    "import ProductModal from './components/ProductModal';",
    "import ProductModal from './components/ProductModal';\nimport CartDrawer from './components/CartDrawer';"
  );
}

// Add the CartDrawer to the end of the file right above </AnimatePresence> that closes modals, or just before <ProductModal
code = code.replace(
  '<ProductModal',
  `      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveItem={removeFromCart}
        discountCode={discountCode}
        setDiscountCode={setDiscountCode}
        onApplyDiscount={applyDiscount}
        appliedDiscount={appliedDiscount}
        totalCartBase={totalCartBase}
        discountAmount={discountAmount}
        totalCart={totalCart}
        onCheckout={() => setView('store')}
      />
      <ProductModal`
);

fs.writeFileSync('src/App.tsx', code);
console.log('patched app to include CartDrawer');
