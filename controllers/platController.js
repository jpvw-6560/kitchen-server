// controllers/platController.js
// Contrôleur pour les plats

const Plat = require('../models/Plat');

/**
 * Récupère tous les plats
 */
async function getAllPlats(req, res) {
  try {
    const plats = await Plat.getAll();
    res.json(plats);
  } catch (err) {
    console.error('Erreur getAllPlats:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Récupère un plat par ID avec détails complets
 */
async function getPlatById(req, res) {
  try {
    const plat = await Plat.getById(req.params.id);
    if (!plat) {
      return res.status(404).json({ error: 'Plat non trouvé' });
    }
    res.json(plat);
  } catch (err) {
    console.error('Erreur getPlatById:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Recherche de plats
 */
async function searchPlats(req, res) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }
    const plats = await Plat.search(q);
    res.json(plats);
  } catch (err) {
    console.error('Erreur searchPlats:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Récupère les plats favoris
 */
async function getFavoris(req, res) {
  try {
    const plats = await Plat.getFavoris();
    res.json(plats);
  } catch (err) {
    console.error('Erreur getFavoris:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Crée un nouveau plat
 */
async function createPlat(req, res) {
  try {
    const platId = await Plat.create(req.body);
    res.status(201).json({ id: platId, message: 'Plat créé avec succès' });
  } catch (err) {
    console.error('Erreur createPlat:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Met à jour un plat
 */
async function updatePlat(req, res) {
  try {
    await Plat.update(req.params.id, req.body);
    res.json({ message: 'Plat mis à jour avec succès' });
  } catch (err) {
    console.error('Erreur updatePlat:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Bascule le statut favori d'un plat
 */
async function toggleFavori(req, res) {
  try {
    await Plat.toggleFavori(req.params.id);
    res.json({ message: 'Statut favori mis à jour' });
  } catch (err) {
    console.error('Erreur toggleFavori:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Supprime un plat
 */
async function deletePlat(req, res) {
  try {
    await Plat.delete(req.params.id);
    res.json({ message: 'Plat supprimé avec succès' });
  } catch (err) {
    console.error('Erreur deletePlat:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Ajoute un ingrédient à un plat
 */
async function addIngredient(req, res) {
  try {
    const { ingredient_id, quantite, unite } = req.body;
    await Plat.addIngredient(req.params.id, ingredient_id, quantite, unite);
    res.json({ message: 'Ingrédient ajouté avec succès' });
  } catch (err) {
    console.error('Erreur addIngredient:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Supprime un ingrédient d'un plat
 */
async function removeIngredient(req, res) {
  try {
    await Plat.removeIngredient(req.params.id, req.params.ingredientId);
    res.json({ message: 'Ingrédient supprimé avec succès' });
  } catch (err) {
    console.error('Erreur removeIngredient:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Ajoute une étape de préparation
 */
async function addPreparation(req, res) {
  try {
    const { ordre, description, duree_minutes } = req.body;
    const prepId = await Plat.addPreparation(req.params.id, ordre, description, duree_minutes);
    res.status(201).json({ id: prepId, message: 'Étape ajoutée avec succès' });
  } catch (err) {
    console.error('Erreur addPreparation:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Supprime une étape de préparation
 */
async function removePreparation(req, res) {
  try {
    await Plat.removePreparation(req.params.preparationId);
    res.json({ message: 'Étape supprimée avec succès' });
  } catch (err) {
    console.error('Erreur removePreparation:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Supprime tous les ingrédients d'un plat
 */
async function clearIngredients(req, res) {
  try {
    await Plat.clearIngredients(req.params.id);
    res.json({ message: 'Ingrédients supprimés avec succès' });
  } catch (err) {
    console.error('Erreur clearIngredients:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Supprime toutes les préparations d'un plat
 */
async function clearPreparations(req, res) {
  try {
    await Plat.clearPreparations(req.params.id);
    res.json({ message: 'Préparations supprimées avec succès' });
  } catch (err) {
    console.error('Erreur clearPreparations:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Duplique un plat
 */
async function duplicatePlat(req, res) {
  try {
    const { nom } = req.body;
    if (!nom) {
      return res.status(400).json({ error: 'Le nouveau nom est requis' });
    }
    
    const newPlatId = await Plat.duplicate(req.params.id, nom);
    res.status(201).json({ 
      id: newPlatId, 
      message: 'Plat dupliqué avec succès' 
    });
  } catch (err) {
    console.error('Erreur duplicatePlat:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  getAllPlats,
  getPlatById,
  searchPlats,
  getFavoris,
  createPlat,
  updatePlat,
  toggleFavori,
  deletePlat,
  addIngredient,
  removeIngredient,
  clearIngredients,
  addPreparation,
  removePreparation,
  clearPreparations,
  duplicatePlat
};
