const { auth, db } = require('../config/firebase');

async function createAdmin() {
  try {
    const email = 'admin@docmanager.com';
    const password = 'admin123456';
    const firstName = 'Administrador';
    const lastName = 'Sistema';

    console.log('Creando usuario administrador...');

    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`
    });

    console.log('Usuario creado en Firebase Auth:', userRecord.uid);

    // Guardar información en Firestore con rol de admin
    await db.collection('users').doc(userRecord.uid).set({
      email,
      firstName,
      lastName,
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Usuario administrador creado exitosamente!');
    console.log('📧 Email:', email);
    console.log('🔑 Contraseña:', password);
    console.log('🔐 Rol: admin');
    console.log('');
    console.log('Puedes usar estas credenciales para iniciar sesión como administrador.');

  } catch (error) {
    console.error('❌ Error creando administrador:', error.message);
    
    if (error.code === 'auth/email-already-exists') {
      console.log('El usuario ya existe. Intentando actualizar rol...');
      
      try {
        // Buscar usuario por email
        const userRecord = await auth.getUserByEmail(email);
        
        // Actualizar rol en Firestore
        await db.collection('users').doc(userRecord.uid).update({
          role: 'admin',
          updatedAt: new Date().toISOString()
        });
        
        console.log('✅ Rol actualizado a administrador exitosamente!');
      } catch (updateError) {
        console.error('❌ Error actualizando rol:', updateError.message);
      }
    }
  }

  process.exit(0);
}

createAdmin();
