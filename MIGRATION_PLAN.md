# 🔄 MIGRACIÓN DE DATOS - ODERA 05

## 📋 DATOS VALIOSOS IDENTIFICADOS

### 1. ✅ Configuración de Contacto (config.js)

```javascript
contact: {
    whatsapp: '51916305297',
    yape: '962266349',
    plin: '962266349',
    email: 'contacto@odera05.com'
}
```

### 2. ✅ Redes Sociales

```javascript
social: {
    instagram: 'https://www.instagram.com/paso_urbano_pe/',
    tiktok: 'https://www.tiktok.com/@pas.urbano'
}
```

### 3. ✅ Precios de Envío

```javascript
shipping: {
    agencia: 15,      // S/15 (Shalom)
    domicilio: 20,    // S/20 (Lima Norte/Centro)
    freeThreshold: 200
}
```

---

## 📦 ARCHIVOS A MIGRAR

### Migrar a Firebase (settings/store):

```json
{
  "storeName": "ODERA 05 STORE",
  "whatsapp": "+51 916 305 297",
  "whatsappRaw": "51916305297",
  "email": "contacto@odera05.com",
  
  "social": {
    "instagram": "https://www.instagram.com/paso_urbano_pe/",
    "tiktok": "https://www.tiktok.com/@pas.urbano"
  },
  
  "delivery": {
    "enabled": true,
    "cost": 20,
    "freeThreshold": 200,
    "districts": [
      "Los Olivos",
      "San Martín de Porres", 
      "Independencia",
      "Comas"
    ]
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
```

---

## ❌ ARCHIVOS A NO MIGRAR (Obsoletos)

### HTML antiguos:
- ❌ index.html (vanilla JS)
- ❌ carrito.html (vanilla JS)
- ❌ checkout.html (vanilla JS)
- ❌ admin/*.html (se reemplaza por Next.js)

### CSS antiguos:
- ❌ css/*.css (se reemplaza por Tailwind)

### JS antiguos:
- ❌ js/cart.js (se reemplaza por CartContext React)
- ❌ js/products.js (se reemplaza por componentes Next.js)
- ❌ js/admin.js (se reemplaza por dashboard Next.js)

**Razón:** El nuevo proyecto usa:
- Next.js (no vanilla HTML)
- Tailwind CSS (no CSS manual)
- TypeScript (no JS)
- Cloud Functions (no JS client-side logic)

---

## 🎯 ACCIONES A REALIZAR

### ✅ PASO 1: Crear datos iniciales Firebase

Archivo: `odera-05-professional/firebase-init-data.json`

```json
{
  "settings/store": { ... },
  "counters/orders": { "seq": 0 },
  "counters/products": { "seq": 0 }
}
```

### ✅ PASO 2: Script de inicialización

`init-firebase-data.js` para cargar settings automáticamente

### ⚠️ PASO 3: Desactivar proyecto anterior

- Renombrar carpeta: `odera-05` → `odera-05-OLD-DEPRECATED`
- Agregar README.md explicando que está obsoleto
- Detener servidor si sigue corriendo

---

## 📊 RESUMEN

| Categoría | Acción |
|-----------|--------|
| Configuración contacto | ✅ Migrar a Firestore |
| Redes sociales | ✅ Migrar a Firestore |
| Precios envío | ✅ Migrar a Firestore |
| HTML/CSS/JS | ❌ No migrar (obsoleto) |
| Imágenes productos | ⚠️ Manual (si existen) |
| Datos Firebase | ⚠️ Exportar si hay productos |

---

## 🚀 SIGUIENTE PASO

¿Quieres que:
1. **Cree el script de inicialización** de datos Firebase
2. **Exporte productos** del Firebase anterior (si existen)
3. **Desactive/renombre** el proyecto anterior
