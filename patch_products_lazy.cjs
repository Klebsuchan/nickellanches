const fs = require('fs');

const files = [
  'src/App.tsx',
  'src/components/HeroVideo.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // First, add loading="lazy" decoding="async" to all <img> tags that don't have it
  content = content.replace(/<img(?!.*loading=)/g, '<img loading="lazy" decoding="async" ');
  
  // Also we want to ensure first promo image is eager if it's in HeroVideo, but they are dynamically rendered.
  // We can leave them as lazy since HeroVideo is usually below AppetiteVideo.
  
  fs.writeFileSync(file, content);
});
