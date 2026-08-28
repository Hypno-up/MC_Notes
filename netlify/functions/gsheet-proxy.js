// netlify/functions/gsheet-proxy.js
// Uses native fetch (Node 18+)

exports.handler = async (event) => {
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
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { url } = JSON.parse(event.body);
        
        if (!url) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'URL required' }) };
        }

        // Validate it's a Google Sheets URL
        if (!url.includes('docs.google.com/spreadsheets')) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid Google Sheets URL' }) };
        }

        // Transform URL to CSV export format
        let csvUrl = url;
        
        // Case 1: Published URL like /d/e/.../pubhtml
        if (url.includes('/d/e/')) {
            if (url.includes('/pubhtml')) {
                csvUrl = url.replace('/pubhtml', '/pub?output=csv');
            } else if (url.includes('/pub') && !url.includes('output=csv')) {
                csvUrl = url.includes('?') ? url + '&output=csv' : url + '?output=csv';
            }
        }
        // Case 2: Regular edit URL like /d/SPREADSHEET_ID/edit
        else {
            const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (match) {
                const sheetId = match[1];
                const gidMatch = url.match(/gid=(\d+)/);
                const gid = gidMatch ? gidMatch[1] : '0';
                csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
            }
        }

        console.log('Fetching:', csvUrl);

        // Fetch the CSV
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            return { 
                statusCode: response.status, 
                headers, 
                body: JSON.stringify({ 
                    error: `Failed to fetch: ${response.status} ${response.statusText}`,
                    url: csvUrl 
                }) 
            };
        }

        const csvText = await response.text();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                csv: csvText,
                url: csvUrl
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
