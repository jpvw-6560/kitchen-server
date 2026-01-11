// routes/medias.js
// Routes pour les médias

const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');

router.get('/plat/:platId', mediaController.getMediasByPlat);
router.post('/upload', mediaController.upload.single('media'), mediaController.uploadMedia);
router.patch('/:id', mediaController.updateMediaDescription);
router.patch('/:id/principale', mediaController.setPrincipale);
router.delete('/:id', mediaController.deleteMedia);

module.exports = router;
