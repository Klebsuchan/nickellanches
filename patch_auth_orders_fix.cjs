const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace("const orders = await getLatestOrders(u.uid);\n        setOrderHistory(orders as OrderInfo[]);", `const orders = await getLatestOrders(u.uid);
        const mappedOrders = orders.map(o => ({
          id: o.id || '',
          items: o.items || [],
          subtotal: o.totalPrice || 0,
          discount: 0,
          total: o.totalPrice || 0,
          pointsEarned: o.totalPoints || 0,
          status: o.status || 'recebido',
          timestamp: o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || Date.now())
        }));
        setOrderHistory(mappedOrders as OrderInfo[]);`);

fs.writeFileSync('src/App.tsx', content);
