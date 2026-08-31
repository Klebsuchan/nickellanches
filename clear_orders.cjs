const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = require('./firebase-applet-config.json');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearOrders() {
  const q = collection(db, 'orders');
  const snap = await getDocs(q);
  console.log(`Found ${snap.size} orders. Deleting...`);
  for (const docSnap of snap.docs) {
    await deleteDoc(doc(db, 'orders', docSnap.id));
  }
  console.log('Orders cleared.');
}

clearOrders().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
