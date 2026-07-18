const fs = require('fs');

async function run() {
  const imagePath = 'public/logonickel.png';
  if (!fs.existsSync(imagePath)) {
    console.log('Image not found');
    return;
  }
  const imageBase64 = fs.readFileSync(imagePath).toString('base64');
  
  const payload = {
    contents: [
      {
        parts: [
          { inlineData: { data: imageBase64, mimeType: 'image/png' } },
          { text: 'Please analyze this logo. What is the exact name of the font used for the text "NICKEL" and "LANCHES"? If you don\'t know the exact name, please provide the 3 closest matches available on Google Fonts.' }
        ]
      }
    ]
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

run().catch(console.error);
