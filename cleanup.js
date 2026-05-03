const fs = require('fs');
const path = require('path');

const sessionPath = path.join(__dirname, 'session');

// Keep core session files, but clean up temporary ones
const filesToKeep = ['creds.json'];

console.log('🧹 Cleaning up session folder...');

try {
    if (fs.existsSync(sessionPath)) {
        const files = fs.readdirSync(sessionPath);
        let deletedCount = 0;
        
        for (const file of files) {
            if (!filesToKeep.includes(file)) {
                const filePath = path.join(sessionPath, file);
                try {
                    if (fs.statSync(filePath).isDirectory()) {
                        fs.rmSync(filePath, { recursive: true, force: true });
                    } else {
                        fs.unlinkSync(filePath);
                    }
                    deletedCount++;
                } catch (e) {
                    console.error(`Failed to delete ${file}:`, e.message);
                }
            }
        }
        console.log(`✅ Cleaned up ${deletedCount} temporary session files.`);
    } else {
        console.log('✅ No session folder found, nothing to clean.');
    }
} catch (error) {
    console.error('❌ Error during cleanup:', error.message);
}
