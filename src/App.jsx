import React from 'react';
import { createRoot } from 'react-dom/client';
import MainLayout from './components/MainLayout';
import NotificationProvider from './components/common/NotificationProvider';
import UserTesting from './components/dev/UserTesting';
import './styles/global.css';

// Vérifier si l'application est en mode développement
const isDev = window.location.search.includes('dev=true') || 
              process.env.NODE_ENV === 'development' ||
              window.electron?.isDev;

const App = () => {
  return (
    <>
      <MainLayout />
      <NotificationProvider />
      {isDev && <UserTesting />}
    </>
  );
};

// Render l'application dans le conteneur root
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);

export default App;