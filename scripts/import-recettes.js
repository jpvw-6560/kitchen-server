// scripts/import-recettes.js
// Script pour importer des recettes depuis TheMealDB et ajouter des recettes françaises

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Jpvw1953!',
  database: 'cuisine_db',
  timezone: '+00:00',
  dateStrings: true
});

// Recettes françaises prédéfinies
const recettesFrancaises = [
  {
    nom: "Blanquette de veau",
    description: "Ragoût de veau à la crème avec carottes et champignons",
    temps_preparation: 120,
    difficulte: "Moyen",
    nombre_personnes: 4,
    instructions: "1. Faire blanchir le veau\n2. Cuire avec les légumes\n3. Préparer la sauce à la crème\n4. Servir avec du riz",
    ingredients: [
      { nom: "Veau (épaule)", quantite: 800, unite: "g" },
      { nom: "Carottes", quantite: 300, unite: "g" },
      { nom: "Oignons", quantite: 150, unite: "g" },
      { nom: "Champignons de Paris", quantite: 200, unite: "g" },
      { nom: "Crème fraîche", quantite: 20, unite: "cl" },
      { nom: "Bouillon de volaille", quantite: 50, unite: "cl" }
    ]
  },
  {
    nom: "Pot-au-feu",
    description: "Plat traditionnel de bœuf mijoté avec légumes",
    temps_preparation: 180,
    difficulte: "Facile",
    nombre_personnes: 6,
    instructions: "1. Mettre la viande dans l'eau froide\n2. Écumer\n3. Ajouter les légumes\n4. Cuire 3h à feu doux",
    ingredients: [
      { nom: "Bœuf (paleron)", quantite: 1, unite: "kg" },
      { nom: "Carottes", quantite: 600, unite: "g" },
      { nom: "Poireaux", quantite: 450, unite: "g" },
      { nom: "Navets", quantite: 400, unite: "g" },
      { nom: "Oignons", quantite: 150, unite: "g" },
      { nom: "Céleri", quantite: 100, unite: "g" }
    ]
  },
  {
    nom: "Gratin dauphinois",
    description: "Gratin de pommes de terre à la crème",
    temps_preparation: 90,
    difficulte: "Facile",
    nombre_personnes: 4,
    instructions: "1. Éplucher et trancher les pommes de terre\n2. Disposer en couches dans un plat\n3. Verser crème et lait\n4. Cuire 1h au four à 180°C",
    ingredients: [
      { nom: "Pommes de terre", quantite: 1, unite: "kg" },
      { nom: "Crème fraîche", quantite: 30, unite: "cl" },
      { nom: "Lait", quantite: 20, unite: "cl" },
      { nom: "Ail", quantite: 10, unite: "g" },
      { nom: "Beurre", quantite: 30, unite: "g" }
    ]
  },
  {
    nom: "Quiche lorraine",
    description: "Tarte salée aux lardons et crème",
    temps_preparation: 45,
    difficulte: "Facile",
    nombre_personnes: 6,
    instructions: "1. Étaler la pâte dans un moule\n2. Faire revenir les lardons\n3. Mélanger œufs et crème\n4. Verser sur la pâte et cuire 30min",
    ingredients: [
      { nom: "Pâte brisée", quantite: 230, unite: "g" },
      { nom: "Lardons", quantite: 200, unite: "g" },
      { nom: "Œufs", quantite: 220, unite: "g" },
      { nom: "Crème fraîche", quantite: 25, unite: "cl" },
      { nom: "Lait", quantite: 15, unite: "cl" }
    ]
  },
  {
    nom: "Ratatouille",
    description: "Ragoût de légumes provençaux",
    temps_preparation: 60,
    difficulte: "Facile",
    nombre_personnes: 4,
    instructions: "1. Couper tous les légumes en dés\n2. Faire revenir séparément\n3. Mélanger et mijoter 30min\n4. Assaisonner",
    ingredients: [
      { nom: "Aubergines", quantite: 400, unite: "g" },
      { nom: "Courgettes", quantite: 400, unite: "g" },
      { nom: "Poivrons rouges", quantite: 300, unite: "g" },
      { nom: "Tomates", quantite: 500, unite: "g" },
      { nom: "Oignons", quantite: 150, unite: "g" },
      { nom: "Ail", quantite: 15, unite: "g" }
    ]
  },
  {
    nom: "Bœuf bourguignon",
    description: "Bœuf mijoté au vin rouge avec lardons et champignons",
    temps_preparation: 150,
    difficulte: "Moyen",
    nombre_personnes: 6,
    instructions: "1. Faire mariner le bœuf dans le vin\n2. Faire revenir la viande\n3. Ajouter légumes et vin\n4. Mijoter 2h30",
    ingredients: [
      { nom: "Bœuf (paleron)", quantite: 1.2, unite: "kg" },
      { nom: "Vin rouge", quantite: 75, unite: "cl" },
      { nom: "Lardons", quantite: 150, unite: "g" },
      { nom: "Champignons de Paris", quantite: 250, unite: "g" },
      { nom: "Carottes", quantite: 300, unite: "g" },
      { nom: "Oignons", quantite: 150, unite: "g" }
    ]
  },
  {
    nom: "Tarte tatin",
    description: "Tarte aux pommes caramélisées renversée",
    temps_preparation: 60,
    difficulte: "Moyen",
    nombre_personnes: 6,
    instructions: "1. Caraméliser le sucre et beurre\n2. Disposer les pommes\n3. Couvrir de pâte\n4. Cuire et retourner",
    ingredients: [
      { nom: "Pommes", quantite: 1.2, unite: "kg" },
      { nom: "Pâte feuilletée", quantite: 250, unite: "g" },
      { nom: "Sucre", quantite: 150, unite: "g" },
      { nom: "Beurre", quantite: 80, unite: "g" }
    ]
  },
  {
    nom: "Coq au vin",
    description: "Poulet mijoté au vin rouge",
    temps_preparation: 120,
    difficulte: "Moyen",
    nombre_personnes: 4,
    instructions: "1. Faire mariner le poulet\n2. Faire revenir avec lardons\n3. Flamber au cognac\n4. Mijoter au vin rouge",
    ingredients: [
      { nom: "Poulet (découpe)", quantite: 1.5, unite: "kg" },
      { nom: "Vin rouge", quantite: 75, unite: "cl" },
      { nom: "Lardons", quantite: 150, unite: "g" },
      { nom: "Champignons", quantite: 200, unite: "g" },
      { nom: "Oignons grelots", quantite: 250, unite: "g" },
      { nom: "Cognac", quantite: 5, unite: "cl" }
    ]
  },
  {
    nom: "Hachis parmentier",
    description: "Viande hachée recouverte de purée gratinée",
    temps_preparation: 60,
    difficulte: "Facile",
    nombre_personnes: 4,
    instructions: "1. Préparer la purée\n2. Faire revenir la viande hachée\n3. Disposer en couches\n4. Gratiner au four",
    ingredients: [
      { nom: "Pommes de terre", quantite: 1, unite: "kg" },
      { nom: "Viande hachée", quantite: 500, unite: "g" },
      { nom: "Oignons", quantite: 150, unite: "g" },
      { nom: "Lait", quantite: 20, unite: "cl" },
      { nom: "Beurre", quantite: 50, unite: "g" },
      { nom: "Gruyère râpé", quantite: 100, unite: "g" }
    ]
  },
  {
    nom: "Soupe à l'oignon",
    description: "Soupe gratinée aux oignons et fromage",
    temps_preparation: 45,
    difficulte: "Facile",
    nombre_personnes: 4,
    instructions: "1. Faire caraméliser les oignons\n2. Ajouter le bouillon\n3. Verser dans des bols\n4. Gratiner avec pain et fromage",
    ingredients: [
      { nom: "Oignons", quantite: 600, unite: "g" },
      { nom: "Bouillon de bœuf", quantite: 1, unite: "l" },
      { nom: "Pain", quantite: 150, unite: "g" },
      { nom: "Gruyère râpé", quantite: 150, unite: "g" },
      { nom: "Beurre", quantite: 40, unite: "g" }
    ]
  },
  {
    nom: "Poulet rôti",
    description: "Poulet entier rôti au four avec pommes de terre",
    temps_preparation: 90,
    difficulte: "Facile",
    nombre_personnes: 4,
    instructions: "1. Préparer le poulet avec beurre et herbes\n2. Disposer les pommes de terre autour\n3. Cuire 1h30 au four à 180°C\n4. Arroser régulièrement",
    ingredients: [
      { nom: "Poulet", quantite: 1.5, unite: "kg" },
      { nom: "Pommes de terre", quantite: 800, unite: "g" },
      { nom: "Beurre", quantite: 50, unite: "g" },
      { nom: "Thym", quantite: 5, unite: "g" },
      { nom: "Ail", quantite: 20, unite: "g" }
    ]
  },
  {
    nom: "Lasagnes bolognaise",
    description: "Lasagnes à la viande hachée et béchamel",
    temps_preparation: 90,
    difficulte: "Moyen",
    nombre_personnes: 6,
    instructions: "1. Préparer la bolognaise\n2. Préparer la béchamel\n3. Monter les lasagnes en couches\n4. Gratiner 30min",
    ingredients: [
      { nom: "Pâtes à lasagne", quantite: 250, unite: "g" },
      { nom: "Viande hachée", quantite: 500, unite: "g" },
      { nom: "Tomates pelées", quantite: 400, unite: "g" },
      { nom: "Lait", quantite: 50, unite: "cl" },
      { nom: "Beurre", quantite: 50, unite: "g" },
      { nom: "Farine", quantite: 50, unite: "g" },
      { nom: "Gruyère râpé", quantite: 100, unite: "g" }
    ]
  },
  {
    nom: "Salade niçoise",
    description: "Salade composée aux légumes du sud",
    temps_preparation: 20,
    difficulte: "Facile",
    nombre_personnes: 4,
    instructions: "1. Faire durcir les œufs\n2. Couper tous les légumes\n3. Disposer harmonieusement\n4. Assaisonner",
    ingredients: [
      { nom: "Salade verte", quantite: 200, unite: "g" },
      { nom: "Tomates", quantite: 400, unite: "g" },
      { nom: "Thon en boîte", quantite: 200, unite: "g" },
      { nom: "Œufs", quantite: 220, unite: "g" },
      { nom: "Olives noires", quantite: 100, unite: "g" },
      { nom: "Anchois", quantite: 50, unite: "g" },
      { nom: "Poivrons", quantite: 150, unite: "g" }
    ]
  },
  {
    nom: "Crêpes",
    description: "Crêpes sucrées traditionnelles",
    temps_preparation: 30,
    difficulte: "Facile",
    nombre_personnes: 4,
    instructions: "1. Mélanger farine, œufs et lait\n2. Laisser reposer 1h\n3. Cuire les crêpes à la poêle\n4. Servir avec sucre ou confiture",
    ingredients: [
      { nom: "Farine", quantite: 250, unite: "g" },
      { nom: "Œufs", quantite: 165, unite: "g" },
      { nom: "Lait", quantite: 50, unite: "cl" },
      { nom: "Beurre", quantite: 30, unite: "g" },
      { nom: "Sucre", quantite: 30, unite: "g" }
    ]
  },
  {
    nom: "Poisson en papillote",
    description: "Poisson cuit avec légumes en papillote",
    temps_preparation: 30,
    difficulte: "Facile",
    nombre_personnes: 4,
    instructions: "1. Préparer les papillotes\n2. Disposer poisson et légumes\n3. Assaisonner\n4. Cuire 20min au four",
    ingredients: [
      { nom: "Filets de poisson", quantite: 600, unite: "g" },
      { nom: "Courgettes", quantite: 300, unite: "g" },
      { nom: "Tomates", quantite: 300, unite: "g" },
      { nom: "Citron", quantite: 100, unite: "g" },
      { nom: "Huile d'olive", quantite: 5, unite: "cl" }
    ]
  },
  {
    nom: "Endives au jambon",
    description: "Endives braisées roulées au jambon, gratinées",
    temps_preparation: 60,
    difficulte: "Facile",
    nombre_personnes: 4,
    instructions: "1. Cuire les endives\n2. Rouler dans le jambon\n3. Préparer la béchamel\n4. Gratiner 20min",
    ingredients: [
      { nom: "Endives", quantite: 800, unite: "g" },
      { nom: "Jambon blanc", quantite: 200, unite: "g" },
      { nom: "Lait", quantite: 50, unite: "cl" },
      { nom: "Beurre", quantite: 50, unite: "g" },
      { nom: "Farine", quantite: 50, unite: "g" },
      { nom: "Gruyère râpé", quantite: 100, unite: "g" }
    ]
  },
  {
    nom: "Clafoutis aux cerises",
    description: "Dessert aux cerises et pâte à flan",
    temps_preparation: 50,
    difficulte: "Facile",
    nombre_personnes: 6,
    instructions: "1. Disposer les cerises dans un plat\n2. Préparer la pâte\n3. Verser sur les cerises\n4. Cuire 40min",
    ingredients: [
      { nom: "Cerises", quantite: 500, unite: "g" },
      { nom: "Farine", quantite: 100, unite: "g" },
      { nom: "Sucre", quantite: 100, unite: "g" },
      { nom: "Œufs", quantite: 165, unite: "g" },
      { nom: "Lait", quantite: 25, unite: "cl" },
      { nom: "Beurre", quantite: 30, unite: "g" }
    ]
  },
  {
    nom: "Soupe de légumes",
    description: "Soupe mixée aux légumes de saison",
    temps_preparation: 40,
    difficulte: "Facile",
    nombre_personnes: 4,
    instructions: "1. Éplucher et couper les légumes\n2. Faire revenir à la cocotte\n3. Ajouter l'eau et cuire 30min\n4. Mixer",
    ingredients: [
      { nom: "Carottes", quantite: 300, unite: "g" },
      { nom: "Poireaux", quantite: 200, unite: "g" },
      { nom: "Pommes de terre", quantite: 400, unite: "g" },
      { nom: "Courgettes", quantite: 200, unite: "g" },
      { nom: "Oignons", quantite: 100, unite: "g" },
      { nom: "Bouillon de légumes", quantite: 1, unite: "l" }
    ]
  }
];

async function importRecettes() {
  try {
    console.log("🚀 Démarrage de l'import des recettes...\n");

    // 1. Importer les recettes françaises
    console.log("📝 Import des recettes françaises...");
    for (const recette of recettesFrancaises) {
      await importerRecette(recette);
    }

    // 2. Importer depuis TheMealDB
    console.log("\n🌍 Récupération de recettes depuis TheMealDB...");
    await importerDepuisTheMealDB(0); // Désactivé pour garder uniquement les recettes françaises

    console.log("\n✅ Import terminé avec succès !");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur lors de l'import:", err);
    process.exit(1);
  }
}

async function importerRecette(recette) {
  try {
    // Vérifier si la recette existe déjà
    const [existing] = await pool.query(
      'SELECT id FROM plats WHERE nom = ?',
      [recette.nom]
    );

    if (existing.length > 0) {
      console.log(`  ⏭️  ${recette.nom} existe déjà`);
      return;
    }

    // Insérer le plat
    const [result] = await pool.query(
      `INSERT INTO plats (nom, description, temps_preparation, difficulte, nombre_personnes, conseils_chef)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        recette.nom,
        recette.description,
        recette.temps_preparation,
        recette.difficulte,
        recette.nombre_personnes,
        recette.instructions
      ]
    );

    const platId = result.insertId;

    // Insérer les ingrédients
    for (const ing of recette.ingredients) {
      // Vérifier si l'ingrédient existe
      let [ingredientRows] = await pool.query(
        'SELECT id FROM ingredients WHERE nom = ?',
        [ing.nom]
      );

      let ingredientId;
      if (ingredientRows.length === 0) {
        // Créer l'ingrédient s'il n'existe pas
        const [ingResult] = await pool.query(
          'INSERT INTO ingredients (nom, unite, categorie) VALUES (?, ?, ?)',
          [ing.nom, ing.unite, 'Autres']
        );
        ingredientId = ingResult.insertId;
      } else {
        ingredientId = ingredientRows[0].id;
      }

      // Lier l'ingrédient au plat
      await pool.query(
        'INSERT INTO plat_ingredients (plat_id, ingredient_id, quantite, unite) VALUES (?, ?, ?, ?)',
        [platId, ingredientId, ing.quantite, ing.unite]
      );
    }

    console.log(`  ✅ ${recette.nom} importé`);
  } catch (err) {
    console.error(`  ❌ Erreur pour ${recette.nom}:`, err.message);
  }
}

async function importerDepuisTheMealDB(count = 10) {
  try {
    // 1. Récupérer toutes les recettes françaises
    console.log("  Récupération des recettes françaises...");
    const responseFrench = await fetch('https://www.themealdb.com/api/json/v1/1/filter.php?a=French');
    const dataFrench = await responseFrench.json();
    
    if (dataFrench.meals && dataFrench.meals.length > 0) {
      const frenchMeals = dataFrench.meals.slice(0, Math.min(count, dataFrench.meals.length));
      
      for (const mealSummary of frenchMeals) {
        // Récupérer les détails de la recette
        const detailResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealSummary.idMeal}`);
        const detailData = await detailResponse.json();
        
        if (detailData.meals && detailData.meals[0]) {
          const meal = detailData.meals[0];
          
          // Extraire les ingrédients
          const ingredients = [];
          for (let j = 1; j <= 20; j++) {
            const ingredient = meal[`strIngredient${j}`];
            const measure = meal[`strMeasure${j}`];
            
            if (ingredient && ingredient.trim()) {
              ingredients.push({
                nom: ingredient.trim(),
                quantite: 1,
                unite: measure?.trim() || 'portion'
              });
            }
          }

          const recette = {
            nom: meal.strMeal,
            description: `Recette française - ${meal.strCategory}`,
            temps_preparation: 45,
            difficulte: "Moyen",
            nombre_personnes: 4,
            instructions: meal.strInstructions,
            ingredients: ingredients
          };

          await importerRecette(recette);
        }
        
        // Petite pause pour ne pas surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // 2. Compléter avec des recettes aléatoires si besoin
    const imported = dataFrench.meals ? Math.min(count, dataFrench.meals.length) : 0;
    const remaining = count - imported;
    
    if (remaining > 0) {
      console.log(`  Récupération de ${remaining} recettes supplémentaires...`);
      for (let i = 0; i < remaining; i++) {
        const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
        const data = await response.json();
        
        if (data.meals && data.meals[0]) {
          const meal = data.meals[0];
          
          const ingredients = [];
          for (let j = 1; j <= 20; j++) {
            const ingredient = meal[`strIngredient${j}`];
            const measure = meal[`strMeasure${j}`];
            
            if (ingredient && ingredient.trim()) {
              ingredients.push({
                nom: ingredient.trim(),
                quantite: 1,
                unite: measure?.trim() || 'portion'
              });
            }
          }

          const recette = {
            nom: meal.strMeal,
            description: `Recette ${meal.strArea} - ${meal.strCategory}`,
            temps_preparation: 45,
            difficulte: "Moyen",
            nombre_personnes: 4,
            instructions: meal.strInstructions,
            ingredients: ingredients
          };

          await importerRecette(recette);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  } catch (err) {
    console.error("Erreur lors de l'import depuis TheMealDB:", err.message);
  }
}

// Lancer l'import
importRecettes();
