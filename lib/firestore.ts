import { db } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export interface Transaction {
  id?: string;
  amount: number;
  category: string;
  note: string;
  type: "expense" | "income";
  date: string;
  createdAt?: Timestamp;
}

// Menambahkan transaksi baru ke Firestore (User specific)
export async function addTransaction(userId: string, data: Omit<Transaction, "id" | "createdAt">) {
  try {
    const userRef = collection(db, "users", userId, "transactions");
    const docRef = await addDoc(userRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Gagal menambah transaksi:", error);
    throw error;
  }
}

// Menghapus transaksi
export async function deleteTransaction(userId: string, transactionId: string) {
  try {
    const docRef = doc(db, "users", userId, "transactions", transactionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Gagal menghapus transaksi:", error);
    throw error;
  }
}

// Subskripsi data transaksi secara Real-time
export function subscribeUserTransactions(
  userId: string,
  callback: (transactions: Transaction[]) => void
) {
  const userRef = collection(db, "users", userId, "transactions");
  const q = query(userRef, orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const list: Transaction[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Transaction, "id">),
    }));
    callback(list);
  });
}