// models/Plat.js
// Modèle pour les plats/recettes

const { pool } = require('../config/database');

class Plat {
  /**
   * Récupère tous les plats
   */
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT p.*, 
             COUNT(DISTINCT pi.id) as nb_ingredients,
             m.chemin_fichier as photo_principale,
             GROUP_CONCAT(DISTINCT i.nom ORDER BY i.nom SEPARATOR ', ') as ingredients_list
      FROM plats p
      LEFT JOIN plat_ingredients pi ON p.id = pi.plat_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      LEFT JOIN medias m ON p.id = m.plat_id AND m.principale = TRUE AND m.type = 'image'
      GROUP BY p.id, m.chemin_fichier
      ORDER BY p.created_at DESC
    `);
    return rows;
  }
  
  /**
   * Récupère un plat par ID avec tous ses détails
   */
  static async getById(id) {
    const [rows] = await pool.query('SELECT * FROM plats WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    
    const plat = rows[0];
    
    // Récupérer les ingrédients
    plat.ingredients = await this.getIngredients(id);
    
    // Récupérer les étapes
    plat.preparations = await this.getPreparations(id);
    
    // Récupérer les médias
    plat.medias = await this.getMedias(id);
    
    return plat;
  }
  
  /**
   * Récupère les ingrédients d'un plat
   */
  static async getIngredients(platId) {
    const [rows] = await pool.query(`
      SELECT i.id, i.nom, i.unite as unite_base, i.categorie,
             pi.quantite, pi.unite
      FROM plat_ingredients pi
      JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE pi.plat_id = ?
      ORDER BY i.categorie, i.nom
    `, [platId]);
    return rows;
  }
  
  /**
   * Récupère les étapes de préparation d'un plat
   */
  static async getPreparations(platId) {
    const [rows] = await pool.query(`
      SELECT * FROM preparations
      WHERE plat_id = ?
      ORDER BY ordre
    `, [platId]);
    return rows;
  }
  
  /**
   * Récupère les médias d'un plat
   */
  static async getMedias(platId) {
    const [rows] = await pool.query(`
      SELECT * FROM medias
      WHERE plat_id = ?
      ORDER BY created_at DESC
    `, [platId]);
    return rows;
  }
  
  /**
   * Recherche de plats
   */
  static async search(query) {
    const searchTerm = `%${query}%`;
    const [rows] = await pool.query(`
      SELECT p.*, COUNT(DISTINCT pi.id) as nb_ingredients
      FROM plats p
      LEFT JOIN plat_ingredients pi ON p.id = pi.plat_id
      WHERE LOWER(p.nom) LIKE LOWER(?) 
         OR LOWER(p.description) LIKE LOWER(?)
      GROUP BY p.id
      ORDER BY p.nom
    `, [searchTerm, searchTerm]);
    return rows;
  }
  
  /**
   * Récupère les plats favoris
   */
  static async getFavoris() {
    const [rows] = await pool.query(`
      SELECT p.*, COUNT(DISTINCT pi.id) as nb_ingredients
      FROM plats p
      LEFT JOIN plat_ingredients pi ON p.id = pi.plat_id
      WHERE p.favori = TRUE
      GROUP BY p.id
      ORDER BY p.nom
    `);
    return rows;
  }
  
  /**
   * Crée un nouveau plat
   */
  static async create(platData) {
    const { nom, description, type, temps_preparation, difficulte, conseils_chef, nombre_personnes } = platData;
    const [result] = await pool.query(
      'INSERT INTO plats (nom, description, type, temps_preparation, difficulte, conseils_chef, nombre_personnes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nom, description, type || 'Plat', temps_preparation, difficulte, conseils_chef, nombre_personnes]
    );
    return result.insertId;
  }
  
  /**
   * Met à jour un plat
   */
  static async update(id, platData) {
    const { nom, description, type, temps_preparation, difficulte, conseils_chef, nombre_personnes, favori } = platData;
    await pool.query(
      'UPDATE plats SET nom = ?, description = ?, type = ?, temps_preparation = ?, difficulte = ?, conseils_chef = ?, nombre_personnes = ?, favori = ? WHERE id = ?',
      [nom, description, type || 'Plat', temps_preparation, difficulte, conseils_chef, nombre_personnes, favori, id]
    );
    return true;
  }
  
  /**
   * Bascule le statut favori
   */
  static async toggleFavori(id) {
    await pool.query('UPDATE plats SET favori = NOT favori WHERE id = ?', [id]);
    return true;
  }
  
  /**
   * Supprime un plat (cascade sur ingredients, preparations, medias)
   */
  static async delete(id) {
    await pool.query('DELETE FROM plats WHERE id = ?', [id]);
    return true;
  }
  
  /**
   * Ajoute un ingrédient à un plat
   */
  static async addIngredient(platId, ingredientId, quantite, unite) {
    await pool.query(
      'INSERT INTO plat_ingredients (plat_id, ingredient_id, quantite, unite) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantite = ?, unite = ?',
      [platId, ingredientId, quantite, unite, quantite, unite]
    );
    return true;
  }
  
  /**
   * Supprime un ingrédient d'un plat
   */
  static async removeIngredient(platId, ingredientId) {
    await pool.query('DELETE FROM plat_ingredients WHERE plat_id = ? AND ingredient_id = ?', [platId, ingredientId]);
    return true;
  }
  
  /**
   * Supprime tous les ingrédients d'un plat
   */
  static async clearIngredients(platId) {
    await pool.query('DELETE FROM plat_ingredients WHERE plat_id = ?', [platId]);
    return true;
  }
  
  /**
   * Ajoute une étape de préparation
   */
  static async addPreparation(platId, ordre, description, duree_minutes) {
    const [result] = await pool.query(
      'INSERT INTO preparations (plat_id, ordre, description, duree_minutes) VALUES (?, ?, ?, ?)',
      [platId, ordre, description, duree_minutes]
    );
    return result.insertId;
  }
  
  /**
   * Supprime une étape de préparation
   */
  static async removePreparation(preparationId) {
    await pool.query('DELETE FROM preparations WHERE id = ?', [preparationId]);
    return true;
  }
  
  /**
   * Supprime toutes les préparations d'un plat
   */
  static async clearPreparations(platId) {
    await pool.query('DELETE FROM preparations WHERE plat_id = ?', [platId]);
    return true;
  }
  
  /**
   * Duplique un plat avec tous ses ingrédients et préparations
   */
  static async duplicate(platId, newName) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Récupérer le plat original
      const [originalPlat] = await connection.query('SELECT * FROM plats WHERE id = ?', [platId]);
      if (originalPlat.length === 0) {
        throw new Error('Plat non trouvé');
      }
      
      const plat = originalPlat[0];
      
      // Créer le nouveau plat (copie)
      const [result] = await connection.query(`
        INSERT INTO plats (nom, description, type, temps_preparation, difficulte, conseils_chef, nombre_personnes, favori)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        newName,
        plat.description,
        plat.type,
        plat.temps_preparation,
        plat.difficulte,
        plat.conseils_chef,
        plat.nombre_personnes,
        false // Ne pas copier le statut favori
      ]);
      
      const newPlatId = result.insertId;
      
      // Copier les ingrédients
      await connection.query(`
        INSERT INTO plat_ingredients (plat_id, ingredient_id, quantite, unite)
        SELECT ?, ingredient_id, quantite, unite
        FROM plat_ingredients
        WHERE plat_id = ?
      `, [newPlatId, platId]);
      
      // Copier les préparations
      await connection.query(`
        INSERT INTO preparations (plat_id, ordre, description, duree_minutes)
        SELECT ?, ordre, description, duree_minutes
        FROM preparations
        WHERE plat_id = ?
      `, [newPlatId, platId]);
      
      await connection.commit();
      return newPlatId;
      
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = Plat;
