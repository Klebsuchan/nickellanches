const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, deleteDoc, doc, query, where } = require("firebase/firestore");
const firebaseConfig = require("./firebase-applet-config.json");

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function cleanBebidas() {
  const productsRef = collection(db, "products");
  const q = query(productsRef, where("category", "==", "bebidas"));
  const snap = await getDocs(q);
  
  if (snap.empty) {
    console.log("No bebidas found in Firestore.");
    return;
  }
  
  for (const docSnap of snap.docs) {
    await deleteDoc(doc(db, "products", docSnap.id));
    console.log(`Deleted product: ${docSnap.id}`);
  }
  
  console.log("All old bebidas deleted.");
}

cleanBebidas().catch(console.error);
