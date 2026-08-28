# MCNote V2 - Guide de Déploiement sur Netlify

## 📁 Structure des fichiers

```
mcnote-v2-firebase/
├── index.html              # Application principale
├── package.json            # Dépendances Node.js
├── netlify.toml            # Configuration Netlify
├── README.md               # Ce fichier
└── netlify/
    └── functions/
        └── airtable-import-2.js   # Fonction serverless Airtable
```

## 🚀 Étapes de déploiement

### 1. Préparer le repository GitHub

```bash
# Si tu as déjà un repo, remplace les fichiers existants
# Sinon, crée un nouveau repo

cd ton-repo-mcnote
# Copie tous les fichiers de mcnote-v2-firebase ici

git add .
git commit -m "MCNote V2 - Nouvelle interface mobile"
git push origin main
```

### 2. Configurer Netlify

1. **Connecter le repo** : Va sur [Netlify](https://app.netlify.com) → "Add new site" → "Import an existing project" → GitHub

2. **Paramètres de build** :
   - Build command: `npm install` (ou laisser vide)
   - Publish directory: `.`
   - Functions directory: `netlify/functions`

### 3. Configurer les variables d'environnement

Dans Netlify → Site settings → Environment variables, ajoute :

| Variable | Description |
|----------|-------------|
| `AIRTABLE_API_KEY` | Ta clé API Airtable (Personal Access Token) |
| `AIRTABLE_BASE_ID` | L'ID de ta base Airtable (ex: `appXXXXXXXXXXXX`) |
| `AIRTABLE_TABLE_NAME` | Nom de la table (ex: `Timeline`) |
| `FIREBASE_SERVICE_ACCOUNT` | Le JSON complet du compte de service Firebase |

#### Comment obtenir FIREBASE_SERVICE_ACCOUNT :

1. Va dans [Firebase Console](https://console.firebase.google.com)
2. Paramètres du projet → Comptes de service
3. "Générer une nouvelle clé privée"
4. Copie **tout le contenu du fichier JSON** dans la variable

⚠️ **Important** : Colle le JSON sur **une seule ligne** (sans retours à la ligne)

### 4. Configurer Firebase (côté client)

Dans Netlify → Site settings → Build & deploy → Build settings → Edit settings

Ajoute dans "Environment" :
```
__firebase_config = {"apiKey":"xxx","authDomain":"xxx.firebaseapp.com","projectId":"xxx","storageBucket":"xxx.appspot.com","messagingSenderId":"xxx","appId":"xxx"}
```

Ou utilise l'injection de script Netlify dans le HTML.

### 5. Déployer

```bash
git push origin main
# Netlify déploie automatiquement
```

---

## ⚙️ Configuration Firebase requise

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.owner;
      allow create: if request.auth != null;
      
      match /sequences/{sequenceId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

### Authentication
- Active "Email/Password" dans Firebase Console → Authentication → Sign-in method

---

## 📱 Fonctionnalités V2

- ✅ **1 séquence par page** - Pas de scroll
- ✅ **Navigation verticale** - Précédent en haut, Suivant en bas
- ✅ **Popup texte long** - Bouton "Lire" pour ouvrir
- ✅ **Prompteur intelligent** - Désactivé si texte < 5 lignes
- ✅ **Notes rapides** - Sans mode édition requis
- ✅ **Swipe gestures** - Navigation tactile
- ✅ **Synchronisation Firebase** - Données en temps réel
- ✅ **Import Airtable** - Via fonction serverless

---

## 🔧 Résolution de problèmes

### "Firebase config not found"
→ Vérifie que `__firebase_config` est bien injecté dans le HTML ou via Netlify

### "Airtable import failed"
→ Vérifie les variables d'environnement Netlify
→ Teste la fonction : `https://ton-site.netlify.app/.netlify/functions/airtable-import-2`

### "Authentication failed"
→ Vérifie que Email/Password est activé dans Firebase
→ Vérifie les domaines autorisés dans Firebase → Authentication → Settings

---

## 📞 Support

Pour toute question, vérifie les logs dans Netlify → Functions → airtable-import-2
