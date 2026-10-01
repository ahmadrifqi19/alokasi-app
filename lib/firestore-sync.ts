import { db } from "./firebase";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import type {
  AnggaranKategori,
  DashboardTransaction,
  Dompet,
  TipeDompet,
  TipeTransaksi,
  UserStreak,
} from "@/types";
import {
  CUSTOM_CATEGORY_PREFIX,
  DEFAULT_CATEGORY_OPTIONS,
} from "@/lib/category-options";
import { getBadgeLevel, getLocalDateKey } from "@/lib/gamification";
export type { DashboardTransaction } from "@/types";

export interface TargetTabungan {
  id: string;
  namaGoal: string;
  targetNominal: number;
  terkumpul: number;
  tenggatWaktu?: string;
}

export interface SetorTabunganParams {
  userId: string;
  goalId: string;
  goalNama: string;
  walletId: string;
  nominal: number;
}

const KATEGORI_NAMA = Object.fromEntries(
  DEFAULT_CATEGORY_OPTIONS.map(({ id, nama }) => [id, nama]),
);

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const convert = value.toDate;
    if (typeof convert === "function") return convert.call(value) as Date;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
}

function toTransaction(
  id: string,
  value: Record<string, unknown>,
): DashboardTransaction | null {
  const storedType = value.tipe;
  const tipe: TipeTransaksi | undefined =
    storedType === "expense" || storedType === "pengeluaran"
      ? "expense"
      : storedType === "income" || storedType === "pemasukan"
        ? "income"
        : storedType === "transfer"
          ? "transfer"
          : undefined;
  const nominalValue = value.nominal ?? value.amount;
  const nominal =
    typeof nominalValue === "number" ? nominalValue : Number(nominalValue);

  if (!tipe || !Number.isFinite(nominal)) return null;

  const tanggalObj = toDate(value.tanggalObj ?? value.tanggal ?? value.createdAt);
  const kategoriRaw = value.kategoriId ?? value.kategori ?? value.category;
  const kategoriId =
    typeof kategoriRaw === "string"
      ? kategoriRaw in KATEGORI_NAMA || kategoriRaw.startsWith(CUSTOM_CATEGORY_PREFIX)
        ? kategoriRaw
        : undefined
      : undefined;
  const legacyCategory =
    typeof value.kategori === "string"
      ? value.kategori
      : typeof value.category === "string"
        ? value.category
        : undefined;

  return {
    id,
    dompetId:
      typeof value.dompetId === "string"
        ? value.dompetId
        : typeof value.walletId === "string"
          ? value.walletId
          : "",
    dompetTujuanId:
      typeof value.dompetTujuanId === "string" ? value.dompetTujuanId : undefined,
    kategoriId,
    nominal,
    tipe,
    catatan:
      typeof value.catatan === "string"
        ? value.catatan
        : typeof value.note === "string"
          ? value.note
          : legacyCategory,
    tanggalObj,
    tanggalStr:
      typeof value.tanggalStr === "string"
        ? value.tanggalStr
        : tanggalObj.toLocaleDateString("id-ID"),
  };
}

function toDompetType(value: unknown): TipeDompet {
  return value === "cash" || value === "bank" || value === "ewallet"
    ? value
    : "bank";
}

// ==========================================
// 1. TRANSAKSI LISTENERS & ACTIONS
// ==========================================

export function subscribeFirebaseTransactions(
  userId: string,
  callback: (transactions: DashboardTransaction[]) => void
) {
  const ref = collection(db, "users", userId, "transactions");

  return onSnapshot(ref, (snapshot) => {
    const list = snapshot.docs
      .map((snapshotDoc) =>
        toTransaction(snapshotDoc.id, snapshotDoc.data() as Record<string, unknown>)
      )
      .filter((transaction): transaction is DashboardTransaction => transaction !== null)
      .sort((a, b) => b.tanggalObj.getTime() - a.tanggalObj.getTime());
    callback(list);
  });
}

export async function saveFirebaseTransaction(
  userId: string,
  transaction: DashboardTransaction
) {
  const ref = doc(db, "users", userId, "transactions", transaction.id);
  await setDoc(
    ref,
    {
      id: transaction.id,
      dompetId: transaction.dompetId,
      walletId: transaction.dompetId,
      dompetTujuanId: transaction.dompetTujuanId ?? null,
      kategoriId: transaction.kategoriId ?? null,
      nominal: transaction.nominal,
      tipe: transaction.tipe,
      catatan: transaction.catatan ?? "",
      tanggalObj: transaction.tanggalObj,
      tanggalStr: transaction.tanggalStr,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
  try {
    await recordFirebaseUserActivity(userId);
  } catch (error) {
    console.error("Gagal memperbarui badge pengguna:", error);
  }
}

export function subscribeFirebaseArchivedCategories(
  userId: string,
  callback: (categoryIds: string[]) => void,
) {
  const ref = collection(db, "users", userId, "categories");
  return onSnapshot(ref, (snapshot) => {
    const archivedIds = snapshot.docs
      .filter((categoryDoc) => categoryDoc.data().archived === true)
      .map((categoryDoc) => {
        const categoryId = categoryDoc.data().categoryId;
        return typeof categoryId === "string"
          ? categoryId
          : decodeURIComponent(categoryDoc.id);
      });
    callback(archivedIds);
  });
}

export async function saveFirebaseCategory(userId: string, categoryId: string) {
  const ref = doc(
    db,
    "users",
    userId,
    "categories",
    encodeURIComponent(categoryId),
  );
  await setDoc(ref, { categoryId, archived: false }, { merge: true });
}

export async function archiveFirebaseCategory(userId: string, categoryId: string) {
  const ref = doc(
    db,
    "users",
    userId,
    "categories",
    encodeURIComponent(categoryId),
  );
  await setDoc(ref, { categoryId, archived: true }, { merge: true });
}

export function subscribeFirebaseUserStreak(
  userId: string,
  callback: (streak: UserStreak) => void,
) {
  const streakRef = doc(db, "users", userId, "gamification", "streak");

  return onSnapshot(streakRef, (snapshot) => {
    const data = snapshot.data();
    const poin = typeof data?.poin === "number" ? data.poin : 0;
    callback({
      currentStreak:
        typeof data?.currentStreak === "number" ? data.currentStreak : 0,
      longestStreak:
        typeof data?.longestStreak === "number" ? data.longestStreak : 0,
      poin,
      badgeLevel: getBadgeLevel(poin),
    });
  });
}

export async function recordFirebaseUserActivity(
  userId: string,
  activityDate = new Date(),
) {
  const streakRef = doc(db, "users", userId, "gamification", "streak");
  const today = getLocalDateKey(activityDate);
  const yesterdayDate = new Date(activityDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = getLocalDateKey(yesterdayDate);

  await runTransaction(db, async (transaction) => {
    const streakSnapshot = await transaction.get(streakRef);
    const data = streakSnapshot.data();
    if (data?.lastActivityDate === today) return;

    const previousStreak =
      typeof data?.currentStreak === "number" ? data.currentStreak : 0;
    const previousLongestStreak =
      typeof data?.longestStreak === "number" ? data.longestStreak : 0;
    const currentStreak =
      data?.lastActivityDate === yesterday ? previousStreak + 1 : 1;
    const poin = (typeof data?.poin === "number" ? data.poin : 0) + 10 +
      (currentStreak % 7 === 0 ? 25 : 0);

    transaction.set(
      streakRef,
      {
        currentStreak,
        longestStreak: Math.max(previousLongestStreak, currentStreak),
        poin,
        badgeLevel: getBadgeLevel(poin),
        lastActivityDate: today,
      },
      { merge: true },
    );
  });
}

export async function deleteFirebaseTransaction(
  userId: string,
  transactionId: string
) {
  const ref = doc(db, "users", userId, "transactions", transactionId);
  await deleteDoc(ref);
}

// ==========================================
// 2. DOMPET / WALLETS LISTENERS & ACTIONS
// ==========================================

export function subscribeFirebaseWallets(
  userId: string,
  callback: (wallets: Dompet[]) => void
) {
  const ref = collection(db, "users", userId, "wallets");

  return onSnapshot(ref, (snapshot) => {
    const list: Dompet[] = snapshot.docs.map((snapshotDoc) => {
      const data = snapshotDoc.data();
      return {
        id: snapshotDoc.id,
        nama: typeof data.nama === "string" ? data.nama : "Dompet",
        saldo: typeof data.saldo === "number" ? data.saldo : 0,
        tipe: toDompetType(data.tipe),
        warna: typeof data.warna === "string" ? data.warna : "bg-blue-600",
      };
    });
    callback(list);
  });
}

export async function saveFirebaseWallet(userId: string, wallet: Dompet) {
  const collectionRef = collection(db, "users", userId, "wallets");
  const ref = wallet.id ? doc(collectionRef, wallet.id) : doc(collectionRef);
  await setDoc(
    ref,
    {
      id: ref.id,
      nama: wallet.nama,
      saldo: wallet.saldo,
      tipe: wallet.tipe,
      warna: wallet.warna ?? "bg-blue-600",
    },
    { merge: true },
  );
}

export async function saveFirebaseWallets(userId: string, wallets: Dompet[]) {
  await Promise.all(wallets.map((wallet) => saveFirebaseWallet(userId, wallet)));
}

export async function deleteFirebaseWallet(
  userId: string,
  walletId: string
) {
  const ref = doc(db, "users", userId, "wallets", walletId);
  await deleteDoc(ref);
}

// ==========================================
// 3. ANGGARAN / BUDGETS LISTENERS & ACTIONS
// ==========================================

export function subscribeFirebaseBudgets(
  userId: string,
  callback: (budgets: AnggaranKategori[]) => void
) {
  const ref = collection(db, "users", userId, "budgets");

  return onSnapshot(ref, (snapshot) => {
    if (!snapshot.empty) {
      const list: AnggaranKategori[] = snapshot.docs.map((snapshotDoc) => {
        const data = snapshotDoc.data();
        const limit = data.limitBulanan ?? data.batasMaksimal;
        return {
          id: typeof data.id === "string" ? data.id : snapshotDoc.id,
          kategoriId: snapshotDoc.id,
          namaKategori:
            typeof data.namaKategori === "string"
              ? data.namaKategori
              : KATEGORI_NAMA[snapshotDoc.id] ?? "Kategori Lain",
          limitBulanan: typeof limit === "number" ? limit : Number(limit) || 0,
          terpakai: typeof data.terpakai === "number" ? data.terpakai : 0,
        };
      });
      callback(list);
    }
  });
}

export async function saveFirebaseBudget(
  userId: string,
  budget: AnggaranKategori
) {
  const ref = doc(db, "users", userId, "budgets", budget.kategoriId);
  await setDoc(
    ref,
    {
      id: budget.id ?? budget.kategoriId,
      kategoriId: budget.kategoriId,
      namaKategori: budget.namaKategori,
      limitBulanan: budget.limitBulanan,
      terpakai: budget.terpakai ?? 0,
    },
    { merge: true },
  );
}

export async function deleteFirebaseBudget(userId: string, categoryId: string) {
  const ref = doc(db, "users", userId, "budgets", categoryId);
  await deleteDoc(ref);
}

// ==========================================
// 4. TARGET TABUNGAN / GOALS LISTENERS & ACTIONS
// ==========================================

export function subscribeFirebaseGoals(
  userId: string,
  callback: (goals: TargetTabungan[]) => void
) {
  const ref = collection(db, "users", userId, "goals");

  return onSnapshot(ref, (snapshot) => {
    const list: TargetTabungan[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<TargetTabungan, "id">),
    }));
    callback(list);
  });
}

export async function saveFirebaseGoal(userId: string, goal: TargetTabungan) {
  const ref = doc(db, "users", userId, "goals", goal.id);
  await setDoc(ref, goal, { merge: true });
}

// --- AKSI LOGIKA SETOR KE TARGET TABUNGAN & POTONG SALDO DOMPET ---
export async function setorKeTargetTabungan({
  userId,
  goalId,
  goalNama,
  walletId,
  nominal,
}: SetorTabunganParams) {
  if (nominal <= 0) throw new Error("Nominal setoran harus lebih dari 0.");

  const goalRef = doc(db, "users", userId, "goals", goalId);
  const walletRef = doc(db, "users", userId, "wallets", walletId);
  const newTxRef = doc(collection(db, "users", userId, "transactions"));

  await runTransaction(db, async (transaction) => {
    const goalSnap = await transaction.get(goalRef);
    const walletSnap = await transaction.get(walletRef);

    if (!goalSnap.exists()) throw new Error("Target tabungan tidak ditemukan.");
    if (!walletSnap.exists()) throw new Error("Dompet pilihan tidak ditemukan.");

    const currentGoal = goalSnap.data();
    const currentWallet = walletSnap.data();

    if ((currentWallet.saldo ?? 0) < nominal) {
      throw new Error("Saldo dompet tidak mencukupi untuk menabung.");
    }

    // 1. Tambahkan saldo terkumpul pada Target Tabungan
    const currentTerkumpul = currentGoal.terkumpul ?? 0;
    transaction.update(goalRef, { terkumpul: currentTerkumpul + nominal });

    // 2. Potong saldo pada Dompet yang dipilih
    const currentSaldo = currentWallet.saldo ?? 0;
    transaction.update(walletRef, { saldo: currentSaldo - nominal });

    // 3. Rekam transaksi pengeluaran alokasi tabungan
    const now = new Date();
    transaction.set(newTxRef, {
      id: newTxRef.id,
      dompetId: walletId,
      walletId: walletId,
      nominal: nominal,
      tipe: "expense",
      catatan: `Alokasi Tabungan: ${goalNama}`,
      tanggalObj: now,
      tanggalStr: now.toLocaleDateString("id-ID"),
      createdAt: serverTimestamp(),
    });
  });
  try {
    await recordFirebaseUserActivity(userId);
  } catch (error) {
    console.error("Gagal memperbarui badge pengguna:", error);
  }
}

// ==========================================
// 5. HELPER RESET ALL DATA TO ZERO
// ==========================================

export async function resetUserDataToZero(userId: string) {
  const collectionsToReset = [
    "transactions",
    "budgets",
    "categories",
    "gamification",
    "goals",
    "wallets",
  ];

  for (const colName of collectionsToReset) {
    const colRef = collection(db, "users", userId, colName);
    const snapshot = await getDocs(colRef);
    const deletePromises = snapshot.docs.map((d) =>
      deleteDoc(doc(db, "users", userId, colName, d.id))
    );
    await Promise.all(deletePromises);
  }
}