# Teambuilding Picker

Application de sélection d'activités pour team building avec interface de vote en temps réel.

## Déploiement sur VPS

### Prérequis

- Docker et Docker Compose installés sur le VPS
- Un nom de domaine configuré
- Accès SSH au VPS

### 1. Configuration DNS

Ajoutez les enregistrements DNS suivants dans la zone de votre domaine :

```dns
picker        3600 IN A    <VOTRE_IP_VPS>
api-picker    3600 IN A    <VOTRE_IP_VPS>
traefik-picker 3600 IN A   <VOTRE_IP_VPS>
```

Remplacez `<VOTRE_IP_VPS>` par l'adresse IP publique de votre serveur.

### 2. Configuration de l'application

1. **Clonez le repository sur votre VPS :**
   ```bash
   git clone <repository-url>
   cd teambuilding-picker
   ```

2. **Modifiez le fichier `docker-compose.yml` :**
   - Changez le nom de domaine dans les labels Traefik si nécessaire
   - Modifiez l'adresse email pour Let's Encrypt

### 3. Configuration SSL

Créez le fichier pour stocker les certificats SSL :

```bash
touch acme.json
chmod 600 acme.json
```

### 4. Déploiement

Lancez les conteneurs :

```bash
docker-compose up -d
```

### 5. Vérification

Vérifiez que tous les services sont en cours d'exécution :

```bash
docker-compose ps
```

L'application sera accessible via :
- Interface client : `https://picker.votre-domaine.com`
- API : `https://api-picker.votre-domaine.com`
- Dashboard Traefik : `https://traefik-picker.votre-domaine.com`