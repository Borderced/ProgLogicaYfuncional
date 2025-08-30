const express = require('express');
const { auth, db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Registrar usuario
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'usuario' } = req.body;

    // Validaciones básicas
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`
    });

    // Guardar información adicional en Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      firstName,
      lastName,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        uid: userRecord.uid,
        email,
        firstName,
        lastName,
        role
      }
    });

  } catch (error) {
    console.error('Error registrando usuario:', error);
    res.status(400).json({ 
      error: 'Error al registrar usuario',
      message: error.message 
    });
  }
});

// Obtener perfil del usuario autenticado
router.get('/profile', verifyToken, async (req, res) => {
  try {
    res.json({
      user: {
        uid: req.user.uid,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error obteniendo perfil del usuario' });
  }
});

// Actualizar perfil
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    
    const updateData = {
      updatedAt: new Date().toISOString()
    };

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;

    await db.collection('users').doc(req.user.uid).update(updateData);

    res.json({ message: 'Perfil actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error actualizando perfil' });
  }
});

// Verificar token (para mantener sesión)
router.post('/verify-token', verifyToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      uid: req.user.uid,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;
