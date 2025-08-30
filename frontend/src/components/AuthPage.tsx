import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

export default function AuthPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  return (
    <>
      {isLoginMode ? (
        <Login onToggleMode={toggleMode} />
      ) : (
        <Register onToggleMode={toggleMode} />
      )}
    </>
  );
}
