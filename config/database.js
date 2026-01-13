// config/database.js
// Configuration de la base de données MySQL

const mysql = require('mysql2/promise');

// Configuration de la connexion
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cuisine_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00', // Utiliser UTC pour éviter les conversions
  dateStrings: true // Retourner les dates comme des strings
});

/**
 * Initialise la base de données avec toutes les tables nécessaires
 */
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Table des plats
    await connection.query(`
      CREATE TABLE IF NOT EXISTS plats (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(200) NOT NULL,
        description TEXT,
        type ENUM('Plat', 'Dessert') DEFAULT 'Plat',
        temps_preparation INT,
        difficulte ENUM('Facile', 'Moyen', 'Difficile') DEFAULT 'Moyen',
        conseils_chef TEXT,
        nombre_personnes INT DEFAULT 4,
        favori BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nom (nom),
        INDEX idx_type (type),
        INDEX idx_favori (favori)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Ajouter la colonne type si elle n'existe pas déjà (migration)
    try {
      await connection.query(`
        ALTER TABLE plats ADD COLUMN type ENUM('Plat', 'Dessert') DEFAULT 'Plat' AFTER description
      `);
    } catch (err) {
      // Ignorer si la colonne existe déjà
    }
    
    // Table des ingrédients
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(200) NOT NULL UNIQUE,
        unite VARCHAR(50),
        categorie VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_nom (nom),
        INDEX idx_categorie (categorie)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Table de liaison plats-ingrédients
    await connection.query(`
      CREATE TABLE IF NOT EXISTS plat_ingredients (
        id INT PRIMARY KEY AUTO_INCREMENT,
        plat_id INT NOT NULL,
        ingredient_id INT NOT NULL,
        quantite DECIMAL(10, 2),
        unite VARCHAR(50),
        FOREIGN KEY (plat_id) REFERENCES plats(id) ON DELETE CASCADE,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
        UNIQUE KEY unique_plat_ingredient (plat_id, ingredient_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Table des étapes de préparation
    await connection.query(`
      CREATE TABLE IF NOT EXISTS preparations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        plat_id INT NOT NULL,
        ordre INT NOT NULL,
        description TEXT NOT NULL,
        duree_minutes INT,
        FOREIGN KEY (plat_id) REFERENCES plats(id) ON DELETE CASCADE,
        INDEX idx_plat_ordre (plat_id, ordre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Table des médias
    await connection.query(`
      CREATE TABLE IF NOT EXISTS medias (
        id INT PRIMARY KEY AUTO_INCREMENT,
        plat_id INT NOT NULL,
        type ENUM('image', 'video') DEFAULT 'image',
        chemin_fichier VARCHAR(500) NOT NULL,
        nom_original VARCHAR(255),
        description TEXT,
        taille_fichier INT,
        principale BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (plat_id) REFERENCES plats(id) ON DELETE CASCADE,
        INDEX idx_plat (plat_id),
        INDEX idx_principale (plat_id, principale)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Ajouter la colonne principale si elle n'existe pas déjà
    try {
      await connection.query(`
        ALTER TABLE medias ADD COLUMN IF NOT EXISTS principale BOOLEAN DEFAULT FALSE
      `);
    } catch (err) {
      // Ignorer si la colonne existe déjà
    }
    
    // Table du calendrier des menus
    await connection.query(`
      CREATE TABLE IF NOT EXISTS menu_calendrier (
        id INT PRIMARY KEY AUTO_INCREMENT,
        date DATE NOT NULL UNIQUE,
        plat_id INT,
        nombre_personnes INT DEFAULT 4,
        notes TEXT,
        valide BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (plat_id) REFERENCES plats(id) ON DELETE SET NULL,
        INDEX idx_date (date),
        INDEX idx_valide (valide)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Table des catégories (nouvelle)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Migrer les catégories existantes depuis ingredients (si la table vient d'être créée)
    const [existingCategories] = await connection.query(`
      SELECT DISTINCT categorie 
      FROM ingredients 
      WHERE categorie IS NOT NULL AND categorie != ''
    `);
    
    for (const row of existingCategories) {
      try {
        await connection.query(
          'INSERT IGNORE INTO categories (nom) VALUES (?)',
          [row.categorie]
        );
      } catch (err) {
        // Ignorer si déjà existant
      }
    }
    
    connection.release();
    console.log('✅ Base de données initialisée avec succès');
  } catch (err) {
    console.error('❌ Erreur initialisation base de données:', err);
    throw err;
  }
}

module.exports = {
  pool,
  initDatabase
};
