const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "    addToast({\n      message: `${cartItem.name} adicionado ao carrinho!`,\n      type: 'success'\n    });\n  };",
  "    addToast({\n      message: `${cartItem.name} adicionado ao carrinho!`,\n      type: 'success'\n    });\n    setIsCartOpen(true);\n  };"
);

fs.writeFileSync('src/App.tsx', content);
console.log('handleAddToCart patched');
