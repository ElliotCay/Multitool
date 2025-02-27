import React, { useState, useRef } from 'react';
import '../../styles/common/DragDropArea.css';

const DragDropArea = ({ 
  onFilesSelected,
  acceptedFileTypes = '*', // ex: '.pdf,.doc' ou 'image/*'
  multiple = true,
  children 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onFilesSelected(files);
    }
  };

  const handleClick = () => {
    // Déclenche le click sur l'input file caché
    fileInputRef.current.click();
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
    }
  };

  return (
    <div 
      className={`drag-drop-area ${isDragging ? 'active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {children || (
        <>
          <div className="drag-drop-icon">📁</div>
          <p>Glissez-déposez vos fichiers ici</p>
          <p>ou</p>
          <button className="button button-primary">Parcourir les fichiers</button>
        </>
      )}
      
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept={acceptedFileTypes}
        multiple={multiple}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default DragDropArea;