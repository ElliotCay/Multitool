import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DragDropArea from '../common/DragDropArea';
import ProgressBar from '../common/ProgressBar';
import { generatePdfThumbnail, mergePdfFiles, savePdfFile } from '../../utils/pdfUtils';
import '../../styles/pdf/PDFMerge.css';

const PDFMerge = () => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Gestion des fichiers PDF déposés
  const handleFilesSelected = async (files) => {
    // Filtrer pour ne garder que les PDFs
    const newPdfFiles = Array.from(files).filter(file => 
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    
    if (newPdfFiles.length === 0) return;
    
    // Créer des objets avec les informations nécessaires pour chaque fichier
    const pdfFilesWithThumbnails = await Promise.all(
      newPdfFiles.map(async (file, index) => {
        const thumbnail = await generatePdfThumbnail(file);
        return {
          id: `pdf-${Date.now()}-${index}`,
          file,
          name: file.name,
          thumbnail,
          size: file.size
        };
      })
    );
    
    // Ajouter les nouveaux fichiers à la liste existante
    setPdfFiles(prevFiles => [...prevFiles, ...pdfFilesWithThumbnails]);
  };

  // Gérer le glisser-déposer pour réorganiser les PDFs
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(pdfFiles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setPdfFiles(items);
  };

  // Supprimer un fichier de la liste
  const handleRemoveFile = (id) => {
    setPdfFiles(prevFiles => prevFiles.filter(file => file.id !== id));
  };

  // Fusionner les PDFs
  const handleMergePDFs = async () => {
    if (pdfFiles.length < 2) return;
    
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
      
      // Extraire les objets File
      const files = pdfFiles.map(pdfFile => pdfFile.file);
      
      // Fusionner les PDFs
      const mergedPdfBlob = await mergePdfFiles(files);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Déterminer le nom du fichier fusionné
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
      const fileName = `merged_pdf_${timestamp}.pdf`;
      
      // Sauvegarder le fichier
      savePdfFile(mergedPdfBlob, fileName);
      
      // Réinitialiser l'état après 1 seconde
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de la fusion des PDFs:', error);
      setIsProcessing(false);
      setProgress(0);
      // Idéalement, afficher une notification d'erreur ici
    }
  };

  return (
    <div className="pdf-merge-container">
      <h3>Fusion de PDF</h3>
      <p>Fusionnez plusieurs documents PDF en un seul fichier</p>
      
      {/* Zone de glisser-déposer pour sélectionner les PDFs */}
      <DragDropArea 
        onFilesSelected={handleFilesSelected}
        acceptedFileTypes=".pdf,application/pdf"
        multiple={true}
      >
        <p>Glissez-déposez vos fichiers PDF ici</p>
        <p>ou</p>
        <button className="button button-primary">Parcourir les fichiers</button>
      </DragDropArea>
      
      {/* Liste des PDFs avec possibilité de réorganisation */}
      {pdfFiles.length > 0 && (
        <div className="pdf-list-section">
          <div className="pdf-list-header">
            <h4>Fichiers PDF ({pdfFiles.length})</h4>
            <button 
              className="button button-text"
              onClick={() => setPdfFiles([])}
            >
              Tout supprimer
            </button>
          </div>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="pdf-list">
              {(provided) => (
                <div 
                  className="pdf-list-container"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {pdfFiles.map((pdfFile, index) => (
                    <Draggable 
                      key={pdfFile.id} 
                      draggableId={pdfFile.id} 
                      index={index}
                    >
                      {(provided) => (
                        <div
                          className="pdf-list-item"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <div className="pdf-item-index">{index + 1}</div>
                          {pdfFile.thumbnail && (
                            <img 
                              src={pdfFile.thumbnail} 
                              alt={`Aperçu de ${pdfFile.name}`}
                              className="pdf-item-thumbnail"
                            />
                          )}
                          <div className="pdf-item-details">
                            <div className="pdf-item-name">{pdfFile.name}</div>
                            <div className="pdf-item-size">
                              {(pdfFile.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                          <button 
                            className="pdf-item-remove"
                            onClick={() => handleRemoveFile(pdfFile.id)}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
      
      {/* Barre de progression */}
      {isProcessing && (
        <div className="processing-indicator">
          <p>Fusion des PDF en cours...</p>
          <ProgressBar progress={progress} />
        </div>
      )}
      
      {/* Boutons d'action */}
      <div className="action-buttons">
        <button 
          className="button button-primary"
          onClick={handleMergePDFs}
          disabled={pdfFiles.length < 2 || isProcessing}
        >
          Fusionner les PDFs
        </button>
      </div>
    </div>
  );
};

export default PDFMerge;