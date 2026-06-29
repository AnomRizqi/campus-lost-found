# Campus Lost & Found (Firebase & Local Uploads)

Platform pencarian barang hilang dan temuan untuk lingkungan kampus, yang telah dimigrasikan ke **Firebase Cloud Services** (Firestore & Firebase Auth) dengan dukungan masuk lewat akun Google (**Google Sign-in**), serta dikombinasikan dengan server lokal **Laragon / XAMPP** (API PHP) khusus untuk unggahan foto lokal gratis tanpa batasan cloud storage.

---

## Fitur Utama

- **Autentikasi Firebase**:
  - Pendaftaran & Masuk akun via **Email & Sandi**.
  - Masuk cepat menggunakan akun Google (**Google Sign-In**).
- **Laporan Kehilangan & Temuan**: Pengguna dapat melaporkan barang dengan deskripsi, kategori, lokasi, info kontak, serta unggahan foto.
- **Unggah Foto Lokal Mandiri**: Gambar disimpan langsung di direktori server lokal (`api/uploads/`) melalui API PHP lokal (`api/upload.php`), memotong batasan penyimpanan cloud Firebase secara gratis.
- **Real-Time Data Feed**: Halaman beranda memperbarui postingan barang hilang secara langsung dan real-time menggunakan `onSnapshot` Firestore.
- **Sidebar Statistik Dinamis**: Menampilkan statistik jumlah barang hilang, temuan, dan laporan tertunda secara langsung (`getCountFromServer` hemat kuota).
- **Dashboard Admin**:
  - Moderasi laporan (menyetujui atau menolak laporan masuk).
  - Manajemen akun (mengubah peran pengguna antara *user* dan *admin*, serta menghapus akun).
  - Keamanan ekstra: Hanya akun dengan metode login email & sandi yang bisa menjadi Admin (tidak bisa lewat Google Sign-In) untuk mencegah akses tidak sah.

---

## Akun Demo Admin Default

Aplikasi telah terkonfigurasi untuk login pengujian:

- **Email**: `admin1@gmail.com`
- **Password**: `admin123`
- **Role**: `admin` (Dapat mengakses halaman `/admin` untuk moderasi laporan dan pengaturan pengguna)

*Catatan: Anda dapat membuat user biasa baru secara langsung menggunakan form pendaftaran email atau tombol Google Sign-In pada aplikasi.*

---

## Panduan Instalasi & Jalankan Lokal

### 1. Persiapan Server Lokal (Khusus Upload Foto)
1. Pastikan Anda memiliki **Laragon** atau **XAMPP** terinstal di komputer Anda.
2. Aktifkan modul **Apache** pada control panel Laragon/XAMPP. (Koneksi database MySQL tidak diperlukan lagi karena data disimpan di Firebase cloud).
3. Pastikan folder proyek berada atau terhubung di web root server Anda agar API PHP upload dapat diakses di:
   `http://localhost/campus-lost-found/api/upload.php`

### 2. Persiapan Project Firebase
1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat project baru.
2. Aktifkan **Authentication** > aktifkan metode masuk **Email/Password** dan **Google**.
3. Aktifkan **Cloud Firestore** > mulai dalam *Test Mode* (atau terapkan aturan di [firestore.rules](firestore.rules)).
4. Daftarkan aplikasi Web di dalam project Firebase tersebut untuk mendapatkan konfigurasi SDK.

### 3. Konfigurasi Environment Variables
Buat berkas `.env` di direktori utama proyek dan isi dengan konfigurasi Firebase Anda:
```env
VITE_API_URL=http://localhost/campus-lost-found/api

VITE_FIREBASE_API_KEY=AIzaSyAV_NChEqR4aJHWwWQe6d03spFECau6tA4
VITE_FIREBASE_AUTH_DOMAIN=lostandfound-bf4c0.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=lostandfound-bf4c0
VITE_FIREBASE_STORAGE_BUCKET=lostandfound-bf4c0.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=991416216059
VITE_FIREBASE_APP_ID=1:991416216059:web:43b0ed222df335e9c8c35e
```

### 4. Menjalankan Aplikasi Frontend (Vite)
1. Buka terminal di direktori proyek ini.
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

Ketika mendeploy aplikasi ini ke **Vercel**:
1. Karena database (Firestore) dan Autentikasi (Firebase Auth) berjalan di cloud, fungsionalitas utama web akan berfungsi otomatis setelah dideploy.
2. Tambahkan seluruh isi berkas `.env` ke bagian **Environment Variables** di dashboard proyek Vercel Anda.
3. **Catatan Penting Mengenai Gambar**:
   Karena Vercel adalah serverless statis, berkas gambar yang diunggah ke `api/uploads/` akan terhapus secara otomatis oleh Vercel. Untuk lingkungan produksi mandiri penuh di Vercel, disarankan untuk mengaktifkan **Firebase Cloud Storage** publik dan mengubah kode unggahan di `CreateReportBox.tsx` untuk menggunakan Firebase SDK kembali.
