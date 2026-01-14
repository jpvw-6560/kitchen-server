# Changelog - Recipe Server

## [11 Janvier 2026] - Ajout de la gestion des médias

### 📸 Nouvelles fonctionnalités

- **Upload de photos et vidéos** pour les recettes
  - Formats images : jpg, jpeg, png, gif, webp
  - Formats vidéos : mp4, webm, avi, mov
  - Taille max : 16 MB par fichier
  - Upload multiple supporté

- **Galerie de médias** dans le formulaire de recette
  - Affichage en grille responsive
  - Aperçu miniature cliquable
  - Visualisation plein écran (images et vidéos)
  - Suppression individuelle avec confirmation

- **Stockage des médias**
  - Dossier `/uploads` créé automatiquement
  - Nommage unique avec timestamp
  - Métadonnées en base de données (table `medias`)

### 🔧 Modifications techniques

- **Backend**
  - Route POST `/api/medias/upload` avec multer
  - Gestion des types MIME et validation des extensions
  - Suppression automatique du fichier lors de la suppression en base

- **Frontend**
  - Section "📸 Photos & Vidéos" dans le modal de recette
  - Composant `media-card` avec overlay hover
  - Modal de visualisation en plein écran
  - Styles CSS pour la galerie responsive

- **Base de données**
  - Table `medias` avec colonnes :
    - `id`, `plat_id`, `type` (image/video)
    - `chemin_fichier`, `nom_original`, `description`
    - `taille_fichier`, `created_at`

### 🎨 Interface

- Design moderne avec effet hover sur les cartes
- Bouton de suppression discret (overlay)
- Badge "🎥" pour les vidéos
- Animation fadeIn pour le modal plein écran
- Grille responsive (150px min, auto-fill)

### 📝 Notes d'utilisation

⚠️ **Important** : Pour ajouter des médias à une recette, celle-ci doit d'abord être enregistrée. Un message d'alerte guide l'utilisateur si besoin.

Pour ajouter des médias :
1. Créer/Modifier une recette
2. Cliquer sur "Enregistrer" pour sauvegarder la recette
3. Rouvrir la recette en édition
4. Cliquer sur "➕ Ajouter des médias"
5. Sélectionner un ou plusieurs fichiers
6. Les médias s'affichent automatiquement

---

## [10 Janvier 2026] - Changement de nom

### Renommage
- "Cuisine Server - Gestion de Recettes" → **"Recipe Server"**
- Logo navbar : "👨‍🍳 Recipe Server"
- Titre page : "Recipe Server"
