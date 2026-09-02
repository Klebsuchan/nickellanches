const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace(
  '<link rel="preload" href="/videosemfundo.webm" as="video" type="video/webm">',
  '<link rel="preload" href="/videobackground.mp4" as="video" type="video/mp4">'
);
fs.writeFileSync('index.html', content);
