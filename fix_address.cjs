const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

content = content.replace(/interface Address \{[\s\S]*?\}interface ProfileViewProps/, 'interface Address {\n  id: string;\n  street: string;\n  number: string;\n  neighborhood: string;\n  city: string;\n  reference?: string;\n}\n\ninterface ProfileViewProps');

fs.writeFileSync('src/components/ProfileView.tsx', content);
