
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const contentJsonPath = 'd:/Web3_Project/Zama-December/fhevm-example-hub/app/src/data/content.json';
const examplesDir = 'd:/Web3_Project/Zama-December/fhevm-example-hub/examples/contracts';

const content = JSON.parse(fs.readFileSync(contentJsonPath, 'utf8'));

// Map of JSON keys to expected file paths (heuristic or manual mapping)
// We need to find the files.
function findFile(dir, filename) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            const result = findFile(fullPath, filename);
            if (result) return result;
        } else if (file === filename) {
            return fullPath;
        }
    }
    return null;
}

// Approximate mapping based on keys
const keyToFilename = {
    'fhe-counter': 'FHECounter.sol',
    'encrypt-single-value': 'EncryptSingleValue.sol',
    'encrypt-multiple-values': 'EncryptMultipleValues.sol',
    'user-decrypt-single-value': 'UserDecryptSingleValue.sol',
    'user-decrypt-multiple-values': 'UserDecryptMultipleValues.sol',
    'public-decrypt-single-value': 'PublicDecryptSingleValue.sol',
    'public-decrypt-multiple-values': 'PublicDecryptMultipleValues.sol',
    'fhe-operations': 'FHEOperations.sol',
    'fhe-if-then-else': 'FHEIfThenElse.sol',
    'access-control': 'AccessControlExample.sol',
    'input-proofs': 'InputProofExample.sol',
    'anti-patterns': 'AntiPatternExample.sol',
    'handles': 'HandleExample.sol',
    'blind-auction': 'BlindAuction.sol',
    'lab-input-proof': 'LabInputProof.sol',
    'lab-wrong-signer': 'LabWrongSigner.sol',
    'lab-replay-attack': 'LabReplayAttack.sol',
    'erc7984-example': 'ERC7984Example.sol',
    'erc20-wrapper': 'ERC20WrapperExample.sol',
    'erc7984-erc20-swap': 'SwapERC7984ERC20.sol',
    'erc7984-erc7984-swap': 'SwapERC7984ERC7984.sol',
};

// Also check for HeadsOrTails and HighestDieRoll manually if needed
keyToFilename['public-decrypt-single-value'] = 'PublicDecryptSingleValue.sol';
// Wait, I saw PublicDecryptSingleValue.sol in the file list earlier? 
// Let's re-verify the mapping. 
// "public-decrypt-single-value" key in content.json had "HeadsOrTails" contract name in the view_file output.
// But the file name on disk was PublicDecryptSingleValue.sol.
// Let's stick to the file names I saw in the list_dir output.
// basic/decrypt/PublicDecryptSingleValue.sol -> content: HeadsOrTails contract
// So the file name on disk IS PublicDecryptSingleValue.sol

console.log('--- Comparison Results ---');

for (const [key, entry] of Object.entries(content)) {
    const filename = keyToFilename[key];
    if (!filename) {
        console.log(`[UNKNOWN] No filename mapping for key: ${key}`);
        continue;
    }

    const filePath = findFile(examplesDir, filename);
    if (!filePath) {
        console.log(`[MISSING] File not found for ${key}: ${filename}`);
        continue;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    // Normalize line endings
    const normJsonContent = entry.contract.replace(/\r\n/g, '\n').trim();
    const normFileContent = fileContent.replace(/\r\n/g, '\n').trim();

    if (normJsonContent !== normFileContent) {
        console.log(`[MISMATCH] Content mismatch for ${key} (${filename})`);
    } else {
        console.log(`[MATCH] ${key} is up to date.`);
    }
}

// Check for files in directory not in JSON
console.log('\n--- checking for missing keys ---');
const allSolFiles = [];
function collectSolFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            collectSolFiles(fullPath);
        } else if (file.endsWith('.sol')) {
            allSolFiles.push(file);
        }
    }
}
collectSolFiles(examplesDir);

const usedFilenames = Object.values(keyToFilename);
for (const file of allSolFiles) {
    if (!usedFilenames.includes(file)) {
        console.log(`[NEW FILE] ${file} is not mapped in content.json`);
        // We might want to add this to the plan
    }
}
