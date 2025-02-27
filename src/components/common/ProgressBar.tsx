import React from 'react';
import '../../styles/common/ProgressBar.css';

interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  label?: string; // Rendre label optionnel
  variant?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  showPercentage = true,
  label,
  variant = 'default'
}) => {
  // S'assurer que la valeur du progress est entre 0 et 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className="progress-bar-container">
      {label && <div className="progress-label">{label}</div>}
      {/* Reste du JSX */}
    </div>
  );
};

export default ProgressBar;