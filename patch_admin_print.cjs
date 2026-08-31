const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// 1. Add autoPrintEnabled state
code = code.replace(
  "const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);",
  "const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);\n  const [autoPrintEnabled, setAutoPrintEnabled] = useState(localStorage.getItem('auto_print_enabled') !== 'false');\n  const autoPrintRef = useRef(autoPrintEnabled);\n  useEffect(() => {\n    autoPrintRef.current = autoPrintEnabled;\n    localStorage.setItem('auto_print_enabled', String(autoPrintEnabled));\n  }, [autoPrintEnabled]);"
);

// 2. Modify the subscription logic
code = code.replace(
  /const orderToPrint = toPrint\[0\];\s*handlePrint\(orderToPrint\);\s*\/\/ Mark as printed\s*printedOrders\.current\.add\(orderToPrint\.id\);\s*localStorage\.setItem\('printed_orders', JSON\.stringify\(Array\.from\(printedOrders\.current\)\)\);/,
  `toPrint.forEach(order => printedOrders.current.add(order.id));
            localStorage.setItem('printed_orders', JSON.stringify(Array.from(printedOrders.current)));
            
            if (autoPrintRef.current) {
              const orderToPrint = toPrint[0];
              handlePrint(orderToPrint);
            }`
);

// 3. Add toggle button to Orders tab UI
code = code.replace(
  "                  <div className=\"grid gap-6 md:grid-cols-2\">",
  `                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-display uppercase font-bold text-black">Configuração de Impressão</h2>
                     <button
                        onClick={() => setAutoPrintEnabled(!autoPrintEnabled)}
                        className={\`px-4 py-2 rounded-lg font-bold border border-stone-200 flex items-center gap-2 shadow-sm transition-colors \${autoPrintEnabled ? 'bg-green-400 text-black hover:bg-green-500' : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300'}\`}
                     >
                       <Printer size={18} /> 
                       {autoPrintEnabled ? 'Impressão Automática: LIGADA' : 'Impressão Automática: DESLIGADA'}
                     </button>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">`
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('patched admin print toggle');
