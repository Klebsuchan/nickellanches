const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The about view starts around line 515. 
// We should replace it with the old basic one or just remove the about view entirely, 
// since "quem somos" now goes to the main page scroll section.
// Actually, let's just restore the basic 'about' block so it doesn't break if still accessed somehow.

// Let's use regex to find `{view === 'about' && ( ... )}` and replace it with a simple empty div or just leave it.
// Since the footer and header navigation use `scrollIntoView('quem-somos')`, the user doesn't even see the `view === 'about'` screen anymore.
// To keep the file smaller, let's just delete the `view === 'about'` block.

const aboutRegex = /{view === 'about' && \(\s*<div className="w-full min-h-screen bg-white relative z-50">[\s\S]*?<\/div>\s*\)}\s*/g;
content = content.replace(aboutRegex, '');

fs.writeFileSync('src/App.tsx', content);
