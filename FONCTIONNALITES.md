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
- **Écart sur l'horaire** — une pastille à côté de l'heure annonce « à l'heure »,
  « 20 min d'avance » ou « +12 min ». Elle se rafraîchit toute seule, et se tait
  au-delà de six heures d'écart : on regarde alors un autre jour ou une fiche
  d'information horodatée `00:0x`, où l'écart n'aurait aucun sens
- **Recherche** (loupe, barre du haut) — porte sur l'horaire, le titre, les
  intervenants, la scène, les questions et la note rapide. Insensible aux accents
  et à la casse : « patisserie » trouve « Pâtisserie ». Chaque résultat montre un
  extrait avec le terme surligné et saute à la séquence
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

- **Veille de fond, sans rien appliquer.** Toutes les 30 s — et au retour à
  l'écran — l'application lit la feuille et **ne touche à rien**. Si elle a
  bougé, un bouton **« Mise à jour — 2 ajouts · 1 modif. »** apparaît sous les
  intervenants. Rien ne change tant qu'on ne l'a pas touché : en plein direct,
  voir son conducteur se réécrire tout seul est intenable. Le bouton est dans
  le flux, jamais flottant — il recouvrait « Valider la séquence », l'action la
  plus utilisée
- **Les retouches faites sur le téléphone survivent.** La feuille est comparée
  à son **empreinte de la dernière lecture**, jamais au texte affiché. Comparer
  au texte affiché faisait passer la moindre retouche pour un écart, aussitôt
  « corrigé » en remettant la version de la feuille : seules les notes rapides
  et les validations en réchappaient. Si la feuille change réellement, sa
  version fait foi — c'est le sens du bouton
- **Reprise à l'endroit où l'on était.** Android peut libérer l'application
  restée en arrière-plan ; au retour, elle repartait de l'accueil, au milieu de
  l'événement. La séquence affichée est mémorisée et retrouvée. Quitter
  volontairement l'événement efface cette reprise, la déconnexion aussi
- **Écran d'attente au lancement** : le formulaire de connexion apparaissait puis
  disparaissait le temps que Firebase réponde, donnant l'impression d'un
  rechargement à chaque retour
- **Une lecture en échec n'efface plus la liste.** Chaque événement est lu
  isolément : un refus sur l'un n'empêche plus les autres de s'afficher.
  Le cas courant est la création — l'événement existe déjà localement, l'écoute
  se déclenche, mais le serveur ne l'a pas encore enregistré et les règles des
  sous-collections l'interrogent pour savoir à qui appartient le parent. Le
  refus est donc temporaire : une relance va chercher les séquences manquantes,
  jusqu'à trois fois. Auparavant, toute la liste était abandonnée et
  l'événement qu'on venait d'importer n'apparaissait nulle part
- **Chargement des séquences en parallèle** : elles étaient lues événement par
  événement, en autant d'allers-retours enchaînés
- **Ancienne auto-sync toutes les 30 s** — uniquement quand un événement ou un bloc-notes issu de Google Sheets est **affiché à l'écran**
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

## 8. Écriture dans la feuille Google Sheets

Une séquence ajoutée avec **＋** peut être **reportée directement dans la
feuille**, si le relais est configuré. Sinon elle part dans le presse-papiers,
comme avant — aucun réglage n'est obligatoire.

Chaîne : application → fonction Netlify `sheet-append` → script Apps Script →
feuille. Le jeton reste dans les variables d'environnement Netlify : une
application web est du code client, tout secret qu'elle porterait serait
lisible. Les valeurs sont posées **d'après le nom des colonnes**, jamais leur
position, donc une feuille réordonnée reste correctement alimentée.

Après une écriture réussie, la séquence cesse d'être marquée « locale » et
reçoit sa `cleSource` : sans cela, la synchronisation suivante ajouterait un
second exemplaire à côté d'elle.

**Installation** — voir l'en-tête de [`apps-script/Code.gs`](apps-script/Code.gs).
En résumé : déployer le script en application web exécutée en votre nom,
accessible à tout le monde, puis renseigner dans Netlify `APPS_SCRIPT_URL` et
`APPS_SCRIPT_JETON`. Aucune clé Google ne circule.

## 9. Export du conducteur

Bouton 📄 sur la carte. Le conducteur est reconstruit en **document** — fond
blanc, encre noire, aucune trace de l'interface — puis confié au système
d'impression, qui sait aussi bien imprimer qu'enregistrer un PDF.

Contient le nom de l'événement, le nombre de séquences et de validations, la
date d'édition, puis chaque séquence sous son intertitre de scène : horaire,
titre, coche si validée, intervenants, questions et note rapide. Une séquence
n'est jamais coupée entre deux pages.

Le WebView Android ignore `window.print()`. `MainActivity` expose donc un pont
minimal vers le service d'impression du système ; sur le web, `window.print()`
suffit.

## 10. Partage d'un événement

Bouton 👤+ sur la carte, réservé au propriétaire. Le partage se fait **par
adresse e-mail** : les règles la comparent à `request.auth.token.email`, ce qui
évite toute correspondance adresse → identifiant et n'expose donc pas l'annuaire
des comptes. La comparaison ignore la casse.

L'invité voit le conducteur dans sa liste, marqué d'un badge « partagé ». Il
peut **valider les séquences et prendre des notes** — c'est le but d'un
conducteur partagé. Il ne peut ni renommer l'événement, ni changer sa feuille
source, ni gérer les partages, ni supprimer.

Deux conséquences techniques : la liste d'accueil écoute **deux requêtes**
(mes événements et ceux partagés avec moi), chacune avec son propre compteur de
génération ; et la synchronisation n'écrit l'horodatage `lastRefresh` que si
l'on est propriétaire, sinon elle échouerait entièrement pour un invité.

## 11. Sécurité

Chaque événement et chaque bloc-notes porte un champ `owner`. Les
sous-collections n'ont pas de propriétaire propre : elles héritent de celui de
leur parent, vérifié par un `get()` dans les règles. Un compte authentifié ne
peut donc plus lire ni modifier les conducteurs d'un autre.

Coût : une lecture supplémentaire par document de sous-collection lu ou écrit.
Négligeable aux volumes en jeu, et c'est le prix de l'isolation.

Vérifié sur émulateur, 19 contrôles : accès du propriétaire, refus d'un autre
compte en lecture, écriture et suppression, refus anonyme, refus de créer un
événement au nom d'autrui, refus sur sous-collection orpheline.

> Conséquence : les sous-collections orphelines laissées par d'anciennes
> suppressions ne sont plus accessibles depuis l'application. Elles y étaient
> déjà invisibles ; leur nettoyage se fait depuis la console Firebase.

## 12. Robustesse terrain

| Fonction | Détail |
|---|---|
| **Cache local persistant** | Firestore `persistentLocalCache` — l'app reste consultable sans réseau, les écritures sont rejouées à la reconnexion |
| **Écran maintenu allumé** | Wake Lock actif sur le conducteur, la vue note et le prompteur ; relâché ailleurs |
| **Bandeau hors-ligne** | Bandeau orange en haut de l'écran + toasts à la perte/reprise de connexion |
| **URLs serverless absolues** | Les fonctions Netlify restent joignables depuis l'APK (`API_BASE`) |

---

## 13. Divers

- Toasts de notification (`showToast`)
- Raccourcis clavier : ↑ ↓ (navigation), `v` (valider), `Espace` (prompteur), ← → (notes), `Échap` (fermer)
- Téléchargement des modèles CSV
- Interface verrouillée en portrait, zoom désactivé

---

## 14. Ce qui reste à faire

### Bloquant avant mise en production
- [ ] Ajouter `localhost` aux domaines autorisés dans Firebase → Authentication → Settings (sinon connexion impossible dans l'APK)
- [ ] Supprimer `indexold.html` du dépôt (96 Ko servis publiquement)

### Fonctionnalités annoncées mais absentes
- [ ] **Gestes de swipe** — mentionnés dans le README, aucun `touchstart` dans le code V3
- [ ] Horodatage visible de la dernière synchro

### Améliorations souhaitables
- [ ] Sortir le CSS et le JS de `index.html` (fichier unique de 3 400 lignes)
