// routes/medias.js
// Routes pour les médias

const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');

router.get('/plat/:platId', mediaController.getMediasByPlat);
router.post('/', mediaController.upload.single('file'), mediaController.uploadMedia);
router.patch('/:id', mediaController.updateMediaDescription);
router.delete('/:id', mediaController.deleteMedia);

module.exports = router;
