const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8');

// 1. Remove the "Dinheiro" from PAYMENT_METHODS array
const paymentMethodObj = `  {
    id: 'Dinheiro na Entrega',
    title: 'Dinheiro na Entrega',
    description: 'Pagamento em notas/moedas na entrega',
    icon: Banknote,
  }`;
content = content.replace(paymentMethodObj + ',', '');
content = content.replace(paymentMethodObj, '');

// 2. Remove the custom finalPayment logic for change (Troco)
const customPaymentLogic = `    let finalPayment = paymentMethod;
    if (paymentMethod === 'Dinheiro na Entrega' && changeFor.trim()) {
      finalPayment += \` (Troco para: \${changeFor.trim()})\`;
    }`;
content = content.replace(customPaymentLogic, '    let finalPayment = paymentMethod;');

// 3. Remove the Troco field from UI, and replace it with a text about Cash payments
const trocoUI = `                  {/* Campo de Troco caso seja Dinheiro */}
                  <AnimatePresence>
                  {paymentMethod === 'Dinheiro na Entrega' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-3 border-t border-stone-100"
                    >
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Precisa de troco? Para quanto?
                      </label>
                      <input 
                        type="text" 
                        value={changeFor} 
                        onChange={e => setChangeFor(e.target.value)} 
                        placeholder="Ex: R$ 50,00 ou Não preciso de troco" 
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none focus:border-[#F28B20] focus:ring-2 focus:ring-orange-100 transition-all text-stone-900"
                      />
                    </motion.div>
                  )}
                  </AnimatePresence>`;

const cashNote = `                  {/* Aviso de pagamento em dinheiro */}
                  <div className="mt-4 pt-3 border-t border-stone-100 text-center">
                    <p className="text-xs text-stone-500 font-medium">Pagamento em dinheiro disponível apenas realizando o pedido diretamente no nosso WhatsApp.</p>
                  </div>`;
content = content.replace(trocoUI, cashNote);

fs.writeFileSync('src/components/CheckoutModal.tsx', content);
