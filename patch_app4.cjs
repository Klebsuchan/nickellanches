const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const strToReplace = `    if (details.region) {
      msg += \`Região: \${details.region}\\n\`;
    }
    if (details.region) {
      msg += \`Região: \${details.region}\\n\`;
    }`;

const strReplacement = `    if (details.region) {
      msg += \`Região: \${details.region}\\n\`;
    }`;

code = code.replace(strToReplace, strReplacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed duplicated region string');
