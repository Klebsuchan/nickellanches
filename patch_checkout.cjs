const fs = require('fs');
let code = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8');

// Add region state
code = code.replace(
  "const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao' | 'dinheiro' | 'fiado'>('pix');",
  "const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao' | 'dinheiro' | 'fiado'>('pix');\n  const [region, setRegion] = useState<'petropolis' | 'cidade' | 'afastado' | ''>('');"
);

// Add validateForm condition
code = code.replace(
  "    if (!address.trim()) {\n      setErrorMessage('Por favor, informe seu endereço de entrega completo.');\n      return false;\n    }",
  "    if (!address.trim()) {\n      setErrorMessage('Por favor, informe seu endereço de entrega completo.');\n      return false;\n    }\n    if (!region) {\n      setErrorMessage('Por favor, selecione sua região para o cálculo do frete.');\n      return false;\n    }"
);

// Add onConfirm changes
code = code.replace(
  "    onConfirm({ \n      name: name.trim(), \n      whatsapp: whatsapp.trim(), \n      address: address.trim(), \n      paymentMethod: finalPaymentLabel,\n      changeFor: formattedChange\n    });",
  `    let deliveryFee = 0;
    let regionLabel = '';
    if (region === 'petropolis') {
      deliveryFee = 10;
      regionLabel = 'Petrópolis';
    } else if (region === 'cidade') {
      deliveryFee = 15;
      regionLabel = 'Outros bairros (Cidade)';
    } else if (region === 'afastado') {
      deliveryFee = 20;
      regionLabel = 'Fora do trevo (Afastado)';
    }

    onConfirm({ 
      name: name.trim(), 
      whatsapp: whatsapp.trim(), 
      address: address.trim(), 
      paymentMethod: finalPaymentLabel,
      changeFor: formattedChange,
      region: regionLabel,
      deliveryFee: deliveryFee
    });`
);

// Add region UI right below address input
const addressUI = `                    />
                  </div>
                </div>

                {/* Forma de Pagamento na Entrega */}`;

const regionUI = `                    />
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5 uppercase">
                      <MapPin size={15} className="text-[#F28B20]" /> Região de Entrega (Cálculo de Frete) *
                    </label>
                    <div className="space-y-2">
                      <label className={\`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all \${region === 'petropolis' ? 'border-[#F28B20] bg-orange-50/70 shadow-sm' : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'}\`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="region" checked={region === 'petropolis'} onChange={() => setRegion('petropolis')} className="hidden" />
                          <span className="font-bold text-sm text-stone-900">Petrópolis</span>
                        </div>
                        <span className="font-bold text-sm text-[#F28B20]">+ R$ 10,00</span>
                      </label>
                      <label className={\`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all \${region === 'cidade' ? 'border-[#F28B20] bg-orange-50/70 shadow-sm' : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'}\`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="region" checked={region === 'cidade'} onChange={() => setRegion('cidade')} className="hidden" />
                          <span className="font-bold text-sm text-stone-900">Outros bairros (Cidade)</span>
                        </div>
                        <span className="font-bold text-sm text-[#F28B20]">+ R$ 15,00</span>
                      </label>
                      <label className={\`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all \${region === 'afastado' ? 'border-[#F28B20] bg-orange-50/70 shadow-sm' : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'}\`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="region" checked={region === 'afastado'} onChange={() => setRegion('afastado')} className="hidden" />
                          <span className="font-bold text-sm text-stone-900">Fora do trevo (Afastado)</span>
                        </div>
                        <span className="font-bold text-sm text-[#F28B20]">+ R$ 20,00</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Forma de Pagamento na Entrega */}`;

code = code.replace(addressUI, regionUI);

fs.writeFileSync('src/components/CheckoutModal.tsx', code);
console.log('Patched CheckoutModal');
