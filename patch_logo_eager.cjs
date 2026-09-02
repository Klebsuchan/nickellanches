const fs = require('fs');

let content = fs.readFileSync('src/components/AppetiteVideo.tsx', 'utf8');
content = content.replace(
  '<img loading="lazy" decoding="async" src="/logo.png"', 
  '<img loading="eager" fetchpriority="high" src="/logo.png"'
);
content = content.replace(
  '<img src="/logo.png"', 
  '<img loading="eager" fetchpriority="high" src="/logo.png"'
);
fs.writeFileSync('src/components/AppetiteVideo.tsx', content);

let contentApp = fs.readFileSync('src/App.tsx', 'utf8');
contentApp = contentApp.replace(
  '<img src="/logo.png"', 
  '<img loading="eager" fetchpriority="high" src="/logo.png"'
);
fs.writeFileSync('src/App.tsx', contentApp);
