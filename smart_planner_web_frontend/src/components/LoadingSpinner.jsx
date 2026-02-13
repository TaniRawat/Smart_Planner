// src/components/LoadingSpinner.jsx - Reusable loading component
import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', fullScreen = false, message = 'Loading...' }) => {
  const sizeMap = {
    sm: '24px',
    md: '48px',
    lg: '72px'
  };

  const container = {
    display: fullScreen ? 'fixed' : 'flex',
    width: fullScreen ? '100vw' : 'auto',
    height: fullScreen ? '100vh' : 'auto',
    top: fullScreen ? 0 : 'auto',
    left: fullScreen ? 0 : 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: fullScreen ? 9999 : 'auto',
    backgroundColor: fullScreen ? 'rgba(255,255,255,0.9)' : 'transparent'
  };

  return (
    <div style={container}>
      <div style={{ textAlign: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: sizeMap[size],
            height: sizeMap[size],
            border: '4px solid #ddd',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            margin: '0 auto 16px'
          }}
        />
        {message && <p style={{ color: '#666', marginTop: '12px' }}>{message}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
