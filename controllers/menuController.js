// controllers/menuController.js
// Contrôleur pour le calendrier des menus

const MenuCalendrier = require('../models/MenuCalendrier');

/**
 * Récupère les menus d'une période
 */
async function getMenusByPeriod(req, res) {
  try {
    const { dateDebut, dateFin } = req.query;
    if (!dateDebut || !dateFin) {
      return res.status(400).json({ error: 'Dates de début et fin requises' });
    }
    const menus = await MenuCalendrier.getByPeriod(dateDebut, dateFin);
    res.json(menus);
  } catch (err) {
    console.error('Erreur getMenusByPeriod:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Récupère le menu d'une date spécifique
 */
async function getMenuByDate(req, res) {
  try {
    const menu = await MenuCalendrier.getByDate(req.params.date);
    res.json(menu || {});
  } catch (err) {
    console.error('Erreur getMenuByDate:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Récupère les menus de la semaine courante
 */
async function getSemaineCourante(req, res) {
  try {
    const menus = await MenuCalendrier.getSemaineCourante();
    res.json(menus);
  } catch (err) {
    console.error('Erreur getSemaineCourante:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Récupère les menus du mois courant
 */
async function getMoisCourant(req, res) {
  try {
    const menus = await MenuCalendrier.getMoisCourant();
    res.json(menus);
  } catch (err) {
    console.error('Erreur getMoisCourant:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Définit le menu d'une date
 */
async function setMenu(req, res) {
  try {
    const { date, plat_id, nombre_personnes, notes } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'Date requise' });
    }
    await MenuCalendrier.setMenu(date, plat_id, nombre_personnes, notes);
    res.json({ message: 'Menu défini avec succès' });
  } catch (err) {
    console.error('Erreur setMenu:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Valide un menu
 */
async function validerMenu(req, res) {
  try {
    await MenuCalendrier.valider(req.params.date);
    res.json({ message: 'Menu validé avec succès' });
  } catch (err) {
    console.error('Erreur validerMenu:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Supprime un menu
 */
async function deleteMenu(req, res) {
  try {
    await MenuCalendrier.delete(req.params.date);
    res.json({ message: 'Menu supprimé avec succès' });
  } catch (err) {
    console.error('Erreur deleteMenu:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Récupère la liste de courses pour une période
 */
async function getListeCourses(req, res) {
  try {
    const { dateDebut, dateFin } = req.query;
    if (!dateDebut || !dateFin) {
      return res.status(400).json({ error: 'Dates de début et fin requises' });
    }
    const ingredients = await MenuCalendrier.getIngredientsForPeriod(dateDebut, dateFin);
    res.json(ingredients);
  } catch (err) {
    console.error('Erreur getListeCourses:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Suggère un plat pour une date
 */
async function suggererPlat(req, res) {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date requise' });
    }
    const plat = await MenuCalendrier.suggererPlat(date);
    res.json(plat || { message: 'Aucun plat disponible' });
  } catch (err) {
    console.error('Erreur suggererPlat:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  getMenusByPeriod,
  getMenuByDate,
  getSemaineCourante,
  getMoisCourant,
  setMenu,
  validerMenu,
  deleteMenu,
  getListeCourses,
  suggererPlat
};
