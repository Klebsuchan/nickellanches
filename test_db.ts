import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, doc, getDoc } from "firebase/firestore";
import * as fs from "fs";
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

async function run() {
  const p32 = await getDoc(doc(db, "products", "32"));
  console.log("32 (Magma):", p32.data()?.name, p32.data()?.price);
  
  const p33 = await getDoc(doc(db, "products", "33"));
  console.log("33 (Cemuche):", p33.data()?.name, p33.data()?.price);
  process.exit(0);
}
run();
