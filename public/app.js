// app.js - Application Cuisine Server

const API_BASE = 'http://localhost:3002/api';

// État de l'application
const state = {
  currentView: 'plats',
  plats: [],
  ingredients: [],
  config: {},
  currentWeekStart: null,
  editingPlat: null
};

/**
 * Affiche un dialog de confirmation moderne
 * @param {string} message - Le message à afficher
 * @param {string} title - Le titre (optionnel, défaut: "Confirmation")
 * @param {string} icon - L'icône à afficher (optionnel, défaut: "⚠️")
 * @returns {Promise<boolean>} - true si confirmé, false sinon
 */
async function showConfirmDialog(message, title = 'Confirmation', icon = '⚠️') {
  return new Promise((resolve) => {
    // Créer l'overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-dialog-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog-card">
        <div class="confirm-dialog-icon">${icon}</div>
        <h3 class="confirm-dialog-title">${title}</h3>
        <p class="confirm-dialog-message">${message}</p>
        <div class="confirm-dialog-actions">
          <button class="confirm-dialog-btn confirm-dialog-btn-cancel">Annuler</button>
          <button class="confirm-dialog-btn confirm-dialog-btn-confirm">Supprimer</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Gérer l'annulation
    const cancelBtn = overlay.querySelector('.confirm-dialog-btn-cancel');
    const confirmBtn = overlay.querySelector('.confirm-dialog-btn-confirm');
    
    const cleanup = (result) => {
      overlay.style.animation = 'fadeOut 0.2s ease';
      setTimeout(() => {
        document.body.removeChild(overlay);
        resolve(result);
      }, 200);
    };
    
    cancelBtn.addEventListener('click', () => cleanup(false));
    confirmBtn.addEventListener('click', () => cleanup(true));
    
    // Fermer avec Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        cleanup(false);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Fermer en cliquant sur l'overlay
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup(false);
      }
    });
  });
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  await loadIngredients();
  await loadPlats();
  
  setupNavigation();
  setupModals();
  setupSearchHandlers();
  setupPlatForm();
  setupIngredientForm();
  setupCalendrier();
});

// Chargement des données
async function loadConfig() {
  try {
    const response = await fetch(`${API_BASE}/config`);
    state.config = await response.json();
    
    // Remplir les select d'unités et catégories
    const uniteSelects = document.querySelectorAll('#ingredient-unite');
    uniteSelects.forEach(select => {
      select.innerHTML = state.config.unites.map(u => `<option value="${u}">${u}</option>`).join('');
    });
    
    const categorieSelect = document.getElementById('ingredient-categorie');
    categorieSelect.innerHTML = state.config.categories.map(c => `<option value="${c}">${c}</option>`).join('');
  } catch (err) {
    console.error('Erreur chargement config:', err);
  }
}

async function loadPlats() {
  try {
    const response = await fetch(`${API_BASE}/plats`);
    state.plats = await response.json();
    renderPlats();
  } catch (err) {
    console.error('Erreur chargement plats:', err);
  }
}

async function loadIngredients() {
  try {
    const response = await fetch(`${API_BASE}/ingredients`);
    state.ingredients = await response.json();
    renderIngredients();
  } catch (err) {
    console.error('Erreur chargement ingrédients:', err);
  }
}

async function loadFavoris() {
  try {
    const response = await fetch(`${API_BASE}/plats/favoris`);
    const favoris = await response.json();
    renderFavoris(favoris);
  } catch (err) {
    console.error('Erreur chargement favoris:', err);
  }
}

// Navigation
function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
    });
  });
}

function switchView(viewName) {
  // Mettre à jour les boutons de navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  
  // Mettre à jour les vues
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(`view-${viewName}`).classList.add('active');
  
  state.currentView = viewName;
  
  // Charger les données spécifiques à la vue
  if (viewName === 'favoris') {
    loadFavoris();
  } else if (viewName === 'calendrier') {
    loadCalendrierSemaine();
  }
}

// Rendu des plats
function renderPlats(platsToRender = state.plats) {
  const container = document.getElementById('plats-list');
  
  if (platsToRender.length === 0) {
    container.innerHTML = '<p class="menu-empty">Aucune recette trouvée</p>';
    return;
  }
  
  container.innerHTML = platsToRender.map(plat => `
    <div class="card" onclick="viewPlatDetails(${plat.id})">
      <div class="card-header">
        <h3 class="card-title">${plat.nom}</h3>
        <span class="card-badge badge-${plat.difficulte.toLowerCase()}">${plat.difficulte}</span>
      </div>
      ${plat.description ? `<p class="card-description">${plat.description}</p>` : ''}
      <div class="card-meta">
        ${plat.temps_preparation ? `<span>⏱ ${plat.temps_preparation} min</span>` : ''}
        <span>👥 ${plat.nombre_personnes} pers.</span>
        <span>🥕 ${plat.nb_ingredients} ingr.</span>
      </div>
      <div class="card-actions">
        <button class="btn-icon btn-favori ${plat.favori ? 'active' : ''}" 
                onclick="toggleFavori(event, ${plat.id})" 
                title="Favori">⭐</button>
        <button class="btn-icon" onclick="editPlat(event, ${plat.id})" title="Modifier">✏️</button>
        <button class="btn-icon" onclick="deletePlat(event, ${plat.id})" title="Supprimer">🗑️</button>
      </div>
    </div>
  `).join('');
}

function renderFavoris(favoris) {
  const container = document.getElementById('favoris-list');
  
  if (favoris.length === 0) {
    container.innerHTML = '<p class="menu-empty">Aucune recette favorite</p>';
    return;
  }
  
  container.innerHTML = favoris.map(plat => `
    <div class="card" onclick="viewPlatDetails(${plat.id})">
      <div class="card-header">
        <h3 class="card-title">${plat.nom}</h3>
        <span class="card-badge badge-${plat.difficulte.toLowerCase()}">${plat.difficulte}</span>
      </div>
      ${plat.description ? `<p class="card-description">${plat.description}</p>` : ''}
      <div class="card-meta">
        ${plat.temps_preparation ? `<span>⏱ ${plat.temps_preparation} min</span>` : ''}
        <span>👥 ${plat.nombre_personnes} pers.</span>
      </div>
    </div>
  `).join('');
}

// Rendu des ingrédients
function renderIngredients(ingredientsToRender = state.ingredients) {
  const container = document.getElementById('ingredients-list');
  
  if (ingredientsToRender.length === 0) {
    container.innerHTML = '<p class="menu-empty">Aucun ingrédient trouvé</p>';
    return;
  }
  
  // Grouper par catégorie
  const grouped = {};
  ingredientsToRender.forEach(ing => {
    const cat = ing.categorie || 'Autres';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(ing);
  });
  
  container.innerHTML = Object.entries(grouped).map(([categorie, ingredients]) => `
    <div class="categorie-ingredients">
      <h3>${categorie}</h3>
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Unité</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${ingredients.map(ing => `
            <tr>
              <td>${ing.nom}</td>
              <td>${ing.unite || '-'}</td>
              <td>
                <button class="btn-icon" onclick="deleteIngredient(${ing.id})" title="Supprimer">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');
}

// Recherche
function setupSearchHandlers() {
  const searchPlats = document.getElementById('search-plats');
  searchPlats.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = state.plats.filter(p => 
      p.nom.toLowerCase().includes(query) || 
      (p.description && p.description.toLowerCase().includes(query))
    );
    renderPlats(filtered);
  });
  
  const searchIngredients = document.getElementById('search-ingredients');
  searchIngredients.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = state.ingredients.filter(i => 
      i.nom.toLowerCase().includes(query)
    );
    renderIngredients(filtered);
  });
}

// Actions sur les plats
async function toggleFavori(event, platId) {
  event.stopPropagation();
  try {
    await fetch(`${API_BASE}/plats/${platId}/favori`, { method: 'PATCH' });
    await loadPlats();
  } catch (err) {
    console.error('Erreur toggle favori:', err);
  }
}

async function deletePlat(event, platId) {
  event.stopPropagation();
  
  const confirmed = await showConfirmDialog(
    'Cette action est irréversible. Tous les ingrédients et étapes de préparation seront également supprimés.',
    'Supprimer cette recette ?',
    '🗑️'
  );
  
  if (!confirmed) return;
  
  try {
    await fetch(`${API_BASE}/plats/${platId}`, { method: 'DELETE' });
    await loadPlats();
  } catch (err) {
    console.error('Erreur suppression plat:', err);
  }
}

async function deleteIngredient(ingredientId) {
  const confirmed = await showConfirmDialog(
    'Cet ingrédient sera supprimé de toutes les recettes qui l\'utilisent.',
    'Supprimer cet ingrédient ?',
    '🗑️'
  );
  
  if (!confirmed) return;
  
  try {
    await fetch(`${API_BASE}/ingredients/${ingredientId}`, { method: 'DELETE' });
    await loadIngredients();
  } catch (err) {
    console.error('Erreur suppression ingrédient:', err);
  }
}

// Modals
function setupModals() {
  // Fermeture des modals
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').classList.remove('active');
    });
  });
  
  // Ouverture nouveau plat
  document.getElementById('btn-new-plat').addEventListener('click', () => {
    state.editingPlat = null;
    document.getElementById('modal-plat-title').textContent = 'Nouvelle Recette';
    document.getElementById('form-plat').reset();
    document.getElementById('plat-ingredients-list').innerHTML = '';
    document.getElementById('plat-preparations-list').innerHTML = '';
    document.getElementById('modal-plat').classList.add('active');
  });
  
  // Ouverture nouvel ingrédient
  document.getElementById('btn-new-ingredient').addEventListener('click', () => {
    document.getElementById('form-ingredient').reset();
    document.getElementById('modal-ingredient').classList.add('active');
  });
}

// Formulaire plat
function setupPlatForm() {
  const form = document.getElementById('form-plat');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const favoriFiled = document.getElementById('plat-favori');
    const platData = {
      nom: document.getElementById('plat-nom').value,
      description: document.getElementById('plat-description').value,
      temps_preparation: parseInt(document.getElementById('plat-temps').value) || null,
      difficulte: document.getElementById('plat-difficulte').value,
      conseils_chef: document.getElementById('plat-conseils').value,
      nombre_personnes: parseInt(document.getElementById('plat-personnes').value) || 4,
      favori: favoriFiled ? favoriFiled.checked : false
    };
    
    try {
      const url = state.editingPlat 
        ? `${API_BASE}/plats/${state.editingPlat}` 
        : `${API_BASE}/plats`;
      const method = state.editingPlat ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platData)
      });
      
      const result = await response.json();
      const platId = state.editingPlat || result.id;
      
      // Gérer les ingrédients
      if (platId) {
        // Si édition, vider d'abord les anciens ingrédients et préparations
        if (state.editingPlat) {
          await fetch(`${API_BASE}/plats/${platId}/ingredients`, { method: 'DELETE' });
          await fetch(`${API_BASE}/plats/${platId}/preparations`, { method: 'DELETE' });
        }
        
        const ingredientRows = document.querySelectorAll('#plat-ingredients-list .ingredient-row');
        for (const row of ingredientRows) {
          const select = row.querySelector('.ingredient-select');
          const quantite = row.querySelectorAll('input[type="number"]')[0];
          const unite = row.querySelector('select:not(.ingredient-select)');
          
          if (select.value && quantite.value) {
            await fetch(`${API_BASE}/plats/${platId}/ingredients`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ingredient_id: parseInt(select.value),
                quantite: parseFloat(quantite.value),
                unite: unite.value
              })
            });
          }
        }
        
        // Gérer les préparations
        const preparationRows = document.querySelectorAll('#plat-preparations-list .preparation-row');
        for (let i = 0; i < preparationRows.length; i++) {
          const row = preparationRows[i];
          const description = row.querySelector('textarea');
          const duree = row.querySelector('input[type="number"]');
          
          if (description.value) {
            await fetch(`${API_BASE}/plats/${platId}/preparations`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ordre: i + 1,
                description: description.value,
                duree_minutes: duree.value ? parseInt(duree.value) : null
              })
            });
          }
        }
      }
      
      document.getElementById('modal-plat').classList.remove('active');
      await loadPlats();
    } catch (err) {
      console.error('Erreur sauvegarde plat:', err);
      alert('Erreur lors de la sauvegarde');
    }
  });
  
  // Ajouter ingrédient
  document.getElementById('btn-add-ingredient').addEventListener('click', () => {
    addIngredientRow();
  });
  
  // Ajouter étape
  document.getElementById('btn-add-preparation').addEventListener('click', () => {
    addPreparationRow();
  });
}

function addIngredientRow() {
  const container = document.getElementById('plat-ingredients-list');
  const row = document.createElement('div');
  row.className = 'ingredient-row';
  row.innerHTML = `
    <select class="ingredient-select">
      <option value="">Sélectionner...</option>
      <option value="__new__" style="color: var(--primary); font-weight: 600;">➕ Créer un nouvel ingrédient...</option>
      ${state.ingredients.map(i => `<option value="${i.id}">${i.nom}</option>`).join('')}
    </select>
    <input type="number" placeholder="Quantité" step="0.1" min="0">
    <select>
      ${state.config.unites.map(u => `<option value="${u}">${u}</option>`).join('')}
    </select>
    <button type="button" class="btn-remove" onclick="this.parentElement.remove()">✕</button>
  `;
  
  // Écouter le changement sur le select pour détecter "Créer nouveau"
  const select = row.querySelector('.ingredient-select');
  select.addEventListener('change', async (e) => {
    if (e.target.value === '__new__') {
      e.target.value = ''; // Réinitialiser le select
      const newIngredient = await showQuickIngredientForm();
      if (newIngredient) {
        // Recharger la liste des ingrédients
        await loadIngredients();
        // Sélectionner le nouvel ingrédient
        e.target.innerHTML = `
          <option value="">Sélectionner...</option>
          <option value="__new__" style="color: var(--primary); font-weight: 600;">➕ Créer un nouvel ingrédient...</option>
          ${state.ingredients.map(i => `<option value="${i.id}">${i.nom}</option>`).join('')}
        `;
        e.target.value = newIngredient.id;
      }
    }
  });
  
  container.appendChild(row);
}

function addPreparationRow() {
  const container = document.getElementById('plat-preparations-list');
  const ordre = container.children.length + 1;
  const row = document.createElement('div');
  row.className = 'preparation-row';
  row.innerHTML = `
    <span style="font-weight: 600; width: 30px;">${ordre}.</span>
    <textarea placeholder="Description de l'étape..." rows="2"></textarea>
    <input type="number" placeholder="⏱ min" style="width: 80px;" min="0">
    <button type="button" class="btn-remove" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(row);
}

// Formulaire ingrédient
function setupIngredientForm() {
  const form = document.getElementById('form-ingredient');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const ingredientData = {
      nom: document.getElementById('ingredient-nom').value,
      unite: document.getElementById('ingredient-unite').value,
      categorie: document.getElementById('ingredient-categorie').value
    };
    
    try {
      await fetch(`${API_BASE}/ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingredientData)
      });
      
      document.getElementById('modal-ingredient').classList.remove('active');
      await loadIngredients();
    } catch (err) {
      console.error('Erreur sauvegarde ingrédient:', err);
      alert('Erreur lors de la sauvegarde');
    }
  });
}

/**
 * Affiche un formulaire rapide pour créer un ingrédient depuis le modal de recette
 */
async function showQuickIngredientForm() {
  return new Promise((resolve) => {
    // Créer un overlay personnalisé
    const overlay = document.createElement('div');
    overlay.className = 'quick-form-overlay';
    overlay.innerHTML = `
      <div class="quick-form-card">
        <h3 style="margin-bottom: 1rem; color: var(--primary);">➕ Nouvel Ingrédient</h3>
        <form id="quick-ingredient-form">
          <div class="form-group">
            <label>Nom *</label>
            <input type="text" id="quick-ingredient-nom" required autofocus>
          </div>
          <div class="form-group">
            <label>Unité de base</label>
            <select id="quick-ingredient-unite">
              ${state.config.unites.map(u => `<option value="${u}">${u}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Catégorie</label>
            <select id="quick-ingredient-categorie">
              ${state.config.categories.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">💾 Créer</button>
            <button type="button" class="btn-secondary quick-cancel">Annuler</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Focus sur le champ nom
    setTimeout(() => {
      document.getElementById('quick-ingredient-nom').focus();
    }, 100);
    
    // Gérer l'annulation
    overlay.querySelector('.quick-cancel').addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(null);
    });
    
    // Gérer la soumission
    overlay.querySelector('#quick-ingredient-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const ingredientData = {
        nom: document.getElementById('quick-ingredient-nom').value,
        unite: document.getElementById('quick-ingredient-unite').value,
        categorie: document.getElementById('quick-ingredient-categorie').value
      };
      
      try {
        const response = await fetch(`${API_BASE}/ingredients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ingredientData)
        });
        
        const result = await response.json();
        document.body.removeChild(overlay);
        resolve({ id: result.id, ...ingredientData });
      } catch (err) {
        console.error('Erreur création ingrédient:', err);
        alert('Erreur lors de la création de l\'ingrédient');
        document.body.removeChild(overlay);
        resolve(null);
      }
    });
  });
}

// Calendrier
function setupCalendrier() {
  state.currentWeekStart = getMonday(new Date());
  
  document.getElementById('btn-prev-week').addEventListener('click', () => {
    state.currentWeekStart = new Date(state.currentWeekStart);
    state.currentWeekStart.setDate(state.currentWeekStart.getDate() - 7);
    loadCalendrierSemaine();
  });
  
  document.getElementById('btn-next-week').addEventListener('click', () => {
    state.currentWeekStart = new Date(state.currentWeekStart);
    state.currentWeekStart.setDate(state.currentWeekStart.getDate() + 7);
    loadCalendrierSemaine();
  });
  
  document.getElementById('btn-liste-courses').addEventListener('click', loadListeCourses);
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatDateFr(date) {
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  return date.toLocaleDateString('fr-FR', options);
}

async function loadCalendrierSemaine() {
  const dateDebut = formatDate(state.currentWeekStart);
  const dateFin = new Date(state.currentWeekStart);
  dateFin.setDate(dateFin.getDate() + 6);
  const dateFinStr = formatDate(dateFin);
  
  try {
    const response = await fetch(`${API_BASE}/menus/period?dateDebut=${dateDebut}&dateFin=${dateFinStr}`);
    const menus = await response.json();
    renderCalendrier(menus);
  } catch (err) {
    console.error('Erreur chargement calendrier:', err);
  }
}

function renderCalendrier(menus) {
  const container = document.getElementById('calendrier-grid');
  const weekLabel = document.getElementById('current-week');
  
  weekLabel.textContent = `Semaine du ${formatDateFr(state.currentWeekStart)}`;
  
  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  
  container.innerHTML = jours.map((jour, index) => {
    const date = new Date(state.currentWeekStart);
    date.setDate(date.getDate() + index);
    const dateStr = formatDate(date);
    
    const menu = menus.find(m => m.date === dateStr);
    
    return `
      <div class="jour-card">
        <div class="jour-header">${jour}</div>
        <div class="jour-date">${date.getDate()}/${date.getMonth() + 1}</div>
        ${menu && menu.plat_nom ? `
          <div class="jour-menu">
            <strong>${menu.plat_nom}</strong>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${menu.nombre_personnes} pers.
            </div>
          </div>
        ` : `
          <div class="menu-empty" style="padding: 1rem 0;">
            Aucun menu
          </div>
        `}
      </div>
    `;
  }).join('');
}

async function loadListeCourses() {
  const dateDebut = formatDate(state.currentWeekStart);
  const dateFin = new Date(state.currentWeekStart);
  dateFin.setDate(dateFin.getDate() + 6);
  const dateFinStr = formatDate(dateFin);
  
  try {
    const response = await fetch(`${API_BASE}/menus/liste-courses?dateDebut=${dateDebut}&dateFin=${dateFinStr}`);
    const ingredients = await response.json();
    
    const container = document.getElementById('liste-courses-content');
    
    if (ingredients.length === 0) {
      container.innerHTML = '<p class="menu-empty">Aucun ingrédient nécessaire</p>';
      return;
    }
    
    // Grouper par catégorie
    const grouped = {};
    ingredients.forEach(ing => {
      const cat = ing.categorie || 'Autres';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(ing);
    });
    
    container.innerHTML = Object.entries(grouped).map(([categorie, items]) => `
      <div class="categorie-ingredients">
        <h4>${categorie}</h4>
        ${items.map(item => `
          <div class="ingredient-item">
            <strong>${item.nom}</strong>: 
            ${Math.round(item.quantite_totale * 100) / 100} ${item.unite_recette}
            <span style="color: var(--text-secondary); font-size: 0.875rem;">
              (${item.dates})
            </span>
          </div>
        `).join('')}
      </div>
    `).join('');
  } catch (err) {
    console.error('Erreur chargement liste courses:', err);
  }
}

async function viewPlatDetails(platId) {
  // Pour l'instant, ouvre directement l'édition
  await editPlat(null, platId);
}

async function editPlat(event, platId) {
  if (event) event.stopPropagation();
  
  try {
    // Charger les détails complets du plat
    const response = await fetch(`${API_BASE}/plats/${platId}`);
    const plat = await response.json();
    
    // Mettre à jour l'état
    state.editingPlat = platId;
    
    // Remplir le formulaire
    document.getElementById('modal-plat-title').textContent = 'Modifier la Recette';
    document.getElementById('plat-nom').value = plat.nom || '';
    document.getElementById('plat-description').value = plat.description || '';
    document.getElementById('plat-temps').value = plat.temps_preparation || '';
    document.getElementById('plat-difficulte').value = plat.difficulte || 'Moyen';
    document.getElementById('plat-conseils').value = plat.conseils_chef || '';
    document.getElementById('plat-personnes').value = plat.nombre_personnes || 4;
    
    // Ajouter un champ caché pour le favori
    const favoriBadge = document.createElement('div');
    favoriBadge.innerHTML = `
      <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem;">
        <input type="checkbox" id="plat-favori" ${plat.favori ? 'checked' : ''}>
        <label for="plat-favori" style="margin: 0;">Marquer comme favori</label>
      </div>
    `;
    
    // Remplir les ingrédients
    const ingredientsContainer = document.getElementById('plat-ingredients-list');
    ingredientsContainer.innerHTML = '';
    if (plat.ingredients && plat.ingredients.length > 0) {
      plat.ingredients.forEach(ing => {
        const row = document.createElement('div');
        row.className = 'ingredient-row';
        row.innerHTML = `
          <select class="ingredient-select">
            <option value="">Sélectionner...</option>
            <option value="__new__" style="color: var(--primary); font-weight: 600;">➕ Créer un nouvel ingrédient...</option>
            ${state.ingredients.map(i => 
              `<option value="${i.id}" ${i.id === ing.id ? 'selected' : ''}>${i.nom}</option>`
            ).join('')}
          </select>
          <input type="number" placeholder="Quantité" step="0.1" min="0" value="${ing.quantite || ''}">
          <select>
            ${state.config.unites.map(u => 
              `<option value="${u}" ${u === ing.unite ? 'selected' : ''}>${u}</option>`
            ).join('')}
          </select>
          <button type="button" class="btn-remove" onclick="this.parentElement.remove()">✕</button>
        `;
        
        // Ajouter l'écouteur pour "Créer nouveau"
        const select = row.querySelector('.ingredient-select');
        select.addEventListener('change', async (e) => {
          if (e.target.value === '__new__') {
            e.target.value = ing.id; // Garder la valeur actuelle temporairement
            const newIngredient = await showQuickIngredientForm();
            if (newIngredient) {
              await loadIngredients();
              e.target.innerHTML = `
                <option value="">Sélectionner...</option>
                <option value="__new__" style="color: var(--primary); font-weight: 600;">➕ Créer un nouvel ingrédient...</option>
                ${state.ingredients.map(i => `<option value="${i.id}">${i.nom}</option>`).join('')}
              `;
              e.target.value = newIngredient.id;
            }
          }
        });
        
        ingredientsContainer.appendChild(row);
      });
    }
    
    // Remplir les préparations
    const preparationsContainer = document.getElementById('plat-preparations-list');
    preparationsContainer.innerHTML = '';
    if (plat.preparations && plat.preparations.length > 0) {
      plat.preparations.forEach((prep, index) => {
        const row = document.createElement('div');
        row.className = 'preparation-row';
        row.innerHTML = `
          <span style="font-weight: 600; width: 30px;">${index + 1}.</span>
          <textarea placeholder="Description de l'étape..." rows="2">${prep.description || ''}</textarea>
          <input type="number" placeholder="⏱ min" style="width: 80px;" min="0" value="${prep.duree_minutes || ''}">
          <button type="button" class="btn-remove" onclick="this.parentElement.remove()">✕</button>
        `;
        preparationsContainer.appendChild(row);
      });
    }
    
    // Ouvrir le modal
    document.getElementById('modal-plat').classList.add('active');
  } catch (err) {
    console.error('Erreur chargement plat pour édition:', err);
    alert('Erreur lors du chargement de la recette');
  }
}
