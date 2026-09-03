const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace("setView('game');\n        \n    addToast({\n      title: 'Pedido Enviado!',\n      message: 'Pedido enviado para o WhatsApp e lanche na chapa!',", "setView('profile');\n        \n    addToast({\n      title: 'Pedido Enviado!',\n      message: 'Pedido enviado e lanche na chapa! Acompanhe seu pedido.',");

// Double check
if (!content.includes("Acompanhe seu pedido.")) {
  // Let's use a regex
  content = content.replace(/setView\('game'\);\s*addToast\(\{\s*title:\s*'Pedido Enviado!',\s*message:\s*'Pedido enviado para o WhatsApp e lanche na chapa!',/g, "setView('profile');\n    window.scrollTo(0,0);\n    \n    addToast({\n      title: 'Pedido Enviado!',\n      message: 'Pedido enviado! Acompanhe o preparo e jogue enquanto espera.',");
}

fs.writeFileSync('src/App.tsx', content);
