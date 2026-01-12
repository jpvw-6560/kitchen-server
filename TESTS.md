# Tests - Recipe Server

## ✅ Checklist de vérification

### Backend

- [ ] Serveur démarre sans erreur sur port 3002
- [ ] Route GET `/api/config` retourne la configuration
- [ ] Route GET `/api/medias/plat/:id` retourne les médias
- [ ] Route POST `/api/medias/upload` accepte multipart/form-data
- [ ] Route DELETE `/api/medias/:id` supprime le média
- [ ] Dossier `/uploads` est créé automatiquement
- [ ] Fichiers sont bien sauvegardés dans `/uploads`

### Frontend

- [ ] Page se charge sans erreur console
- [ ] Modal de recette s'ouvre correctement
- [ ] Section "📸 Photos & Vidéos" est visible
- [ ] Bouton "➕ Ajouter des médias" fonctionne
- [ ] Input file accepte images et vidéos
- [ ] Upload multiple fonctionne
- [ ] Galerie affiche les médias
- [ ] Clic sur média ouvre plein écran
- [ ] Bouton suppression fonctionne
- [ ] Confirmation avant suppression

### Tests manuels

#### Test 1 : Créer une recette avec photo

```
1. Ouvrir http://localhost:3002
2. Cliquer "➕ Nouvelle Recette"
3. Remplir : Nom = "Tarte aux pommes"
4. Cliquer "💾 Enregistrer"
5. Rouvrir la recette en édition
6. Descendre à "📸 Photos & Vidéos"
7. Cliquer "➕ Ajouter des médias"
8. Sélectionner une image
9. Vérifier que l'image apparaît dans la galerie
```

#### Test 2 : Upload multiple

```
1. Éditer une recette existante
2. Cliquer "➕ Ajouter des médias"
3. Sélectionner 3 images en même temps (Ctrl+clic)
4. Vérifier que les 3 images sont uploadées
5. Vérifier qu'elles apparaissent toutes dans la galerie
```

#### Test 3 : Visualisation plein écran

```
1. Éditer une recette avec médias
2. Cliquer sur une image
3. Vérifier qu'elle s'affiche en grand
4. Cliquer en dehors pour fermer
5. Tester avec une vidéo
6. Vérifier que les controls vidéo fonctionnent
```

#### Test 4 : Suppression

```
1. Éditer une recette avec médias
2. Survoler une carte de média
3. Vérifier que le bouton 🗑️ apparaît
4. Cliquer sur 🗑️
5. Vérifier la popup de confirmation
6. Confirmer
7. Vérifier que le média disparaît
8. Vérifier dans /uploads que le fichier est supprimé
```

#### Test 5 : Types de fichiers

**Valides :**
- test.jpg ✓
- test.png ✓
- test.gif ✓
- test.mp4 ✓
- test.webm ✓

**Invalides :**
- test.txt ✗ (doit être rejeté)
- test.pdf ✗ (doit être rejeté)
- test.exe ✗ (doit être rejeté)

#### Test 6 : Taille maximale

```
1. Créer un fichier > 16 MB
2. Tenter de l'uploader
3. Vérifier l'erreur "Fichier trop volumineux"
```

### Tests API avec curl

#### Lister les médias d'un plat
```bash
curl http://localhost:3002/api/medias/plat/1
```

#### Upload un média
```bash
curl -X POST http://localhost:3002/api/medias/upload \
  -F "media=@/path/to/image.jpg" \
  -F "plat_id=1" \
  -F "description=Photo du plat final"
```

#### Supprimer un média
```bash
curl -X DELETE http://localhost:3002/api/medias/1
```

### Résultats attendus

✅ **Succès si :**
- Tous les uploads fonctionnent
- Galerie s'affiche correctement
- Visualisation plein écran fonctionne
- Suppression fonctionne avec confirmation
- Fichiers physiques sont bien supprimés
- Aucune erreur console

❌ **Échec si :**
- Erreurs 500 dans la console serveur
- Erreurs JavaScript dans la console navigateur
- Fichiers restent après suppression
- Types invalides sont acceptés
- Taille > 16MB est acceptée

### Outils de test

- **Console navigateur** : F12 → Console
- **Network** : F12 → Network (voir requêtes API)
- **Logs serveur** : Terminal avec `npm start`
- **Base de données** : Vérifier table `medias`
- **Système de fichiers** : Vérifier `/uploads`

### Debug

Si problème d'upload :
```javascript
// Dans la console navigateur
console.log(document.getElementById('media-file-input').files);
```

Si problème de route :
```javascript
// Dans server.js, ajouter :
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
```
