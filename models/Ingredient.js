// models/Ingredient.js
// Modèle pour les ingrédients

const { pool } = require('../config/database');

class Ingredient {
  /**
   * Récupère tous les ingrédients
   */
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT * FROM ingredients
      ORDER BY categorie, nom
    `);
    return rows;
  }
  
  /**
   * Récupère un ingrédient par ID
   */
  static async getById(id) {
    const [rows] = await pool.query('SELECT * FROM ingredients WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }
  
  /**
   * Recherche d'ingrédients
   */
  static async search(query) {
    const searchTerm = `%${query}%`;
    const [rows] = await pool.query(
      'SELECT * FROM ingredients WHERE LOWER(nom) LIKE LOWER(?) ORDER BY nom',
      [searchTerm]
    );
    return rows;
  }
  
  /**
   * Récupère les ingrédients par catégorie
   */
  static async getByCategorie(categorie) {
    const [rows] = await pool.query(
      'SELECT * FROM ingredients WHERE categorie = ? ORDER BY nom',
      [categorie]
    );
    return rows;
  }
  
  /**
   * Crée un nouvel ingrédient
   */
  static async create(ingredientData) {
    const { nom, unite, categorie } = ingredientData;
    // Forcer le nom en minuscules et normaliser les caractères spéciaux
    const nomLowercase = nom.toLowerCase()
      .replace(/œ/g, 'oe')
      .replace(/æ/g, 'ae')
      .trim()
      .replace(/\s+/g, ' ');
    const [result] = await pool.query(
      'INSERT INTO ingredients (nom, unite, categorie) VALUES (?, ?, ?)',
      [nomLowercase, unite, categorie]
    );
    return result.insertId;
  }
  
  /**
   * Met à jour un ingrédient
   */
  static async update(id, ingredientData) {
    const { nom, unite, categorie } = ingredientData;
    // Forcer le nom en minuscules et normaliser les caractères spéciaux
    const nomLowercase = nom.toLowerCase()
      .replace(/œ/g, 'oe')
      .replace(/æ/g, 'ae')
      .trim()
      .replace(/\s+/g, ' ');
    await pool.query(
      'UPDATE ingredients SET nom = ?, unite = ?, categorie = ? WHERE id = ?',
      [nomLowercase, unite, categorie, id]
    );
    return true;
  }
  
  /**
   * Supprime un ingrédient
   */
  static async delete(id) {
    await pool.query('DELETE FROM ingredients WHERE id = ?', [id]);
    return true;
  }
  
  /**
   * Vérifie si un ingrédient existe par nom
   */
  static async existsByName(nom) {
    const [rows] = await pool.query('SELECT id FROM ingredients WHERE LOWER(nom) = LOWER(?)', [nom]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Récupère toutes les catégories distinctes
   */
  static async getCategories() {
    const [rows] = await pool.query(`
      SELECT DISTINCT categorie 
      FROM ingredients 
      WHERE categorie IS NOT NULL AND categorie != ''
      ORDER BY categorie
    `);
    return rows.map(row => row.categorie);
  }

  /**
   * Renomme une catégorie
   */
  static async renameCategorie(oldName, newName) {
    await pool.query(
      'UPDATE ingredients SET categorie = ? WHERE categorie = ?',
      [newName, oldName]
    );
    return true;
  }

  /**
   * Supprime une catégorie (met à null)
   */
  static async deleteCategorie(categorie) {
    // Vérifier si la catégorie est utilisée
    const [count] = await pool.query(
      'SELECT COUNT(*) as count FROM ingredients WHERE categorie = ?',
      [categorie]
    );
    
    if (count[0].count > 0) {
      throw new Error('Cette catégorie contient des ingrédients et ne peut pas être supprimée');
    }
    
    return true;
  }

  /**
   * Compte les ingrédients par catégorie
   */
  static async countByCategorie(categorie) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM ingredients WHERE categorie = ?',
      [categorie]
    );
    return rows[0].count;
  }
}

module.exports = Ingredient;
