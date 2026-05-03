const admin = require('firebase-admin');
const { initAuthCreds, BufferJSON, proto } = require('@whiskeysockets/baileys');

/**
 * Custom Baileys authentication state using Firebase Firestore
 * @param {string} sessionId - Unique session ID for the bot
 * @returns {Promise<import('@whiskeysockets/baileys').AuthenticationState>}
 */
async function useFirestoreAuthState(sessionId) {
    if (!admin.apps.length) {
        console.log('🔍 Checking FIREBASE_CREDENTIALS... Status:', !!process.env.FIREBASE_CREDENTIALS);
        if (process.env.FIREBASE_CREDENTIALS) {
            try {
                const rawConfig = process.env.FIREBASE_CREDENTIALS.trim();
                const configStr = rawConfig.startsWith('{') 
                    ? rawConfig 
                    : Buffer.from(rawConfig, 'base64').toString();
                
                const firebaseConfig = JSON.parse(configStr);
                
                // Fix private key formatting (common issue with environment variables)
                if (firebaseConfig.private_key && typeof firebaseConfig.private_key === 'string') {
                    firebaseConfig.private_key = firebaseConfig.private_key.replace(/\\n/g, '\n');
                }

                console.log('✅ Firebase Project ID:', firebaseConfig.project_id);

                // Write to temp file to ensure admin.credential.cert parses it correctly
                const fs = require('fs');
                const path = require('path');
                const tempDir = path.join(process.cwd(), 'temp');
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
                
                const keyPath = path.join(tempDir, 'firebase-key.json');
                fs.writeFileSync(keyPath, JSON.stringify(firebaseConfig));
                
                admin.initializeApp({
                    credential: admin.credential.cert(keyPath),
                    databaseURL: `https://${firebaseConfig.project_id}.firebaseio.com`
                });
            } catch (e) {
                console.error('❌ Failed to parse or initialize Firebase:', e.message);
                admin.initializeApp(); // Fallback to default
            }
        } else {
            admin.initializeApp();
        }
    }
    const db = admin.firestore();
    const collection = db.collection('whatsapp_sessions').doc(sessionId);

    const readData = async (id) => {
        const doc = await collection.collection('keys').doc(id).get();
        if (doc.exists) {
            const data = JSON.stringify(doc.data());
            return JSON.parse(data, BufferJSON.reviver);
        }
        return null;
    };

    const writeData = async (id, data) => {
        const value = JSON.parse(JSON.stringify(data, BufferJSON.replacer));
        await collection.collection('keys').doc(id).set(value);
    };

    const deleteData = async (id) => {
        await collection.collection('keys').doc(id).delete();
    };

    // Load credentials
    const credsDoc = await collection.get();
    let creds = credsDoc.exists ? JSON.parse(JSON.stringify(credsDoc.data()), BufferJSON.reviver) : initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const name = `${category}-${id}`;
                            tasks.push(value ? writeData(name, value) : deleteData(name));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: async () => {
            const value = JSON.parse(JSON.stringify(creds, BufferJSON.replacer));
            await collection.set(value, { merge: true });
        }
    };
}

module.exports = { useFirestoreAuthState };
