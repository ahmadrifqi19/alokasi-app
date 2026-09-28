export type TipeDompet = 'cash' | 'bank' | 'ewallet';
export type TipeTransaksi = 'expense' | 'income' | 'transfer';

export interface Dompet {
  id?: string;
  nama: string;
  tipe: TipeDompet;
  saldo: number;
  warna: string;
}

export interface Transaksi {
  id?: string;
  dompetId: string;
  dompetTujuanId?: string;
  kategoriId?: string;
  nominal: number;
  tipe: TipeTransaksi;
  catatan?: string;
  tanggal: Date;
}

export type DashboardTransaction = Omit<Transaksi, "id" | "tanggal"> & {
  id: string;
  tanggalObj: Date;
  tanggalStr: string;
};

export interface Kategori {
  id?: string;
  nama: string;
  tipe: TipeTransaksi;
  icon: string;
}

export interface TargetTabungan {
  id?: string;
  nama: string;
  targetNominal: number;
  terkumpul: number;
  icon?: string;
  warna?: string;
  targetTanggal?: string;
}

export interface AnggaranKategori {
  id?: string;
  kategoriId: string;
  namaKategori: string;
  limitBulanan: number;
  terpakai: number;
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  poin: number;
  badgeLevel: "Bronze" | "Silver" | "Gold" | "Master";
}