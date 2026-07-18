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
  const q = query(feedbacksRef, orderBy("createdAt", "desc"), limit(20));
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

export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  const productsRef = collection(db, "products");
  return onSnapshot(productsRef, (snap) => {
    callback(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Product[]);
  });
};

export const subscribeToPromos = (callback: (promos: PromoCode[]) => void) => {
  const promosRef = collection(db, "promos");
  return onSnapshot(promosRef, (snap) => {
    callback(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as PromoCode[]);
  });
};

export const subscribeToOrder = (orderId: string, callback: (order: Order) => void) => {
  const orderRef = doc(db, "global_orders", orderId);
  return onSnapshot(orderRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Order);
    }
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
  const productsRef = collection(db, "products");
  const promosRef = collection(db, "promos");
  
  const productsSnap = await getDocs(productsRef);
  if (productsSnap.empty) {
    for (const p of initialProducts) {
      await setDoc(doc(db, "products", p.id!), p);
    }
  }
  
  const promosSnap = await getDocs(promosRef);
  if (promosSnap.empty) {
    for (const [code, discount] of Object.entries(initialPromos)) {
      await setDoc(doc(db, "promos", code), { code, discount });
    }
  }
};
