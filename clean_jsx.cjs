const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// I will look for the end of the file and replace any excessive `</div>` 
// I need exactly 2 `</div>` before `  );\n}` since the structure is:
// return (
//   <div className="min-h-screen ...">
//     <div style=...>...</div>
//     <div className="relative z-10 w-full h-full">
//        ... modals etc
//     </div>
//   </div>
// )

const endRegex = /(      <\/div>\s*)+(    <\/div>\s*  \);\s*})/g;

content = content.replace(endRegex, '      </div>\n    </div>\n  );\n}');

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx cleaned');
