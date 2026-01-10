// controllers/mediaController.js
// Contrôleur pour les médias

const Media = require('../models/Media');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config/config');

// Configuration du stockage multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', config.uploadDir);
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour valider le type de fichier
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = [...config.allowedImageExtensions, ...config.allowedVideoExtensions];
  
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxFileSize }
});

/**
 * Récupère tous les médias d'un plat
 */
async function getMediasByPlat(req, res) {
  try {
    const medias = await Media.getByPlat(req.params.platId);
    res.json(medias);
  } catch (err) {
    console.error('Erreur getMediasByPlat:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Upload un nouveau média
 */
async function uploadMedia(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }
    
    const ext = path.extname(req.file.originalname).toLowerCase();
    const type = config.allowedImageExtensions.includes(ext) ? 'image' : 'video';
    
    const mediaData = {
      plat_id: req.body.plat_id,
      type,
      chemin_fichier: config.uploadDir + '/' + req.file.filename,
      nom_original: req.file.originalname,
      description: req.body.description || null,
      taille_fichier: req.file.size
    };
    
    const mediaId = await Media.create(mediaData);
    res.status(201).json({ 
      id: mediaId, 
      message: 'Média uploadé avec succès',
      filename: req.file.filename
    });
  } catch (err) {
    console.error('Erreur uploadMedia:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Met à jour la description d'un média
 */
async function updateMediaDescription(req, res) {
  try {
    const { description } = req.body;
    await Media.updateDescription(req.params.id, description);
    res.json({ message: 'Description mise à jour avec succès' });
  } catch (err) {
    console.error('Erreur updateMediaDescription:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Supprime un média
 */
async function deleteMedia(req, res) {
  try {
    await Media.delete(req.params.id);
    res.json({ message: 'Média supprimé avec succès' });
  } catch (err) {
    console.error('Erreur deleteMedia:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  getMediasByPlat,
  uploadMedia,
  updateMediaDescription,
  deleteMedia,
  upload
};
