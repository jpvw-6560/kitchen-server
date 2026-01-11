# Cuisine Server

Serveur de gestion de recettes et menus avec architecture MVC en Node.js/Express.

## 🎯 Fonctionnalités

- ✅ **Gestion de recettes complètes** : nom, description, difficulté, temps, portions
- 🥕 **Gestion d'ingrédients** : avec quantités et unités de mesure
- 📝 **Étapes de préparation** : instructions détaillées étape par étape
- 📅 **Calendrier de menus** : planification hebdomadaire
- 🛒 **Liste de courses automatique** : générée à partir du calendrier
- ⭐ **Système de favoris** : marquer les recettes préférées
- 📸 **Upload de médias** : photos et vidéos des plats
- 🔍 **Recherche rapide** : dans les recettes et ingrédients

## 🏗 Architecture

```
cuisine_server/
├── config/
│   ├── config.js       # Configuration générale
│   └── database.js     # Configuration MySQL
├── models/
│   ├── Plat.js         # Modèle Plat
│   ├── Ingredient.js   # Modèle Ingrédient
│   ├── MenuCalendrier.js # Modèle Calendrier
│   └── Media.js        # Modèle Média
├── controllers/
│   ├── platController.js
│   ├── ingredientController.js
│   ├── menuController.js
│   └── mediaController.js
├── routes/
│   ├── plats.js
│   ├── ingredients.js
│   ├── menus.js
│   └── medias.js
├── public/
│   ├── index.html      # Interface utilisateur
│   ├── style.css       # Styles
│   └── app.js          # Application frontend
└── src/
    └── server.js       # Serveur Express
```

## 🚀 Installation

### Prérequis

- Node.js (v14+)
- MySQL (v5.7+ ou MariaDB)

### Configuration

1. Cloner le repository :
```bash
cd cuisine_server
```

2. Installer les dépendances :
```bash
npm install
```

3. Créer la base de données MySQL :
```sql
CREATE DATABASE cuisine_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Configurer l'environnement :
```bash
cp .env.example .env
```

Éditer `.env` avec vos paramètres MySQL :
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=cuisine_db
PORT=3002
```

5. Lancer le serveur :
```bash
npm start
```

Le serveur démarre sur http://localhost:3002

En mode développement avec auto-reload :
```bash
npm run dev
```

## 📊 Base de données

Le serveur crée automatiquement les tables suivantes au démarrage :

- **plats** : recettes avec nom, description, temps, difficulté, etc.
- **ingredients** : ingrédients avec unité et catégorie
- **plat_ingredients** : liaison plats-ingrédients avec quantités
- **preparations** : étapes de préparation ordonnées
- **medias** : photos/vidéos des plats
- **menu_calendrier** : planification des menus

## 🔌 API Endpoints

### Plats
- `GET /api/plats` - Liste tous les plats
- `GET /api/plats/:id` - Détails d'un plat
- `GET /api/plats/search?q=...` - Recherche de plats
- `GET /api/plats/favoris` - Plats favoris
- `POST /api/plats` - Créer un plat
- `PUT /api/plats/:id` - Modifier un plat
- `PATCH /api/plats/:id/favori` - Toggle favori
- `DELETE /api/plats/:id` - Supprimer un plat

### Ingrédients
- `GET /api/ingredients` - Liste tous les ingrédients
- `GET /api/ingredients/search?q=...` - Recherche
- `POST /api/ingredients` - Créer un ingrédient
- `DELETE /api/ingredients/:id` - Supprimer

### Menus
- `GET /api/menus/period?dateDebut=...&dateFin=...` - Menus d'une période
- `GET /api/menus/semaine` - Menus de la semaine courante
- `GET /api/menus/liste-courses?dateDebut=...&dateFin=...` - Liste de courses
- `POST /api/menus` - Définir un menu
- `DELETE /api/menus/:date` - Supprimer un menu

### Médias
- `GET /api/medias/plat/:platId` - Médias d'un plat
- `POST /api/medias/upload` - Upload un média (multipart/form-data)
  - Body: `media` (file), `plat_id` (number), `description` (string, optionnel)
- `PATCH /api/medias/:id` - Modifier la description
- `DELETE /api/medias/:id` - Supprimer un média

### Configuration
- `GET /api/config` - Configuration (difficultés, unités, catégories)

## 📸 Gestion des médias

Le serveur supporte l'upload de **photos** et **vidéos** pour chaque recette :

**Formats supportés :**
- Images : jpg, jpeg, png, gif, webp
- Vidéos : mp4, webm, avi, mov

**Taille maximale :** 16 MB par fichier

**Upload multiple :** Possible de sélectionner plusieurs fichiers simultanément

**Fonctionnalités :**
- Galerie avec aperçu miniature
- Visualisation en plein écran (clic sur le média)
- Suppression individuelle
- Les fichiers sont stockés dans `/uploads`
- Accès direct via `/uploads/filename.jpg`

⚠️ **Important** : Pour ajouter des médias, la recette doit d'abord être enregistrée.

## 🎨 Interface utilisateur

Interface moderne avec :
- Navigation par onglets (Recettes, Calendrier, Ingrédients, Favoris)
- Recherche en temps réel
- Modals pour création/édition
- Design responsive
- Badges de difficulté colorés
- Cartes avec effet glassmorphism

## 📝 Utilisation

1. **Créer des ingrédients** : aller dans l'onglet "Ingrédients", cliquer sur "Nouvel Ingrédient"
2. **Créer une recette** : onglet "Recettes" → "Nouvelle Recette", ajouter ingrédients et étapes
3. **Planifier les menus** : onglet "Calendrier", assigner des plats aux jours de la semaine
4. **Générer la liste de courses** : dans le calendrier, cliquer sur "Générer la liste"

## 🔧 Technologies

- **Backend** : Node.js, Express, MySQL2
- **Frontend** : Vanilla JavaScript, HTML5, CSS3
- **Upload** : Multer
- **Architecture** : MVC (Model-View-Controller)

## 📦 Dépendances

```json
{
  "express": "^4.18.2",
  "mysql2": "^3.6.0",
  "cors": "^2.8.5",
  "multer": "^1.4.5-lts.1",
  "dotenv": "^16.3.1"
}
```

## 🤝 Contribution

Inspiré de l'architecture d'etchebest, adapté en Node.js/Express avec pattern MVC.

## 📄 Licence

MIT
