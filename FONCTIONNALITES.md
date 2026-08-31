# MCNote V3 — Inventaire fonctionnel complet

État au 28/08/2026, après correctifs P0. Source unique : `index.html` (~3 400 lignes).

---

## 1. Authentification

| Fonction | Détail | Statut |
|---|---|---|
| Inscription | E-mail + mot de passe (Firebase Auth) | ✅ |
| Connexion | E-mail + mot de passe | ✅ |
| Session persistante | `onAuthStateChanged` — reconnexion auto au lancement | ✅ |
| Déconnexion | Bouton en-tête accueil | ✅ |
| Mot de passe oublié | Lien sur l'écran de connexion → e-mail de réinitialisation Firebase | ✅ |

---

## 2. Accueil — deux modes

Onglets **Événements** / **Bloc-notes**. Chaque mode a sa grille de cartes et son bloc d'import.

### Cartes Événement
- Nom, compteur `validées / total séquences`
- Badge « Google Sheets » si l'événement a une `sourceUrl`
- Actions : ouvrir, rafraîchir (`refreshEvent`), supprimer (`deleteEvent`)

### Cartes Bloc-notes
- Nom (thématique), nombre de notes, badge source
- Actions : ouvrir, rafraîchir (`refreshNotebook`), supprimer (`deleteNotebook`)

---

## 3. Création & import de contenu

### Événements — 2 sources
| Source | Mécanisme |
|---|---|
| **CSV** | Fichier local, parsé par PapaParse |
| **Google Sheets** | URL → fonction Netlify `gsheet-proxy` (contourne CORS), repli en fetch direct |
| **Vide** | `createEmptyEvent()` — événement à remplir à la main |

> Airtable a été retiré le 28/08/2026 : source inutilisée, la liaison Google Sheets
> la remplace intégralement.

**Format CSV attendu :** `timing,title,people,question_text,question_content,scene`

La colonne `scene` est **facultative** et se place en dernier. Absente, elle
n'est simplement pas gérée — et surtout, la synchronisation n'écrase alors pas
les scènes attribuées à la main depuis le téléphone.
Les lignes partageant `timing`+`title` sont regroupées en une séquence ; chaque ligne ajoute une question.

**L'ordre du conducteur est celui de la feuille**, pas l'ordre alphabétique des
horaires. Chaque séquence retient son rang de ligne (`ordre`), ce qui permet aux
événements sur plusieurs jours de s'enchaîner correctement — auparavant le mardi
matin s'intercalait dans le lundi après-midi. Une séquence ajoutée avec **＋** se
glisse juste après celle qu'on regarde.
Modèle téléchargeable : `downloadEventTemplate()`.

**Mise en page du contenu.** Les cellules acceptent les retours à la ligne
(Alt+Entrée dans Google Sheets) : ils sont conservés par l'export CSV, par
l'import et à l'affichage. Une puce `•` en début de ligne suffit à obtenir une
liste lisible. C'est la façon recommandée de présenter une liste de partenaires,
de clubs ou de contacts.


### Bloc-notes — 2 sources
| Source | Mécanisme |
|---|---|
| **CSV** | Fichier local |
| **Google Sheets** | Même proxy Netlify |
| **Vide** | `createNotebook()` |

**Format CSV attendu :** `title,content` — une ligne = une note.
Modèle téléchargeable : `downloadNotebookTemplate()`.

---

## 4. Écran Conducteur (mode Événement)

Le cœur de l'app : **une séquence par écran, aucun scroll**.

- **Barre latérale de progression** — une pastille par séquence, cliquable
  (`goToSequence`), état validé visible, infobulle au survol, **liseré coloré
  à la couleur de sa scène**
- **Scènes** — regroupement libre des séquences (« Infos générales », « Matinée »,
  « Après-midi », « Contacts »…). La scène courante s'affiche en bandeau coloré
  au-dessus de l'horaire ; ce bandeau ouvre l'**accès rapide**, qui liste les
  scènes avec leur avancement (`validées/total`) et saute directement à la
  première séquence de celle qu'on choisit. Les couleurs sont attribuées dans
  l'ordre d'apparition, sans réglage. Ni vert ni indigo dans la palette : ces
  teintes signalent déjà « validée » et « en cours ». Une scène se renseigne
  depuis la colonne `scene` de la feuille ou depuis le champ Scène de l'éditeur,
  et une séquence ajoutée avec **＋** hérite de la scène affichée
- **Navigation** : la barre du bas est coupée en deux — **Précédent à gauche**,
  **Suivant à droite**, deux cibles d'environ 165 × 69 px atteignables au pouce.
  La moitié concernée se grise en début et en fin de conducteur. Le bandeau du
  haut reste cliquable pour reculer et porte le bouton Accueil. Flèches ↑ ↓ au
  clavier
- **Contenu séquence** : horaire, titre, intervenants, liste des questions
- **Validation** (`toggleValidation`, touche `v`) — la séquence passe en style « faite », le compteur d'accueil se met à jour
- **Note rapide** — champ toujours actif sous la séquence, sauvegarde directe en Firestore sans mode édition
- **Zone de contenu défilante** — au-delà de la hauteur visible, un dégradé et
  une pastille « ▼ suite » signalent qu'il reste du texte, et le bouton « Lire »
  se met en avant. Auparavant le texte était coupé en silence
- **Popup « Lire »** (`openPopup`) — affiche un texte long en plein écran
- **Prompteur** (voir §6)
- **Mode édition** (`toggleEditMode`) — modifier horaire, titre, intervenants, questions
- **Ajout d'une séquence en direct** (bouton **＋**) — le timing est prérempli à
  l'heure courante, la séquence se classe donc immédiatement au bon endroit.
  Elle porte `origine: 'local'`, ce qui la **protège de la synchronisation** :
  sans ce marqueur elle serait effacée au passage suivant, puisqu'elle n'existe
  pas dans la feuille source. Un badge « ajoutée sur place » la distingue, et
  elle est la seule que le bouton Supprimer accepte d'effacer
- **Copier pour Google Sheets** (`copySequenceForGsheet`) — met la séquence au presse-papiers au format tabulé, collable directement dans la feuille

---

## 5. Écran Bloc-notes

- Liste des notes du bloc
- Vue note plein écran (`openNoteView`) avec navigation ← → (boutons + clavier)
- Création / édition / suppression de note (`openNoteModal`, `saveNote`, `editNote`, `deleteNote`)
- Prompteur sur une note (`startNotePrompter`)
- **Copier pour Google Sheets** (`copyNoteForGsheet`)

---

## 6. Prompteur

- Défilement automatique plein écran, superposition sombre
- Lecture / pause (bouton + **barre d'espace**)
- **Vitesse réglable** (`adjustPrompterSpeed`) — 5 crans
- **Taille de texte** (`adjustTextSize`) — 4 tailles : `sm / md / lg / xl`
- Fermeture par bouton ou **Échap**
- Désactivé automatiquement si le texte fait moins de 5 lignes
- Lançable depuis : une séquence, une popup, une note

---

## 7. Synchronisation

- **Auto-sync toutes les 30 s** — uniquement quand un événement ou un bloc-notes issu de Google Sheets est **affiché à l'écran**
- **Rapprochement non destructif** : mise à jour ligne à ligne, à partir des
  séquences **relues depuis Firestore** et non de la liste affichée. Se fier à
  la liste en mémoire dupliquait la feuille entière quand elle était encore
  vide (juste après un import). Les doublons éventuels sont supprimés au
  passage suivant.
- **Identité stable** : chaque séquence importée retient sa clé d'origine
  (`cleSource`). Le rapprochement s'y appuie, pas sur le titre affiché — on peut
  donc **renommer une séquence ou décaler son horaire depuis le téléphone**
  sans qu'elle soit écrasée, tout en continuant à recevoir les mises à jour de
  contenu. Les documents antérieurs sont rattrapés automatiquement.
- Ce que la feuille met à jour : `people` et les questions. Ce qu'elle ne
  touche jamais : `timing`, `title`, `validated` et la note rapide. Les **validations** et les **notes rapides** saisies en direct ne sont jamais écrasées
- Détecte les modifications de contenu, pas seulement les ajouts/suppressions
- Ignorée quand l'appareil est hors ligne
- Toast récapitulatif : `X ajout(s), Y modif., Z suppr.`
- **Changer la feuille source** (bouton 🔗 sur la carte) — recolle un événement
  à une autre feuille. Le lien est lu et validé avant enregistrement : une
  feuille non partagée ou sans les colonnes `timing`/`title` est refusée avec
  le motif exact. Indispensable dès qu'une feuille est régénérée plutôt que
  modifiée, ce qui change son URL
- **Rafraîchissement manuel** sur chaque carte — passe par le même proxy et la
  même fusion non destructive que la synchronisation automatique. Il appelait
  auparavant l'URL `/edit` du Sheet en direct, ce qui ne pouvait pas fonctionner

---

## 8. Robustesse terrain *(ajouté ce soir)*

| Fonction | Détail |
|---|---|
| **Cache local persistant** | Firestore `persistentLocalCache` — l'app reste consultable sans réseau, les écritures sont rejouées à la reconnexion |
| **Écran maintenu allumé** | Wake Lock actif sur le conducteur, la vue note et le prompteur ; relâché ailleurs |
| **Bandeau hors-ligne** | Bandeau orange en haut de l'écran + toasts à la perte/reprise de connexion |
| **URLs serverless absolues** | Les fonctions Netlify restent joignables depuis l'APK (`API_BASE`) |

---

## 9. Divers

- Toasts de notification (`showToast`)
- Raccourcis clavier : ↑ ↓ (navigation), `v` (valider), `Espace` (prompteur), ← → (notes), `Échap` (fermer)
- Téléchargement des modèles CSV
- Interface verrouillée en portrait, zoom désactivé

---

## 10. Ce qui reste à faire

### Bloquant avant mise en production
- [ ] **Règles Firestore** — celles du README (`request.auth != null` sur les sous-collections) laissent tout compte lire les conducteurs des autres. À reprendre avec isolation par `owner`.
- [ ] Ajouter `localhost` aux domaines autorisés dans Firebase → Authentication → Settings (sinon connexion impossible dans l'APK)
- [ ] Supprimer `indexold.html` du dépôt (96 Ko servis publiquement)

### Fonctionnalités annoncées mais absentes
- [ ] **Gestes de swipe** — mentionnés dans le README, aucun `touchstart` dans le code V3
- [ ] Recherche dans les séquences / notes
- [ ] Horodatage visible de la dernière synchro

### Améliorations souhaitables
- [ ] Export PDF du conducteur
- [ ] Partage d'un événement entre plusieurs utilisateurs
- [ ] Alertes de dépassement d'horaire (comparaison `timing` / heure réelle)
- [ ] Sortir le CSS et le JS de `index.html` (fichier unique de 3 400 lignes)
