const fs = require('fs');
let content = fs.readFileSync('src/lib/db.ts', 'utf8');

if (!content.includes('export interface Banner')) {
  content += `
export interface Banner {
  id?: string;
  image: string;
  title: string;
  description: string;
}

export const getBanners = async (): Promise<Banner[]> => {
  try {
    const q = query(collection(db, 'banners'));
    const querySnapshot = await getDocs(q);
    const banners: Banner[] = [];
    querySnapshot.forEach((doc) => {
      banners.push({ id: doc.id, ...doc.data() } as Banner);
    });
    return banners;
  } catch (e) {
    console.error("Error getting banners: ", e);
    return [];
  }
};

export const saveBanner = async (banner: Banner, id?: string) => {
  try {
    if (id) {
      await updateDoc(doc(db, 'banners', id), banner as any);
      return id;
    } else {
      const docRef = await addDoc(collection(db, 'banners'), banner);
      return docRef.id;
    }
  } catch (e) {
    console.error("Error saving banner: ", e);
    throw e;
  }
};

export const deleteBanner = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'banners', id));
  } catch (e) {
    console.error("Error deleting banner: ", e);
    throw e;
  }
};

export const subscribeToBanners = (callback: (banners: Banner[]) => void) => {
  const q = query(collection(db, 'banners'));
  return onSnapshot(q, (querySnapshot) => {
    const banners: Banner[] = [];
    querySnapshot.forEach((doc) => {
      banners.push({ id: doc.id, ...doc.data() } as Banner);
    });
    if (banners.length === 0) {
      callback([
        {
          id: '1',
          image: "/images/comboloucura.jpg",
          title: "Promoção Loucura",
          description: "4 X-Especiais por R$ 90 + Refri 2L Charrua"
        },
        {
          id: '2',
          image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=1200&auto=format&fit=crop",
          title: "Promoção Fim de Mês",
          description: "Batata Frita com Maionese Caseira por R$ 6!"
        }
      ]);
    } else {
      callback(banners);
    }
  });
};
`;
  fs.writeFileSync('src/lib/db.ts', content);
}
console.log('Banners added to db.ts');
