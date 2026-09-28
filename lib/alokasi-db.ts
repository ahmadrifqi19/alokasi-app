// lib/alokasi-db.ts
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  writeBatch,
  increment,
  Timestamp,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { Dompet, Kategori, Transaksi, TargetTabungan } from "@/types";

// ========================================================
// 1. INIT DATA DEFAULT UNTUK PENGGUNA BARU ALOKASI
// ========================================================
export async function initDataUserAlokasi(userId: string) {
  const batch = writeBatch(db);

  // Kategori bawaan
  const defaultKategori: Omit<Kategori, "id">[] = [
    { nama: "Makanan & Minuman", tipe: "expense", icon: "utensils" },
    { nama: "Transportasi", tipe: "expense", icon: "car" },
    { nama: "Belanja", tipe: "expense", icon: "shopping-bag" },
    { nama: "Tagihan & Utilitas", tipe: "expense", icon: "receipt" },
    { nama: "Gaji & Pemasukan", tipe: "income", icon: "wallet" },
  ];

  defaultKategori.forEach((kategori) => {
    const ref = doc(collection(db, `users/${userId}/kategori`));
    batch.set(ref, kategori);
  });

  await batch.commit();
}

// ========================================================
// 2. LOGIKA TRANSAKSI & UPDATE SALDO OTOMATIS
// ========================================================
export async function catatTransaksi(
  userId: string,
  data: Omit<Transaksi, "id">
) {
  const batch = writeBatch(db);

  // 1. Buat dokumen transaksi baru
  const transRef = doc(collection(db, `users/${userId}/transaksi`));
  batch.set(transRef, {
    ...data,
    tanggal: Timestamp.fromDate(data.tanggal),
    createdAt: Timestamp.now(),
  });

  // 2. Reference ke dompet asal
  const dompetAsalRef = doc(db, `users/${userId}/dompet`, data.dompetId);

  // 3. Atur potongan / penambahan saldo
  if (data.tipe === "expense") {
    batch.update(dompetAsalRef, { saldo: increment(-data.nominal) });
  } else if (data.tipe === "income") {
    batch.update(dompetAsalRef, { saldo: increment(data.nominal) });
  } else if (data.tipe === "transfer" && data.dompetTujuanId) {
    const dompetTujuanRef = doc(
      db,
      `users/${userId}/dompet`,
      data.dompetTujuanId
    );
    batch.update(dompetAsalRef, { saldo: increment(-data.nominal) });
    batch.update(dompetTujuanRef, { saldo: increment(data.nominal) });
  }

  // Eksekusi semua perubahan secara bersamaan (Atomic)
  await batch.commit();
}

// ========================================================
// 3. FETCH DATA (DOMPET & TRANSAKSI TERAKHIR)
// ========================================================
export async function getDaftarDompet(userId: string): Promise<Dompet[]> {
  const q = query(collection(db, `users/${userId}/dompet`));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Dompet, "id">),
  }));
}

export async function getTransaksiTerakhir(
  userId: string,
  limitCount: number = 10
): Promise<Transaksi[]> {
  const q = query(
    collection(db, `users/${userId}/transaksi`),
    orderBy("tanggal", "desc")
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.slice(0, limitCount).map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      tanggal: (data.tanggal as Timestamp).toDate(),
    } as Transaksi;
  });
}

// ========================================================
// 4. LOGIKA TARGET TABUNGAN (SAVINGS GOALS)
// ========================================================
export async function tambahTargetTabungan(
  userId: string,
  data: Omit<TargetTabungan, "id">
) {
  const ref = collection(db, `users/${userId}/target_tabungan`);
  await writeBatch(db).set(doc(ref), {
    ...data,
    terkumpul: data.terkumpul || 0,
    isSelesai: false,
    createdAt: Timestamp.now(),
  }).commit();
}