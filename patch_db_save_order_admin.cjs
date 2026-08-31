const fs = require('fs');
let content = fs.readFileSync('src/lib/db.ts', 'utf8');

if (!content.includes('export const saveOrderAdmin')) {
  content += `
export const saveOrderAdmin = async (orderId: string, updates: Partial<Order>) => {
  try {
    await updateDoc(doc(db, 'orders', orderId), updates);
  } catch (e) {
    console.error("Error updating order: ", e);
    throw e;
  }
};
`;
  fs.writeFileSync('src/lib/db.ts', content);
  console.log('Added saveOrderAdmin');
}
