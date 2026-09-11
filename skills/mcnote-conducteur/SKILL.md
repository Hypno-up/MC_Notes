---
name: mcnote-conducteur
description: Transforme des informations brutes sur un événement — e-mail d'un client, planning, programme, liste d'intervenants, de partenaires ou de clubs, notes prises sur place, brief — en fichier CSV prêt à importer dans MC Note, l'application de conducteur et de prompteur de l'animateur. Produit les séquences, les scènes, les textes utiles au micro et la liste des points à vérifier. À utiliser dès que l'utilisateur mentionne MC Note, un conducteur, un déroulé, une fiche MC, un prompteur, des séquences ou des scènes, ou qu'il transmet des infos d'événement à mettre en forme pour la scène. Sert aussi à préparer des bloc-notes (anecdotes, citations, remerciements, infos pratiques).
---

# MC Note — préparer un conducteur

L'utilisateur est maître de cérémonie. Il te transmet des informations en vrac
et attend **un fichier qu'il importe tel quel dans MC Note**, puis qu'il lit sur
son téléphone, sur scène. Tout ce que tu produis doit donc être juste, lisible
d'un coup d'œil, et conforme au format ci-dessous au caractère près.

Livrable : **un fichier CSV par jour d'événement** (et, si l'utilisateur
travaille dans Google Sheets, le même contenu à coller dans sa feuille),
**validé**, accompagné d'un court récapitulatif.

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

### Bloc-notes

```
title,content
```

Une ligne par note : anecdotes, citations, remerciements sponsors, infos
pratiques — tout ce qui ne suit pas un horaire.

### Encodage

- **UTF-8**, séparateur **virgule**.
- Toute cellule contenant une virgule, un guillemet ou un retour à la ligne est
  **entourée de guillemets doubles** ; un guillemet intérieur est **doublé**.
- Écris le fichier avec un vrai générateur CSV (module `csv` de Python), jamais
  en concaténant des chaînes : c'est la première cause de fichier cassé.

À quoi ressemble une cellule sur plusieurs lignes, avec un guillemet intérieur :

```
11:00,Dégustation commentée,Julien Roux,Sommelier,"Annonce : « Place à la dégustation. »

• 6 vins de Loire
• Le vigneron dit : ""on goûte d'abord le blanc""",Samedi matin
```

`modeles/` contient un modèle vierge, un modèle de bloc-notes et un exemple
complet d'une soirée.

---

## 2. Les règles qui comptent

Chacune vient d'un problème réellement rencontré.

1. **Un fichier par jour.** Chaque jour devient un événement distinct dans
   MC Note (« Salon — samedi », « Salon — dimanche »). C'est ainsi que
   l'utilisateur travaille, et cela évite deux pièges : deux séquences du même
   nom à la même heure qui fusionneraient (l'ouverture de 10:00 existe les deux
   jours), et un indicateur d'avance/retard qui comparerait l'heure réelle à
   l'horaire d'un autre jour. Chaque fichier est autonome : répète-y la fiche
   événement, les contacts et les partenaires, et limite ses « Points à
   confirmer » à son jour. Ne fais un seul fichier pour plusieurs jours que
   si l'utilisateur le demande : ajoute alors le jour dans **chaque titre** et
   **chaque nom de scène** (« Ouverture — samedi », « Samedi matin »).

2. **L'ordre des lignes est l'ordre du conducteur.** MC Note suit la feuille,
   pas l'ordre alphabétique des horaires. Range les lignes dans l'ordre où
   elles se dérouleront.

3. **Fiches d'information en tête**, horodatées `00:00`, `00:01`… : fiche
   événement, contacts, partenaires, listes, points à confirmer. L'indicateur
   d'avance/retard les ignore. Elles se placent **toujours avant** la première
   séquence horodatée. Dans un fichier multi-jours, un seul bloc suffit.

4. **`timing` + `title` identifient une séquence.** Deux lignes partageant les
   deux sont **fusionnées** en une seule séquence à plusieurs questions — c'est
   voulu quand une séquence a plusieurs sujets, jamais sinon. Deux activités à
   la même heure font deux séquences, avec deux titres différents, dans l'ordre
   des sources.

5. **Des retours à la ligne, jamais de séparateurs.** Une liste s'écrit une
   puce par ligne :
   ```
   • CIC Nord Ouest
   • Toyota
   • Hôtel Ibis
   ```
   Pas `CIC | Toyota | Ibis`, ni `• CIC • Toyota • Ibis` : à l'écran, tout
   s'affiche collé. Une ligne vide sépare deux blocs.

6. **Une scène s'écrit toujours exactement de la même façon.** « Matinée » et
   « Matinee » deviennent deux scènes de couleurs différentes. Choisis les noms
   une fois, puis recopie-les à l'identique. Une scène regroupe des séquences
   **consécutives**. Huit au maximum : au-delà, les couleurs se répètent.

---

## 3. Ne jamais inventer — et comment écrire ce qui manque

Une erreur annoncée au micro devant 500 personnes ne se rattrape pas.

- **Ce qui n'est pas dans les sources n'entre pas dans le fichier** : ni fait,
  ni chiffre, ni nom, ni orthographe, ni année, ni date d'e-mail — ni même le
  genre d'une personne désignée par sa fonction (« le maire », « la direction »).
- **Les tournures de liaison sont permises** dans une annonce : « Bienvenue à
  toutes et à tous », « Place maintenant à… », « J'ai le plaisir d'appeler… ».
  **Les faits, jamais** : un titre, un palmarès, un chiffre, une qualité
  n'apparaissent que s'ils sont dans les sources.
- **Aucun texte à trou dans une annonce.** Jamais `[nom]`, `XXX`, `…` là où
  l'animateur doit lire : sur scène, il le lirait tel quel. Écris l'annonce
  sans l'élément manquant, et place au-dessus une ligne À VÉRIFIER :
  ```
  À VÉRIFIER juste avant : le maire vient-il ? Sinon, nom et fonction de l'adjoint.

  Annonce : « Pour ouvrir officiellement ce salon, j'ai le plaisir de laisser
  la parole au maire. »
  ```
- **Les formules d'incertitude comptent comme non confirmées** : « je crois »,
  « normalement », « à peu près », « sauf changement », « on attend
  confirmation ». Le fait va dans « Points à confirmer », et dans la séquence
  concernée avec la consigne de ne pas l'annoncer :
  ```
  Ne pas annoncer « meilleur sommelier de France 2019 » — non confirmé.
  ```
- **Un trou dans le planning ne devient pas une séquence.** Créneau vide, heure
  de fin inconnue, pause non précisée : tout va dans « Points à confirmer ».
- **Une suggestion de ta part** — par exemple le moment où remercier les
  partenaires — n'apparaît que dans « Points à confirmer », précédée de
  « Suggestion : ».
- **Une activité qui ne concerne pas l'animateur** (démonstration sur un autre
  stand) ne reçoit une séquence que s'il doit l'annoncer ; dans le doute, elle
  va dans « Points à confirmer ».
- **Signale toujours ta source** dans la fiche événement (« Source : e-mail de
  Sophie Martin + message de l'animateur »), sans inventer de date.

---

## 4. Méthode

1. **Inventorie les sources** et ce que chacune apporte : horaires, noms,
   rôles, chiffres, consignes techniques.
2. **Repère les contradictions et les trous** : un club au planning mais absent
   de la liste, deux activités à la même heure, un horaire flou. Tout va dans
   « Points à confirmer ».
3. **Découpe en jours**, puis chaque jour en scènes — 3 à 6 en général :
   « Infos générales », puis les grands temps (Accueil, Cérémonie, Matinée,
   Après-midi, Clôture…).
4. **Écris les fiches d'information** (`00:00`…), puis **les séquences** dans
   l'ordre où elles se dérouleront.
5. **Rédige chaque `question_content` pour quelqu'un qui est sur scène** :
   - ce qu'il doit **vérifier** avant d'y aller — en premier, pour ne pas le rater ;
   - ce qu'il doit **dire** : l'annonce entre guillemets, prête à lire ;
   - ce qu'il doit **savoir** : faits clés en puces, les plus utiles d'abord ;
   - ce qu'il doit **faire** : micro, relais, qui appeler, photo.

   Phrases courtes. Noms propres exacts.
6. **Génère le CSV** avec le module `csv` de Python, en UTF-8.
7. **Valide-le** :
   ```
   python3 scripts/valider_csv.py fichier.csv
   ```
   Corrige toute **ERREUR**. Relis chaque **ATTENTION** : elle est parfois
   voulue (une longue liste de clubs), parfois non. Si le script ne peut pas
   s'exécuter dans ton environnement, applique à la main la liste de la
   section 8 — elle reprend les mêmes contrôles.
8. **Livre** le fichier et le récapitulatif (section 6).

---

## 5. Mettre à jour un conducteur existant

C'est le piège principal. MC Note lit **une URL de feuille fixe** et se
resynchronise toute seule toutes les 30 secondes.

- **Si l'utilisateur travaille dans Google Sheets : on remplace le contenu de
  la même feuille. On ne crée pas de nouveau fichier.** Une « v2 », « v3 »,
  « v4 » a une autre URL : l'application continue de lire l'ancienne et rien
  ne semble se mettre à jour.
- Ne numérote donc pas les versions dans le nom du fichier. Un nom stable :
  `MCNOTE_<Evenement>_<Jour>.csv`, par exemple `MCNOTE_SalonVins_Samedi.csv`.
- S'il faut malgré tout un nouveau fichier, rappelle-lui de recoller
  l'événement à la nouvelle feuille avec le bouton 🔗 de sa carte dans MC Note.
- Garde les mêmes `timing` et `title` pour une séquence qui ne fait que
  s'enrichir : l'application la reconnaît et met son contenu à jour, **en
  conservant les validations et les notes prises sur scène**. Changer l'un des
  deux crée une nouvelle séquence.

---

## 6. Livraison

Donne le ou les fichiers, puis un récapitulatif bref :

```
Conducteur Salon des Vins — samedi : 8 séquences, 3 scènes
  Infos générales (4) · Matinée (2) · Après-midi (2)

À confirmer avant l'événement (3) :
  1. Le maire vient-il ? Sinon, nom de l'adjoint
  2. Titre du sommelier : ne pas l'annoncer d'ici là
  3. Suggestion : remercier les partenaires à la remise des prix

Validation : conforme.
```

Pour plusieurs fichiers, un bloc de ce type par fichier.

Puis les consignes d'import, adaptées à son cas — CSV par défaut s'il ne
précise pas qu'il travaille dans Google Sheets :

- **Fichier CSV** : MC Note → Événements → onglet **CSV** → nom de
  l'événement → choisir le fichier → Importer. Un import par jour.
- **Google Sheets** : coller le contenu dans la feuille, puis la partager en
  **« Tout utilisateur disposant du lien » → Lecteur**. Sans ce partage,
  l'application affiche « Feuille illisible ». Dans MC Note : onglet
  **Google Sheets** → coller l'URL.

**Données personnelles.** Garde par défaut les coordonnées fournies dans la
fiche « Contacts » : l'animateur en a besoin sur place. Mais **signale-le
toujours** : si le contenu passe par une feuille partagée par lien, quiconque
obtient l'URL lit ces numéros et ces adresses. Propose de les déplacer dans un
bloc-notes, qui n'est jamais partagé par lien.

---

## 7. Ce que l'application fait, pour bien conseiller

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

## 8. Contrôle avant livraison

Le script vérifie tout ce qui suit sauf les deux derniers points. Sans script,
vérifie-les tous à la main.

- [ ] En-tête exact, colonne `scene` en dernier
- [ ] Chaque ligne a le même nombre de champs que l'en-tête (guillemets)
- [ ] Chaque ligne a un `timing` ou un `title`
- [ ] Fiches `00:0x` en tête, avant toute séquence horodatée
- [ ] Aucune paire `timing` + `title` en double sans le vouloir
- [ ] Aucun `|`, aucune puce enchaînée sur une ligne
- [ ] Chaque nom de scène écrit à l'identique, scènes consécutives
- [ ] Aucun `[…]` ni `XXX` dans une annonce
- [ ] **Un seul jour par fichier**, ou le jour dans chaque titre et chaque scène
- [ ] **Aucun fait absent des sources** — relis chaque chiffre et chaque titre

« Conforme » veut dire importable, pas juste : les deux derniers points ne
relèvent que de ta relecture.
