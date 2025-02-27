import React, { useState } from 'react';
import YouTubeAudio from './download/YouTubeAudio';
import TwitterVideo from './download/TwitterVideo';
import '../styles/DownloadTools.css';

const DownloadTools = () => {
  const [activeSubTool, setActiveSubTool] = useState('youtube-audio');

  const handleSubToolChange = (subTool) => {
    setActiveSubTool(subTool);
  };

  const renderSubToolContent = () => {
    switch (activeSubTool) {
      case 'youtube-audio':
        return <YouTubeAudio />;
      case 'twitter-video':
        return <TwitterVideo />;
      default:
        return null;
    }
  };

  return (
    <div className="download-tools-container">
      <div className="subtool-navigation">
        <button 
          className={`subtool-button ${activeSubTool === 'youtube-audio' ? 'active' : ''}`}
          onClick={() => handleSubToolChange('youtube-audio')}
        >
          Extraction audio YouTube
        </button>
        <button 
          className={`subtool-button ${activeSubTool === 'twitter-video' ? 'active' : ''}`}
          onClick={() => handleSubToolChange('twitter-video')}
        >
          Téléchargement vidéos X
        </button>
      </div>
      
      <div className="download-tools-content">
        {renderSubToolContent()}
      </div>
    </div>
  );
};

export default DownloadTools;