# Campus Lost & Found (Migrated to XAMPP/MySQL & PHP)

Platform pencarian barang hilang dan temuan untuk lingkungan kampus, yang telah dimigrasikan dari **Supabase** ke server lokal berbasis **XAMPP / Laragon** menggunakan database **MySQL** dan API **PHP**.

---

## Fitur Utama

- **Autentikasi Lokal**: Pendaftaran akun, login sesi, dan logout terkelola lokal secara aman.
- **Laporan Kehilangan & Temuan**: Pengguna dapat melaporkan barang dengan deskripsi, kategori, lokasi, info kontak, serta unggahan foto.
- **Unggah Foto Lokal**: Gambar disimpan langsung di direktori server lokal (`api/uploads/`).
- **Sidebar Statistik Dinamis**: Menampilkan ringkasan jumlah barang hilang, ditemukan, dan laporan tertunda secara langsung.
- **Dashboard Admin**:
  - Moderasi laporan (menyetujui atau menolak laporan masuk).
  - Manajemen akun (mengubah peran pengguna antara *user* dan *admin*, serta menghapus akun).
- **Auto-Database Setup**: Database dan tabel-tabel MySQL akan otomatis diinisialisasi pada saat pertama kali server diakses.

---

## Panduan Instalasi & Jalankan Lokal (XAMPP / Laragon)

### 1. Persiapan Server Lokal
1. Pastikan Anda memiliki **XAMPP** atau **Laragon** terinstal di komputer Anda.
2. Aktifkan modul **Apache** dan **MySQL** pada control panel XAMPP/Laragon.

### 2. Konfigurasi Proyek di Web Server
Karena Apache melayani berkas dari folder root web server (`htdocs` pada XAMPP, atau `www` pada Laragon), salin atau hubungkan folder proyek ini agar bisa dibaca oleh Apache.

**Menggunakan Directory Junction (Direkomendasikan):**
Buka PowerShell atau Command Prompt sebagai Administrator, lalu jalankan perintah berikut:
```bash
# Untuk pengguna XAMPP (menghubungkan folder laragon/www ke xampp/htdocs)
cmd /c mklink /j C:\xampp\htdocs\campus-lost-found c:\laragon\www\campus-lost-found
```
Sekarang, API PHP lokal Anda dapat diakses melalui alamat:
`http://localhost/campus-lost-found/api/`

### 3. Konfigurasi Environment Variables
Buat berkas `.env` di direktori utama proyek (jika belum ada) dan isi dengan konfigurasi berikut:
```env
VITE_API_URL=http://localhost/campus-lost-found/api
VITE_SUPABASE_URL=http://localhost/campus-lost-found/api
VITE_SUPABASE_ANON_KEY=local-key-mock
```

### 4. Konfigurasi Database
Database MySQL akan otomatis dibuat dengan konfigurasi default XAMPP/Laragon:
- **Host**: `localhost`
- **Username**: `root`
- **Password**: `""` (kosong)
- **Nama Database**: `campus_lost_found`

*Catatan: Jika Anda ingin membuat basis data secara manual, impor berkas [database.sql](database.sql) melalui phpMyAdmin.*

---

## Akun Login Default

Aplikasi telah dilengkapi dengan data akun awal (*seeding*) yang langsung siap digunakan:

### Akun Admin
- **Email**: `admin@campus.com`
- **Password**: `admin123`
- **Role**: `admin` (Dapat mengakses halaman `/admin` untuk moderasi laporan dan pengaturan pengguna)

### Akun Pengguna Biasa (Untuk Pengujian)
Anda dapat langsung melakukan pendaftaran akun baru melalui halaman **Daftar** pada aplikasi.

---

## Menjalankan Aplikasi Frontend (Vite)

1. Buka terminal di direktori proyek ini (`c:\laragon\www\campus-lost-found`).
2. Pasang dependensi jika belum dilakukan:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan Vite:
   ```bash
   npm run dev
   ```
4. Buka alamat `http://localhost:5173/` di browser Anda.

---

## Panduan Deploy ke Vercel (Produksi)

Ketika mendeploy aplikasi frontend (React/Vite) ke **Vercel**, harap perhatikan hal berikut:

1. **Vercel Hanya Meng-host Frontend**:
   Vercel adalah platform hosting frontend statis/serverless. Vercel tidak menyediakan database MySQL berjalan atau runtime PHP stateful secara bawaan untuk backend Anda.
   
2. **Deploy Backend (PHP + MySQL)**:
   - Anda harus meng-host folder `api/` dan database MySQL Anda di server publik yang mendukung PHP & MySQL (seperti cPanel shared hosting, VPS, Railway, atau Render).
   - Setelah di-host di server publik, Anda akan mendapatkan URL API publik, contohnya: `https://api.domainanda.com/` atau `https://domainanda.com/campus-lost-found/api/`.

3. **Konfigurasi Environment di Vercel Dashboard**:
   Pada dashboard proyek Vercel Anda, tambahkan variabel lingkungan berikut agar frontend dapat terhubung ke backend publik Anda:
   - `VITE_API_URL` = `[URL_API_PUBLIK_ANDA]`
   - `VITE_SUPABASE_URL` = `[URL_API_PUBLIK_ANDA]`
   - `VITE_SUPABASE_ANON_KEY` = `local-key-mock`
