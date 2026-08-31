const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const safePrint = `const triggerSafePrint = () => {
    try {
      if (window.self !== window.top) {
        alert('A impressão é bloqueada pelo navegador neste modo de pré-visualização. Clique no botão de abrir em NOVA ABA (no canto superior direito) para testar a impressão!');
      } else {
        window.print();
      }
    } catch (e) {
      console.error(e);
    }
  };`;

// We inject triggerSafePrint inside AdminPanel component
content = content.replace(
  "const [printSettings, setPrintSettings] = useState({",
  `const triggerSafePrint = (toastFn: any) => {
    try {
      if (window.self !== window.top) {
        toastFn({ message: 'Abra o sistema em NOVA ABA (setinha lá em cima) para usar a impressora!', type: 'error' });
      } else {
        setTimeout(() => window.print(), 500);
      }
    } catch (e) {
      toastFn({ message: 'Erro ao imprimir.', type: 'error' });
    }
  };
  
  const [printSettings, setPrintSettings] = useState({`
);

// Now replace setTimeout(() => window.print(), 500); with triggerSafePrint(addToast)
content = content.replace(/setTimeout\(\(\) => window\.print\(\), 500\);/g, "triggerSafePrint(addToast);");
// There might be some addToast unavailable if it's passed as a prop, but actually triggerSafePrint is in AdminPanel, and we pass it down?
// Oh wait, triggerSafePrint is inside AdminPanel, but some prints are inside OrdersKanban.
// Wait, `addToast` is already available inside `OrdersKanban`!
// Wait, `triggerSafePrint` inside `AdminPanel` doesn't help `OrdersKanban` unless we pass it down, or we just declare it globally!

content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
const globalSafePrint = `
// ----------------------------------------------------------------------
// SAFE PRINT HELPER
// ----------------------------------------------------------------------
export const triggerSafePrint = (addToast: any) => {
  try {
    if (window.self !== window.top) {
      addToast({ message: 'A pré-visualização bloqueia impressão! Abra em NOVA ABA para imprimir.', type: 'error' });
    } else {
      setTimeout(() => window.print(), 500);
    }
  } catch (e) {
    addToast({ message: 'Erro ao imprimir.', type: 'error' });
  }
};
`;

content = content.replace("export default function AdminPanel", globalSafePrint + "\nexport default function AdminPanel");

// Replace all setTimeout(() => window.print(), 500);
content = content.replace(/setTimeout\(\(\) => window\.print\(\), 500\);/g, "triggerSafePrint(addToast);");

// Wait, PrintSettingsEditor doesn't have addToast explicitly in the onTestPrint prop:
// onTestPrint={() => { ... setTimeout(() => window.print(), 500); }} />}"
// The replace will make it onTestPrint={() => { ... triggerSafePrint(addToast); }} />}
// Does AdminPanel have `addToast`? Yes, `const { addToast } = useToast();`

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Safe print patched');
