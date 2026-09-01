const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

let startIndex = content.indexOf('interface Address {');
let endIndex = content.indexOf('interface ProfileViewProps {');
let newContent = content.substring(0, startIndex) + 
`interface Address {
  id: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  reference?: string;
}

` + content.substring(endIndex);

fs.writeFileSync('src/components/ProfileView.tsx', newContent);
