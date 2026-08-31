const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(
  "const [editingOrder, setEditingOrder] = useState<Order | null>(null);",
  `const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);`
);

const targetDelete = `  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(\`Tem certeza que deseja apagar \${selectedIds.size} pedidos permanentemente?\`)) {
      for (const id of Array.from(selectedIds)) {
        await deleteOrder(id);
      }
      addToast({ message: 'Pedidos apagados', type: 'success' });
      setSelectedIds(new Set());
    }
  };`;

const newDelete = `  const deleteSelected = () => {
    if (selectedIds.size > 0) setConfirmDeleteOpen(true);
  };
  
  const performDelete = async () => {
    for (const id of Array.from(selectedIds)) {
      await deleteOrder(id);
    }
    addToast({ message: 'Pedidos apagados', type: 'success' });
    setSelectedIds(new Set());
  };`;

content = content.replace(targetDelete, newDelete);

const targetKanbanEnd = `    </div>
  );
}`;

const newKanbanEnd = `      <ConfirmModal isOpen={confirmDeleteOpen} message={\`Tem certeza que deseja apagar \${selectedIds.size} pedidos permanentemente?\`} onConfirm={performDelete} onCancel={() => setConfirmDeleteOpen(false)} />
    </div>
  );
}`;

content = content.replace(targetKanbanEnd, newKanbanEnd);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Kanban patched');
