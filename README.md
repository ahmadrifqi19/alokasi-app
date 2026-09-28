# Alokasi
Alokasi adalah aplikasi pencatatan keuangan pribadi berbasis Next.js, Firebase, dan Gemini. Aplikasi mendukung autentikasi, transaksi, anggaran, laporan, dan ekstraksi data struk.
## Menjalankan Lokal

1. Pasang dependency dengan `npm install`.
2. Salin `.env.example` ke `.env.local`, lalu isi konfigurasi Firebase dan `GEMINI_API_KEY`.
3. Jalankan `npm run dev` dan buka `http://localhost:3000`.

`GEMINI_API_KEY` hanya digunakan oleh API route server. Jangan beri awalan `NEXT_PUBLIC_` pada key Gemini.

## Pemeriksaan Produksi

Jalankan `npx tsc --noEmit`, `npm run lint`, lalu `npm run build`. Untuk menjalankan build lokal, gunakan `npm run start`.

## Deploy

Deploy sebagai aplikasi Next.js Node.js, misalnya di Vercel. Tambahkan seluruh variabel pada `.env.example` di pengaturan environment deployment untuk environment yang sesuai, lalu deploy ulang setelah mengubah variabel.

Tambahkan domain produksi ke Firebase Authentication > Authorized domains dan pastikan metode login yang digunakan sudah diaktifkan. Atur Firestore Security Rules agar setiap pengguna hanya dapat membaca dan menulis data miliknya sendiri. Firebase client config memiliki prefix `NEXT_PUBLIC_` karena digunakan browser; keamanan data harus ditegakkan oleh Firebase Rules, bukan dengan menyembunyikan client config.
