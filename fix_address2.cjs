const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

const target = `interface Address {
  id: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  reference?: string;
}  id: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
}`;

content = content.replace(target, `interface Address {
  id: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  reference?: string;
}`);

// If it's single line formatted:
content = content.replace(/interface Address \{[\s\S]*?\}  id: string;  street: string;  number: string;  neighborhood: string;  city: string;\}/g, `interface Address {  id: string;  street: string;  number: string;  neighborhood: string;  city: string;  reference?: string;}`);


fs.writeFileSync('src/components/ProfileView.tsx', content);
