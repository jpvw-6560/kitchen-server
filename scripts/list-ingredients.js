// scripts/list-ingredients.js
// Liste tous les ingrédients de la base de données avec analyse

require('dotenv').config();
const { pool } = require('../config/database');

async function main() {
  console.log('📋 Liste des ingrédients\n');
  
  try {
    const [ingredients] = await pool.query('SELECT * FROM ingredients ORDER BY nom');
    
    console.log(`Total : ${ingredients.length} ingrédients\n`);
    
    // Grouper par première lettre
    const grouped = {};
    const potentialDuplicates = [];
    const englishWords = [];
    
    // Détecter les mots anglais courants
    const englishPattern = /^(tomato|potato|chicken|beef|pork|fish|egg|milk|butter|cheese|salt|pepper|sugar|flour|oil|water|rice|pasta|bread|onion|garlic|carrot|mushroom)/i;
    
    for (const ing of ingredients) {
      const firstLetter = ing.nom[0].toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(ing);
      
      // Détecter les doublons potentiels (même nom en minuscules)
      const normalized = ing.nom.toLowerCase();
      const existing = ingredients.find(i => 
        i.id !== ing.id && i.nom.toLowerCase() === normalized
      );
      if (existing && !potentialDuplicates.some(d => d.nom === normalized)) {
        potentialDuplicates.push({
          nom: normalized,
          ids: [existing.id, ing.id],
          originals: [existing.nom, ing.nom]
        });
      }
      
      // Détecter les mots anglais
      if (englishPattern.test(ing.nom)) {
        englishWords.push(ing);
      }
    }
    
    // Afficher par groupe
    for (const letter of Object.keys(grouped).sort()) {
      console.log(`\n${letter}`);
      console.log('─'.repeat(50));
      for (const ing of grouped[letter]) {
        console.log(`  ${ing.id.toString().padStart(3)} - ${ing.nom} ${ing.unite ? `(${ing.unite})` : ''} ${ing.categorie ? `[${ing.categorie}]` : ''}`);
      }
    }
    
    // Afficher les doublons potentiels
    if (potentialDuplicates.length > 0) {
      console.log('\n\n⚠️  DOUBLONS POTENTIELS\n');
      console.log('═'.repeat(50));
      for (const dup of potentialDuplicates) {
        console.log(`\n"${dup.nom}" :`);
        for (let i = 0; i < dup.ids.length; i++) {
          console.log(`  ID ${dup.ids[i]} : "${dup.originals[i]}"`);
        }
      }
      console.log(`\nTotal : ${potentialDuplicates.length} doublons détectés`);
    }
    
    // Afficher les mots anglais
    if (englishWords.length > 0) {
      console.log('\n\n🌍 INGRÉDIENTS EN ANGLAIS\n');
      console.log('═'.repeat(50));
      for (const ing of englishWords) {
        console.log(`  ID ${ing.id.toString().padStart(3)} : ${ing.nom}`);
      }
      console.log(`\nTotal : ${englishWords.length} ingrédients en anglais détectés`);
    }
    
    console.log('\n');
    
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });
}
