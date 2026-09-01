const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

content = content.replace("interface Address {  id: string;  street: string;  number: string;  neighborhood: string;  city: string;  reference?: string;}  id: string;  street: string;  number: string;  neighborhood: string;  city: string;}", "interface Address { id: string; street: string; number: string; neighborhood: string; city: string; reference?: string; }");

fs.writeFileSync('src/components/ProfileView.tsx', content);
