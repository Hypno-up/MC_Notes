/**
 * MCNote — ajout d'une ligne dans une feuille Google Sheets.
 *
 * À déployer une seule fois, depuis n'importe quelle feuille ou depuis
 * script.google.com, en « Application web » exécutée en votre nom. Le script
 * peut alors écrire dans toutes les feuilles auxquelles vous avez accès, sans
 * qu'aucune clé Google ne circule.
 *
 * L'URL de déploiement est une capacité en soi : quiconque la possède peut
 * appeler le script. Elle n'est donc jamais mise dans l'application — elle
 * reste dans les variables d'environnement Netlify, avec un jeton partagé
 * vérifié ci-dessous.
 *
 * INSTALLATION
 *   1. script.google.com → Nouveau projet → coller ce fichier
 *   2. Remplacer JETON par une longue chaîne aléatoire, à vous
 *   3. Déployer → Nouveau déploiement → type « Application web »
 *      · Exécuter en tant que : moi
 *      · Qui a accès : tout le monde
 *   4. Copier l'URL /exec obtenue
 *   5. Dans Netlify → Site settings → Environment variables :
 *      · APPS_SCRIPT_URL   = l'URL /exec
 *      · APPS_SCRIPT_JETON = le jeton choisi à l'étape 2
 */

var JETON = 'REMPLACER_PAR_UNE_LONGUE_CHAINE_ALEATOIRE';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return repondre({ erreur: 'Requête vide' });
    }

    var requete = JSON.parse(e.postData.contents);

    if (requete.jeton !== JETON) {
      return repondre({ erreur: 'Jeton invalide' });
    }
    if (!requete.classeurId) {
      return repondre({ erreur: 'Identifiant de classeur manquant' });
    }

    var classeur = SpreadsheetApp.openById(requete.classeurId);
    var feuille = trouverOnglet(classeur, requete.gid);

    var largeur = feuille.getLastColumn();
    if (largeur < 1) return repondre({ erreur: 'Feuille sans en-têtes' });

    var entetes = feuille.getRange(1, 1, 1, largeur).getValues()[0].map(function (h) {
      return String(h).trim().toLowerCase();
    });

    // Les valeurs sont posées d'après le nom des colonnes, jamais d'après leur
    // position : une feuille dont les colonnes ont été réordonnées reste
    // alimentée correctement.
    var valeurs = requete.valeurs || {};
    var ligne = entetes.map(function (entete) {
      return Object.prototype.hasOwnProperty.call(valeurs, entete) ? valeurs[entete] : '';
    });

    feuille.appendRow(ligne);

    return repondre({
      ok: true,
      onglet: feuille.getName(),
      ligne: feuille.getLastRow()
    });
  } catch (err) {
    return repondre({ erreur: String(err) });
  }
}

function trouverOnglet(classeur, gid) {
  if (gid === null || gid === undefined || gid === '') return classeur.getSheets()[0];
  var onglets = classeur.getSheets();
  for (var i = 0; i < onglets.length; i++) {
    if (String(onglets[i].getSheetId()) === String(gid)) return onglets[i];
  }
  return classeur.getSheets()[0];
}

function repondre(charge) {
  return ContentService
    .createTextOutput(JSON.stringify(charge))
    .setMimeType(ContentService.MimeType.JSON);
}
