const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import { auth, signInWithGoogle, signOut } from './lib/firebase';",
  "import { auth, signInWithGoogle, signOut, getNextOrderNumber } from './lib/firebase';"
);

const oldCheckoutStart = `  const handleCheckout = async (details: any) => {
    if (cart.length === 0) return;
    
    // 1. Send WhatsApp message
    let msg = \`Olá! Gostaria de fazer um pedido:\\n\\n*ITENS DO PEDIDO:*\\n\`;`;

const newCheckoutStart = `  const handleCheckout = async (details: any) => {
    if (cart.length === 0) return;
    
    // Get daily order number
    const orderNumber = await getNextOrderNumber();
    const timeNow = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // 1. Send WhatsApp message
    let msg = \`Olá! Me chamo *$\{details.name.trim()}* e gostaria de fazer um pedido!\\n\\n*Pedido Número:* $\{orderNumber}\\n*Gerado às:* $\{timeNow}\\n\\n*ITENS DO PEDIDO:*\\n\`;`;

code = code.replace(oldCheckoutStart, newCheckoutStart);

// Remove the old generated time from the bottom of the msg
const oldTimeNowStr = `    const timeNow = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    msg += \`\\n*⏱️ Pedido gerado às:* $\{timeNow}\\n\`;`;

code = code.replace(oldTimeNowStr, "");

fs.writeFileSync('src/App.tsx', code);
console.log('Patched handleCheckout');
