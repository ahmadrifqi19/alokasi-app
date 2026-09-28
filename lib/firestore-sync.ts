import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { Dompet, AnggaranKategori } from "@/types";

// Interface Transaksi Asli Dashboard
export interface DashboardTransaction {
  id: string;
  dompetId: string;
  dompetTujuanId?: string;
  kategoriId?: string;
  nominal: number;
  tipe: "expense" | "income" | "transfer";
  catatan?: string;
  tanggalObj: Date;
  tanggalStr: string;
}

// ------------------------------------------------------------------
// 1. LISTEN & SAVE TRANSAKSI
// ------------------------------------------------------------------
export function subscribeFirebaseTransactions(
  userId: string,
  callback: (transactions: DashboardTransaction[]) => void
) {
  const transRef = collection(db, "users", userId, "transactions");
  const q = query(transRef, orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const list: DashboardTransaction[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        dompetId: data.dompetId,
        dompetTujuanId: data.dompetTujuanId || "",
        kategoriId: data.kategoriId || "",
        nominal: data.nominal,
        tipe: data.tipe,
        catatan: data.catatan || "",
        tanggalObj: data.createdAt?.toDate() || new Date(),
        tanggalStr: data.tanggalStr || "Baru saja",
      };
    });
    callback(list);
  });
}

export async function saveFirebaseTransaction(
  userId: string,
  transaksi: DashboardTransaction
) {
  try {
    const docRef = doc(db, "users", userId, "transactions", transaksi.id);

    // Pembersihan objek: Ubah nilai undefined menjadi string kosong/null agar Firestore tidak melempar error
    const cleanPayload = {
      id: transaksi.id,
      dompetId: transaksi.dompetId,
      dompetTujuanId: transaksi.dompetTujuanId ?? null,
      kategoriId: transaksi.kategoriId ?? null,
      nominal: transaksi.nominal,
      tipe: transaksi.tipe,
      catatan: transaksi.catatan ?? "",
      tanggalStr: transaksi.tanggalStr,
      createdAt: serverTimestamp(),
    };

    await setDoc(docRef, cleanPayload);
  } catch (error) {
    console.error("Gagal menyimpan transaksi ke Firestore:", error);
  }
}

// ------------------------------------------------------------------
// 2. LISTEN & SAVE DOMPET
// ------------------------------------------------------------------
export function subscribeFirebaseWallets(
  userId: string,
  callback: (wallets: Dompet[]) => void
) {
  const walletsRef = collection(db, "users", userId, "wallets");
  return onSnapshot(walletsRef, (snapshot) => {
    if (!snapshot.empty) {
      const list = snapshot.docs.map((docSnap) => docSnap.data() as Dompet);
      callback(list);
    }
  });
}

export async function saveFirebaseWallets(userId: string, wallets: Dompet[]) {
  try {
    for (const w of wallets) {
      if (!w.id) {
        console.warn("Melewati dompet tanpa ID saat sinkronisasi.");
        continue;
      }

      const cleanWallet = {
        id: w.id,
        nama: w.nama,
        tipe: w.tipe,
        saldo: w.saldo,
        warna: w.warna ?? "bg-blue-600",
      };
      await setDoc(doc(db, "users", userId, "wallets", w.id), cleanWallet, {
        merge: true,
      });
    }
  } catch (error) {
    console.error("Gagal update dompet ke Firestore:", error);
  }
}

// ------------------------------------------------------------------
// 3. LISTEN & SAVE ANGGARAN LIMIT (BUDGET GUARD)
// ------------------------------------------------------------------
export function subscribeFirebaseBudgets(
  userId: string,
  callback: (budgets: AnggaranKategori[]) => void
) {
  const budgetsRef = collection(db, "users", userId, "budgets");
  return onSnapshot(budgetsRef, (snapshot) => {
    if (!snapshot.empty) {
      const list = snapshot.docs.map(
        (docSnap) => docSnap.data() as AnggaranKategori
      );
      callback(list);
    }
  });
}

export async function saveFirebaseBudget(
  userId: string,
  budget: AnggaranKategori
) {
  try {
    const docRef = doc(db, "users", userId, "budgets", budget.kategoriId);

    const cleanBudget = {
      id: budget.id,
      kategoriId: budget.kategoriId,
      namaKategori: budget.namaKategori,
      limitBulanan: budget.limitBulanan,
      terpakai: budget.terpakai ?? 0,
    };

    await setDoc(docRef, cleanBudget, { merge: true });
  } catch (error) {
    console.error("Gagal menyimpan budget limit:", error);
  }
}