const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace(
  '</head>',
  '    <link rel="preload" href="/dog-howl.mp3" as="audio" type="audio/mpeg">\n  </head>'
);
fs.writeFileSync('index.html', content);
