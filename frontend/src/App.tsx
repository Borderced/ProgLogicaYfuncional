import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import './App.css';

// Componente de fondo animado
function AnimatedBackground() {
  // Usar dimensiones seguras para evitar problemas con SSR
  const getViewportDimensions = () => {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
    return { width: 1920, height: 1080 }; // Fallback
  };
  
  const { width: viewWidth, height: viewHeight } = getViewportDimensions();
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden background-layer">
      {/* Gradiente base animado */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          background: [
            'linear-gradient(135deg, #0f172a 0%, #581c87 30%, #7c3aed 60%, #0f172a 100%)',
            'linear-gradient(225deg, #1e1b4b 0%, #7c3aed 30%, #8b5cf6 60%, #0f172a 100%)',
            'linear-gradient(315deg, #0f172a 0%, #6b21a8 30%, #7c3aed 60%, #1e1b4b 100%)',
            'linear-gradient(45deg, #581c87 0%, #0f172a 30%, #7c3aed 60%, #1e1b4b 100%)',
            'linear-gradient(135deg, #0f172a 0%, #581c87 30%, #7c3aed 60%, #0f172a 100%)'
          ]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop"
        }}
      />
      
      {/* Gradiente circular rotativo en el centro */}
      <motion.div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(139, 69, 255, 0.2) 0%, transparent 30%, rgba(124, 58, 237, 0.15) 50%, transparent 70%, rgba(107, 33, 168, 0.1) 90%, transparent 100%)'
        }}
        animate={{
          rotate: [0, 360]
        }}
        transition={{
          duration: 90,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      
      {/* Partículas brillantes mejoradas */}
      {[...Array(30)].map((_, i) => {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: `${x}%`,
              top: `${y}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              x: [0, (Math.random() - 0.5) * 100],
              y: [0, (Math.random() - 0.5) * 100]
            }}
            transition={{
              duration: 4 + Math.random() * 6,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: "easeInOut",
              repeatType: "loop"
            }}
          />
        );
      })}
      
      {/* Neblina circular girando desde el centro */}
      {[...Array(4)].map((_, i) => {
        const mistSize = 200 + i * 80;
        const radius = 150 + i * 100; // Radio de rotación desde el centro
        const angle = (i * 90); // Ángulo inicial diferente para cada neblina
        
        return (
          <motion.div
            key={`mist-${i}`}
            className="absolute rounded-full bg-gradient-to-r from-purple-500/4 to-blue-500/4 blur-2xl soft-glow"
            style={{
              width: `${mistSize}px`,
              height: `${mistSize}px`,
              left: '50%',
              top: '50%',
              marginLeft: `-${mistSize / 2}px`,
              marginTop: `-${mistSize / 2}px`,
              transformOrigin: `${radius}px 0px`
            }}
            animate={{
              rotate: [angle, angle + 360],
              scale: [0.6, 1.1, 0.6],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{
              rotate: {
                duration: 120 + i * 30, // Rotación más lenta, cada neblina a diferente velocidad
                repeat: Infinity,
                ease: "linear"
              },
              scale: {
                duration: 20 + i * 5,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "reverse"
              },
              opacity: {
                duration: 15 + i * 8,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "reverse"
              }
            }}
          />
        );
      })}
    </div>
  );
}

function AppContent() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <AnimatedBackground />
        <motion.div 
          className="flex flex-col items-center space-y-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Loader animado */}
          <div className="relative">
            <motion.div
              className="w-16 h-16 border-4 border-white/20 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-purple-500 border-r-purple-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          
          <motion.div 
            className="text-white text-xl font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Cargando aplicación...
          </motion.div>
          
          <motion.div 
            className="flex space-x-1"
            variants={{
              animate: {
                transition: {
                  staggerChildren: 0.2
                }
              }
            }}
            initial="initial"
            animate="animate"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-purple-400 rounded-full"
                variants={{
                  initial: { y: 0 },
                  animate: {
                    y: [-10, 0],
                    transition: {
                      duration: 0.6,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }
                  }
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentUser ? 'dashboard' : 'auth'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {currentUser ? <Dashboard /> : <AuthPage />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
