
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const APP_DATA_DIR = path.join(ROOT_DIR, 'app', 'src', 'data');
const CATALOG_PATH = path.join(APP_DATA_DIR, 'catalog.json');
const CONTENT_PATH = path.join(APP_DATA_DIR, 'content.json');

interface CatalogEntry {
    contract: string;
    test: string;
    extraDoc?: string;
    keyConcepts?: string[];
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
}

interface ContentEntry {
    contract: string;
    test: string;
    extraDoc?: string;
    keyConcepts?: string[];
}

async function main() {
    console.log('🔄 Syncing content.json with catalog and source files...');

    // 1. Read Catalog
    if (!fs.existsSync(CATALOG_PATH)) {
        console.error(`❌ Catalog not found at ${CATALOG_PATH}`);
        process.exit(1);
    }
    const catalog: Record<string, CatalogEntry> = await fs.readJson(CATALOG_PATH);

    const contentMap: Record<string, ContentEntry> = {};
    let successCount = 0;
    let failCount = 0;

    // 2. Iterate and Read Files
    for (const [key, entry] of Object.entries(catalog)) {
        // Resolve paths relative to ROOT_DIR
        const contractPath = path.join(ROOT_DIR, entry.contract);
        const testPath = path.join(ROOT_DIR, entry.test);

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
            console.warn(`⚠️ Contract file not found for ${key}: ${entry.contract}`);
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
            console.warn(`⚠️ Test file not found for ${key}: ${entry.test}`);
        }

        // Build content entry with extraDoc and keyConcepts from catalog
        contentMap[key] = {
            contract: contractContent,
            test: testContent,
        };

        // Include extraDoc if present
        if (entry.extraDoc) {
            contentMap[key].extraDoc = entry.extraDoc;
        }

        // Include keyConcepts if present
        if (entry.keyConcepts && entry.keyConcepts.length > 0) {
            contentMap[key].keyConcepts = entry.keyConcepts;
        }

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
