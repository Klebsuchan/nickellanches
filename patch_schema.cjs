const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const websiteSchema = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Nickel Lanches",
      "url": "https://nickellanches.vercel.app/"
    }
    </script>
`;

content = content.replace('<!-- Schema.org Structured Data', websiteSchema + '\n    <!-- Schema.org Structured Data');

fs.writeFileSync('index.html', content);
