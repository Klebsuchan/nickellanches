export interface Extra {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  points: number;
  emoji: string;
  image?: string;
  category: 'lanches' | 'porcoes' | 'bebidas' | 'doces';
  choices?: { name: string, price?: number, image?: string }[];
  choiceName?: string;
}

export interface CartItem extends Product {
  quantity: number;
  extras?: Extra[];
  observation?: string;
  cartItemId: string; // Unique ID for the cart item since products can be added multiple times with different extras
}

export interface FriendRanking {
  id: string;
  name: string;
  points: number;
  avatar: string;
  isCurrentUser?: boolean;
}

export interface OrderInfo {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  pointsEarned: number;
  status: 'preparando' | 'a_caminho' | 'entregue';
  timestamp: Date;
}
