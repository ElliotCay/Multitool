import React from 'react';
import '../../styles/common/ProgressBar.css';

const ProgressBar = ({ 
  progress, 
  showPercentage = true,
  label,
  variant = 'default' // 'default', 'success', 'warning', 'error'
}) => {
  // S'assurer que la valeur du progress est entre 0 et 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className="progress-bar-container">
      {label && <div className="progress-label">{label}</div>}
      <div className="progress-bar">
        <div 
          className={`progress-bar-fill ${variant}`} 
          style={{ width: `${normalizedProgress}%` }}
        ></div>
      </div>
      {showPercentage && (
        <div className="progress-percentage">{normalizedProgress.toFixed(0)}%</div>
      )}
    </div>
  );
};

export default ProgressBar;