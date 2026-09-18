import { MENU_ITEMS } from './src/data';
let hasErr = false;
MENU_ITEMS.forEach(p => {
  if (typeof p.price !== 'number' || isNaN(p.price)) {
    console.log("Invalid price for", p.name, p.price);
    hasErr = true;
  }
  if (!p.id || p.id.includes('/') || p.id.trim() === '') {
    console.log("Invalid id for", p.name, p.id);
    hasErr = true;
  }
  if (p.description === undefined) {
    console.log("Invalid description for", p.name);
    hasErr = true;
  }
});
console.log(hasErr ? "Errors found" : "All clear");
