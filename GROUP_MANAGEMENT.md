# Group Management Features - Zideebot

## 📋 Overview
Fitur baru untuk mengelola grup WhatsApp melalui bot dengan perintah sederhana.

## 🔓 Open Group Command
**Perintah:** `open` atau `op`

**Fungsi:** Membuka grup sehingga semua member bisa mengirim pesan

**Response:**
```
🔓 Grup telah dibuka oleh Admin @[user]

✅ Semua member sekarang bisa mengirim pesan
📝 Silakan berbagi dan berdiskusi dengan sopan

Dibuka pada: [timestamp]
```

## 🔒 Close Group Command
**Perintah:** `close` atau `cl`

**Fungsi:** Menutup grup sehingga hanya admin yang bisa mengirim pesan

**Response:**
```
🔒 Grup telah ditutup oleh Admin @[user]

⛔ Hanya admin yang bisa mengirim pesan
📢 Member tetap bisa melihat pesan dari admin

Ditutup pada: [timestamp]
```

## ⚠️ Requirements
1. **Bot harus menjadi admin** di grup WhatsApp
2. **Perintah hanya bekerja di grup** (tidak di chat pribadi)
3. User yang mengirim perintah akan **di-mention** dalam response
4. Bot akan memvalidasi apakah perintah dikirim di grup

## 🚀 Setup Instructions
1. Jalankan bot: `node index.js`
2. Scan QR code dengan WhatsApp
3. Tambahkan bot ke grup
4. **Berikan akses admin** kepada bot di grup
5. Test dengan mengirim perintah `open` atau `close`

## 💡 Features
- ✅ Validasi grup otomatis
- ✅ User mention dalam response
- ✅ Timestamp kapan grup dibuka/ditutup
- ✅ Error handling jika bot bukan admin
- ✅ Pesan informatif untuk member grup
- ✅ Terintegrasi dengan menu help bot

## 🔧 Technical Details
- Menggunakan WhatsApp Web API
- Method: `chat.setMessagesAdminsOnly()`
- Delay: 1-3 detik untuk response natural
- Error handling untuk akses yang tidak valid

## 📝 Example Usage
```
User: open
Bot: 🔓 Grup telah dibuka oleh Admin @628123456789
     ✅ Semua member sekarang bisa mengirim pesan
     📝 Silakan berbagi dan berdiskusi dengan sopan
     Dibuka pada: 11/7/2025, 13:45:30

User: close  
Bot: 🔒 Grup telah ditutup oleh Admin @628123456789
     ⛔ Hanya admin yang bisa mengirim pesan
     📢 Member tetap bisa melihat pesan dari admin
     Ditutup pada: 11/7/2025, 13:50:15
```

## 🛠️ Troubleshooting
- **"Gagal membuka/menutup grup"** → Bot belum menjadi admin
- **"Perintah hanya bisa digunakan di grup"** → Perintah dikirim di chat pribadi
- **Tidak ada response** → Pastikan bot running dan terkoneksi

---
*Developed for Zideebot v1.0*
