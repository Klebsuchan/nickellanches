const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

content = content.replace("import { ArrowRight, MapPin, Plus, Trash2, Clock, ChevronDown, ShoppingBag } from 'lucide-react';", "import { ArrowRight, MapPin, Plus, Trash2, Clock, ChevronDown, ShoppingBag, CreditCard } from 'lucide-react';");

content = content.replace("<ShoppingBag className=\"text-[#F28B20]\" size={24} /> Métodos de Pagamento Recentes", "<CreditCard className=\"text-[#F28B20]\" size={24} /> Métodos de Pagamento Recentes");

fs.writeFileSync('src/components/ProfileView.tsx', content);
