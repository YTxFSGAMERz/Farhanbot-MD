const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const excludeDirs = ["node_modules", ".git", "session", "FarhanMedia", "Media"];

const replacements = [
    { regex: /YTxFSGAMERz-MD/g, replace: "FarhanBot-MD" },
    { regex: /YTxFSGAMERz MD/g, replace: "FarhanBot MD" },
    // Also handling the stylized knightbot version we changed to YTxFSGAMERz-MD if we want, but wait, YTxFSGAMERz-MD captures all of them now.
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
                if (file === "replace_names.js" || file === "revert_botname.js") continue;
                let content = fs.readFileSync(fullPath, "utf-8");
                let changed = false;
                
                // Do not replace inside package-lock.json
                if (file === "package-lock.json") continue;

                for (const { regex, replace } of replacements) {
                    if (regex.test(content)) {
                        content = content.replace(regex, replace);
                        changed = true;
                    }
                }

                if (changed) {
                    fs.writeFileSync(fullPath, content, "utf-8");
                    console.log(`Updated: ${fullPath}`);
                }
            }
        }
    }
}

processDirectory(rootDir);
console.log("Done reverting bot name.");
