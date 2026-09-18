import { MENU_ITEMS } from './src/data';
MENU_ITEMS.forEach(p => {
  const keys = Object.keys(p);
  keys.forEach(k => {
    if (!/^[a-zA-Z0-9_]+$/.test(k)) {
      console.log(`Invalid key: ${k} in product ${p.id}`);
    }
  });
});
console.log("Check complete");
