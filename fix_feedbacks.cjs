const fs = require('fs');

let content = fs.readFileSync('src/components/FeedbacksSection.tsx', 'utf8');

content = content.replace(
  "'https://images.unsplash.com/photo-1615719413546-198b25453f85?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'",
  "'/images/nickeldog-1.avif'"
);

content = content.replace(
  "'https://images.unsplash.com/photo-1594212691516-0158b4be7284?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'",
  "'/images/xisnickelmix-1.jpg'"
);

content = content.replace(
  "'https://images.unsplash.com/photo-1629814695029-23c21a1ce09a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'",
  "'/images/xisbacon-1.avif'"
);

fs.writeFileSync('src/components/FeedbacksSection.tsx', content);
console.log('Feedbacks updated');
