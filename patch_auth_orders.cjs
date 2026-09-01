const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace("setUserProfile(profile);", `setUserProfile(profile);
        const orders = await getLatestOrders(u.uid);
        setOrderHistory(orders as OrderInfo[]);`);

content = content.replace("view === 'profile' && <ProfileView onClose={() => setView('menu')} />", "view === 'profile' && <ProfileView onClose={() => setView('menu')} orderHistory={orderHistory} />");

fs.writeFileSync('src/App.tsx', content);
