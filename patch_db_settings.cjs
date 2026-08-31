const fs = require('fs');
let content = fs.readFileSync('src/lib/db.ts', 'utf8');

if (!content.includes('export interface SiteSettings')) {
  content += `
export interface SiteSettings {
  id?: string;
  heroVideoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
}

export const getSiteSettings = async (): Promise<SiteSettings> => {
  try {
    const docRef = doc(db, 'settings', 'main');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SiteSettings;
    }
  } catch (e) {
    console.error(e);
  }
  return {
    heroVideoUrl: '/videobackground.mp4',
    heroTitle: 'O MELHOR XIS E CACHORRO-QUENTE',
    heroSubtitle: 'Sabor de verdade que mata a sua fome e te deixa com gostinho de quero mais.'
  };
};

export const saveSiteSettings = async (settings: SiteSettings) => {
  try {
    const docRef = doc(db, 'settings', 'main');
    await setDoc(docRef, settings);
  } catch (e) {
    console.error(e);
  }
};

export const subscribeToSettings = (callback: (settings: SiteSettings) => void) => {
  const docRef = doc(db, 'settings', 'main');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as SiteSettings);
    } else {
      callback({
        heroVideoUrl: '/videobackground.mp4',
        heroTitle: 'O MELHOR XIS E CACHORRO-QUENTE',
        heroSubtitle: 'Sabor de verdade que mata a sua fome e te deixa com gostinho de quero mais.'
      });
    }
  });
};
`;
  fs.writeFileSync('src/lib/db.ts', content);
}
console.log('Settings added to db.ts');
