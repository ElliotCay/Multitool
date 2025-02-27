import React, { useState } from 'react';
import ImageCompression from './compression/ImageCompression';
import VideoCompression from './compression/VideoCompression';
import '../styles/CompressionTools.css';

const CompressionTools = () => {
  const [activeSubTool, setActiveSubTool] = useState('images');

  const handleSubToolChange = (subTool) => {
    setActiveSubTool(subTool);
  };

  const renderSubToolContent = () => {
    switch (activeSubTool) {
      case 'images':
        return <ImageCompression />;
      case 'videos':
        return <VideoCompression />;
      default:
        return null;
    }
  };

  return (
    <div className="compression-tools-container">
      <div className="subtool-navigation">
        <button 
          className={`subtool-button ${activeSubTool === 'images' ? 'active' : ''}`}
          onClick={() => handleSubToolChange('images')}
        >
          Compression d'images
        </button>
        <button 
          className={`subtool-button ${activeSubTool === 'videos' ? 'active' : ''}`}
          onClick={() => handleSubToolChange('videos')}
        >
          Compression de vidéos
        </button>
      </div>
      
      <div className="compression-tools-content">
        {renderSubToolContent()}
      </div>
    </div>
  );
};

export default CompressionTools;