import React, { useState, useEffect } from 'react';
import DragDropArea from '../common/DragDropArea';
import ProgressBar from '../common/ProgressBar';
import { generatePdfThumbnail, getPdfPageCount, removePages, savePdfFile } from '../../utils/pdfUtils';
import notificationService from '../../services/notificationService';
import '../../styles/pdf/PDFPageRemove.css';

const PDFPageRemove = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageThumbnails, setPageThumbnails] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Générer les miniatures de toutes les pages quand un fichier est sélectionné
  useEffect(() => {
    const loadPdfThumbnails = async () => {
      if (!pdfFile) return;
      
      setIsLoading(true);
      try {
        // Obtenir le nombre de pages
        const count = await getPdfPageCount(pdfFile);
        setPageCount(count);
        
        // Générer une miniature pour chaque page
        const thumbnails = [];
        for (let i = 1; i <= count; i++) {
          const thumbnail = await generatePdfThumbnail(pdfFile, i);
          thumbnails.push({ pageNumber: i, thumbnail });
          
          // Mise à jour progressive de l'interface
          setPageThumbnails(prev => [...prev, { pageNumber: i, thumbnail }]);
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement des miniatures:', error);
      }
      setIsLoading(false);
    };
    
    if (pdfFile) {
      setPageThumbnails([]);
      setSelectedPages([]);
      loadPdfThumbnails();
    }
  }, [pdfFile]);

  // Gestion du PDF déposé
  const handleFileSelected = (files) => {
    if (files.length === 0) return;
    
    const file = files[0];
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setPdfFile(file);
    }
  };

  // Gérer la sélection/désélection d'une page
  const togglePageSelection = (pageNumber) => {
    setSelectedPages(prev => {
      if (prev.includes(pageNumber)) {
        return prev.filter(p => p !== pageNumber);
      } else {
        return [...prev, pageNumber];
      }
    });
  };

  // Supprimer les pages sélectionnées
  const handleRemovePages = async () => {
    if (!pdfFile || selectedPages.length === 0) return;
    
    if (selectedPages.length === pageCount) {
      notificationService.warning("Vous ne pouvez pas supprimer toutes les pages.");
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Mise à jour artificielle de la progression pour l'UX
      const updateProgress = () => {
        setProgress(prev => {
          if (prev < 80) return prev + 10;
          return prev;
        });
      };
      
      const progressInterval = setInterval(updateProgress, 300);
      
      // Convertir les numéros de page (commençant à 1) en indices (commençant à 0)
      const pageIndicesToRemove = selectedPages.map(pageNum => pageNum - 1);
      
      // Supprimer les pages
      const modifiedPdfBlob = await removePages(pdfFile, pageIndicesToRemove);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Préparer le nom du fichier modifié
      const originalName = pdfFile.name;
      const dotIndex = originalName.lastIndexOf('.');
      const nameWithoutExt = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
      const fileName = `${nameWithoutExt}_modified.pdf`;
      
      // Sauvegarder le fichier
      savePdfFile(modifiedPdfBlob, fileName);
      
      // Afficher une notification de succès
      notificationService.success(`${selectedPages.length} page(s) supprimée(s) avec succès. Fichier enregistré sous "${fileName}"`);
      
      // Réinitialiser l'état après 1 seconde
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de la suppression des pages:', error);
      setIsProcessing(false);
      setProgress(0);
      notificationService.error('La suppression des pages a échoué. Veuillez réessayer.');
    }
  };

  const handleRemoveAllSelected = () => {
    setSelectedPages([]);
  };

  return (
    <div className="pdf-page-remove-container">
      <h3>Suppression de pages PDF</h3>
      <p>Supprimez des pages spécifiques d'un document PDF</p>
      
      {!pdfFile ? (
        <DragDropArea 
          onFilesSelected={handleFileSelected}
          acceptedFileTypes=".pdf,application/pdf"
          multiple={false}
        >
          <p>Glissez-déposez un fichier PDF ici</p>
          <p>ou</p>
          <button className="button button-primary">Parcourir les fichiers</button>
        </DragDropArea>
      ) : (
        <div className="pdf-info-bar">
          <div className="pdf-info">
            <span className="pdf-name">{pdfFile.name}</span>
            <span className="pdf-details">
              {pageCount} pages • {(pdfFile.size / 1024).toFixed(1)} KB
            </span>
          </div>
          <button 
            className="button button-text"
            onClick={() => {
              setPdfFile(null);
              setPageCount(0);
              setPageThumbnails([]);
              setSelectedPages([]);
            }}
          >
            Changer de fichier
          </button>
        </div>
      )}
      
      {/* Affichage des miniatures de pages */}
      {pdfFile && (
        <>
          {isLoading ? (
            <div className="loading-indicator">
              <p>Chargement du document...</p>
              <ProgressBar progress={pageThumbnails.length / pageCount * 100} />
            </div>
          ) : (
            <>
              {pageThumbnails.length > 0 && (
                <div className="pdf-pages-section">
                  <div className="pdf-pages-header">
                    <h4>Pages du document ({selectedPages.length} sélectionnées)</h4>
                    {selectedPages.length > 0 && (
                      <button 
                        className="button button-text"
                        onClick={handleRemoveAllSelected}
                      >
                        Désélectionner tout
                      </button>
                    )}
                  </div>
                  
                  <div className="pdf-pages-grid">
                    {pageThumbnails.map(page => (
                      <div 
                        key={page.pageNumber}
                        className={`pdf-page-item ${selectedPages.includes(page.pageNumber) ? 'selected' : ''}`}
                        onClick={() => togglePageSelection(page.pageNumber)}
                      >
                        <img 
                          src={page.thumbnail} 
                          alt={`Page ${page.pageNumber}`}
                          className="pdf-page-thumbnail"
                        />
                        <div className="pdf-page-number">Page {page.pageNumber}</div>
                        <div className="pdf-page-selection-indicator"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Barre de progression */}
              {isProcessing && (
                <div className="processing-indicator">
                  <p>Suppression des pages en cours...</p>
                  <ProgressBar progress={progress} />
                </div>
              )}
              
              {/* Boutons d'action */}
              <div className="action-buttons">
                <button 
                  className="button button-primary"
                  onClick={handleRemovePages}
                  disabled={selectedPages.length === 0 || isProcessing}
                >
                  Supprimer {selectedPages.length} page{selectedPages.length !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PDFPageRemove;