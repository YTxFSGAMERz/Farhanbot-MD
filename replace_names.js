
const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const excludeDirs = ["node_modules", ".git", "session", "FarhanMedia"];

const replacements = [
    { regex: /Farhanbot-MD/gi, replace: "FSGAMERz-MD" },
    { regex: /Farhanbot MD/gi, replace: "FSGAMERz MD" },
    { regex: /Farhanbot/gi, replace: "FSGAMERz" },
    { regex: /FarhanBotInc/g, replace: "botSocket" },
    { regex: /FarhanMedia/g, replace: "Media" },
    { regex: /Farhan/gi, replace: "FSGAMERz" },
    { regex: /KnightBot-MD/gi, replace: "FSGAMERz-MD" },
    { regex: /𝐊𝐧𝐢𝐠𝐡𝐭𝐁𝐨𝐭-𝐌𝐃/gi, replace: "FSGAMERz-MD" }
];

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!excludeDirs.includes(file)) {
                processDirectory(fullPath);
            }
        } else {
            if (fullPath.endsWith(".js") || fullPath.endsWith(".json") || fullPath.endsWith(".md")) {
                if (file === "replace_names.js") continue; // Skip this script itself
                let content = fs.readFileSync(fullPath, "utf-8");
                let changed = false;
                
                // Do not replace inside package-lock.json to avoid breaking it
                if (file === "package-lock.json") continue;
                
                // Keep the GitHub URL intact
                const originalGithubUrl = "github.com/YTxFSGAMERz/FSGAMERz-MD"; 
                // Wait, if it replaces Farhanbot-MD it becomes FSGAMERz-MD

                for (const { regex, replace } of replacements) {
                    if (regex.test(content)) {
                        content = content.replace(regex, replace);
                        changed = true;
                    }
                }

                // Restore original Github URL
                content = content.replace(/github\.com\/YTxFSGAMERz\/FSGAMERz-MD/g, "github.com/YTxFSGAMERz/Farhanbot-MD");

                if (changed) {
                    fs.writeFileSync(fullPath, content, "utf-8");
                    console.log(`Updated: ${fullPath}`);
                }
            }
        }
    }
}

processDirectory(rootDir);
console.log("Done replacing names.");

