# MCNote V3

Conducteurs d'événements et bloc-notes pour animateurs, avec prompteur intégré.
Web (Netlify) + application Android (Capacitor).

- **Web** : https://mcnote.netlify.app
- **Fonctionnalités détaillées** : [FONCTIONNALITES.md](FONCTIONNALITES.md)

---

## Architecture

```
index.html                        Toute l'application (HTML + CSS + JS module)
netlify/functions/
  gsheet-proxy.js                 Récupère une feuille Google en CSV (contourne le CORS)
  airtable-import-2.js            Importe une base Airtable dans Firestore
capacitor.config.json             Configuration de l'app Android
android/                          Projet Android généré par Capacitor
resources/icon.png, splash.png    Sources des icônes (1024 et 2732 px)
www/                              Copie de index.html embarquée dans l'APK (généré, non versionné)
```

**Backend** : Firebase Auth (e-mail/mot de passe) + Firestore.
Collections `events/{id}/sequences` et `notebooks/{id}/notes`.

**Aucune étape de build côté web** : `index.html` est servi tel quel.

---

## Développement

```bash
npm install
npx serve .          # ou tout serveur HTTP statique — les modules ES exigent http://
```

⚠️ Servi depuis `localhost`, l'app se considère « native » et appelle les fonctions
serverless de production (`https://mcnote.netlify.app`). C'est voulu : cela reproduit
exactement l'environnement de l'APK.

---

## Construire l'APK Android

**Prérequis** — JDK 21 et l'Android SDK en ligne de commande :

```bash
brew install openjdk@21 android-commandlinetools
sdkmanager "platforms;android-36" "build-tools;35.0.0" "platform-tools"
echo "sdk.dir=/usr/local/share/android-commandlinetools" > android/local.properties
```

**Construction :**

```bash
npm run apk
```

L'APK signé en debug est déposé à la racine : `MCNote-V3.apk`.
Capacitor 8 exige **Java 21** — le script force `JAVA_HOME` en conséquence.

**Installation** : transférer le fichier sur le téléphone et autoriser
l'installation depuis des sources inconnues. Ou, appareil branché en USB :

```bash
adb install -r MCNote-V3.apk
```

### Le piège à connaître

La page est servie depuis `https://localhost` dans l'application. Tout appel
**relatif** aux fonctions Netlify viserait alors le téléphone lui-même. D'où la
constante `API_BASE` dans `index.html` : elle vaut `''` sur le web et l'URL
absolue du site en natif. **Ne jamais réintroduire de `fetch('/.netlify/...')`.**

---

## Déploiement web

Netlify, publication du répertoire racine, fonctions dans `netlify/functions`.

Variables d'environnement à définir dans Netlify → Site settings → Environment :

| Variable | Usage |
|---|---|
| `AIRTABLE_API_KEY` | Jeton d'accès personnel Airtable |
| `AIRTABLE_BASE_ID` | Identifiant de la base (`appXXXXXXXX`) |
| `AIRTABLE_TABLE_NAME` | Nom de la table (défaut : `Timeline`) |
| `FIREBASE_SERVICE_ACCOUNT` | JSON du compte de service, **sur une seule ligne** |

La configuration Firebase côté client est en clair dans `index.html` : c'est
normal et sans risque, la sécurité repose sur les règles Firestore.

---

## Firebase

**Authentication** → activer « E-mail/Mot de passe ».

**Règles Firestore** — ⚠️ à reprendre, voir la section « Reste à faire » de
[FONCTIONNALITES.md](FONCTIONNALITES.md). Les règles actuelles laissent tout
compte authentifié lire les conducteurs des autres utilisateurs.

---

## Formats d'import CSV

**Événement** — `timing,title,people,question_text,question_content`
Les lignes partageant `timing` + `title` forment une séquence ; chaque ligne y
ajoute une question.

**Bloc-notes** — `title,content` — une ligne par note.

Les deux modèles sont téléchargeables depuis l'application.

---

## Dépannage

| Symptôme | Cause probable |
|---|---|
| Import Google Sheets / Airtable KO dans l'APK | Un `fetch` relatif s'est glissé dans le code — vérifier `API_BASE` |
| « Firebase config not found » | Bloc `firebaseConfig` absent de `index.html` |
| `invalid source release: 21` au build | JDK 17 actif — `npm run apk` force Java 21 |
| Écran noir au lancement de l'APK | `npm run build:www` non exécuté : `www/` vide ou périmé |
| Données figées | Vérifier le bandeau orange « Hors ligne » en haut de l'écran |
