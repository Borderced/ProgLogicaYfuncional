const express = require('express');
const multer = require('multer');
const { db, bucket } = require('../config/firebase');
const { verifyToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Configurar multer para manejo de archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Validar tipos de archivo permitidos
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten PDF e imágenes.'));
    }
  }
});

// Guardar información de documento subido a Firebase Storage
router.post('/upload-info', verifyToken, async (req, res) => {
  try {
    const { originalName, documentType, description, contentType, size, downloadUrl } = req.body;
    
    if (!originalName || !documentType || !contentType || !size || !downloadUrl) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos: originalName, documentType, contentType, size, downloadUrl' 
      });
    }

    // Extraer fileName de la downloadUrl
    let fileName = null;
    try {
      const urlParts = downloadUrl.split('/');
      const encodedPath = urlParts[urlParts.length - 1].split('?')[0];
      fileName = decodeURIComponent(encodedPath);
    } catch (error) {
      console.warn('No se pudo extraer fileName de downloadUrl:', error);
    }

    // Guardar metadata en Firestore
    const documentData = {
      fileName,
      originalName,
      contentType,
      size,
      downloadUrl,
      documentType,
      description: description || '',
      uploadedBy: req.user.uid,
      uploadedAt: new Date().toISOString(),
      isActive: true
    };

    const docRef = await db.collection('documents').add(documentData);

    res.status(201).json({
      message: 'Información del documento guardada exitosamente',
      document: {
        id: docRef.id,
        ...documentData
      }
    });

  } catch (error) {
    console.error('Error guardando información del documento:', error);
    res.status(500).json({ error: 'Error guardando información del documento' });
  }
});

// Subir documento
router.post('/upload', verifyToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
    }

    const { documentType, description } = req.body;
    
    if (!documentType) {
      return res.status(400).json({ error: 'El tipo de documento es requerido' });
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileName = `${req.user.uid}/${timestamp}_${req.file.originalname}`;
    
    // Subir archivo a Firebase Storage
    const file = bucket.file(fileName);
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          uploadedBy: req.user.uid,
          originalName: req.file.originalname,
          documentType,
          description: description || ''
        }
      }
    });

    stream.on('error', (error) => {
      console.error('Error subiendo archivo:', error);
      res.status(500).json({ error: 'Error subiendo archivo' });
    });

    stream.on('finish', async () => {
      try {
        // Hacer el archivo públicamente accesible (con reglas de Firebase)
        await file.makePublic();
        
        // Obtener URL de descarga
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491' // URL permanente
        });

        // Guardar metadata en Firestore
        const documentData = {
          fileName,
          originalName: req.file.originalname,
          contentType: req.file.mimetype,
          size: req.file.size,
          downloadUrl: url,
          documentType,
          description: description || '',
          uploadedBy: req.user.uid,
          uploadedAt: new Date().toISOString(),
          isActive: true
        };

        const docRef = await db.collection('documents').add(documentData);

        res.status(201).json({
          message: 'Documento subido exitosamente',
          document: {
            id: docRef.id,
            ...documentData
          }
        });

      } catch (error) {
        console.error('Error guardando metadata:', error);
        res.status(500).json({ error: 'Error procesando archivo' });
      }
    });

    stream.end(req.file.buffer);

  } catch (error) {
    console.error('Error en upload:', error);
    res.status(500).json({ error: 'Error subiendo documento' });
  }
});

// Obtener documentos del usuario autenticado
router.get('/my-documents', verifyToken, async (req, res) => {
  try {
    const documentsSnapshot = await db.collection('documents')
      .where('uploadedBy', '==', req.user.uid)
      .where('isActive', '==', true)
      .orderBy('uploadedAt', 'desc')
      .get();

    const documents = [];
    documentsSnapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ documents });
  } catch (error) {
    console.error('Error obteniendo documentos:', error);
    res.status(500).json({ error: 'Error obteniendo documentos' });
  }
});

// Obtener documentos de un usuario específico (admin o el mismo usuario)
router.get('/user/:userId', verifyToken, requireOwnershipOrAdmin, async (req, res) => {
  try {
    const documentsSnapshot = await db.collection('documents')
      .where('uploadedBy', '==', req.params.userId)
      .where('isActive', '==', true)
      .orderBy('uploadedAt', 'desc')
      .get();

    const documents = [];
    documentsSnapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ documents });
  } catch (error) {
    console.error('Error obteniendo documentos del usuario:', error);
    res.status(500).json({ error: 'Error obteniendo documentos del usuario' });
  }
});

// Obtener todos los documentos agrupados por usuario (solo admin)
router.get('/all', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Obtener todos los documentos
    const documentsSnapshot = await db.collection('documents')
      .where('isActive', '==', true)
      .orderBy('uploadedAt', 'desc')
      .get();

    // Obtener todos los usuarios
    const usersSnapshot = await db.collection('users').get();
    const usersMap = {};
    usersSnapshot.forEach(doc => {
      usersMap[doc.id] = doc.data();
    });

    // Agrupar documentos por usuario
    const documentsByUser = {};
    documentsSnapshot.forEach(doc => {
      const docData = doc.data();
      const userId = docData.uploadedBy;
      
      if (!documentsByUser[userId]) {
        documentsByUser[userId] = {
          user: {
            uid: userId,
            ...usersMap[userId]
          },
          documents: []
        };
      }
      
      documentsByUser[userId].documents.push({
        id: doc.id,
        ...docData
      });
    });

    res.json({ documentsByUser: Object.values(documentsByUser) });
  } catch (error) {
    console.error('Error obteniendo todos los documentos:', error);
    res.status(500).json({ error: 'Error obteniendo todos los documentos' });
  }
});

// Eliminar documento
router.delete('/:documentId', verifyToken, async (req, res) => {
  try {
    const documentId = req.params.documentId;
    
    // Obtener el documento
    const docRef = db.collection('documents').doc(documentId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const docData = doc.data();
    
    // Verificar permisos (solo el propietario o admin puede eliminar)
    if (req.user.role !== 'admin' && docData.uploadedBy !== req.user.uid) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este documento' });
    }

    // Marcar como inactivo en lugar de eliminar (para auditoría)
    await docRef.update({
      isActive: false,
      deletedAt: new Date().toISOString(),
      deletedBy: req.user.uid
    });

    // Opcionalmente, eliminar archivo físico de Storage
    try {
      let fileName = docData.fileName;
      
      // Si no hay fileName (archivos subidos con upload-info), extraerlo de la downloadUrl
      if (!fileName && docData.downloadUrl) {
        // Extraer el path del archivo de la URL de Firebase Storage
        const urlParts = docData.downloadUrl.split('/');
        const encodedPath = urlParts[urlParts.length - 1].split('?')[0];
        fileName = decodeURIComponent(encodedPath);
        
        // Si el path incluye 'documents/', mantenerlo
        if (!fileName.includes('documents/') && !fileName.includes(docData.uploadedBy)) {
          // Asumir estructura documents/userId/filename si no está presente
          fileName = `documents/${docData.uploadedBy}/${fileName}`;
        }
      }
      
      if (fileName) {
        const file = bucket.file(fileName);
        await file.delete();
        console.log(`Archivo eliminado de Storage: ${fileName}`);
      } else {
        console.warn('No se pudo determinar el nombre del archivo para eliminar de Storage');
      }
    } catch (storageError) {
      console.error('Error eliminando archivo de storage:', storageError);
      // No lanzar error, solo logear para que la eliminación lógica continúe
    }

    res.json({ message: 'Documento eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando documento:', error);
    res.status(500).json({ error: 'Error eliminando documento' });
  }
});

// Obtener estadísticas (solo admin)
router.get('/stats/overview', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [usersSnapshot, documentsSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('documents').where('isActive', '==', true).get()
    ]);

    const stats = {
      totalUsers: usersSnapshot.size,
      totalDocuments: documentsSnapshot.size,
      documentsByType: {},
      recentUploads: []
    };

    // Contar documentos por tipo
    documentsSnapshot.forEach(doc => {
      const data = doc.data();
      const type = data.documentType || 'Sin categoría';
      stats.documentsByType[type] = (stats.documentsByType[type] || 0) + 1;
      
      // Obtener uploads recientes (últimos 10)
      if (stats.recentUploads.length < 10) {
        stats.recentUploads.push({
          id: doc.id,
          originalName: data.originalName,
          documentType: data.documentType,
          uploadedAt: data.uploadedAt,
          uploadedBy: data.uploadedBy
        });
      }
    });

    res.json({ stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

module.exports = router;
