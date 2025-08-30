import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Shield, FileText } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const { userData, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="backdrop-blur-lg bg-white/5 border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">DocManager</h1>
            </div>

            <nav className="flex space-x-1">
              <button
                onClick={() => onTabChange('documents')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'documents'
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Mis Documentos
              </button>
              
              {userData?.role === 'admin' && (
                <button
                  onClick={() => onTabChange('admin')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === 'admin'
                      ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Panel Admin</span>
                </button>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-white text-sm">
                {userData?.firstName} {userData?.lastName}
              </span>
              {userData?.role === 'admin' && (
                <span className="bg-purple-500/30 text-purple-200 px-2 py-1 rounded-full text-xs border border-purple-500/50">
                  Admin
                </span>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-all duration-200 border border-red-500/30"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
