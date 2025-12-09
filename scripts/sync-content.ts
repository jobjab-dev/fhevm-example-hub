
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const APP_DATA_DIR = path.join(ROOT_DIR, 'app', 'src', 'data');
const CATALOG_PATH = path.join(APP_DATA_DIR, 'catalog.json');
const CONTENT_PATH = path.join(APP_DATA_DIR, 'content.json');

async function main() {
    console.log('🔄 Syncing content.json with catalog and source files...');

    // 1. Read Catalog
    if (!fs.existsSync(CATALOG_PATH)) {
        console.error(`❌ Catalog not found at ${CATALOG_PATH}`);
        process.exit(1);
    }
    const catalog = await fs.readJson(CATALOG_PATH);

    const contentMap: Record<string, { contract: string; test: string }> = {};
    let successCount = 0;
    let failCount = 0;

    // 2. Iterate and Read Files
    for (const [key, entry] of Object.entries(catalog)) {
        const entryData = entry as { contract: string; test: string };

        // Resolve paths relative to ROOT_DIR
        const contractPath = path.join(ROOT_DIR, entryData.contract);
        const testPath = path.join(ROOT_DIR, entryData.test);

        let contractContent = '';
        let testContent = '';

        // Read Contract
        if (fs.existsSync(contractPath)) {
            try {
                contractContent = await fs.readFile(contractPath, 'utf8');
                // Normalize line endings
                contractContent = contractContent.replace(/\r\n/g, '\n').trim();
            } catch (e: any) {
                console.error(`⚠️ Error reading contract for ${key}: ${e.message}`);
            }
        } else {
            console.warn(`⚠️ Contract file not found for ${key}: ${entryData.contract}`);
        }

        // Read Test
        if (fs.existsSync(testPath)) {
            try {
                testContent = await fs.readFile(testPath, 'utf8');
                // Normalize line endings
                testContent = testContent.replace(/\r\n/g, '\n').trim();
            } catch (e: any) {
                console.error(`⚠️ Error reading test for ${key}: ${e.message}`);
            }
        } else {
            console.warn(`⚠️ Test file not found for ${key}: ${entryData.test}`);
        }

        // Only add if we have at least one of them? Or always add (with empty strings) to match catalog?
        // Let's match catalog keys, even if content is missing (UI might handle empty strings).
        // But checking Detail.tsx, it shows "Loading..." if undefined, so empty string is better than undefined.
        contentMap[key] = {
            contract: contractContent,
            test: testContent
        };

        if (contractContent && testContent) {
            successCount++;
        } else {
            failCount++;
        }
    }

    // 3. Write content.json
    await fs.writeJson(CONTENT_PATH, contentMap, { spaces: 2 });
    console.log(`✅ content.json updated.`);
    console.log(`   Processed ${Object.keys(catalog).length} entries.`);
    console.log(`   ${successCount} entries have both contract and test.`);
    console.log(`   ${failCount} entries missing one or both files.`);

}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
