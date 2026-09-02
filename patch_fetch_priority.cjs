const fs = require('fs');
['src/components/AppetiteVideo.tsx', 'src/App.tsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/fetchpriority/g, 'fetchPriority');
  fs.writeFileSync(file, content);
});
