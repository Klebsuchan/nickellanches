const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8');

const regex = /const PAYMENT_METHODS = \[[\s\S]*?\];/;
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
  }
];`;

content = content.replace(regex, newMethods);
fs.writeFileSync('src/components/CheckoutModal.tsx', content);
