const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `export default function App() {`;
const replacement = `export default function App() {
  if (window.location.pathname === '/painel-admin-secreto') {
    return (
      <div className="min-h-screen bg-stone-100">
        <AdminPanel onClose={() => window.location.href = '/'} />
      </div>
    );
  }
`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);
console.log('Done');
