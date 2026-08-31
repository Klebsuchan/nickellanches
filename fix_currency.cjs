const fs = require('fs');

const filesToFix = ['src/App.tsx', 'src/components/CartDrawer.tsx', 'src/components/ProductModal.tsx'];

for (const file of filesToFix) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    
    // Quick regex to replace `R$ ${...}` if they aren't already formatted properly
    // or to change `{price}` to `R$ {price.toFixed(2).replace('.', ',')}`
    // Let's just do a manual replace or simpler logic.
    // Replace ${item.price} -> ${item.price.toFixed(2).replace('.', ',')}
    
    // Or we can just build a small formatCurrency function and inject it? No, let's just use string replace.
    
    // e.g. R$ {item.price} -> R$ {item.price.toFixed(2).replace('.', ',')}
    content = content.replace(/R\$\s*\{([^}]+)\.price\}/g, "R$ {$1.price.toFixed(2).replace('.', ',')}");
    content = content.replace(/R\$\s*\{([^}]+)\.price \*/g, "R$ {($1.price *"); // will fix later if needed
    
    // In App.tsx:
    content = content.replace(/\{item\.price\}/g, "R$ {item.price.toFixed(2).replace('.', ',')}");
    content = content.replace(/\$\{item\.price\}/g, "R$ ${item.price.toFixed(2).replace('.', ',')}");
    
    // In CartDrawer:
    content = content.replace(/\{item\.price\}/g, "R$ {item.price.toFixed(2).replace('.', ',')}");
    content = content.replace(/\{totalCartBase\}/g, "R$ {totalCartBase.toFixed(2).replace('.', ',')}");
    content = content.replace(/\{discountAmount\}/g, "R$ {discountAmount.toFixed(2).replace('.', ',')}");
    content = content.replace(/\{totalCart\}/g, "R$ {totalCart.toFixed(2).replace('.', ',')}");
    
    // ProductModal:
    content = content.replace(/\{product\.price\}/g, "R$ {product.price.toFixed(2).replace('.', ',')}");
    content = content.replace(/\{total\.toFixed\(2\)\}/g, "R$ {total.toFixed(2).replace('.', ',')}");
    
    // Let's also ensure no double R$ R$ 
    content = content.replace(/R\$\s*R\$/g, "R$");
    
    fs.writeFileSync(file, content);
  }
}
console.log('done fixing currency');
