# WhatsApp Bot Web Dashboard

Dashboard web modern untuk mengontrol dan memonitor bot WhatsApp dengan real-time interface.

## 🌟 Fitur Dashboard

### 📊 **Real-time Monitoring**
- Status bot secara real-time
- Statistik pesan dan chat aktif
- Monitor penggunaan memory dan uptime
- Log aktivitas dan error tracking

### 💬 **Message Management**
- Kirim pesan langsung dari web interface
- Broadcast ke multiple nomor sekaligus
- History pesan dengan search dan filter
- Character counter dan validasi

### 🔧 **Bot Control**
- Start/stop bot dari dashboard
- QR code display untuk autentikasi WhatsApp
- Test Gemini AI connection
- Export logs dan data

### ⚙️ **Configuration**
- Manage API keys (Gemini AI)
- Bot settings dan preferences
- Real-time configuration updates

## 🚀 Cara Menjalankan

### 1. Install Dependencies
```bash
npm install express socket.io
```

### 2. Jalankan Full System (Recommended)
```bash
npm run full
```
Ini akan menjalankan:
- WhatsApp Bot Engine
- Web Dashboard Server
- Real-time Socket Connection

### 3. Atau Jalankan Terpisah

**Bot saja:**
```bash
npm start
```

**Dashboard saja:**
```bash
npm run web
```

## 🌐 Akses Dashboard

Setelah menjalankan, buka browser dan akses:
```
http://localhost:3000
```

## 📱 Setup WhatsApp Connection

1. Buka dashboard di browser
2. Klik menu **"QR Code"**
3. Scan QR code dengan WhatsApp di HP
4. Bot akan terhubung dan status akan berubah menjadi "Online"

## 🎯 Fitur-Fitur Dashboard

### **Overview Page**
- Status cards (Bot Status, Messages, Active Chats, Uptime)
- System information (Node.js, Memory, Gemini AI status)
- Quick actions (Test API, Restart Bot, Export Logs)
- Recent activity table

### **Messages Page**
- Real-time message history
- Filter by type (sent/received/broadcast)
- Search functionality
- Message timestamps dan status

### **Send Message**
- Input nomor telepon (format: 628123456789)
- Compose message dengan character counter
- Instant delivery notification
- Success/error feedback

### **Broadcast**
- Multiple nomor telepon (satu per baris)
- Mass message dengan delay otomatis
- Progress tracking
- Safety warnings untuk spam prevention

### **QR Code**
- Real-time QR code generation
- Step-by-step instructions
- Auto-refresh when needed
- Connection status indicator

### **Settings**
- Gemini AI API key management
- Bot prefix configuration
- Auto-reply settings
- Save/load configuration

## 🔌 Real-time Features

Dashboard menggunakan Socket.IO untuk:
- ✅ Live status updates
- 💬 Real-time message notifications
- 📊 Dynamic statistics
- 🔄 Instant configuration changes
- 📱 QR code auto-display

## 🎨 UI/UX Features

### **Responsive Design**
- Mobile-friendly interface
- Collapsible sidebar
- Touch-optimized controls
- Cross-browser compatibility

### **Modern Interface**
- Bootstrap 5 styling
- Font Awesome icons
- Custom CSS animations
- Dark mode support

### **User Experience**
- Toast notifications
- Loading indicators
- Form validation
- Error handling
- Auto-refresh functionality

## 📊 Monitoring & Analytics

### **Real-time Metrics**
- Message count per day
- Active conversations
- Response time statistics
- Error rate tracking

### **System Health**
- Memory usage monitoring
- CPU performance
- Connection stability
- API status checks

## 🔒 Security Features

- Input validation dan sanitization
- XSS protection
- Rate limiting untuk API calls
- Secure API key handling

## 🛠️ Development

### **File Structure**
```
Bot/
├── web-server.js          # Express server + Socket.IO
├── launcher.js            # Multi-process launcher
├── web/
│   └── public/
│       ├── index.html     # Main dashboard
│       ├── css/
│       │   └── dashboard.css
│       └── js/
│           └── dashboard.js
├── index.js               # Bot engine
├── gemini-ai.js          # AI integration
└── package.json
```

### **API Endpoints**
- `GET /api/status` - Bot status
- `GET /api/messages` - Message history
- `POST /api/send-message` - Send single message
- `POST /api/broadcast` - Send broadcast
- `POST /api/test-gemini` - Test AI connection

### **Socket Events**
- `status-update` - Bot status changes
- `new-message` - Incoming messages
- `qr-code` - QR code updates
- `message-sent` - Outgoing message confirmation

## 🔧 Configuration

### **Environment Variables (.env)**
```env
WEB_PORT=3000
GEMINI_API_KEY=your_api_key_here
NODE_ENV=development
DEBUG=true
```

### **Web Server Settings**
- Default port: 3000
- Real-time updates via Socket.IO
- Static file serving for CSS/JS
- API rate limiting

## 📱 Mobile Support

Dashboard fully responsive dengan:
- Touch-friendly buttons
- Swipe navigation
- Mobile-optimized forms
- Responsive tables
- Collapsible menus

## 🎉 Quick Start Guide

1. **Install & Run:**
   ```bash
   npm install
   npm run full
   ```

2. **Open Dashboard:**
   `http://localhost:3000`

3. **Connect WhatsApp:**
   - Go to QR Code section
   - Scan with WhatsApp
   - Bot status → Online

4. **Start Using:**
   - Send messages
   - Monitor activity
   - Configure settings

## 💡 Tips & Best Practices

- Always scan QR code dalam 60 detik
- Use broadcast dengan delay untuk avoid spam detection
- Monitor memory usage for long-running sessions
- Export logs regularly untuk backup
- Test Gemini AI connection setelah setup

Dashboard ini memberikan kontrol penuh atas bot WhatsApp dengan interface yang modern dan user-friendly! 🚀
