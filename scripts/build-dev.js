/**
 * Script de build pour le développement et les tests
 * Ce script compile l'application et prépare l'environnement de test
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// Fonction pour exécuter une commande avec affichage coloré
function runCommand(command, name) {
  console.log(`${colors.bright}${colors.blue}[${name}]${colors.reset} Exécution de la commande: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`${colors.bright}${colors.green}[${name}]${colors.reset} Terminé avec succès\n`);
    return true;
  } catch (error) {
    console.error(`${colors.bright}${colors.red}[${name}]${colors.reset} Échec: ${error.message}\n`);
    return false;
  }
}

// Fonction pour créer un dossier s'il n'existe pas
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`${colors.bright}${colors.blue}[Setup]${colors.reset} Création du dossier: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Fonction principale de build
async function buildDev() {
  console.log(`${colors.bright}${colors.yellow}=== Début du build de développement pour MultiTool ===${colors.reset}\n`);
  
  // 1. Vérifier l'environnement
  console.log(`${colors.bright}${colors.blue}[Setup]${colors.reset} Vérification de l'environnement...`);
  
  // Créer les dossiers nécessaires
  ensureDir('./build');
  ensureDir('./downloads');
  ensureDir('./downloads/pdf');
  ensureDir('./downloads/images');
  ensureDir('./downloads/videos');
  ensureDir('./downloads/youtube');
  ensureDir('./downloads/twitter');
  
  // 2. Nettoyer les anciens builds
  if (runCommand('rm -rf ./build/*', 'Clean')) {
    console.log(`${colors.bright}${colors.green}[Clean]${colors.reset} Nettoyage des anciens builds terminé`);
  } else {
    console.error(`${colors.bright}${colors.red}[Clean]${colors.reset} Échec du nettoyage`);
    return;
  }
  
  // 3. Installer les dépendances si node_modules n'existe pas
  if (!fs.existsSync('./node_modules')) {
    console.log(`${colors.bright}${colors.yellow}[Dependencies]${colors.reset} node_modules non trouvé, installation des dépendances...`);
    if (!runCommand('npm install', 'Dependencies')) {
      console.error(`${colors.bright}${colors.red}[Dependencies]${colors.reset} Échec de l'installation des dépendances`);
      return;
    }
  }
  
  // 4. Installer les dépendances natives
  console.log(`${colors.bright}${colors.blue}[NativeDeps]${colors.reset} Installation des dépendances natives...`);
  runCommand('node ./scripts/install-dependencies.js', 'NativeDeps');
  
  // 5. Compiler l'application
  console.log(`${colors.bright}${colors.blue}[Build]${colors.reset} Compilation de l'application...`);
  if (!runCommand('npx webpack --mode development', 'Build')) {
    console.error(`${colors.bright}${colors.red}[Build]${colors.reset} Échec de la compilation`);
    return;
  }
  
  // 6. Préparer les ressources pour les tests
  console.log(`${colors.bright}${colors.blue}[Resources]${colors.reset} Préparation des ressources pour les tests...`);
  
  // Copier le manuel utilisateur dans le dossier de build
  if (!fs.existsSync('./build/docs')) {
    fs.mkdirSync('./build/docs', { recursive: true });
  }
  fs.copyFileSync(
    './resources/docs/manuel-utilisateur.md', 
    './build/docs/manuel-utilisateur.md'
  );
  
  console.log(`${colors.bright}${colors.green}[Success]${colors.reset} Build de développement terminé!`);
  console.log(`${colors.bright}${colors.yellow}=== Vous pouvez maintenant lancer l'application avec 'npm run dev' ===${colors.reset}\n`);
}

// Exécuter la fonction principale
buildDev().catch(err => {
  console.error(`${colors.bright}${colors.red}[Error]${colors.reset} Une erreur est survenue:`, err);
  process.exit(1);
});