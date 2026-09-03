import { Product, FriendRanking, Extra } from './types';

export const AVAILABLE_EXTRAS: Extra[] = [
  { id: "e1", name: "Uma carne a mais", price: 10 },
  { id: "e2", name: "Calabresa", price: 8 },
  { id: "e3", name: "Coração de frango", price: 9 },
  { id: "e4", name: "Cebola", price: 6 },
  { id: "e5", name: "Mussarela", price: 5 },
  { id: "e6", name: "Bacon", price: 10 },
  { id: "e7", name: "Presunto", price: 5 },
  { id: "e8", name: "Cheddar", price: 6 },
  { id: "e9", name: "Ovo frito", price: 4 }
];

export const DISCOUNT_CODES: Record<string, number> = {
  'NICKEL10': 0.10, // 10% discount
  'PRIMEIRAVIAGEM': 0.15, // 15% discount
  'DIADOBACON': 5.00, // R$ 5,00 discount
};

export const MENU_ITEMS: Product[] = [

  {
    "id": "b_agua",
    "name": "Água Mineral",
    "description": "Água mineral 500ml.",
    "price": 4,
    "points": 6,
    "emoji": "💧",
    "image": "/images/aguasemgas-1.jpg",
    "category": "bebidas",
    "choiceName": "Tipo de Água",
    "choices": [
      { "name": "Sem Gás", "image": "/images/aguasemgas-1.jpg" },
      { "name": "Com Gás", "image": "/images/aguagas-1.jpg" }
    ]
  },
  {
    "id": "b_refri2l",
    "name": "Refrigerante 2 Litros",
    "description": "Refrigerante 2 litros geladinho.",
    "price": 15,
    "points": 22,
    "emoji": "🥤",
    "image": "/images/cocacola2l-1.jpg",
    "category": "bebidas",
    "choiceName": "Sabor do Refrigerante",
    "choices": [
      { "name": "Coca Cola", "image": "/images/cocacola2l-1.jpg" },
      { "name": "Guaraná", "image": "/images/guarana600-1.avif" },
      { "name": "Pepsi", "image": "/images/pepsi2l-1.jpg" },
      { "name": "Charrua", "image": "/images/charrua2l-1.jpg" }
    ]
  },
  {
    "id": "b_refri600",
    "name": "Refrigerante 600ml",
    "description": "Refrigerante 600ml geladinho.",
    "price": 10,
    "points": 15,
    "emoji": "🥤",
    "image": "/images/coca600ml-1.jpg",
    "category": "bebidas",
    "choiceName": "Sabor do Refrigerante",
    "choices": [
      { "name": "Coca Cola", "image": "/images/coca600ml-1.jpg" },
      { "name": "Guaraná", "image": "/images/guarana600-1.avif" },
      { "name": "Pepsi", "image": "/images/pepsi600ml-1.jpg" },
      { "name": "Sprite", "image": "/images/sprite600ml-1.jpg" }
    ]
  },
  {
    "id": "b_refrilata",
    "name": "Refrigerante Lata",
    "description": "Refrigerante em lata 350ml geladinho.",
    "price": 7,
    "points": 10,
    "emoji": "🥤",
    "image": "/images/cocalata-1.jpg",
    "category": "bebidas",
    "choiceName": "Sabor do Refrigerante",
    "choices": [
      { "name": "Coca Cola", "image": "/images/cocalata-1.jpg" },
      { "name": "Coca Cola Zero", "image": "/images/cocazero-1.jpg" },
      { "name": "Guaraná", "image": "/images/guarana600-1.avif" },
      { "name": "Pepsi", "image": "/images/pepsi600ml-1.jpg" },
      { "name": "Sprite", "image": "/images/sprite600ml-1.jpg" }
    ]
  },
  {
    "id": "b_refri200",
    "name": "Refrigerante 200ml",
    "description": "Refrigerante 200ml caçulinha geladinho.",
    "price": 4,
    "points": 6,
    "emoji": "🥤",
    "image": "/images/coca200ml-1.jpg",
    "category": "bebidas",
    "choiceName": "Sabor do Refrigerante",
    "choices": [
      { "name": "Coca Cola", "image": "/images/coca200ml-1.jpg" },
      { "name": "Guaraná", "image": "/images/gurana200ml-1.jpg" },
      { "name": "Pepsi", "image": "/images/pepsi2l-1.jpg" }
    ]
  },
  {
    "id": "b14",
    "name": "Cerveja Latão",
    "description": "Cerveja em lata grande (latão).",
    "price": 12,
    "points": 18,
    "emoji": "🍺",
    "image": "/images/latão-1.jpg",
    "category": "bebidas"
  },
  {
    "id": "1",
    "name": "Cachorro Quente Tradicional",
    "description": "Pão, salsicha, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",
    "price": 20,
    "points": 30,
    "emoji": "🌭",
    "image": "/images/nickeldog-1.avif",
    "category": "lanches"
  },
  {
    "id": "2",
    "name": "Cachorro Quente Coração",
    "description": "Pão, coração de frango, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",
    "price": 25,
    "points": 37,
    "emoji": "🌭",
    "image": "/images/nickeldog-1.avif",
    "category": "lanches"
  },
  {
    "id": "3",
    "name": "Cachorro Quente Bacon",
    "description": "Pão, salsicha, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup e bacon.",
    "price": 25,
    "points": 37,
    "emoji": "🌭",
    "image": "/images/nickeldog-1.avif",
    "category": "lanches"
  },
  {
    "id": "4",
    "name": "Cachorro Quente Frango",
    "description": "Pão, frango grelhado, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",
    "price": 22,
    "points": 33,
    "emoji": "🌭",
    "image": "/images/nickeldog-1.avif",
    "category": "lanches"
  },
  {
    "id": "5",
    "name": "Cachorro Quente Calabresa",
    "description": "Pão, linguiça calabresa, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",
    "price": 22,
    "points": 33,
    "emoji": "🌭",
    "image": "/images/nickeldog-1.avif",
    "category": "lanches"
  },
  {
    "id": "6",
    "name": "Cachorro Quente Strogonoff de Frango",
    "description": "Pão, strogonoff de frango, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",
    "price": 26,
    "points": 39,
    "emoji": "🌭",
    "image": "/images/nickeldog-1.avif",
    "category": "lanches"
  },
{
    "id": "22",
    "name": "Xis Simples",
    "description": "Carne, queijo muçarela, alface, tomate, maionese, mostarda, ketchup.",
    "price": 18,
    "points": 27,
    "emoji": "🍔",
    "image": "/images/xissimples-1.avif",
    "category": "lanches"
  },
  {
    "id": "23",
    "name": "Xis Especial",
    "description": "Carne, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",
    "price": 23,
    "points": 34,
    "emoji": "🍔",
    "image": "/images/xisespecial-1.avif",
    "category": "lanches"
  },
  {
    "id": "24",
    "name": "Xis Duplo",
    "description": "2 carnes, 2 queijos muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",
    "price": 30,
    "points": 45,
    "emoji": "🍔",
    "image": "/images/duplo-1.png",
    "category": "lanches"
  },
  {
    "id": "25",
    "name": "Xis Coração",
    "description": "Coração de frango, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",
    "price": 29,
    "points": 43,
    "emoji": "🍔",
    "image": "/images/xiscoração-1.jpg",
    "category": "lanches"
  },
  {
    "id": "26",
    "name": "Xis Bacon",
    "description": "Carne, bacon, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",
    "price": 29,
    "points": 43,
    "emoji": "🍔",
    "image": "/images/xisbacon-1.avif",
    "category": "lanches"
  },
  {
    "id": "27",
    "name": "Xis Frango",
    "description": "Peito de frango, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",
    "price": 25,
    "points": 37,
    "emoji": "🍔",
    "image": "/images/xisfrango-1.jpg",
    "category": "lanches"
  },
  {
    "id": "28",
    "name": "Xis Calabresa",
    "description": "Calabresa, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",
    "price": 25,
    "points": 37,
    "emoji": "🍔",
    "image": "/images/xiscalabresa-1.avif",
    "category": "lanches"
  },
  {
    "id": "29",
    "name": "Xis Strogonoff de Frango",
    "description": "Strogonoff de frango, queijo muçarela, batata palha, milho, maionese, mostarda, ketchup.",
    "price": 29,
    "points": 43,
    "emoji": "🍔",
    "image": "/images/xisestrogonofefrango-1.jpg",
    "category": "lanches"
  },
  {
    "id": "30",
    "name": "Xis Filé",
    "description": "Filé, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",
    "price": 38,
    "points": 57,
    "emoji": "🍔",
    "image": "/images/xisfilé-1.avif",
    "category": "lanches"
  },
  {
    "id": "31",
    "name": "Xis Olympus",
    "description": "Filé, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, cebola na chapa, barbecue, maionese caseira.",
    "price": 43,
    "points": 64,
    "emoji": "🍔",
    "image": "/images/olympus-1.png",
    "category": "lanches"
  },
  {
    "id": "32",
    "name": "Xis Magma",
    "description": "Carne, queijo muçarela, provolone, cheddar, calabresa, milho, tomate, maionese caseira.",
    "price": 32,
    "points": 48,
    "emoji": "🍔",
    "image": "/images/magma-1.png",
    "category": "lanches"
  },
  {
    "id": "33",
    "name": "Xis Cemuche",
    "description": "2 carnes, cebola caramelizada, 2 queijos muçarela, dupla cheddar, molho especial apimentado, alface, maionese caseira.",
    "price": 38,
    "points": 57,
    "emoji": "🍔",
    "image": "/images/xiscemuche-1.jpg",
    "category": "lanches"
  },
  {
    "id": "34",
    "name": "Xis Nickel Mix",
    "description": "Carne, frango, coração de frango, bacon, calabresa, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",
    "price": 42,
    "points": 63,
    "emoji": "🍔",
    "image": "/images/xisnickelmix-1.jpg",
    "category": "lanches"
  },
  {
    "id": "35",
    "name": "Xis Bomba",
    "description": "Carne, queijo muçarela, cheddar, milho, ervilha, bacon, batata frita, barbecue, maionese caseira.",
    "price": 32,
    "points": 48,
    "emoji": "🍔",
    "image": "/images/bomba-1.png",
    "category": "lanches"
  },
  {
  "id": "c1",
  "name": "Combo Família",
  "description": "4 Xis Especiais + GANHA 1 refri 2 litros CHARRA",
  "price": 90,
  "points": 135,
  "emoji": "👨‍👩‍👧‍👦",
  "image": "/images/xisnickelmix-1.jpg",
  "category": "lanches"
},
  {
  "id": "c2",
  "name": "Combo Kids",
  "description": "Xis Pão+Carne+Queijo + Fritas Sorriso (6 unidades) + Refri 200ml",
  "price": 25,
  "points": 37,
  "emoji": "👦",
  "image": "/images/nickeldog-1.avif",
  "category": "lanches"
},
  {
  "id": "c3",
  "name": "Nickel Trio",
  "description": "1 xis especial + 1 batatinha + 1 refri lata",
  "price": 35,
  "points": 52,
  "emoji": "🏆",
  "image": "/images/xisbacon-1.avif",
  "category": "lanches"
},
  {
  "id": "c4",
  "name": "Combinho Casal",
  "description": "2 Xis Especiais + Batata Frita M + Refri 600ml",
  "price": 70,
  "points": 105,
  "emoji": "💑",
  "image": "/images/xissimples-1.avif",
  "category": "lanches"
}
];

export const RANKING_DATA: FriendRanking[] = [
  { id: 'u1', name: 'João P.', points: 1250, avatar: '😎' },
  { id: 'u2', name: 'Maria C.', points: 980, avatar: '🤠' },
  { id: 'u3', name: 'Você', points: 850, avatar: '🐶', isCurrentUser: true },
  { id: 'u4', name: 'Pedro H.', points: 420, avatar: '🤖' },
  { id: 'u5', name: 'Ana L.', points: 150, avatar: '👽' }
];
