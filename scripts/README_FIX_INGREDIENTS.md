# Script de correction des ingrédients

Ce script corrige automatiquement les ingrédients dans la base de données :

## Fonctionnalités

1. **Normalisation** : Convertit tous les noms en minuscules
2. **Traduction** : Traduit les ingrédients anglais en français
3. **Fusion** : Fusionne les doublons (ex: "Pomme de terre", "pomme de Terre", "Pommes de Terre")

## Utilisation

### Exécution du script

```bash
cd /home/jpvw/Documents/php_appli/gestion_ESP/cuisine_server
node scripts/fix-ingredients.js
```

### Ce que fait le script

1. Analyse tous les ingrédients de la base de données
2. Identifie les traductions nécessaires (anglais → français)
3. Identifie les normalisations nécessaires (majuscules → minuscules)
4. Détecte les doublons après normalisation
5. Affiche un résumé des modifications
6. Attend 5 secondes pour confirmation
7. Applique les modifications :
   - Met à jour les noms d'ingrédients
   - Fusionne les doublons (met à jour toutes les références dans les recettes)
8. Affiche les statistiques finales

## Exemple de sortie

```
🔧 Correction des ingrédients...

📊 25 ingrédients trouvés

🌍 Traduction : "Tomato" → "tomate"
📝 Normalisation : "Pomme de Terre" → "pomme de terre"
📝 Normalisation : "Pommes de Terre" → "pomme de terre"
   ⚠️  Doublon détecté avec l'ID 5, fusion nécessaire

📊 Résumé :
   - 3 ingrédients à mettre à jour
   - 1 doublons à fusionner

⚠️  ATTENTION : Cette opération va modifier la base de données.
Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes pour continuer...

🔄 Application des mises à jour...

✅ Mis à jour : Tomato → tomate
✅ Mis à jour : Pomme de Terre → pomme de terre
🔗 Fusionné : ID 12 → ID 5 (pomme de terre)

✅ Correction terminée avec succès !

📊 Statistiques finales :
   - 25 ingrédients avant
   - 23 ingrédients après
   - 2 doublons supprimés
```

## Sécurité

- Le script utilise des transactions pour les fusions
- Un délai de 5 secondes permet d'annuler (Ctrl+C)
- Toutes les références dans `plat_ingredients` sont mises à jour automatiquement

## Après l'exécution

Les nouveaux ingrédients créés via l'interface seront automatiquement en minuscules grâce aux modifications apportées au code.

## Dictionnaire de traduction

Le script inclut un dictionnaire complet de traductions pour :
- Légumes
- Viandes
- Poissons
- Produits laitiers
- Céréales et pâtes
- Fruits
- Épices et herbes
- Autres ingrédients courants

Si un ingrédient anglais n'est pas dans le dictionnaire, il sera simplement converti en minuscules sans traduction.
