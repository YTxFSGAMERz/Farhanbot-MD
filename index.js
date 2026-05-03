/**
 * FarhanBot-MD - A WhatsApp Bot
 * Copyright (c) 2024 YTxFSGAMERz
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 * 
 * Credits:
 * - Baileys Library by @adiwajshing
 * - Coded by YTxFSGAMERz
 */
require('dotenv').config()
require('./settings')
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const { Boom } = require('@hapi/boom')

const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
// Using a lightweight persisted store instead of makeInMemoryStore (compat across versions)
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')
const qrcode = require('qrcode-terminal')

// Import lightweight store
const store = require('./lib/lightweight_store')

// Initialize store
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// Memory optimization - Force garbage collection if available
setInterval(() => {
    if (global.gc) {
        global.gc()
        console.log('🧹 Garbage collection completed')
    }
}, 60_000) // every 1 minute



let phoneNumber = process.env.PHONE_NUMBER || ""
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "FarhanBot-MD"
global.themeemoji = "•"
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code") || process.env.PAIRING_CODE === "true"
const useMobile = process.argv.includes("--mobile")


// Only create readline interface if we're in an interactive environment
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        // In non-interactive environment, use ownerNumber from settings
        return Promise.resolve(settings.ownerNumber || phoneNumber)
    }
}



// Start a simple server for Hugging Face Space health checks
const express = require('express');
const app = express();
const port = process.env.PORT || 7860;

app.get('/', (req, res) => {
    res.send('FarhanBot-MD is running!');
});

let serverStarted = false;
async function startYTxFSGAMERzInc() {
    if (!serverStarted) {
        app.listen(port, () => {
            console.log(`📡 Health check server listening on port ${port}`);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`📡 Health check server: Port ${port} already in use. Continuing...`);
            } else {
                console.error('❌ Health check server error:', err.message);
            }
        });
        serverStarted = true;
    }
    try {
        let { version, isLatest } = await fetchLatestBaileysVersion()
        let state, saveCreds;
        if (process.env.SESSION_TYPE === 'firebase') {
            const { useFirestoreAuthState } = require('./lib/firebase_auth');
            const result = await useFirestoreAuthState(process.env.SESSION_ID || 'YTxFSGAMERz-session');
            state = result.state;
            saveCreds = result.saveCreds;
            console.log('✅ Using Firebase Firestore for session storage');
        } else {
            const result = await useMultiFileAuthState(`./session`);
            state = result.state;
            saveCreds = result.saveCreds;
        }
        const msgRetryCounterCache = new NodeCache()

        const YTxFSGAMERzInc = makeWASocket({
            version, // Use the fetched latest version
            logger: pino({ level: 'silent' }),
            browser: ["FarhanBot-MD", "Safari", "17.0"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            shouldSyncHistoryMessage: () => false,
            printQRInTerminal: false,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 180000,
            connectTimeoutMs: 180000,
            keepAliveIntervalMs: 60000,
            options: {
                family: 4
            }
        })


        // Save credentials when they update
        YTxFSGAMERzInc.ev.on('creds.update', saveCreds)

    store.bind(YTxFSGAMERzInc.ev)

    // Message handling
    YTxFSGAMERzInc.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(YTxFSGAMERzInc, chatUpdate);
                return;
            }
            // In private mode, only block non-group messages (allow groups for moderation)
            // Note: YTxFSGAMERzInc.public is not synced, so we check mode in main.js instead
            // This check is kept for backward compatibility but mainly blocks DMs
            if (!YTxFSGAMERzInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                const isGroup = mek.key?.remoteJid?.endsWith('@g.us')
                if (!isGroup) return // Block DMs in private mode, but allow group messages
            }
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

            // Clear message retry cache to prevent memory bloat
            if (YTxFSGAMERzInc?.msgRetryCounterCache) {
                YTxFSGAMERzInc.msgRetryCounterCache.clear()
            }

            try {
                await handleMessages(YTxFSGAMERzInc, chatUpdate, true)
            } catch (err) {
                console.error("Error in handleMessages:", err)
                // Only try to send error message if we have a valid chatId
                if (mek.key && mek.key.remoteJid) {
                    await YTxFSGAMERzInc.sendMessage(mek.key.remoteJid, {
                        text: '❌ An error occurred while processing your message.',
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '',
                                newsletterName: 'FarhanBot-MD',
                                serverMessageId: -1
                            }
                        }
                    }).catch(console.error);
                }
            }
        } catch (err) {
            console.error("Error in messages.upsert:", err)
        }
    })

    // Add these event handlers for better functionality
    YTxFSGAMERzInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    YTxFSGAMERzInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = YTxFSGAMERzInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    YTxFSGAMERzInc.getName = (jid, withoutContact = false) => {
        id = YTxFSGAMERzInc.decodeJid(jid)
        withoutContact = YTxFSGAMERzInc.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = YTxFSGAMERzInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === YTxFSGAMERzInc.decodeJid(YTxFSGAMERzInc.user.id) ?
            YTxFSGAMERzInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    YTxFSGAMERzInc.public = true

    YTxFSGAMERzInc.serializeM = (m) => smsg(YTxFSGAMERzInc, m, store)

    // Handle pairing code
    if (pairingCode && !YTxFSGAMERzInc.authState.creds.registered) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        let phoneNumber
        if (!!global.phoneNumber) {
            phoneNumber = global.phoneNumber
        } else {
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number 😍\nFormat: 6281376552730 (without + or spaces) : `)))
        }

        // Clean the phone number - remove any non-digit characters
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

        // Validate the phone number using awesome-phonenumber
        const pn = require('awesome-phonenumber');
        if (!pn('+' + phoneNumber).isValid()) {
            console.log(chalk.red('Invalid phone number. Please enter your full international number (e.g., 15551234567 for US, 447911123456 for UK, etc.) without + or spaces.'));
            process.exit(1);
        }

        setTimeout(async () => {
            try {
                let code = await YTxFSGAMERzInc.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
                console.log(chalk.yellow(`\nPlease enter this code in your WhatsApp app:\n1. Open WhatsApp\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter the code shown above`))
            } catch (error) {
                console.error('Error requesting pairing code:', error)
                console.log(chalk.red('Failed to get pairing code. Please check your phone number and try again.'))
            }
        }, 3000)
    }

    // Connection handling
    YTxFSGAMERzInc.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if (qr) {
            console.log(chalk.blue('📱 QR Code generated. Please scan with WhatsApp.'))
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'connecting') {
            console.log(chalk.yellow('⏳ Connecting to WhatsApp...'))
        }
        
        if (connection === 'open') {
            console.log(chalk.green('✅ Connected to WhatsApp => ' + YTxFSGAMERzInc.user.id.split(':')[0]))

            if (!global.hasConnectedMessageSent) {
                try {
                    const botNumber = YTxFSGAMERzInc.user.id.split(':')[0] + '@s.whatsapp.net';
                    await YTxFSGAMERzInc.sendMessage(botNumber, {
                        text: `🤖 Bot Connected Successfully!\n\n⏰ Time: ${new Date().toLocaleString()}\n✅ Status: Online and Ready!\n\n✅Make sure to join below channel`,
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '',
                                newsletterName: 'FarhanBot-MD',
                                serverMessageId: -1
                            }
                        }
                    });
                    global.hasConnectedMessageSent = true;
                } catch (error) {
                    console.error('Error sending connection message:', error.message)
                }
            }

            await delay(1999)
            console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${global.botname || 'FarhanBot-MD'} ]`)}\n\n`))
            console.log(chalk.cyan(`< ================================================== >`))
            console.log(chalk.cyan(`< ================================================== >`))
            console.log(chalk.green(`${global.themeemoji || '•'} 🤖 Bot Connected Successfully! ✅`))
            console.log(chalk.blue(`Bot Version: ${settings.version}`))
        }
        
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            const isLoggedOut = statusCode === DisconnectReason.loggedOut
            const reason = lastDisconnect?.error?.message || 'Unknown'
            
            console.log(chalk.red(`❌ Connection closed. Reason: ${reason} (Code: ${statusCode})`))
            console.log(chalk.yellow(`🔄 Reconnecting: ${!isLoggedOut}`))
            
            if (isLoggedOut || statusCode === 401) {
                try {
                    rmSync('./session', { recursive: true, force: true })
                    console.log(chalk.yellow('Session folder deleted. Please re-authenticate.'))
                } catch (error) {
                    console.error('Error deleting session:', error)
                }
                console.log(chalk.red('Session logged out. Please re-authenticate.'))
            }
            
            if (!isLoggedOut) {
                console.log(chalk.yellow('Reconnecting...'))
                await delay(5000)
                startYTxFSGAMERzInc()
            } else {
                console.log(chalk.red('Connection closed because you logged out. Please re-authenticate.'))
            }
        }
    })

    // Track recently-notified callers to avoid spamming messages
    const antiCallNotified = new Set();

    // Anticall handler: block callers when enabled
    YTxFSGAMERzInc.ev.on('call', async (calls) => {
        try {
            const { readState: readAnticallState } = require('./commands/anticall');
            const state = readAnticallState();
            if (!state.enabled) return;
            for (const call of calls) {
                const callerJid = call.from || call.peerJid || call.chatId;
                if (!callerJid) continue;
                try {
                    // First: attempt to reject the call if supported
                    try {
                        if (typeof YTxFSGAMERzInc.rejectCall === 'function' && call.id) {
                            await YTxFSGAMERzInc.rejectCall(call.id, callerJid);
                        } else if (typeof YTxFSGAMERzInc.sendCallOfferAck === 'function' && call.id) {
                            await YTxFSGAMERzInc.sendCallOfferAck(call.id, callerJid, 'reject');
                        }
                    } catch {}

                    // Notify the caller only once within a short window
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid);
                        setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                        await YTxFSGAMERzInc.sendMessage(callerJid, { text: '📵 Anticall is enabled. Your call was rejected and you will be blocked.' });
                    }
                } catch {}
                // Then: block after a short delay to ensure rejection and message are processed
                setTimeout(async () => {
                    try { await YTxFSGAMERzInc.updateBlockStatus(callerJid, 'block'); } catch {}
                }, 800);
            }
        } catch (e) {
            // ignore
        }
    });

    YTxFSGAMERzInc.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(YTxFSGAMERzInc, update);
    });

    YTxFSGAMERzInc.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(YTxFSGAMERzInc, m);
        }
    });

    YTxFSGAMERzInc.ev.on('status.update', async (status) => {
        await handleStatus(YTxFSGAMERzInc, status);
    });

    YTxFSGAMERzInc.ev.on('messages.reaction', async (status) => {
        await handleStatus(YTxFSGAMERzInc, status);
    });

    return YTxFSGAMERzInc
    } catch (error) {
        console.error('Error in startYTxFSGAMERzInc:', error)
        await delay(5000)
        startYTxFSGAMERzInc()
    }
}


// Start the bot with error handling
startYTxFSGAMERzInc().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
})
