import React from 'react';
import '../styles/TabNavigation.css';

const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'pdf', label: 'PDF', color: 'blue' },
    { id: 'compression', label: 'Compression', color: 'green' },
    { id: 'download', label: 'Téléchargement', color: 'red' }
  ];

  return (
    <div className="tab-navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${tab.color} ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;