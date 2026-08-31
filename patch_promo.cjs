const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(
  "const [formData, setFormData] = useState<Partial<PromoCode>>({});",
  `const [formData, setFormData] = useState<Partial<PromoCode>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);`
);

const targetDeletePromo = `  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza?')) {
      await deletePromo(id);
      addToast({ message: 'Cupom removido', type: 'success' });
    }
  };`;
const newDeletePromo = `  const handleDelete = (id: string) => setDeleteId(id);
  const performDeletePromo = async () => {
    if (deleteId) {
      await deletePromo(deleteId);
      addToast({ message: 'Cupom removido', type: 'success' });
      setDeleteId(null);
    }
  };`;
content = content.replace(targetDeletePromo, newDeletePromo);

const targetPromoEnd = `    </div>
  );
}`;
const newPromoEnd = `      <ConfirmModal isOpen={!!deleteId} message="Tem certeza que deseja apagar o cupom?" onConfirm={performDeletePromo} onCancel={() => setDeleteId(null)} />
    </div>
  );
}`;
content = content.replace(targetPromoEnd, newPromoEnd);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Promo patched');
