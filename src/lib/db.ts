import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, orderBy, getDocs, limit, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { User as FirebaseUser } from "firebase/auth";

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  xp: number;
  createdAt: any;
}

export interface Order {
  id?: string;
  items: any[];
  totalPrice: number;
  totalPoints: number;
  createdAt: any;
  status?: string;
  userId?: string;
  userName?: string;
  paymentMethod?: string;
  whatsapp?: string;
  address?: string;
  orderNumber?: number;
  receiptAuthCode?: string;
  receiptTimestamp?: string;
  receiptNotes?: string;
  receiptFileName?: string;
  receiptSummary?: string;
  deliveryFee?: number;
  changeFor?: string;
  region?: string;
  adminNotes?: string;
}

export const createUserProfile = async (user: FirebaseUser) => {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      name: user.displayName || "Sem Nome",
      email: user.email || "",
      avatarUrl: user.photoURL || "",
      xp: 0,
      createdAt: serverTimestamp()
    });
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
};

export const addXpToUser = async (userId: string, xpToAdd: number) => {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const currentXp = snap.data().xp || 0;
    await updateDoc(userRef, {
      xp: currentXp + xpToAdd
    });
  }
};

export const saveOrder = async (userId: string, orderData: Omit<Order, 'createdAt' | 'id'>) => {
  const userOrdersRef = collection(db, "users", userId, "orders");
  const globalOrdersRef = collection(db, "global_orders");
  
  const payload = {
    ...orderData,
    userId,
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(globalOrdersRef, payload);
  if (userId !== 'guest') {
    await setDoc(doc(db, "users", userId, "orders", docRef.id), payload);
  }
  return docRef.id;
};

export const getLatestOrders = async (userId: string): Promise<Order[]> => {
  const ordersRef = collection(db, "users", userId, "orders");
  const q = query(ordersRef, orderBy("createdAt", "desc"), limit(5));
  const snap = await getDocs(q);
  
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Order[];
};

export const getTopUsers = async (): Promise<(UserProfile & { id: string })[]> => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("xp", "desc"), limit(10));
  const snap = await getDocs(q);
  
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as (UserProfile & { id: string })[];
};

export interface Feedback {
  id?: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  location: string;
  rating: number;
  foodPhoto?: string;
  createdAt: any;
}

export const addFeedback = async (feedbackData: Omit<Feedback, 'createdAt' | 'id'>) => {
  const feedbacksRef = collection(db, "feedbacks");
  await addDoc(feedbacksRef, {
    ...feedbackData,
    createdAt: serverTimestamp()
  });
};

export const getFeedbacks = async (): Promise<Feedback[]> => {
  const feedbacksRef = collection(db, "feedbacks");
  const q = query(feedbacksRef, orderBy("createdAt", "desc"), limit(100));
  const snap = await getDocs(q);
  
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Feedback[];
};


import { deleteDoc } from "firebase/firestore";
import { Product } from "../types";

export interface PromoCode {
  id?: string;
  code: string;
  discount: number; // if < 1 percentage, else fixed
}

export const getProducts = async (): Promise<Product[]> => {
  const productsRef = collection(db, "products");
  const snap = await getDocs(productsRef);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Product[];
};

export const saveProduct = async (product: Omit<Product, 'id'>, id?: string) => {
  if (id) {
    await updateDoc(doc(db, "products", id), product as any);
  } else {
    await addDoc(collection(db, "products"), product);
  }
};

export const deleteProduct = async (id: string) => {
  await deleteDoc(doc(db, "products", id));
};

export const getPromos = async (): Promise<PromoCode[]> => {
  const promosRef = collection(db, "promos");
  const snap = await getDocs(promosRef);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as PromoCode[];
};

export const savePromo = async (promo: Omit<PromoCode, 'id'>, id?: string) => {
  if (id) {
    await updateDoc(doc(db, "promos", id), promo as any);
  } else {
    await addDoc(collection(db, "promos"), promo);
  }
};

export const deletePromo = async (id: string) => {
  await deleteDoc(doc(db, "promos", id));
};

export const getAllOrders = async (): Promise<Order[]> => {
  const ordersRef = collection(db, "global_orders");
  const q = query(ordersRef, orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Order[];
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const orderRef = doc(db, "global_orders", orderId);
  await updateDoc(orderRef, { status });
};

import { onSnapshot } from "firebase/firestore";
import { MENU_ITEMS } from "../data";

export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  const productsRef = collection(db, "products");
  return onSnapshot(productsRef, (snap) => {
    if (snap.empty) {
      callback(MENU_ITEMS);
      return;
    }
    const firestoreMap = new Map(snap.docs.map(d => [d.id, { ...d.data(), id: d.id } as Product]));
    
    // Combine MENU_ITEMS preserving canonical order, updating with Firestore data
    const merged = MENU_ITEMS.map(item => {
      const fromDb = firestoreMap.get(item.id!);
      if (!fromDb) return item;
      return {
        ...fromDb,
        ...item,
        // Canonical images and prices from MENU_ITEMS take priority
        image: item.image || fromDb.image,
        price: item.price ?? fromDb.price
      };
    });

    // Also include any dynamically added products from Firestore
    const menuItemIds = new Set(MENU_ITEMS.map(i => i.id));
    for (const doc of snap.docs) {
      if (!menuItemIds.has(doc.id)) {
        merged.push({ ...doc.data(), id: doc.id } as Product);
      }
    }

    callback(merged);
  }, (error) => {
    console.error("Error subscribing to products (offline or missing rules):", error);
    callback(MENU_ITEMS);
  });
};

export const subscribeToPromos = (callback: (promos: PromoCode[]) => void) => {
  const promosRef = collection(db, "promos");
  return onSnapshot(promosRef, (snap) => {
    callback(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as PromoCode[]);
  }, (error) => {
    console.error("Error subscribing to promos:", error);
  });
};

export const subscribeToOrder = (orderId: string, callback: (order: Order) => void) => {
  const orderRef = doc(db, "global_orders", orderId);
  return onSnapshot(orderRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Order);
    }
  }, (error) => {
    console.error("Error subscribing to order:", error);
  });
};

export const subscribeToAllOrders = (callback: (orders: Order[]) => void) => {
  const ordersRef = collection(db, "global_orders");
  const q = query(ordersRef, orderBy("createdAt", "desc"), limit(50));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Order[]);
  });
};

export const seedDatabase = async (initialProducts: Product[], initialPromos: { [key: string]: number }) => {
  try {
    const productsRef = collection(db, "products");
    const promosRef = collection(db, "promos");
    const metaRef = doc(db, "system", "metadata");
    
    const metaSnap = await getDoc(metaRef);
    const currentVersion = metaSnap.exists() ? metaSnap.data().seedVersion : 0;
    const TARGET_VERSION = 23; // Increment this to force re-seed
  
    const productsSnap = await getDocs(productsRef);
    
    // Always force seed to ensure prices are updated
    if (true) {
      for (const p of initialProducts) {
        try {
          await setDoc(doc(db, "products", p.id!), p);
        } catch (e) {
          console.error("Failed to seed product:", p.id, p, e);
        }
      }
      try {
        await setDoc(metaRef, { seedVersion: TARGET_VERSION }, { merge: true });
      } catch(e) {
        console.error("Failed to update seed version:", e);
      }
    }
    
    const promosSnap = await getDocs(promosRef);
    if (promosSnap.empty) {
      for (const [code, discount] of Object.entries(initialPromos)) {
        await setDoc(doc(db, "promos", code), { code, discount });
      }
    }
  } catch (error) {
    console.error("Erro ao sincronizar banco de dados (provavelmente offline ou sem permissão):", error);
  }
};

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
        }
      ]);
    } else {
      callback(banners);
    }
  });
};

export const deleteOrder = async (orderId: string) => {
  try {
    await deleteDoc(doc(db, 'global_orders', orderId));
  } catch (e) {
    console.error("Error deleting order: ", e);
    throw e;
  }
};

export const saveOrderAdmin = async (orderId: string, updates: Partial<Order>) => {
  try {
    await updateDoc(doc(db, 'global_orders', orderId), updates);
  } catch (e) {
    console.error("Error updating order: ", e);
    throw e;
  }
};

export interface PaymentSettings {
  id?: string;
  onlinePaymentsEnabled: boolean;
  pix: {
    enabled: boolean;
    keyType: 'telefone' | 'cpf' | 'cnpj' | 'email' | 'aleatoria';
    key: string;
    merchantName: string;
    merchantCity: string;
    instructions: string;
  };
  cardOnline: {
    enabled: boolean;
    paymentLinkUrl: string;
    acceptCredit: boolean;
    acceptDebit: boolean;
    instructions: string;
    customNote?: string;
  };
  bankAccount: {
    enabled: boolean;
    bankName: string;
    agency: string;
    accountNumber: string;
    accountType: 'corrente' | 'poupanca' | 'pagamento';
    holderName: string;
    holderDocument?: string;
    instructions?: string;
  };
  creditCardOnline?: {
    enabled?: boolean;
    paymentLinkUrl?: string;
    instructions?: string;
  };
  generalNotes?: string;
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  onlinePaymentsEnabled: true,
  pix: {
    enabled: true,
    keyType: 'telefone',
    key: '54999598389',
    merchantName: 'NICKEL LANCHES',
    merchantCity: 'PASSO FUNDO',
    instructions: 'A chave PIX é o próprio número de WhatsApp da lanchonete: (54) 99959-8389. Faça o PIX no valor exato e anexe o comprovante na conversa para agilizar a preparação!'
  },
  cardOnline: {
    enabled: true,
    paymentLinkUrl: '',
    acceptCredit: true,
    acceptDebit: true,
    instructions: 'Pague online com Cartão de Crédito ou Débito com segurança. O valor cai direto na conta da lanchonete.',
    customNote: 'Aceitamos as principais bandeiras: Visa, Mastercard, Elo e Hipercard.'
  },
  bankAccount: {
    enabled: true,
    bankName: 'Nubank (260)',
    agency: '0001',
    accountNumber: '99106460-4',
    accountType: 'corrente',
    holderName: 'Braian Kleber Camargo',
    holderDocument: '',
    instructions: 'Faça a transferência (TED/DOC ou entre contas) com o valor exato do seu pedido e anexe o comprovante com agência e conta.'
  },
  generalNotes: 'Após realizar o pagamento online, envie seu pedido pelo WhatsApp com a confirmação.'
};

export const getPaymentSettings = async (): Promise<PaymentSettings> => {
  try {
    const docRef = doc(db, 'settings', 'payments');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_PAYMENT_SETTINGS, ...snap.data() } as PaymentSettings;
    }
  } catch (e) {
    console.error("Error getting payment settings: ", e);
  }
  return DEFAULT_PAYMENT_SETTINGS;
};

export const savePaymentSettings = async (settings: PaymentSettings) => {
  try {
    const docRef = doc(db, 'settings', 'payments');
    await setDoc(docRef, settings, { merge: true });
  } catch (e) {
    console.error("Error saving payment settings: ", e);
    throw e;
  }
};

export const subscribeToPaymentSettings = (callback: (settings: PaymentSettings) => void) => {
  const docRef = doc(db, 'settings', 'payments');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback({ ...DEFAULT_PAYMENT_SETTINGS, ...snap.data() } as PaymentSettings);
    } else {
      callback(DEFAULT_PAYMENT_SETTINGS);
    }
  }, (err) => {
    console.warn("Erro ao escutar configurações de pagamento:", err);
    callback(DEFAULT_PAYMENT_SETTINGS);
  });
};

export interface PrinterSettings {
  autoPrint: boolean;
  printerType: 'thermal_80' | 'thermal_58' | 'normal';
  printerModel: 'ps80' | 'generic_80' | 'generic_58' | 'a4';
  connectionMode: 'spooler' | 'webusb';
  cutPaper: boolean;
  beepOnPrint: boolean;
  charsPerLine: number;
  fontSize: 'small' | 'medium' | 'large';
  printCopies: number; // 1 ou 2
  printHeader: string;
  printSubHeader: string;
  printPhone: string;
  printAddress: string;
  printFooter: string;
  showOrderNumber: boolean;
  showPassword: boolean;
  showCustomerPhone: boolean;
  showDeliveryAddress: boolean;
  showItemObservations: boolean;
  showPaymentDetails: boolean;
  feedLines: number;
}

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  autoPrint: true,
  printerType: 'thermal_80',
  printerModel: 'ps80',
  connectionMode: 'spooler',
  cutPaper: true,
  beepOnPrint: false,
  charsPerLine: 48,
  fontSize: 'medium',
  printCopies: 1,
  printHeader: 'NICKEL LANCHES',
  printSubHeader: 'Delivery de Verdade!',
  printPhone: '(54) 99959-8389',
  printAddress: 'R. Uruguai, 919 - Petrópolis - Passo Fundo - RS',
  printFooter: 'Até a próxima!',
  showOrderNumber: true,
  showPassword: true,
  showCustomerPhone: true,
  showDeliveryAddress: true,
  showItemObservations: true,
  showPaymentDetails: true,
  feedLines: 4
};

export const getPrinterSettings = async (): Promise<PrinterSettings> => {
  try {
    const docRef = doc(db, 'settings', 'printer');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_PRINTER_SETTINGS, ...snap.data() } as PrinterSettings;
    }
  } catch (e) {
    console.error("Erro ao buscar configurações de impressora:", e);
  }
  return DEFAULT_PRINTER_SETTINGS;
};

export const savePrinterSettings = async (settings: PrinterSettings) => {
  try {
    const docRef = doc(db, 'settings', 'printer');
    await setDoc(docRef, settings, { merge: true });
    // Keep local cache in sync
    localStorage.setItem('nickel_printer_settings', JSON.stringify(settings));
  } catch (e) {
    console.error("Erro ao salvar configurações de impressora:", e);
    throw e;
  }
};

export const subscribeToPrinterSettings = (callback: (settings: PrinterSettings) => void) => {
  const docRef = doc(db, 'settings', 'printer');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = { ...DEFAULT_PRINTER_SETTINGS, ...snap.data() } as PrinterSettings;
      localStorage.setItem('nickel_printer_settings', JSON.stringify(data));
      callback(data);
    } else {
      const cached = localStorage.getItem('nickel_printer_settings');
      if (cached) {
        try {
          callback({ ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(cached) });
          return;
        } catch (_) {}
      }
      callback(DEFAULT_PRINTER_SETTINGS);
    }
  }, (err) => {
    console.warn("Erro ao escutar configurações de impressora, usando cache local:", err);
    const cached = localStorage.getItem('nickel_printer_settings');
    if (cached) {
      try {
        callback({ ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(cached) });
        return;
      } catch (_) {}
    }
    callback(DEFAULT_PRINTER_SETTINGS);
  });
};

