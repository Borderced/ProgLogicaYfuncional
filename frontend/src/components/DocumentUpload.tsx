import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { storage } from '../config/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

interface DocumentUploadProps {
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function DocumentUpload({ onClose, onUploadSuccess }: DocumentUploadProps) {
  const [documentType, setDocumentType] = useState('acta_nacimiento');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const { currentUser } = useAuth();

  const documentTypes = [
    { value: 'acta_nacimiento', label: 'Acta de Nacimiento' },
    { value: 'curp', label: 'CURP' },
    { value: 'ine', label: 'INE/IFE' },
    { value: 'comprobante_domicilio', label: 'Comprobante de Domicilio' },
    { value: 'rfc', label: 'RFC' },
    { value: 'nss', label: 'Número de Seguridad Social' },
    { value: 'pasaporte', label: 'Pasaporte' },
    { value: 'cedula_profesional', label: 'Cédula Profesional' },
    { value: 'otro', label: 'Otro' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });
    
    setSelectedFiles(validFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });
    
    setSelectedFiles(validFiles);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    const fileId = uuidv4();
    const fileName = `${fileId}-${file.name}`;
    const storageRef = ref(storage, `${currentUser?.uid}/${fileName}`);
    
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload failed:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Por favor selecciona al menos un archivo');
      return;
    }

    setUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      
      // Subir cada archivo a Firebase Storage y luego al backend
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Subir archivo a Firebase Storage
        const downloadUrl = await uploadFileToStorage(file);
        
        // Guardar información en el backend
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/documents/upload-info`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            originalName: file.name,
            documentType,
            description,
            contentType: file.type,
            size: file.size,
            downloadUrl
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error guardando información del archivo');
        }
      }

      setUploadStatus('success');
      setTimeout(() => {
        onUploadSuccess();
      }, 1500);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadStatus('error');
      alert('Error subiendo archivo: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 modal-backdrop backdrop-blur-animate flex items-center justify-center p-4 z-50"
        initial={{ 
          opacity: 0, 
          backdropFilter: "blur(0px)",
          background: "rgba(0, 0, 0, 0)" 
        }}
        animate={{ 
          opacity: 1, 
          backdropFilter: "blur(16px)",
          background: "rgba(0, 0, 0, 0.6)"
        }}
        exit={{ 
          opacity: 0, 
          backdropFilter: "blur(0px)",
          background: "rgba(0, 0, 0, 0)"
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          background: "linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(30, 27, 75, 0.5))"
        }}
        onClick={onClose}
      >
        <motion.div 
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="blur-strong rounded-2xl shadow-2xl border border-white/30 ring-1 ring-white/10 overflow-hidden">
            {/* Overlay adicional para más separación visual */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <motion.div 
                  className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  {uploadStatus === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : uploadStatus === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Upload className="w-5 h-5 text-white" />
                  )}
                </motion.div>
                <h2 className="text-2xl font-bold text-white">Subir Documento</h2>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-6 h-6 text-gray-400 hover:text-white" />
              </motion.button>
            </div>

            <div className="p-6 space-y-6">
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de Documento
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/15"
                  >
                    {documentTypes.map((type) => (
                      <option key={type.value} value={type.value} className="bg-gray-800">
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Descripción (Opcional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 hover:bg-white/15"
                    placeholder="Descripción del documento..."
                  />
                </div>
              </motion.div>

              <motion.div 
                className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    dragOver 
                      ? 'border-green-500 bg-green-500/10' 
                      : 'border-white/30 hover:border-white/50 hover:bg-white/5'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  
                  <motion.div
                    className="space-y-4"
                    animate={dragOver ? { scale: 1.05 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white text-lg font-medium mb-2">
                        {dragOver ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí o haz clic para seleccionar'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Solo PDF e imágenes, máximo 10MB por archivo
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Lista de archivos seleccionados */}
                <AnimatePresence>
                  {selectedFiles.length > 0 && (
                    <motion.div 
                      className="mt-6 space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <h4 className="text-white font-medium">Archivos seleccionados:</h4>
                      {selectedFiles.map((file, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium truncate">{file.name}</p>
                            <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                          </div>
                          <motion.button
                            onClick={() => removeFile(index)}
                            className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Barra de progreso */}
              <AnimatePresence>
                {uploadStatus === 'uploading' && (
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-white">Subiendo archivos...</span>
                      <span className="text-green-400">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mensaje de éxito */}
              <AnimatePresence>
                {uploadStatus === 'success' && (
                  <motion.div
                    className="flex items-center justify-center space-x-2 p-4 bg-green-500/20 border border-green-500/30 rounded-lg"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">¡Archivos subidos exitosamente!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div 
                className="flex justify-end space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <motion.button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-600/50 hover:bg-gray-600/70 text-gray-200 rounded-lg transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  onClick={handleUpload}
                  disabled={uploading || selectedFiles.length === 0 || uploadStatus === 'success'}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  whileHover={!uploading && selectedFiles.length > 0 ? { scale: 1.05 } : {}}
                  whileTap={!uploading && selectedFiles.length > 0 ? { scale: 0.95 } : {}}
                >
                  {uploading ? 'Subiendo...' : uploadStatus === 'success' ? '¡Completado!' : 'Subir Archivos'}
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
