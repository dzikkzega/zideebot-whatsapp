# Development Guide - Auto-Reload Setup

## 🔄 Auto-Reload dengan Nodemon

### Setup Nodemon:
```bash
npm install -g nodemon
```

### Jalankan Bot dengan Auto-Reload:
```bash
npm run dev
```

### Apa yang Terjadi:
- ✅ Bot akan restart otomatis ketika ada perubahan file
- ✅ Tidak perlu manual restart setiap kali edit kode
- ✅ Session WhatsApp tetap tersimpan
- ✅ QR code tidak perlu di-scan ulang (kecuali session expired)

## 🚀 Development Workflow

### 1. Start Development Mode:
```bash
npm run dev
```

### 2. Edit Code:
- Edit file `index.js`
- Save file (Ctrl+S)
- Bot akan restart otomatis
- Lihat log di terminal

### 3. Test Changes:
- Kirim pesan ke bot
- Lihat perubahan langsung
- No need manual restart!

## ⚠️ Catatan Penting

### Session WhatsApp:
- Session tersimpan di folder `.wwebjs_auth/`
- Restart tidak menghapus session
- QR code hanya perlu di-scan sekali

### Files yang Di-Watch:
- `index.js` - Main bot file
- `weather-api.js` - Weather functions
- `examples.js` - Advanced examples
- Semua file `.js` di folder Bot

### Development vs Production:
- **Development**: `npm run dev` (auto-reload)
- **Production**: `npm start` (stable, no auto-reload)

## 🛠️ Advanced Development Setup

### 1. Watch Specific Files:
```bash
nodemon --watch index.js --watch weather-api.js index.js
```

### 2. Ignore Certain Files:
```bash
nodemon --ignore session.json --ignore *.log index.js
```

### 3. Custom Restart Delay:
```bash
nodemon --delay 2 index.js
```

## 🎯 Development Best Practices

### 1. Test Small Changes:
- Edit kode sedikit-sedikit
- Test setiap perubahan
- Jangan edit banyak sekaligus

### 2. Monitor Terminal:
- Lihat log error
- Perhatikan warning
- Check restart notifications

### 3. Backup Session:
- Backup folder `.wwebjs_auth/`
- Jika session corrupt, restore backup
- Hindari kehilangan session

## 📱 Testing Workflow

### 1. Start Dev Mode:
```bash
npm run dev
```

### 2. Test Command:
- Send: `tolong`
- Lihat response

### 3. Edit Feature:
- Edit function di `index.js`
- Save file
- Bot restart otomatis

### 4. Test Again:
- Send: `tolong`
- Lihat perubahan

## 🔧 Troubleshooting

### Bot Tidak Restart:
- Check nodemon installed
- Restart terminal
- Run `npm run dev` again

### Session Lost:
- Backup session regular
- Check `.wwebjs_auth/` folder
- Re-scan QR if needed

### Performance Issues:
- Too many restarts can slow down
- Use `--delay` option
- Optimize code changes

Happy Development! 🎉
