const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8');

const oldBlock = `                    {PAYMENT_METHODS.map(method => {
                      const isSelected = paymentMethod === method.id;
                      const IconComp = method.icon;
                      return (
                        <div
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPaymentMethod(method.id); }}
                          className={\`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all \${
                            isSelected 
                              ? 'border-[#F28B20] bg-orange-50/60 shadow-sm'
                              : 'border-stone-200 hover:border-stone-300 bg-stone-50/50 hover:bg-stone-50'
                          }\`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 \${
                              isSelected ? 'border-[#F28B20] bg-white' : 'border-stone-300 bg-white'
                            }\`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#F28B20]"></div>}
                            </div>
                            
                            <div className={\`p-2 rounded-lg shrink-0 \${isSelected ? 'bg-[#F28B20] text-white' : 'bg-stone-100 text-stone-600'}\`}>
                              <IconComp size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={\`font-bold text-sm \${isSelected ? 'text-stone-900' : 'text-stone-700'}\`}>
                                  {method.title}
                                </span>
                                {method.badge && (
                                  <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md uppercase">
                                    {method.badge}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-stone-500 block font-medium">
                                {method.description}
                              </span>
                            </div>
                          </div>
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value={method.id} 
                            checked={isSelected} 
                            onChange={() => setPaymentMethod(method.id)}
                            className="sr-only" 
                          />
                        </div>
                      );
                    })}`;

const newBlock = `                    {PAYMENT_METHODS.map(method => {
                      const isSelected = paymentMethod === method.id;
                      const IconComp = method.icon;
                      return (
                        <label
                          key={method.id}
                          className={\`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all \${
                            isSelected 
                              ? 'border-[#F28B20] bg-orange-50/60 shadow-sm'
                              : 'border-stone-200 hover:border-stone-300 bg-stone-50/50 hover:bg-stone-50'
                          }\`}
                        >
                          <div className="flex items-center gap-3.5 pointer-events-none">
                            <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 \${
                              isSelected ? 'border-[#F28B20] bg-white' : 'border-stone-300 bg-white'
                            }\`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#F28B20]"></div>}
                            </div>
                            
                            <div className={\`p-2 rounded-lg shrink-0 \${isSelected ? 'bg-[#F28B20] text-white' : 'bg-stone-100 text-stone-600'}\`}>
                              <IconComp size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={\`font-bold text-sm \${isSelected ? 'text-stone-900' : 'text-stone-700'}\`}>
                                  {method.title}
                                </span>
                                {method.badge && (
                                  <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md uppercase">
                                    {method.badge}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-stone-500 block font-medium">
                                {method.description}
                              </span>
                            </div>
                          </div>
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value={method.id} 
                            checked={isSelected} 
                            onChange={(e) => {
                              if (e.target.checked) setPaymentMethod(method.id);
                            }}
                            className="sr-only" 
                          />
                        </label>
                      );
                    })}`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('src/components/CheckoutModal.tsx', content);
