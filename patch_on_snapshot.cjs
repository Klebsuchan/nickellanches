const fs = require('fs');

let content = fs.readFileSync('src/lib/db.ts', 'utf8');

// Replace all onSnapshot without error handlers to have error handlers that just log
content = content.replace(/return onSnapshot\(productsRef, \(snap\) => \{/g, `return onSnapshot(productsRef, (snap) => {`);
// That's a bit hard with regex. Let's just do simple replacements.

// Product
content = content.replace(
  `return onSnapshot(productsRef, (snap) => {
    callback(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Product[]);
  });`,
  `return onSnapshot(productsRef, (snap) => {
    callback(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Product[]);
  }, (error) => {
    console.error("Error subscribing to products (offline or missing rules):", error);
    // Don't crash
  });`
);

// Promo
content = content.replace(
  `return onSnapshot(promosRef, (snap) => {
    callback(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as PromoCode[]);
  });`,
  `return onSnapshot(promosRef, (snap) => {
    callback(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as PromoCode[]);
  }, (error) => {
    console.error("Error subscribing to promos:", error);
  });`
);

// Order
content = content.replace(
  `return onSnapshot(orderRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Order);
    }
  });`,
  `return onSnapshot(orderRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Order);
    }
  }, (error) => {
    console.error("Error subscribing to order:", error);
  });`
);

// Banners
content = content.replace(
  `return onSnapshot(q, (snap) => {
    callback(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Banner[]);
  });`,
  `return onSnapshot(q, (snap) => {
    callback(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Banner[]);
  }, (error) => {
    console.error("Error subscribing to banners:", error);
  });`
);

// Global Orders 1
content = content.replace(
  `return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback({ ...snap.data(), id: snap.id } as Order);
    }
  });`,
  `return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback({ ...snap.data(), id: snap.id } as Order);
    }
  }, (error) => {
    console.error("Error in onSnapshot:", error);
  });`
);

// Global Orders 2
content = content.replace(
  `return onSnapshot(q, (querySnapshot) => {
    const orders: Order[] = [];
    querySnapshot.forEach((doc) => {
      orders.push({ ...doc.data(), id: doc.id } as Order);
    });
    callback(orders);
  });`,
  `return onSnapshot(q, (querySnapshot) => {
    const orders: Order[] = [];
    querySnapshot.forEach((doc) => {
      orders.push({ ...doc.data(), id: doc.id } as Order);
    });
    callback(orders);
  }, (error) => {
    console.error("Error in onSnapshot global orders:", error);
  });`
);

fs.writeFileSync('src/lib/db.ts', content);
