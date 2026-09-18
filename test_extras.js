const AVAILABLE_EXTRAS = [1, 2];
const product = { productExtras: [] };
const displayExtras = (product.productExtras && product.productExtras.length > 0) ? product.productExtras : AVAILABLE_EXTRAS;
console.log(displayExtras);
