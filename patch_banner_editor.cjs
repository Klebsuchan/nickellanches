const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content += `
// Subcomponent for editing Banners
function BannerEditor({ banners }: { banners: Banner[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Banner>>({});
  const { addToast } = useToast();
  
  const handleEdit = (p: Banner) => {
    setEditingId(p.id!);
    setFormData(p);
  };
  
  const handleAdd = () => {
    setEditingId('new');
    setFormData({ image: '', title: '', description: '' });
  };
  
  const handleSave = async () => {
    try {
      await saveBanner(formData as Banner, editingId === 'new' ? undefined : editingId!);
      addToast({ message: 'Banner salvo!', type: 'success' });
      setEditingId(null);
    } catch (e) {
      addToast({ message: 'Erro ao salvar', type: 'error' as any });
    }
  };
  
  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza?')) {
      await deleteBanner(id);
      addToast({ message: 'Banner removido', type: 'success' });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display uppercase font-bold">Gerenciar Banners de Destaque</h2>
        <button onClick={handleAdd} className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold border border-stone-200 flex items-center gap-2 hover:bg-yellow-500 shadow-sm">
          <Plus size={18} /> Novo Banner
        </button>
      </div>
      
      {editingId && (
        <div className="bg-zinc-100 p-6 rounded-xl border border-stone-200 shadow-sm mb-8">
          <h3 className="font-bold text-lg mb-4">{editingId === 'new' ? 'Novo Banner' : 'Editar Banner'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Título" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="border border-stone-200 p-2 rounded-lg" />
            <input placeholder="URL da Imagem/Vídeo (ex: /images/x.jpg)" value={formData.image || ''} onChange={e => setFormData({...formData, image: e.target.value})} className="border border-stone-200 p-2 rounded-lg" />
            <textarea placeholder="Descrição" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="border border-stone-200 p-2 rounded-lg col-span-2" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="bg-green-400 px-4 py-2 rounded-lg font-bold border border-stone-200 flex items-center gap-2 hover:bg-green-500"><Save size={18}/> Salvar</button>
            <button onClick={() => setEditingId(null)} className="bg-white px-4 py-2 rounded-lg font-bold border border-stone-200">Cancelar</button>
          </div>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {banners.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="h-32 mb-2 bg-stone-100 rounded-lg overflow-hidden relative">
                <img src={p.image} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
              </div>
              <h4 className="font-bold text-lg">{p.title}</h4>
              <p className="text-sm text-zinc-600 mb-2">{p.description}</p>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t-2 border-black border-dashed">
              <button onClick={() => handleEdit(p)} className="flex-1 py-1 bg-yellow-400 border border-stone-200 rounded flex items-center justify-center"><Edit2 size={16}/></button>
              <button onClick={() => handleDelete(p.id!)} className="flex-1 py-1 bg-red-400 text-white border border-stone-200 rounded flex items-center justify-center"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/AdminPanel.tsx', content);
