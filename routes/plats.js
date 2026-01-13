// routes/plats.js
// Routes pour les plats

const express = require('express');
const router = express.Router();
const platController = require('../controllers/platController');

// Routes CRUD de base
router.get('/', platController.getAllPlats);
router.get('/search', platController.searchPlats);
router.get('/favoris', platController.getFavoris);
router.get('/:id', platController.getPlatById);
router.post('/', platController.createPlat);
router.put('/:id', platController.updatePlat);
router.patch('/:id/favori', platController.toggleFavori);
router.delete('/:id', platController.deletePlat);

// Route de duplication
router.post('/:id/duplicate', platController.duplicatePlat);

// Routes pour les ingrédients d'un plat
router.post('/:id/ingredients', platController.addIngredient);
router.delete('/:id/ingredients/:ingredientId', platController.removeIngredient);
router.delete('/:id/ingredients', platController.clearIngredients);

// Routes pour les étapes de préparation
router.post('/:id/preparations', platController.addPreparation);
router.delete('/:id/preparations/:preparationId', platController.removePreparation);
router.delete('/:id/preparations', platController.clearPreparations);

module.exports = router;
