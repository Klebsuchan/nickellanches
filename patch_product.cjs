const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(
  "const [formData, setFormData] = useState<Partial<Product>>({});",
  `const [formData, setFormData] = useState<Partial<Product>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [promptImage, setPromptImage] = useState(false);
  const [promptExtraName, setPromptExtraName] = useState(false);
  const [promptExtraPrice, setPromptExtraPrice] = useState(false);
  const [tempExtraName, setTempExtraName] = useState('');`
);

const targetDeleteProd = `  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza? Removerá o produto para sempre.')) {
      await deleteProduct(id);
      addToast({ message: 'Produto removido', type: 'success' });
    }
  };`;
const newDeleteProd = `  const handleDelete = (id: string) => setDeleteId(id);
  const performDeleteProd = async () => {
    if (deleteId) {
      await deleteProduct(deleteId);
      addToast({ message: 'Produto removido', type: 'success' });
      setDeleteId(null);
    }
  };`;
content = content.replace(targetDeleteProd, newDeleteProd);

const targetAddImage = `  const addImage = () => {
    const url = prompt('Cole a URL da imagem:');
    if (url) {
      setFormData(prev => ({...prev, images: [...(prev.images || []), url]}));
    }
  };`;
const newAddImage = `  const addImage = () => setPromptImage(true);
  const performAddImage = (url: string) => {
    if (url) setFormData(prev => ({...prev, images: [...(prev.images || []), url]}));
  };`;
content = content.replace(targetAddImage, newAddImage);

const targetAddExtra = `  const addExtra = () => {
    const name = prompt('Nome do adicional (ex: Bacon Extra):');
    if (!name) return;
    const priceStr = prompt('Preço do adicional (ex: 5.50):');
    if (!priceStr) return;
    const price = parseFloat(priceStr.replace(',', '.'));
    setFormData(prev => ({
      ...prev, 
      productExtras: [...(prev.productExtras || []), { id: Math.random().toString(), name, price }]
    }));
  };`;
const newAddExtra = `  const addExtra = () => setPromptExtraName(true);
  const performAddExtraName = (name: string) => {
    if (name) { setTempExtraName(name); setPromptExtraPrice(true); }
  };
  const performAddExtraPrice = (priceStr: string) => {
    if (priceStr) {
      const price = parseFloat(priceStr.replace(',', '.'));
      setFormData(prev => ({
        ...prev, 
        productExtras: [...(prev.productExtras || []), { id: Math.random().toString(), name: tempExtraName, price }]
      }));
    }
  };`;
content = content.replace(targetAddExtra, newAddExtra);

const targetProdEnd = `    </div>
  );
}`;
const newProdEnd = `      <ConfirmModal isOpen={!!deleteId} message="Tem certeza? Removerá o produto para sempre." onConfirm={performDeleteProd} onCancel={() => setDeleteId(null)} />
      <PromptModal isOpen={promptImage} title="URL da Imagem" onConfirm={performAddImage} onCancel={() => setPromptImage(false)} />
      <PromptModal isOpen={promptExtraName} title="Nome do Adicional" onConfirm={performAddExtraName} onCancel={() => setPromptExtraName(false)} />
      <PromptModal isOpen={promptExtraPrice} title="Preço do Adicional" onConfirm={performAddExtraPrice} onCancel={() => setPromptExtraPrice(false)} />
    </div>
  );
}`;
content = content.replace(targetProdEnd, newProdEnd);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Product patched');
