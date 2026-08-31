const fs = require('fs');
let content = fs.readFileSync('src/components/ProductModal.tsx', 'utf8');

// Replace hardcoded AVAILABLE_EXTRAS loop
const targetExtras = `                  {AVAILABLE_EXTRAS.map(extra => {
                    const isSelected = selectedExtras.find(e => e.id === extra.id);
                    return (
                      <label 
                        key={extra.id} 
                        className={\`flex items-center justify-between p-3 border border-stone-200 rounded-xl cursor-pointer transition-colors \${
                          isSelected ? 'bg-yellow-100 shadow-sm' : 'bg-white hover:bg-zinc-50'
                        }\`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={\`w-6 h-6 border border-stone-200 rounded-md flex items-center justify-center \${isSelected ? 'bg-yellow-400' : 'bg-white'}\`}>
                            {isSelected && <Check size={16} className="text-black" />}
                          </div>
                          <span className="font-bold">{extra.name}</span>
                        </div>
                        <span className="font-bold text-zinc-600">+ R$ {extra.price.toFixed(2).replace('.', ',')}</span>
                      </label>
                    );
                  })}`;

const newExtras = `                  {(product.productExtras || []).length > 0 ? (
                    product.productExtras!.map(extra => {
                      const isSelected = selectedExtras.find(e => e.id === extra.id);
                      return (
                        <label 
                          key={extra.id} 
                          className={\`flex items-center justify-between p-3 border border-stone-200 rounded-xl cursor-pointer transition-colors \${
                            isSelected ? 'bg-yellow-100 shadow-sm' : 'bg-white hover:bg-zinc-50'
                          }\`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={\`w-6 h-6 border border-stone-200 rounded-md flex items-center justify-center \${isSelected ? 'bg-yellow-400' : 'bg-white'}\`}>
                              {isSelected && <Check size={16} className="text-black" />}
                            </div>
                            <span className="font-bold uppercase text-sm">{extra.name}</span>
                          </div>
                          <span className="font-bold text-green-600">+ R$ {extra.price.toFixed(2).replace('.', ',')}</span>
                        </label>
                      );
                    })
                  ) : (
                    <div className="text-center text-sm font-bold text-stone-400 py-2">Sem adicionais para este produto.</div>
                  )}`;

content = content.replace(targetExtras, newExtras);

// Also add a little image gallery at the top of the modal if the product has multiple images
const targetDesc = `<p className="font-bold text-zinc-600 mb-6">{product.description}</p>`;

const newDesc = `
              {product.images && product.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-4 mb-4 comic-scrollbar snap-x">
                  {product.images.map((img, i) => (
                    <img key={i} src={img} className="w-32 h-32 object-cover rounded-xl border-2 border-stone-200 flex-shrink-0 snap-start" referrerPolicy="no-referrer" />
                  ))}
                </div>
              )}
              <p className="font-bold text-zinc-600 mb-6 uppercase text-sm">{product.description}</p>
`;
content = content.replace(targetDesc, newDesc);

fs.writeFileSync('src/components/ProductModal.tsx', content);
console.log('ProductModal patched');
