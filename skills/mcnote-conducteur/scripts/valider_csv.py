#!/usr/bin/env python3
"""
Valide un fichier CSV avant import dans MC Note.

Reproduit les regles de lecture de l'application et signale les pieges
rencontres en production. A lancer sur chaque fichier avant de le livrer :

    python3 valider_csv.py mon-fichier.csv

Code de sortie 0 : importable. Code 1 : au moins une erreur bloquante.
Les avertissements n'empechent pas l'import mais meritent une relecture.
"""

import csv
import re
import sys
import unicodedata

COLONNES_EVENEMENT = ['timing', 'title', 'people', 'question_text', 'question_content']
COLONNES_BLOC_NOTES = ['title', 'content']
TAILLE_PALETTE = 8          # couleurs distinctes pour les scenes dans l'app
CONTENU_LONG = 1500         # au-dela, la zone defile : acceptable mais a savoir


TROU = re.compile(r'\[[^\]]*\]|\bX{3,}\b|\?\?\?')
FICHE_INFO = re.compile(r'^00:0\d')


def minutes(timing):
    trouve = re.search(r'(\d{1,2}):(\d{2})', timing or '')
    return int(trouve.group(1)) * 60 + int(trouve.group(2)) if trouve else None


def normaliser(texte):
    """Minuscules, sans accents ni espaces : sert a reperer les variantes."""
    sans_accents = unicodedata.normalize('NFD', texte or '')
    sans_accents = ''.join(c for c in sans_accents if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', '', sans_accents.lower())


def main(chemin):
    erreurs, avertissements = [], []

    try:
        with open(chemin, encoding='utf-8-sig', newline='') as f:
            brut = f.read()
    except UnicodeDecodeError:
        print("ERREUR  Le fichier n'est pas en UTF-8. Les accents seraient illisibles.")
        return 1
    except OSError as e:
        print(f"ERREUR  Lecture impossible : {e}")
        return 1

    lignes = list(csv.reader(brut.splitlines(keepends=True)))
    lignes = [l for l in lignes if any(c.strip() for c in l)]
    if not lignes:
        print("ERREUR  Fichier vide.")
        return 1

    entetes = [h.strip().lower() for h in lignes[0]]
    donnees = lignes[1:]

    # ---- type de fichier ----
    if all(c in entetes for c in COLONNES_EVENEMENT):
        genre = 'evenement'
    elif all(c in entetes for c in COLONNES_BLOC_NOTES):
        genre = 'bloc-notes'
    else:
        manquantes = [c for c in COLONNES_EVENEMENT if c not in entetes]
        print(f"ERREUR  En-tetes non reconnus : {lignes[0]}")
        print(f"        Pour un evenement il manque : {manquantes}")
        print(f"        Attendu : {','.join(COLONNES_EVENEMENT)}[,scene]")
        print(f"        Ou, pour un bloc-notes : {','.join(COLONNES_BLOC_NOTES)}")
        return 1

    connues = set(COLONNES_EVENEMENT + ['scene'] if genre == 'evenement' else COLONNES_BLOC_NOTES)
    inconnues = [h for h in entetes if h and h not in connues]
    if inconnues:
        avertissements.append(f"Colonnes ignorees par MC Note : {inconnues}")

    if genre == 'evenement' and 'scene' in entetes and entetes[-1] != 'scene':
        avertissements.append("La colonne scene n'est pas en derniere position. MC Note la lit "
                              "quand meme, mais le bouton « Copier » de l'app la place en dernier.")

    # ---- coherence du nombre de champs : trahit un guillemet mal ferme ----
    for numero, ligne in enumerate(donnees, start=2):
        if len(ligne) != len(entetes):
            erreurs.append(f"Ligne {numero} : {len(ligne)} champs au lieu de {len(entetes)}. "
                           "Probablement une virgule, un guillemet ou un retour a la ligne "
                           "non entoure de guillemets doubles.")

    enregistrements = [dict(zip(entetes, [c.strip() for c in l])) for l in donnees]

    if genre == 'bloc-notes':
        vides = [i for i, r in enumerate(enregistrements, start=2)
                 if not r.get('title') and not r.get('content')]
        for i in vides:
            avertissements.append(f"Ligne {i} vide : ignoree par MC Note.")
        utiles = len(enregistrements) - len(vides)
        print(f"Bloc-notes : {utiles} notes.")
        return rapport(erreurs, avertissements)

    # ---- evenement ----
    sequences = {}
    ordre = []
    premiere_seance = None      # numero de la premiere sequence horodatee
    horaire_precedent = None    # (minutes, timing, numero)
    for numero, r in enumerate(enregistrements, start=2):
        timing, titre = r.get('timing', ''), r.get('title', '')
        if not timing and not titre:
            avertissements.append(f"Ligne {numero} : ni timing ni title, elle sera ignoree.")
            continue
        if not titre:
            avertissements.append(f"Ligne {numero} : title vide. La sequence s'affichera « Sans titre ».")
        if timing and not re.search(r'\d{1,2}:\d{2}', timing):
            avertissements.append(f"Ligne {numero} : timing « {timing} » sans heure HH:MM. "
                                  "L'indicateur d'avance/retard ne fonctionnera pas.")
        # Fiches d'information 00:0x : toujours avant la premiere sequence horodatee
        if FICHE_INFO.match(timing):
            if premiere_seance is not None:
                avertissements.append(f"Ligne {numero} : fiche d'information « {timing} » placee apres "
                                      f"la sequence de la ligne {premiere_seance}. Les fiches 00:0x vont en tete.")
        elif minutes(timing) is not None:
            if premiere_seance is None:
                premiere_seance = numero
            m = minutes(timing)
            if horaire_precedent and m < horaire_precedent[0]:
                avertissements.append(f"Ligne {numero} : l'horaire recule ({horaire_precedent[1]} ligne "
                                      f"{horaire_precedent[2]} -> {timing}). Plusieurs jours dans un meme "
                                      "fichier ? Faire un fichier par jour, ou mettre le jour dans chaque "
                                      "titre et chaque scene.")
            horaire_precedent = (m, timing, numero)

        cle = f"{timing}|{titre}"
        if cle not in sequences:
            sequences[cle] = {'lignes': [], 'scene': r.get('scene', ''), 'questions': 0}
            ordre.append(cle)
        sequences[cle]['lignes'].append(numero)
        if r.get('question_text') or r.get('question_content'):
            sequences[cle]['questions'] += 1

        contenu = r.get('question_content', '')
        if ' | ' in contenu and '\n' not in contenu:
            avertissements.append(f"Ligne {numero} : elements separes par « | » sur une seule ligne. "
                                  "A l'ecran tout sera colle. Utiliser des retours a la ligne et des puces « • ».")
        for colonne in ('question_content', 'question_text', 'title', 'people'):
            trou = TROU.search(r.get(colonne, ''))
            if trou:
                avertissements.append(f"Ligne {numero} ({colonne}) : « {trou.group(0)} » ressemble a un texte "
                                      "a completer. Sur scene il serait lu tel quel. Ecrire l'annonce sans "
                                      "l'element manquant et ajouter une ligne « A VERIFIER ».")
        if any(ligne.count('•') >= 2 for ligne in contenu.split('\n')):
            avertissements.append(f"Ligne {numero} : plusieurs puces « • » sur une meme ligne. "
                                  "Chaque puce doit commencer sa propre ligne, sinon la liste s'affiche collee.")
        if len(contenu) > CONTENU_LONG:
            avertissements.append(f"Ligne {numero} : {len(contenu)} caracteres. La zone defilera, "
                                  "avec un repere « suite » ; verifier que c'est voulu.")

    fusions = {c: s for c, s in sequences.items() if len(s['lignes']) > 1}
    for cle, s in fusions.items():
        avertissements.append(f"Lignes {s['lignes']} : meme timing et meme title « {cle} ». "
                              f"MC Note les FUSIONNE en une seule sequence a {s['questions']} questions. "
                              "Si ce sont deux passages distincts, changer l'horaire ou le titre.")

    # ---- scenes ----
    avec_scene = 'scene' in entetes
    if avec_scene:
        noms = {}
        for cle in ordre:
            nom = sequences[cle]['scene']
            if nom:
                noms.setdefault(normaliser(nom), set()).add(nom)
        for variantes in noms.values():
            if len(variantes) > 1:
                erreurs.append(f"Scene ecrite de plusieurs facons : {sorted(variantes)}. "
                               "MC Note en ferait des scenes differentes, de couleurs differentes.")
        distinctes = []
        for cle in ordre:
            nom = sequences[cle]['scene']
            if nom and nom not in distinctes:
                distinctes.append(nom)
        sans = [c for c in ordre if not sequences[c]['scene']]
        if distinctes and sans:
            avertissements.append(f"{len(sans)} sequence(s) sans scene alors que d'autres en ont : "
                                  "elles n'auront pas de couleur.")
        if len(distinctes) > TAILLE_PALETTE:
            avertissements.append(f"{len(distinctes)} scenes : au-dela de {TAILLE_PALETTE}, les couleurs se repetent.")

        # une scene qui revient apres une autre est souvent une erreur de rangement
        vues, precedente = [], None
        for cle in ordre:
            nom = sequences[cle]['scene']
            if not nom or nom == precedente:
                continue
            if nom in vues:
                avertissements.append(f"La scene « {nom} » reapparait apres une autre. L'acces rapide "
                                      "menera a sa premiere occurrence seulement.")
            vues.append(nom)
            precedente = nom
    else:
        distinctes = []

    print(f"Evenement : {len(enregistrements)} lignes -> {len(sequences)} sequences.")
    if distinctes:
        for nom in distinctes:
            n = sum(1 for c in ordre if sequences[c]['scene'] == nom)
            print(f"  scene « {nom} » : {n} sequence(s)")
    return rapport(erreurs, avertissements)


def rapport(erreurs, avertissements):
    for e in erreurs:
        print(f"ERREUR  {e}")
    for a in avertissements:
        print(f"ATTENTION  {a}")
    if not erreurs and not avertissements:
        print("OK  Fichier conforme, pret a importer.")
    elif not erreurs:
        print("OK  Importable. Relire les points signales.")
    else:
        print("BLOQUANT  Corriger les erreurs avant import.")
    return 1 if erreurs else 0


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage : python3 valider_csv.py fichier.csv")
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
