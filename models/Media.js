// models/Media.js
// Modèle pour les médias (images/vidéos)

const { pool } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class Media {
  /**
   * Récupère tous les médias d'un plat
   */
  static async getByPlat(platId) {
    const [rows] = await pool.query(
      'SELECT * FROM medias WHERE plat_id = ? ORDER BY created_at DESC',
      [platId]
    );
    return rows;
  }
  
  /**
   * Récupère un média par ID
   */
  static async getById(id) {
    const [rows] = await pool.query('SELECT * FROM medias WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }
  
  /**
   * Crée un nouveau média
   */
  static async create(mediaData) {
    const { plat_id, type, chemin_fichier, nom_original, description, taille_fichier } = mediaData;
    const [result] = await pool.query(
      'INSERT INTO medias (plat_id, type, chemin_fichier, nom_original, description, taille_fichier) VALUES (?, ?, ?, ?, ?, ?)',
      [plat_id, type, chemin_fichier, nom_original, description, taille_fichier]
    );
    return result.insertId;
  }
  
  /**
   * Met à jour la description d'un média
   */
  static async updateDescription(id, description) {
    await pool.query('UPDATE medias SET description = ? WHERE id = ?', [description, id]);
    return true;
  }
  
  /**
   * Supprime un média et son fichier
   */
  static async delete(id) {
    // Récupérer le chemin du fichier avant suppression
    const media = await this.getById(id);
    if (media) {
      try {
        // Supprimer le fichier physique
        const filePath = path.join(__dirname, '..', media.chemin_fichier);
        await fs.unlink(filePath);
      } catch (err) {
        console.error('Erreur suppression fichier:', err);
      }
    }
    
    // Supprimer l'entrée en base
    await pool.query('DELETE FROM medias WHERE id = ?', [id]);
    return true;
  }
  
  /**
   * Récupère le nombre de médias par plat
   */
  static async countByPlat(platId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM medias WHERE plat_id = ?',
      [platId]
    );
    return rows[0].count;
  }
  
  /**
   * Définit un média comme photo principale
   * (déselectionne les autres photos du même plat)
   */
  static async setPrincipale(id) {
    // Récupérer le plat_id du média
    const media = await this.getById(id);
    if (!media) return false;
    
    // Désélectionner toutes les photos principales du plat
    await pool.query(
      'UPDATE medias SET principale = FALSE WHERE plat_id = ?',
      [media.plat_id]
    );
    
    // Sélectionner cette photo comme principale
    await pool.query(
      'UPDATE medias SET principale = TRUE WHERE id = ?',
      [id]
    );
    
    return true;
  }
  
  /**
   * Récupère la photo principale d'un plat
   */
  static async getPrincipaleByPlat(platId) {
    const [rows] = await pool.query(
      'SELECT * FROM medias WHERE plat_id = ? AND principale = TRUE AND type = "image" LIMIT 1',
      [platId]
    );
    return rows.length > 0 ? rows[0] : null;
  }
}

module.exports = Media;
