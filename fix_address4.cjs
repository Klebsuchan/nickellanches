const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

const regex = /interface Address \{[\s\S]*?\}interface ProfileViewProps/m;
content = content.replace(regex, "interface Address {\n  id: string;\n  street: string;\n  number: string;\n  neighborhood: string;\n  city: string;\n  reference?: string;\n}\n\ninterface ProfileViewProps");

fs.writeFileSync('src/components/ProfileView.tsx', content);
