const { auth, db } = require('../config/firebase');

// Middleware para verificar token de Firebase
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autorización requerido' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Obtener información adicional del usuario desde Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userData.role || 'usuario',
      ...userData
    };
    
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar rol de administrador
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  next();
};

// Middleware para verificar que el usuario solo acceda a sus propios recursos
const requireOwnershipOrAdmin = (req, res, next) => {
  const userId = req.params.userId || req.body.userId || req.query.userId;
  
  if (req.user.role === 'admin' || req.user.uid === userId) {
    next();
  } else {
    return res.status(403).json({ error: 'Acceso denegado. Solo puedes acceder a tus propios recursos.' });
  }
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireOwnershipOrAdmin
};
