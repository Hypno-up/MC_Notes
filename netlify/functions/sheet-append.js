// netlify/functions/sheet-append.js
//
// Relais entre l'application et le script Apps Script qui écrit dans la
// feuille. Son rôle est de garder le jeton : l'application est du code
// client, tout secret qu'elle porterait serait lisible par n'importe qui.

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const url = process.env.APPS_SCRIPT_URL;
    const jeton = process.env.APPS_SCRIPT_JETON;

    // Tant que le script n'est pas déployé, on le dit franchement : l'appelant
    // bascule alors sur le presse-papiers plutôt que d'afficher une erreur.
    if (!url || !jeton) {
        return {
            statusCode: 501,
            headers,
            body: JSON.stringify({ error: 'non_configure' })
        };
    }

    try {
        const { sourceUrl, valeurs } = JSON.parse(event.body || '{}');

        const identifiant = String(sourceUrl || '').match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (!identifiant) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'URL de feuille invalide' }) };
        }
        if (!valeurs || typeof valeurs !== 'object') {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Valeurs manquantes' }) };
        }

        const gidTrouve = String(sourceUrl).match(/gid=(\d+)/);

        const reponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jeton,
                classeurId: identifiant[1],
                gid: gidTrouve ? gidTrouve[1] : null,
                valeurs
            })
        });

        const texte = await reponse.text();
        let resultat;
        try {
            resultat = JSON.parse(texte);
        } catch (e) {
            // Apps Script renvoie une page HTML quand le déploiement est mal
            // configuré — typiquement « Qui a accès » resté sur « Moi seul ».
            return {
                statusCode: 502,
                headers,
                body: JSON.stringify({ error: "Le script n'a pas répondu en JSON. Vérifiez que le déploiement est accessible à tout le monde." })
            };
        }

        if (resultat.erreur) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: resultat.erreur }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, ...resultat }) };
    } catch (error) {
        console.error('sheet-append:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: String(error) }) };
    }
};
