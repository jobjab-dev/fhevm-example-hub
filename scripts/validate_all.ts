import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
// @ts-ignore
import { EXAMPLES_MAP, createExample } from './create-fhevm-example.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_BASE = path.join(__dirname, '..', 'validation_output');

function log(msg: string) {
    console.log(`[VALIDATION] ${msg}`);
}

async function validateAll() {
    if (fs.existsSync(OUTPUT_BASE)) {
        fs.rmSync(OUTPUT_BASE, { recursive: true, force: true });
    }
    fs.mkdirSync(OUTPUT_BASE);

    const examples = Object.keys(EXAMPLES_MAP);
    let failed = 0;

    console.log(`Found ${examples.length} examples to validate.`);

    for (const example of examples) {
        log(`---------------------------------------------------`);
        log(`Validating example: ${example}`);
        const exampleDir = path.join(OUTPUT_BASE, example);

        try {
            // 1. Generate
            log(`  Generating...`);
            await createExample(example, exampleDir);

            // 2. Install dependencies
            // To speed this up in a dev environment, we could symlink node_modules, but for product validation we should install.
            log(`  Installing dependencies (this may take a while)...`);
            execSync('npm install', { cwd: exampleDir, stdio: 'ignore' });

            // 3. Compile
            log(`  Compiling...`);
            execSync('npm run compile', { cwd: exampleDir, stdio: 'pipe' });

            // 4. Test
            log(`  Testing...`);
            execSync('npm run test', { cwd: exampleDir, stdio: 'pipe' });

            log(`✅ ${example} passed`);
        } catch (e: any) {
            log(`❌ ${example} FAILED`);
            if (e.stdout) console.log(e.stdout.toString());
            if (e.stderr) console.error(e.stderr.toString());
            else console.error(e.message);
            failed++;
        }
    }

    log(`---------------------------------------------------`);
    if (failed > 0) {
        log(`❌ Validation failed. ${failed} examples failed.`);
        process.exit(1);
    } else {
        log(`✅ All examples passed validation!`);
        process.exit(0);
    }
}

if (process.argv[1] === __filename) {
    validateAll();
}

