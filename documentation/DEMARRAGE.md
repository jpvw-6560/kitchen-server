# Démarrage de Cuisine Server

## ⚠️ Avant de démarrer

### 1. Configurer la base de données MySQL

Créer la base de données :
```sql
CREATE DATABASE cuisine_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configurer les identifiants dans `.env`

Éditer le fichier `.env` à la racine du projet :
```bash
DB_HOST=localhost
DB_USER=votre_utilisateur_mysql
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=cuisine_db
PORT=3002
UPLOAD_DIR=./uploads
```

### 3. Installer les dépendances

```bash
npm install
```

## 🚀 Démarrage

### Mode normal
```bash
npm start
```

### Mode développement (avec auto-reload)
```bash
npm run dev
```

Le serveur démarre sur **http://localhost:3002**

## ✅ Vérification

Au démarrage, vous devriez voir :
```
✅ Base de données initialisée avec succès
✅ Base de données prête
🚀 Serveur Cuisine démarré sur http://localhost:3002
📊 API disponible sur http://localhost:3002/api
📁 Uploads dans: ./uploads
```

## 🔍 Résolution de problèmes

### Erreur "Access denied for user 'root'@'localhost'"
➜ Vérifier les identifiants MySQL dans le fichier `.env`

### Erreur "Cannot find module"
➜ Lancer `npm install` pour installer les dépendances

### Port 3002 déjà utilisé
➜ Changer le port dans `.env` : `PORT=3003`

## 📖 Utilisation

1. Ouvrir http://localhost:3002 dans votre navigateur
2. Commencer par créer des ingrédients dans l'onglet "🥕 Ingrédients"
3. Créer vos recettes dans l'onglet "📖 Recettes"
4. Planifier vos menus dans l'onglet "📅 Calendrier"
5. Générer votre liste de courses automatiquement

Bon appétit ! 👨‍🍳
