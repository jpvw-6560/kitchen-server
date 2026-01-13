// scripts/fix-ingredients.js
// Script pour corriger les ingrédients :
// 1. Convertir tous les noms en minuscules
// 2. Traduire les ingrédients en anglais
// 3. Fusionner les doublons

require('dotenv').config();
const { pool } = require('../config/database');

// Dictionnaire de traduction anglais -> français
const translations = {
  // Légumes
  'tomato': 'tomate',
  'tomatoes': 'tomate',
  'potato': 'pomme de terre',
  'potatoes': 'pomme de terre',
  'carrot': 'carotte',
  'carrots': 'carotte',
  'onion': 'oignon',
  'onions': 'oignon',
  'garlic': 'ail',
  'pepper': 'poivron',
  'peppers': 'poivron',
  'bell pepper': 'poivron',
  'cucumber': 'concombre',
  'lettuce': 'laitue',
  'cabbage': 'chou',
  'mushroom': 'champignon',
  'mushrooms': 'champignon',
  'zucchini': 'courgette',
  'eggplant': 'aubergine',
  'broccoli': 'brocoli',
  'cauliflower': 'chou-fleur',
  'spinach': 'épinard',
  'celery': 'céleri',
  'leek': 'poireau',
  'leeks': 'poireau',
  'pumpkin': 'citrouille',
  'squash': 'courge',
  'corn': 'maïs',
  'peas': 'petits pois',
  'green beans': 'haricots verts',
  
  // Viandes
  'chicken': 'poulet',
  'beef': 'bœuf',
  'pork': 'porc',
  'lamb': 'agneau',
  'turkey': 'dinde',
  'duck': 'canard',
  'ham': 'jambon',
  'bacon': 'bacon',
  'sausage': 'saucisse',
  'sausages': 'saucisse',
  'steak': 'steak',
  'ground beef': 'bœuf haché',
  'minced meat': 'viande hachée',
  
  // Poissons
  'fish': 'poisson',
  'salmon': 'saumon',
  'tuna': 'thon',
  'cod': 'cabillaud',
  'shrimp': 'crevette',
  'shrimps': 'crevette',
  'prawns': 'crevette',
  'lobster': 'homard',
  'crab': 'crabe',
  'mussels': 'moules',
  'oysters': 'huîtres',
  'clams': 'palourdes',
  
  // Produits laitiers
  'milk': 'lait',
  'butter': 'beurre',
  'cream': 'crème',
  'cheese': 'fromage',
  'yogurt': 'yaourt',
  'yoghurt': 'yaourt',
  'egg': 'oeuf',
  'eggs': 'oeuf',
  
  // Céréales et pâtes
  'rice': 'riz',
  'pasta': 'pâtes',
  'noodles': 'nouilles',
  'bread': 'pain',
  'flour': 'farine',
  'wheat': 'blé',
  'oats': 'avoine',
  
  // Fruits
  'apple': 'pomme',
  'apples': 'pomme',
  'banana': 'banane',
  'bananas': 'banane',
  'orange': 'orange',
  'oranges': 'orange',
  'lemon': 'citron',
  'lemons': 'citron',
  'lime': 'citron vert',
  'limes': 'citron vert',
  'strawberry': 'fraise',
  'strawberries': 'fraise',
  'peach': 'pêche',
  'peaches': 'pêche',
  'pear': 'poire',
  'pears': 'poire',
  'grape': 'raisin',
  'grapes': 'raisin',
  'watermelon': 'pastèque',
  'melon': 'melon',
  'cherry': 'cerise',
  'cherries': 'cerise',
  'plum': 'prune',
  'plums': 'prune',
  'apricot': 'abricot',
  'apricots': 'abricot',
  'mango': 'mangue',
  'pineapple': 'ananas',
  'kiwi': 'kiwi',
  
  // Épices et herbes
  'salt': 'sel',
  'pepper': 'poivre',
  'black pepper': 'poivre noir',
  'paprika': 'paprika',
  'cumin': 'cumin',
  'coriander': 'coriandre',
  'parsley': 'persil',
  'basil': 'basilic',
  'thyme': 'thym',
  'rosemary': 'romarin',
  'oregano': 'origan',
  'mint': 'menthe',
  'dill': 'aneth',
  'sage': 'sauge',
  'bay leaf': 'feuille de laurier',
  'bay leaves': 'feuille de laurier',
  'cinnamon': 'cannelle',
  'nutmeg': 'noix de muscade',
  'ginger': 'gingembre',
  'turmeric': 'curcuma',
  'curry': 'curry',
  'chili': 'piment',
  'cayenne': 'cayenne',
  
  // Autres
  'oil': 'huile',
  'olive oil': 'huile d\'olive',
  'vinegar': 'vinaigre',
  'sugar': 'sucre',
  'honey': 'miel',
  'mustard': 'moutarde',
  'ketchup': 'ketchup',
  'mayonnaise': 'mayonnaise',
  'soy sauce': 'sauce soja',
  'tomato sauce': 'sauce tomate',
  'stock': 'bouillon',
  'broth': 'bouillon',
  'water': 'eau',
  'wine': 'vin',
  'red wine': 'vin rouge',
  'white wine': 'vin blanc',
  'beer': 'bière'
};

/**
 * Normalise un nom d'ingrédient (minuscules + trim + normalisation Unicode)
 */
function normalizeNom(nom) {
  let n = nom.toLowerCase().trim()
    // Normaliser les caractères spéciaux
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    // Normaliser les espaces multiples
    .replace(/\s+/g, ' ');
  n = singularize(n);
  return n;
}

/**
 * Singularise un nom d'ingrédient (règles simples)
 */
function singularize(nom) {
  // Exceptions connues
  if (nom === 'pommes de terre') return 'pomme de terre';
  if (nom === 'oeufs') return 'oeuf';
  if (nom === 'œufs') return 'oeuf';
  if (nom === 'carottes') return 'carotte';
  if (nom === 'tomates') return 'tomate';
  if (nom === 'poireaux') return 'poireau';
  if (nom === 'champignons') return 'champignon';
  if (nom === 'poivrons') return 'poivron';
  if (nom === 'aubergines') return 'aubergine';
  if (nom === 'courgettes') return 'courgette';
  if (nom === 'olives noires') return 'olive noire';
  if (nom === 'cerises') return 'cerise';
  if (nom === 'navets') return 'navet';
  if (nom === 'anchois') return 'anchois'; // déjà singulier/pluriel identique
  if (nom === 'haricots verts') return 'haricot vert';
  if (nom === 'petits pois') return 'petit pois';
  if (nom === 'oignons') return 'oignon';
  if (nom === 'poires') return 'poire';
  if (nom === 'pommes') return 'pomme';
  if (nom === 'fraises') return 'fraise';
  if (nom === 'prunes') return 'prune';
  if (nom === 'abricots') return 'abricot';
  if (nom === 'pêches') return 'pêche';
  if (nom === 'bananes') return 'banane';
  if (nom === 'carottes') return 'carotte';
  if (nom === 'légumes') return 'légume';
  if (nom === 'fromages') return 'fromage';
  if (nom === 'yaourts') return 'yaourt';
  if (nom === 'oeufs') return 'oeuf';
  if (nom === 'œufs') return 'oeuf';
  // Règle générale : si finit par s, enlever le s (hors exceptions)
  if (nom.endsWith('s') && nom.length > 3) return nom.slice(0, -1);
  return nom;
}

/**
 * Traduit un ingrédient anglais en français
 */
function translate(nom) {
  const normalized = normalizeNom(nom);
  return translations[normalized] || nom;
}

/**
 * Récupère tous les ingrédients
 */
async function getAllIngredients() {
  const [rows] = await pool.query('SELECT * FROM ingredients ORDER BY id');
  return rows;
}

/**
 * Met à jour un ingrédient
 */
async function updateIngredient(id, newNom) {
  await pool.query('UPDATE ingredients SET nom = ? WHERE id = ?', [newNom, id]);
}

/**
 * Fusionne deux ingrédients (remplace toutes les références)
 */
async function mergeIngredients(fromId, toId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Mettre à jour les références dans plat_ingredients
    await connection.query(
      'UPDATE plat_ingredients SET ingredient_id = ? WHERE ingredient_id = ?',
      [toId, fromId]
    );
    
    // Supprimer l'ancien ingrédient
    await connection.query('DELETE FROM ingredients WHERE id = ?', [fromId]);
    
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Supprime un ingrédient
 */
async function deleteIngredient(id) {
  await pool.query('DELETE FROM ingredients WHERE id = ?', [id]);
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔧 Correction des ingrédients...\n');
  
  try {
    const ingredients = await getAllIngredients();
    console.log(`📊 ${ingredients.length} ingrédients trouvés\n`);
    
    // Map pour détecter les doublons après normalisation
    const normalizedMap = new Map();
    const toUpdate = [];
    const toMerge = [];
    
    // Première passe : construire la map des noms normalisés
    // On traite d'abord les ingrédients qui sont déjà normalisés pour les garder comme référence
    const sortedIngredients = [...ingredients].sort((a, b) => {
      const aNorm = normalizeNom(translate(a.nom));
      const bNorm = normalizeNom(translate(b.nom));
      // Prioriser ceux qui sont déjà normalisés
      const aIsNormalized = a.nom === aNorm;
      const bIsNormalized = b.nom === bNorm;
      if (aIsNormalized && !bIsNormalized) return -1;
      if (!aIsNormalized && bIsNormalized) return 1;
      return a.id - b.id; // Sinon, par ID croissant
    });
    
    // Deuxième passe : identifier les modifications nécessaires
    for (const ingredient of sortedIngredients) {
      const originalNom = ingredient.nom;
      const translatedNom = translate(originalNom);
      const normalizedNom = normalizeNom(translatedNom);
      
      // Vérifier si une traduction ou normalisation est nécessaire
      if (originalNom !== normalizedNom) {
        const needsTranslation = translatedNom !== originalNom;
        
        // Vérifier si le nom normalisé existe déjà
        if (normalizedMap.has(normalizedNom)) {
          const existingId = normalizedMap.get(normalizedNom);
          // Ne pas créer de doublon si c'est le même ID
          if (existingId !== ingredient.id) {
            if (needsTranslation) {
              console.log(`🌍 Traduction : "${originalNom}" → "${normalizedNom}"`);
            } else {
              console.log(`📝 Normalisation : "${originalNom}" → "${normalizedNom}"`);
            }
            console.log(`   ⚠️  Doublon détecté avec l'ID ${existingId}, fusion nécessaire`);
            toMerge.push({ fromId: ingredient.id, toId: existingId, nom: normalizedNom });
          }
        } else {
          if (needsTranslation) {
            console.log(`🌍 Traduction : "${originalNom}" → "${normalizedNom}"`);
          } else {
            console.log(`📝 Normalisation : "${originalNom}" → "${normalizedNom}"`);
          }
          normalizedMap.set(normalizedNom, ingredient.id);
          toUpdate.push({ id: ingredient.id, oldNom: originalNom, newNom: normalizedNom });
        }
      } else {
        normalizedMap.set(normalizedNom, ingredient.id);
      }
    }
    
    console.log(`\n📊 Résumé :`);
    console.log(`   - ${toUpdate.length} ingrédients à mettre à jour`);
    console.log(`   - ${toMerge.length} doublons à fusionner\n`);
    
    // Demander confirmation
    if (toUpdate.length === 0 && toMerge.length === 0) {
      console.log('✅ Aucune modification nécessaire !');
      return;
    }
    
    console.log('⚠️  ATTENTION : Cette opération va modifier la base de données.');
    console.log('Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes pour continuer...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Appliquer les mises à jour
    console.log('🔄 Application des mises à jour...\n');
    
    // D'ABORD, fusionner les doublons (cela libère les noms)
    for (const merge of toMerge) {
      await mergeIngredients(merge.fromId, merge.toId);
      console.log(`🔗 Fusionné : ID ${merge.fromId} → ID ${merge.toId} (${merge.nom})`);
    }
    
    // ENSUITE, mettre à jour les noms
    for (const update of toUpdate) {
      await updateIngredient(update.id, update.newNom);
      console.log(`✅ Mis à jour : ${update.oldNom} → ${update.newNom}`);
    }
    
    console.log('\n✅ Correction terminée avec succès !');
    
    // Afficher les statistiques finales
    const finalIngredients = await getAllIngredients();
    console.log(`\n📊 Statistiques finales :`);
    console.log(`   - ${ingredients.length} ingrédients avant`);
    console.log(`   - ${finalIngredients.length} ingrédients après`);
    console.log(`   - ${ingredients.length - finalIngredients.length} doublons supprimés`);
    
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

// Exécuter le script
if (require.main === module) {
  main().catch(err => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });
}

module.exports = { translate, normalizeNom };
