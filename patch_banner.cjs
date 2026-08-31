const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(
  "const [formData, setFormData] = useState<Partial<Banner>>({});",
  `const [formData, setFormData] = useState<Partial<Banner>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);`
);

const targetDeleteBanner = `  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza? O banner será removido do site.')) {
      await deleteBanner(id);
      addToast({ message: 'Banner removido', type: 'success' });
    }
  };`;
const newDeleteBanner = `  const handleDelete = (id: string) => setDeleteId(id);
  const performDeleteBanner = async () => {
    if (deleteId) {
      await deleteBanner(deleteId);
      addToast({ message: 'Banner removido', type: 'success' });
      setDeleteId(null);
    }
  };`;
content = content.replace(targetDeleteBanner, newDeleteBanner);

const targetBannerEnd = `    </div>
  );
}`;
const newBannerEnd = `      <ConfirmModal isOpen={!!deleteId} message="Tem certeza? O banner será removido do site." onConfirm={performDeleteBanner} onCancel={() => setDeleteId(null)} />
    </div>
  );
}`;
content = content.replace(targetBannerEnd, newBannerEnd);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Banner patched');
