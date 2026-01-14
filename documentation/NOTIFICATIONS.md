# 🎨 Système de notifications moderne

## ✅ Modifications apportées

Tous les anciens `alert()` ont été remplacés par un système de notifications modernes de type "toast".

## 🎭 Types de notifications

### Info (bleu/violet)
```javascript
showNotification('Information générale', 'info');
```
Utilisé pour les messages informatifs généraux.

### Success (vert)
```javascript
showNotification('Opération réussie !', 'success');
```
Utilisé pour confirmer le succès d'une opération.

### Warning (orange)
```javascript
showNotification('Veuillez activer le mode édition', 'warning');
```
Utilisé pour les avertissements et les restrictions (mode édition, etc.)

### Error (rouge)
```javascript
showNotification('Erreur lors de la sauvegarde', 'error');
```
Utilisé pour les erreurs et les échecs d'opération.

## 🎯 Fonctionnalités

### ✨ Animations fluides
- Entrée en slide depuis la droite
- Sortie animée après 3 secondes
- Effet de rebond (cubic-bezier)

### 🎨 Design moderne
- Gradients colorés selon le type
- Icônes emoji intuitives
- Ombres et effets de profondeur
- Mode sombre intégré

### 📚 Empilable
- Plusieurs notifications peuvent s'afficher simultanément
- Positionnement automatique en cascade
- Maximum de 3 notifications visibles

### ⏱️ Durée personnalisable
```javascript
showNotification('Message court', 'info', 2000);  // 2 secondes
showNotification('Message long', 'warning', 5000); // 5 secondes
// Par défaut : 3000ms (3 secondes)
```

## 🎪 Exemples d'utilisation

### Avant (ancien style)
```javascript
alert('Veuillez activer le mode édition pour créer une recette.');
```

### Après (nouveau style)
```javascript
showNotification('Veuillez activer le mode édition pour créer une recette.', 'warning');
```

## 📍 Emplacements remplacés

Tous les `alert()` ont été remplacés dans ces contextes :

1. **Mode édition** - Avertissements quand l'utilisateur tente de modifier sans activer le mode
2. **Erreurs de chargement** - Échecs de récupération des données depuis l'API
3. **Erreurs de sauvegarde** - Problèmes lors de l'enregistrement de recettes/ingrédients
4. **Erreurs de médias** - Upload, suppression ou définition de photo principale
5. **Erreurs de menu** - Sauvegarde, suppression, vidage de semaine

## 🎨 Styles CSS

Les styles sont dans `/public/style.css` :

- `.notification` - Container de base
- `.notification-info` - Style bleu/violet
- `.notification-success` - Style vert
- `.notification-warning` - Style orange
- `.notification-error` - Style rouge

## 🚀 Position responsive

Les notifications s'affichent en haut à droite sur desktop et s'adaptent automatiquement sur mobile.

---

**Note** : Les notifications ne bloquent pas l'interface (non-modal) contrairement aux anciens `alert()`, ce qui améliore grandement l'expérience utilisateur ! ✨
