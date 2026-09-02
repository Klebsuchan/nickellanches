const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8');

const oldMethods = `const PAYMENT_METHODS = [
  {
    id: 'PIX (Pagamento na Entrega)',
    title: 'PIX na Entrega',
    description: 'Chave PIX ou QR Code na hora da entrega',
    icon: QrCode,
    badge: 'Mais Rápido'
  },
  {
    id: 'Cartão de Crédito/Débito na Entrega',
    title: 'Cartão de Crédito / Débito',
    description: 'Levamos a maquininha até você',
    icon: CreditCard,
  },
];`;

const newMethods = `const PAYMENT_METHODS = [
  {
    id: 'Pagamento Online Seguro (Stripe)',
    title: 'Pagar Agora (Online)',
    description: 'Cartão de crédito ou PIX online via Stripe',
    icon: CreditCard,
    badge: 'Recomendado'
  },
  {
    id: 'PIX (Pagamento na Entrega)',
    title: 'PIX na Entrega',
    description: 'Chave PIX ou QR Code na hora da entrega',
    icon: QrCode,
  },
  {
    id: 'Cartão de Crédito/Débito na Entrega',
    title: 'Cartão de Crédito / Débito',
    description: 'Levamos a maquininha até você',
    icon: CreditCard,
  },
];`;

content = content.replace(oldMethods, newMethods);

const oldUseState = `  const [paymentMethod, setPaymentMethod] = useState('PIX (Pagamento na Entrega)');`;
const newUseState = `  const [paymentMethod, setPaymentMethod] = useState('Pagamento Online Seguro (Stripe)');
  const [isProcessing, setIsProcessing] = useState(false);`;

content = content.replace(oldUseState, newUseState);

const oldHandleSubmit = `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {`;
const newHandleSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {`;

content = content.replace(oldHandleSubmit, newHandleSubmit);

const oldConfirm = `    let finalPayment = paymentMethod;

    onConfirm({ 
      name: name.trim(), 
      whatsapp: whatsapp.trim(), 
      address: address.trim(), 
      paymentMethod: finalPayment,
      changeFor: changeFor.trim()
    });
  };`;
const newConfirm = `    let finalPayment = paymentMethod;

    if (paymentMethod === 'Pagamento Online Seguro (Stripe)') {
      setIsProcessing(true);
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart,
            orderDetails: {
              name: name.trim(),
              whatsapp: whatsapp.trim(),
              address: address.trim(),
            }
          }),
        });

        const data = await response.json();
        
        if (data.url) {
          window.location.href = data.url;
        } else {
          setErrorMessage(data.error || 'Erro ao processar pagamento online. Verifique se as chaves da Stripe estão configuradas.');
        }
      } catch (err: any) {
        setErrorMessage('Erro de conexão ao iniciar o pagamento.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    onConfirm({ 
      name: name.trim(), 
      whatsapp: whatsapp.trim(), 
      address: address.trim(), 
      paymentMethod: finalPayment,
      changeFor: changeFor.trim()
    });
  };`;

content = content.replace(oldConfirm, newConfirm);

const oldSubmitButton = `<button 
                    type="submit" 
                    className="w-full bg-[#F28B20] text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-500 transition-colors shadow-md uppercase tracking-wider text-sm mt-4"
                  >
                    Confirmar Pedido <CheckCircle size={20} />
                  </button>`;
const newSubmitButton = `<button 
                    type="submit" 
                    disabled={isProcessing}
                    className="w-full bg-[#F28B20] text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-500 transition-colors shadow-md uppercase tracking-wider text-sm mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processando Pagamento...' : 'Confirmar Pedido'} <CheckCircle size={20} />
                  </button>`;
content = content.replace(oldSubmitButton, newSubmitButton);

fs.writeFileSync('src/components/CheckoutModal.tsx', content);
