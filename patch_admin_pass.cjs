const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Add icons
content = content.replace(
  "import { Printer, CheckSquare, Lock, X, Plus, Trash2, Edit2, Package, Tag, Clock, Save } from 'lucide-react';",
  "import { Printer, CheckSquare, Lock, X, Plus, Trash2, Edit2, Package, Tag, Clock, Save, Eye, EyeOff } from 'lucide-react';"
);

// Add showPassword state
content = content.replace(
  "const [password, setPassword] = useState('');",
  "const [password, setPassword] = useState('');\n  const [showPassword, setShowPassword] = useState(false);"
);

// Update password validation to accept the specific password
content = content.replace(
  "if (password === (import.meta as any).env.VITE_ADMIN_PASSWORD) {",
  "if (password === (import.meta as any).env.VITE_ADMIN_PASSWORD || password === 'Nickel123Lanches?') {"
);

// Update password input to have a toggle
const oldInput = `<input 
            type="password" 
            placeholder="Senha administrativa"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-stone-200 rounded-lg p-3 mb-6 outline-none focus:ring-4 focus:ring-yellow-400 font-bold text-black"
          />`;

const newInput = `<div className="relative mb-6">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Senha administrativa"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-stone-200 rounded-lg p-3 pr-12 outline-none focus:ring-4 focus:ring-yellow-400 font-bold text-black"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>`;

content = content.replace(oldInput, newInput);
fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Done');
