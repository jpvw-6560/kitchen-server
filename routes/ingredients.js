// routes/ingredients.js
// Routes pour les ingrédients

const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');

router.get('/', ingredientController.getAllIngredients);
router.get('/search', ingredientController.searchIngredients);
router.get('/categorie/:categorie', ingredientController.getByCategorie);
router.get('/:id', ingredientController.getIngredientById);
router.post('/', ingredientController.createIngredient);
router.put('/:id', ingredientController.updateIngredient);
router.delete('/:id', ingredientController.deleteIngredient);

module.exports = router;
