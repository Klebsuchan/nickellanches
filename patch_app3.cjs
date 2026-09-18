const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldTotal = "    msg += `*TOTAL: R$ ${totalCart.toFixed(2).replace('.', ',')} + Frete a calcular*\\n\\n`;";
const newTotal = `    let finalTotal = totalCart;
    if (details.deliveryFee !== undefined) {
      msg += \`*Subtotal:* R$ \${totalCart.toFixed(2).replace('.', ',')}\\n\`;
      msg += \`*Frete (\${details.region}):* R$ \${details.deliveryFee.toFixed(2).replace('.', ',')}\\n\`;
      finalTotal = totalCart + details.deliveryFee;
      msg += \`*TOTAL FINAL:* R$ \${finalTotal.toFixed(2).replace('.', ',')}\\n\\n\`;
    } else {
      msg += \`*TOTAL FINAL:* R$ \${finalTotal.toFixed(2).replace('.', ',')}\\n\\n\`;
    }`;

code = code.replace(oldTotal, newTotal);

const oldSaveCall = `      orderId = await saveOrder(uid, {
        items: cart,
        totalPrice: totalCart,
        totalPoints: totalPoints,`;

const newSaveCall = `      orderId = await saveOrder(uid, {
        items: cart,
        totalPrice: (details.deliveryFee !== undefined ? totalCart + details.deliveryFee : totalCart),
        totalPoints: totalPoints,`;

code = code.replace(oldSaveCall, newSaveCall);

const oldAddressString = "    msg += `Endereço: ${details.address}\\n`;";
const newAddressString = "    msg += `Endereço: ${details.address}\\n`;\n    if (details.region) {\n      msg += `Região: ${details.region}\\n`;\n    }";

code = code.replace(oldAddressString, newAddressString);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched App.tsx for delivery fee');
