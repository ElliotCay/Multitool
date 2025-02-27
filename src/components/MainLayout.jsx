import React, { useState } from 'react';
import TabNavigation from './TabNavigation';
import PDFTools from './PDFTools';
import CompressionTools from './CompressionTools';
import DownloadTools from './DownloadTools';
import Preferences from './Preferences';

const MainLayout = () => {
  // État pour suivre l'onglet actif
  const [activeTab, setActiveTab] = useState('pdf');
  // État pour la modal des préférences
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Fonction pour changer d'onglet
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Rendre le contenu en fonction de l'onglet actif
  const renderContent = () => {
    switch (activeTab) {
      case 'pdf':
        return <PDFTools />;
      case 'compression':
        return <CompressionTools />;
      case 'download':
        return <DownloadTools />;
      default:
        return <PDFTools />;
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        <button 
          className="preferences-button"
          onClick={() => setPreferencesOpen(true)}
          title="Préférences"
        >
          ⚙️
        </button>
      </header>
      <div className="content-container">
        {renderContent()}
      </div>
      
      {/* Modal de préférences */}
      <Preferences 
        isOpen={preferencesOpen} 
        onClose={() => setPreferencesOpen(false)} 
      />
    </div>
  );
};

export default MainLayout;