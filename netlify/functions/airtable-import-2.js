const Airtable = require('airtable');
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }

    try {
        const { userId, eventName } = JSON.parse(event.body);

        if (!userId || !eventName) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'userId and eventName required' })
            };
        }

        // Initialize Airtable
        const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
            .base(process.env.AIRTABLE_BASE_ID);

        // Fetch records from Airtable
        const records = await base(process.env.AIRTABLE_TABLE_NAME || 'Timeline')
            .select({
                view: 'Grid view',
                sort: [{ field: 'timing', direction: 'asc' }]
            })
            .all();

        if (records.length === 0) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    sequencesCount: 0,
                    message: 'Aucune donnée trouvée dans Airtable'
                })
            };
        }

        // Create event in Firestore
        const eventRef = await db.collection('events').add({
            name: eventName,
            owner: userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Group records by timing+title
        const sequenceGroups = new Map();

        records.forEach(record => {
            const fields = record.fields;
            const timing = (fields.timing || fields.Timing || '').toString().trim();
            const title = (fields.title || fields.Title || '').toString().trim();
            const people = (fields.people || fields.People || fields.Intervenant || '').toString().trim();
            const questionText = (fields.question_text || fields['Question Text'] || '').toString().trim();
            const questionContent = (fields.question_content || fields['Question Content'] || fields.Content || '').toString().trim();

            if (!timing && !title) return;

            const key = `${timing}|${title}`;

            if (!sequenceGroups.has(key)) {
                sequenceGroups.set(key, {
                    timing,
                    title,
                    people,
                    questions: []
                });
            }

            if (questionText || questionContent) {
                sequenceGroups.get(key).questions.push({
                    text: questionText,
                    content: questionContent
                });
            }
        });

        // Save sequences to Firestore
        const batch = db.batch();
        let sequencesCount = 0;

        sequenceGroups.forEach((sequence) => {
            const seqRef = db.collection('events').doc(eventRef.id).collection('sequences').doc();
            batch.set(seqRef, {
                ...sequence,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            sequencesCount++;
        });

        await batch.commit();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                sequencesCount,
                eventId: eventRef.id,
                message: `Événement "${eventName}" créé avec ${sequencesCount} séquences`
            })
        };

    } catch (error) {
        console.error('Airtable import error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message || 'Internal server error'
            })
        };
    }
};
