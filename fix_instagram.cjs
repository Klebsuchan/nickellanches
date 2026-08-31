const fs = require('fs');

let content = fs.readFileSync('src/components/InstagramFeed.tsx', 'utf8');

const oldMockPosts = `  const mockPosts = [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1572656306390-40a9fc3899f7?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?q=80&w=600&auto=format&fit=crop"
  ];`;

const newMockPosts = `  const mockPosts = [
    "/images/nickeldog-1.avif",
    "/images/xisbacon-1.avif",
    "/images/xisnickelmix-1.jpg",
    "/images/bomba-1.png",
    "/images/fritascheddarbacon-1.jpg",
    "/images/xiscoração-1.jpg"
  ];`;

content = content.replace(oldMockPosts, newMockPosts);

fs.writeFileSync('src/components/InstagramFeed.tsx', content);
console.log('Instagram feed updated');
