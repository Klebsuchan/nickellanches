const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8');

// Replace the div role="button" with a label for better native support
content = content.replace(
  /<div\s+key=\{method.id\}\s+onClick=\{[^}]+\}\s+role="button"\s+tabIndex=\{0\}\s+onKeyDown=\{[^}]+\}\s+className=\{`/g,
  '<label\n                          key={method.id}\n                          className={`'
);

content = content.replace(
  /className="sr-only"\s*\/>\s*<\/div>/g,
  'className="sr-only"\n                          />\n                        </label>'
);

fs.writeFileSync('src/components/CheckoutModal.tsx', content);
