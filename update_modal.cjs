const fs = require('fs');

let content = fs.readFileSync('src/components/ProductModal.tsx', 'utf8');

const regex = /\/\/ Extras Section/;

const choicesSection = `
              {/* Choices Section */}
              {product.choices && product.choices.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-display font-bold uppercase mb-3 text-lg">Escolha o {product.choiceName || 'Tipo'}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {product.choices.map(choice => {
                      const isSelected = selectedChoice?.name === choice.name;
                      return (
                        <div 
                          key={choice.name}
                          onClick={() => setSelectedChoice(choice)}
                          className={\`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-colors \${
                            isSelected ? 'bg-yellow-100 border-yellow-400 shadow-sm' : 'bg-white border-stone-200 hover:bg-zinc-50'
                          }\`}
                        >
                          {choice.image && (
                            <img src={choice.image} alt={choice.name} className="w-16 h-16 object-contain mb-2" />
                          )}
                          <span className="font-bold text-center text-sm">{choice.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              // Extras Section`;

content = content.replace(regex, choicesSection);

// Add selectedChoice state
content = content.replace('const [quantity, setQuantity] = useState(1);', 'const [quantity, setQuantity] = useState(1);\n  const [selectedChoice, setSelectedChoice] = useState<{name: string, price?: number, image?: string} | null>(null);');

// Reset state
content = content.replace('setQuantity(1);', 'setQuantity(1);\n      setSelectedChoice(product?.choices?.[0] || null);');

// Add to cart payload: include choice details in the name/image
content = content.replace('...product,', `...product,
      name: selectedChoice ? \`\${product.name} (\${selectedChoice.name})\` : product.name,
      image: selectedChoice?.image || product.image,
      price: selectedChoice?.price !== undefined ? selectedChoice.price : product.price,`);

fs.writeFileSync('src/components/ProductModal.tsx', content);
console.log('ProductModal.tsx updated');
