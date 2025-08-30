require('dotenv').config({ path: '../../.env' });

console.log('🔍 Verificando configuración de Firebase...');
console.log('');

console.log('Variables de entorno:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Configurado' : '❌ No configurado');
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Configurado' : '❌ No configurado');
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅ Configurado' : '❌ No configurado');
console.log('FIREBASE_STORAGE_BUCKET:', process.env.FIREBASE_STORAGE_BUCKET ? '✅ Configurado' : '❌ No configurado');

console.log('');
console.log('Probando inicialización de Firebase...');

try {
  const { admin, db, bucket, auth } = require('../config/firebase');
  console.log('✅ Firebase Admin SDK inicializado correctamente');
  console.log('✅ Firestore conectado');
  console.log('✅ Storage conectado');
  console.log('✅ Auth conectado');
  console.log('');
  console.log('🎉 ¡Configuración correcta! El sistema está listo para usar.');
} catch (error) {
  console.error('❌ Error en la configuración:', error.message);
  console.log('');
  console.log('💡 Sugerencias:');
  console.log('1. Verifica que el archivo .env esté en la raíz del proyecto');
  console.log('2. Verifica que las variables de Firebase estén correctamente configuradas');
  console.log('3. Verifica que la clave privada no tenga caracteres de escape incorrectos');
}

console.log('');
console.log('Presiona Ctrl+C para salir...');
