import React, { useState } from 'react';
import PDFMerge from './pdf/PDFMerge';
import PDFPageRemove from './pdf/PDFPageRemove';
import '../styles/PDFTools.css';

const PDFTools = () => {
  const [activeSubTool, setActiveSubTool] = useState('merge');

  const handleSubToolChange = (subTool) => {
    setActiveSubTool(subTool);
  };

  const renderSubToolContent = () => {
    switch (activeSubTool) {
      case 'merge':
        return <PDFMerge />;
      case 'delete-pages':
        return <PDFPageRemove />;
      default:
        return null;
    }
  };

  return (
    <div className="pdf-tools-container">
      <div className="subtool-navigation">
        <button 
          className={`subtool-button ${activeSubTool === 'merge' ? 'active' : ''}`}
          onClick={() => handleSubToolChange('merge')}
        >
          Fusion de PDF
        </button>
        <button 
          className={`subtool-button ${activeSubTool === 'delete-pages' ? 'active' : ''}`}
          onClick={() => handleSubToolChange('delete-pages')}
        >
          Suppression de pages
        </button>
      </div>
      
      <div className="pdf-tools-content">
        {renderSubToolContent()}
      </div>
    </div>
  );
};

export default PDFTools;