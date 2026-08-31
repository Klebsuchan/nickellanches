const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // App.tsx specific
  content = content.replace(/\$\{\(item\.price \/ 4\)\.toFixed\(2\)\}/g, "R$ {item.price.toFixed(2).replace('.', ',')}");
  
  // CartDrawer specific
  content = content.replace(/R\$ \{itemTotal\.toFixed\(2\)\}/g, "R$ {itemTotal.toFixed(2).replace('.', ',')}");
  content = content.replace(/R\$ \{totalCartBase\.toFixed\(2\)\}/g, "R$ {totalCartBase.toFixed(2).replace('.', ',')}");
  content = content.replace(/R\$ \{discountAmount\.toFixed\(2\)\}/g, "R$ {discountAmount.toFixed(2).replace('.', ',')}");
  content = content.replace(/R\$ \{totalCart\.toFixed\(2\)\}/g, "R$ {totalCart.toFixed(2).replace('.', ',')}");
  
  // ProductModal specific
  content = content.replace(/R\$ \{extra\.price\.toFixed\(2\)\}/g, "R$ {extra.price.toFixed(2).replace('.', ',')}");
  content = content.replace(/R\$ \{totalPrice\.toFixed\(2\)\}/g, "R$ {totalPrice.toFixed(2).replace('.', ',')}");
  
  fs.writeFileSync(file, content);
}

fixFile('src/App.tsx');
fixFile('src/components/CartDrawer.tsx');
fixFile('src/components/ProductModal.tsx');
console.log('prices fixed');
