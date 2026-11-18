// src/server.js
// Serveur principal de l'application Cuisine

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('../config/database');
const config = require('../config/config');

// Import des routes
const platsRoutes = require('../routes/plats');
const ingredientsRoutes = require('../routes/ingredients');
const menusRoutes = require('../routes/menus');
const mediasRoutes = require('../routes/medias');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes API
app.use('/api/plats', platsRoutes);
app.use('/api/ingredients', ingredientsRoutes);
app.use('/api/menus', menusRoutes);
app.use('/api/medias', mediasRoutes);

// Route pour la configuration
app.get('/api/config', (req, res) => {
  res.json({
    difficultes: config.difficultes,
    unites: config.unites,
    categories: config.categories
  });
});

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialisation de la base de données et démarrage du serveur
async function startServer() {
  try {
    await initDatabase();
    console.log('✅ Base de données prête');
    
    app.listen(config.port, config.host, () => {
      console.log(`\n🚀 Serveur Cuisine démarré sur http://${config.host}:${config.port}`);
      console.log(`📊 API disponible localement sur http://localhost:${config.port}/api`);
      console.log(`📁 Uploads dans: ${config.uploadDir}\n`);
    });
  } catch (err) {
    console.error('❌ Erreur démarrage serveur:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
