import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ fullScreen = true }) => {
  return (
    <div className={`loading-spinner ${fullScreen ? 'full-screen' : ''}`}>
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingSpinner;