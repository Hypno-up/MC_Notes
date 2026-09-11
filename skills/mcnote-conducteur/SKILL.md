---
name: mcnote-conducteur
description: Transforme des informations brutes sur un événement — e-mail d'un client, planning, programme, liste d'intervenants, de partenaires ou de clubs, notes prises sur place, brief — en fichier CSV prêt à importer dans MC Note, l'application de conducteur et de prompteur de l'animateur. Produit les séquences, les scènes, les textes utiles au micro et la liste des points à vérifier. À utiliser dès que l'utilisateur mentionne MC Note, un conducteur, un déroulé, une fiche MC, un prompteur, des séquences ou des scènes, ou qu'il transmet des infos d'événement à mettre en forme pour la scène. Sert aussi à préparer des bloc-notes (anecdotes, citations, remerciements, infos pratiques).
---

# MC Note — préparer un conducteur

L'utilisateur est maître de cérémonie. Il te transmet des informations en vrac
et attend **un fichier qu'il importe tel quel dans MC Note**, puis qu'il lit sur
son téléphone, sur scène. Tout ce que tu produis doit donc être juste, lisible
d'un coup d'œil, et conforme au format ci-dessous au caractère près.

Livrable : **un fichier CSV** (et, si l'utilisateur travaille dans Google
Sheets, le même contenu à coller dans sa feuille), **validé par le script
fourni**, accompagné d'un court récapitulatif.

---

## 1. Le format exact

### Conducteur d'événement

En-tête, en minuscules, dans cet ordre :

```
timing,title,people,question_text,question_content,scene
```

| Colonne | Contenu | Obligatoire |
|---|---|---|
| `timing` | Horaire `HH:MM`. Les fiches d'information en tête prennent `00:00`, `00:01`, `00:02`… | oui* |
| `title` | Titre de la séquence, court, lisible de loin | oui* |
| `people` | Intervenants, club, personnes concernées | non |
| `question_text` | Sous-titre : le sujet, l'angle, la consigne en une ligne | non |
| `question_content` | Le contenu que l'animateur lit ou consulte. **Retours à la ligne autorisés** | non |
| `scene` | Nom du regroupement (« Infos générales », « Matinée »…). **Toujours en dernier** | non |

\* Une ligne sans `timing` ni `title` est ignorée par l'application.

Un modèle vierge et un exemple complet sont dans `modeles/`.

### Bloc-notes

```
title,content
```

Une ligne par note. Pour les anecdotes, citations, blagues, remerciements
sponsors, infos pratiques — tout ce qui ne suit pas un horaire.

### Encodage

- **UTF-8**, séparateur **virgule**.
- Toute cellule contenant une virgule, un guillemet ou un retour à la ligne est
  **entourée de guillemets doubles** ; un guillemet intérieur est doublé (`""`).
- Écris le fichier avec un vrai générateur CSV (module `csv` de Python), jamais
  en concaténant des chaînes : c'est la première cause de fichier cassé.

---

## 2. Les règles qui comptent

Chacune vient d'un problème réellement rencontré.

1. **L'ordre des lignes est l'ordre du conducteur.** MC Note suit la feuille,
   pas l'ordre alphabétique des horaires. Range les lignes dans l'ordre où elles
   se dérouleront. Sur plusieurs jours : tout le lundi, puis tout le mardi.

2. **Fiches d'information en tête**, horodatées `00:00`, `00:01`… : fiche
   événement, contacts, partenaires, liste des clubs, points à confirmer.
   L'indicateur d'avance/retard les ignore automatiquement.

3. **`timing` + `title` identifient une séquence.** Deux lignes partageant les
   deux sont **fusionnées** en une seule séquence à plusieurs questions. Deux
   passages d'un même club à des heures différentes sont donc bien deux
   séquences ; deux lignes identiques par erreur n'en font qu'une.

4. **Des retours à la ligne, jamais de séparateurs.** Une liste s'écrit une
   puce par ligne :
   ```
   • CIC Nord Ouest
   • Toyota
   • Hôtel Ibis
   ```
   Pas `CIC | Toyota | Ibis`, ni `• CIC • Toyota • Ibis` : à l'écran, tout
   s'affiche collé. Une ligne vide sépare deux blocs.

5. **Une scène s'écrit toujours exactement de la même façon.** « Matinée » et
   « Matinee » deviennent deux scènes de couleurs différentes. Choisis les noms
   une fois, puis recopie-les à l'identique. Huit scènes au maximum : au-delà,
   les couleurs se répètent. Une scène = des séquences **consécutives**.

6. **Ne jamais inventer.** Ce qui n'est pas dans les sources n'entre pas dans le
   fichier. Ce qui est incertain est signalé comme tel, dans la séquence
   concernée et dans la fiche « Points à confirmer » :
   ```
   À VÉRIFIER juste avant : gala ou compétition ?
   Ne pas annoncer « 14e de France » — non confirmé.
   ```
   Une erreur annoncée au micro devant 500 personnes ne se rattrape pas.

7. **Signale toujours ta source** dans la fiche événement (« Source : e-mail de
   X du 12/09 + planning v2 »). L'animateur doit savoir d'où vient ce qu'il lit.

---

## 3. Méthode

1. **Inventorie les sources.** Liste ce que l'utilisateur t'a fourni et ce que
   chacune apporte : horaires, noms, rôles, chiffres, consignes techniques.
2. **Repère les contradictions et les trous.** Un club au planning mais absent
   de la liste, un créneau vide, deux horaires différents pour la même chose :
   tout va dans « Points à confirmer ».
3. **Découpe en scènes** — 3 à 6 en général : « Infos générales », puis les
   grands temps de l'événement (Accueil, Cérémonie, Matinée, Après-midi,
   Clôture…), et au besoin « Contacts et responsables ».
4. **Écris les fiches d'information** (`00:00`…), puis **les séquences**
   dans l'ordre chronologique.
5. **Rédige chaque `question_content` pour quelqu'un qui est sur scène** :
   - ce qu'il doit **dire** (texte d'annonce, entre guillemets, prêt à lire) ;
   - ce qu'il doit **savoir** (faits clés en puces, les plus utiles d'abord) ;
   - ce qu'il doit **faire** (micro, relais, qui appeler, photo) ;
   - ce qu'il doit **vérifier** avant d'y aller.
   Phrases courtes. Noms propres exacts. Chiffres sourcés.
6. **Génère le CSV** avec le module `csv` de Python, en UTF-8.
7. **Valide-le** :
   ```
   python3 scripts/valider_csv.py fichier.csv
   ```
   Corrige toute **ERREUR**. Relis chaque **ATTENTION** : elle est parfois
   voulue (une longue liste de clubs, par exemple), parfois non.
8. **Livre** le fichier et le récapitulatif (section 5).

---

## 4. Mettre à jour un conducteur existant

C'est le piège principal. MC Note lit **une URL de feuille fixe** et se
resynchronise toute seule toutes les 30 secondes.

- **Si l'utilisateur travaille dans Google Sheets : on remplace le contenu de
  la même feuille. On ne crée pas de nouveau fichier.** Une « v2 », « v3 »,
  « v4 » a une autre URL : l'application continue de lire l'ancienne et rien
  ne semble se mettre à jour.
- Ne numérote donc pas les versions dans le nom du fichier. Un nom stable :
  `MCNOTE_<Evenement>_<Jour>.csv`.
- S'il faut malgré tout un nouveau fichier, rappelle-lui qu'il doit recoller
  l'événement à la nouvelle feuille avec le bouton 🔗 de la carte, dans MC Note.
- Garde les mêmes `timing` et `title` pour une séquence qui ne fait que
  s'enrichir : l'application la reconnaît et met son contenu à jour, **en
  conservant les validations et les notes prises sur scène**. Changer l'un des
  deux crée une nouvelle séquence.

---

## 5. Livraison

Donne le fichier, puis un récapitulatif bref :

```
Conducteur Vital Sport — samedi : 18 séquences, 4 scènes
  Infos générales (5) · Matinée (4) · Après-midi (8) · Contacts (1)

À confirmer avant l'événement (3) :
  1. Uni-vert Sport : discipline inconnue
  2. Créneaux 12h00–13h00 vides : pause ou animation ?
  3. Heure de call-time du MC

Validation : conforme.
```

Puis les consignes d'import, adaptées à son cas :

- **Fichier CSV** : MC Note → Événements → onglet **CSV** → nom de
  l'événement → choisir le fichier → Importer.
- **Google Sheets** : coller le contenu dans la feuille, puis la partager en
  **« Tout utilisateur disposant du lien » → Lecteur**. Sans ce partage,
  l'application affiche « Feuille illisible ». Dans MC Note : onglet
  **Google Sheets** → coller l'URL.

**Données personnelles.** Si le fichier contient des numéros de téléphone ou
des adresses e-mail, préviens l'utilisateur : une feuille partagée par lien est
lisible par quiconque obtient l'URL. Propose de déplacer ces coordonnées dans
un bloc-notes ou une note rapide plutôt que dans la feuille partagée.

---

## 6. Ce que l'application fait, pour bien conseiller

- Chaque séquence s'affiche seule à l'écran : horaire, titre, intervenants,
  puis le contenu. Un contenu long **défile**, avec un repère « ▼ suite ».
- La scène courante apparaît en bandeau coloré ; il ouvre l'accès rapide aux
  scènes. Chaque pastille de la barre latérale porte la couleur de sa scène.
- Une pastille indique l'avance ou le retard sur l'horaire prévu.
- L'animateur peut **ajouter une séquence en direct** (bouton ＋) : elle est
  protégée de la synchronisation, elle ne disparaîtra pas.
- Une recherche parcourt tout le conducteur, sans tenir compte des accents.
- Le conducteur s'exporte en PDF depuis la carte de l'événement.

---

## 7. À ne pas faire

- Inventer un fait, un chiffre, un nom, une orthographe.
- Séparer des éléments par `|`, `;` ou des puces enchaînées sur une ligne.
- Créer un nouveau fichier à chaque mise à jour.
- Écrire une même scène de deux façons.
- Mettre deux lignes au même `timing` et au même `title` sans le vouloir.
- Livrer sans avoir lancé le script de validation.
