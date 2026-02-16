# ODERA 05 Professional - Testing Guide

## 🧪 TESTING CLOUD FUNCTIONS

### Requisitos Previos

1. **Node.js 18+** instalado
2. **Firebase CLI** instalado globalmente:
   ```bash
   npm install -g firebase-tools
   ```

### Paso 1: Instalar Dependencias

```bash
cd c:\Users\youte\.gemini\antigravity\scratch\odera-05-professional\functions
npm install
```

### Paso 2: Build Functions

```bash
npm run build
```

### Paso 3: Crear Datos de Test en Firestore

Antes de iniciar emulators, necesitas datos de prueba. Crea este archivo:

**test-data.json**
```json
{
  "settings": {
    "store": {
      "storeName": "ODERA 05 STORE",
      "whatsapp": "+51 916 305 297",
      "delivery": {
        "enabled": true,
        "cost": 15,
        "districts": ["Los Olivos", "San Martín de Porres", "Independencia"]
      },
      "yape": {
        "enabled": true,
        "number": "962266349",
        "holder": "Andy Cordova"
      },
      "plin": {
        "enabled": true,
        "number": "962266349",
        "holder": "Andy Cordova"
      }
    }
  },
  "counters": {
    "orders": { "seq": 0 },
    "products": { "seq": 0 }
  },
  "products": {
    "test-product-1": {
      "publicCode": "PRD-1",
      "name": "Zapatilla Nike Air Max 90",
      "description": "Zapatilla clásica deportiva",
      "category": "zapatillas",
      "brand": "Nike",
      "price": 299.90,
      "onSale": false,
      "status": "active",
      "coverImageUrl": "https://via.placeholder.com/400",
      "images": [],
      "variants": [
        {
          "id": "variant-1",
          "size": "40",
          "stock": 10
        },
        {
          "id": "variant-2",
          "size": "41",
          "stock": 5
        }
      ],
      "totalStock": 15,
      "searchTokens": ["nike", "air", "max", "zapatilla"],
      "isNew": true,
      "isFeatured": false
    }
  }
}
```

### Paso 4: Iniciar Firebase Emulators

```bash
# Desde la raíz del proyecto
cd c:\Users\youte\.gemini\antigravity\scratch\odera-05-professional

firebase emulators:start
```

**Puertos:**
- Firestore UI: http://localhost:4000
- Firestore: localhost:8080
- Functions: localhost:5001
- Auth: localhost:9099
- Storage: localhost:9199

### Paso 5: Abrir Test UI

Abre en tu navegador:
```
http://localhost:4000
```

O abre directamente el test HTML:
```
c:\Users\youte\.gemini\antigravity\scratch\odera-05-professional\test-functions.html
```

---

## 🧪 TESTS A EJECUTAR

### Test 1: createOrder()

**Objetivo:** Crear orden, validar stock, reservar, generar código

**Pasos:**
1. Llenar formulario en test-functions.html
2. Click "Crear Orden de Test"
3. Verificar:
   - ✅ Se generó código OD-XXXX
   - ✅ Stock se decrementó
   - ✅ Order creada en Firestore
   - ✅ reservedUntil = +20 minutos

**Resultado Esperado:**
```json
{
  "success": true,
  "order": {
    "orderId": "abc123",
    "publicCode": "OD-1",
    "total": 614.80
  }
}
```

---

### Test 2: submitPayment() - Anti-fraude

**Objetivo:** Validar código operación único

**Pasos:**
1. Copiar Order ID del test anterior
2. Ingresar código: "TEST-001"
3. Click "Enviar Código Pago"
4. ✅ Primera vez: SUCCESS
5. Click nuevamente (mismo código)
6. ✅ Segunda vez: ERROR (código duplicado)

**Resultado Esperado:**
```
❌ Este código de operación ya fue usado en el pedido OD-1
```

---

### Test 3: cancelExpiredOrders() - TTL

**Objetivo:** Cancelar órdenes expiradas automáticamente

**Pasos:**
1. Crear orden
2. Esperar 20 minutos (o modificar manualmente reservedUntil en Firestore)
3. Ejecutar scheduler manualmente:
   ```bash
   # En otra terminal
   curl -X POST http://localhost:5001/demo-project/us-central1/cancelExpiredOrders
   ```
4. Verificar:
   - ✅ Estado cambió a CANCELLED_EXPIRED
   - ✅ Stock se liberó

---

### Test 4: generateSearchTokens()

**Objetivo:** Normalizar búsqueda automáticamente

**Pasos:**
1. Crear producto con tildes: "Mochila Adídas Óríginal"
2. Verificar en Firestore:
   - ✅ searchTokens = ["mochila", "adidas", "original"]
3. Buscar sin tildes: "adidas"
4. ✅ Debe encontrar el producto

---

### Test 5: optimizeImage()

**Objetivo:** Generar thumbnails WebP

**Pasos:**
1. Subir imagen a Storage: `products/test.jpg`
2. Esperar ~5 segundos
3. Verificar en Storage:
   - ✅ `products/test_thumb.webp` (400px)
   - ✅ `products/test_medium.webp` (1000px)

---

## 📊 VERIFICACIÓN DE LOGS

En la terminal de emulators verás:

```
✅ Order OD-1 created for total: S/614.80
✅ Payment code TEST-001 submitted for order OD-1
✅ Search tokens updated for product test-product-1
🕐 Running TTL cleanup at 2026-02-15T22:50:00
✅ Cancelled order OD-1
🖼️ Optimizing image: products/test.jpg
✅ Thumb created: test_thumb.webp (45.23KB)
```

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module 'firebase-admin'"
```bash
cd functions
npm install
```

### Error: "Port 8080 already in use"
```bash
# Cambiar puertos en firebase.json
{
  "emulators": {
    "firestore": { "port": 8081 }
  }
}
```

### Functions no compilan
```bash
cd functions
npm run build
# Ver errores de TypeScript
```

### "Permission denied" en Firestore
- Verificar firestore.rules
- En emulators las reglas SÍ se aplican

---

## ✅ CHECKLIST DE TESTING

- [ ] Dependencias instaladas
- [ ] Functions compiladas (`npm run build`)
- [ ] Emulators iniciados
- [ ] Test createOrder() ✅
- [ ] Test submitPayment() ✅
- [ ] Test anti-fraude (código duplicado) ✅
- [ ] Test TTL (cancelExpiredOrders) ✅
- [ ] Test search tokens ✅
- [ ] Test optimizeImage() ✅
- [ ] Logs revisados
- [ ] Firestore UI explorada (http://localhost:4000)

---

## 🚀 NEXT STEPS

Una vez confirmado que las functions funcionan:

1. **Deploy a Firebase:**
   ```bash
   firebase deploy --only functions
   ```

2. **Configurar scheduler:**
   - En Firebase Console > Cloud Scheduler
   - Verificar que `cancelExpiredOrders` corra cada 10 min

3. **Configurar Resend:**
   ```bash
   firebase functions:config:set resend.api_key="re_..."
   ```

4. **Continuar con FASE 3:** Frontend Next.js
