import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'app/src/data/content.json');

async function generateContentMap() {
    const catalogPath = path.join(ROOT_DIR, 'example-catalog.json');
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    
    const contentMap: Record<string, { contract: string; test: string }> = {};

    for (const [key, config] of Object.entries(catalog)) {
        const c = config as any;
        const contractPath = path.join(ROOT_DIR, c.contract);
        const testPath = path.join(ROOT_DIR, c.test);

        contentMap[key] = {
            contract: fs.existsSync(contractPath) ? fs.readFileSync(contractPath, 'utf-8') : '// Contract not found',
            test: fs.existsSync(testPath) ? fs.readFileSync(testPath, 'utf-8') : '// Test not found'
        };
    }

    // Ensure directory exists
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(contentMap, null, 2));
    console.log(`✅ Content map generated at: ${OUTPUT_FILE}`);
}

generateContentMap();

