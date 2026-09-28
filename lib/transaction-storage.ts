import type { Transaksi } from "@/types";

export type DashboardTransaction = Omit<Transaksi, "tanggal"> & {
  tanggalObj: Date;
  tanggalStr: string;
};

const STORAGE_KEY = "alokasi-transactions";
const DEFAULT_TRANSACTIONS: DashboardTransaction[] = [
  {
    id: "t1",
    dompetId: "d3",
    kategoriId: "k1",
    nominal: 28000,
    tipe: "expense",
    catatan: "Nasi Uduk Siang",
    tanggalObj: new Date(),
    tanggalStr: "Hari Ini, 12:30",
  },
  {
    id: "t2",
    dompetId: "d2",
    kategoriId: "k4",
    nominal: 3500000,
    tipe: "income",
    catatan: "Gaji & Project Client",
    tanggalObj: new Date(),
    tanggalStr: "Kemarin",
  },
  {
    id: "t3",
    dompetId: "d1",
    kategoriId: "k2",
    nominal: 20000,
    tipe: "expense",
    catatan: "Bensin Motor",
    tanggalObj: new Date(),
    tanggalStr: "24 Sep 2026",
  },
];

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedTransactions: DashboardTransaction[] = DEFAULT_TRANSACTIONS;

function parseTransactions(raw: string): DashboardTransaction[] | null {
  try {
    const entries: unknown = JSON.parse(raw);
    if (!Array.isArray(entries)) return null;

    return entries.flatMap((entry): DashboardTransaction[] => {
      if (typeof entry !== "object" || entry === null) return [];

      const row = entry as Record<string, unknown>;
      const tipe = row.tipe;
      const dateValue = row.tanggalObj ?? row.tanggal;
      const tanggalObj = new Date(
        typeof dateValue === "string" || typeof dateValue === "number" ? dateValue : NaN
      );

      if (
        typeof row.id !== "string" ||
        typeof row.dompetId !== "string" ||
        typeof row.nominal !== "number" ||
        !Number.isFinite(row.nominal) ||
        (tipe !== "expense" && tipe !== "income" && tipe !== "transfer") ||
        Number.isNaN(tanggalObj.getTime())
      ) {
        return [];
      }

      return [{
        id: row.id,
        dompetId: row.dompetId,
        dompetTujuanId: typeof row.dompetTujuanId === "string" ? row.dompetTujuanId : undefined,
        kategoriId: typeof row.kategoriId === "string" ? row.kategoriId : undefined,
        nominal: row.nominal,
        tipe,
        catatan: typeof row.catatan === "string" ? row.catatan : undefined,
        tanggalObj,
        tanggalStr: typeof row.tanggalStr === "string" ? row.tanggalStr : "",
      }];
    });
  } catch {
    return null;
  }
}

export function getDashboardTransactionsSnapshot() {
  if (typeof window === "undefined") return DEFAULT_TRANSACTIONS;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedTransactions;

  cachedRaw = raw;
  cachedTransactions = raw ? parseTransactions(raw) ?? DEFAULT_TRANSACTIONS : DEFAULT_TRANSACTIONS;
  return cachedTransactions;
}

export function getDashboardTransactionsServerSnapshot() {
  return DEFAULT_TRANSACTIONS;
}

export function subscribeToDashboardTransactions(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", handleStorageChange);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorageChange);
  };
}

function handleStorageChange() {
  cachedRaw = undefined;
  listeners.forEach((listener) => listener());
}

export function saveDashboardTransactions(transactions: DashboardTransaction[]) {
  cachedTransactions = transactions;
  if (typeof window !== "undefined") {
    const raw = JSON.stringify(transactions);
    window.localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
  }
  listeners.forEach((listener) => listener());
}