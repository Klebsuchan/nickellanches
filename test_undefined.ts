import { MENU_ITEMS } from './src/data';
MENU_ITEMS.forEach(p => {
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined) {
      console.log(`Product ${p.name} has undefined field: ${k}`);
    }
  }
});
console.log("Check complete");
