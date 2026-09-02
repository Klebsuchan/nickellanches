const fs = require('fs');
let content = fs.readFileSync('src/components/DogGame.tsx', 'utf8');

const oldCode = `    const img = new Image();
    img.src = '/cochirrinho16bit.png';
    img.onload = () => {
      dogImageRef.current = img;
    };`;

const newCode = `    const img = new Image();
    img.onload = () => {
      dogImageRef.current = img;
    };
    img.src = '/cochirrinho16bit.png';
    if (img.complete) {
      dogImageRef.current = img;
    }`;

content = content.replace(oldCode, newCode);

fs.writeFileSync('src/components/DogGame.tsx', content);
