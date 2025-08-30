const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: '../.env' });

// Inicializar Firebase Admin usando archivo JSON
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, '../firebase-admin-key.json');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      storageBucket: 'registropersonas-f1653.firebasestorage.app'
    });
    
    console.log('✅ Firebase Admin SDK inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin SDK:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();
const bucket = admin.storage().bucket();
const auth = admin.auth();

module.exports = { admin, db, bucket, auth };
