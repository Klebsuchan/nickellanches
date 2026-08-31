const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldCode = `          {renderProductGrid(
            selectedCategory === 'Todos' 
               ? menuItems 
               : menuItems.filter(item => item.category === selectedCategory.toLowerCase().replace('xis', 'lanches').replace('cachorro quente', 'lanches')),
            selectedCategory === 'Todos' ? 'Todos os Lanches' : selectedCategory
          )}`;

const newCode = `          {renderProductGrid(
            selectedCategory === 'Todos' 
               ? menuItems 
               : selectedCategory === 'Xis'
                 ? xisItems
               : selectedCategory === 'Cachorro Quente'
                 ? hotDogItems
               : menuItems.filter(item => item.category === selectedCategory.toLowerCase()),
            selectedCategory === 'Todos' ? 'Todos os Lanches' : selectedCategory
          )}`;

content = content.replace(oldCode, newCode);

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx updated');
