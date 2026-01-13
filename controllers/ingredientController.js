// controllers/ingredientController.js
// Contrôleur pour les ingrédients

const Ingredient = require('../models/Ingredient');
const Categorie = require('../models/Categorie');

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

/**
 * Récupère toutes les catégories
 */
async function getCategories(req, res) {
  try {
    const categories = await Categorie.getAll();
    res.json(categories.map(c => c.nom));
  } catch (err) {
    console.error('Erreur getCategories:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Crée une nouvelle catégorie
 */
async function createCategorie(req, res) {
  try {
    const { nom } = req.body;
    if (!nom || nom.trim() === '') {
      return res.status(400).json({ error: 'Le nom de la catégorie est requis' });
    }
    
    // Vérifier si la catégorie existe déjà
    const existing = await Categorie.getByName(nom.trim());
    if (existing) {
      return res.status(409).json({ error: 'Cette catégorie existe déjà' });
    }
    
    const id = await Categorie.create(nom.trim());
    res.status(201).json({ id, message: 'Catégorie créée avec succès' });
  } catch (err) {
    console.error('Erreur createCategorie:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Renomme une catégorie
 */
async function renameCategorie(req, res) {
  try {
    const { newName } = req.body;
    if (!newName) {
      return res.status(400).json({ error: 'Le nouveau nom est requis' });
    }
    await Categorie.rename(req.params.oldName, newName);
    res.json({ message: 'Catégorie renommée avec succès' });
  } catch (err) {
    console.error('Erreur renameCategorie:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Supprime une catégorie
 */
async function deleteCategorie(req, res) {
  try {
    await Categorie.deleteByName(req.params.name);
    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (err) {
    console.error('Erreur deleteCategorie:', err);
    res.status(400).json({ error: err.message || 'Erreur serveur' });
  }
}

module.exports = {
  getAllIngredients,
  getIngredientById,
  searchIngredients,
  getByCategorie,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  getCategories,
  createCategorie,
  renameCategorie,
  deleteCategorie
};
