import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';

// Configurer le worker pour PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Génère une miniature à partir d'un fichier PDF
 * @param {File} file - Fichier PDF
 * @param {number} pageNumber - Numéro de page à afficher (commence à 1)
 * @param {number} scale - Échelle de la miniature
 * @returns {Promise<string>} - URL de données de l'image
 */
export const generatePdfThumbnail = async (file, pageNumber = 1, scale = 0.5) => {
  try {
    // Lire le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Charger le document PDF
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;
    
    // Obtenir la page demandée
    const page = await pdf.getPage(pageNumber);
    
    // Définir l'échelle et créer un canvas pour le rendu
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Rendre la page sur le canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // Convertir le canvas en URL de données
    return canvas.toDataURL();
  } catch (error) {
    console.error('Erreur lors de la génération de la miniature PDF:', error);
    return null;
  }
};

/**
 * Obtient le nombre de pages d'un fichier PDF
 * @param {File} file - Fichier PDF
 * @returns {Promise<number>} - Nombre de pages
 */
export const getPdfPageCount = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;
    return pdf.numPages;
  } catch (error) {
    console.error('Erreur lors de l\'obtention du nombre de pages:', error);
    return 0;
  }
};

/**
 * Fusionne plusieurs fichiers PDF en un seul
 * @param {File[]} pdfFiles - Liste des fichiers PDF à fusionner
 * @returns {Promise<Blob>} - Blob du fichier PDF fusionné
 */
export const mergePdfFiles = async (pdfFiles) => {
  try {
    // Créer un nouveau document PDF
    const mergedPdf = await PDFDocument.create();
    
    // Pour chaque fichier, l'ajouter au document fusionné
    for (const file of pdfFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }
    
    // Générer le PDF final en tant que Blob
    const mergedPdfBytes = await mergedPdf.save();
    return new Blob([mergedPdfBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error('Erreur lors de la fusion des PDFs:', error);
    throw error;
  }
};

/**
 * Supprime des pages spécifiques d'un fichier PDF
 * @param {File} pdfFile - Fichier PDF original
 * @param {number[]} pagesToRemove - Indices des pages à supprimer (commençant à 0)
 * @returns {Promise<Blob>} - Blob du fichier PDF modifié
 */
export const removePages = async (pdfFile, pagesToRemove) => {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    
    // Obtenir tous les indices de page
    const pageIndices = pdf.getPageIndices();
    
    // Filtrer les indices pour ne conserver que les pages à garder
    const pagesToKeep = pageIndices.filter(index => !pagesToRemove.includes(index));
    
    // Créer un nouveau document avec seulement les pages à conserver
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(pdf, pagesToKeep);
    pages.forEach(page => newPdf.addPage(page));
    
    // Générer le PDF final en tant que Blob
    const newPdfBytes = await newPdf.save();
    return new Blob([newPdfBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error('Erreur lors de la suppression des pages:', error);
    throw error;
  }
};

/**
 * Sauvegarde un blob PDF en tant que fichier
 * @param {Blob} pdfBlob - Blob du fichier PDF
 * @param {string} fileName - Nom suggéré pour le fichier
 */
export const savePdfFile = (pdfBlob, fileName) => {
  saveAs(pdfBlob, fileName);
};