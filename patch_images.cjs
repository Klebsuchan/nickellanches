const fs = require('fs');

const files = [
  'src/components/DogGame.tsx',
  'src/components/DeliveryInfoModal.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<img /g, '<img loading="lazy" decoding="async" ');
  fs.writeFileSync(file, content);
});
