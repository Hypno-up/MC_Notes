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
  sheet-append.js                 Ajoute une ligne dans la feuille, via Apps Script
apps-script/Code.gs               Script à déployer côté Google (voir son en-tête)
capacitor.config.json             Configuration de l'app Android
android/                          Projet Android généré par Capacitor
resources/icon.png, splash.png    Sources des icônes (1024 et 2732 px)
templates/*.csv                   Modèles d'import, identiques à ceux de l'app
MCNote-V3.apk                     Dernier APK construit, prêt à installer
www/                              Copie de index.html publiée et embarquée (généré, non versionné)
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

Un APK prêt à l'emploi est déjà versionné à la racine — pense à le mettre à jour
(`git add MCNote-V3.apk`) après toute modification de `index.html`.

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

Netlify construit `www/` via `npm run build:www` et le publie ; les fonctions
restent dans `netlify/functions`. Le site et l'APK servent donc exactement le
même `index.html`. Tout push sur `main` déclenche un déploiement.

**Variables d'environnement requises :**

| Variable | Usage |
|---|---|
| `APPS_SCRIPT_URL` | URL `/exec` du script `apps-script/Code.gs` — facultative |
| `APPS_SCRIPT_JETON` | Jeton partagé avec ce script — facultative |

Sans elles, l'écriture directe dans la feuille est désactivée et l'application
retombe sur le presse-papiers. Le proxy Google Sheets ne manipule aucun secret.

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

Les deux modèles sont téléchargeables depuis l'application et versionnés dans
`templates/`.

---

## Dépannage

| Symptôme | Cause probable |
|---|---|
| Import Google Sheets KO dans l'APK | Un `fetch` relatif s'est glissé dans le code — vérifier `API_BASE` |
| « Firebase config not found » | Bloc `firebaseConfig` absent de `index.html` |
| `invalid source release: 21` au build | JDK 17 actif — `npm run apk` force Java 21 |
| Écran noir au lancement de l'APK | `npm run build:www` non exécuté : `www/` vide ou périmé |
| Données figées | Vérifier le bandeau orange « Hors ligne » en haut de l'écran |
