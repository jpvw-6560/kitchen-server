// models/MenuCalendrier.js
// Modèle pour le calendrier des menus

const { pool } = require('../config/database');

class MenuCalendrier {
  /**
   * Récupère les menus d'une période donnée
   */
  static async getByPeriod(dateDebut, dateFin) {
    const [rows] = await pool.query(`
      SELECT mc.*, p.nom as plat_nom, p.description as plat_description,
             p.temps_preparation, p.difficulte
      FROM menu_calendrier mc
      LEFT JOIN plats p ON mc.plat_id = p.id
      WHERE mc.date BETWEEN ? AND ?
      ORDER BY mc.date
    `, [dateDebut, dateFin]);
    return rows;
  }
  
  /**
   * Récupère le menu d'une date spécifique
   */
  static async getByDate(date) {
    const [rows] = await pool.query(`
      SELECT mc.*, p.nom as plat_nom, p.description as plat_description,
             p.temps_preparation, p.difficulte, p.nombre_personnes as plat_personnes
      FROM menu_calendrier mc
      LEFT JOIN plats p ON mc.plat_id = p.id
      WHERE mc.date = ?
    `, [date]);
    return rows.length > 0 ? rows[0] : null;
  }
  
  /**
   * Récupère les menus de la semaine courante
   */
  static async getSemaineCourante() {
    const [rows] = await pool.query(`
      SELECT mc.*, p.nom as plat_nom, p.description as plat_description,
             p.temps_preparation, p.difficulte
      FROM menu_calendrier mc
      LEFT JOIN plats p ON mc.plat_id = p.id
      WHERE YEARWEEK(mc.date) = YEARWEEK(CURDATE())
      ORDER BY mc.date
    `);
    return rows;
  }
  
  /**
   * Récupère les menus du mois courant
   */
  static async getMoisCourant() {
    const [rows] = await pool.query(`
      SELECT mc.*, p.nom as plat_nom, p.description as plat_description,
             p.temps_preparation, p.difficulte
      FROM menu_calendrier mc
      LEFT JOIN plats p ON mc.plat_id = p.id
      WHERE YEAR(mc.date) = YEAR(CURDATE()) AND MONTH(mc.date) = MONTH(CURDATE())
      ORDER BY mc.date
    `);
    return rows;
  }
  
  /**
   * Crée ou met à jour un menu pour une date
   */
  static async setMenu(date, platId, nombrePersonnes, notes) {
    const [result] = await pool.query(`
      INSERT INTO menu_calendrier (date, plat_id, nombre_personnes, notes)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        plat_id = VALUES(plat_id),
        nombre_personnes = VALUES(nombre_personnes),
        notes = VALUES(notes)
    `, [date, platId, nombrePersonnes, notes]);
    return result.insertId || result.affectedRows;
  }
  
  /**
   * Valide un menu
   */
  static async valider(date) {
    await pool.query('UPDATE menu_calendrier SET valide = TRUE WHERE date = ?', [date]);
    return true;
  }
  
  /**
   * Supprime un menu d'une date
   */
  static async delete(date) {
    await pool.query('DELETE FROM menu_calendrier WHERE date = ?', [date]);
    return true;
  }
  
  /**
   * Récupère tous les ingrédients nécessaires pour une période
   */
  static async getIngredientsForPeriod(dateDebut, dateFin) {
    const [rows] = await pool.query(`
      SELECT i.nom, i.unite, i.categorie,
             SUM(pi.quantite * mc.nombre_personnes / p.nombre_personnes) as quantite_totale,
             pi.unite as unite_recette,
             GROUP_CONCAT(DISTINCT DATE_FORMAT(mc.date, '%d/%m') ORDER BY mc.date) as dates
      FROM menu_calendrier mc
      JOIN plats p ON mc.plat_id = p.id
      JOIN plat_ingredients pi ON p.id = pi.plat_id
      JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE mc.date BETWEEN ? AND ?
      GROUP BY i.id, pi.unite
      ORDER BY i.categorie, i.nom
    `, [dateDebut, dateFin]);
    return rows;
  }
  
  /**
   * Suggère un plat aléatoire pour une date
   */
  static async suggererPlat(date) {
    // Éviter les plats déjà planifiés dans la semaine
    const [rows] = await pool.query(`
      SELECT p.* FROM plats p
      WHERE p.id NOT IN (
        SELECT plat_id FROM menu_calendrier
        WHERE YEARWEEK(date) = YEARWEEK(?)
        AND plat_id IS NOT NULL
      )
      ORDER BY RAND()
      LIMIT 1
    `, [date]);
    return rows.length > 0 ? rows[0] : null;
  }
}

module.exports = MenuCalendrier;
