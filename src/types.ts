export interface Extra {
  id: string;
  name: string;
  price: number;
  paused?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  points: number;
  emoji: string;
  image?: string;
  images?: string[];
  productExtras?: Extra[];
  category: 'lanches' | 'porcoes' | 'bebidas' | 'doces' | 'combos';
  choices?: { name: string, price?: number, image?: string }[];
  choiceName?: string;
  badge?: string;
  freeShipping?: boolean;
  paused?: boolean;
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
  status: 'recebido' | 'preparando' | 'a_caminho' | 'entregue';
  timestamp: Date;
  orderNumber?: number;
  isPaid?: boolean;
  paymentStatus?: 'pago' | 'pendente' | 'recusado' | string;
  paymentMethod?: string;
  receiptAuthCode?: string;
  receiptTimestamp?: string;
  receiptNotes?: string;
  receiptFileName?: string;
  receiptSummary?: string;
  whatsappMessage?: string;
}
