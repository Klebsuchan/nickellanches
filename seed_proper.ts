import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, doc, setDoc } from "firebase/firestore";
import { MENU_ITEMS } from "./src/data";
import * as fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("Seeding " + MENU_ITEMS.length + " products...");
  let count = 0;
  for (const p of MENU_ITEMS) {
    if (p.id) {
      await setDoc(doc(db, "products", p.id), p, { merge: true });
      count++;
    }
  }
  
  const metaRef = doc(db, "system", "metadata");
  await setDoc(metaRef, { seedVersion: 16 }, { merge: true });
  
  console.log(`Successfully updated ${count} products!`);
  process.exit(0);
}
run();
