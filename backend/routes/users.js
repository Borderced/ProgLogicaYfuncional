const express = require('express');
const { auth, db } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los usuarios (solo admin)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });

    res.json({ users });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

// Obtener usuario específico (solo admin)
router.get('/:userId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      user: {
        uid: userDoc.id,
        ...userDoc.data()
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error obteniendo usuario' });
  }
});

// Actualizar rol de usuario (solo admin)
router.put('/:userId/role', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['usuario', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido. Debe ser "usuario" o "admin"' });
    }

    await db.collection('users').doc(req.params.userId).update({
      role,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Rol actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando rol:', error);
    res.status(500).json({ error: 'Error actualizando rol del usuario' });
  }
});

// Eliminar usuario (solo admin)
router.delete('/:userId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Eliminar de Firebase Auth
    await auth.deleteUser(userId);
    
    // Eliminar de Firestore
    await db.collection('users').doc(userId).delete();
    
    // Nota: Los documentos del usuario se mantendrán para auditoría
    // En un caso real, podrías querer eliminarlos también

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error eliminando usuario' });
  }
});

module.exports = router;
