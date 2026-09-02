const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8');

content = content.replace(/<div\n\s*key=\{method\.id\}\n\s*onClick=\{[^}]+\}\n\s*role="button"\n\s*tabIndex=\{0\}\n\s*onKeyDown=\{[^}]+\}\n\s*className=\{`/g, '<label\n                          key={method.id}\n                          className={`');

content = content.replace(/className="sr-only"\s*\/>\n\s*<\/div>/g, 'className="sr-only"\n                          />\n                        </label>');

fs.writeFileSync('src/components/CheckoutModal.tsx', content);
