// config/config.js
// Configuration générale de l'application

module.exports = {
  // Port du serveur
  port: process.env.PORT || 3002,
  
  // Dossier d'upload
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  
  // Taille maximale des fichiers (16MB)
  maxFileSize: 16 * 1024 * 1024,
  
  // Extensions de fichiers autorisées
  allowedImageExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  allowedVideoExtensions: ['.mp4', '.webm', '.avi', '.mov'],
  
  // Difficultés disponibles
  difficultes: ['Facile', 'Moyen', 'Difficile'],
  
  // Unités de mesure courantes
  unites: ['g', 'kg', 'ml', 'cl', 'l', 'càc', 'càs', 'pièce', 'tranche', 'gousse', 'pincée'],
  
  // Catégories d'ingrédients
  categories: [
    'Viandes',
    'Poissons',
    'Légumes',
    'Fruits',
    'Produits laitiers',
    'Épices',
    'Féculents',
    'Huiles et graisses',
    'Autres'
  ]
};
