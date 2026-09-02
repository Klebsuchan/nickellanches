const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `<ProfileView onClose={() => setView('menu')} />`;
const replacement = `<ProfileView 
          onClose={() => setView('menu')} 
          orderHistory={orderHistory} 
          user={user} 
          userProfile={userProfile} 
          onLogin={signInWithGoogle} 
          onLogout={signOut} 
        />`;

content = content.replace(targetStr, replacement);
fs.writeFileSync('src/App.tsx', content);
