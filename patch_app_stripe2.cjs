const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace showToast with addToast
content = content.replace("showToast('Pagamento online realizado com sucesso! Seu pedido já está sendo preparado.', 'success');", "addToast({ message: 'Pagamento online realizado com sucesso! Seu pedido já está sendo preparado.', type: 'success', title: 'Pagamento Confirmado!' });");
content = content.replace("showToast('Pagamento cancelado. Você ainda pode tentar novamente.', 'error');", "addToast({ message: 'Pagamento cancelado. Você ainda pode tentar novamente.', type: 'warning' });");

// Make sure addToast is destructured from useToast
// Search for const { addToast } = useToast();
if (!content.includes('addToast} = useToast()')) {
  // Let's add it at the beginning of the component
  const oldCompStart = `export default function App() {
  if (window.location.pathname === '/painel-admin') {`;
  
  const newCompStart = `export default function App() {
  const { addToast } = useToast();
  if (window.location.pathname === '/painel-admin') {`;
  
  content = content.replace(oldCompStart, newCompStart);
}

fs.writeFileSync('src/App.tsx', content);
