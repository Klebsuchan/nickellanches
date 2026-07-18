import { Product, FriendRanking, Extra } from './types';

export const AVAILABLE_EXTRAS: Extra[] = [
  {
    "id": "e1",
    "name": "Carne",
    "price": 9
  },
  {
    "id": "e2",
    "name": "Calabresa",
    "price": 7
  },
  {
    "id": "e3",
    "name": "Coração",
    "price": 8
  },
  {
    "id": "e4",
    "name": "Cebola",
    "price": 5
  },
  {
    "id": "e5",
    "name": "Muçarela",
    "price": 4
  },
  {
    "id": "e6",
    "name": "Bacon",
    "price": 9
  },
  {
    "id": "e7",
    "name": "Frango",
    "price": 8
  },
  {
    "id": "e8",
    "name": "Ovo",
    "price": 3
  },
  {
    "id": "e9",
    "name": "Cheddar",
    "price": 5
  },
  {
    "id": "e10",
    "name": "Presunto",
    "price": 4
  }
];

export const DISCOUNT_CODES: Record<string, number> = {
  'NICKEL10': 0.10, // 10% discount
  'PRIMEIRAVIAGEM': 0.15, // 15% discount
  'DIADOBACON': 5.00, // R$ 5,00 discount
};

export const MENU_ITEMS: Product[] = [
  {
    "id": "1",
    "name": "Cachorro Quente Tradicional",
    "description": "Pão, salsicha, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",
    "price": 20,
    "points": 30,
    "emoji": "🌭",
    "image": "https://images.unsplash.com/photo-1615719413546-198b25453f85?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "2",
    "name": "Cachorro Quente Coração",
    "description": "Pão, coração de frango, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",
    "price": 25,
    "points": 37,
    "emoji": "🌭",
    "image": "https://images.unsplash.com/photo-1615719413546-198b25453f85?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "3",
    "name": "Cachorro Quente Bacon",
    "description": "Pão, salsicha, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup e bacon.",
    "price": 25,
    "points": 37,
    "emoji": "🌭",
    "image": "https://images.unsplash.com/photo-1615719413546-198b25453f85?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "4",
    "name": "Cachorro Quente Frango",
    "description": "Pão, frango grelhado, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",
    "price": 22,
    "points": 33,
    "emoji": "🌭",
    "image": "https://images.unsplash.com/photo-1615719413546-198b25453f85?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "5",
    "name": "Cachorro Quente Calabresa",
    "description": "Pão, linguiça calabresa, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",
    "price": 22,
    "points": 33,
    "emoji": "🌭",
    "image": "https://images.unsplash.com/photo-1615719413546-198b25453f85?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "6",
    "name": "Cachorro Quente Strogonoff de Frango",
    "description": "Pão, strogonoff de frango, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",
    "price": 26,
    "points": 39,
    "emoji": "🌭",
    "image": "https://images.unsplash.com/photo-1615719413546-198b25453f85?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "7",
    "name": "Batata Frita P",
    "description": "Batata frita pequena (170g in natura).",
    "price": 12,
    "points": 18,
    "emoji": "🍟",
    "image": "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80",
    "category": "porcoes"
  },
  {
    "id": "8",
    "name": "Batata Frita P com cheddar e bacon",
    "description": "Batata frita pequena (170g in natura) com cheddar e bacon.",
    "price": 17,
    "points": 25,
    "emoji": "🍟",
    "image": "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80",
    "category": "porcoes"
  },
  {
    "id": "9",
    "name": "Batata Frita M",
    "description": "Batata frita média (280g in natura).",
    "price": 20,
    "points": 30,
    "emoji": "🍟",
    "image": "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80",
    "category": "porcoes"
  },
  {
    "id": "10",
    "name": "Batata Frita M com cheddar e bacon",
    "description": "Batata frita média (280g in natura) com cheddar e bacon.",
    "price": 25,
    "points": 37,
    "emoji": "🍟",
    "image": "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80",
    "category": "porcoes"
  },
  {
    "id": "11",
    "name": "Batata Frita G",
    "description": "Batata frita grande (520g in natura).",
    "price": 30,
    "points": 45,
    "emoji": "🍟",
    "image": "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80",
    "category": "porcoes"
  },
  {
    "id": "12",
    "name": "Batata Frita G com cheddar e bacon",
    "description": "Batata frita grande (520g in natura) com cheddar e bacon.",
    "price": 35,
    "points": 52,
    "emoji": "🍟",
    "image": "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80",
    "category": "porcoes"
  },
  {
    "id": "13",
    "name": "Maionese caseira Pote 100g",
    "description": "Pote de 100g de maionese caseira.",
    "price": 6,
    "points": 9,
    "emoji": "🥣",
    "image": "https://images.unsplash.com/photo-1596649281691-127f8a379965?auto=format&fit=crop&w=600&q=80",
    "category": "porcoes"
  },
  {
    "id": "14",
    "name": "Molho barbecue Pote 100g",
    "description": "Pote de 100g de molho barbecue.",
    "price": 6,
    "points": 9,
    "emoji": "🥣",
    "image": "https://images.unsplash.com/photo-1596649281691-127f8a379965?auto=format&fit=crop&w=600&q=80",
    "category": "porcoes"
  },
  {
    "id": "15",
    "name": "Molho de pimenta Pote 100g",
    "description": "Pote de 100g de molho de pimenta.",
    "price": 7,
    "points": 10,
    "emoji": "🥣",
    "image": "https://images.unsplash.com/photo-1596649281691-127f8a379965?auto=format&fit=crop&w=600&q=80",
    "category": "porcoes"
  },
  {
    "id": "16",
    "name": "Refrigerante 2 litros",
    "description": "Refrigerante de 2 litros.",
    "price": 15,
    "points": 22,
    "emoji": "🥤",
    "image": "https://images.unsplash.com/photo-1572490122747-3968b75bb811?auto=format&fit=crop&w=600&q=80",
    "category": "bebidas"
  },
  {
    "id": "17",
    "name": "Refrigerante lata",
    "description": "Refrigerante em lata.",
    "price": 7,
    "points": 10,
    "emoji": "🥤",
    "image": "https://images.unsplash.com/photo-1572490122747-3968b75bb811?auto=format&fit=crop&w=600&q=80",
    "category": "bebidas"
  },
  {
    "id": "18",
    "name": "Refrigerante 600ml",
    "description": "Refrigerante de 600ml.",
    "price": 10,
    "points": 15,
    "emoji": "🥤",
    "image": "https://images.unsplash.com/photo-1572490122747-3968b75bb811?auto=format&fit=crop&w=600&q=80",
    "category": "bebidas"
  },
  {
    "id": "19",
    "name": "Refrigerante 200ml",
    "description": "Refrigerante de 200ml.",
    "price": 4,
    "points": 6,
    "emoji": "🥤",
    "image": "https://images.unsplash.com/photo-1572490122747-3968b75bb811?auto=format&fit=crop&w=600&q=80",
    "category": "bebidas"
  },
  {
    "id": "20",
    "name": "Água mineral",
    "description": "Água mineral.",
    "price": 4,
    "points": 6,
    "emoji": "🥤",
    "image": "https://images.unsplash.com/photo-1572490122747-3968b75bb811?auto=format&fit=crop&w=600&q=80",
    "category": "bebidas"
  },
  {
    "id": "21",
    "name": "Cerveja latão",
    "description": "Cerveja em latão.",
    "price": 12,
    "points": 18,
    "emoji": "🍺",
    "image": "https://images.unsplash.com/photo-1572490122747-3968b75bb811?auto=format&fit=crop&w=600&q=80",
    "category": "bebidas"
  },
  {
    "id": "22",
    "name": "Xis Simples",
    "description": "Carne, queijo muçarela, alface, tomate, maionese, mostarda, ketchup.",
    "price": 18,
    "points": 27,
    "emoji": "🍔",
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "23",
    "name": "Xis Especial",
    "description": "Carne, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",
    "price": 23,
    "points": 34,
    "emoji": "🍔",
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "24",
    "name": "Xis Duplo",
    "description": "2 carnes, 2 queijos muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",
    "price": 30,
    "points": 45,
    "emoji": "🍔",
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "25",
    "name": "Xis Coração",
    "description": "Coração de frango, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",
    "price": 29,
    "points": 43,
    "emoji": "🍔",
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "26",
    "name": "Xis Bacon",
    "description": "Carne, bacon, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",
    "price": 29,
    "points": 43,
    "emoji": "🍔",
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "27",
    "name": "Xis Frango",
    "description": "Peito de frango, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",
    "price": 25,
    "points": 37,
    "emoji": "🍔",
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "28",
    "name": "Xis Calabresa",
    "description": "Calabresa, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",
    "price": 25,
    "points": 37,
    "emoji": "🍔",
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "29",
    "name": "Xis Strogonoff de Frango",
    "description": "Strogonoff de frango, queijo muçarela, batata palha, milho, maionese, mostarda, ketchup.",
    "price": 29,
    "points": 43,
    "emoji": "🍔",
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "30",
    "name": "Xis Filé",
    "description": "Filé, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",
    "price": 38,
    "points": 57,
    "emoji": "🍔",
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "31",
    "name": "Xis Filé Prime",
    "description": "Filé, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, cebola na chapa, barbecue, maionese caseira.",
    "price": 43,
    "points": 64,
    "emoji": "🍔",
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "32",
    "name": "Xis Nickel Magma",
    "description": "Carne, queijo muçarela, provolone, cheddar, calabresa, milho, tomate, maionese caseira.",
    "price": 32,
    "points": 48,
    "emoji": "🍔",
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "33",
    "name": "Xis Nickel Cemuche",
    "description": "2 carnes, cebola caramelizada, 2 queijos muçarela, dupla cheddar, molho especial apimentado, alface, maionese caseira.",
    "price": 38,
    "points": 57,
    "emoji": "🍔",
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "34",
    "name": "Xis Nickel Mix",
    "description": "Carne, frango, coração de frango, bacon, calabresa, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",
    "price": 42,
    "points": 63,
    "emoji": "🍔",
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
    "id": "35",
    "name": "Xis Nickel Bomba",
    "description": "Carne, queijo muçarela, cheddar, milho, ervilha, bacon, batata frita, barbecue, maionese caseira.",
    "price": 32,
    "points": 48,
    "emoji": "🍔",
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "category": "lanches"
  },
  {
  "id": "c1",
  "name": "Combo Família",
  "description": "4 Xis Especiais + GANHA 1 refri 2 litros CHARRA",
  "price": 90,
  "points": 135,
  "emoji": "👨‍👩‍👧‍👦",
  "image": "https://images.unsplash.com/photo-1594212691516-436f8f6cdcc8?auto=format&fit=crop&w=600&q=80",
  "category": "lanches"
},
  {
  "id": "c2",
  "name": "Combo Kids",
  "description": "Xis Pão+Carne+Queijo + Fritas Sorriso (6 unidades) + Refri 200ml",
  "price": 25,
  "points": 37,
  "emoji": "👦",
  "image": "https://images.unsplash.com/photo-1594212691516-436f8f6cdcc8?auto=format&fit=crop&w=600&q=80",
  "category": "lanches"
},
  {
  "id": "c3",
  "name": "Nickel Trio",
  "description": "1 xis especial + 1 batatinha + 1 refri lata",
  "price": 35,
  "points": 52,
  "emoji": "🏆",
  "image": "https://images.unsplash.com/photo-1594212691516-436f8f6cdcc8?auto=format&fit=crop&w=600&q=80",
  "category": "lanches"
},
  {
  "id": "c4",
  "name": "Combinho Casal",
  "description": "2 Xis Especiais + Batata Frita M + Refri 600ml",
  "price": 70,
  "points": 105,
  "emoji": "💑",
  "image": "https://images.unsplash.com/photo-1594212691516-436f8f6cdcc8?auto=format&fit=crop&w=600&q=80",
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
