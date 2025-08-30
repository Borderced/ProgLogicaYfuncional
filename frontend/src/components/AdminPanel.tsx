import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Image, Eye, Download, User, Calendar, ChevronDown, ChevronRight, BarChart3, Users, Files, Search, Filter, Trash2, RefreshCw } from 'lucide-react';

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

interface UserDocuments {
  user: {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  documents: Document[];
}

interface Stats {
  totalUsers: number;
  totalDocuments: number;
  documentsByType: { [key: string]: number };
}

export default function AdminPanel() {
  const [documentsByUser, setDocumentsByUser] = useState<UserDocuments[]>([]);
  const [filteredDocumentsByUser, setFilteredDocumentsByUser] = useState<UserDocuments[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
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

  const fetchData = async (isRefresh = false) => {
    try {
      if (!currentUser) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = await currentUser.getIdToken();
      
      // Obtener documentos agrupados por usuario
      const [documentsResponse, statsResponse] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_BASE_URL}/documents/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.REACT_APP_API_BASE_URL}/documents/stats/overview`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json();
        setDocumentsByUser(documentsData.documentsByUser);
        setFilteredDocumentsByUser(documentsData.documentsByUser);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Filtrar documentos por usuario
  useEffect(() => {
    let filtered = documentsByUser;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(userDocs => {
        const userMatch = 
          userDocs.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          userDocs.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          userDocs.user.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const documentMatch = userDocs.documents.some(doc =>
          doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        return userMatch || documentMatch;
      });
    }

    // Filtrar por tipo de documento
    if (filterType !== 'all') {
      filtered = filtered.map(userDocs => ({
        ...userDocs,
        documents: userDocs.documents.filter(doc => doc.documentType === filterType)
      })).filter(userDocs => userDocs.documents.length > 0);
    }

    setFilteredDocumentsByUser(filtered);
  }, [documentsByUser, searchTerm, filterType]);

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
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
      return <FileText className="w-6 h-6 text-red-400" />;
    } else if (contentType.startsWith('image/')) {
      return <Image className="w-6 h-6 text-green-400" />;
    }
    return <FileText className="w-6 h-6 text-gray-400" />;
  };

  const handleDeleteDocument = async (documentId: string, userIndex: number, docIndex: number) => {
    if (!currentUser || !window.confirm('¿Estás seguro de que quieres eliminar este documento?')) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Actualizar estado local
        const updatedUsers = [...filteredDocumentsByUser];
        updatedUsers[userIndex].documents.splice(docIndex, 1);
        setFilteredDocumentsByUser(updatedUsers);
        
        // Actualizar también el estado original
        const updatedOriginal = [...documentsByUser];
        const originalUserIndex = updatedOriginal.findIndex(u => u.user.uid === updatedUsers[userIndex].user.uid);
        if (originalUserIndex !== -1) {
          const originalDocIndex = updatedOriginal[originalUserIndex].documents.findIndex(d => d.id === documentId);
          if (originalDocIndex !== -1) {
            updatedOriginal[originalUserIndex].documents.splice(originalDocIndex, 1);
            setDocumentsByUser(updatedOriginal);
          }
        }

        // Recargar estadísticas
        fetchData(true);
      } else {
        alert('Error al eliminar el documento');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
    }
  };

  const refreshData = () => {
    fetchData(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">Cargando panel de administración...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Panel de Administración</h2>
            <p className="text-gray-300">Gestiona todos los documentos y usuarios del sistema</p>
          </div>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className={`flex items-center space-x-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded-lg border border-purple-500/50 transition-colors duration-200 ${
              refreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
            />
          </div>
          <div className="sm:w-64">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-8 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent appearance-none"
              >
                <option value="all" className="bg-gray-800">Todos los tipos</option>
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value} className="bg-gray-800">{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="backdrop-blur-lg bg-white/10 rounded-xl border border-white/20 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-300 text-sm">Total Usuarios</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-lg bg-white/10 rounded-xl border border-white/20 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Files className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-300 text-sm">Total Documentos</p>
                <p className="text-2xl font-bold text-white">{stats.totalDocuments}</p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-lg bg-white/10 rounded-xl border border-white/20 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-300 text-sm">Tipos de Docs</p>
                <p className="text-2xl font-bold text-white">{Object.keys(stats.documentsByType).length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de usuarios y sus documentos */}
      <div className="space-y-4">
        {filteredDocumentsByUser.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-6">
              <Files className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm || filterType !== 'all' ? 'No se encontraron resultados' : 'No hay documentos en el sistema'}
            </h3>
            <p className="text-gray-400">
              {searchTerm || filterType !== 'all' 
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Los documentos aparecerán aquí cuando los usuarios los suban'
              }
            </p>
          </div>
        ) : (
          filteredDocumentsByUser.map((userDocs, userIndex) => (
            <div key={userDocs.user.uid} className="backdrop-blur-lg bg-white/10 rounded-xl border border-white/20">
              <button
                onClick={() => toggleUserExpansion(userDocs.user.uid)}
                className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-white font-semibold">
                      {userDocs.user.firstName} {userDocs.user.lastName}
                    </h3>
                    <p className="text-gray-300 text-sm">{userDocs.user.email}</p>
                    <p className="text-purple-300 text-xs">
                      {userDocs.documents.length} documento{userDocs.documents.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {userDocs.user.role === 'admin' && (
                    <span className="bg-purple-500/30 text-purple-200 px-2 py-1 rounded-full text-xs border border-purple-500/50">
                      Admin
                    </span>
                  )}
                </div>
                {expandedUsers.has(userDocs.user.uid) ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {expandedUsers.has(userDocs.user.uid) && (
                <div className="px-6 pb-6">
                  <div className="border-t border-white/10 pt-4">
                    {userDocs.documents.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">Este usuario no tiene documentos</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userDocs.documents.map((doc, docIndex) => (
                          <div key={doc.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="flex items-start space-x-3 mb-3">
                              {getFileIcon(doc.contentType)}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate text-sm">
                                  {doc.originalName}
                                </h4>
                                <p className="text-purple-300 text-xs">
                                  {documentTypeLabels[doc.documentType] || doc.documentType}
                                </p>
                              </div>
                            </div>

                            {doc.description && (
                              <p className="text-gray-300 text-xs mb-3 line-clamp-2">
                                {doc.description}
                              </p>
                            )}

                            <div className="space-y-1 mb-3">
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(doc.uploadedAt)}</span>
                              </div>
                              <div className="text-xs text-gray-400">
                                {formatFileSize(doc.size)}
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <a
                                href={doc.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded text-xs transition-colors duration-200"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Ver</span>
                              </a>
                              <a
                                href={doc.downloadUrl}
                                download={doc.originalName}
                                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded text-xs transition-colors duration-200"
                              >
                                <Download className="w-3 h-3" />
                                <span>Descargar</span>
                              </a>
                              <button
                                onClick={() => handleDeleteDocument(doc.id, userIndex, docIndex)}
                                className="flex items-center justify-center px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded text-xs transition-colors duration-200"
                                title="Eliminar documento"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
