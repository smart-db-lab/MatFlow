const fs = require('fs');
const file = 'client/src/util/modelDatasetSync.js';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `        return fileSet.has(trainFilePath) && fileSet.has(testFilePath);`;
const newStr = `        const hasTrain = fileSet.has(trainFilePath);
        const hasTest = fileSet.has(testFilePath);
        
        console.log("[modelDatasetSync] Checking split entry:", datasetName, {
            trainFilePath, hasTrain,
            testFilePath, hasTest
        });

        if (hasTrain && hasTest) return true;
        
        // Sometimes the folder from meta[5] is mismatched slightly, check just filename matching loosely
        const hasTrainLoose = Array.from(fileSet).some(f => f.includes(metaTrain));
        const hasTestLoose = Array.from(fileSet).some(f => f.includes(metaTest));
        
        if (hasTrainLoose && hasTestLoose) return true;

        return false;`;

if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(file, content);
    console.log("Updated modelDatasetSync.js");
} else {
    console.log("Could not find Target string in modelDatasetSync.js");
}
