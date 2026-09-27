// app.js - Application Cuisine Server

// Utilise l'origine actuelle au lieu de localhost codé en dur
// Cela permettra au client de fonctionner depuis n'importe quel appareil
const API_BASE = `${window.location.protocol}//${window.location.hostname}:3002/api`;

// Fonction utilitaire pour formater les quantités sans décimales inutiles
function formatQuantite(qte) {
  // Vérifier si qte est valide
  if (qte === null || qte === undefined || qte === '') return '0';
  
  // Convertir en nombre si c'est une chaîne
  const num = typeof qte === 'string' ? parseFloat(qte) : qte;
  
  // Vérifier si c'est un nombre valide
  if (isNaN(num)) return '0';
  
  // Formater
  if (Number.isInteger(num)) return num;
  return parseFloat(num.toFixed(2));
}

// État de l'application
const state = {
  currentView: 'plats',
  plats: [],
  ingredients: [],
  categories: [], // Cache des catégories
  config: {},
  currentWeekStart: null,
  editingPlat: null,
  editingIngredient: null,
  editMode: false,  // Mode édition désactivé par défaut
  typeFilter: 'all'  // Filtre type: 'all', 'Plat', 'Dessert'
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
  setupFilterToggle();
  updateEditModeUI();  // Initialiser l'état des boutons
});

// Toggle des filtres sur mobile
function setupFilterToggle() {
  const toggleBtn = document.getElementById('toggle-filters-btn');
  const filtersContent = document.getElementById('filters-content');
  
  if (toggleBtn && filtersContent) {
    toggleBtn.addEventListener('click', () => {
      toggleBtn.classList.toggle('collapsed');
      filtersContent.classList.toggle('expanded');
    });
  }
  
  // Toggle pour la sidebar des ingrédients
  const toggleIngredientsBtn = document.getElementById('toggle-ingredients-filters-btn');
  const ingredientsFiltersContent = document.getElementById('ingredients-filters-content');
  
  if (toggleIngredientsBtn && ingredientsFiltersContent) {
    toggleIngredientsBtn.addEventListener('click', () => {
      toggleIngredientsBtn.classList.toggle('collapsed');
      ingredientsFiltersContent.classList.toggle('expanded');
    });
  }
}

// Chargement des données
async function loadConfig() {
  try {
    const response = await fetch(`${API_BASE}/config`);
    state.config = await response.json();
  } catch (err) {
    console.error('Erreur chargement config:', err);
  }
}

async function loadCategoriesDropdown() {
  try {
    const response = await fetch(`${API_BASE}/ingredients/categories`);
    state.categories = await response.json();
    
    const categorieSelect = document.getElementById('ingredient-categorie');
    categorieSelect.innerHTML = '<option value="">-- Choisir une catégorie --</option>' + 
      state.categories.map(c => `<option value="${c}">${c}</option>`).join('');
  } catch (err) {
    console.error('Erreur chargement catégories:', err);
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
    populateRecipeComponentSelects();
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
  console.log('Setup navigation - attaching event listeners');
  
  // Navigation des boutons
  const navButtons = document.querySelectorAll('.nav-btn');
  console.log('Found', navButtons.length, 'navigation buttons');
  
  navButtons.forEach((btn, index) => {
    console.log('Button', index, ':', btn.dataset.view);
    btn.addEventListener('click', (e) => {
      console.log('Button clicked:', btn.dataset.view);
      const view = btn.dataset.view;
      switchView(view);
      // Fermer le menu mobile après sélection
      closeMobileMenu();
    });
  });
  
  // Menu hamburger
  const hamburger = document.getElementById('hamburger-btn');
  const navMenu = document.getElementById('nav-menu');
  const overlay = document.getElementById('mobile-menu-overlay');
  
  console.log('Hamburger:', hamburger ? 'found' : 'NOT FOUND');
  console.log('Nav menu:', navMenu ? 'found' : 'NOT FOUND');
  console.log('Overlay:', overlay ? 'found' : 'NOT FOUND');
  
  if (hamburger) {
    hamburger.addEventListener('click', (e) => {
      console.log('Hamburger clicked!');
      e.stopPropagation(); // Empêcher la propagation du clic
      e.preventDefault();
      toggleMobileMenu();
    });
  }
  
  // Fermer le menu si on clique en dehors
  document.addEventListener('click', (e) => {
    const navMenu = document.getElementById('nav-menu');
    const hamburger = document.getElementById('hamburger-btn');
    
    if (navMenu && navMenu.classList.contains('active')) {
      // Vérifier si le clic est en dehors du menu et du hamburger
      if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
        console.log('Click outside menu - closing');
        closeMobileMenu();
      }
    }
  });
}

function toggleMobileMenu() {
  console.log('toggleMobileMenu called');
  const hamburger = document.getElementById('hamburger-btn');
  const navMenu = document.getElementById('nav-menu');
  const overlay = document.getElementById('mobile-menu-overlay');
  
  hamburger.classList.toggle('open');
  navMenu.classList.toggle('active');
  overlay.classList.toggle('active');
  
  console.log('Menu active:', navMenu.classList.contains('active'));
  
  // Empêcher le scroll du body quand le menu est ouvert
  document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
}

function closeMobileMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const navMenu = document.getElementById('nav-menu');
  const overlay = document.getElementById('mobile-menu-overlay');
  
  if (hamburger && navMenu && overlay) {
    hamburger.classList.remove('open');
    navMenu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    console.log('Menu closed');
  }
}

function switchView(viewName) {
  console.log('switchView called with:', viewName);
  
  // Mettre à jour les boutons de navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  
  // Mettre à jour les vues
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  
  const targetView = document.getElementById(`view-${viewName}`);
  console.log('Target view:', targetView ? 'found' : 'NOT FOUND');
  
  if (targetView) {
    targetView.classList.add('active');
    console.log('View switched to:', viewName);
  }
  
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
  
  // Bouton Vider la semaine (calendrier) - masquer/afficher
  const clearWeekBtn = document.getElementById('btn-clear-week');
  if (clearWeekBtn) {
    clearWeekBtn.style.display = editMode ? 'block' : 'none';
  }
  
  // Re-render les listes pour appliquer les changements aux boutons d'action
  if (state.currentView === 'plats') {
    // Utiliser applyFiltersAndSort pour maintenir le filtre actif
    const searchPlats = document.getElementById('search-plats');
    const filterIngredients = document.getElementById('filter-ingredients');
    const sortPlats = document.getElementById('sort-plats');
    
    const searchQuery = searchPlats.value.toLowerCase().trim();
    const ingredientFilter = filterIngredients.value.toLowerCase().trim();
    
    let filtered = state.plats;
    
    // Filtrer par type (Plat/Dessert)
    if (state.typeFilter && state.typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === state.typeFilter);
    }
    
    // Filtrer par nom/description
    if (searchQuery) {
      filtered = filtered.filter(p => 
        matchesRecipeSearch(p, searchQuery) ||
        (p.description && p.description.toLowerCase().includes(searchQuery))
      );
    }
    
    // Filtrer par ingrédient
    if (ingredientFilter) {
      filtered = filtered.filter(p => {
        return matchesRecipeSearch(p, ingredientFilter);
      });
    }
    
    renderPlats(filtered);
  } else if (state.currentView === 'ingredients') {
    renderIngredients();
  }
}

function matchesRecipeSearch(plat, query) {
  const searchableText = [
    plat.nom,
    plat.feculent_nom,
    plat.legume_nom,
    plat.proteine_nom,
    plat.composants_list,
    plat.ingredients_list
  ].filter(Boolean).join(' ').toLocaleLowerCase('fr');

  return query.toLocaleLowerCase('fr').split(/\s+/).filter(Boolean)
    .every(term => searchableText.includes(term));
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
          <span class="card-badge badge-type">${
            plat.type === 'Dessert' ? '🍰 Dessert' : 
            plat.type === 'Sauce' ? '🍶 Sauce' :
            plat.type === 'Confiture' ? '🍯 Confiture' :
            '🍽️ Plat'
          }</span>
          <span class="card-badge badge-${plat.difficulte.toLowerCase()}">${plat.difficulte}</span>
        </div>
      </div>
      ${plat.photo_principale ? `<img src="/${plat.photo_principale}" alt="${plat.nom}" class="card-photo">` : ''}
      ${plat.description ? `<p class="card-description">${plat.description}</p>` : ''}
      ${plat.composants_list ? `<p class="card-components">${plat.composants_list}</p>` : ''}
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
        <button class="btn-icon" onclick="duplicatePlat(event, ${plat.id})" title="Dupliquer" 
                ${!state.editMode ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>📋</button>
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
    container.innerHTML = '<p class="menu-empty">Aucune recette</p>';
    return;
  }
  
  container.innerHTML = favoris.map(plat => `
    <div class="card" onclick="viewPlatDetails(${plat.id})">
      <div class="card-header">
        <h3 class="card-title">${plat.favori ? '⭐ ' : ''}${plat.nom}</h3>
        <span class="card-badge badge-${plat.difficulte.toLowerCase()}">${plat.difficulte}</span>
      </div>
      ${plat.description ? `<p class="card-description">${plat.description}</p>` : ''}
      <div class="card-meta">
        ${plat.temps_preparation ? `<span>⏱ ${plat.temps_preparation} min</span>` : ''}
        <span>👥 ${plat.nombre_personnes} pers.</span>
        <span>📊 ${plat.nb_occurrences || 0}×</span>
      </div>
    </div>
  `).join('');
}

// Rendu de la liste alphabétique des ingrédients
async function renderIngredients(ingredientsToRender = state.ingredients) {
  const container = document.getElementById('ingredients-list');
  container.innerHTML = `
    <table class="ingredients-table">
      <thead><tr><th>Nom</th><th>Actions</th></tr></thead>
      <tbody>
        ${ingredientsToRender.map(ingredient => `
          <tr>
            <td>${ingredient.nom}</td>
            <td>
              <button class="btn-icon" onclick="editIngredient(${ingredient.id})" title="Modifier"
                      ${!state.editMode ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>✏️</button>
              <button class="btn-icon" onclick="deleteIngredient(${ingredient.id})" title="Supprimer"
                      ${!state.editMode ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>🗑️</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Toggle catégorie d'ingrédients
function toggleCategorie(categoryId) {
  const content = document.getElementById(`cat-${categoryId}`);
  const button = content.previousElementSibling;
  const icon = button.querySelector('.categorie-icon');
  
  if (content.classList.contains('open')) {
    content.classList.remove('open');
    icon.textContent = '▶';
  } else {
    content.classList.add('open');
    icon.textContent = '▼';
  }
}

// Gestion des catégories
async function openCategoriesModal() {
  const modal = document.getElementById('modal-categories');
  modal.classList.add('active');
  await loadCategoriesList();
}

async function loadCategoriesList() {
  try {
    const response = await fetch(`${API_BASE}/ingredients/categories`);
    const categories = await response.json();
    
    const container = document.getElementById('categories-list');
    
    if (categories.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Aucune catégorie</p>';
      return;
    }
    
    // Récupérer le nombre d'ingrédients par catégorie
    const countsPromises = categories.map(cat => 
      fetch(`${API_BASE}/ingredients/categorie/${encodeURIComponent(cat)}`)
        .then(r => r.json())
        .then(ings => ({ name: cat, count: ings.length }))
    );
    const categoriesWithCount = await Promise.all(countsPromises);
    
    container.innerHTML = categoriesWithCount.map(cat => `
      <div class="category-item" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 0.5rem; background: var(--bg-secondary);">
        <div>
          <span style="font-weight: 600; color: var(--text-primary);">${cat.name}</span>
          <span style="color: var(--text-secondary); margin-left: 0.5rem; font-size: 0.875rem;">(${cat.count} ingrédient${cat.count > 1 ? 's' : ''})</span>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-icon" onclick="renameCategory('${cat.name.replace(/'/g, "\\'")}', ${cat.count})" title="Renommer">✏️</button>
          <button class="btn-icon" onclick="deleteCategory('${cat.name.replace(/'/g, "\\'")}', ${cat.count})" title="Supprimer" 
                  ${cat.count > 0 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>🗑️</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Erreur loadCategoriesList:', err);
    showNotification('Erreur lors du chargement des catégories', 'error');
  }
}

// Initialisation des handlers pour les catégories
function setupCategoriesHandlers() {
  const btnAddCategory = document.getElementById('btn-add-category');
  if (btnAddCategory) {
    btnAddCategory.addEventListener('click', async () => {
      const input = document.getElementById('new-category-name');
      const name = input.value.trim();
      
      if (!name) {
        showNotification('Veuillez saisir un nom de catégorie', 'warning');
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE}/ingredients/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom: name })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erreur lors de la création');
        }
        
        input.value = '';
        await loadCategoriesList();
        await loadCategoriesDropdown(); // Recharger le dropdown aussi
        await loadIngredients();
        showNotification('Catégorie créée avec succès', 'success');
      } catch (err) {
        console.error('Erreur addCategory:', err);
        showNotification(err.message || 'Erreur lors de l\'ajout de la catégorie', 'error');
      }
    });
  }
}

async function renameCategory(oldName, count) {
  const newName = prompt(`Renommer la catégorie "${oldName}" (${count} ingrédient${count > 1 ? 's' : ''}) :`, oldName);
  
  if (!newName || newName.trim() === '' || newName === oldName) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/ingredients/categories/${encodeURIComponent(oldName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName: newName.trim() })
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors du renommage');
    }
    
    await loadCategoriesList();
    await loadCategoriesDropdown(); // Recharger le dropdown aussi
    await loadIngredients();
    showNotification('Catégorie renommée avec succès', 'success');
  } catch (err) {
    console.error('Erreur renameCategory:', err);
    showNotification('Erreur lors du renommage de la catégorie', 'error');
  }
}

async function deleteCategory(name, count) {
  if (count > 0) {
    showNotification('Cette catégorie contient des ingrédients et ne peut pas être supprimée', 'warning');
    return;
  }
  
  if (!confirm(`Supprimer la catégorie "${name}" ?`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/ingredients/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erreur lors de la suppression');
    }
    
    await loadCategoriesList();
    showNotification('Catégorie supprimée avec succès', 'success');
  } catch (err) {
    console.error('Erreur deleteCategory:', err);
    showNotification(err.message || 'Erreur lors de la suppression de la catégorie', 'error');
  }
}

// Recherche
function setupSearchHandlers() {
  const searchPlats = document.getElementById('search-plats');
  const filterIngredients = document.getElementById('filter-ingredients');
  const sortPlats = document.getElementById('sort-plats');
  
  // Fonction de filtrage et tri (déclarée AVANT d'être utilisée)
  const applyFiltersAndSort = () => {
    const searchQuery = searchPlats.value.toLowerCase().trim();
    const ingredientFilter = filterIngredients.value.toLowerCase().trim();
    
    let filtered = state.plats;
    
    // Filtrer par type (Plat/Dessert)
    if (state.typeFilter && state.typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === state.typeFilter);
    }
    
    // Filtrer par nom/description
    if (searchQuery) {
      filtered = filtered.filter(p => 
        matchesRecipeSearch(p, searchQuery) ||
        (p.description && p.description.toLowerCase().includes(searchQuery))
      );
    }
    
    // Filtrer par ingrédient
    if (ingredientFilter) {
      filtered = filtered.filter(p => {
        // Vérifier si le plat contient l'ingrédient recherché
        return matchesRecipeSearch(p, ingredientFilter);
      });
    }
    
    // Le tri est maintenant géré dans renderPlats()
    renderPlats(filtered);
  };
  
  // Gestion des boutons de filtre type
  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      // Retirer la classe active de tous les boutons
      document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      // Ajouter la classe active au bouton cliqué
      btn.classList.add('active');
      // Mettre à jour le filtre
      state.typeFilter = btn.dataset.type;
      applyFiltersAndSort();
    });
  });
  
  searchPlats.addEventListener('input', applyFiltersAndSort);
  filterIngredients.addEventListener('input', applyFiltersAndSort);
  sortPlats.addEventListener('change', applyFiltersAndSort);
  
  const searchIngredients = document.getElementById('search-ingredients');
  if (searchIngredients) {
    searchIngredients.addEventListener('input', async (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = state.ingredients.filter(i => 
        i.nom.toLowerCase().includes(query)
      );
      await renderIngredients(filtered);
    });
  }
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
    // Sauvegarder les filtres actuels
    const searchQuery = document.getElementById('search-plats').value;
    const ingredientFilter = document.getElementById('filter-ingredients').value;
    
    await fetch(`${API_BASE}/plats/${platId}`, { method: 'DELETE' });
    await loadPlats();
    
    // Réappliquer les filtres
    document.getElementById('search-plats').value = searchQuery;
    document.getElementById('filter-ingredients').value = ingredientFilter;
    
    // Déclencher le filtrage
    document.getElementById('search-plats').dispatchEvent(new Event('input'));
  } catch (err) {
    console.error('Erreur suppression plat:', err);
  }
}

async function duplicatePlat(event, platId) {
  event.stopPropagation();
  
  if (!state.editMode) {
    showNotification('Veuillez activer le mode édition pour dupliquer une recette.', 'warning');
    return;
  }
  
  try {
    // Récupérer le plat original
    const response = await fetch(`${API_BASE}/plats/${platId}`);
    const plat = await response.json();
    
    // Demander le nouveau nom
    const newName = prompt(`Dupliquer "${plat.nom}"\n\nEntrez le nouveau nom :`, `${plat.nom} - Copie`);
    
    if (!newName || newName.trim() === '') {
      return;
    }
    
    // Dupliquer
    const duplicateResponse = await fetch(`${API_BASE}/plats/${platId}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: newName.trim() })
    });
    
    if (!duplicateResponse.ok) throw new Error('Erreur lors de la duplication');
    
    const result = await duplicateResponse.json();
    showNotification(`Recette "${newName}" créée avec succès !`, 'success');
    
    // Sauvegarder les filtres actuels
    const searchQuery = document.getElementById('search-plats').value;
    const ingredientFilter = document.getElementById('filter-ingredients').value;
    
    // Recharger les plats
    await loadPlats();
    
    // Réappliquer les filtres
    document.getElementById('search-plats').value = searchQuery;
    document.getElementById('filter-ingredients').value = ingredientFilter;
    
    // Déclencher le filtrage
    document.getElementById('search-plats').dispatchEvent(new Event('input'));
    
  } catch (err) {
    console.error('Erreur duplication plat:', err);
    showNotification('Erreur lors de la duplication de la recette', 'error');
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
      
      // Si on ferme la modale de plat et qu'on était en train de créer depuis le menu
      if (modal.id === 'modal-plat' && creatingFromMenu) {
        creatingFromMenu = false;
        menuNomRecette = '';
        modal.classList.remove('active');
        // Rouvrir la modale de menu
        document.getElementById('modal-menu').classList.add('active');
        showNotification('Création annulée, retour au menu', 'info');
        return;
      }
      
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
        // Si on ferme la modale de plat et qu'on était en train de créer depuis le menu
        if (modal.id === 'modal-plat' && creatingFromMenu) {
          creatingFromMenu = false;
          menuNomRecette = '';
          modal.classList.remove('active');
          // Rouvrir la modale de menu
          document.getElementById('modal-menu').classList.add('active');
          showNotification('Création annulée, retour au menu', 'info');
          return;
        }
        
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
          // Si on ferme la modale de plat et qu'on était en train de créer depuis le menu
          if (modal.id === 'modal-plat' && creatingFromMenu && modal.classList.contains('active')) {
            creatingFromMenu = false;
            menuNomRecette = '';
            modal.classList.remove('active');
            // Rouvrir la modale de menu
            document.getElementById('modal-menu').classList.add('active');
            showNotification('Création annulée, retour au menu', 'info');
            return;
          }
          
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
    populateRecipeComponentSelects();
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

function populateRecipeComponentSelects(values = null) {
  ['feculent', 'legume', 'proteine'].forEach(component => {
    const hiddenInput = document.getElementById(`plat-${component}`);
    const searchInput = document.getElementById(`plat-${component}-search`);
    if (hiddenInput && searchInput) {
      const selectedValue = values ? values[component] : hiddenInput.value;
      const ingredient = state.ingredients.find(item => item.id === Number(selectedValue));
      selectRecipeComponent(component, ingredient?.id || '', ingredient?.nom || '');

      if (!searchInput.dataset.initialized) {
        searchInput.addEventListener('focus', () => renderRecipeComponentResults(component));
        searchInput.addEventListener('input', () => {
          hiddenInput.value = '';
          renderRecipeComponentResults(component);
        });
        searchInput.addEventListener('keydown', event => {
          if (event.key === 'Escape') {
            hideRecipeComponentResults(component);
          } else if (event.key === 'Enter') {
            const firstResult = document.querySelector(`#plat-${component}-results button`);
            if (firstResult) {
              event.preventDefault();
              firstResult.click();
            }
          }
        });
        searchInput.dataset.initialized = 'true';
      }
    }
  });

  if (!document.body.dataset.componentSearchOutsideClick) {
    document.addEventListener('pointerdown', event => {
      document.querySelectorAll('.component-search-results.open').forEach(results => {
        const componentSearch = results.closest('.component-search');
        if (!componentSearch.contains(event.target)) {
          results.classList.remove('open');
        }
      });
    });
    document.body.dataset.componentSearchOutsideClick = 'true';
  }
}

function selectRecipeComponent(component, ingredientId, ingredientName) {
  document.getElementById(`plat-${component}`).value = ingredientId;
  document.getElementById(`plat-${component}-search`).value = ingredientName;
  hideRecipeComponentResults(component);
}

function hideRecipeComponentResults(component) {
  document.getElementById(`plat-${component}-results`)?.classList.remove('open');
}

function renderRecipeComponentResults(component) {
  const searchInput = document.getElementById(`plat-${component}-search`);
  const results = document.getElementById(`plat-${component}-results`);
  const query = searchInput.value.trim();
  const normalizedQuery = query.toLocaleLowerCase('fr');
  const matches = [...state.ingredients]
    .filter(ingredient => ingredient.nom.toLocaleLowerCase('fr').includes(normalizedQuery))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    .slice(0, 8);

  results.replaceChildren();
  matches.forEach(ingredient => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'component-search-option';
    button.textContent = ingredient.nom;
    button.addEventListener('click', () => {
      selectRecipeComponent(component, ingredient.id, ingredient.nom);
    });
    results.appendChild(button);
  });

  const exactMatch = state.ingredients.some(
    ingredient => ingredient.nom.toLocaleLowerCase('fr') === normalizedQuery
  );
  if (query && !exactMatch) {
    const createButton = document.createElement('button');
    createButton.type = 'button';
    createButton.className = 'component-search-option component-search-create';
    createButton.textContent = `Créer « ${query} »`;
    createButton.addEventListener('click', () => createRecipeComponent(component, query));
    results.appendChild(createButton);
  }

  results.classList.toggle('open', results.childElementCount > 0);
}

async function createRecipeComponent(component, name) {
  try {
    const response = await fetch(`${API_BASE}/ingredients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: name })
    });
    const result = await response.json();
    if (!response.ok && response.status !== 409) {
      showNotification(result.error || 'Erreur lors de la création', 'error');
      return;
    }

    await loadIngredients();
    const ingredientId = result.id || result.existingId;
    const ingredient = state.ingredients.find(item => item.id === Number(ingredientId));
    if (ingredient) {
      selectRecipeComponent(component, ingredient.id, ingredient.nom);
      showNotification(`Ingrédient « ${ingredient.nom} » créé et sélectionné`, 'success');
    }
  } catch (err) {
    console.error('Erreur création composant:', err);
    showNotification('Erreur lors de la création de l\'ingrédient', 'error');
  }
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
      type: document.getElementById('plat-type').value,
      temps_preparation: parseInt(document.getElementById('plat-temps').value) || null,
      difficulte: document.getElementById('plat-difficulte').value,
      conseils_chef: document.getElementById('plat-conseils').value,
      nombre_personnes: parseInt(document.getElementById('plat-personnes').value) || 2,
      favori: favoriFiled ? favoriFiled.checked : false,
      feculent_id: parseInt(document.getElementById('plat-feculent').value) || null,
      legume_id: parseInt(document.getElementById('plat-legume').value) || null,
      proteine_id: parseInt(document.getElementById('plat-proteine').value) || null,
      preparation: document.getElementById('plat-preparation').value.trim()
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
      if (!response.ok) {
        showNotification(result.error || 'Erreur lors de la sauvegarde', 'error');
        return;
      }
      const platId = state.editingPlat || result.id;
      
      // Gérer les ingrédients
      if (platId) {
        // Si édition, vider d'abord les anciens ingrédients
        if (state.editingPlat) {
          await fetch(`${API_BASE}/plats/${platId}/ingredients`, { method: 'DELETE' });
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
        
      }
      
      document.getElementById('modal-plat').classList.remove('active');
      
      // Si on créait depuis le menu, retourner au menu avec la recette sélectionnée
      if (creatingFromMenu) {
        await loadPlats();
        
        // Récupérer le plat nouvellement créé
        const nouveauPlatId = platId;
        try {
          const response = await fetch(`${API_BASE}/plats/${nouveauPlatId}`);
          const nouveauPlat = await response.json();
          
          // Sélectionner automatiquement pour le menu
          selectedPlatForMenu = nouveauPlat;
          
          // Rouvrir la modale de menu
          document.getElementById('modal-menu').classList.add('active');
          
          // Afficher le plat sélectionné
          displaySelectedPlat(nouveauPlat);
          
          // Effacer le champ de recherche
          document.getElementById('menu-search').value = '';
          document.getElementById('menu-recettes-list').style.display = 'none';
          
          showNotification(`Recette "${nouveauPlat.nom}" créée et sélectionnée !`, 'success');
        } catch (err) {
          console.error('Erreur lors de la récupération du plat créé:', err);
          showNotification('Recette créée, mais erreur lors de la sélection', 'warning');
        }
        
        // Réinitialiser les variables de contexte
        creatingFromMenu = false;
        menuNomRecette = '';
        
        return;
      }
      
      await loadPlats();
      
      // Réappliquer le filtre actif après rechargement
      const searchPlats = document.getElementById('search-plats');
      const filterIngredients = document.getElementById('filter-ingredients');
      
      const searchQuery = searchPlats.value.toLowerCase().trim();
      const ingredientFilter = filterIngredients.value.toLowerCase().trim();
      
      let filtered = state.plats;
      
      // Filtrer par type (Plat/Dessert)
      if (state.typeFilter && state.typeFilter !== 'all') {
        filtered = filtered.filter(p => p.type === state.typeFilter);
      }
      
      // Filtrer par nom/description
      if (searchQuery) {
        filtered = filtered.filter(p => 
          matchesRecipeSearch(p, searchQuery) ||
          (p.description && p.description.toLowerCase().includes(searchQuery))
        );
      }
      
      // Filtrer par ingrédient
      if (ingredientFilter) {
        filtered = filtered.filter(p => {
          return matchesRecipeSearch(p, ingredientFilter);
        });
      }
      
      renderPlats(filtered);
    } catch (err) {
      console.error('Erreur sauvegarde plat:', err);
      showNotification('Erreur lors de la sauvegarde', 'error');
    }
  });
  
  // Ajouter ingrédient
  document.getElementById('btn-add-ingredient').addEventListener('click', () => {
    addIngredientRow();
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
  const row = document.createElement('div');
  row.className = 'preparation-row';
  row.innerHTML = `
    <span class="step-number" style="font-weight: 600; width: 30px;"></span>
    <textarea placeholder="Description de l'étape..." rows="2"></textarea>
    <input type="number" placeholder="⏱ min" style="width: 80px;" min="0">
    <div style="display: flex; gap: 0.25rem;">
      <button type="button" class="btn-move-up" title="Déplacer vers le haut" onclick="movePreparationUp(this.closest('.preparation-row'))">↑</button>
      <button type="button" class="btn-move-down" title="Déplacer vers le bas" onclick="movePreparationDown(this.closest('.preparation-row'))">↓</button>
      <button type="button" class="btn-remove" title="Supprimer cette étape" onclick="removePreparationRow(this.closest('.preparation-row'))">✕</button>
    </div>
  `;
  
  container.appendChild(row);
  renumberPreparationSteps();
}

function movePreparationUp(row) {
  const previousRow = row.previousElementSibling;
  if (previousRow && previousRow.classList.contains('preparation-row')) {
    row.parentNode.insertBefore(row, previousRow);
    renumberPreparationSteps();
  }
}

function movePreparationDown(row) {
  const nextRow = row.nextElementSibling;
  if (nextRow && nextRow.classList.contains('preparation-row')) {
    row.parentNode.insertBefore(nextRow, row);
    renumberPreparationSteps();
  }
}

function removePreparationRow(row) {
  row.remove();
  renumberPreparationSteps();
}

function renumberPreparationSteps() {
  const container = document.getElementById('plat-preparations-list');
  const rows = container.querySelectorAll('.preparation-row');
  rows.forEach((row, index) => {
    const stepNumber = row.querySelector('.step-number');
    if (stepNumber) {
      stepNumber.textContent = `${index + 1}.`;
    }
  });
}

// Formulaire ingrédient
function setupIngredientForm() {
  const form = document.getElementById('form-ingredient');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const ingredientData = {
      nom: document.getElementById('ingredient-nom').value
    };
    
    try {
      const url = state.editingIngredient 
        ? `${API_BASE}/ingredients/${state.editingIngredient}` 
        : `${API_BASE}/ingredients`;
      const method = state.editingIngredient ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingredientData)
      });
      const result = await response.json();
      if (!response.ok) {
        showNotification(result.error || 'Erreur lors de la sauvegarde', 'error');
        return;
      }
      
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
        nom: document.getElementById('quick-ingredient-nom').value
      };
      
      try {
        const response = await fetch(`${API_BASE}/ingredients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ingredientData)
        });
        
        const result = await response.json();
        if (!response.ok) {
          showNotification(result.error || 'Erreur lors de la création', 'error');
          return;
        }
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

  document.getElementById('btn-current-week').addEventListener('click', () => {
    state.currentWeekStart = getMonday(new Date());
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
    
    // Debug : afficher les occurrences
    if (menu && menu.plat_nom) {
      console.log(`${jour} - ${menu.plat_nom}: occurrences =`, menu.occurrences_6_mois);
    }
    
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
        <div class="jour-date" style="display: flex; justify-content: space-between; align-items: center;">
          <span>${date.getDate()}/${date.getMonth() + 1}</span>
          ${menu ? `<span style="font-size: 0.7rem; color: var(--warning); font-style: italic;" title="Nombre de fois proposé dans les 6 derniers mois">📊 ${menu.occurrences_6_mois || 0}×</span>` : ''}
        </div>
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
          <h2>Ingrédients</h2>
          <div class="recette-viewer-meta">
            <span>👥 ${plat.nombre_personnes} personnes</span>
            ${plat.temps_preparation ? `<span>⏱ ${plat.temps_preparation} min</span>` : ''}
            <span class="badge-${plat.difficulte.toLowerCase()}">${plat.difficulte}</span>
          </div>
          <div class="recette-main-components">
            ${plat.feculent_nom ? `<div><span>Féculent</span><strong>${plat.feculent_nom}</strong></div>` : ''}
            ${plat.legume_nom ? `<div><span>Légume</span><strong>${plat.legume_nom}</strong></div>` : ''}
            ${plat.proteine_nom ? `<div><span>Protéine</span><strong>${plat.proteine_nom}</strong></div>` : ''}
          </div>
          ${plat.ingredients && plat.ingredients.length > 0 ? `
            <ul class="recette-viewer-ingredients">
              ${plat.ingredients.map(ing => `
                <li>
                  <span class="ingredient-quantite">${ing.quantite ? formatQuantite(ing.quantite) : ''} ${ing.unite || ''}</span>
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
          <h2>La recette</h2>
          ${plat.description ? `<p class="recette-introduction">${plat.description}</p>` : ''}
          ${plat.preparation
            ? `<div class="recette-text">${plat.preparation}</div>`
            : '<p>Aucune préparation indiquée</p>'}
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
    document.getElementById('plat-type').value = plat.type || 'Plat';
    document.getElementById('plat-temps').value = plat.temps_preparation || '';
    document.getElementById('plat-difficulte').value = plat.difficulte || 'Moyen';
    document.getElementById('plat-conseils').value = plat.conseils_chef || '';
    document.getElementById('plat-personnes').value = plat.nombre_personnes || 4;
    document.getElementById('plat-favori').checked = Boolean(plat.favori);
    document.getElementById('plat-preparation').value = plat.preparation || '';
    populateRecipeComponentSelects({
      feculent: plat.feculent_id,
      legume: plat.legume_id,
      proteine: plat.proteine_id
    });
    
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
            ${[...state.ingredients].sort((a, b) => a.nom.localeCompare(b.nom)).map(i => 
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
  if (!state.editMode) {
    showNotification('Veuillez activer le mode édition pour gérer les plats du calendrier.', 'warning');
    return;
  }
  
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
  document.getElementById("menu-components-search").value = "";
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
      document.getElementById("menu-components-search").value = [
        plat.feculent_nom,
        plat.legume_nom,
        plat.proteine_nom
      ].filter(Boolean).join(', ');
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
    const componentsInput = document.getElementById("menu-components-search");
    const searchInput = document.getElementById("menu-search");
    const resultsList = document.getElementById("menu-recettes-list");
    
    if (componentsInput && searchInput && resultsList) {
      console.log("Initialisation de la recherche menu");

      const updateMenuRecipeResults = () => {
        clearTimeout(searchMenuTimeout);
        const componentsQuery = componentsInput.value.trim();
        const nameQuery = searchInput.value.trim();

        if (!componentsQuery && nameQuery.length < 2) {
          resultsList.style.display = "none";
          return;
        }

        searchMenuTimeout = setTimeout(() => {
          const filtered = state.plats.filter(plat => {
            const componentsMatch = !componentsQuery || matchesMainComponents(plat, componentsQuery);
            const nameMatch = !nameQuery || plat.nom.toLocaleLowerCase('fr')
              .includes(nameQuery.toLocaleLowerCase('fr'));
            return componentsMatch && nameMatch;
          });

          try {
            if (filtered.length === 0) {
              const searchDescription = [componentsQuery, nameQuery].filter(Boolean).join(' / ');
              resultsList.innerHTML = `
                <div style="padding: 1rem; color: var(--text-secondary);">
                  <div style="margin-bottom: 0.75rem;">Aucun plat trouvé pour "${searchDescription}"</div>
                  ${nameQuery ? `<button
                    class="btn-primary" 
                    style="font-size: 0.875rem; padding: 0.5rem 1rem;"
                    onclick="createRecetteFromMenu('${nameQuery.replace(/'/g, "\\'")}')"
                  >
                    ➕ Créer ce plat
                  </button>` : ''}
                </div>
              `;
              resultsList.style.display = "block";
              return;
            }
            
            resultsList.innerHTML = filtered.map(plat => {
              return `
                <div class="search-result-item" onclick="selectPlatForMenu(${plat.id})">
                  <strong>${plat.nom}</strong>
                  ${plat.composants_list
                    ? `<div class="menu-result-components">${plat.composants_list}</div>`
                    : '<div class="menu-result-components menu-result-legacy">Composants à compléter</div>'}
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
      };

      const handleMenuSearchInput = () => {
        selectedPlatForMenu = null;
        document.getElementById("menu-selected-plat").innerHTML = "";
        updateMenuRecipeResults();
      };

      componentsInput.addEventListener("input", handleMenuSearchInput);
      searchInput.addEventListener("input", handleMenuSearchInput);
      componentsInput.addEventListener("focus", updateMenuRecipeResults);
      searchInput.addEventListener("focus", updateMenuRecipeResults);
      
      menuSearchInitialized = true;
    }
  }
  
  modal.classList.add('active');
  
  // Focus sur le champ de recherche
  setTimeout(() => document.getElementById("menu-components-search").focus(), 100);
}

function matchesMainComponents(plat, query) {
  const structuredComponents = [plat.feculent_nom, plat.legume_nom, plat.proteine_nom]
    .filter(Boolean)
    .join(' ');
  const searchableComponents = structuredComponents || [plat.ingredients_list, plat.nom]
    .filter(Boolean)
    .join(' ');
  const normalizedComponents = normalizeMenuComponentText(searchableComponents);
  const terms = normalizeMenuComponentText(query).split(/[\s,;]+/).filter(Boolean);
  return terms.every(term => normalizedComponents.includes(term));
}

function normalizeMenuComponentText(value) {
  return value.toLocaleLowerCase('fr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bpommes? de terre\b/g, 'pdt');
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
          ${plat.composants_list ? `<div class="menu-result-components">${plat.composants_list}</div>` : ''}
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
function selectPlatForMenu(id) {
  selectedPlatForMenu = state.plats.find(plat => plat.id === id);
  if (selectedPlatForMenu) {
    document.getElementById("menu-search").value = selectedPlatForMenu.nom;
    displaySelectedPlat(selectedPlatForMenu);
  }
}

/**
 * Variable pour suivre si on est en train de créer une recette depuis le menu
 */
let creatingFromMenu = false;
let menuNomRecette = '';

/**
 * Crée une nouvelle recette directement depuis la recherche de menu
 * @param {string} nomRecette - Le nom de la recette à créer
 */
function createRecetteFromMenu(nomRecette) {
  // Sauvegarder le contexte
  creatingFromMenu = true;
  menuNomRecette = nomRecette;
  
  // Préparer la modale de création
  state.editingPlat = null;
  document.getElementById('modal-plat-title').textContent = 'Nouvelle Recette';
  document.getElementById('form-plat').reset();
  document.getElementById('plat-ingredients-list').innerHTML = '';
  populateRecipeComponentSelects();
  
  // Pré-remplir le nom avec ce qui a été recherché
  document.getElementById('plat-nom').value = nomRecette;
  
  // Fermer la modale de menu temporairement
  document.getElementById('modal-menu').classList.remove('active');
  
  // Ouvrir la modale de création de recette
  document.getElementById('modal-plat').classList.add('active');
  
  // Afficher une notification
  showNotification(`Création de la recette "${nomRecette}"`, 'info');
}


/**
 * Enregistre le menu
 */
async function saveMenu() {
  if (!state.editMode) {
    showNotification('Veuillez activer le mode édition pour enregistrer un menu.', 'warning');
    return;
  }
  
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
  if (!state.editMode) {
    showNotification('Veuillez activer le mode édition pour supprimer un menu.', 'warning');
    return;
  }
  
  console.log("Tentative de suppression pour la date:", dateStr);
  
  const confirmed = await showConfirmDialog(
    "Voulez-vous vraiment supprimer ce menu ?",
    "Supprimer le menu",
    "🗑️"
  );
  
  if (!confirmed) return;
  
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
  if (!state.editMode) {
    showNotification('Veuillez activer le mode édition pour vider la semaine.', 'warning');
    return;
  }
  
  const confirmed = await showConfirmDialog(
    "Voulez-vous vraiment vider tous les menus de cette semaine ?",
    "Vider la semaine",
    "⚠️"
  );
  
  if (!confirmed) return;
  
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
