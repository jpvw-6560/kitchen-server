// controllers/ingredientController.js
// Contrôleur pour les ingrédients

const Ingredient = require('../models/Ingredient');

/**
 * Récupère tous les ingrédients
 */
async function getAllIngredients(req, res) {
  try {
    const ingredients = await Ingredient.getAll();
    res.json(ingredients);
  } catch (err) {
    console.error('Erreur getAllIngredients:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Récupère un ingrédient par ID
 */
async function getIngredientById(req, res) {
  try {
    const ingredient = await Ingredient.getById(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ error: 'Ingrédient non trouvé' });
    }
    res.json(ingredient);
  } catch (err) {
    console.error('Erreur getIngredientById:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Recherche d'ingrédients
 */
async function searchIngredients(req, res) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }
    const ingredients = await Ingredient.search(q);
    res.json(ingredients);
  } catch (err) {
    console.error('Erreur searchIngredients:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Récupère les ingrédients par catégorie
 */
async function getByCategorie(req, res) {
  try {
    const ingredients = await Ingredient.getByCategorie(req.params.categorie);
    res.json(ingredients);
  } catch (err) {
    console.error('Erreur getByCategorie:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Crée un nouvel ingrédient
 */
async function createIngredient(req, res) {
  try {
    // Vérifier si l'ingrédient existe déjà
    const existing = await Ingredient.existsByName(req.body.nom);
    if (existing) {
      return res.status(409).json({ 
        error: 'Un ingrédient avec ce nom existe déjà',
        existingId: existing.id
      });
    }
    
    const ingredientId = await Ingredient.create(req.body);
    res.status(201).json({ id: ingredientId, message: 'Ingrédient créé avec succès' });
  } catch (err) {
    console.error('Erreur createIngredient:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Met à jour un ingrédient
 */
async function updateIngredient(req, res) {
  try {
    await Ingredient.update(req.params.id, req.body);
    res.json({ message: 'Ingrédient mis à jour avec succès' });
  } catch (err) {
    console.error('Erreur updateIngredient:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Supprime un ingrédient
 */
async function deleteIngredient(req, res) {
  try {
    await Ingredient.delete(req.params.id);
    res.json({ message: 'Ingrédient supprimé avec succès' });
  } catch (err) {
    console.error('Erreur deleteIngredient:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  getAllIngredients,
  getIngredientById,
  searchIngredients,
  getByCategorie,
  createIngredient,
  updateIngredient,
  deleteIngredient
};
