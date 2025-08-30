import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Image, Download, Trash2, Plus, Eye, Calendar, Loader } from 'lucide-react';
import DocumentUpload from './DocumentUpload';

interface Document {
  id: string;
  originalName: string;
  documentType: string;
  description: string;
  contentType: string;
  size: number;
  downloadUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const { currentUser } = useAuth();

  const documentTypeLabels: { [key: string]: string } = {
    'acta_nacimiento': 'Acta de Nacimiento',
    'curp': 'CURP',
    'ine': 'INE/IFE',
    'comprobante_domicilio': 'Comprobante de Domicilio',
    'rfc': 'RFC',
    'nss': 'Número de Seguridad Social',
    'pasaporte': 'Pasaporte',
    'cedula_profesional': 'Cédula Profesional',
    'otro': 'Otro'
  };

  const fetchDocuments = async () => {
    try {
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/documents/my-documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      } else {
        console.error('Error fetching documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      return;
    }

    try {
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setDocuments(documents.filter(doc => doc.id !== documentId));
      } else {
        alert('Error eliminando documento');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error eliminando documento');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (contentType: string) => {
    if (contentType === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-400" />;
    } else if (contentType.startsWith('image/')) {
      return <Image className="w-8 h-8 text-green-400" />;
    }
    return <FileText className="w-8 h-8 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div 
          className="flex items-center space-x-3 text-white text-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader className="w-6 h-6" />
          </motion.div>
          <span>Cargando documentos...</span>
        </motion.div>
      </div>
    );
  }

  // Definir variantes de animación
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
      }
    }
  };

  return (
    <motion.div 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div 
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div>
          <motion.h2 
            className="text-3xl font-bold text-white mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Mis Documentos
          </motion.h2>
          <motion.p 
            className="text-gray-300"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Gestiona tus documentos personales
          </motion.p>
        </div>
        <motion.button
          onClick={() => setShowUpload(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5" />
          <span>Subir Documento</span>
        </motion.button>
      </motion.div>

      {documents.length === 0 ? (
        <motion.div 
          className="text-center py-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.div 
            className="mx-auto w-24 h-24 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4, type: "spring", bounce: 0.4 }}
          >
            <FileText className="w-12 h-12 text-purple-400" />
          </motion.div>
          <motion.h3 
            className="text-xl font-semibold text-white mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            No tienes documentos
          </motion.h3>
          <motion.p 
            className="text-gray-400 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Comienza subiendo tu primer documento
          </motion.p>
          <motion.button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            <span>Subir Documento</span>
          </motion.button>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {documents.map((doc, index) => (
              <motion.div
                key={doc.id}
                className="group backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300 shadow-lg hover:shadow-2xl ring-1 ring-white/5 hover:ring-white/10"
                variants={itemVariants}
                layout
                whileHover={{ 
                  y: -5, 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.8, 
                  y: -20,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      {getFileIcon(doc.contentType)}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <motion.h3 
                        className="text-white font-medium truncate group-hover:text-green-300 transition-colors duration-200"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                      >
                        {doc.originalName}
                      </motion.h3>
                      <motion.p 
                        className="text-sm text-purple-300 group-hover:text-purple-200 transition-colors duration-200"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.4 }}
                      >
                        {documentTypeLabels[doc.documentType] || doc.documentType}
                      </motion.p>
                    </div>
                  </div>
                </div>

                {doc.description && (
                  <motion.p 
                    className="text-gray-300 text-sm mb-4 line-clamp-2 group-hover:text-gray-200 transition-colors duration-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                  >
                    {doc.description}
                  </motion.p>
                )}

                <motion.div 
                  className="space-y-2 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.6 }}
                >
                  <div className="flex items-center space-x-2 text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-200">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(doc.uploadedAt)}</span>
                  </div>
                  <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-200">
                    Tamaño: {formatFileSize(doc.size)}
                  </div>
                </motion.div>

                <motion.div 
                  className="flex space-x-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.7 }}
                >
                  <motion.a
                    href={doc.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-xl transition-all duration-200 border border-blue-500/30 backdrop-blur-sm hover:backdrop-blur-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Ver</span>
                  </motion.a>
                  <motion.a
                    href={doc.downloadUrl}
                    download={doc.originalName}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded-xl transition-all duration-200 border border-green-500/30 backdrop-blur-sm hover:backdrop-blur-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Descargar</span>
                  </motion.a>
                  <motion.button
                    onClick={() => handleDelete(doc.id)}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl transition-all duration-200 border border-red-500/30 backdrop-blur-sm hover:backdrop-blur-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {showUpload && (
          <DocumentUpload
            onClose={() => setShowUpload(false)}
            onUploadSuccess={() => {
              setShowUpload(false);
              fetchDocuments();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
