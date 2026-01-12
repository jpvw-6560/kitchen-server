// app.js - Application Cuisine Server

// Utilise l'origine actuelle au lieu de localhost codé en dur
// Cela permettra au client de fonctionner depuis n'importe quel appareil
const API_BASE = `${window.location.protocol}//${window.location.hostname}:3002/api`;

// Fonction utilitaire pour formater les quantités sans décimales inutiles
function formatQuantite(qte) {
  if (Number.isInteger(qte)) return qte;
  return parseFloat(qte.toFixed(2));
}

// État de l'application
const state = {
  currentView: 'plats',
  plats: [],
  ingredients: [],
  config: {},
  currentWeekStart: null,
  editingPlat: null,
  editingIngredient: null,
  editMode: false  // Mode édition désactivé par défaut
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

/**
 * Affiche une notification moderne (toast)
 * @param {string} message - Le message à afficher
 * @param {string} type - Type : 'info', 'success', 'warning', 'error' (défaut: 'info')
 * @param {number} duration - Durée d'affichage en ms (défaut: 3000)
 */
function showNotification(message, type = 'info', duration = 3000) {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span class="notification-icon">${icons[type]}</span>
    <span class="notification-message">${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  // Animation d'entrée
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Suppression automatique
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, duration);
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
  setupEditModeToggle();
  updateEditModeUI();  // Initialiser l'état des boutons
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

/**
 * Configure le toggle du mode édition
 */
function setupEditModeToggle() {
  const toggle = document.getElementById('edit-mode-switch');
  toggle.addEventListener('change', () => {
    state.editMode = toggle.checked;
    updateEditModeUI();
  });
}

/**
 * Met à jour l'interface selon le mode édition
 */
function updateEditModeUI() {
  const editMode = state.editMode;
  
  // Boutons de création
  const createButtons = [
    'btn-new-plat',
    'btn-new-ingredient'
  ];
  
  createButtons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.disabled = !editMode;
      btn.style.opacity = editMode ? '1' : '0.5';
      btn.style.cursor = editMode ? 'pointer' : 'not-allowed';
    }
  });
  
  // Re-render les listes pour appliquer les changements aux boutons d'action
  if (state.currentView === 'plats') {
    renderPlats();
  } else if (state.currentView === 'ingredients') {
    renderIngredients();
  }
}

// Rendu des plats
function renderPlats(platsToRender = state.plats) {
  const container = document.getElementById('plats-list');
  
  if (platsToRender.length === 0) {
    container.innerHTML = '<p class="menu-empty">Aucune recette trouvée</p>';
    return;
  }
  
  // Appliquer le tri si le select existe
  const sortPlats = document.getElementById('sort-plats');
  if (sortPlats) {
    const sortBy = sortPlats.value;
    
    // Créer une copie pour ne pas modifier l'original
    platsToRender = [...platsToRender];
    
    switch (sortBy) {
      case 'alpha':
        platsToRender.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
        break;
      case 'temps':
        platsToRender.sort((a, b) => (a.temps_preparation || 999) - (b.temps_preparation || 999));
        break;
      case 'difficulte':
        const difficulteOrder = { 'Facile': 1, 'Moyen': 2, 'Difficile': 3 };
        platsToRender.sort((a, b) => (difficulteOrder[a.difficulte] || 2) - (difficulteOrder[b.difficulte] || 2));
        break;
    }
  }
  
  container.innerHTML = platsToRender.map(plat => `
    <div class="card" onclick="viewPlatDetails(${plat.id})">
      <div class="card-header">
        <h3 class="card-title">${plat.nom}</h3>
        <div class="card-header-right">
          <span class="card-badge badge-${plat.difficulte.toLowerCase()}">${plat.difficulte}</span>
          ${plat.photo_principale ? `<img src="/${plat.photo_principale}" alt="${plat.nom}" class="card-photo">` : ''}
        </div>
      </div>
      ${plat.description ? `<p class="card-description">${plat.description}</p>` : ''}
      <div class="card-meta">
        ${plat.temps_preparation ? `<span>⏱ ${plat.temps_preparation} min</span>` : ''}
        <span>👥 ${plat.nombre_personnes} pers.</span>
        <span>🥕 ${plat.nb_ingredients} ingr.</span>
      </div>
      <div class="card-actions">
        <button class="btn-icon" onclick="viewRecette(event, ${plat.id})" title="Voir la recette">👁️</button>
        <button class="btn-icon btn-favori ${plat.favori ? 'active' : ''}" 
                onclick="toggleFavori(event, ${plat.id})" 
                title="Favori">⭐</button>
        <button class="btn-icon" onclick="editPlat(event, ${plat.id})" title="Modifier" 
                ${!state.editMode ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>✏️</button>
        <button class="btn-icon" onclick="deletePlat(event, ${plat.id})" title="Supprimer" 
                ${!state.editMode ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>🗑️</button>
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
                <button class="btn-icon" onclick="editIngredient(${ing.id})" title="Modifier" 
                        ${!state.editMode ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>✏️</button>
                <button class="btn-icon" onclick="deleteIngredient(${ing.id})" title="Supprimer" 
                        ${!state.editMode ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>🗑️</button>
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
  const filterIngredients = document.getElementById('filter-ingredients');
  const sortPlats = document.getElementById('sort-plats');
  
  // Fonction de filtrage et tri
  const applyFiltersAndSort = () => {
    const searchQuery = searchPlats.value.toLowerCase().trim();
    const ingredientFilter = filterIngredients.value.toLowerCase().trim();
    
    let filtered = state.plats;
    
    // Filtrer par nom/description
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.nom.toLowerCase().includes(searchQuery) || 
        (p.description && p.description.toLowerCase().includes(searchQuery))
      );
    }
    
    // Filtrer par ingrédient
    if (ingredientFilter) {
      filtered = filtered.filter(p => {
        // Vérifier si le plat contient l'ingrédient recherché
        return p.ingredients_list && p.ingredients_list.toLowerCase().includes(ingredientFilter);
      });
    }
    
    // Le tri est maintenant géré dans renderPlats()
    renderPlats(filtered);
  };
  
  searchPlats.addEventListener('input', applyFiltersAndSort);
  filterIngredients.addEventListener('input', applyFiltersAndSort);
  sortPlats.addEventListener('change', applyFiltersAndSort);
  
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
  
  if (!state.editMode) {
    showNotification('Veuillez activer le mode édition pour supprimer une recette.', 'warning');
    return;
  }
  
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

async function editIngredient(ingredientId) {
  if (!state.editMode) {
    showNotification('Veuillez activer le mode édition pour modifier un ingrédient.', 'warning');
    return;
  }
  
  try {
    // Charger les données de l'ingrédient
    const response = await fetch(`${API_BASE}/ingredients/${ingredientId}`);
    const ingredient = await response.json();
    
    // Remplir le formulaire
    document.getElementById('ingredient-nom').value = ingredient.nom;
    document.getElementById('ingredient-unite').value = ingredient.unite || '';
    document.getElementById('ingredient-categorie').value = ingredient.categorie || '';
    
    // Stocker l'ID pour l'édition
    state.editingIngredient = ingredientId;
    
    // Ouvrir le modal
    document.getElementById('modal-ingredient').classList.add('active');
  } catch (err) {
    console.error('Erreur chargement ingrédient:', err);
  }
}

async function deleteIngredient(ingredientId) {
  if (!state.editMode) {
    showNotification('Veuillez activer le mode édition pour supprimer un ingrédient.', 'warning');
    return;
  }
  
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
      const modal = btn.closest('.modal');
      // Support pour les deux systèmes : classe 'active' et style.display
      if (modal.classList.contains('active')) {
        modal.classList.remove('active');
      } else {
        modal.style.display = 'none';
      }
    });
  });
  
  // Fermeture en cliquant sur l'overlay (fond)
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (modal.classList.contains('active')) {
          modal.classList.remove('active');
        } else {
          modal.style.display = 'none';
        }
      }
    });
  });
  
  // Fermeture avec la touche Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(modal => {
        if (modal.classList.contains('active') || modal.style.display === 'flex') {
          if (modal.classList.contains('active')) {
            modal.classList.remove('active');
          } else {
            modal.style.display = 'none';
          }
        }
      });
    }
  });
  
  // Ouverture nouveau plat
  document.getElementById('btn-new-plat').addEventListener('click', () => {
    if (!state.editMode) {
      showNotification('Veuillez activer le mode édition pour créer une recette.', 'warning');
      return;
    }
    state.editingPlat = null;
    document.getElementById('modal-plat-title').textContent = 'Nouvelle Recette';
    document.getElementById('form-plat').reset();
    document.getElementById('plat-ingredients-list').innerHTML = '';
    document.getElementById('plat-preparations-list').innerHTML = '';
    document.getElementById('modal-plat').classList.add('active');
  });
  
  // Ouverture nouvel ingrédient
  document.getElementById('btn-new-ingredient').addEventListener('click', () => {
    if (!state.editMode) {
      showNotification('Veuillez activer le mode édition pour créer un ingrédient.', 'warning');
      return;
    }
    state.editingIngredient = null;
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
      showNotification('Erreur lors de la sauvegarde', 'error');
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
  
  // Ajouter médias
  document.getElementById('btn-add-media').addEventListener('click', () => {
    document.getElementById('media-file-input').click();
  });
  
  document.getElementById('media-file-input').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Vérifier qu'on est en mode édition (sinon il faut sauvegarder le plat d'abord)
    if (!state.editingPlat) {
      showNotification('Veuillez d\'abord enregistrer la recette avant d\'ajouter des médias', 'warning');
      e.target.value = '';
      return;
    }
    
    await uploadMediaFiles(state.editingPlat, files);
    e.target.value = ''; // Réinitialiser l'input
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
      const url = state.editingIngredient 
        ? `${API_BASE}/ingredients/${state.editingIngredient}` 
        : `${API_BASE}/ingredients`;
      const method = state.editingIngredient ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingredientData)
      });
      
      state.editingIngredient = null;
      document.getElementById('modal-ingredient').classList.remove('active');
      await loadIngredients();
    } catch (err) {
      console.error('Erreur sauvegarde ingrédient:', err);
      showNotification('Erreur lors de la sauvegarde', 'error');
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
        showNotification('Erreur lors de la création de l\'ingrédient', 'error');
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
  
  document.getElementById('btn-clear-week').addEventListener('click', clearWeek);
  document.getElementById('btn-liste-courses').addEventListener('click', loadListeCourses);
  
  document.getElementById('btn-select-all').addEventListener('click', () => {
    document.querySelectorAll('.menu-checkbox').forEach(cb => cb.checked = true);
    updateSelectionInfo();
  });
  
  document.getElementById('btn-deselect-all').addEventListener('click', () => {
    document.querySelectorAll('.menu-checkbox').forEach(cb => cb.checked = false);
    updateSelectionInfo();
  });
  
  document.getElementById('btn-preview-courses').addEventListener('click', showPreviewCourses);
}

function showPreviewCourses() {
  const modal = document.getElementById('modal-preview-courses');
  const content = document.getElementById('preview-courses-content');
  
  // Copier le contenu de la liste actuelle pour l'aperçu imprimable
  const sourceContent = document.getElementById('liste-courses-content').innerHTML;
  content.innerHTML = sourceContent;
  
  modal.style.display = 'block';
  
  // Fermer la modale
  modal.querySelector('.modal-close').onclick = () => {
    modal.style.display = 'none';
  };
  
  window.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  };
}

function getMonday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // Normaliser l'heure
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
    const date = new Date(state.currentWeekStart.getFullYear(), 
                          state.currentWeekStart.getMonth(), 
                          state.currentWeekStart.getDate() + index);
    const dateStr = formatDate(date);
    
    console.log(`${jour}: dateStr = ${dateStr}`);
    
    // Normaliser les dates des menus (enlever la partie temps)
    const menu = menus.find(m => {
      const menuDate = m.date.split('T')[0];
      return menuDate === dateStr;
    });
    
    return `
      <div class="jour-card" data-date="${dateStr}" data-jour="${jour}">
        <div class="jour-header">
          ${jour}
          <div style="display: flex; gap: 0.25rem; align-items: center;">
            ${menu && menu.plat_nom ? `<input type="checkbox" class="menu-checkbox" data-date="${dateStr}" checked style="cursor: pointer; width: 18px; height: 18px;">` : ''}
            <button class="btn-icon-small" onclick="openMenuModal('${dateStr}', '${jour}', ${menu ? menu.plat_id : null}, ${menu ? menu.nombre_personnes : 2}, ${menu ? `'${menu.notes || ''}'` : "''"})">
              ${menu ? '✏️' : '➕'}
            </button>
          </div>
        </div>
        <div class="jour-date">${date.getDate()}/${date.getMonth() + 1}</div>
        ${menu && menu.plat_nom ? `
          <div class="jour-menu" onclick="openMenuModal('${dateStr}', '${jour}', ${menu.plat_id}, ${menu.nombre_personnes}, '${menu.notes || ''}')">
            <strong>${menu.plat_nom}</strong>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${menu.nombre_personnes} pers.
            </div>
            ${menu.notes ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">${menu.notes}</div>` : ''}
          </div>
        ` : `
          <div class="menu-empty" style="padding: 1rem 0; cursor: pointer;" onclick="openMenuModal('${dateStr}', '${jour}', null, 2, '')">
            Cliquez pour ajouter
          </div>
        `}
      </div>
    `;
  }).join('');
  
  // Mettre à jour le compteur de sélection
  updateSelectionInfo();
  
  // Ajouter les event listeners pour les checkboxes
  setTimeout(() => {
    document.querySelectorAll('.menu-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', updateSelectionInfo);
    });
  }, 0);
}

function updateSelectionInfo() {
  const checkboxes = document.querySelectorAll('.menu-checkbox');
  const checked = document.querySelectorAll('.menu-checkbox:checked');
  const info = document.getElementById('selection-info');
  if (info) {
    info.textContent = `${checked.length} jour(s) sélectionné(s) sur ${checkboxes.length}`;
  }
}

async function loadListeCourses() {
  // Récupérer les dates sélectionnées
  const selectedCheckboxes = document.querySelectorAll('.menu-checkbox:checked');
  
  if (selectedCheckboxes.length === 0) {
    const container = document.getElementById('liste-courses-content');
    container.innerHTML = '<p class="menu-empty">Veuillez sélectionner au moins un jour</p>';
    return;
  }
  
  const selectedDates = Array.from(selectedCheckboxes).map(cb => cb.dataset.date);
  const dateDebut = selectedDates[0];
  const dateFin = selectedDates[selectedDates.length - 1];
  
  try {
    const response = await fetch(`${API_BASE}/menus/liste-courses?dateDebut=${dateDebut}&dateFin=${dateFin}`);
    const ingredients = await response.json();
    
    const container = document.getElementById('liste-courses-content');
    
    if (ingredients.length === 0) {
      container.innerHTML = '<p class="menu-empty">Aucun ingrédient nécessaire</p>';
      return;
    }
    
    // Séparer fruits/légumes des autres produits
    const fruitsLegumes = [];
    const autresProduits = [];
    
    ingredients.forEach(ing => {
      const cat = ing.categorie || 'Autres';
      const nom = ing.nom.toLowerCase();
      
      // Fruits, légumes, et produits frais (pommes de terre, carottes, oignons, etc.)
      if (cat.toLowerCase().includes('fruit') || 
          cat.toLowerCase().includes('légume') ||
          nom.includes('pomme de terre') ||
          nom.includes('carotte') ||
          nom.includes('oignon') ||
          nom.includes('ail') ||
          nom.includes('poireau') ||
          nom.includes('salade') ||
          nom.includes('tomate') ||
          nom.includes('courgette') ||
          nom.includes('aubergine') ||
          nom.includes('poivron') ||
          nom.includes('chou') ||
          nom.includes('navet') ||
          nom.includes('radis') ||
          nom.includes('céleri') ||
          nom.includes('épinard') ||
          nom.includes('scarolle')) {
        fruitsLegumes.push(ing);
      } else {
        autresProduits.push(ing);
      }
    });
    
    // Grouper par catégorie dans chaque section
    const groupedAutres = {};
    autresProduits.forEach(ing => {
      const cat = ing.categorie || 'Autres';
      if (!groupedAutres[cat]) groupedAutres[cat] = [];
      groupedAutres[cat].push(ing);
    });
    
    const groupedFL = {};
    fruitsLegumes.forEach(ing => {
      const cat = ing.categorie || 'Autres';
      if (!groupedFL[cat]) groupedFL[cat] = [];
      groupedFL[cat].push(ing);
    });
    
    // Générer le HTML avec deux sections
    let html = '';
    
    // Section 1: Epicerie
    if (Object.keys(groupedAutres).length > 0) {
      html += '<div style="margin-bottom: 1.5rem;">';
      html += '<h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: bold;">1. Epicerie</h3>';
      
      Object.entries(groupedAutres).forEach(([categorie, items]) => {
        items.forEach(item => {
          const qteRaw = Math.round(item.quantite_totale * 100) / 100;
          const qte = formatQuantite(qteRaw);
          const unite = item.unite_recette.toLowerCase() === 'pièce' || item.unite_recette.toLowerCase() === 'pièces' ? '' : item.unite_recette;
          const texte = unite ? `${qte} ${unite} ${item.nom}` : `${qte} ${item.nom}`;
          html += `
            <div style="display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.3rem; font-size: 0.95rem;">
              <span style="flex-shrink: 0;">☐</span>
              <span>${texte}</span>
            </div>
          `;
        });
      });
      
      html += '</div>';
    }
    
    // Section 2: Fruits et légumes
    if (Object.keys(groupedFL).length > 0) {
      html += '<div style="margin-bottom: 1.5rem;">';
      html += '<h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: bold;">2. Fruits et légumes</h3>';
      
      Object.entries(groupedFL).forEach(([categorie, items]) => {
        items.forEach(item => {
          const qteRaw = Math.round(item.quantite_totale * 100) / 100;
          const qte = formatQuantite(qteRaw);
          const unite = item.unite_recette.toLowerCase() === 'pièce' || item.unite_recette.toLowerCase() === 'pièces' ? '' : item.unite_recette;
          const texte = unite ? `${qte} ${unite} ${item.nom}` : `${qte} ${item.nom}`;
          html += `
            <div style="display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.3rem; font-size: 0.95rem;">
              <span style="flex-shrink: 0;">☐</span>
              <span>${texte}</span>
            </div>
          `;
        });
      });
      
      html += '</div>';
    }
    
    container.innerHTML = html;
    
    // Afficher le bouton d'aperçu
    document.getElementById('btn-preview-courses').style.display = 'inline-block';
  } catch (err) {
    console.error('Erreur chargement liste courses:', err);
  }
}

async function viewPlatDetails(platId) {
  // Pour l'instant, ouvre directement l'édition
  await editPlat(null, platId);
}

/**
 * Affiche la recette en mode pleine page (mode cuisine)
 */
async function viewRecette(event, platId) {
  if (event) event.stopPropagation();
  
  try {
    // Charger les détails complets du plat
    const response = await fetch(`${API_BASE}/plats/${platId}`);
    const plat = await response.json();
    
    // Créer la vue pleine page
    const viewer = document.createElement('div');
    viewer.className = 'recette-viewer';
    
    // Trouver la vidéo si elle existe
    const video = plat.medias?.find(m => m.type === 'video');
    
    viewer.innerHTML = `
      <div class="recette-viewer-header">
        <h1>${plat.nom}</h1>
        <div class="recette-viewer-actions">
          ${video ? `<button class="btn-primary" onclick="playRecetteVideo('${video.chemin_fichier}')">🎥 Voir la vidéo</button>` : ''}
          <button class="btn-secondary" onclick="closeRecetteViewer()">✕ Fermer</button>
        </div>
      </div>
      <div class="recette-viewer-content">
        <div class="recette-viewer-left">
          <h2>🥕 Ingrédients</h2>
          <div class="recette-viewer-meta">
            <span>👥 ${plat.nombre_personnes} personnes</span>
            ${plat.temps_preparation ? `<span>⏱ ${plat.temps_preparation} min</span>` : ''}
            <span class="badge-${plat.difficulte.toLowerCase()}">${plat.difficulte}</span>
          </div>
          ${plat.ingredients && plat.ingredients.length > 0 ? `
            <ul class="recette-viewer-ingredients">
              ${plat.ingredients.map(ing => `
                <li>
                  <span class="ingredient-quantite">${formatQuantite(ing.quantite)} ${ing.unite}</span>
                  <span class="ingredient-nom">${ing.nom}</span>
                </li>
              `).join('')}
            </ul>
          ` : '<p>Aucun ingrédient</p>'}
          ${plat.conseils_chef ? `
            <div class="recette-viewer-conseils">
              <h3>💡 Conseils du chef</h3>
              <p>${plat.conseils_chef}</p>
            </div>
          ` : ''}
        </div>
        <div class="recette-viewer-right">
          <h2>📝 Préparation</h2>
          ${plat.preparations && plat.preparations.length > 0 ? `
            <ol class="recette-viewer-steps">
              ${plat.preparations.map(prep => `
                <li>
                  <div class="step-description">${prep.description}</div>
                  ${prep.duree_minutes ? `<div class="step-duration">⏱ ${prep.duree_minutes} min</div>` : ''}
                </li>
              `).join('')}
            </ol>
          ` : '<p>Aucune étape de préparation</p>'}
        </div>
      </div>
    `;
    
    document.body.appendChild(viewer);
    
    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';
  } catch (err) {
    console.error('Erreur chargement recette:', err);
    showNotification('Erreur lors du chargement de la recette', 'error');
  }
}

/**
 * Ferme la vue pleine page
 */
function closeRecetteViewer() {
  const viewer = document.querySelector('.recette-viewer');
  if (viewer) {
    viewer.remove();
    document.body.style.overflow = '';
  }
}

/**
 * Affiche la vidéo de la recette
 */
function playRecetteVideo(cheminFichier) {
  const modal = document.createElement('div');
  modal.className = 'media-viewer-modal';
  modal.innerHTML = `<video src="/${cheminFichier}" controls autoplay style="max-width: 90vw; max-height: 90vh;"></video>`;
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
  document.body.appendChild(modal);
}

/**
 * Affiche la recette en mode pleine page (mode cuisine)
 */
async function viewRecette(event, platId) {
  if (event) event.stopPropagation();
  
  try {
    // Charger les détails complets du plat
    const response = await fetch(`${API_BASE}/plats/${platId}`);
    const plat = await response.json();
    
    // Créer la vue pleine page
    const viewer = document.createElement('div');
    viewer.className = 'recette-viewer';
    
    // Trouver la vidéo si elle existe
    const video = plat.medias?.find(m => m.type === 'video');
    
    viewer.innerHTML = `
      <div class="recette-viewer-header">
        <h1>${plat.nom}</h1>
        <div class="recette-viewer-actions">
          ${video ? `<button class="btn-primary" onclick="playRecetteVideo('${video.chemin_fichier}')">🎥 Voir la vidéo</button>` : ''}
          <button class="btn-secondary" onclick="closeRecetteViewer()">✕ Fermer</button>
        </div>
      </div>
      <div class="recette-viewer-content">
        <div class="recette-viewer-left">
          <h2>🥕 Ingrédients</h2>
          <div class="recette-viewer-meta">
            <span>👥 ${plat.nombre_personnes} personnes</span>
            ${plat.temps_preparation ? `<span>⏱ ${plat.temps_preparation} min</span>` : ''}
            <span class="badge-${plat.difficulte.toLowerCase()}">${plat.difficulte}</span>
          </div>
          ${plat.ingredients && plat.ingredients.length > 0 ? `
            <ul class="recette-viewer-ingredients">
              ${plat.ingredients.map(ing => `
                <li>
                  <span class="ingredient-quantite">${formatQuantite(ing.quantite)} ${ing.unite}</span>
                  <span class="ingredient-nom">${ing.nom}</span>
                </li>
              `).join('')}
            </ul>
          ` : '<p>Aucun ingrédient</p>'}
          ${plat.conseils_chef ? `
            <div class="recette-viewer-conseils">
              <h3>💡 Conseils du chef</h3>
              <p>${plat.conseils_chef}</p>
            </div>
          ` : ''}
        </div>
        <div class="recette-viewer-right">
          <h2>📝 Préparation</h2>
          ${plat.preparations && plat.preparations.length > 0 ? `
            <ol class="recette-viewer-steps">
              ${plat.preparations.map(prep => `
                <li>
                  <div class="step-description">${prep.description}</div>
                  ${prep.duree_minutes ? `<div class="step-duration">⏱ ${prep.duree_minutes} min</div>` : ''}
                </li>
              `).join('')}
            </ol>
          ` : '<p>Aucune étape de préparation</p>'}
        </div>
      </div>
    `;
    
    document.body.appendChild(viewer);
    
    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';
  } catch (err) {
    console.error('Erreur chargement recette:', err);
    showNotification('Erreur lors du chargement de la recette', 'error');
  }
}

/**
 * Ferme la vue pleine page
 */
function closeRecetteViewer() {
  const viewer = document.querySelector('.recette-viewer');
  if (viewer) {
    viewer.remove();
    document.body.style.overflow = '';
  }
}

/**
 * Affiche la vidéo de la recette
 */
function playRecetteVideo(cheminFichier) {
  const modal = document.createElement('div');
  modal.className = 'media-viewer-modal';
  modal.innerHTML = `<video src="/${cheminFichier}" controls autoplay style="max-width: 90vw; max-height: 90vh;"></video>`;
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
  document.body.appendChild(modal);
}

async function editPlat(event, platId) {
  if (event) event.stopPropagation();
  
  if (!state.editMode) {
    showNotification('Veuillez activer le mode édition pour modifier une recette.', 'warning');
    return;
  }
  
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
    
    // Remplir les médias
    await loadMediasForPlat(platId);
    
    // Ouvrir le modal
    document.getElementById('modal-plat').classList.add('active');
  } catch (err) {
    console.error('Erreur chargement plat pour édition:', err);
    showNotification('Erreur lors du chargement de la recette', 'error');
  }
}

/**
 * Charge et affiche les médias d'un plat
 */
async function loadMediasForPlat(platId) {
  try {
    const response = await fetch(`${API_BASE}/medias/plat/${platId}`);
    const medias = await response.json();
    
    const container = document.getElementById('plat-medias-list');
    container.innerHTML = '';
    
    if (medias.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">Aucun média pour cette recette</p>';
      return;
    }
    
    medias.forEach(media => {
      const mediaCard = document.createElement('div');
      mediaCard.className = 'media-card';
      
      if (media.type === 'image') {
        mediaCard.innerHTML = `
          <img src="/${media.chemin_fichier}" alt="${media.nom_original}" onclick="viewMedia('${media.chemin_fichier}', 'image')">
          <div class="media-overlay">
            <button class="btn-media-delete" onclick="deleteMedia(${media.id})" title="Supprimer">🗑️</button>
          </div>
          <div class="media-principale">
            <input type="checkbox" id="principale_${media.id}" ${media.principale ? 'checked' : ''} 
                   onclick="setPrincipale(${media.id}, event)">
            <label for="principale_${media.id}" title="Photo principale">⭐</label>
          </div>
        `;
      } else if (media.type === 'video') {
        mediaCard.innerHTML = `
          <video src="/${media.chemin_fichier}" onclick="viewMedia('${media.chemin_fichier}', 'video')"></video>
          <div class="media-overlay">
            <button class="btn-media-delete" onclick="deleteMedia(${media.id})" title="Supprimer">🗑️</button>
            <span class="media-type-badge">🎥</span>
          </div>
        `;
      }
      
      container.appendChild(mediaCard);
    });
  } catch (err) {
    console.error('Erreur chargement médias:', err);
  }
}

/**
 * Upload de fichiers médias
 */
async function uploadMediaFiles(platId, files) {
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append('media', file);
    formData.append('plat_id', platId);
    
    try {
      const response = await fetch(`${API_BASE}/medias/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Erreur upload ${file.name}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error(`Erreur upload ${file.name}:`, err);
      throw err;
    }
  });
  
  try {
    await Promise.all(uploadPromises);
    console.log('Tous les médias uploadés avec succès');
    // Recharger les médias
    await loadMediasForPlat(platId);
  } catch (err) {
    showNotification('Erreur lors de l\'upload de certains fichiers', 'error');
  }
}

/**
 * Supprime un média
 */
async function deleteMedia(mediaId) {
  const confirmed = await showConfirmDialog(
    'Voulez-vous vraiment supprimer ce média ?',
    'Suppression',
    '🗑️'
  );
  
  if (!confirmed) return;
  
  try {
    const response = await fetch(`${API_BASE}/medias/${mediaId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Erreur suppression');
    }
    
    // Recharger les médias
    await loadMediasForPlat(state.editingPlat);
  } catch (err) {
    console.error('Erreur suppression média:', err);
    showNotification('Erreur lors de la suppression du média', 'error');
  }
}

/**
 * Affiche un média en plein écran
 */
function viewMedia(chemin, type) {
  const modal = document.createElement('div');
  modal.className = 'media-viewer-modal';
  modal.onclick = () => modal.remove();
  
  if (type === 'image') {
    modal.innerHTML = `<img src="/${chemin}" alt="Media">`;
  } else if (type === 'video') {
    modal.innerHTML = `<video src="/${chemin}" controls autoplay></video>`;
  }
  
  document.body.appendChild(modal);
}

/**
 * Définit un média comme photo principale
 */
async function setPrincipale(mediaId, event) {
  event.stopPropagation();
  
  try {
    const response = await fetch(`${API_BASE}/medias/${mediaId}/principale`, {
      method: 'PATCH'
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour');
    }
    
    // Recharger les médias pour mettre à jour l'affichage
    await loadMediasForPlat(state.editingPlat);
    
    // Recharger les plats pour mettre à jour la carte
    await loadPlats();
  } catch (err) {
    console.error('Erreur setPrincipale:', err);
    showNotification('Erreur lors de la définition de la photo principale', 'error');
  }
}
// ============================================
// GESTION DU MENU DU JOUR
// ============================================

let selectedPlatForMenu = null;
let searchMenuTimeout;
let menuSearchInitialized = false;

/**
 * Ouvre la modale pour planifier un menu
 */
async function openMenuModal(dateStr, jour, platId = null, nbPersonnes = 2, notes = "") {
  const modal = document.getElementById("modal-menu");
  const title = document.getElementById("modal-menu-title");
  const dateLabel = document.getElementById("menu-date-label");
  const deleteBtn = document.getElementById("btn-delete-menu");
  
  // Configurer la modale
  document.getElementById("menu-date").value = dateStr;
  const date = new Date(dateStr + "T12:00:00");
  dateLabel.textContent = `${jour} ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;
  document.getElementById("menu-personnes").value = nbPersonnes;
  document.getElementById("menu-notes").value = notes || "";
  document.getElementById("menu-search").value = "";
  document.getElementById("menu-recettes-list").style.display = "none";
  
  // Si un plat est déjà planifié, charger ses infos
  if (platId && platId !== "null") {
    title.textContent = "Modifier le menu";
    deleteBtn.style.display = "inline-block";
    deleteBtn.onclick = () => deleteMenu(dateStr);
    
    try {
      const response = await fetch(`${API_BASE}/plats/${platId}`);
      const plat = await response.json();
      selectedPlatForMenu = plat;
      displaySelectedPlat(plat);
    } catch (err) {
      console.error("Erreur chargement plat:", err);
    }
  } else {
    title.textContent = "Planifier un menu";
    deleteBtn.style.display = "none";
    selectedPlatForMenu = null;
    document.getElementById("menu-selected-plat").innerHTML = "";
  }
  
  // Initialiser la recherche si pas encore fait
  if (!menuSearchInitialized) {
    const searchInput = document.getElementById("menu-search");
    const resultsList = document.getElementById("menu-recettes-list");
    
    if (searchInput && resultsList) {
      console.log("Initialisation de la recherche menu");
      
      searchInput.addEventListener("input", async (e) => {
        clearTimeout(searchMenuTimeout);
        const query = e.target.value.trim();
        
        console.log("Recherche:", query);
        
        if (query.length < 2) {
          resultsList.style.display = "none";
          return;
        }
        
        searchMenuTimeout = setTimeout(async () => {
          try {
            const response = await fetch(`${API_BASE}/plats`);
            const plats = await response.json();
            
            console.log("Plats récupérés:", plats.length);
            console.log("Noms des plats:", plats.map(p => p.nom).join(", "));
            
            const filtered = plats.filter(p => 
              p.nom.toLowerCase().includes(query.toLowerCase())
            );
            
            console.log("Plats filtrés:", filtered.length);
            console.log("Recherche:", query);
            
            if (filtered.length === 0) {
              resultsList.innerHTML = '<div style="padding: 1rem; color: var(--text-secondary);">Aucune recette trouvée</div>';
              resultsList.style.display = "block";
              return;
            }
            
            resultsList.innerHTML = filtered.map(plat => {
              const nomEchape = plat.nom.replace(/'/g, "\\'");
              const diffEchape = (plat.difficulte || "").replace(/'/g, "\\'");
              return `
                <div class="search-result-item" onclick="selectPlatForMenu(${plat.id}, '${nomEchape}', ${plat.temps_preparation || 0}, '${diffEchape}')">
                  <strong>${plat.nom}</strong>
                  <div style="font-size: 0.875rem; color: var(--text-secondary);">
                    ${plat.temps_preparation ? `⏱️ ${plat.temps_preparation} min` : ""} 
                    ${plat.difficulte ? `• ${plat.difficulte}` : ""}
                  </div>
                </div>
              `;
            }).join("");
            
            resultsList.style.display = "block";
          } catch (err) {
            console.error("Erreur recherche:", err);
          }
        }, 300);
      });
      
      menuSearchInitialized = true;
    }
  }
  
  modal.classList.add('active');
  
  // Focus sur le champ de recherche
  setTimeout(() => document.getElementById("menu-search").focus(), 100);
}

/**
 * Affiche le plat sélectionné
 */
function displaySelectedPlat(plat) {
  const container = document.getElementById("menu-selected-plat");
  container.innerHTML = `
    <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius); border: 2px solid var(--primary);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${plat.nom}</strong>
          <div style="font-size: 0.875rem; color: var(--text-secondary);">
            ${plat.temps_preparation ? `⏱️ ${plat.temps_preparation} min` : ""} 
            ${plat.difficulte ? `• ${plat.difficulte}` : ""}
          </div>
        </div>
        <button type="button" onclick="clearSelectedPlat()" class="btn-icon-small" title="Changer de recette">❌</button>
      </div>
    </div>
  `;
  document.getElementById("menu-recettes-list").style.display = "none";
}

/**
 * Efface le plat sélectionné
 */
function clearSelectedPlat() {
  selectedPlatForMenu = null;
  document.getElementById("menu-selected-plat").innerHTML = "";
  document.getElementById("menu-search").value = "";
  document.getElementById("menu-search").focus();
}

/**
 * Sélectionne un plat pour le menu
 */
function selectPlatForMenu(id, nom, temps, difficulte) {
  selectedPlatForMenu = { id, nom, temps_preparation: temps, difficulte };
  displaySelectedPlat(selectedPlatForMenu);
}


/**
 * Enregistre le menu
 */
async function saveMenu() {
  if (!selectedPlatForMenu) {
    showNotification("Veuillez sélectionner une recette", "warning");
    return;
  }
  
  const dateStr = document.getElementById("menu-date").value;
  const nbPersonnes = parseInt(document.getElementById("menu-personnes").value);
  const notes = document.getElementById("menu-notes").value;
  
  console.log("Sauvegarde menu pour la date:", dateStr);
  
  try {
    const response = await fetch(`${API_BASE}/menus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: dateStr,
        plat_id: selectedPlatForMenu.id,
        nombre_personnes: nbPersonnes,
        notes: notes
      })
    });
    
    if (!response.ok) throw new Error("Erreur lors de la sauvegarde");
    
    document.getElementById("modal-menu").classList.remove('active');
    await loadCalendrierSemaine();
    
  } catch (err) {
    console.error("Erreur sauvegarde menu:", err);
    showNotification("Erreur lors de la sauvegarde du menu", "error");
  }
}

/**
 * Supprime un menu
 */
async function deleteMenu(dateStr) {
  console.log("Tentative de suppression pour la date:", dateStr);
  
  if (!confirm("Voulez-vous vraiment supprimer ce menu ?")) return;
  
  try {
    const response = await fetch(`${API_BASE}/menus/${dateStr}`, {
      method: "DELETE"
    });
    
    console.log("Réponse suppression:", response.status);
    
    if (!response.ok) throw new Error("Erreur lors de la suppression");
    
    document.getElementById("modal-menu").classList.remove('active');
    await loadCalendrierSemaine();
    
  } catch (err) {
    console.error("Erreur suppression menu:", err);
    showNotification("Erreur lors de la suppression du menu", "error");
  }
}

/**
 * Supprime tous les menus de la semaine affichée
 */
async function clearWeek() {
  if (!confirm("Voulez-vous vraiment vider tous les menus de cette semaine ?")) return;
  
  try {
    // Générer les 7 dates de la semaine
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(state.currentWeekStart);
      date.setDate(date.getDate() + i);
      dates.push(formatDate(date));
    }
    
    // Supprimer chaque date
    const promises = dates.map(dateStr => 
      fetch(`${API_BASE}/menus/${dateStr}`, { method: "DELETE" })
    );
    
    await Promise.all(promises);
    
    await loadCalendrierSemaine();
    
  } catch (err) {
    console.error("Erreur vidage semaine:", err);
    showNotification("Erreur lors du vidage de la semaine", "error");
  }
}

// Gérer la soumission du formulaire menu au chargement
document.addEventListener('DOMContentLoaded', () => {
  const formMenu = document.getElementById("form-menu");
  if (formMenu) {
    formMenu.addEventListener("submit", async (e) => {
      e.preventDefault();
      await saveMenu();
    });
  }
});
