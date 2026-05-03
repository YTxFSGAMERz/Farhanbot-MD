const fs = require('fs');
const path = require('path');

const sessionPath = path.join(__dirname, 'session');

console.log('🔄 Preparing to reset session...');

try {
    if (fs.existsSync(sessionPath)) {
        console.log('🗑️ Deleting session folder...');
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log('✅ Session folder deleted successfully. You can now scan the QR code or pair again.');
    } else {
        console.log('✅ No session folder found, ready for a fresh start.');
    }
} catch (error) {
    console.error('❌ Error deleting session folder:', error.message);
}
