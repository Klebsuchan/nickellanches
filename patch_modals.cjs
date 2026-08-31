const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// 1. Add ConfirmModal and PromptModal components at the end
content += `
// ----------------------------------------------------------------------
// MODALS FOR IFRAME COMPATIBILITY
// ----------------------------------------------------------------------
export function ConfirmModal({ isOpen, message, onConfirm, onCancel }: { isOpen: boolean, message: string, onConfirm: () => void, onCancel: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
        <h3 className="font-black text-xl mb-4 text-black uppercase">Confirmação</h3>
        <p className="font-bold text-stone-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="px-6 py-2 bg-stone-200 text-stone-600 font-bold uppercase rounded-lg hover:bg-stone-300">Cancelar</button>
          <button onClick={() => { onConfirm(); onCancel(); }} className="px-6 py-2 bg-red-500 text-white font-bold uppercase rounded-lg hover:bg-red-600">Confirmar</button>
        </div>
      </div>
    </div>
  );
}

export function PromptModal({ isOpen, title, onConfirm, onCancel }: { isOpen: boolean, title: string, onConfirm: (val: string) => void, onCancel: () => void }) {
  const [val, setVal] = React.useState('');
  React.useEffect(() => { if (isOpen) setVal(''); }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl">
        <h3 className="font-black text-xl mb-4 text-black uppercase">{title}</h3>
        <input autoFocus value={val} onChange={e => setVal(e.target.value)} className="w-full border-2 border-stone-200 rounded-lg p-3 font-bold mb-6" />
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 bg-stone-200 text-stone-600 font-bold uppercase rounded-lg hover:bg-stone-300">Cancelar</button>
          <button onClick={() => { onConfirm(val); onCancel(); }} className="px-4 py-2 bg-yellow-400 text-black font-bold uppercase rounded-lg hover:bg-yellow-500">OK</button>
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Added modals');
