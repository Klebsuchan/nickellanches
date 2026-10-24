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
  isPaid?: boolean;
  paymentStatus?: 'pago' | 'pendente' | 'recusado';
  paidAt?: any;
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
  deliveryNotes?: string;
  adminNotes?: string;
}

export const isOrderPaid = (order: Partial<Order> | undefined | null): boolean => {
  if (!order) return false;
  // Pedidos marcados explicitamente como não pagos ou pendentes NÃO são pagos (aguardam confirmação do caixa)
  if (order.isPaid === false || order.paymentStatus === 'pendente' || order.paymentStatus === 'recusado') {
    return false;
  }
  if (order.isPaid === true || order.paymentStatus === 'pago') {
    return true;
  }
  const method = (order.paymentMethod || '').toLowerCase();
  // Apenas transações confirmadas por gateway direto (ex: Stripe aprovado) entram pré-pagas
  if (method.includes('aprovado') || method.includes('pago online') || method.includes('stripe')) {
    return true;
  }
  return false;
};

const LOCAL_ORDERS_KEY = 'nickel_local_orders_v1';

const getLocalCachedOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

const saveLocalCachedOrder = (order: Order) => {
  try {
    const current = getLocalCachedOrders().filter(o => o.id !== order.id);
    const updated = [order, ...current].slice(0, 100);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nickel-orders-updated'));
  } catch {}
};

export const createUserProfile = async (user: FirebaseUser) => {
  try {
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
  } catch (_) {}
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (_) {}
  return null;
};

export const addXpToUser = async (userId: string, xpToAdd: number) => {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const currentXp = snap.data().xp || 0;
      await updateDoc(userRef, {
        xp: currentXp + xpToAdd
      });
    }
  } catch (_) {}
};

export const cleanObjectForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObjectForFirestore(item));
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        res[key] = cleanObjectForFirestore(val);
      }
    }
    return res;
  }
  return obj;
};

export const saveOrder = async (userId: string, orderData: Omit<Order, 'createdAt' | 'id'>) => {
  const paid = isOrderPaid(orderData);
  const fallbackId = 'NKL' + Date.now().toString(36).toUpperCase();
  const localOrder: Order = {
    ...orderData,
    id: fallbackId,
    isPaid: paid,
    paymentStatus: paid ? 'pago' : (orderData.paymentStatus || 'pendente'),
    userId,
    createdAt: new Date().toISOString()
  };

  // 1. Salva imediatamente no backend persistente (garante que todos os navegadores/admin vejam)
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localOrder)
    });
  } catch (apiErr) {
    console.warn("Aviso ao salvar pedido na API do servidor:", apiErr);
  }

  // 2. Notifica sinal de impressão no backend caso seja pago (PIX ou Cartão)
  if (paid) {
    try {
      await fetch('/api/print-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latestOrderId: localOrder.id,
          orderNumber: orderData.orderNumber || 1,
          isPaid: true
        })
      });
    } catch (_) {}
  }

  // 3. Atualiza cache local
  saveLocalCachedOrder(localOrder);

  // 4. Salva no Firestore como camada adicional (com proteção contra cota diária ou offline)
  try {
    const globalOrdersRef = collection(db, "global_orders");
    const sanitized = cleanObjectForFirestore(orderData);
    const payload = {
      ...sanitized,
      isPaid: paid,
      paymentStatus: paid ? 'pago' : (orderData.paymentStatus || 'pendente'),
      userId,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(globalOrdersRef, payload);
    localOrder.id = docRef.id;
    saveLocalCachedOrder(localOrder);

    // Atualiza com o ID real do Firestore no backend
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localOrder)
    }).catch(() => {});

    if (userId !== 'guest') {
      await setDoc(doc(db, "users", userId, "orders", docRef.id), payload).catch(() => {});
    }

    if (paid) {
      try {
        await setDoc(doc(db, "settings", "print_signal"), {
          latestOrderId: docRef.id,
          orderNumber: orderData.orderNumber || 1,
          isPaid: true,
          updatedAtMs: Date.now()
        }, { merge: true });
      } catch (_) {}
    }

    return docRef.id;
  } catch (e) {
    console.warn("Aviso ao salvar pedido no Firestore (usando servidor e cache local):", e);
    return fallbackId;
  }
};

export const markOrderAsPaid = async (orderId: string, orderNumber?: number) => {
  try {
    const localOrders = getLocalCachedOrders();
    const target = localOrders.find(o => o.id === orderId);
    if (target) {
      saveLocalCachedOrder({ ...target, isPaid: true, paymentStatus: 'pago', paidAt: new Date().toISOString() });
    }

    // Atualiza no servidor
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: true, paymentStatus: 'pago', paidAt: new Date().toISOString() })
      });
      await fetch('/api/print-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latestOrderId: orderId,
          orderNumber: orderNumber || 1,
          isPaid: true
        })
      });
    } catch (_) {}

    const orderRef = doc(db, 'global_orders', orderId);
    await updateDoc(orderRef, {
      isPaid: true,
      paymentStatus: 'pago',
      paidAt: serverTimestamp()
    });

    // Notifica a fila de Impressão Automática na nuvem imediatamente
    await setDoc(doc(db, "settings", "print_signal"), {
      latestOrderId: orderId,
      orderNumber: orderNumber || 1,
      isPaid: true,
      updatedAtMs: Date.now()
    }, { merge: true });
  } catch (e) {
    console.warn("Aviso ao marcar pedido como pago:", e);
  }
};

export const getLatestOrders = async (userId: string): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, "users", userId, "orders");
    const q = query(ordersRef, orderBy("createdAt", "desc"), limit(5));
    const snap = await getDocs(q);
    
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
  } catch (_) {
    return getLocalCachedOrders().filter(o => o.userId === userId).slice(0, 5);
  }
};

export const getTopUsers = async (): Promise<(UserProfile & { id: string })[]> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("xp", "desc"), limit(10));
    const snap = await getDocs(q);
    
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (UserProfile & { id: string })[];
  } catch (_) {
    return [];
  }
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
  try {
    const feedbacksRef = collection(db, "feedbacks");
    await addDoc(feedbacksRef, {
      ...feedbackData,
      createdAt: serverTimestamp()
    });
  } catch (_) {}
};

export const getFeedbacks = async (): Promise<Feedback[]> => {
  try {
    const feedbacksRef = collection(db, "feedbacks");
    const q = query(feedbacksRef, orderBy("createdAt", "desc"), limit(20));
    const snap = await getDocs(q);
    
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Feedback[];
  } catch (_) {
    return [];
  }
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
  return snap.docs
    .filter(doc => doc.id !== 'teste_pagamento_10cts')
    .map(doc => ({ ...doc.data(), id: doc.id })) as Product[];
};

export const saveProduct = async (product: Omit<Product, 'id'>, id?: string) => {
  if (id) {
    await setDoc(doc(db, "products", id), product as any, { merge: true });
  } else {
    await addDoc(collection(db, "products"), product);
  }
};

export const toggleProductPause = async (product: Product, paused: boolean) => {
  if (!product.id) return;
  await setDoc(
    doc(db, "products", product.id),
    { ...product, paused },
    { merge: true }
  );
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
  const q = query(ordersRef, orderBy("createdAt", "desc"), limit(300));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Order[];
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const local = getLocalCachedOrders();
    const target = local.find(o => o.id === orderId);
    if (target) {
      saveLocalCachedOrder({ ...target, status });
    }
    fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(() => {});
  } catch {}
  try {
    const orderRef = doc(db, "global_orders", orderId);
    await updateDoc(orderRef, { status });
  } catch (e) {
    console.warn("Aviso ao atualizar status no Firestore:", e);
  }
};

import { onSnapshot } from "firebase/firestore";
import { MENU_ITEMS } from "../data";
import {
  StoreHoursSettings,
  DEFAULT_STORE_HOURS,
  setCachedStoreHours,
  getCachedStoreHours,
} from "./storeHours";

export const getStoreHoursSettings = async (): Promise<StoreHoursSettings> => {
  try {
    const docRef = doc(db, "settings", "store_hours");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const hasOldHours = Array.isArray(data.schedule) && data.schedule.some((d: any) => d.closeTime === '23:45' || d.closeTime === '23:59');
      const merged = { 
        ...DEFAULT_STORE_HOURS, 
        ...data,
        schedule: hasOldHours ? DEFAULT_STORE_HOURS.schedule : (data.schedule || DEFAULT_STORE_HOURS.schedule),
        mode: (data.mode === 'open' && !data.updatedAtMs) ? 'auto' : (data.mode || 'auto')
      } as StoreHoursSettings;
      setCachedStoreHours(merged);
      return merged;
    }
  } catch (e) {
    console.error("Erro ao buscar horário de funcionamento:", e);
  }
  return getCachedStoreHours();
};

export const saveStoreHoursSettings = async (settings: StoreHoursSettings) => {
  const payload: StoreHoursSettings = {
    ...settings,
    updatedAtMs: Date.now(),
  };
  setCachedStoreHours(payload);
  try {
    localStorage.setItem("nickel_simular_segunda", payload.mode === "closed" ? "true" : "false");
  } catch {}
  try {
    const docRef = doc(db, "settings", "store_hours");
    await setDoc(docRef, payload, { merge: true });
  } catch (e) {
    console.error("Erro ao salvar horário de funcionamento:", e);
    throw e;
  }
};

export const subscribeToStoreHours = (callback: (settings: StoreHoursSettings) => void) => {
  const docRef = doc(db, "settings", "store_hours");
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const hasOldHours = Array.isArray(data.schedule) && data.schedule.some((d: any) => d.closeTime === '23:45' || d.closeTime === '23:59');
        const merged = { 
          ...DEFAULT_STORE_HOURS, 
          ...data,
          schedule: hasOldHours ? DEFAULT_STORE_HOURS.schedule : (data.schedule || DEFAULT_STORE_HOURS.schedule),
          mode: (data.mode === 'open' && !data.updatedAtMs) ? 'auto' : (data.mode || 'auto')
        } as StoreHoursSettings;
        setCachedStoreHours(merged);
        try {
          localStorage.setItem("nickel_simular_segunda", merged.mode === "closed" ? "true" : "false");
        } catch {}
        callback(merged);
      } else {
        const cached = getCachedStoreHours();
        callback(cached);
      }
    },
    () => {
      callback(getCachedStoreHours());
    }
  );
};

export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  const productsRef = collection(db, "products");
  return onSnapshot(productsRef, (snap) => {
    if (snap.empty) {
      callback(MENU_ITEMS);
      return;
    }
    const firestoreMap = new Map(snap.docs.map(d => [d.id, { ...d.data(), id: d.id } as Product]));
    
    // Combine MENU_ITEMS preserving canonical order, updating with Firestore data (including paused state, price, description, extras)
    const merged = MENU_ITEMS.map(item => {
      const fromDb = firestoreMap.get(item.id!);
      if (!fromDb) return item;
      return {
        ...item,
        ...fromDb,
        image: fromDb.image || item.image,
        price: fromDb.price ?? item.price,
        paused: Boolean(fromDb.paused),
      };
    });

    // Also include any dynamically added products from Firestore
    const menuItemIds = new Set(MENU_ITEMS.map(i => i.id));
    for (const d of snap.docs) {
      if (d.id === 'teste_pagamento_10cts') {
        deleteDoc(d.ref).catch(() => {});
        continue;
      }
      if (!menuItemIds.has(d.id)) {
        merged.push({ ...d.data(), id: d.id } as Product);
      }
    }

    const finalProducts = merged.filter(p => p.id !== 'teste_pagamento_10cts');
    try {
      localStorage.setItem('nickel_cached_products', JSON.stringify(finalProducts));
    } catch {}
    callback(finalProducts);
  }, () => {
    try {
      const cached = localStorage.getItem('nickel_cached_products');
      if (cached) {
        const parsed: Product[] = JSON.parse(cached);
        const cachedIds = new Set(parsed.map(p => p.id));
        const missing = MENU_ITEMS.filter(m => !cachedIds.has(m.id));
        callback([...missing, ...parsed]);
        return;
      }
    } catch {}
    callback(MENU_ITEMS);
  });
};

export const subscribeToPromos = (callback: (promos: PromoCode[]) => void) => {
  const promosRef = collection(db, "promos");
  return onSnapshot(promosRef, (snap) => {
    const list = snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as PromoCode[];
    try {
      localStorage.setItem('nickel_cached_promos', JSON.stringify(list));
    } catch {}
    callback(list);
  }, () => {
    try {
      const cached = localStorage.getItem('nickel_cached_promos');
      if (cached) {
        callback(JSON.parse(cached));
        return;
      }
    } catch {}
    callback([]);
  });
};

export const subscribeToOrder = (orderId: string, callback: (order: Order) => void) => {
  const orderRef = doc(db, "global_orders", orderId);
  const unsubFirestore = onSnapshot(orderRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() } as Order;
      saveLocalCachedOrder(data);
      callback(data);
    }
  }, () => {
    const local = getLocalCachedOrders().find(o => o.id === orderId);
    if (local) callback(local);
  });

  // Escuta atualizações locais disparadas no navegador
  const handleLocalUpdate = () => {
    const local = getLocalCachedOrders().find(o => o.id === orderId);
    if (local) callback(local);
  };
  window.addEventListener('nickel-orders-updated', handleLocalUpdate);

  // Sincronização periódica com a API do servidor (garante atualização entre abas e dispositivos)
  const pollTimer = setInterval(async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const orders: Order[] = await res.json();
        const found = orders.find(o => o.id === orderId);
        if (found) {
          callback(found);
        }
      }
    } catch (_) {}
  }, 2500);

  return () => {
    unsubFirestore();
    window.removeEventListener('nickel-orders-updated', handleLocalUpdate);
    clearInterval(pollTimer);
  };
};

export const subscribeToAllOrders = (callback: (orders: Order[]) => void) => {
  const orderMap = new Map<string, Order>();

  const getSortTime = (createdAt: any): number => {
    if (!createdAt) return 0;
    if (typeof createdAt?.toMillis === 'function') return createdAt.toMillis();
    if (typeof createdAt?.toDate === 'function') return createdAt.toDate().getTime();
    if (createdAt instanceof Date) return createdAt.getTime();
    const t = new Date(createdAt).getTime();
    return isNaN(t) ? 0 : t;
  };

  const notify = () => {
    const list = Array.from(orderMap.values()).sort((a, b) => {
      const timeA = getSortTime(a.createdAt);
      const timeB = getSortTime(b.createdAt);
      if (timeA && timeB && timeA !== timeB) return timeB - timeA;
      return (b.orderNumber || 0) - (a.orderNumber || 0);
    });
    try {
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list.slice(0, 100)));
    } catch {}
    callback(list);
  };

  // 1. Carrega imediatamente os pedidos em cache local
  const initialLocal = getLocalCachedOrders();
  initialLocal.forEach(o => {
    if (o.id) orderMap.set(o.id, o);
  });
  if (orderMap.size > 0) notify();

  // 2. Sincroniza pedidos locais não enviados para o servidor
  if (initialLocal.length > 0) {
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialLocal)
    }).catch(() => {});
  }

  // 3. Busca pedidos do servidor imediatamente e inicia polling em tempo real
  const fetchServerOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const serverOrders: Order[] = await res.json();
        let changed = false;
        serverOrders.forEach(o => {
          if (!o.id) return;
          const existing = orderMap.get(o.id);
          if (!existing || JSON.stringify(existing) !== JSON.stringify(o)) {
            orderMap.set(o.id, { ...existing, ...o });
            changed = true;
          }
        });
        if (changed || orderMap.size === 0) {
          notify();
        }
      }
    } catch (_) {}
  };
  fetchServerOrders();
  const pollInterval = setInterval(fetchServerOrders, 2000);

  // 4. Escuta eventos locais na mesma aba ou em abas diferentes
  const onLocalUpdate = () => {
    const fresh = getLocalCachedOrders();
    fresh.forEach(o => {
      if (o.id) orderMap.set(o.id, { ...orderMap.get(o.id), ...o });
    });
    notify();
  };
  window.addEventListener('nickel-orders-updated', onLocalUpdate);
  window.addEventListener('storage', onLocalUpdate);

  // 5. Camada Firestore em tempo real
  let unsubFirestore = () => {};
  try {
    const ordersRef = collection(db, "global_orders");
    const q = query(ordersRef, orderBy("createdAt", "desc"), limit(50));
    unsubFirestore = onSnapshot(q, (snap) => {
      snap.docs.forEach(doc => {
        const remote = { ...doc.data(), id: doc.id } as Order;
        orderMap.set(remote.id!, remote);
      });
      notify();
    }, (err) => {
      console.warn("Aviso na escuta de pedidos do Firestore (mantendo servidor e cache ativo):", err);
    });
  } catch (err) {
    console.warn("Erro ao inicializar escuta do Firestore:", err);
  }

  return () => {
    clearInterval(pollInterval);
    window.removeEventListener('nickel-orders-updated', onLocalUpdate);
    window.removeEventListener('storage', onLocalUpdate);
    unsubFirestore();
  };
};

export const seedDatabase = async (initialProducts: Product[], initialPromos: { [key: string]: number }) => {
  const TARGET_VERSION = 26;
  try {
    if (localStorage.getItem('nickel_seed_version') === String(TARGET_VERSION)) {
      return;
    }

    const productsRef = collection(db, "products");
    const promosRef = collection(db, "promos");
    const metaRef = doc(db, "system", "metadata");
    
    const metaSnap = await getDoc(metaRef);
    const currentVersion = metaSnap.exists() ? metaSnap.data().seedVersion : 0;
    if (currentVersion >= TARGET_VERSION) {
      localStorage.setItem('nickel_seed_version', String(TARGET_VERSION));
      return;
    }
  
    const productsSnap = await getDocs(productsRef);
    const existingDocs = new Map(productsSnap.docs.map(d => [d.id, d.data()]));
    
    // Ensure obsolete test product is removed
    try {
      await deleteDoc(doc(db, "products", "teste_pagamento_10cts"));
    } catch {
      // ignore
    }

    if (currentVersion < TARGET_VERSION || productsSnap.empty) {
      for (const p of initialProducts) {
        try {
          const existing = existingDocs.get(p.id!);
          const preservedPaused = existing && typeof existing.paused === 'boolean' ? existing.paused : false;
          await setDoc(doc(db, "products", p.id!), { ...p, paused: preservedPaused }, { merge: true });
        } catch (_) {}
      }
      try {
        await setDoc(doc(db, "settings", "payments"), {
          onlinePaymentsEnabled: true,
          pix: {
            ...DEFAULT_PAYMENT_SETTINGS.pix,
            enabled: true
          },
          cardOnline: {
            ...DEFAULT_PAYMENT_SETTINGS.cardOnline,
            enabled: true,
            acceptCredit: true,
            acceptDebit: true
          }
        }, { merge: true });
      } catch (_) {}
      try {
        await setDoc(doc(db, "settings", "store_hours"), {
          mode: 'auto',
          closedTitle: 'Loja Fechada no Momento',
          closedDescription: 'Nosso horário de funcionamento é das 18:30 às 22:30. Faça seu pedido assim que abrirmos!',
          bannerText: '⏰ LOJA FECHADA NO MOMENTO • ATENDIMENTO DAS 18:30 ÀS 22:30',
          schedule: DEFAULT_STORE_HOURS.schedule,
          updatedAtMs: Date.now()
        }, { merge: true });
        setCachedStoreHours({
          ...DEFAULT_STORE_HOURS,
          updatedAtMs: Date.now()
        });
      } catch (_) {}
      try {
        await setDoc(metaRef, { seedVersion: TARGET_VERSION }, { merge: true });
        localStorage.setItem('nickel_seed_version', String(TARGET_VERSION));
      } catch (_) {}
    }
    
    const promosSnap = await getDocs(promosRef);
    if (promosSnap.empty) {
      for (const [code, discount] of Object.entries(initialPromos)) {
        await setDoc(doc(db, "promos", code), { code, discount }).catch(() => {});
      }
    }
  } catch (_) {
    // Silencia erro caso a cota diária gratuita do Firestore tenha sido atingida
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
  const defaultSettings: SiteSettings = {
    heroVideoUrl: '/videobackground.mp4',
    heroTitle: 'O MELHOR XIS E CACHORRO-QUENTE',
    heroSubtitle: 'Sabor de verdade que mata a sua fome e te deixa com gostinho de quero mais.'
  };
  const docRef = doc(db, 'settings', 'main');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as SiteSettings);
    } else {
      callback(defaultSettings);
    }
  }, () => {
    callback(defaultSettings);
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
  } catch (_) {
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
    console.warn("Aviso ao salvar banner:", e);
    throw e;
  }
};

export const deleteBanner = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'banners', id));
  } catch (e) {
    console.warn("Aviso ao excluir banner:", e);
    throw e;
  }
};

export const subscribeToBanners = (callback: (banners: Banner[]) => void) => {
  const defaultBanners: Banner[] = [
    {
      id: '1',
      image: "/images/comboloucura.jpg",
      title: "Promoção Loucura",
      description: "4 X-Especiais por R$ 90 + Refri 2L Charrua"
    }
  ];
  const q = query(collection(db, 'banners'));
  return onSnapshot(q, (querySnapshot) => {
    const banners: Banner[] = [];
    querySnapshot.forEach((doc) => {
      banners.push({ id: doc.id, ...doc.data() } as Banner);
    });
    if (banners.length === 0) {
      callback(defaultBanners);
    } else {
      callback(banners);
    }
  }, () => {
    callback(defaultBanners);
  });
};

export const deleteOrder = async (orderId: string) => {
  try {
    const remaining = getLocalCachedOrders().filter(o => o.id !== orderId);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(remaining));
    window.dispatchEvent(new CustomEvent('nickel-orders-updated'));
    fetch(`/api/orders/${orderId}`, { method: 'DELETE' }).catch(() => {});
  } catch {}
  try {
    await deleteDoc(doc(db, 'global_orders', orderId));
  } catch (e) {
    console.warn("Aviso ao remover pedido no Firestore:", e);
  }
};

export const saveOrderAdmin = async (orderId: string, updates: Partial<Order>) => {
  try {
    const localOrders = getLocalCachedOrders();
    const target = localOrders.find(o => o.id === orderId);
    if (target) {
      saveLocalCachedOrder({ ...target, ...updates });
    }
    fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(() => {});
  } catch {}
  try {
    await updateDoc(doc(db, 'global_orders', orderId), cleanObjectForFirestore(updates));
    if (updates.isPaid === true || updates.paymentStatus === 'pago') {
      try {
        await setDoc(doc(db, "settings", "print_signal"), {
          latestOrderId: orderId,
          orderNumber: updates.orderNumber || 1,
          isPaid: true,
          updatedAtMs: Date.now()
        }, { merge: true });
      } catch (_) {}
    }
  } catch (e) {
    console.warn("Aviso ao atualizar pedido no Firestore:", e);
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
    enabled: false,
    bankName: 'Nubank (260)',
    agency: '0001',
    accountNumber: '99106460-4',
    accountType: 'corrente',
    holderName: 'Braian Kleber Camargo',
    holderDocument: '',
    instructions: 'Faça a transferência com o valor exato do seu pedido e anexe o comprovante com agência e conta.'
  },
  generalNotes: 'Após realizar o pagamento online, envie seu pedido pelo WhatsApp com a confirmação.'
};

export const getPaymentSettings = async (): Promise<PaymentSettings> => {
  try {
    const docRef = doc(db, 'settings', 'payments');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        ...DEFAULT_PAYMENT_SETTINGS,
        ...data,
        pix: { ...DEFAULT_PAYMENT_SETTINGS.pix, ...(data.pix || {}) },
        cardOnline: { ...DEFAULT_PAYMENT_SETTINGS.cardOnline, ...(data.cardOnline || {}) },
        bankAccount: { ...DEFAULT_PAYMENT_SETTINGS.bankAccount, ...(data.bankAccount || {}) },
      } as PaymentSettings;
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
      const data = snap.data();
      callback({
        ...DEFAULT_PAYMENT_SETTINGS,
        ...data,
        pix: { ...DEFAULT_PAYMENT_SETTINGS.pix, ...(data.pix || {}) },
        cardOnline: { ...DEFAULT_PAYMENT_SETTINGS.cardOnline, ...(data.cardOnline || {}) },
        bankAccount: { ...DEFAULT_PAYMENT_SETTINGS.bankAccount, ...(data.bankAccount || {}) },
      } as PaymentSettings);
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

export interface CloudBridgeStatus {
  printerName: string;
  printedCount: number;
  lastSeenMs: number;
  lastPrintedOrder?: string;
  autoStartEnabled?: boolean;
  bridgeVersion?: number;
}

export const getCloudBridgeStatus = async (): Promise<{
  connected: boolean;
  printerName?: string;
  printedCount?: number;
  lastSeenMs?: number;
  bridgeVersion?: number;
}> => {
  try {
    const snap = await getDoc(doc(db, 'settings', 'bridge_status'));
    if (snap.exists()) {
      const data = snap.data() as CloudBridgeStatus;
      const lastSeen = Number(data.lastSeenMs || 0);
      const bridgeVersion = Number(data.bridgeVersion || 1);
      // Consider active if heartbeat was updated within the last 60 seconds
      if (Date.now() - lastSeen < 60000) {
        return {
          connected: true,
          printerName: data.printerName || 'Impressora Padrão do Windows',
          printedCount: Number(data.printedCount || 0),
          lastSeenMs: lastSeen,
          bridgeVersion,
        };
      }
    }
  } catch (_) {}
  return { connected: false };
};

export const subscribeToBridgeStatus = (
  callback: (status: {
    connected: boolean;
    printerName?: string;
    printedCount?: number;
    bridgeVersion?: number;
  }) => void
) => {
  const docRef = doc(db, 'settings', 'bridge_status');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as CloudBridgeStatus;
        const lastSeen = Number(data.lastSeenMs || 0);
        const isOnline = Date.now() - lastSeen < 60000;
        const bridgeVersion = Number(data.bridgeVersion || 1);
        callback({
          connected: isOnline,
          printerName: data.printerName || 'Impressora Padrão do Windows',
          printedCount: Number(data.printedCount || 0),
          bridgeVersion,
        });
      } else {
        callback({ connected: false });
      }
    },
    () => {
      callback({ connected: false });
    }
  );
};

export const enqueueCloudPrintJob = async (job: {
  orderId: string;
  orderNumber: string | number;
  text?: string;
  html?: string;
  imageBase64?: string;
  force?: boolean;
}): Promise<boolean> => {
  try {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await setDoc(doc(db, 'settings', 'print_queue'), {
      jobId,
      orderId: String(job.orderId || 'manual'),
      orderNumber: String(job.orderNumber || '1'),
      // Keep text empty so any legacy v1 background script never prints old plain-text format
      text: '',
      imageBase64: job.imageBase64 || '',
      html: job.html || '',
      force: Boolean(job.force),
      createdAtMs: Date.now(),
    });
    return true;
  } catch (e) {
    console.warn('Erro ao enviar comanda para fila na nuvem:', e);
    return false;
  }
};


