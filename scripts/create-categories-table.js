// Script pour créer la table categories et migrer les données existantes
const { pool } = require('../config/database');

async function createCategoriesTable() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔧 Création de la table categories...');
    
    // Créer la table categories
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Table categories créée');
    
    // Migrer les catégories existantes depuis la table ingredients
    console.log('📦 Migration des catégories existantes...');
    
    const [existingCategories] = await connection.query(`
      SELECT DISTINCT categorie 
      FROM ingredients 
      WHERE categorie IS NOT NULL AND categorie != ''
      ORDER BY categorie
    `);
    
    for (const row of existingCategories) {
      try {
        await connection.query(
          'INSERT IGNORE INTO categories (nom) VALUES (?)',
          [row.categorie]
        );
        console.log(`  ✓ Catégorie migrée: ${row.categorie}`);
      } catch (err) {
        console.log(`  ⚠ Catégorie déjà existante: ${row.categorie}`);
      }
    }
    
    console.log(`✅ ${existingCategories.length} catégories migrées`);
    console.log('✨ Migration terminée avec succès');
    
  } catch (err) {
    console.error('❌ Erreur lors de la migration:', err);
    throw err;
  } finally {
    connection.release();
    await pool.end();
  }
}

// Exécution
createCategoriesTable()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
