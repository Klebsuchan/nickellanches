const fs = require('fs');
let content = fs.readFileSync('src/lib/db.ts', 'utf8');

if (!content.includes('export const deleteOrder')) {
  content += `
export const deleteOrder = async (orderId: string) => {
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (e) {
    console.error("Error deleting order: ", e);
    throw e;
  }
};
`;
  fs.writeFileSync('src/lib/db.ts', content);
  console.log('Added deleteOrder');
}
