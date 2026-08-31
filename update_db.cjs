const fs = require('fs');
let content = fs.readFileSync('src/lib/db.ts', 'utf8');

// Replace the seedDatabase function completely
const newSeed = `export const seedDatabase = async (initialProducts: Product[], initialPromos: { [key: string]: number }) => {
  const productsRef = collection(db, "products");
  const promosRef = collection(db, "promos");
  const metaRef = doc(db, "system", "metadata");
  
  const metaSnap = await getDoc(metaRef);
  const currentVersion = metaSnap.exists() ? metaSnap.data().seedVersion : 0;
  const TARGET_VERSION = 2; // Increment this to force re-seed

  const productsSnap = await getDocs(productsRef);
  
  if (productsSnap.empty || currentVersion < TARGET_VERSION) {
    for (const p of initialProducts) {
      await setDoc(doc(db, "products", p.id!), p, { merge: true });
    }
    await setDoc(metaRef, { seedVersion: TARGET_VERSION }, { merge: true });
  }
  
  const promosSnap = await getDocs(promosRef);
  if (promosSnap.empty) {
    for (const [code, discount] of Object.entries(initialPromos)) {
      await setDoc(doc(db, "promos", code), { code, discount });
    }
  }
};`;

// We use regex to replace the function since we replaced it with force update earlier
content = content.replace(/export const seedDatabase = async [\s\S]*?(?=$|^)/m, newSeed);

fs.writeFileSync('src/lib/db.ts', content);
console.log('db.ts updated successfully with versioned seed.');
