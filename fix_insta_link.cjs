const fs = require('fs');

let content = fs.readFileSync('src/components/InstagramFeed.tsx', 'utf8');
content = content.replace(
  'href="https://ig.me/m/nickellanches"',
  'href="https://www.instagram.com/nickellanches?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw=="'
);

fs.writeFileSync('src/components/InstagramFeed.tsx', content);
console.log('Done');
