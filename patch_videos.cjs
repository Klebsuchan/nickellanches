const fs = require('fs');

const files = [
  'src/components/StorySection.tsx',
  'src/components/HeroVideo.tsx',
  'src/components/AppetiteVideo.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<video/g, '<video preload="auto"');
  fs.writeFileSync(file, content);
});
