const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// 1. Remove all modals incorrectly placed at the end of AdminPanel
const incorrectModals = `      <ConfirmModal isOpen={confirmDeleteOpen} message={\`Tem certeza que deseja apagar \${selectedIds.size} pedidos permanentemente?\`} onConfirm={performDelete} onCancel={() => setConfirmDeleteOpen(false)} />
      <ConfirmModal isOpen={!!deleteId} message="Tem certeza? Removerá o produto para sempre." onConfirm={performDeleteProd} onCancel={() => setDeleteId(null)} />
      <PromptModal isOpen={promptImage} title="URL da Imagem" onConfirm={performAddImage} onCancel={() => setPromptImage(false)} />
      <PromptModal isOpen={promptExtraName} title="Nome do Adicional" onConfirm={performAddExtraName} onCancel={() => setPromptExtraName(false)} />
      <PromptModal isOpen={promptExtraPrice} title="Preço do Adicional" onConfirm={performAddExtraPrice} onCancel={() => setPromptExtraPrice(false)} />
      <ConfirmModal isOpen={!!deleteId} message="Tem certeza que deseja apagar o cupom?" onConfirm={performDeletePromo} onCancel={() => setDeleteId(null)} />`;

content = content.replace(incorrectModals, '');

// Wait, Banner Editor's ConfirmModal was also incorrectly appended there? No, looking at the code above, it wasn't. Let's see if it's there.
// If not, I can just replace them with empty string.

// Let's just remove them globally using regex since they might have slight variations:
content = content.replace(/<ConfirmModal isOpen=\{confirmDeleteOpen\}.*\/>/g, "");
content = content.replace(/<ConfirmModal isOpen=\{!!deleteId\}.*\/>/g, "");
content = content.replace(/<PromptModal.*?\/>/g, "");

// Now let's inject them at the correct places

// A. OrdersKanban
const kanbanEnd = `    </div>\n  );\n}\n\nfunction OrderEditModal`;
const kanbanModals = `      <ConfirmModal isOpen={confirmDeleteOpen} message={\`Tem certeza que deseja apagar \${selectedIds.size} pedidos permanentemente?\`} onConfirm={performDelete} onCancel={() => setConfirmDeleteOpen(false)} />\n    </div>\n  );\n}\n\nfunction OrderEditModal`;
content = content.replace(kanbanEnd, kanbanModals);

// B. ProductEditor
const prodEnd = `    </div>\n  );\n}\n\n// ----------------------------------------------------------------------\n// PROMO EDITOR`;
const prodModals = `      <ConfirmModal isOpen={!!deleteId} message="Tem certeza? Removerá o produto para sempre." onConfirm={performDeleteProd} onCancel={() => setDeleteId(null)} />\n      <PromptModal isOpen={promptImage} title="URL da Imagem" onConfirm={performAddImage} onCancel={() => setPromptImage(false)} />\n      <PromptModal isOpen={promptExtraName} title="Nome do Adicional" onConfirm={performAddExtraName} onCancel={() => setPromptExtraName(false)} />\n      <PromptModal isOpen={promptExtraPrice} title="Preço do Adicional" onConfirm={performAddExtraPrice} onCancel={() => setPromptExtraPrice(false)} />\n    </div>\n  );\n}\n\n// ----------------------------------------------------------------------\n// PROMO EDITOR`;
content = content.replace(prodEnd, prodModals);

// C. PromoEditor
const promoEnd = `    </div>\n  );\n}\n\n// ----------------------------------------------------------------------\n// BANNER EDITOR`;
const promoModals = `      <ConfirmModal isOpen={!!deleteId} message="Tem certeza que deseja apagar o cupom?" onConfirm={performDeletePromo} onCancel={() => setDeleteId(null)} />\n    </div>\n  );\n}\n\n// ----------------------------------------------------------------------\n// BANNER EDITOR`;
content = content.replace(promoEnd, promoModals);

// D. BannerEditor
const bannerEnd = `    </div>\n  );\n}\n\n// ----------------------------------------------------------------------\n// PRINT SETTINGS`;
const bannerModals = `      <ConfirmModal isOpen={!!deleteId} message="Tem certeza? O banner será removido do site." onConfirm={performDeleteBanner} onCancel={() => setDeleteId(null)} />\n    </div>\n  );\n}\n\n// ----------------------------------------------------------------------\n// PRINT SETTINGS`;
content = content.replace(bannerEnd, bannerModals);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed modals');
