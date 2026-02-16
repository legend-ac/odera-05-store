// Script para inicializar datos en Firebase
// Ejecutar: node init-firebase-data.js

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configurar Firebase Admin SDK
// IMPORTANTE: Descarga tu service account key de Firebase Console
// y guárdalo como 'serviceAccountKey.json' en la raíz del proyecto

try {
    const serviceAccount = require('./serviceAccountKey.json');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin SDK inicializado');
} catch (error) {
    console.error('❌ Error: No se encontró serviceAccountKey.json');
    console.log('\n📝 INSTRUCCIONES:');
    console.log('1. Ve a Firebase Console > Project Settings > Service Accounts');
    console.log('2. Genera una nueva clave privada');
    console.log('3. Guarda el archivo como serviceAccountKey.json en la raíz');
    process.exit(1);
}

const db = admin.firestore();

async function initializeData() {
    try {
        console.log('🚀 Iniciando carga de datos...\n');

        // Leer archivo de datos
        const dataPath = path.join(__dirname, 'firebase-init-data.json');
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        // 1. Crear settings/store
        console.log('📝 Creando settings/store...');
        await db.doc('settings/store').set(data.settings.store);
        console.log('✅ Settings creado\n');

        // 2. Crear counters
        console.log('📝 Creando counters...');
        await db.doc('counters/orders').set(data.counters.orders);
        await db.doc('counters/products').set(data.counters.products);
        console.log('✅ Counters creados\n');

        // 3. Crear usuario admin (opcional - ejecutar después de crear user manualmente)
        const adminEmail = 'tu-email@gmail.com'; // CAMBIAR ESTO
        console.log(`\n⚠️  IMPORTANTE: Debes crear un usuario admin manualmente:`);
        console.log(`1. Ir a Firebase Console > Authentication`);
        console.log(`2. Crear usuario con email: ${adminEmail}`);
        console.log(`3. Activar MFA (2FA) para ese usuario`);
        console.log(`4. Ejecutar el script set-admin.js para dar claim admin:true\n`);

        console.log('🎉 ¡Inicialización completada!\n');
        console.log('📊 Datos creados:');
        console.log('  - settings/store (configuración tienda)');
        console.log('  - counters/orders (contador OD-XXXX)');
        console.log('  - counters/products (contador PRD-XXXX)\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Ejecutar
initializeData();
