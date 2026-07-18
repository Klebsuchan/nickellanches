#!/bin/bash
sed -i 's/await addDoc(productsRef, p);/await setDoc(doc(db, "products", p.id!), p);/g' src/lib/db.ts
sed -i 's/await addDoc(promosRef, { code, discount });/await setDoc(doc(db, "promos", code), { code, discount });/g' src/lib/db.ts
