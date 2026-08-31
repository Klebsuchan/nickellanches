const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const oldFunc = `export const triggerSafePrint = (addToast: any) => {
  try {
    if (window.self !== window.top) {
      addToast({ message: 'A pré-visualização bloqueia impressão! Abra em NOVA ABA para imprimir.', type: 'error' });
    } else {
      triggerSafePrint(addToast);
    }
  } catch (e) {
    addToast({ message: 'Erro ao imprimir.', type: 'error' });
  }
};`;

const newFunc = `export const triggerSafePrint = (addToast: any) => {
  let isIframe = false;
  try {
    isIframe = window.self !== window.top;
  } catch (e) {
    isIframe = true;
  }
  
  if (isIframe) {
    addToast({ message: 'A pré-visualização bloqueia impressão! Abra em NOVA ABA para imprimir.', type: 'error' });
  } else {
    try {
      setTimeout(() => window.print(), 500);
    } catch (e) {
      addToast({ message: 'Erro nativo ao imprimir.', type: 'error' });
    }
  }
};`;

content = content.replace(oldFunc, newFunc);
fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed infinite recursion');
