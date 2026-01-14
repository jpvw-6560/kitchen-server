# 🌐 Accès distant au Serveur Cuisine

## 📱 Problème résolu

Le serveur est maintenant accessible depuis **n'importe quel appareil** sur votre réseau local (téléphone, tablette, PC distant).

## ✅ Modifications apportées

1. **Client (app.js)** : Utilisation dynamique de l'adresse IP au lieu de `localhost`
2. **Serveur (server.js)** : Écoute sur toutes les interfaces réseau (`0.0.0.0`)

## 🔌 Comment accéder au serveur

### 1️⃣ Trouvez l'adresse IP de votre PC serveur

```bash
# Sur Linux
ip addr show | grep inet

# Ou plus simple
hostname -I
```

Exemple de résultat : `192.168.1.100`

### 2️⃣ Démarrez le serveur

```bash
cd /home/jpvw/Documents/php_appli/gestion_ESP/cuisine_server
npm start &
```

### 3️⃣ Accédez depuis vos appareils

#### Depuis le PC serveur (local)
```
http://localhost:3002
```

#### Depuis votre téléphone, tablette ou autre PC
```
http://192.168.1.100:3002
```
*(Remplacez `192.168.1.100` par l'IP réelle de votre serveur)*

## 🔐 Configuration réseau requise

### Firewall Linux
Si vous avez un firewall actif, autorisez le port 3002 :

```bash
# UFW
sudo ufw allow 3002/tcp

# Firewalld
sudo firewall-cmd --permanent --add-port=3002/tcp
sudo firewall-cmd --reload
```

### Réseau local
- Assurez-vous que tous les appareils sont sur le **même réseau Wi-Fi/Ethernet**
- Si vous utilisez le Wi-Fi, certains réseaux publics bloquent la communication entre appareils

## 🧪 Test de connectivité

### Depuis votre téléphone/PC distant

1. Ouvrez un navigateur web
2. Entrez : `http://[IP-DU-SERVEUR]:3002`
3. Vous devriez voir l'interface Cuisine Server

### Vérifier que le serveur écoute

```bash
# Vérifier que le serveur écoute sur toutes les interfaces
ss -tlnp | grep :3002

# Résultat attendu :
# LISTEN  0.0.0.0:3002  (écoute sur toutes les interfaces)
```

## 🌍 Accès via Internet (Tailscale)

Si vous utilisez Tailscale (VPN mesh) :

```
http://[TAILSCALE-IP]:3002
```

Exemple : `http://100.64.1.5:3002`

## ❓ Dépannage

### Erreur "ERR_CONNECTION_REFUSED" sur mobile
- ✅ Vérifier que le serveur est démarré : `ss -tlnp | grep :3002`
- ✅ Vérifier le firewall : `sudo ufw status`
- ✅ Vérifier que vous êtes sur le même réseau Wi-Fi

### Page blanche ou erreurs API
- ✅ Ouvrir la console développeur du navigateur (F12)
- ✅ Vérifier les erreurs réseau dans l'onglet "Network"
- ✅ Vérifier que l'URL utilisée est correcte

### "CORS Error"
Le serveur utilise déjà `cors()` middleware, donc ce problème ne devrait pas se produire.

## 📝 Note technique

L'application détecte automatiquement l'adresse du serveur grâce à :

```javascript
const API_BASE = `${window.location.protocol}//${window.location.hostname}:3002/api`;
```

Cela signifie :
- Si vous accédez via `http://localhost:3002` → API = `http://localhost:3002/api`
- Si vous accédez via `http://192.168.1.100:3002` → API = `http://192.168.1.100:3002/api`
- Si vous accédez via `http://100.64.1.5:3002` → API = `http://100.64.1.5:3002/api`

**Tout est automatique !** ✨
