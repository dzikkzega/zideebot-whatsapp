# 🚀 Testing Guide untuk Bot WhatsApp

## 🧮 Calculator Bot Testing

### Basic Operations:
```
hitung 5 + 3
hitung 10 - 4
hitung 7 * 8
hitung 20 / 4
```

### Advanced Operations:
```
hitung 2^3
hitung sqrt(16)
hitung sin(90)
hitung cos(0)
hitung tan(45)
hitung log(100)
hitung ln(2.718)
```

### Complex Expressions:
```
hitung 5 + 3 * 2
hitung (10 + 5) / 3
hitung 2^3 + sqrt(16)
hitung sin(30) + cos(60)
```

## 🌤️ Weather Bot Testing

### Indonesian Cities:
```
cuaca Jakarta
cuaca Bandung
cuaca Surabaya
cuaca Yogyakarta
cuaca Bali
cuaca Medan
```

### International Cities (need API key):
```
weather New York
weather London
weather Tokyo
weather Singapore
```

### Error Cases:
```
cuaca KotaTidakAda
weather InvalidCity
```

## ❓ FAQ Bot Testing

### Service Info:
```
jam buka
alamat
kontak
```

### Business Info:
```
harga
promo
cara order
pembayaran
```

### Menu Commands:
```
faq
kalkulator
cuaca
tolong
```

## 🎯 Complete Testing Checklist

### ✅ Basic Commands:
- [ ] tolong
- [ ] bantuan
- [ ] menu
- [ ] waktu
- [ ] info
- [ ] ping
- [ ] echo Hello World

### ✅ Calculator Commands:
- [ ] kalkulator
- [ ] hitung 5 + 3
- [ ] calc 10 * 2
- [ ] hitung sqrt(25)
- [ ] calc 2^4

### ✅ Weather Commands:
- [ ] cuaca
- [ ] cuaca Jakarta
- [ ] weather Bandung
- [ ] cuaca KotaTidakAda

### ✅ FAQ Commands:
- [ ] faq
- [ ] jam buka
- [ ] alamat
- [ ] harga
- [ ] kontak
- [ ] promo
- [ ] cara order
- [ ] pembayaran

### ✅ Auto-Reply:
- [ ] halo
- [ ] hai
- [ ] hello
- [ ] terima kasih
- [ ] thanks

## 🐛 Common Issues & Solutions

### Calculator Issues:
- **Problem:** "Error: Rumus tidak valid"
- **Solution:** Check math syntax, use proper operators

### Weather Issues:
- **Problem:** "Data cuaca tidak tersedia"
- **Solution:** Use supported cities or setup API key

### FAQ Issues:
- **Problem:** No response for keywords
- **Solution:** Check exact keyword spelling

## 📊 Performance Testing

### Load Testing Commands:
```
# Send multiple commands quickly
hitung 1 + 1
cuaca Jakarta
faq
ping
waktu
```

### Response Time Testing:
- Simple commands: < 2 seconds
- Calculator: < 3 seconds  
- Weather: < 4 seconds
- FAQ: < 2 seconds

## 🔧 Advanced Testing

### Edge Cases:
```
# Calculator edge cases
hitung 1/0
hitung sqrt(-1)
hitung very long expression here

# Weather edge cases
cuaca 
weather
cuaca !@#$%

# FAQ edge cases
JAM BUKA (caps)
alamat kantor (partial match)
```

### Stress Testing:
```
# Send 10 commands rapidly
# Check if bot handles all requests
# Monitor response times
# Check for any errors
```

## 📈 Success Metrics

### Response Accuracy:
- ✅ Calculator: 100% for valid expressions
- ✅ Weather: Data shows for supported cities
- ✅ FAQ: Relevant answers for keywords

### Response Speed:
- ✅ Average response time < 3 seconds
- ✅ No timeout errors
- ✅ Consistent performance

### User Experience:
- ✅ Clear error messages
- ✅ Helpful suggestions
- ✅ Intuitive commands
- ✅ Friendly responses

## 🚀 Next Steps After Testing

1. **Fix any bugs** found during testing
2. **Add more cities** to weather database
3. **Extend calculator** with more functions
4. **Add more FAQ** topics
5. **Implement real weather API**
6. **Add user analytics**
7. **Create web dashboard**

Happy Testing! 🎉
