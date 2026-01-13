// models/Categorie.js
// Modèle pour les catégories d'ingrédients

const { pool } = require('../config/database');

class Categorie {
  /**
   * Récupère toutes les catégories
   */
  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY nom');
    return rows;
  }

  /**
   * Récupère une catégorie par ID
   */
  static async getById(id) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Récupère une catégorie par nom
   */
  static async getByName(nom) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE nom = ?', [nom]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Crée une nouvelle catégorie
   */
  static async create(nom) {
    const [result] = await pool.query(
      'INSERT INTO categories (nom) VALUES (?)',
      [nom]
    );
    return result.insertId;
  }

  /**
   * Met à jour une catégorie
   */
  static async update(id, nom) {
    // Mettre à jour la catégorie
    await pool.query('UPDATE categories SET nom = ? WHERE id = ?', [nom, id]);
    
    // Récupérer l'ancien nom
    const oldCategory = await this.getById(id);
    
    return true;
  }

  /**
   * Renomme une catégorie et met à jour tous les ingrédients
   */
  static async rename(oldName, newName) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Mettre à jour la table categories
      await connection.query('UPDATE categories SET nom = ? WHERE nom = ?', [newName, oldName]);
      
      // Mettre à jour tous les ingrédients qui utilisent cette catégorie
      await connection.query('UPDATE ingredients SET categorie = ? WHERE categorie = ?', [newName, oldName]);
      
      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Supprime une catégorie
   */
  static async delete(id) {
    // Vérifier si des ingrédients utilisent cette catégorie
    const category = await this.getById(id);
    if (!category) {
      throw new Error('Catégorie non trouvée');
    }
    
    const [count] = await pool.query(
      'SELECT COUNT(*) as count FROM ingredients WHERE categorie = ?',
      [category.nom]
    );
    
    if (count[0].count > 0) {
      throw new Error(`Cette catégorie contient ${count[0].count} ingrédient(s) et ne peut pas être supprimée`);
    }
    
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  }

  /**
   * Supprime une catégorie par nom
   */
  static async deleteByName(nom) {
    // Vérifier si des ingrédients utilisent cette catégorie
    const [count] = await pool.query(
      'SELECT COUNT(*) as count FROM ingredients WHERE categorie = ?',
      [nom]
    );
    
    if (count[0].count > 0) {
      throw new Error(`Cette catégorie contient ${count[0].count} ingrédient(s) et ne peut pas être supprimée`);
    }
    
    await pool.query('DELETE FROM categories WHERE nom = ?', [nom]);
    return true;
  }

  /**
   * Compte les ingrédients par catégorie
   */
  static async countIngredients(nom) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM ingredients WHERE categorie = ?',
      [nom]
    );
    return rows[0].count;
  }
}

module.exports = Categorie;
