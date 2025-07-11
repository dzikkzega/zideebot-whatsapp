# WhatsApp Bot 🤖

Bot WhatsApp sederhana yang dibuat dengan Node.js dan whatsapp-web.js library.

## ✨ Fitur

- ✅ Auto-reply untuk pesan tertentu
- ✅ Command system (/help, /time, /ping, dll)
- ✅ Echo command untuk mengulangi teks
- ✅ Broadcast pesan ke multiple nomor
- ✅ Logging semua aktivitas
- ✅ Graceful shutdown

## 🚀 Instalasi & Setup

### 1. Install Node.js
Pastikan Node.js sudah terinstall di komputer Anda.

### 2. Install Dependencies
```bash
npm install
```

### 3. Jalankan Bot
```bash
npm start
```

### 4. Scan QR Code
- Buka WhatsApp di HP Anda
- Pilih menu "Linked Devices"
- Scan QR code yang muncul di terminal

## 📱 Commands Available

| Command | Deskripsi |
|---------|-----------|
| `/help` | Tampilkan menu bantuan |
| `/time` | Tampilkan waktu sekarang |
| `/info` | Informasi tentang bot |
| `/ping` | Test koneksi bot |
| `/echo [text]` | Bot akan mengulangi teks Anda |

## 🔧 Kustomisasi

### Menambah Command Baru
Edit file `index.js` di fungsi `handleMessage()`:

```javascript
else if (messageBody === '/newcommand') {
    await message.reply('Response untuk command baru');
}
```

### Auto-reply untuk Kata Kunci
```javascript
else if (messageBody.includes('keyword')) {
    await message.reply('Response untuk keyword');
}
```

### Broadcast Message
```javascript
const phoneNumbers = ['628123456789', '628987654321'];
const message = 'Pesan broadcast';
await broadcastMessage(phoneNumbers, message);
```

## 📂 Struktur File

```
Bot/
├── index.js          # File utama bot
├── package.json      # Dependencies dan scripts
├── README.md         # Dokumentasi
└── .wwebjs_auth/     # Folder otomatis untuk session (jangan dihapus)
```

## ⚠️ Catatan Penting

1. **Jangan bagikan session**: Folder `.wwebjs_auth/` berisi session WhatsApp Anda
2. **Rate limiting**: Jangan spam pesan terlalu cepat
3. **WhatsApp ToS**: Gunakan dengan bijak sesuai terms of service WhatsApp
4. **Phone number format**: Gunakan format internasional (628xxxxxxxxx)

## 🛠️ Development

### Jalankan dengan auto-reload:
```bash
npm run dev
```

### Struktur untuk development lebih lanjut:
- Tambah database untuk menyimpan user data
- Integrasi dengan API external
- Web dashboard untuk managing bot
- Multiple bot instances

## 📞 Troubleshooting

### Bot tidak merespon
- Pastikan QR code sudah di-scan
- Check koneksi internet
- Restart bot jika perlu

### Session expired
- Hapus folder `.wwebjs_auth/`
- Jalankan ulang bot dan scan QR code lagi

### Pesan tidak terkirim
- Check format nomor telepon
- Pastikan nomor aktif di WhatsApp
- Check rate limiting

## 📈 Pengembangan Selanjutnya

1. **Database Integration**: SQLite/MySQL untuk menyimpan data user
2. **AI Integration**: ChatGPT, Gemini, atau AI lainnya
3. **Web Interface**: Dashboard untuk monitoring bot
4. **Scheduler**: Kirim pesan terjadwal
5. **Group Management**: Manage grup WhatsApp
6. **Analytics**: Tracking statistik pesan
7. **Multi-instance**: Multiple bot dalam satu aplikasi
