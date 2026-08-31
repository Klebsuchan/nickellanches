const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetEffect = `    const unsubPromos = subscribeToPromos((promos) => {
      const codeMap = promos.reduce((acc, curr) => ({ ...acc, [curr.code]: curr.discount }), {});
      setDiscountCodes(codeMap);
    });`;

const newEffect = `    const unsubPromos = subscribeToPromos((promos) => {
      const codeMap = promos.reduce((acc, curr) => ({ ...acc, [curr.code]: curr.discount }), {});
      setDiscountCodes(codeMap);
      
      // Auto-apply the first available promo if no promo is applied
      if (promos.length > 0 && cart.length > 0) {
        setDiscountCode(promos[0].code);
        setAppliedDiscount(promos[0].discount);
      }
    });`;

content = content.replace(targetEffect, newEffect);

const targetCartEffect = `    return () => {
      unsubProducts();
      unsubPromos();
    };
  }, []);`;

const newCartEffect = `    return () => {
      unsubProducts();
      unsubPromos();
    };
  }, []);

  // Also auto-apply if cart changes and a promo is available
  useEffect(() => {
    if (cart.length > 0 && !appliedDiscount) {
      const codes = Object.keys(discountCodes);
      if (codes.length > 0) {
        setDiscountCode(codes[0]);
        setAppliedDiscount(discountCodes[codes[0]]);
      }
    }
  }, [cart.length, discountCodes]);`;

content = content.replace(targetCartEffect, newCartEffect);

fs.writeFileSync('src/App.tsx', content);
console.log('Auto coupon patched.');
