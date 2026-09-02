const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "setAppliedDiscount(discountCodes[code]);",
  "setAppliedDiscount(discountCodes[code]);\n      setDiscountCode('');"
);

fs.writeFileSync('src/App.tsx', content);
