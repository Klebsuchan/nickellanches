const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(
  "{activeTab === 'orders' && (\n                 <div className=\"flex justify-between items-center mb-6\">",
  "{activeTab === 'orders' && (\n                 <>\n                   <div className=\"flex justify-between items-center mb-6\">"
);

code = code.replace(
  "                      </div>\n                    ))}\n                  </div>\n               )}",
  "                      </div>\n                    ))}\n                  </div>\n                 </>\n               )}"
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('Fixed JSX siblings error');
